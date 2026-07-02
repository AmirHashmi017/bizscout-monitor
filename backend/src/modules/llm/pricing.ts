
export interface ModelPricing {
  inputPerMillion: number;
  outputPerMillion: number;
}

const PRICING: Record<string, ModelPricing> = {

  'gemini-2.5-flash': { inputPerMillion: 0.3, outputPerMillion: 2.5 },
  'gemini-2.5-flash-lite': { inputPerMillion: 0.1, outputPerMillion: 0.4 },
  'gemini-2.5-pro': { inputPerMillion: 1.25, outputPerMillion: 10.0 },
};

const DEFAULT_PRICING: ModelPricing = { inputPerMillion: 0.3, outputPerMillion: 2.5 };

export function getPricing(model: string): ModelPricing {
  return PRICING[model] ?? DEFAULT_PRICING;
}

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

export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}
