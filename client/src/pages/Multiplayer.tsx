import { useState, useEffect, useCallback, useRef } from 'react';
import { Input, Button, Spin } from '@arco-design/web-react';
import { fetchSeasonOverview } from '../lib/api';
import { socket, connectSocket } from '../lib/socket';
import { resumeAudioContext } from '../lib/sounds';
import { useTyping } from '../hooks/useTyping';
import { useElapsedTime } from '../hooks/useElapsedTime';
import { getDeviceId } from '../lib/device';
import TypingArea from '../components/TypingArea';
import RaceTrack from '../components/RaceTrack';
import Stats from '../components/Stats';
import Countdown from '../components/Countdown';
import { AVATARS, getAvatar } from '../lib/avatars';
import { t } from '../lib/i18n';
import { useLocale } from '../lib/hooks';
import { getStoredAvatar, getStoredNickname, saveStoredProfile } from '../lib/userPrefs';
import type { GameRoom, RoomPlayer } from '../types';

type GamePhase = 'setup' | 'queuing' | 'lobby' | 'countdown' | 'racing' | 'finished';
type Difficulty = 'easy' | 'medium' | 'hard';
type Language = 'en' | 'zh';

interface LobbyPlayer {
  readonly id: string;
  readonly nickname: string;
  readonly avatar: number;
}

function formatFinishTime(startTime: number | null, finishTime: number | null): string {
  if (!startTime || !finishTime) return '-';
  const ms = finishTime - startTime;
  const totalSeconds = Math.round(ms / 1000);
  if (totalSeconds < 60) return `${totalSeconds}s`;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return seconds > 0 ? `${minutes}m${seconds}s` : `${minutes}m`;
}

function copyText(text: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    return navigator.clipboard.writeText(text).catch(() => fallbackCopy(text));
  }
  return fallbackCopy(text);
}

function fallbackCopy(text: string): Promise<void> {
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand('copy');
  document.body.removeChild(textarea);
  return Promise.resolve();
}

