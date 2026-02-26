import { useEffect, useRef, useCallback } from "react";

/**
 * Custom hook that calls a callback function at a regular interval.
 * Useful for keeping dashboard data fresh without a full page reload.
 *
 * Features:
 * - Calls `callback` immediately on mount (unless `immediate` is false)
 * - Re-polls every `intervalMs` milliseconds (default 30 000 — 30 s)
 * - Pauses when the browser tab is hidden and resumes (with an immediate
 *   refresh) when it becomes visible again
 * - Cleans up on unmount
 *
 * @param callback  Async or sync function to invoke on each tick
 * @param intervalMs  Polling period in milliseconds (default 30 000)
 * @param enabled  Set to `false` to temporarily pause polling
 */
export function usePolling(
  callback: () => void | Promise<void>,
  intervalMs = 30_000,
  enabled = true,
) {
  const savedCallback = useRef(callback);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Always keep the latest callback in the ref so we don't need it as a dep
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  // Core polling logic
  useEffect(() => {
    if (!enabled) return;

    const tick = () => {
      savedCallback.current();
    };

    // Start the interval
    intervalRef.current = setInterval(tick, intervalMs);

    // Visibility-change handler: pause polling when tab is hidden, resume
    // (with an immediate tick) when it becomes visible.
    const onVisibilityChange = () => {
      if (document.hidden) {
        // Tab hidden → stop the interval to save resources
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      } else {
        // Tab visible again → immediate refresh + restart interval
        tick();
        intervalRef.current = setInterval(tick, intervalMs);
      }
    };

    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [intervalMs, enabled]);
}
