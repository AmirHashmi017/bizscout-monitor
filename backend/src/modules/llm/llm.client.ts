import { GoogleGenAI } from '@google/genai';
import { env } from '../../config/env';
import { logger } from '../../utils/logger';
import { RateLimiter } from './rate-limiter';
import { costTracker } from './cost-tracker';

// Gemini wrapper. Owns the shared cost guardrails (Option B requirement 4):
//   - one rate limiter for every LLM feature,
//   - usage and cost tracking,
//   - a single enabled check.
// Callers get a small surface and never touch the SDK directly.

// Shared limiter across every LLM feature.
export const rateLimiter = new RateLimiter(env.llm.maxCallsPerHour);

// Null when no key is set, so the app runs fully without AI.
const client: GoogleGenAI | null = env.llm.enabled
  ? new GoogleGenAI({ apiKey: env.llm.apiKey })
  : null;

export function isLlmEnabled(): boolean {
  return client !== null;
}

export interface CompletionResult {
  text: string;
  inputTokens: number;
  outputTokens: number;
}

export type BlockedReason = 'disabled' | 'rate_limited';

// Tell callers why a call is blocked, or null when the call is allowed.
export function checkAvailability(): BlockedReason | null {
  if (!client) return 'disabled';
  if (!rateLimiter.canProceed()) return 'rate_limited';
  return null;
}

// One shot completion. Uses one quota unit and records cost.
// Throws when disabled or over quota, so callers check availability first.
export async function complete(
  systemInstruction: string,
  userMessage: string,
  maxOutputTokens = 1024,
): Promise<CompletionResult> {
  if (!client) throw new Error('LLM disabled: GEMINI_API_KEY not set');
  if (!rateLimiter.tryConsume()) throw new Error('LLM rate limit exceeded');

  const response = await client.models.generateContent({
    model: env.llm.model,
    contents: userMessage,
    config: {
      systemInstruction,
      maxOutputTokens,
      // Disable thinking tokens for lower cost and latency.
      thinkingConfig: { thinkingBudget: 0 },
    },
  });

  const usage = response.usageMetadata;
  const inputTokens = usage?.promptTokenCount ?? 0;
  const outputTokens = usage?.candidatesTokenCount ?? 0;
  costTracker.recordCall(env.llm.model, inputTokens, outputTokens);

  const text = response.text ?? '';

  logger.debug({ inputTokens, outputTokens }, 'LLM completion');

  return { text, inputTokens, outputTokens };
}
