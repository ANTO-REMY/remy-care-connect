/**
 * useSocket.ts
 * ─────────────
 * React hook for subscribing to Socket.IO events from any component.
 *
 * Usage
 * ─────
 * // Simple event listener (auto-cleaned-up on unmount / handler change)
 * useSocket('checkin:new', (payload) => {
 *   setCheckins(prev => [payload, ...prev]);
 * });
 *
 * // Conditionally disable (skip subscribe until ready)
 * useSocket('appointment:created', handler, { enabled: !!profileId });
 *
 * // Access connection state
 * const { connected } = useSocketStatus();
 */

import { useEffect, useRef } from 'react';
import { getSocket } from '@/lib/socketClient';

interface UseSocketOptions {
  /** Set to false to temporarily skip the subscription (default: true) */
  enabled?: boolean;
}

/**
 * Subscribe to a single named Socket.IO event.
 * Cleans up listeners on unmount or when dependencies change.
 */
export function useSocket<T = unknown>(
  event: string,
  handler: (data: T) => void,
  options: UseSocketOptions = {},
): void {
  const { enabled = true } = options;
  // Keep a stable ref to the latest handler so we don't re-subscribe on
  // every render when the handler is an inline arrow function.
  const handlerRef = useRef(handler);
  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  useEffect(() => {
    if (!enabled) return;

    const socket = getSocket();
    const stable = (data: T) => handlerRef.current(data);

    socket.on(event, stable);
    return () => {
      socket.off(event, stable);
    };
  }, [event, enabled]);
}

/**
 * Emit a "join_rooms" event so the server puts this socket into the
 * typed-profile room (chw:{id} or nurse:{id}).
 * Call once per session after the profile ID is known.
 */
export function joinProfileRoom(profileId: number): void {
  const socket = getSocket();
  socket.emit('join_rooms', { profile_id: profileId });
}

/**
 * Returns the current connection state of the socket.
 * Re-renders the component when the socket connects / disconnects.
 */
import { useState } from 'react';

export function useSocketStatus(): { connected: boolean } {
  const [connected, setConnected] = useState(() => {
    try { return getSocket().connected; } catch { return false; }
  });

  useEffect(() => {
    const socket = getSocket();
    const onConnect    = () => setConnected(true);
    const onDisconnect = () => setConnected(false);

    socket.on('connect',    onConnect);
    socket.on('disconnect', onDisconnect);

    // Sync initial state in case socket connected before this effect ran
    setConnected(socket.connected);

    return () => {
      socket.off('connect',    onConnect);
      socket.off('disconnect', onDisconnect);
    };
  }, []);

  return { connected };
}
