import { z } from 'zod';

export const chatBodySchema = z.object({
  question: z.string().min(1).max(1000),
});

export type ChatBody = z.infer<typeof chatBodySchema>;
