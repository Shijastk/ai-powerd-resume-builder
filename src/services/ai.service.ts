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
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("API Key is missing! Please check your .env file.");
    }

    const ai = new GoogleGenAI({ apiKey });
    const config = buildConfig(schema, maxOutputTokens, thinkingBudget);
    let lastError: any;

    for (const model of GEMINI_MODELS) {
      try {
        const result = await ai.models.generateContent({
          model,
          contents: prompt,
          config,
        });

        if (result?.text) {
          return {
            text: result.text,
            model,
          };
        }
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
                config,
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
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) throw new Error("API Key missing!");

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