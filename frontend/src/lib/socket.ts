import { io, Socket } from 'socket.io-client';
import { api } from './api';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(api.baseUrl, { transports: ['websocket', 'polling'] });
  }
  return socket;
}
