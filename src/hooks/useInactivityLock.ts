import { useEffect, useRef } from 'react';

interface UseInactivityLockOptions {
  timeoutMinutes: number; // e.g. 20 minutes
  enabled: boolean;
  onLock: () => void;
}

export function useInactivityLock({ timeoutMinutes, enabled, onLock }: UseInactivityLockOptions) {
  const lastActivityRef = useRef<number>(Date.now());
  const onLockRef = useRef(onLock);
  onLockRef.current = onLock;

  useEffect(() => {
    if (!enabled || timeoutMinutes <= 0) return;

    const timeoutMs = timeoutMinutes * 60 * 1000;
    lastActivityRef.current = Date.now();

    // Throttle activity updates to at most once every 1.5 seconds
    let lastRecorded = Date.now();
    const handleActivity = () => {
      const now = Date.now();
      if (now - lastRecorded > 1500) {
        lastActivityRef.current = now;
        lastRecorded = now;
      }
    };

    const checkInactivity = () => {
      const elapsed = Date.now() - lastActivityRef.current;
      if (elapsed >= timeoutMs) {
        lastActivityRef.current = Date.now();
        onLockRef.current();
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkInactivity();
      }
    };

    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'];
    events.forEach((evt) => {
      window.addEventListener(evt, handleActivity, { passive: true });
    });

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Check every 5 seconds
    const intervalId = window.setInterval(checkInactivity, 5000);

    return () => {
      events.forEach((evt) => {
        window.removeEventListener(evt, handleActivity);
      });
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.clearInterval(intervalId);
    };
  }, [enabled, timeoutMinutes]);
}
