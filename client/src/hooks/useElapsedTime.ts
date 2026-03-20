import { useEffect, useState } from 'react';

export function useNow(enabled: boolean, intervalMs = 1000): number {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!enabled) return;

    const timer = window.setInterval(() => {
      setNow(Date.now());
    }, intervalMs);

    return () => window.clearInterval(timer);
  }, [enabled, intervalMs]);

  return now;
}

export function useElapsedTime(
  startTime: number | null,
  endTime: number | null,
  intervalMs = 1000
): number | undefined {
  const now = useNow(startTime !== null && endTime === null, intervalMs);

  if (startTime === null) {
    return undefined;
  }

  return (endTime ?? now) - startTime;
}
