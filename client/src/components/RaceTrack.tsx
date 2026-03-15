import { getAvatar } from '../lib/avatars';
import type { RoomPlayer } from '../types';

interface RaceTrackProps {
  readonly players: readonly RoomPlayer[];
  readonly textLength: number;
  readonly currentPlayerId: string;
}

export default function RaceTrack({ players, textLength, currentPlayerId }: RaceTrackProps) {
  const sortedPlayers = [...players].sort((a, b) => {
    if (a.finished && b.finished) return (a.rank ?? 0) - (b.rank ?? 0);
    if (a.finished) return -1;
    if (b.finished) return 1;
    return b.progress - a.progress;
  });

  return (
    <div className="rounded-2xl p-4 sm:p-6 border space-y-3 sm:space-y-4" style={{
      background: 'var(--glass-bg)',
      backdropFilter: 'blur(var(--glass-blur))',
      borderColor: 'var(--glass-border)',
      boxShadow: 'var(--glass-shadow)',
    }}>
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Race Track</h3>
        <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{players.length} players</div>
      </div>

      {sortedPlayers.map((player) => {
        const progressPercent = textLength > 0
          ? Math.min(100, Math.round((player.progress / textLength) * 100))
          : 0;
        const isMe = player.id === currentPlayerId;

        return (
          <div key={player.id} className="space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {player.rank && (
                  <span className={`text-xs font-bold w-5 text-center ${
                    player.rank === 1 ? 'text-amber-500' :
                    player.rank === 2 ? 'text-slate-600' :
                    player.rank === 3 ? 'text-amber-700' : 'text-slate-600'
                  }`}>
                    #{player.rank}
                  </span>
                )}
                <span className={`text-sm font-medium ${isMe ? 'text-indigo-600' : 'text-slate-700'}`}>
                  {player.nickname}
                  {isMe && <span className="text-indigo-400 text-xs ml-1">(你)</span>}
                </span>
              </div>
              <div className="flex items-center gap-2 sm:gap-3 text-[10px] sm:text-[11px] tabular-nums" style={{ color: 'var(--text-muted)' }}>
                <span className="text-indigo-500">{player.wpm} <span className="opacity-60">WPM</span></span>
                <span>{player.accuracy}%</span>
              </div>
            </div>

            <div className="relative h-8 sm:h-9 rounded-full overflow-hidden border" style={{ background: 'var(--glass-bg)', borderColor: 'var(--glass-border)' }}>
              <div className="absolute right-0 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-amber-300/40 to-transparent" />

              <div
                className={`absolute inset-y-0 left-0 rounded-full transition-all duration-300 ease-out ${
                  player.finished
                    ? 'bg-gradient-to-r from-emerald-200/80 to-emerald-100/60'
                    : isMe
                    ? 'bg-gradient-to-r from-indigo-200/80 to-purple-100/60'
                    : 'bg-gradient-to-r from-blue-200/60 to-cyan-100/40'
                }`}
                style={{ width: `${progressPercent}%` }}
              />

              <div
                className="absolute top-1/2 -translate-y-1/2 transition-all duration-300 ease-out"
                style={{ left: `max(0.5rem, calc(${Math.min(progressPercent, 96)}% - 1rem))` }}
              >
                <div className={`text-xl ${player.finished ? 'animate-bounce' : ''}`}>
                  {getAvatar(player.avatar)}
                </div>
              </div>

              <div className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-600 font-mono tabular-nums">
                {progressPercent}%
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
