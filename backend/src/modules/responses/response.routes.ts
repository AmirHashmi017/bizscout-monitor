import { Router } from 'express';
import { listResponsesHandler, getStatsHandler } from './response.controller';

// Routes for /api/responses.
export const responseRoutes = Router();

responseRoutes.get('/', listResponsesHandler);
responseRoutes.get('/stats', getStatsHandler);
