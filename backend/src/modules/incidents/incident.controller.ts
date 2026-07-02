import { Request, Response } from 'express';
import { z } from 'zod';
import { listIncidents } from './incident.service';

const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

// GET /api/incidents. Paginated incident reports for the Incidents tab.
export async function listIncidentsHandler(req: Request, res: Response): Promise<Response> {
  const parsed = listQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid query', details: parsed.error.issues });
  }
  const result = await listIncidents(parsed.data.page, parsed.data.limit);
  return res.json(result);
}
