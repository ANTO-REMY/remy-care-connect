import { useSocketStatus } from '@/hooks/useSocket';

/**
 * ConnectionBanner — Visual indicator when socket is disconnected
 * Appears at the top of the screen when live updates are paused.
 */
export function ConnectionBanner() {
  const { connected } = useSocketStatus();

  if (connected) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-amber-500 text-white text-center text-sm py-1.5 font-medium shadow-md">
      ⚠ Reconnecting — live updates paused
    </div>
  );
}
