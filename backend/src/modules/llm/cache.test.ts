import { TtlCache, cacheKey } from './cache';

describe('TtlCache', () => {
  it('stores and retrieves a value', () => {
    const cache = new TtlCache<string>(1000);
    cache.set('k', 'v', 0);
    expect(cache.get('k', 0)).toBe('v');
  });

  it('returns undefined for a missing key', () => {
    const cache = new TtlCache<string>(1000);
    expect(cache.get('missing', 0)).toBeUndefined();
  });

  it('expires entries after the TTL', () => {
    const cache = new TtlCache<string>(1000);
    cache.set('k', 'v', 0);
    expect(cache.get('k', 999)).toBe('v');
    expect(cache.get('k', 1000)).toBeUndefined();
  });

  it('evicts expired entries from the store on read', () => {
    const cache = new TtlCache<string>(1000);
    cache.set('k', 'v', 0);
    cache.get('k', 2000);
    expect(cache.size).toBe(0);
  });
});

describe('cacheKey', () => {
  it('normalizes case and whitespace so similar phrasings collide', () => {
    expect(cacheKey('  What Were the SLOWEST   responses? ')).toBe(
      'what were the slowest responses?',
    );
  });

  it('produces different keys for genuinely different questions', () => {
    expect(cacheKey('slowest today')).not.toBe(cacheKey('fastest today'));
  });
});
