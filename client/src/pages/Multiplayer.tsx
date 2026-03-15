import { useState, useEffect, useCallback, useRef } from 'react';
import { Input, Button, Spin } from '@arco-design/web-react';
import { socket, connectSocket } from '../lib/socket';
import { resumeAudioContext } from '../lib/sounds';
import { useTyping } from '../hooks/useTyping';
import TypingArea from '../components/TypingArea';
import RaceTrack from '../components/RaceTrack';
import Stats from '../components/Stats';
import Countdown from '../components/Countdown';
import { AVATARS, getAvatar } from '../lib/avatars';
import type { GameRoom, RoomPlayer } from '../types';

type GamePhase = 'setup' | 'queuing' | 'countdown' | 'racing' | 'finished';

export default function Multiplayer() {
  const [phase, setPhase] = useState<GamePhase>('setup');
  const [nickname, setNickname] = useState(() => localStorage.getItem('nickname') || '');
  const [avatar, setAvatar] = useState(() => parseInt(localStorage.getItem('avatar') || '0'));
  const [queueSize, setQueueSize] = useState(0);
  const [room, setRoom] = useState<GameRoom | null>(null);
  const [text, setText] = useState('');
  const [countdownEnd, setCountdownEnd] = useState<number>(0);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const nicknameInputRef = useRef<any>(null);

  const onProgress = useCallback((s: { currentIndex: number; correctChars: number; totalKeystrokes: number }) => {
    if (room) socket.emit('typing:progress', { roomId: room.id, progress: s.currentIndex, correctChars: s.correctChars, totalKeystrokes: s.totalKeystrokes });
  }, [room]);

  const { state: typingState, handleKeyDown, reset } = useTyping(text, onProgress);

  useEffect(() => {
    connectSocket();
    socket.on('queue:size', (d: { size: number }) => setQueueSize(d.size));
    socket.on('queue:joined', () => setPhase('queuing'));
    socket.on('match:found', (d: { roomId: string; text: string; players: RoomPlayer[] }) => {
      setText(d.text);
      setRoom({ id: d.roomId, text: d.text, players: d.players.map(p => ({ ...p, progress: 0, wpm: 0, accuracy: 100, finished: false, finishTime: null, rank: null })), state: 'waiting', startTime: null, countdownEnd: null, maxPlayers: 5 });
    });
    socket.on('room:update', (d: GameRoom) => {
      setRoom(d);
      if (d.state === 'countdown' && d.countdownEnd) { setCountdownEnd(d.countdownEnd); setPhase('countdown'); }
      else if (d.state === 'racing') setPhase('racing');
      else if (d.state === 'finished') setPhase('finished');
    });
    socket.on('race:start', () => setPhase('racing'));
    socket.on('race:finish', (d: GameRoom) => { setRoom(d); setPhase('finished'); });
    socket.on('player:left', (d: { playerId: string }) => { setRoom(prev => prev ? { ...prev, players: prev.players.filter(p => p.id !== d.playerId) } : prev); });
    return () => { ['queue:size','queue:joined','match:found','room:update','race:start','race:finish','player:left'].forEach(e => socket.off(e)); };
  }, []);

  useEffect(() => {
    if (phase === 'racing') { reset(); const handler = (e: KeyboardEvent) => { resumeAudioContext(); handleKeyDown(e); }; window.addEventListener('keydown', handler); return () => window.removeEventListener('keydown', handler); }
  }, [phase, handleKeyDown, reset]);

  const joinQueue = () => { if (!nickname.trim()) { nicknameInputRef.current?.focus(); return; } localStorage.setItem('nickname', nickname.trim()); localStorage.setItem('avatar', String(avatar)); resumeAudioContext(); socket.emit('queue:join', { nickname: nickname.trim(), avatar }); };
  const currentPlayer = room?.players.find(p => p.id === socket.id);
  const timeElapsed = typingState.startTime ? (typingState.endTime ?? Date.now()) - typingState.startTime : undefined;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {phase === 'countdown' && countdownEnd > 0 && <Countdown countdownEnd={countdownEnd} />}

      {phase === 'setup' && (
        <div className="max-w-md mx-auto space-y-8">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium mb-4"
              style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)', color: '#8b5cf6' }}>
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />实时对战
            </div>
            <h1 className="text-3xl font-extrabold mb-2" style={{
              background: 'linear-gradient(135deg, #1e293b 0%, #6366f1 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            }}>多人对战</h1>
            <p className="text-slate-700">匹配在线玩家，实时竞速比赛</p>
            <div className="mt-3 inline-flex items-center gap-2 text-sm text-slate-600 px-3 py-1.5 rounded-full"
              style={{ background: 'var(--glass-bg)', backdropFilter: 'blur(10px)', border: '1px solid var(--glass-border)', boxShadow: 'var(--glass-shadow)' }}>
              当前排队: <span className="font-bold tabular-nums" style={{ color: 'var(--primary-color)' }}>{queueSize}</span> 人
            </div>
          </div>
          <div className="glass-card p-6 space-y-5" style={{ cursor: 'default' }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'none'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'none'; }}>
            <div>
              <label className="block text-xs text-slate-600 uppercase tracking-wider font-semibold mb-2">昵称</label>
              <Input ref={nicknameInputRef} value={nickname} onChange={v => setNickname(v)} placeholder="输入你的昵称"
                maxLength={{ length: 20, errorOnly: true }} size="large"
                onKeyDown={e => { e.stopPropagation(); if (e.key === 'Enter') joinQueue(); }} />
            </div>
            <div>
              <label className="block text-xs text-slate-600 uppercase tracking-wider font-semibold mb-2">选择座驾</label>
              <div className="flex gap-2 flex-wrap">
                {AVATARS.map((emoji, i) => (
                  <button key={i} onClick={() => setAvatar(i)}
                    className="text-2xl p-2.5 rounded-xl transition-all duration-300"
                    style={{
                      background: avatar === i ? 'rgba(99,102,241,0.12)' : 'rgba(255,255,255,0.75)',
                      border: avatar === i ? '1px solid rgba(99,102,241,0.4)' : '1px solid var(--glass-border)',
                      transform: avatar === i ? 'scale(1.1)' : 'scale(1)',
                      boxShadow: avatar === i ? '0 4px 12px rgba(99,102,241,0.2)' : 'none',
                    }}>{emoji}</button>
                ))}
              </div>
            </div>
            <Button type="primary" long size="large" onClick={joinQueue} style={{ height: '48px', fontSize: '16px', fontWeight: 700 }}>
              开始匹配
            </Button>
          </div>
        </div>
      )}

      {phase === 'queuing' && (
        <div className="max-w-md mx-auto text-center space-y-8">
          <div><h2 className="text-2xl font-extrabold text-slate-800 mb-2">正在匹配...</h2><p className="text-slate-700">等待其他玩家加入</p></div>
          <div className="relative flex items-center justify-center">
            <Spin size={80} />
            <div className="absolute"><span className="text-4xl">{AVATARS[avatar]}</span></div>
          </div>
          <div className="text-sm text-slate-600 space-y-1">
            <div>排队中: <span className="font-bold tabular-nums" style={{ color: 'var(--primary-color)' }}>{queueSize}</span> 人</div>
            <div className="text-xs text-slate-600">满 2 人即可开始，最多 5 人</div>
          </div>
          <Button onClick={() => { socket.emit('queue:leave'); setPhase('setup'); }}>取消匹配</Button>
        </div>
      )}

      {(phase === 'racing' || phase === 'finished' || phase === 'countdown') && room && (
        <div className="space-y-5">
          <RaceTrack players={room.players} textLength={text.length} currentPlayerId={socket.id ?? ''} />
          <Stats wpm={typingState.wpm} accuracy={typingState.accuracy} progress={typingState.currentIndex} total={text.length} timeElapsed={timeElapsed} />
          {phase === 'racing' && <TypingArea text={text} currentIndex={typingState.currentIndex} errors={typingState.errors} isComplete={typingState.isComplete} />}
          {phase === 'finished' && (
            <div className="space-y-5">
              <div className="glass-card p-4 sm:p-6" style={{ cursor: 'default' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'none'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'none'; }}>
                <h2 className="text-2xl font-extrabold text-center mb-6">
                  {currentPlayer?.rank === 1 ? <span style={{ color: '#f59e0b' }}>🏆 你赢了！</span> : <span className="text-slate-700">比赛结束</span>}
                </h2>
                <div className="space-y-2">
                  {[...room.players].sort((a, b) => (a.rank ?? 99) - (b.rank ?? 99)).map(player => (
                    <div key={player.id} className="flex items-center justify-between p-3.5 rounded-xl transition-all"
                      style={{
                        background: player.id === socket.id ? 'rgba(99,102,241,0.08)' : 'rgba(255,255,255,0.75)',
                        border: `1px solid ${player.id === socket.id ? 'rgba(99,102,241,0.2)' : 'var(--glass-border)'}`,
                      }}>
                      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                        <span className="text-base sm:text-xl font-extrabold w-6 sm:w-8 text-center shrink-0" style={{ color: player.rank === 1 ? '#f59e0b' : player.rank === 2 ? '#64748b' : player.rank === 3 ? '#b45309' : '#94a3b8' }}>
                          {player.rank === 1 ? '🥇' : player.rank === 2 ? '🥈' : player.rank === 3 ? '🥉' : `#${player.rank}`}
                        </span>
                        <span className="text-base sm:text-xl shrink-0">{getAvatar(player.avatar)}</span>
                        <span className="font-medium text-slate-800 text-sm truncate">{player.nickname}</span>
                        {player.id === socket.id && <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ color: 'var(--primary-color)', background: 'rgba(99,102,241,0.1)' }}>(你)</span>}
                      </div>
                      <div className="flex gap-2 sm:gap-4 text-xs sm:text-sm tabular-nums shrink-0">
                        <span style={{ color: 'var(--primary-color)' }}>{player.wpm} <span className="text-slate-600 text-xs">WPM</span></span>
                        <span className="text-slate-700">{player.accuracy}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="text-center">
                <Button type="primary" size="large" onClick={() => { setRoom(null); setText(''); reset(); setPhase('setup'); }}>再来一局</Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
