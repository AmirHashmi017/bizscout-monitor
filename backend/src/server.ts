import { createServer } from 'http';
import { env } from './config/env';
import { logger } from './utils/logger';
import { connectDatabase, disconnectDatabase } from './config/database';
import { createApp } from './app';
import { initSockets } from './sockets/socket.service';
import { startScheduler, stopScheduler } from './modules/monitoring/scheduler';

async function main(): Promise<void> {
  await connectDatabase();

  const app = createApp();
  const httpServer = createServer(app);
  initSockets(httpServer);

  httpServer.listen(env.port, () => {
    logger.info({ port: env.port, env: env.nodeEnv }, 'Server listening');
    startScheduler();
  });

  const shutdown = async (signal: string): Promise<void> => {
    logger.info({ signal }, 'Shutting down');
    stopScheduler();
    httpServer.close();
    await disconnectDatabase();
    process.exit(0);
  };

  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));
}

main().catch((err) => {
  logger.error({ err }, 'Fatal startup error');
  process.exit(1);
});
