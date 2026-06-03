import { GoogleGenAI } from "@google/genai";

// Only models served on the Gemini API *free tier* (verified against the
// official pricing/rate-limit docs, June 2026):
//   - gemini-2.5-pro / gemini-3.1-pro-preview are PAID-ONLY -> free limit is 0
//     (this is what caused the 429 "limit: 0, model: gemini-2.5-pro" error).
//   - gemini-2.0-flash / gemini-2.0-flash-lite were SHUT DOWN on 2026-06-01.
// Order = highest free-tier quota first, so we fall through to the most
// generous limits before giving up. Free quotas reset daily at midnight PT.
export const GEMINI_MODELS = [
  "gemini-2.5-flash",       // ~10 RPM / 250 RPD free, good quality
  "gemini-2.5-flash-lite",  // ~15 RPM / 1000 RPD free, highest free quota
  "gemini-3.5-flash"        // newest free Flash
];

export interface AIServiceResponse {
  text: string;
  model: string;
}

// ---------------------------------------------------------------------------
// API key resolution
// Users can bring their own Gemini API key via the UI (stored in localStorage).
// That always takes precedence; the build-time VITE_GEMINI_API_KEY is only a
// fallback so a self-hosted/owner deploy still works without per-user setup.
// ---------------------------------------------------------------------------
const USER_API_KEY_STORAGE = "gemini_api_key";

export const apiKeyStore = {
  get(): string | null {
    try {
      return localStorage.getItem(USER_API_KEY_STORAGE);
    } catch {
      return null;
    }
  },
  set(key: string): void {
    try {
      localStorage.setItem(USER_API_KEY_STORAGE, key.trim());
    } catch {
      /* storage unavailable (private mode) — ignore */
    }
  },
  clear(): void {
    try {
      localStorage.removeItem(USER_API_KEY_STORAGE);
    } catch {
      /* ignore */
    }
  },
  // True when *some* key is available (user-provided or env fallback).
  isConfigured(): boolean {
    return !!resolveApiKey();
  },
};

// User key first, then env fallback. Returns "" when nothing is configured.
function resolveApiKey(): string {
  const userKey = apiKeyStore.get();
  if (userKey && userKey.trim()) return userKey.trim();
  return (import.meta.env.VITE_GEMINI_API_KEY as string | undefined) || "";
}

const MISSING_KEY_MESSAGE =
  "No Gemini API key found. Click the key icon in the top bar to add your own key.";

// Build the per-call generation config.
// - thinkingBudget: 0 disables hidden reasoning (cheap/fast) — fine for short text and
//   the ATS analysis (which already reasons out loud in its markdown). Resume OPTIMIZE
//   passes a real budget so the model can run its full internal JD gap-analysis BEFORE
//   emitting JSON — that one-pass reasoning is what makes a second regeneration
//   unnecessary, so it nets out cheaper than score → apply-fixes → regenerate.
// - maxOutputTokens caps response length (structured resume needs more room than short text)
// - temperature: 0.4 keeps optimization output stable and on-spec
const buildConfig = (schema?: any, maxOutputTokens?: number, thinkingBudget: number = 0) => ({
  // Output cap. The recruiter-grade ATS analysis is large (defaults to 16384), but a
  // tailored 1.5-page resume with only 3-4 selected projects needs far less — callers
  // pass a tighter cap (e.g. 4096) to cut cost and discourage overflow. Short free
  // text defaults to 1024.
  maxOutputTokens: maxOutputTokens ?? (schema ? 16384 : 1024),
  temperature: 0.4,
  thinkingConfig: { thinkingBudget },
  ...(schema
    ? { responseMimeType: "application/json", responseSchema: schema }
    : {}),
});

export const aiService = {
  async generateWithFallback(prompt: string, schema?: any, maxOutputTokens?: number, thinkingBudget?: number): Promise<AIServiceResponse> {
    const apiKey = resolveApiKey();
    if (!apiKey) {
      throw new Error(MISSING_KEY_MESSAGE);
    }

    const ai = new GoogleGenAI({ apiKey });
    const baseCap = maxOutputTokens ?? (schema ? 16384 : 1024);
    let lastError: any;

    for (const model of GEMINI_MODELS) {
      try {
        // On a truncated (MAX_TOKENS) JSON response, retry the SAME model once with a
        // larger output budget before falling through. Newer "thinking" Flash models
        // (e.g. gemini-3.5-flash) can spend part of the budget on internal reasoning, so a
        // tight cap that fit the older models leaves no room to finish the JSON. We escalate
        // the cap rather than failing the whole flow.
        const caps = schema ? [baseCap, Math.min(baseCap * 4, 16384)] : [baseCap];
        let truncated = false;

        for (let attempt = 0; attempt < caps.length; attempt++) {
          const config = buildConfig(schema, caps[attempt], thinkingBudget);
          const result = await ai.models.generateContent({
            model,
            contents: prompt,
            config,
          });

          // A MAX_TOKENS finish means the response was cut off mid-stream. For JSON (schema)
          // calls that leaves the payload unparseable, so don't return it as success.
          const finishReason = result?.candidates?.[0]?.finishReason;
          if (result?.text && !(schema && finishReason === "MAX_TOKENS")) {
            return { text: result.text, model };
          }

          if (finishReason === "MAX_TOKENS") {
            console.warn(`Model ${model} truncated (MAX_TOKENS) at ${caps[attempt]} output tokens.`);
            truncated = true;
            continue; // retry the same model with the next (larger) cap, if any remain
          }

          break; // empty/blocked response that isn't truncation — move to the next model
        }

        if (truncated) {
          lastError = new Error(
            `Model ${model} hit the output token limit before completing the JSON (response truncated). Try a shorter Job Description or fewer projects.`
          );
        }
        continue; // next model
      } catch (e: any) {
        console.warn(`Model ${model} failed:`, e?.message || e);
        lastError = e;

        // skip invalid or unavailable models / permissions
        if (
          e?.message?.includes("PERMISSION_DENIED") ||
          e?.message?.includes("404") ||
          e?.message?.includes("not found")
        ) {
          continue;
        }

        // rate limit retry
        if (
          e?.message?.includes("429") ||
          e?.message?.includes("Quota exceeded")
        ) {
          const match = e.message.match(/retry in (\d+(\.\d+)?)s/i);
          const waitSeconds = match ? parseFloat(match[1]) + 2 : 10;

          if (waitSeconds <= 60) {
            await new Promise((resolve) => setTimeout(resolve, waitSeconds * 1000));

            try {
              const retryResult = await ai.models.generateContent({
                model,
                contents: prompt,
                config: buildConfig(schema, baseCap, thinkingBudget),
              });

              if (retryResult?.text) {
                return {
                  text: retryResult.text,
                  model,
                };
              }
            } catch (retryError: any) {
              lastError = retryError;
            }
          }

          continue;
        }
      }
    }

    throw lastError || new Error("All AI models failed to respond.");
  },

  async checkAvailableModels(): Promise<string[]> {
    const apiKey = resolveApiKey();
    if (!apiKey) throw new Error(MISSING_KEY_MESSAGE);

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
    );
    const data = await response.json();

    if (data.error) {
      throw new Error(data.error.message || "API Error");
    }

    return data.models?.map((m: any) => m.name.replace("models/", "")) || [];
  },
};