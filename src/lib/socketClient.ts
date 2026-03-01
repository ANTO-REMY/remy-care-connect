/**
 * socketClient.ts
 * ───────────────
 * Singleton Socket.IO client for the RemyCareConnect frontend.
 *
 * Usage
 * ─────
 *   import { getSocket, disconnectSocket } from '@/lib/socketClient';
 *
 *   const socket = getSocket();           // connects lazily on first call
 *   socket.on('checkin:new', handler);
 *   disconnectSocket();                  // call on logout
 */

import { io, Socket } from 'socket.io-client';

const SOCKET_URL =
  (import.meta as any).env?.VITE_WS_URL ||
  (import.meta as any).env?.VITE_API_URL?.replace('/api/v1', '') ||
  'http://localhost:5001';

let _socket: Socket | null = null;

/**
 * Returns the shared Socket.IO instance, creating and connecting it
 * on the first call.  The JWT access token (from sessionStorage) is
 * passed as a query-string parameter so the server can authenticate
 * the connection without a separate handshake message.
 */
export function getSocket(): Socket {
  if (_socket?.connected) return _socket;

  const token = sessionStorage.getItem('access_token') ?? '';

  _socket = io(SOCKET_URL, {
    transports: ['websocket', 'polling'],
    query: { token },
    // Reconnect automatically with exponential back-off (built-in)
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 30_000,
    autoConnect: true,
  });

  return _socket;
}

/**
 * Completely disconnects and destroys the socket instance.
 * Call this on logout so the next login gets a fresh socket
 * with the new user's JWT.
 */
export function disconnectSocket(): void {
  if (_socket) {
    _socket.disconnect();
    _socket = null;
  }
}

/**
 * Re-creates the socket (e.g. after a token refresh).
 * Same as disconnecting then calling getSocket().
 */
export function reconnectSocket(): Socket {
  disconnectSocket();
  return getSocket();
}
