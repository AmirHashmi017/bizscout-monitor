// Small in memory TTL cache for LLM answers (Option B requirement 4).
// Repeated questions skip the API and reuse a stored answer.
// Single instance only. Redis would replace this at scale.
interface Entry<T> {
  value: T;
  expiresAt: number;
}

export class TtlCache<T> {
  private readonly store = new Map<string, Entry<T>>();

  constructor(private readonly ttlMs: number) {}

  get(key: string, now: number = Date.now()): T | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (entry.expiresAt <= now) {
      this.store.delete(key);
      return undefined;
    }
    return entry.value;
  }

  set(key: string, value: T, now: number = Date.now()): void {
    this.store.set(key, { value, expiresAt: now + this.ttlMs });
  }

  get size(): number {
    return this.store.size;
  }

  clear(): void {
    this.store.clear();
  }
}

// Normalize a query so similar phrasings share one cache entry.
export function cacheKey(query: string): string {
  return query.trim().toLowerCase().replace(/\s+/g, ' ');
}
