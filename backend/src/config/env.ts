import dotenv from 'dotenv';

dotenv.config();

// Central environment config. Reads process.env once and exposes typed values.

// Read a required string. Throws at boot when the value is missing.
function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined || value === '') {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

// Read a numeric value. Throws when the input is not a number.
function number(name: string, fallback: number): number {
  const raw = process.env[name];
  if (raw === undefined || raw === '') return fallback;
  const parsed = Number(raw);
  if (Number.isNaN(parsed)) {
    throw new Error(`Environment variable ${name} must be a number, got "${raw}"`);
  }
  return parsed;
}

// Read a boolean flag. Accepts the string "true".
function bool(name: string, fallback: boolean): boolean {
  const raw = process.env[name];
  if (raw === undefined || raw === '') return fallback;
  return raw.toLowerCase() === 'true';
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  isProduction: process.env.NODE_ENV === 'production',
  isTest: process.env.NODE_ENV === 'test',

  port: number('PORT', 4000),
  // Split the comma separated origins into a clean array.
  corsOrigins: (process.env.CORS_ORIGINS ?? 'http://localhost:3000')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean),

  mongoUri: required('MONGODB_URI', 'mongodb://localhost:27017/bizscout'),

  // httpbin monitoring settings.
  monitor: {
    targetUrl: process.env.MONITOR_TARGET_URL ?? 'https://httpbin.org/anything',
    intervalMs: number('MONITOR_INTERVAL_MS', 5 * 60 * 1000),
    runOnStart: bool('MONITOR_RUN_ON_START', true),
  },

  // Flag a response when its time rises above factor times the rolling average.
  anomalyFactor: number('ANOMALY_FACTOR', 2),

  // Google Gemini settings. An empty key disables the AI features.
  llm: {
    apiKey: process.env.GEMINI_API_KEY ?? '',
    model: process.env.LLM_MODEL ?? 'gemini-2.5-flash',
    maxCallsPerHour: number('LLM_MAX_CALLS_PER_HOUR', 20),
    cacheTtlMs: number('LLM_CACHE_TTL_MS', 10 * 60 * 1000),
    // True when a Gemini key is present.
    get enabled(): boolean {
      return Boolean(process.env.GEMINI_API_KEY);
    },
  },
} as const;
