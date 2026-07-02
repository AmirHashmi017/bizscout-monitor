import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import { env } from './config/env';
import { logger } from './utils/logger';
import { notFound, errorHandler } from './middlewares/error-handler';
import { responseRoutes } from './modules/responses/response.routes';
import { incidentRoutes } from './modules/incidents/incident.routes';
import { chatRoutes } from './modules/chat/chat.routes';

// Build the Express app. Kept apart from server startup so tests import the app
// through supertest without opening a port or a DB connection.
export function createApp(): Application {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: env.corsOrigins }));
  app.use(express.json({ limit: '1mb' }));
  if (!env.isTest) {
    app.use(pinoHttp({ logger }));
  }

  app.get('/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', uptime: process.uptime() });
  });

  // Feature module routers.
  app.use('/api/responses', responseRoutes);
  app.use('/api/incidents', incidentRoutes);
  app.use('/api/chat', chatRoutes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
