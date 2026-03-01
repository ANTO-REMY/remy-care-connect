/**
 * SocketContext.tsx
 * ──────────────────
 * App-wide Socket.IO provider.
 *
 * • Automatically connects when a valid access token is present.
 * • Disconnects and clears the singleton on logout.
 * • Exposes `socket` and `connected` via context for components that
 *   need direct socket access (most components should prefer useSocket()).
 *
 * Wrap your router with <SocketProvider> inside <AuthProvider>:
 *
 *   <AuthProvider>
 *     <SocketProvider>
 *       <RouterProvider … />
 *     </SocketProvider>
 *   </AuthProvider>
 */

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import type { Socket } from 'socket.io-client';
import { getSocket, disconnectSocket } from '@/lib/socketClient';
import { useAuth } from '@/contexts/AuthContext';

interface SocketContextValue {
  socket: Socket | null;
  connected: boolean;
}

const SocketContext = createContext<SocketContextValue>({
  socket: null,
  connected: false,
});

export function SocketProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const token = sessionStorage.getItem('access_token');

    if (!user || !token) {
      // Logged out — tear down the socket
      disconnectSocket();
      setSocket(null);
      setConnected(false);
      return;
    }

    // Logged in — create / reuse the socket
    const s = getSocket();
    setSocket(s);
    setConnected(s.connected);

    const onConnect    = () => setConnected(true);
    const onDisconnect = () => setConnected(false);

    s.on('connect',    onConnect);
    s.on('disconnect', onDisconnect);

    return () => {
      s.off('connect',    onConnect);
      s.off('disconnect', onDisconnect);
    };
  }, [user]);

  return (
    <SocketContext.Provider value={{ socket, connected }}>
      {children}
    </SocketContext.Provider>
  );
}

/** Direct access to the socket context (prefer useSocket() for event handling) */
export function useSocketContext(): SocketContextValue {
  return useContext(SocketContext);
}
