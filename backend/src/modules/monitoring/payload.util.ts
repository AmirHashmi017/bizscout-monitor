// Builds a random JSON payload for each ping.
// Varied shape and size give the Option B features realistic data to work with.

const EVENT_TYPES = ['page_view', 'click', 'purchase', 'signup', 'error', 'search'] as const;
const REGIONS = ['us-east', 'us-west', 'eu-central', 'ap-south', 'sa-east'] as const;
const TIERS = ['free', 'pro', 'enterprise'] as const;

function randomItem<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export interface MonitoringPayload {
  eventType: string;
  userId: string;
  region: string;
  tier: string;
  sessionId: string;
  metrics: {
    durationMs: number;
    itemsProcessed: number;
    score: number;
  };
  tags: string[];
  nested: Record<string, unknown>;
  generatedAt: string;
}

export function generatePayload(): MonitoringPayload {
  // Pick one to three random tags from the pool.
  const tagPool = ['beta', 'mobile', 'desktop', 'cached', 'retry', 'priority'];
  const shuffled = [...tagPool].sort(() => Math.random() - 0.5);

  return {
    eventType: randomItem(EVENT_TYPES),
    userId: `user_${randomInt(1000, 9999)}`,
    region: randomItem(REGIONS),
    tier: randomItem(TIERS),
    sessionId: Math.random().toString(36).slice(2, 12),
    metrics: {
      durationMs: randomInt(10, 5000),
      itemsProcessed: randomInt(0, 500),
      score: Number((Math.random() * 100).toFixed(2)),
    },
    tags: shuffled.slice(0, randomInt(1, 3)),
    nested: {
      experiment: randomItem(['A', 'B', 'control']),
      flags: {
        featureX: Math.random() > 0.5,
        featureY: Math.random() > 0.5,
      },
    },
    generatedAt: new Date().toISOString(),
  };
}
