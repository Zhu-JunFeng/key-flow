import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Button, Spin } from '@arco-design/web-react';
import { fetchMyReplays, fetchReplay } from '../lib/api';
import { ReplayPlayer, type ReplayEvent } from '../lib/replay';
import { t } from '../lib/i18n';
import { useLocale } from '../lib/hooks';

export default function ReplayPage() {
  const { id } = useParams<{ id: string }>();

  if (id) {
    return <ReplayViewer replayId={parseInt(id)} />;
  }

  return <ReplayList />;
}

function ReplayList() {
  const locale = useLocale();
  const [replays, setReplays] = useState<readonly { id: number; textContent: string; wpm: number; accuracy: number; durationMs: number; createdAt: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyReplays(20).then(setReplays).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center min-h-[50vh]"><Spin size={32} /></div>;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-extrabold mb-6" style={{
        background: 'linear-gradient(135deg, var(--text-primary) 0%, var(--primary-color) 100%)',
        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
      }}>{t('replay.title', locale)}</h1>

      {replays.length === 0 ? (
        <div className="glass-card p-8 text-center" style={{ cursor: 'default' }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'none'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'none'; }}>
          <p className="text-lg mb-2" style={{ color: 'var(--text-secondary)' }}>{t('replay.empty', locale)}</p>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{t('replay.emptyHint', locale)}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {replays.map(r => (
            <Link key={r.id} to={`/replay/${r.id}`}
              className="glass-card p-4 flex items-center justify-between"
              style={{ cursor: 'pointer', display: 'flex' }}>
              <div>
                <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)', maxWidth: '300px' }}>
                  {r.textContent.slice(0, 60)}...
                </p>
                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                  {new Date(r.createdAt.endsWith('Z') ? r.createdAt : r.createdAt + 'Z').toLocaleString()}
                </p>
              </div>
              <div className="flex gap-4 text-sm tabular-nums">
                <span style={{ color: 'var(--primary-color)' }}>{r.wpm} WPM</span>
                <span style={{ color: 'var(--text-secondary)' }}>{r.accuracy}%</span>
                <span style={{ color: 'var(--text-muted)' }}>{Math.round(r.durationMs / 1000)}s</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function ReplayViewer({ replayId }: { readonly replayId: number }) {
  const locale = useLocale();
  const [replay, setReplay] = useState<{
    id: number;
    nickname: string;
    textContent: string;
    replayData: readonly ReplayEvent[];
    wpm: number;
    accuracy: number;
    durationMs: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [errors, setErrors] = useState<ReadonlySet<number>>(new Set());
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const playerRef = useRef<ReplayPlayer | null>(null);

  useEffect(() => {
    fetchReplay(replayId).then(r => { setReplay(r); setLoading(false); }).catch(() => setLoading(false));
  }, [replayId]);

  const play = useCallback(() => {
    if (!replay) return;
    setCurrentIndex(0);
    setErrors(new Set());
    setIsPlaying(true);

    let idx = 0;
    const errSet = new Set<number>();

    const player = new ReplayPlayer(
      replay.replayData,
      (event) => {
        if (event.key === 'Backspace') {
          if (idx > 0) {
            idx--;
            errSet.delete(idx);
          }
        } else if (event.key.length === 1) {
          if (!event.correct) errSet.add(idx);
          idx++;
        }
        setCurrentIndex(idx);
        setErrors(new Set(errSet));
      },
      () => setIsPlaying(false),
      speed
    );
    playerRef.current = player;
    player.play();
  }, [replay, speed]);

  const stop = () => {
    playerRef.current?.stop();
    setIsPlaying(false);
    setCurrentIndex(0);
    setErrors(new Set());
  };

  if (loading || !replay) return <div className="flex items-center justify-center min-h-[50vh]"><Spin size={32} /></div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold" style={{
            background: 'linear-gradient(135deg, var(--text-primary) 0%, var(--primary-color) 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          }}>{t('replay.title', locale)} #{replay.id}</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            {replay.nickname} - {replay.wpm} WPM / {replay.accuracy}%
          </p>
        </div>
        <Link to="/replay">
          <Button size="small">{t('replay.backList', locale)}</Button>
        </Link>
      </div>

      {/* Controls */}
      <div className="glass-card p-4 mb-6 flex items-center gap-4" style={{ cursor: 'default' }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'none'; }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'none'; }}>
        {isPlaying ? (
          <Button onClick={stop}>{t('replay.stop', locale)}</Button>
        ) : (
          <Button type="primary" onClick={play}>{t('replay.play', locale)}</Button>
        )}
        <div className="flex items-center gap-2">
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{t('replay.speed', locale)}:</span>
          {[0.5, 1, 2, 4].map(s => (
            <button key={s} onClick={() => { setSpeed(s); playerRef.current?.setSpeed(s); }}
              className="text-xs px-2 py-1 rounded"
              style={{
                background: speed === s ? 'rgba(99,102,241,0.15)' : 'var(--bg-card)',
                color: speed === s ? 'var(--primary-color)' : 'var(--text-secondary)',
                border: '1px solid var(--glass-border)',
              }}>{s}x</button>
          ))}
        </div>
        <div className="text-xs ml-auto" style={{ color: 'var(--text-muted)' }}>
          {currentIndex} / {replay.textContent.length}
        </div>
      </div>

      {/* Text display */}
      <div className="rounded-3xl overflow-hidden" style={{
        background: 'var(--glass-bg)',
        backdropFilter: 'blur(var(--glass-blur))',
        border: '1px solid var(--glass-border)',
        boxShadow: 'var(--glass-shadow)',
      }}>
        <div className="px-6 py-5" style={{ background: 'var(--bg-card)' }}>
          <div className="text-lg leading-[2.2] font-mono tracking-wide whitespace-pre-wrap break-all select-none">
            {replay.textContent.split('').map((char, i) => {
              let cls = 'transition-colors duration-75 ';
              if (i < currentIndex) {
                cls += errors.has(i) ? 'text-red-500 bg-red-50 dark:bg-red-900/30 rounded-sm' : 'text-emerald-500';
              } else if (i === currentIndex) {
                cls += 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 rounded-sm ring-2 ring-indigo-300 ring-offset-1';
              } else {
                cls += '';
                return <span key={i} className={cls} style={{ color: 'var(--text-muted)' }}>{char === ' ' ? '\u00A0' : char}</span>;
              }
              return <span key={i} className={cls}>{char === ' ' ? '\u00A0' : char}</span>;
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
