// Sliding window rate limiter for LLM calls (Option B requirement 4).
// Enforces max N calls per hour. In memory, so single instance only.
// Redis would replace this for a multi instance deployment.
export class RateLimiter {
  private readonly timestamps: number[] = [];

  constructor(
    private readonly maxCalls: number,
    private readonly windowMs: number = 60 * 60 * 1000,
  ) {}

  // Drop timestamps older than the window.
  private prune(now: number): void {
    const cutoff = now - this.windowMs;
    while (this.timestamps.length > 0 && this.timestamps[0] < cutoff) {
      this.timestamps.shift();
    }
  }

  // True when a call fits without using quota.
  canProceed(now: number = Date.now()): boolean {
    this.prune(now);
    return this.timestamps.length < this.maxCalls;
  }

  // Record a call. Returns false when the limit is reached.
  tryConsume(now: number = Date.now()): boolean {
    this.prune(now);
    if (this.timestamps.length >= this.maxCalls) return false;
    this.timestamps.push(now);
    return true;
  }

  // Calls left in the current window.
  remaining(now: number = Date.now()): number {
    this.prune(now);
    return Math.max(0, this.maxCalls - this.timestamps.length);
  }

  // Epoch ms when the next slot frees up, or null when quota is free.
  resetsAt(now: number = Date.now()): number | null {
    this.prune(now);
    if (this.timestamps.length < this.maxCalls) return null;
    return this.timestamps[0] + this.windowMs;
  }
}