export default function Multiplayer() {
  const locale = useLocale();
  const [phase, setPhase] = useState<GamePhase>('setup');
  const [nickname, setNickname] = useState(() => getStoredNickname());
  const [avatar, setAvatar] = useState(() => getStoredAvatar());
  const [queueSize, setQueueSize] = useState(0);
  const [room, setRoom] = useState<GameRoom | null>(null);
  const [text, setText] = useState('');
  const [countdownEnd, setCountdownEnd] = useState<number>(0);
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [language, setLanguage] = useState<Language>('en');
  const [season, setSeason] = useState<{
    player: {
      rank: number | null;
      rating: number;
      tier: string;
      matches: number;
      wins: number;
      podiums: number;
      avgWpm: number;
      avgAccuracy: number;
      winRate: number;
    };
    leaderboard: readonly {
      rank: number;
      deviceId: string;
      nickname: string;
      avatar: number;
      rating: number;
      wins: number;
      avgWpm: number;
      tier: string;
    }[];
    recentOpponents: readonly {
      deviceId: string;
      nickname: string;
      avatar: number;
      races: number;
      lastSeen: string;
    }[];
    friendLadder: readonly {
      deviceId: string;
      nickname: string;
      avatar: number;
      rating: number;
      tier: string;
    }[];
  } | null>(null);

  // Private room state
  const [joinRoomCode, setJoinRoomCode] = useState('');
  const [lobbyRoomId, setLobbyRoomId] = useState('');
  const [lobbyPlayers, setLobbyPlayers] = useState<readonly LobbyPlayer[]>([]);
  const [isHost, setIsHost] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);
  const [roomError, setRoomError] = useState('');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const nicknameInputRef = useRef<any>(null);
  const roomRef = useRef<GameRoom | null>(null);

  useEffect(() => {
    roomRef.current = room;
  }, [room]);

  const onProgress = useCallback((s: { currentIndex: number; correctChars: number; totalKeystrokes: number; errors: ReadonlySet<number> }) => {
    const r = roomRef.current;
    if (r) socket.emit('typing:progress', { roomId: r.id, progress: s.currentIndex, correctChars: s.correctChars, totalKeystrokes: s.totalKeystrokes, errorCount: s.errors.size });
  }, []);

  const { state: typingState, handleKeyDown, reset } = useTyping(text, onProgress);

  useEffect(() => {
    connectSocket();
    fetchSeasonOverview().then(setSeason).catch(() => setSeason(null));
    socket.on('queue:size', (d: { size: number }) => setQueueSize(d.size));
    socket.on('queue:joined', () => setPhase('queuing'));
    socket.on('match:found', (d: { roomId: string; text: string; players: RoomPlayer[] }) => {
      setText(d.text);
      setRoom({
        id: d.roomId, text: d.text,
        players: d.players.map(p => ({ ...p, progress: 0, wpm: 0, accuracy: 100, finished: false, finishTime: null, rank: null })),
        state: 'waiting', startTime: null, countdownEnd: null, maxPlayers: 5,
      });
    });
    socket.on('room:update', (d: GameRoom) => {
      setRoom(d);
      if (d.state === 'countdown' && d.countdownEnd) { setCountdownEnd(d.countdownEnd); setPhase('countdown'); }
      else if (d.state === 'racing') setPhase('racing');
      else if (d.state === 'finished') setPhase('finished');
    });
    socket.on('race:start', () => setPhase('racing'));
    socket.on('race:finish', (d: GameRoom) => { setRoom(d); setPhase('finished'); });
    socket.on('player:left', (d: { playerId: string }) => {
      setRoom(prev => prev ? { ...prev, players: prev.players.filter(p => p.id !== d.playerId) } : prev);
      setLobbyPlayers(prev => prev.filter(p => p.id !== d.playerId));
    });

    // Private room events
    socket.on('room:created', (d: { roomId: string; text: string; players: LobbyPlayer[]; difficulty: string; language: string }) => {
      setLobbyRoomId(d.roomId);
      setLobbyPlayers(d.players);
      setIsHost(true);
      setText(d.text);
      setPhase('lobby');
    });
    socket.on('room:player-joined', (d: { players: LobbyPlayer[] }) => {
      setLobbyPlayers(d.players);
    });
    socket.on('room:error', (d: { message: string }) => {
      setRoomError(d.message);
      setTimeout(() => setRoomError(''), 3000);
    });

    return () => {
      ['queue:size', 'queue:joined', 'match:found', 'room:update', 'race:start', 'race:finish', 'player:left', 'room:created', 'room:player-joined', 'room:error'].forEach(e => socket.off(e));
    };
  }, []);

  useEffect(() => {
    if (phase === 'racing') {
      reset();
      const handler = (e: KeyboardEvent) => { resumeAudioContext(); handleKeyDown(e); };
      window.addEventListener('keydown', handler);
      return () => window.removeEventListener('keydown', handler);
    }
  }, [phase, handleKeyDown, reset]);

  const joinQueue = () => {
    if (!nickname.trim()) { nicknameInputRef.current?.focus(); return; }
    const deviceId = getDeviceId();
    saveStoredProfile(nickname.trim(), avatar);
    resumeAudioContext();
    socket.emit('queue:join', { deviceId, nickname: nickname.trim(), avatar, difficulty, language });
  };

  const createPrivateRoom = () => {
    if (!nickname.trim()) { nicknameInputRef.current?.focus(); return; }
    const deviceId = getDeviceId();
    saveStoredProfile(nickname.trim(), avatar);
    resumeAudioContext();
    socket.emit('room:create-private', { deviceId, nickname: nickname.trim(), avatar, difficulty, language });
  };

  const joinPrivateRoom = () => {
    if (!joinRoomCode.trim()) return;
    if (!nickname.trim()) { nicknameInputRef.current?.focus(); return; }
    const deviceId = getDeviceId();
    saveStoredProfile(nickname.trim(), avatar);
    resumeAudioContext();
    socket.emit('room:join-private', { roomId: joinRoomCode.trim(), deviceId, nickname: nickname.trim(), avatar });
    setLobbyRoomId(joinRoomCode.trim());
    setIsHost(false);
    setPhase('lobby');
  };

  const startPrivateRace = () => {
    socket.emit('room:start-private', { roomId: lobbyRoomId });
  };

  const copyRoomCode = () => {
    copyText(lobbyRoomId).then(() => {
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    });
  };

  const backToSetup = () => {
    setRoom(null);
    setText('');
    reset();
    setLobbyRoomId('');
    setLobbyPlayers([]);
    setIsHost(false);
    setJoinRoomCode('');
    setPhase('setup');
  };

  const playAgain = () => {
    if (lobbyRoomId && isHost) {
      // Private room: create a new room with same settings
      backToSetup();
      setTimeout(() => createPrivateRoom(), 100);
    } else {
      backToSetup();
    }
  };

  const currentPlayer = room?.players.find(p => p.id === socket.id);
  const timeElapsed = useElapsedTime(typingState.startTime, typingState.endTime);

  const difficultyOptions: { value: Difficulty; labelKey: 'practice.easy' | 'practice.medium' | 'practice.hard' }[] = [
    { value: 'easy', labelKey: 'practice.easy' },
    { value: 'medium', labelKey: 'practice.medium' },
    { value: 'hard', labelKey: 'practice.hard' },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {phase === 'countdown' && countdownEnd > 0 && <Countdown countdownEnd={countdownEnd} />}

      {/* ===== SETUP PHASE ===== */}
      {phase === 'setup' && (
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium mb-4"
              style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)', color: '#8b5cf6' }}>
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
              {t('multiplayer.realtime', locale)}
            </div>
            <h1 className="text-3xl font-extrabold mb-2" style={{
              background: 'linear-gradient(135deg, var(--text-primary) 0%, var(--primary-color) 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            }}>{t('multiplayer.title', locale)}</h1>
            <p style={{ color: 'var(--text-secondary)' }}>{t('multiplayer.subtitle', locale)}</p>
            <div className="mt-3 inline-flex items-center gap-2 text-sm px-3 py-1.5 rounded-full"
              style={{ color: 'var(--text-muted)', background: 'var(--glass-bg)', backdropFilter: 'blur(10px)', border: '1px solid var(--glass-border)', boxShadow: 'var(--glass-shadow)' }}>
              {t('multiplayer.queueCount', locale)}: <span className="font-bold tabular-nums" style={{ color: 'var(--primary-color)' }}>{queueSize}</span> {t('multiplayer.players', locale)}
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-[420px,1fr] gap-6 items-start">
            <div className="glass-card p-6 space-y-5" style={{ cursor: 'default' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'none'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'none'; }}>
              {/* Nickname */}
              <div>
                <label className="block text-xs uppercase tracking-wider font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>
                  {t('multiplayer.nickname', locale)}
                </label>
                <Input ref={nicknameInputRef} value={nickname} onChange={v => setNickname(v)} placeholder={t('multiplayer.nicknamePlaceholder', locale)}
                  maxLength={{ length: 20, errorOnly: true }} size="large"
                  onKeyDown={e => { e.stopPropagation(); if (e.key === 'Enter') joinQueue(); }} />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>
                  {t('multiplayer.avatar', locale)}
                </label>
                <div className="flex gap-2 flex-wrap">
                  {AVATARS.map((emoji, i) => (
                    <button key={i} onClick={() => setAvatar(i)}
                      className="text-2xl p-2.5 rounded-xl transition-all duration-300"
                      style={{
                        background: avatar === i ? 'rgba(99,102,241,0.12)' : 'var(--glass-bg)',
                        border: avatar === i ? '1px solid rgba(99,102,241,0.4)' : '1px solid var(--glass-border)',
                        transform: avatar === i ? 'scale(1.1)' : 'scale(1)',
                        boxShadow: avatar === i ? '0 4px 12px rgba(99,102,241,0.2)' : 'none',
                      }}>{emoji}</button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>
                  {t('multiplayer.difficulty', locale)}
                </label>
                <div className="flex gap-2">
                  {difficultyOptions.map(opt => (
                    <button key={opt.value} onClick={() => setDifficulty(opt.value)}
                      className="flex-1 py-2 px-3 rounded-xl text-sm font-medium transition-all duration-200"
                      style={{
                        background: difficulty === opt.value ? 'rgba(99,102,241,0.12)' : 'var(--glass-bg)',
                        border: difficulty === opt.value ? '1px solid rgba(99,102,241,0.4)' : '1px solid var(--glass-border)',
                        color: difficulty === opt.value ? 'var(--primary-color)' : 'var(--text-secondary)',
                      }}>
                      {t(opt.labelKey, locale)}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>
                  {t('multiplayer.language', locale)}
                </label>
                <div className="flex gap-2">
                  {([
                    { value: 'en' as Language, labelKey: 'multiplayer.langEn' as const },
                    { value: 'zh' as Language, labelKey: 'multiplayer.langZh' as const },
                  ]).map(opt => (
                    <button key={opt.value} onClick={() => setLanguage(opt.value)}
                      className="flex-1 py-2 px-3 rounded-xl text-sm font-medium transition-all duration-200"
                      style={{
                        background: language === opt.value ? 'rgba(99,102,241,0.12)' : 'var(--glass-bg)',
                        border: language === opt.value ? '1px solid rgba(99,102,241,0.4)' : '1px solid var(--glass-border)',
                        color: language === opt.value ? 'var(--primary-color)' : 'var(--text-secondary)',
                      }}>
                      {t(opt.labelKey, locale)}
                    </button>
                  ))}
                </div>
              </div>

              <Button type="primary" long size="large" onClick={joinQueue} style={{ height: '48px', fontSize: '16px', fontWeight: 700 }}>
                {t('multiplayer.startMatch', locale)}
              </Button>

              <div className="flex items-center gap-3">
                <div className="flex-1 h-px" style={{ background: 'var(--glass-border)' }} />
                <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>{t('multiplayer.or', locale)}</span>
                <div className="flex-1 h-px" style={{ background: 'var(--glass-border)' }} />
              </div>

              <div className="space-y-3">
                <label className="block text-xs uppercase tracking-wider font-semibold" style={{ color: 'var(--text-muted)' }}>
                  {t('multiplayer.privateRoom', locale)}
                </label>
                <Button long onClick={createPrivateRoom} style={{ height: '40px' }}>
                  {t('multiplayer.createRoom', locale)}
                </Button>
                <div className="flex gap-2">
                  <Input value={joinRoomCode} onChange={v => setJoinRoomCode(v)}
                    placeholder={t('multiplayer.roomCodePlaceholder', locale)}
                    onKeyDown={e => { e.stopPropagation(); if (e.key === 'Enter') joinPrivateRoom(); }} />
                  <Button onClick={joinPrivateRoom} disabled={!joinRoomCode.trim()}>
                    {t('multiplayer.joinRoom', locale)}
                  </Button>
                </div>
                {roomError && (
                  <div className="text-xs text-red-500 text-center">{roomError}</div>
                )}
              </div>
            </div>

            {season && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <SeasonStat label={locale === 'zh' ? '段位' : 'Tier'} value={season.player.tier} color="#8b5cf6" />
                  <SeasonStat label={locale === 'zh' ? '赛季积分' : 'Rating'} value={String(season.player.rating)} color="#6366f1" />
                  <SeasonStat label={locale === 'zh' ? '胜率' : 'Win Rate'} value={`${season.player.winRate}%`} color="#10b981" />
                  <SeasonStat label={locale === 'zh' ? '平均 WPM' : 'Avg WPM'} value={String(season.player.avgWpm)} color="#f97316" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="glass-card p-5" style={{ cursor: 'default' }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'none'; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'none'; }}>
                    <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
                      {locale === 'zh' ? '赛季榜前列' : 'Season Leaders'}
                    </h3>
                    <div className="space-y-3">
                      {season.leaderboard.slice(0, 5).map(entry => (
                        <div key={entry.deviceId} className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <span className="text-xs font-bold w-6 text-center" style={{ color: 'var(--text-muted)' }}>#{entry.rank}</span>
                            <span className="text-xl">{getAvatar(entry.avatar)}</span>
                            <div>
                              <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{entry.nickname}</div>
                              <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{entry.tier} · {entry.wins}W</div>
                            </div>
                          </div>
                          <div className="text-right text-xs">
                            <div style={{ color: '#6366f1' }}>{entry.rating}</div>
                            <div style={{ color: 'var(--text-muted)' }}>{entry.avgWpm} WPM</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="glass-card p-5" style={{ cursor: 'default' }}
                      onMouseEnter={e => { e.currentTarget.style.transform = 'none'; }}
                      onMouseLeave={e => { e.currentTarget.style.transform = 'none'; }}>
                      <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
                        {locale === 'zh' ? '最近对手' : 'Recent Rivals'}
                      </h3>
                      {season.recentOpponents.length === 0 ? (
                        <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                          {locale === 'zh' ? '再打几场后，这里会记录你的对手池。' : 'Race a few matches to build your rival pool.'}
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {season.recentOpponents.map(opponent => (
                            <div key={opponent.deviceId} className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <span className="text-lg">{getAvatar(opponent.avatar)}</span>
                                <div>
                                  <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{opponent.nickname}</div>
                                  <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{opponent.races} races</div>
                                </div>
                              </div>
                              <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                                {new Date(opponent.lastSeen.endsWith('Z') ? opponent.lastSeen : `${opponent.lastSeen}Z`).toLocaleDateString()}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="glass-card p-5" style={{ cursor: 'default' }}
                      onMouseEnter={e => { e.currentTarget.style.transform = 'none'; }}
                      onMouseLeave={e => { e.currentTarget.style.transform = 'none'; }}>
                      <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
                        {locale === 'zh' ? '好友天梯' : 'Friend Ladder'}
                      </h3>
                      {season.friendLadder.length === 0 ? (
                        <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                          {locale === 'zh' ? '添加好友后，这里会显示同赛季对比。' : 'Add friends to compare your season race.'}
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {season.friendLadder.map(friend => (
                            <div key={friend.deviceId} className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <span className="text-lg">{getAvatar(friend.avatar)}</span>
                                <div>
                                  <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{friend.nickname}</div>
                                  <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{friend.tier}</div>
                                </div>
                              </div>
                              <div className="text-xs font-semibold" style={{ color: '#6366f1' }}>{friend.rating}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===== QUEUING PHASE ===== */}
      {phase === 'queuing' && (
        <div className="max-w-md mx-auto text-center space-y-8">
          <div>
            <h2 className="text-2xl font-extrabold mb-2" style={{ color: 'var(--text-primary)' }}>{t('multiplayer.matching', locale)}</h2>
            <p style={{ color: 'var(--text-secondary)' }}>{t('multiplayer.matchWait', locale)}</p>
          </div>
          <div className="relative flex items-center justify-center">
            <Spin size={80} />
            <div className="absolute"><span className="text-4xl">{AVATARS[avatar]}</span></div>
          </div>
          <div className="text-sm space-y-1" style={{ color: 'var(--text-muted)' }}>
            <div>{t('multiplayer.queueing', locale)}: <span className="font-bold tabular-nums" style={{ color: 'var(--primary-color)' }}>{queueSize}</span> {t('multiplayer.players', locale)}</div>
            <div className="text-xs">{t('multiplayer.queueHint', locale)}</div>
          </div>
          <Button onClick={() => { socket.emit('queue:leave'); setPhase('setup'); }}>
            {t('multiplayer.cancelMatch', locale)}
          </Button>
        </div>
      )}

      {/* ===== LOBBY PHASE (Private Room Waiting) ===== */}
      {phase === 'lobby' && (
        <div className="max-w-md mx-auto space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-extrabold mb-2" style={{ color: 'var(--text-primary)' }}>{t('multiplayer.lobby', locale)}</h2>
            <p style={{ color: 'var(--text-secondary)' }}>{t('multiplayer.waitingPlayers', locale)}</p>
          </div>

          <div className="glass-card p-6 space-y-5" style={{ cursor: 'default' }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'none'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'none'; }}>
            {/* Room Code */}
            <div>
              <label className="block text-xs uppercase tracking-wider font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>
                {t('multiplayer.roomCode', locale)}
              </label>
              <div className="flex gap-2 items-center">
                <div className="flex-1 px-4 py-3 rounded-xl text-center font-mono text-2xl font-bold tracking-widest"
                  style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', color: 'var(--primary-color)' }}>
                  {lobbyRoomId}
                </div>
                <Button onClick={copyRoomCode} style={{ height: '48px' }}>
                  {codeCopied ? t('multiplayer.codeCopied', locale) : t('multiplayer.copyCode', locale)}
                </Button>
              </div>
            </div>

            {/* Player List */}
            <div>
              <label className="block text-xs uppercase tracking-wider font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>
                {t('multiplayer.playerCount', locale)} ({lobbyPlayers.length}/5)
              </label>
              <div className="space-y-2">
                {lobbyPlayers.map((p, idx) => (
                  <div key={p.id} className="flex items-center gap-3 p-3 rounded-xl" style={{
                    background: p.id === socket.id ? 'rgba(99,102,241,0.08)' : 'var(--glass-bg)',
                    border: `1px solid ${p.id === socket.id ? 'rgba(99,102,241,0.2)' : 'var(--glass-border)'}`,
                  }}>
                    <span className="text-xl">{getAvatar(p.avatar)}</span>
                    <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{p.nickname}</span>
                    {idx === 0 && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded ml-auto" style={{ color: '#f59e0b', background: 'rgba(245,158,11,0.1)' }}>HOST</span>
                    )}
                    {p.id === socket.id && idx !== 0 && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded ml-auto" style={{ color: 'var(--primary-color)', background: 'rgba(99,102,241,0.1)' }}>(你)</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Start / Waiting */}
            {isHost ? (
              <Button type="primary" long size="large" onClick={startPrivateRace}
                disabled={lobbyPlayers.length < 1}
                style={{ height: '48px', fontSize: '16px', fontWeight: 700 }}>
                {t('multiplayer.startRace', locale)}
              </Button>
            ) : (
              <div className="text-center py-3" style={{ color: 'var(--text-muted)' }}>
                <Spin size={20} style={{ marginRight: '8px' }} />
                {t('multiplayer.waitingHost', locale)}
              </div>
            )}

            <div className="text-center">
              <Button size="small" onClick={backToSetup}>
                {t('multiplayer.backToSetup', locale)}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ===== RACING / FINISHED / COUNTDOWN ===== */}
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
                  {currentPlayer?.rank === 1
                    ? <span style={{ color: '#f59e0b' }}>🏆 {t('multiplayer.youWin', locale)}</span>
                    : <span style={{ color: 'var(--text-primary)' }}>{t('multiplayer.raceOver', locale)}</span>}
                </h2>
                <div className="space-y-2">
                  {[...room.players].sort((a, b) => (a.rank ?? 99) - (b.rank ?? 99)).map(player => (
                    <div key={player.id} className="flex items-center justify-between p-3.5 rounded-xl transition-all"
                      style={{
                        background: player.id === socket.id ? 'rgba(99,102,241,0.08)' : 'var(--glass-bg)',
                        border: `1px solid ${player.id === socket.id ? 'rgba(99,102,241,0.2)' : 'var(--glass-border)'}`,
                      }}>
                      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                        <span className="text-base sm:text-xl font-extrabold w-6 sm:w-8 text-center shrink-0" style={{ color: player.rank === 1 ? '#f59e0b' : player.rank === 2 ? '#64748b' : player.rank === 3 ? '#b45309' : '#94a3b8' }}>
                          {player.rank === 1 ? '🥇' : player.rank === 2 ? '🥈' : player.rank === 3 ? '🥉' : `#${player.rank}`}
                        </span>
                        <span className="text-base sm:text-xl shrink-0">{getAvatar(player.avatar)}</span>
                        <span className="font-medium text-sm truncate" style={{ color: 'var(--text-primary)' }}>{player.nickname}</span>
                        {player.id === socket.id && <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ color: 'var(--primary-color)', background: 'rgba(99,102,241,0.1)' }}>(你)</span>}
                      </div>
                      <div className="flex gap-2 sm:gap-4 text-xs sm:text-sm tabular-nums shrink-0">
                        <span style={{ color: 'var(--primary-color)' }}>{player.wpm} <span className="text-xs" style={{ color: 'var(--text-muted)' }}>WPM</span></span>
                        <span style={{ color: 'var(--text-secondary)' }}>{player.accuracy}%</span>
                        <span style={{ color: 'var(--text-muted)' }}>{formatFinishTime(room.startTime, player.finishTime)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="text-center flex gap-3 justify-center">
                <Button type="primary" size="large" onClick={playAgain}>
                  {t('multiplayer.playAgain', locale)}
                </Button>
                <Button size="large" onClick={backToSetup}>
                  {t('multiplayer.backToSetup', locale)}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SeasonStat({ label, value, color }: { readonly label: string; readonly value: string; readonly color: string }) {
  return (
    <div className="glass-card p-4" style={{ cursor: 'default' }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'none'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'none'; }}>
      <div className="text-[11px] font-medium mb-1" style={{ color: 'var(--text-muted)' }}>{label}</div>
      <div className="text-xl font-bold tabular-nums" style={{ color }}>{value}</div>
    </div>
  );
}
