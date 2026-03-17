interface StatsProps {
  readonly wpm: number;
  readonly accuracy: number;
  readonly progress: number;
  readonly total: number;
  readonly timeElapsed?: number;
}

function formatElapsed(ms: number): string {
  const totalSeconds = Math.round(ms / 1000);
  if (totalSeconds < 60) return `${totalSeconds}s`;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes < 60) {
    return seconds > 0 ? `${minutes}min${seconds}s` : `${minutes}min`;
  }
  const hours = Math.floor(minutes / 60);
  const remainMinutes = minutes % 60;
  return remainMinutes > 0 ? `${hours}h${remainMinutes}min` : `${hours}h`;
}

export default function Stats({ wpm, accuracy, progress, total, timeElapsed }: StatsProps) {
  const progressPercent = total > 0 ? Math.round((progress / total) * 100) : 0;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
      <StatCard
        label="WPM"
        value={String(wpm)}
        color={wpm >= 80 ? '#f59e0b' : wpm >= 50 ? '#10b981' : wpm >= 30 ? '#3b82f6' : '#64748b'}
      />
      <StatCard
        label="准确率"
        value={`${accuracy}%`}
        color={accuracy >= 95 ? '#10b981' : accuracy >= 80 ? '#3b82f6' : accuracy >= 60 ? '#f59e0b' : '#ef4444'}
      />
      <div className="rounded-2xl p-3.5" style={{
        background: 'var(--glass-bg)',
        backdropFilter: 'blur(var(--glass-blur))',
        WebkitBackdropFilter: 'blur(var(--glass-blur))',
        border: '1px solid var(--glass-border)',
        boxShadow: 'var(--glass-shadow)',
      }}>
        <div className="text-[11px] text-slate-600 mb-1 font-medium">进度</div>
        <div className="text-lg font-bold text-slate-700 tabular-nums">{progressPercent}%</div>
        <div className="mt-1.5 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.7)' }}>
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%`, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
          />
        </div>
      </div>
      {timeElapsed !== undefined && (
        <StatCard
          label="用时"
          value={formatElapsed(timeElapsed)}
          color="#8b5cf6"
        />
      )}
    </div>
  );
}

function StatCard({ label, value, color }: { readonly label: string; readonly value: string; readonly color: string }) {
  return (
    <div className="rounded-2xl p-3.5" style={{
      background: 'var(--glass-bg)',
      backdropFilter: 'blur(var(--glass-blur))',
      WebkitBackdropFilter: 'blur(var(--glass-blur))',
      border: '1px solid var(--glass-border)',
      boxShadow: 'var(--glass-shadow)',
    }}>
      <div className="text-[11px] text-slate-600 mb-1 font-medium">{label}</div>
      <div className="text-xl font-bold tabular-nums" style={{ color }}>{value}</div>
    </div>
  );
}
