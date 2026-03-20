import { t } from '../lib/i18n';
import { useLocale } from '../lib/hooks';

interface StatsProps {
  readonly wpm: number;
  readonly accuracy: number;
  readonly progress: number;
  readonly total: number;
  readonly timeElapsed?: number;
}

function formatElapsed(ms: number, locale: 'zh' | 'en'): string {
  const totalSeconds = Math.round(ms / 1000);
  if (totalSeconds < 60) return `${totalSeconds}s`;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes < 60) {
    return locale === 'zh'
      ? (seconds > 0 ? `${minutes}分${seconds}秒` : `${minutes}分`)
      : (seconds > 0 ? `${minutes}min${seconds}s` : `${minutes}min`);
  }
  const hours = Math.floor(minutes / 60);
  const remainMinutes = minutes % 60;
  return locale === 'zh'
    ? (remainMinutes > 0 ? `${hours}时${remainMinutes}分` : `${hours}时`)
    : (remainMinutes > 0 ? `${hours}h${remainMinutes}min` : `${hours}h`);
}

export default function Stats({ wpm, accuracy, progress, total, timeElapsed }: StatsProps) {
  const locale = useLocale();
  const progressPercent = total > 0 ? Math.round((progress / total) * 100) : 0;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
      <StatCard
        label="WPM"
        value={String(wpm)}
        color={wpm >= 80 ? '#f59e0b' : wpm >= 50 ? '#10b981' : wpm >= 30 ? '#3b82f6' : '#64748b'}
      />
      <StatCard
        label={t('practice.accuracy', locale)}
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
        <div className="text-[11px] mb-1 font-medium" style={{ color: 'var(--text-muted)' }}>
          {locale === 'zh' ? '进度' : 'Progress'}
        </div>
        <div className="text-lg font-bold tabular-nums" style={{ color: 'var(--text-primary)' }}>{progressPercent}%</div>
        <div className="mt-1.5 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.7)' }}>
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%`, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
          />
        </div>
      </div>
      {timeElapsed !== undefined && (
        <StatCard
          label={t('practice.time', locale)}
          value={formatElapsed(timeElapsed, locale)}
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
      <div className="text-[11px] mb-1 font-medium" style={{ color: 'var(--text-muted)' }}>{label}</div>
      <div className="text-xl font-bold tabular-nums" style={{ color }}>{value}</div>
    </div>
  );
}
