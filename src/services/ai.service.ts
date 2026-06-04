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

// Per-attempt hard timeout (ms). The primary model gets a tighter window so a slow/cold
// call fails over to the higher-quota flash-lite tier FAST instead of hanging on the
// browser's multi-minute fetch default. Fallback models get a longer window so they
// actually have room to finish. Tune `primary` down (e.g. 4000) to favour throughput over
// the primary model's prose quality — note a full resume JSON usually needs 6-15s on flash,
// so a very tight cap will fall through to flash-lite on nearly every call.
const MODEL_TIMEOUT_MS = { primary: 15000, fallback: 30000 };

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
  // NOTE: do NOT send frequencyPenalty/presencePenalty here. They are NOT enabled on the
  // Gemini free-tier Flash models — `gemini-2.5-flash` rejects them with a hard 400
  // ("Penalty is not enabled for models/gemini-2.5-flash", INVALID_ARGUMENT), which failed
  // EVERY schema generation on the primary model and forced the fallback every time. The
  // degenerate-repetition loop they were meant to fight is already handled downstream:
  // `isDegenerateRepetition` detects it and bails to the next model instead of escalating.
  ...(schema
    ? { responseMimeType: "application/json", responseSchema: schema }
    : {}),
});

// Detect the degenerate "repetition loop" failure: the model repeats the same phrase over and
// over into one field until it hits MAX_TOKENS. Such a response only gets LONGER (never valid) if
// we re-run the same model with a bigger cap, so we use this to skip the cap escalation and fall
// through to the next model instead — saving a wasted second call and free-tier quota.
// Heuristic: take an 80-char sample from ~40% into the (already long) output and count how many
// non-overlapping times it recurs. 4+ recurrences = a loop.
const isDegenerateRepetition = (text: string): boolean => {
  if (!text || text.length < 800) return false;
  const start = Math.floor(text.length * 0.4);
  const sample = text.slice(start, start + 80);
  if (sample.trim().length < 40) return false;
  let count = 0;
  let idx = 0;
  while ((idx = text.indexOf(sample, idx)) !== -1) {
    count++;
    idx += sample.length;
  }
  return count >= 4;
};

// Run a single generateContent call with a hard client-side timeout. An AbortController fires
// after `timeoutMs`, cancelling the in-flight request (the SDK accepts `config.abortSignal`) so
// we move to the next model instead of waiting on the browser's multi-minute fetch default.
// On timeout the thrown error is tagged `isTimeout` so the caller can fall through instantly
// without running the (slow) rate-limit wait path.
async function generateWithTimeout(
  ai: GoogleGenAI,
  model: string,
  prompt: string,
  config: any,
  timeoutMs: number
) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await ai.models.generateContent({
      model,
      contents: prompt,
      config: { ...config, abortSignal: controller.signal },
    });
  } catch (e: any) {
    if (controller.signal.aborted || e?.name === "AbortError" || /abort/i.test(e?.message || "")) {
      const err: any = new Error(`Model ${model} timed out after ${timeoutMs}ms.`);
      err.isTimeout = true;
      throw err;
    }
    throw e;
  } finally {
    clearTimeout(timer);
  }
}

export const aiService = {
  async generateWithFallback(prompt: string, schema?: any, maxOutputTokens?: number, thinkingBudget?: number): Promise<AIServiceResponse> {
    const apiKey = resolveApiKey();
    if (!apiKey) {
      throw new Error(MISSING_KEY_MESSAGE);
    }

    const ai = new GoogleGenAI({ apiKey });
    const baseCap = maxOutputTokens ?? (schema ? 16384 : 1024);
    let lastError: any;

    for (let mi = 0; mi < GEMINI_MODELS.length; mi++) {
      const model = GEMINI_MODELS[mi];
      // First model = quality tier on a tight timeout (fail over fast); later models get longer.
      const timeoutMs = mi === 0 ? MODEL_TIMEOUT_MS.primary : MODEL_TIMEOUT_MS.fallback;
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
          const result = await generateWithTimeout(ai, model, prompt, config, timeoutMs);

          // A MAX_TOKENS finish means the response was cut off mid-stream. For JSON (schema)
          // calls that leaves the payload unparseable, so don't return it as success.
          const finishReason = result?.candidates?.[0]?.finishReason;
          if (result?.text && !(schema && finishReason === "MAX_TOKENS")) {
            return { text: result.text, model };
          }

          if (finishReason === "MAX_TOKENS") {
            truncated = true;
            // If the truncation is a repetition loop, a bigger cap on the SAME model just produces a
            // longer loop and truncates again — don't re-call it. Bail to the next model, which (with
            // the frequency/presence penalties now in buildConfig) is far more likely to finish.
            if (isDegenerateRepetition(result?.text || "")) {
              console.warn(`Model ${model} fell into a repetition loop — skipping cap escalation, trying next model.`);
              break;
            }
            console.warn(`Model ${model} truncated (MAX_TOKENS) at ${caps[attempt]} output tokens.`);
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

        // Timed out (slow/cold call) — don't wait, fall through to the next model immediately.
        if (e?.isTimeout) {
          continue;
        }

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
              const retryResult = await generateWithTimeout(
                ai, model, prompt, buildConfig(schema, baseCap, thinkingBudget), timeoutMs
              );

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