import { Router } from 'express';
import { listResponsesHandler, getStatsHandler } from './response.controller';

export const responseRoutes = Router();

responseRoutes.get('/', listResponsesHandler);
responseRoutes.get('/stats', getStatsHandler);
