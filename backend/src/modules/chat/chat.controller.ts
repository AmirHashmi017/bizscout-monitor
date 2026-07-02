import { Request, Response } from 'express';
import { env } from '../../config/env';
import { chatBodySchema } from './chat.validation';
import { answerQuestion } from './chat.service';
import { costTracker } from '../llm/cost-tracker';
import { rateLimiter, isLlmEnabled } from '../llm/llm.client';

export async function chatHandler(req: Request, res: Response): Promise<Response> {
  const parsed = chatBodySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid body', details: parsed.error.issues });
  }
  const result = await answerQuestion(parsed.data.question);
  return res.json(result);
}

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
