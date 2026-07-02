import { RateLimiter } from './rate-limiter';

describe('RateLimiter', () => {
  it('allows up to maxCalls within the window', () => {
    const rl = new RateLimiter(3, 1000);
    expect(rl.tryConsume(0)).toBe(true);
    expect(rl.tryConsume(0)).toBe(true);
    expect(rl.tryConsume(0)).toBe(true);
    expect(rl.tryConsume(0)).toBe(false);
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
    expect(rl.tryConsume(600)).toBe(false);

    expect(rl.tryConsume(1001)).toBe(true);
  });

  it('canProceed does not consume quota', () => {
    const rl = new RateLimiter(1, 1000);
    expect(rl.canProceed(0)).toBe(true);
    expect(rl.canProceed(0)).toBe(true);
    rl.tryConsume(0);
    expect(rl.canProceed(0)).toBe(false);
  });

  it('reports when the quota resets', () => {
    const rl = new RateLimiter(1, 1000);
    expect(rl.resetsAt(0)).toBeNull();
    rl.tryConsume(0);
    expect(rl.resetsAt(0)).toBe(1000);
  });
});
