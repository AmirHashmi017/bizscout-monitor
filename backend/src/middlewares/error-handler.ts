import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

// 404 handler for routes with no match.
export function notFound(_req: Request, res: Response): void {
  res.status(404).json({ error: 'Not found' });
}

// Central error handler. Logs the failure and returns a safe response.
// Express needs the four argument signature to treat this as error middleware.
export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void {
  logger.error({ err }, 'Unhandled request error');
  res.status(500).json({ error: 'Internal server error' });
}
