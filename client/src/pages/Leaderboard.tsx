import { useState, useEffect } from 'react';
import { Radio, Spin } from '@arco-design/web-react';
import { getAvatar } from '../lib/avatars';
import type { LeaderboardEntry } from '../types';

export default function Leaderboard() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [mode, setMode] = useState<'all' | 'practice' | 'multiplayer'>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/leaderboard${mode === 'all' ? '' : `?mode=${mode}`}`)
      .then(res => res.json())
      .then(data => { setEntries(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [mode]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-extrabold" style={{
            background: 'linear-gradient(135deg, #1e293b 0%, #6366f1 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          }}>排行榜</h1>
          <p className="text-slate-700 text-sm mt-1">全球最快打字选手</p>
        </div>
        <Radio.Group type="button" value={mode} onChange={v => setMode(v)}
          options={[
            { label: '全部', value: 'all' },
            { label: '练习', value: 'practice' },
            { label: '对战', value: 'multiplayer' },
          ]} />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Spin size={32} />
        </div>
      ) : entries.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-5xl mb-4 opacity-60">🏆</div>
          <p className="text-slate-600">还没有记录，成为第一个上榜的人吧！</p>
        </div>
      ) : (
        <div className="space-y-6">
          {entries.length >= 3 && (
            <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-2">
              {[1, 0, 2].map(podiumIndex => {
                const entry = entries[podiumIndex];
                if (!entry) return null;
                const rankOrder = podiumIndex === 0 ? 2 : podiumIndex === 1 ? 1 : 3;
                return (
                  <div key={entry.id} className="glass-card flex flex-col items-center p-3 sm:p-6" style={{
                    cursor: 'default',
                    order: rankOrder === 1 ? 2 : rankOrder === 2 ? 1 : 3,
                    background: rankOrder === 1 ? 'rgba(251,191,36,0.12)' : 'var(--glass-bg)',
                    borderColor: rankOrder === 1 ? 'rgba(251,191,36,0.3)' : 'var(--glass-border)',
                  }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'none'; }}>
                    <div className="text-3xl mb-2">{rankOrder === 1 ? '🥇' : rankOrder === 2 ? '🥈' : '🥉'}</div>
                    <div className="text-2xl mb-1">{getAvatar(entry.avatar)}</div>
                    <div className="font-semibold text-slate-800 text-sm mb-2">{entry.nickname}</div>
                    <div className="text-2xl font-extrabold tabular-nums" style={{ color: rankOrder === 1 ? '#f59e0b' : rankOrder === 2 ? '#64748b' : '#b45309' }}>{Math.round(entry.wpm)}</div>
                    <div className="text-[10px] text-slate-600 uppercase tracking-wider">WPM</div>
                    <div className="text-xs text-slate-600 mt-1">{Math.round(entry.accuracy)}% 准确率</div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="glass-card overflow-hidden" style={{ cursor: 'default' }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'none'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'none'; }}>
            {/* Desktop header */}
            <div className="hidden sm:grid grid-cols-[3rem_1fr_5rem_4rem_4rem_5rem] gap-2 px-5 py-3 text-[11px] text-slate-600 uppercase tracking-wider font-semibold"
              style={{ borderBottom: '1px solid var(--glass-border)', background: 'rgba(99,102,241,0.05)' }}>
              <div>#</div><div>玩家</div><div className="text-right">速度</div><div className="text-right">准确率</div><div className="text-right">模式</div><div className="text-right">时间</div>
            </div>
            {/* Mobile header */}
            <div className="grid sm:hidden grid-cols-[2rem_1fr_4rem_3.5rem] gap-1.5 px-3 py-2.5 text-[10px] text-slate-600 uppercase tracking-wider font-semibold"
              style={{ borderBottom: '1px solid var(--glass-border)', background: 'rgba(99,102,241,0.05)' }}>
              <div>#</div><div>玩家</div><div className="text-right">速度</div><div className="text-right">准确率</div>
            </div>
            {entries.map((entry, index) => (
              <div key={entry.id}>
                {/* Desktop row */}
                <div className="hidden sm:grid grid-cols-[3rem_1fr_5rem_4rem_4rem_5rem] gap-2 items-center px-5 py-3 transition-colors"
                  style={{ borderBottom: '1px solid rgba(148,163,184,0.1)' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(99,102,241,0.05)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
                <div>{index < 3 ? <span className="text-lg">{['🥇','🥈','🥉'][index]}</span> : <span className="text-slate-600 font-mono text-sm">{index + 1}</span>}</div>
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-lg shrink-0">{getAvatar(entry.avatar)}</span>
                  <span className="font-medium text-slate-800 text-sm truncate">{entry.nickname}</span>
                </div>
                <div className="text-right"><span className="font-bold tabular-nums text-sm" style={{ color: entry.wpm >= 100 ? '#f59e0b' : entry.wpm >= 60 ? '#10b981' : entry.wpm >= 30 ? '#3b82f6' : '#64748b' }}>{Math.round(entry.wpm)}<span className="text-[10px] text-slate-600 ml-0.5">WPM</span></span></div>
                <div className="text-right text-slate-700 text-sm tabular-nums">{Math.round(entry.accuracy)}%</div>
                <div className="text-right">
                  <span className="text-[10px] px-2 py-0.5 rounded-lg font-medium" style={{
                    background: entry.mode === 'multiplayer' ? 'rgba(139,92,246,0.1)' : 'rgba(59,130,246,0.1)',
                    color: entry.mode === 'multiplayer' ? '#8b5cf6' : '#3b82f6',
                    border: `1px solid ${entry.mode === 'multiplayer' ? 'rgba(139,92,246,0.2)' : 'rgba(59,130,246,0.2)'}`,
                  }}>{entry.mode === 'multiplayer' ? '对战' : '练习'}</span>
                </div>
                <div className="text-right text-slate-600 text-xs">{formatTime(entry.createdAt)}</div>
                </div>
                {/* Mobile row */}
                <div className="grid sm:hidden grid-cols-[2rem_1fr_4rem_3.5rem] gap-1.5 items-center px-3 py-2.5"
                  style={{ borderBottom: '1px solid rgba(148,163,184,0.1)' }}>
                  <div>{index < 3 ? <span className="text-base">{['🥇','🥈','🥉'][index]}</span> : <span className="text-slate-600 font-mono text-xs">{index + 1}</span>}</div>
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="text-base shrink-0">{getAvatar(entry.avatar)}</span>
                    <span className="font-medium text-slate-800 text-xs truncate">{entry.nickname}</span>
                  </div>
                  <div className="text-right"><span className="font-bold tabular-nums text-xs" style={{ color: entry.wpm >= 100 ? '#f59e0b' : entry.wpm >= 60 ? '#10b981' : '#3b82f6' }}>{Math.round(entry.wpm)}<span className="text-[9px] text-slate-600 ml-0.5">WPM</span></span></div>
                  <div className="text-right text-slate-700 text-xs tabular-nums">{Math.round(entry.accuracy)}%</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  const diffMins = Math.floor((Date.now() - date.getTime()) / 60000);
  if (diffMins < 1) return '刚刚';
  if (diffMins < 60) return `${diffMins}分前`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}时前`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `${diffDays}天前`;
  return date.toLocaleDateString('zh-CN');
}
