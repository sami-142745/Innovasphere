import { useCallback, useEffect, useRef, useState } from 'react';
import { notificationService } from '../services/notifications';

export function useUnreadCount(refreshIntervalMs = 30000): { count: number; refresh: () => void } {
  const [count, setCount] = useState(0);
  const timer = useRef<number | null>(null);

  const refresh = useCallback(() => {
    notificationService
      .unreadCount()
      .then((res) => setCount(res.count))
      .catch(() => setCount(0));
  }, []);

  useEffect(() => {
    refresh();
    timer.current = window.setInterval(refresh, refreshIntervalMs);
    return () => {
      if (timer.current) window.clearInterval(timer.current);
    };
  }, [refresh, refreshIntervalMs]);

  return { count, refresh };
}