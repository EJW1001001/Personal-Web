import { io, Socket } from 'socket.io-client';
import { BACKEND_HTTP_URL } from '../config/backend';

// Lazy connection: only connect when something actually needs the socket
export const socket: Socket = io(BACKEND_HTTP_URL, {
  autoConnect: false,
});

/** Call once to ensure socket is connected (idempotent) */
export function ensureSocketConnected() {
  if (!socket.connected) {
    socket.connect();
  }
}

socket.on('connect_error', (err) => {
  console.error('[SOCKET] Connection error:', err.message);
});
