import pino from 'pino';
import { env } from '../config/env';

// App logger. Pretty output in dev, JSON in production, silent during tests.
export const logger = pino({
  level: env.isTest ? 'silent' : env.isProduction ? 'info' : 'debug',
  transport: env.isProduction
    ? undefined
    : {
        target: 'pino-pretty',
        options: { colorize: true, translateTime: 'SYS:HH:MM:ss', ignore: 'pid,hostname' },
      },
});
