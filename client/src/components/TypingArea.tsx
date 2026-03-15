interface TypingAreaProps {
  readonly text: string;
  readonly displayText?: string;
  readonly currentIndex: number;
  readonly errors: ReadonlySet<number>;
  readonly isComplete: boolean;
}

export default function TypingArea({ text, displayText, currentIndex, errors, isComplete }: TypingAreaProps) {
  const hasChinese = !!displayText;

  return (
    <div className="rounded-3xl overflow-hidden" style={{
      background: 'var(--glass-bg)',
      backdropFilter: 'blur(var(--glass-blur))',
      WebkitBackdropFilter: 'blur(var(--glass-blur))',
      border: '1px solid var(--glass-border)',
      boxShadow: 'var(--glass-shadow)',
    }}>
      {hasChinese && (
        <div className="px-4 sm:px-6 py-3 sm:py-4" style={{ background: 'rgba(251, 191, 36, 0.08)', borderBottom: '1px solid rgba(251, 191, 36, 0.15)' }}>
          <div className="text-[10px] font-semibold text-amber-500 uppercase tracking-widest mb-2">原文</div>
          <p className="text-base sm:text-lg text-amber-900/80 leading-relaxed font-medium tracking-wide">
            {displayText}
          </p>
        </div>
      )}

      <div className="px-4 sm:px-6 py-4 sm:py-5" style={{ background: 'rgba(255,255,255,0.85)' }}>
        {hasChinese && (
          <div className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest mb-3">拼音输入</div>
        )}
        <div className="text-base sm:text-lg leading-[2] sm:leading-[2.2] font-mono tracking-wide whitespace-pre-wrap break-all select-none">
          {text.split('').map((char, i) => {
            let cls = 'transition-colors duration-75 ';
            if (i < currentIndex) {
              cls += errors.has(i)
                ? 'text-red-500 bg-red-50 rounded-sm'
                : 'text-emerald-500';
            } else if (i === currentIndex && !isComplete) {
              cls += 'text-indigo-600 bg-indigo-50 rounded-sm ring-2 ring-indigo-300 ring-offset-1';
            } else {
              cls += 'text-slate-500';
            }
            return (
              <span key={i} className={cls}>
                {char === ' ' ? '\u00A0' : char}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}
