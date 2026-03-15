import { useState, useEffect, useCallback } from 'react';
import { getStoredLocale, type Locale } from './i18n';

// Hook to reactively get the current locale
export function useLocale(): Locale {
  const [locale, setLocale] = useState<Locale>(getStoredLocale);

  useEffect(() => {
    const handler = () => setLocale(getStoredLocale());
    window.addEventListener('locale-change', handler);
    window.addEventListener('storage', handler);
    return () => {
      window.removeEventListener('locale-change', handler);
      window.removeEventListener('storage', handler);
    };
  }, []);

  return locale;
}

// Hook to fetch online count
export function useOnlineCount(): number {
  const [count, setCount] = useState(0);

  const fetchCount = useCallback(() => {
    fetch('/api/online-count')
      .then(r => r.json())
      .then(d => setCount(d.count ?? 0))
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchCount();
    const interval = setInterval(fetchCount, 15000);
    return () => clearInterval(interval);
  }, [fetchCount]);

  return count;
}
