import mongoose from 'mongoose';
import { env } from './env';
import { logger } from '../utils/logger';

// MongoDB connection helpers. Log lifecycle events for easier debugging.
export async function connectDatabase(uri: string = env.mongoUri): Promise<void> {
  mongoose.connection.on('connected', () => logger.info('MongoDB connected'));
  mongoose.connection.on('error', (err) => logger.error({ err }, 'MongoDB error'));
  mongoose.connection.on('disconnected', () => logger.warn('MongoDB disconnected'));

  // Give up after 10s when the server stays unreachable.
  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 10_000,
  });
}

export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect();
  logger.info('MongoDB connection closed');
}
