import { Server as HttpServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import { env } from '../config/env';
import { logger } from '../utils/logger';
import { eventBus } from '../utils/event-bus';

// Wire the event bus to Socket.IO.
// New samples and incidents reach every connected dashboard in real time
// (core requirement 4 plus Option B incidents).
export function initSockets(httpServer: HttpServer): SocketServer {
  const io = new SocketServer(httpServer, {
    cors: { origin: env.corsOrigins, methods: ['GET', 'POST'] },
  });

  io.on('connection', (socket) => {
    logger.debug({ id: socket.id }, 'Client connected');
    socket.on('disconnect', () => logger.debug({ id: socket.id }, 'Client disconnected'));
  });

  // Forward domain events to all clients.
  eventBus.on('response:new', (doc) => io.emit('response:new', doc));
  eventBus.on('incident:new', (doc) => io.emit('incident:new', doc));

  return io;
}
