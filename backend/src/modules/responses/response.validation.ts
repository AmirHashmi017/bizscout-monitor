import { z } from 'zod';

// Query rules for GET /api/responses.
export const listResponsesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  anomaliesOnly: z
    .enum(['true', 'false'])
    .optional()
    .transform((v) => v === 'true'),
});

export type ListResponsesQuery = z.infer<typeof listResponsesQuerySchema>;
