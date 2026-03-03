function resolveModel(envKey: string, fallback: string): string {
  const value = process.env[envKey];
  if (!value) return fallback;
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : fallback;
}

export const CONTENT_MODELS = {
  relevance: resolveModel("CONTENT_MODEL_RELEVANCE", "gemini-2.5-flash"),
  extractor: resolveModel("CONTENT_MODEL_EXTRACTOR", "gemini-2.5-flash"),
  generator: resolveModel("CONTENT_MODEL_GENERATOR", "gemini-3-flash-preview"),
  critic: resolveModel("CONTENT_MODEL_CRITIC", "gemini-2.0-flash"),
} as const;

