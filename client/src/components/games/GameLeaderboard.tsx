import { useState, useEffect } from 'react';
import { fetchGameLeaderboard, type GameScoreEntry } from '../../lib/api';
import { getDeviceId } from '../../lib/device';
import { getAvatar } from '../../lib/avatars';
import { useLocale } from '../../lib/hooks';

interface Props {
  readonly gameId: string;
  readonly currentScore?: number;
}

export default function GameLeaderboard({ gameId, currentScore }: Props) {
  const locale = useLocale();
  const [scores, setScores] = useState<readonly GameScoreEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const myDeviceId = getDeviceId();

  useEffect(() => {
    let cancelled = false;
    fetchGameLeaderboard(gameId)
      .then(data => { if (!cancelled) setScores(data); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [gameId, currentScore]);

  if (loading) {
    return (
      <div className="text-center py-3 text-sm" style={{ color: 'var(--text-muted)' }}>
        {locale === 'zh' ? '加载排行榜...' : 'Loading leaderboard...'}
      </div>
    );
  }

  if (scores.length === 0) {
    return (
      <div className="text-center py-3 text-sm" style={{ color: 'var(--text-muted)' }}>
        {locale === 'zh' ? '暂无记录，成为第一个！' : 'No scores yet. Be the first!'}
      </div>
    );
  }

  const medals = ['🥇', '🥈', '🥉'];

  return (
    <div>
      <h3 className="text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>
        {locale === 'zh' ? '🏆 排行榜' : '🏆 Leaderboard'}
      </h3>
      <div className="space-y-1.5" style={{ maxHeight: '200px', overflowY: 'auto' }}>
        {scores.slice(0, 10).map((entry, i) => {
          const isMe = entry.deviceId === myDeviceId;
          return (
            <div key={`${entry.deviceId}-${i}`}
              className="flex items-center justify-between px-3 py-1.5 rounded-lg text-sm"
              style={{
                background: isMe ? 'rgba(99,102,241,0.1)' : 'rgba(128,128,128,0.05)',
                border: isMe ? '1px solid rgba(99,102,241,0.3)' : '1px solid transparent',
              }}>
              <div className="flex items-center gap-2">
                <span className="w-6 text-center font-bold" style={{ color: i < 3 ? 'var(--primary-color)' : 'var(--text-muted)', fontSize: '13px' }}>
                  {i < 3 ? medals[i] : `${i + 1}`}
                </span>
                <span className="text-base">{getAvatar(entry.avatar)}</span>
                <span style={{ color: isMe ? 'var(--primary-color)' : 'var(--text-primary)', fontWeight: isMe ? 700 : 500 }}>
                  {entry.nickname}{isMe ? (locale === 'zh' ? ' (我)' : ' (You)') : ''}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'rgba(128,128,128,0.1)', color: 'var(--text-muted)' }}>
                  {entry.difficulty === 'easy' ? (locale === 'zh' ? '简单' : 'Easy')
                    : entry.difficulty === 'hard' ? (locale === 'zh' ? '困难' : 'Hard')
                    : (locale === 'zh' ? '中等' : 'Med')}
                </span>
                <span className="font-bold font-mono" style={{ color: 'var(--primary-color)' }}>{entry.score}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
