
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

export function cacheKey(query: string): string {
  return query.trim().toLowerCase().replace(/\s+/g, ' ');
}
