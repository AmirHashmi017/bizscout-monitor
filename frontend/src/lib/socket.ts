import { io, Socket } from 'socket.io-client';
import { api } from './api';

let socket: Socket | null = null;

// One shared Socket.IO connection for live monitoring and incident events.
export function getSocket(): Socket {
  if (!socket) {
    socket = io(api.baseUrl, { transports: ['websocket', 'polling'] });
  }
  return socket;
}
