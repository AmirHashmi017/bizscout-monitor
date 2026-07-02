import { ResponseModel } from '../responses/response.model';

export interface RollingStats {
  count: number;
  mean: number;
  stdDev: number;
  min: number;
  max: number;
  p95: number;
}

// Pure stats over a list of numbers. No IO, so unit tests stay fast and simple.
export function computeStats(values: number[]): RollingStats {
  if (values.length === 0) {
    return { count: 0, mean: 0, stdDev: 0, min: 0, max: 0, p95: 0 };
  }

  const count = values.length;
  const sum = values.reduce((a, b) => a + b, 0);
  const mean = sum / count;

  const variance = values.reduce((acc, v) => acc + (v - mean) ** 2, 0) / count;
  const stdDev = Math.sqrt(variance);

  const sorted = [...values].sort((a, b) => a - b);
  const p95Index = Math.min(sorted.length - 1, Math.ceil(0.95 * sorted.length) - 1);

  return {
    count,
    mean: Number(mean.toFixed(2)),
    stdDev: Number(stdDev.toFixed(2)),
    min: sorted[0],
    max: sorted[sorted.length - 1],
    p95: sorted[p95Index],
  };
}

// Standard score of a value. Returns 0 when stdDev is 0 to avoid divide by zero.
export function zScore(value: number, mean: number, stdDev: number): number {
  if (stdDev === 0) return 0;
  return (value - mean) / stdDev;
}

// Decide whether a response time looks abnormal.
// Two independent rules trip the flag:
//   1. Ratio rule: time rises above factor times the mean.
//   2. z-score rule: time sits far from the mean once enough samples exist.
// Require a minimum sample size so a cold start stays quiet.
export function isAnomalous(
  responseTimeMs: number,
  stats: RollingStats,
  factor: number,
  minSamples = 5,
): boolean {
  if (stats.count < minSamples || stats.mean === 0) return false;

  const ratioAnomaly = responseTimeMs > factor * stats.mean;
  const z = zScore(responseTimeMs, stats.mean, stats.stdDev);
  const zAnomaly = z > 3;

  return ratioAnomaly || zAnomaly;
}

// Load recent successful response times and compute stats. Default window is 24h.
export async function getRollingStats(windowMs = 24 * 60 * 60 * 1000): Promise<RollingStats> {
  const since = new Date(Date.now() - windowMs);
  const docs = await ResponseModel.find(
    { timestamp: { $gte: since }, success: true },
    { responseTimeMs: 1 },
  ).lean();

  return computeStats(docs.map((d) => d.responseTimeMs));
}
