import { computeStats, zScore, isAnomalous } from './stats.service';

// Core component tests: the anomaly detection stats.
// Everything downstream (flags, incidents, alerts) depends on these being right.
// Pure functions, so the full decision surface stays easy to cover.
describe('computeStats', () => {
  it('returns zeros for an empty sample', () => {
    expect(computeStats([])).toEqual({
      count: 0,
      mean: 0,
      stdDev: 0,
      min: 0,
      max: 0,
      p95: 0,
    });
  });

  it('computes mean, stdDev, min, max for a known set', () => {
    // Textbook set: mean 5, population stdDev 2.
    const stats = computeStats([2, 4, 4, 4, 5, 5, 7, 9]);
    expect(stats.mean).toBe(5);
    expect(stats.stdDev).toBe(2);
    expect(stats.min).toBe(2);
    expect(stats.max).toBe(9);
    expect(stats.count).toBe(8);
  });

  it('handles a single value (stdDev 0)', () => {
    const stats = computeStats([100]);
    expect(stats.mean).toBe(100);
    expect(stats.stdDev).toBe(0);
    expect(stats.p95).toBe(100);
  });

  it('computes p95 at the correct index', () => {
    const values = Array.from({ length: 100 }, (_, i) => i + 1);
    expect(computeStats(values).p95).toBe(95);
  });

  it('is order-independent', () => {
    const a = computeStats([1, 2, 3, 4, 5]);
    const b = computeStats([5, 3, 1, 4, 2]);
    expect(a).toEqual(b);
  });
});

describe('zScore', () => {
  it('returns 0 when stdDev is 0 (no divide-by-zero)', () => {
    expect(zScore(500, 100, 0)).toBe(0);
  });

  it('computes a positive z-score above the mean', () => {
    expect(zScore(130, 100, 10)).toBe(3);
  });

  it('computes a negative z-score below the mean', () => {
    expect(zScore(70, 100, 10)).toBe(-3);
  });
});

describe('isAnomalous', () => {
  const stats = { count: 20, mean: 100, stdDev: 10, min: 80, max: 130, p95: 125 };

  it('does not flag before the minimum sample size (cold start)', () => {
    const cold = { ...stats, count: 3 };
    expect(isAnomalous(10_000, cold, 2)).toBe(false);
  });

  it('does not flag when mean is 0', () => {
    const zeroMean = { ...stats, mean: 0 };
    expect(isAnomalous(500, zeroMean, 2)).toBe(false);
  });

  it('flags via the ratio rule when responseTime > factor * mean', () => {
    // factor 2, mean 100, so threshold 200.
    expect(isAnomalous(201, stats, 2)).toBe(true);
  });

  it('does not flag a value below both thresholds', () => {
    // 120: below the 200 ratio, and z = 2, below the z-score cutoff of 3.
    expect(isAnomalous(120, stats, 2)).toBe(false);
  });

  it('flags via the z-score rule even when under the ratio threshold', () => {
    // 150: below the 200 ratio, but z = 5, above the cutoff of 3.
    expect(isAnomalous(150, stats, 2)).toBe(true);
  });

  it('respects a custom minSamples threshold', () => {
    const few = { ...stats, count: 8 };
    expect(isAnomalous(500, few, 2, 10)).toBe(false);
    expect(isAnomalous(500, few, 2, 5)).toBe(true);
  });
});
