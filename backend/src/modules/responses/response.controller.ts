import { Request, Response } from 'express';
import { listResponsesQuerySchema } from './response.validation';
import { listResponses, getStats } from './response.service';

export async function listResponsesHandler(req: Request, res: Response): Promise<Response> {
  const parsed = listResponsesQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid query', details: parsed.error.issues });
  }
  const result = await listResponses(parsed.data);
  return res.json(result);
}

export async function getStatsHandler(_req: Request, res: Response): Promise<Response> {
  const stats = await getStats();
  return res.json(stats);
}
