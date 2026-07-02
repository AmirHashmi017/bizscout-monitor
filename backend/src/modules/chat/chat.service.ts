import { env } from '../../config/env';
import { logger } from '../../utils/logger';
import { checkAvailability, complete, rateLimiter } from '../llm/llm.client';
import { TtlCache, cacheKey } from '../llm/cache';
import { costTracker } from '../llm/cost-tracker';
import { estimateTokens } from '../llm/pricing';
import { buildQueryContext } from './chat.context';
import type { ChatResult } from './chat.dto';

// Natural language query interface (Option B requirement 1).
// Pipeline: cache check, availability check, build grounded context, call Gemini, cache.
// Exercises every cost guardrail from requirement 4.
const answerCache = new TtlCache<string>(env.llm.cacheTtlMs);

const SYSTEM_PROMPT = `You are a monitoring analyst assistant for an HTTP uptime dashboard.
Answer the user's question using ONLY the provided monitoring data context.
Be concise and specific. Cite concrete numbers and timestamps from the context.
If the context doesn't contain the answer, say so plainly.`;

export async function answerQuestion(question: string): Promise<ChatResult> {
  const key = cacheKey(question);

  // 1. Cache check avoids spending quota on repeated questions.
  const cached = answerCache.get(key);
  if (cached !== undefined) {
    costTracker.recordCacheHit();
    return { answer: cached, source: 'cache', remainingCalls: rateLimiter.remaining() };
  }

  // 2. Availability and quota guards with a friendly fallback.
  const blocked = checkAvailability();
  if (blocked === 'disabled') {
    return {
      answer:
        'The AI assistant is not configured (no API key). ' +
        'You can still view all metrics, history, and incidents in the dashboard.',
      source: 'fallback',
      remainingCalls: 0,
    };
  }
  if (blocked === 'rate_limited') {
    const resetsAt = rateLimiter.resetsAt();
    return {
      answer:
        'The hourly AI query limit has been reached to control costs. ' +
        (resetsAt ? `Please try again after ${new Date(resetsAt).toLocaleTimeString()}.` : ''),
      source: 'fallback',
      remainingCalls: 0,
    };
  }

  // 3. Build the grounded context and preview the input token count.
  const context = await buildQueryContext();
  const userMessage = `Monitoring data context:\n${context}\n\nQuestion: ${question}`;
  const estimatedInputTokens = estimateTokens(SYSTEM_PROMPT + userMessage);

  try {
    const { text } = await complete(SYSTEM_PROMPT, userMessage, 700);
    answerCache.set(key, text);
    return { answer: text, source: 'llm', estimatedInputTokens, remainingCalls: rateLimiter.remaining() };
  } catch (err) {
    logger.error({ err }, 'Chat completion failed');
    return {
      answer: 'Sorry, the AI assistant encountered an error. Please try again shortly.',
      source: 'fallback',
      remainingCalls: rateLimiter.remaining(),
    };
  }
}
