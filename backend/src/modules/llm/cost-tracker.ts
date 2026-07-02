import { computeCost } from './pricing';

export interface CostSnapshot {
  totalCalls: number;
  cachedHits: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalCostUsd: number;
}

class CostTracker {
  private totalCalls = 0;
  private cachedHits = 0;
  private totalInputTokens = 0;
  private totalOutputTokens = 0;
  private totalCostUsd = 0;

  recordCall(model: string, inputTokens: number, outputTokens: number): void {
    this.totalCalls += 1;
    this.totalInputTokens += inputTokens;
    this.totalOutputTokens += outputTokens;
    this.totalCostUsd += computeCost(model, inputTokens, outputTokens);
  }

  recordCacheHit(): void {
    this.cachedHits += 1;
  }

  snapshot(): CostSnapshot {
    return {
      totalCalls: this.totalCalls,
      cachedHits: this.cachedHits,
      totalInputTokens: this.totalInputTokens,
      totalOutputTokens: this.totalOutputTokens,
      totalCostUsd: Number(this.totalCostUsd.toFixed(6)),
    };
  }
}

export const costTracker = new CostTracker();
