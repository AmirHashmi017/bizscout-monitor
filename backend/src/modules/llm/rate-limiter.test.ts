import { RateLimiter } from './rate-limiter';

// Core component tests: the LLM rate limiter, the main cost guardrail
// (Option B requirement 4, flagged Critical). Time is passed by hand, so the
// sliding window is tested without real waiting.
describe('RateLimiter', () => {
  it('allows up to maxCalls within the window', () => {
    const rl = new RateLimiter(3, 1000);
    expect(rl.tryConsume(0)).toBe(true);
    expect(rl.tryConsume(0)).toBe(true);
    expect(rl.tryConsume(0)).toBe(true);
    expect(rl.tryConsume(0)).toBe(false); // fourth call blocked
  });

  it('reports remaining quota accurately', () => {
    const rl = new RateLimiter(2, 1000);
    expect(rl.remaining(0)).toBe(2);
    rl.tryConsume(0);
    expect(rl.remaining(0)).toBe(1);
    rl.tryConsume(0);
    expect(rl.remaining(0)).toBe(0);
  });

  it('frees quota once calls slide out of the window', () => {
    const rl = new RateLimiter(2, 1000);
    rl.tryConsume(0);
    rl.tryConsume(500);
    expect(rl.tryConsume(600)).toBe(false); // both still inside the window
    // At t=1001 the first call (t=0) has expired.
    expect(rl.tryConsume(1001)).toBe(true);
  });

  it('canProceed does not consume quota', () => {
    const rl = new RateLimiter(1, 1000);
    expect(rl.canProceed(0)).toBe(true);
    expect(rl.canProceed(0)).toBe(true); // still true, nothing consumed
    rl.tryConsume(0);
    expect(rl.canProceed(0)).toBe(false);
  });

  it('reports when the quota resets', () => {
    const rl = new RateLimiter(1, 1000);
    expect(rl.resetsAt(0)).toBeNull(); // quota free
    rl.tryConsume(0);
    expect(rl.resetsAt(0)).toBe(1000); // first call at t=0 frees at t=1000
  });
});
