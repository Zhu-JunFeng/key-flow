import { useState, useEffect } from 'react';
import { playCountdownSound, playGoSound } from '../lib/sounds';

interface CountdownProps {
  readonly countdownEnd: number;
  readonly onComplete?: () => void;
}

export default function Countdown({ countdownEnd, onComplete }: CountdownProps) {
  const [count, setCount] = useState<number>(0);

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
    <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="text-center">
        <div className="relative inline-flex items-center justify-center">
          <div className="absolute w-44 h-44 rounded-full border-2 border-indigo-200 animate-ping" />
          <div className="absolute w-36 h-36 rounded-full border border-indigo-100" />
          <div className="relative w-28 h-28 rounded-full bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200 flex items-center justify-center shadow-xl shadow-indigo-100">
            <span className="text-6xl font-extrabold text-indigo-500 tabular-nums">
              {count}
            </span>
          </div>
        </div>
        <div className="text-lg text-slate-600 mt-6 font-medium">准备开始...</div>
      </div>
    </div>
  );
}
