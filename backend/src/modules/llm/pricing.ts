// Gemini pricing in USD per 1M tokens, plus cost and token helpers.
export interface ModelPricing {
  inputPerMillion: number;
  outputPerMillion: number;
}

const PRICING: Record<string, ModelPricing> = {
  'gemini-2.5-flash': { inputPerMillion: 0.3, outputPerMillion: 2.5 },
  'gemini-2.5-flash-lite': { inputPerMillion: 0.1, outputPerMillion: 0.4 },
  'gemini-2.5-pro': { inputPerMillion: 1.25, outputPerMillion: 10.0 },
};

// Fallback pricing when the model is missing from the table. Assume Flash tier.
const DEFAULT_PRICING: ModelPricing = { inputPerMillion: 0.3, outputPerMillion: 2.5 };

export function getPricing(model: string): ModelPricing {
  return PRICING[model] ?? DEFAULT_PRICING;
}

// USD cost for a given token usage on a model.
export function computeCost(
  model: string,
  inputTokens: number,
  outputTokens: number,
): number {
  const p = getPricing(model);
  return (
    (inputTokens / 1_000_000) * p.inputPerMillion +
    (outputTokens / 1_000_000) * p.outputPerMillion
  );
}

// Rough token estimate (~4 chars per token) for a pre call cost preview.
// Real accounting uses the usage the API returns.
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}
