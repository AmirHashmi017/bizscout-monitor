
export class RateLimiter {
  private readonly timestamps: number[] = [];

  constructor(
    private readonly maxCalls: number,
    private readonly windowMs: number = 60 * 60 * 1000,
  ) {}

  private prune(now: number): void {
    const cutoff = now - this.windowMs;
    while (this.timestamps.length > 0 && this.timestamps[0] < cutoff) {
      this.timestamps.shift();
    }
  }

  canProceed(now: number = Date.now()): boolean {
    this.prune(now);
    return this.timestamps.length < this.maxCalls;
  }

  tryConsume(now: number = Date.now()): boolean {
    this.prune(now);
    if (this.timestamps.length >= this.maxCalls) return false;
    this.timestamps.push(now);
    return true;
  }

  remaining(now: number = Date.now()): number {
    this.prune(now);
    return Math.max(0, this.maxCalls - this.timestamps.length);
  }

  resetsAt(now: number = Date.now()): number | null {
    this.prune(now);
    if (this.timestamps.length < this.maxCalls) return null;
    return this.timestamps[0] + this.windowMs;
  }
}
