# Model Optimization Update

## Change
Switched primary AI model to **`gemini-3-flash-preview`**.

## Why?
- **Speed**: This experimental model is optimized for lower latency.
- **Performance**: Should reduce generation time significantly.

## Fallback Strategy
If `gemini-3-flash-preview` is unavailable or confusing (since it's a preview model), the system will automatically fall back to:
1. `gemini-2.0-flash` (Fast, stable)
2. `gemini-1.5-flash` (Very stable)
3. `gemini-1.5-pro` (High quality, slower)
4. `gemini-pro` (Legacy stable)

## Notes
- No code logic changed.
- No prompt changes.
- Just prioritization of the model list.
