import { Request, Response } from 'express';
import { env } from '../../config/env';
import { chatBodySchema } from './chat.validation';
import { answerQuestion } from './chat.service';
import { costTracker } from '../llm/cost-tracker';
import { rateLimiter, isLlmEnabled } from '../llm/llm.client';

// POST /api/chat. Natural language query interface (Option B requirement 1).
export async function chatHandler(req: Request, res: Response): Promise<Response> {
  const parsed = chatBodySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid body', details: parsed.error.issues });
  }
  const result = await answerQuestion(parsed.data.question);
  return res.json(result);
}

// GET /api/chat/cost. Cost and quota snapshot for the dashboard badge.
export function costHandler(_req: Request, res: Response): Response {
  return res.json({
    enabled: isLlmEnabled(),
    provider: 'gemini',
    model: env.llm.model,
    maxCallsPerHour: env.llm.maxCallsPerHour,
    remainingCalls: rateLimiter.remaining(),
    ...costTracker.snapshot(),
  });
}
