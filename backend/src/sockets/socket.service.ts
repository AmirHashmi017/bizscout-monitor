import { Server as HttpServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import { env } from '../config/env';
import { logger } from '../utils/logger';
import { eventBus } from '../utils/event-bus';

export function initSockets(httpServer: HttpServer): SocketServer {
  const io = new SocketServer(httpServer, {
    cors: { origin: env.corsOrigins, methods: ['GET', 'POST'] },
  });

  io.on('connection', (socket) => {
    logger.debug({ id: socket.id }, 'Client connected');
    socket.on('disconnect', () => logger.debug({ id: socket.id }, 'Client disconnected'));
  });

  eventBus.on('response:new', (doc) => io.emit('response:new', doc));
  eventBus.on('incident:new', (doc) => io.emit('incident:new', doc));

  return io;
}
