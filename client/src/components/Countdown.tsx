import { useState, useEffect } from 'react';
import { playCountdownSound, playGoSound } from '../lib/sounds';
import { t } from '../lib/i18n';
import { useLocale } from '../lib/hooks';

interface CountdownProps {
  readonly countdownEnd: number;
  readonly onComplete?: () => void;
}

export default function Countdown({ countdownEnd, onComplete }: CountdownProps) {
  const [count, setCount] = useState<number>(0);
  const locale = useLocale();

  useEffect(() => {
    const updateCount = () => {
      const remaining = Math.ceil((countdownEnd - Date.now()) / 1000);
      if (remaining <= 0) {
        setCount(0);
        onComplete?.();
        return;
      }
      setCount(remaining);
    };

    updateCount();
    const interval = setInterval(updateCount, 100);
    return () => clearInterval(interval);
  }, [countdownEnd, onComplete]);

  useEffect(() => {
    if (count > 0 && count <= 5) {
      playCountdownSound();
    } else if (count === 0) {
      playGoSound();
    }
  }, [count]);

  if (count === 0) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50" style={{
      background: 'var(--glass-bg)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
    }}>
      <div className="text-center">
        <div className="relative inline-flex items-center justify-center">
          <div className="absolute w-44 h-44 rounded-full border-2 animate-ping" style={{ borderColor: 'var(--primary-color)', opacity: 0.2 }} />
          <div className="absolute w-36 h-36 rounded-full border" style={{ borderColor: 'var(--glass-border)' }} />
          <div className="relative w-28 h-28 rounded-full flex items-center justify-center" style={{
            background: 'var(--glass-bg)',
            border: '1px solid var(--glass-border)',
            boxShadow: 'var(--glass-shadow)',
          }}>
            <span className="text-6xl font-extrabold tabular-nums" style={{ color: 'var(--primary-color)' }}>
              {count}
            </span>
          </div>
        </div>
        <div className="text-lg mt-6 font-medium" style={{ color: 'var(--text-secondary)' }}>
          {t('countdown.ready', locale)}
        </div>
      </div>
    </div>
  );
}
