import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@arco-design/web-react';
import { getRandomWord, getRandomWords } from '../../lib/gameWords';
import { useLocale } from '../../lib/hooks';
import { calculateXp } from '../../lib/i18n';
import { playKeySound, playErrorSound, playCompleteSound } from '../../lib/sounds';
import { submitGameScore } from '../../lib/api';
import GameLeaderboard from './GameLeaderboard';

const MAP_SIZE = 5;
const CELL_PX = 64;
const INITIAL_HP = 100;

type RoomType = 'start' | 'exit' | 'battle' | 'treasure' | 'trap' | 'heal' | 'empty';
type GameState = 'idle' | 'exploring' | 'battle' | 'trap' | 'treasure' | 'heal' | 'victory' | 'defeat';

interface Room {
  readonly x: number;
  readonly y: number;
  readonly type: RoomType;
  readonly visited: boolean;
  readonly revealed: boolean;
  readonly word: string;
  readonly icon: string;
}

interface BattleState {
  readonly enemyName: string;
  readonly enemyNameZh: string;
  readonly enemyEmoji: string;
  readonly enemyHp: number;
  readonly enemyMaxHp: number;
  readonly words: readonly string[];
  readonly currentWordIdx: number;
  readonly input: string;
}

interface TrapState {
  readonly word: string;
  readonly timeLeft: number;
  readonly damage: number;
  readonly input: string;
}

interface Position {
  readonly x: number;
  readonly y: number;
}

interface Props {
  readonly onBack: () => void;
}

const ROOM_ICONS: Record<RoomType, string> = {
  start: '🏠', exit: '🚪', battle: '⚔️', treasure: '🎁', trap: '⚠️', heal: '✨', empty: '·',
};

interface Enemy {
  readonly name: string;
  readonly nameZh: string;
  readonly emoji: string;
  readonly hp: number;
  readonly wordCount: number;
}

const ENEMIES: readonly Enemy[] = [
  { name: 'Goblin', nameZh: '哥布林', emoji: '👺', hp: 50, wordCount: 3 },
  { name: 'Skeleton', nameZh: '骷髅', emoji: '💀', hp: 70, wordCount: 4 },
  { name: 'Shadow', nameZh: '暗影', emoji: '🦇', hp: 90, wordCount: 5 },
];

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateMap(difficulty: 'easy' | 'medium' | 'hard'): Room[][] {
  const wordDiff = difficulty === 'hard' ? 'medium' : 'easy';
  const map: Room[][] = Array.from({ length: MAP_SIZE }, (_, y) =>
    Array.from({ length: MAP_SIZE }, (_, x) => ({
      x, y, type: 'empty' as RoomType, visited: false, revealed: false,
      word: getRandomWord(wordDiff), icon: ROOM_ICONS.empty,
    }))
  );

  // Start and exit
  map[0][0] = { ...map[0][0], type: 'start', icon: '🏠', visited: true, revealed: true };
  map[4][4] = { ...map[4][4], type: 'exit', icon: '🚪' };

  // Distribute room types to remaining 23 cells
  const positions: Position[] = [];
  for (let y = 0; y < MAP_SIZE; y++) {
    for (let x = 0; x < MAP_SIZE; x++) {
      if ((x === 0 && y === 0) || (x === 4 && y === 4)) continue;
      positions.push({ x, y });
    }
  }

  // Shuffle
  for (let i = positions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [positions[i], positions[j]] = [positions[j], positions[i]];
  }

  const distribution: RoomType[] = [
    ...Array(randInt(8, 9)).fill('battle'),
    ...Array(randInt(4, 5)).fill('treasure'),
    ...Array(randInt(3, 4)).fill('trap'),
    ...Array(randInt(2, 3)).fill('heal'),
  ];
  // Fill rest with empty
  while (distribution.length < 23) distribution.push('empty');
  // Shuffle distribution
  for (let i = distribution.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [distribution[i], distribution[j]] = [distribution[j], distribution[i]];
  }

  positions.forEach((pos, idx) => {
    const type = distribution[idx];
    map[pos.y][pos.x] = {
      ...map[pos.y][pos.x],
      type,
      icon: ROOM_ICONS[type],
    };
  });

  // Reveal neighbors of start
  revealNeighbors(map, 0, 0);

  return map;
}

function revealNeighbors(map: Room[][], x: number, y: number): Room[][] {
  const dirs = [[0, -1], [0, 1], [-1, 0], [1, 0]];
  for (const [dx, dy] of dirs) {
    const nx = x + dx;
    const ny = y + dy;
    if (nx >= 0 && nx < MAP_SIZE && ny >= 0 && ny < MAP_SIZE && !map[ny][nx].revealed) {
      map[ny][nx] = { ...map[ny][nx], revealed: true };
    }
  }
  return map;
}

export default function DungeonCrawler({ onBack }: Props) {
  const locale = useLocale();
  const [gameState, setGameState] = useState<GameState>('idle');
  const [map, setMap] = useState<Room[][]>([]);
  const [playerPos, setPlayerPos] = useState<Position>({ x: 0, y: 0 });
  const [playerHp, setPlayerHp] = useState(INITIAL_HP);
  const [playerGold, setPlayerGold] = useState(0);
  const [roomsVisited, setRoomsVisited] = useState(1);
  const [monstersKilled, setMonstersKilled] = useState(0);
  const [moveInput, setMoveInput] = useState('');
  const [battleState, setBattleState] = useState<BattleState | null>(null);
  const [trapState, setTrapState] = useState<TrapState | null>(null);
  const [eventMessage, setEventMessage] = useState('');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');

  const inputRef = useRef<HTMLInputElement>(null);
  const trapTimerRef = useRef<ReturnType<typeof setInterval>>(undefined);
  const playerHpRef = useRef(INITIAL_HP);
  const playerGoldRef = useRef(0);
  const monstersKilledRef = useRef(0);
  const roomsVisitedRef = useRef(1);

  const startGame = useCallback(() => {
    const newMap = generateMap(difficulty);
    setMap(newMap);
    setPlayerPos({ x: 0, y: 0 });
    setPlayerHp(INITIAL_HP);
    playerHpRef.current = INITIAL_HP;
    setPlayerGold(0);
    playerGoldRef.current = 0;
    setRoomsVisited(1);
    roomsVisitedRef.current = 1;
    setMonstersKilled(0);
    monstersKilledRef.current = 0;
    setMoveInput('');
    setBattleState(null);
    setTrapState(null);
    setEventMessage('');
    setGameState('exploring');
    inputRef.current?.focus();
  }, [difficulty]);

  const saveXp = useCallback(() => {
    const xp = calculateXp(0, 100, roomsVisitedRef.current * 5, monstersKilledRef.current) + playerGoldRef.current;
    const currentXp = parseInt(localStorage.getItem('typerace_xp') || '0');
    localStorage.setItem('typerace_xp', String(currentXp + xp));
    const score = playerGoldRef.current + monstersKilledRef.current * 10;
    submitGameScore({ gameId: 'dungeon', score, difficulty }).catch(() => {});
  }, [difficulty]);

  const checkDefeat = useCallback((hp: number): boolean => {
    if (hp <= 0) {
      setPlayerHp(0);
      playerHpRef.current = 0;
      setGameState('defeat');
      playErrorSound();
      saveXp();
      return true;
    }
    return false;
  }, [saveXp]);

  const enterRoom = useCallback((room: Room) => {
    switch (room.type) {
      case 'exit':
        setGameState('victory');
        playCompleteSound();
        saveXp();
        break;

      case 'battle': {
        const enemy = ENEMIES[Math.floor(Math.random() * ENEMIES.length)];
        const words = getRandomWords(enemy.wordCount, difficulty);
        setBattleState({
          enemyName: enemy.name,
          enemyNameZh: enemy.nameZh,
          enemyEmoji: enemy.emoji,
          enemyHp: enemy.hp,
          enemyMaxHp: enemy.hp,
          words,
          currentWordIdx: 0,
          input: '',
        });
        setGameState('battle');
        break;
      }

      case 'trap': {
        const damage = randInt(15, 25);
        setTrapState({
          word: getRandomWord(difficulty),
          timeLeft: 5,
          damage,
          input: '',
        });
        setGameState('trap');
        break;
      }

      case 'treasure': {
        const gold = randInt(20, 50);
        playerGoldRef.current += gold;
        setPlayerGold(playerGoldRef.current);
        setEventMessage(locale === 'zh' ? `打开宝箱获得 ${gold} 金币！` : `Opened chest: +${gold} gold!`);
        setGameState('treasure');
        playKeySound();
        break;
      }

      case 'heal': {
        const heal = randInt(20, 30);
        const newHp = Math.min(INITIAL_HP, playerHpRef.current + heal);
        playerHpRef.current = newHp;
        setPlayerHp(newHp);
        setEventMessage(locale === 'zh' ? `回血泉恢复 ${heal} HP！` : `Healing spring: +${heal} HP!`);
        setGameState('heal');
        playKeySound();
        break;
      }

      default:
        setEventMessage(locale === 'zh' ? '空房间，什么也没有。' : 'Empty room. Nothing here.');
        setTimeout(() => {
          setEventMessage('');
          setGameState('exploring');
        }, 800);
        break;
    }
  }, [difficulty, locale, saveXp]);

  // Trap timer
  useEffect(() => {
    if (gameState !== 'trap' || !trapState) return;
    trapTimerRef.current = setInterval(() => {
      setTrapState(prev => {
        if (!prev) return null;
        const newTime = prev.timeLeft - 1;
        if (newTime <= 0) {
          // Failed - take damage
          clearInterval(trapTimerRef.current);
          const newHp = playerHpRef.current - prev.damage;
          playerHpRef.current = newHp;
          setPlayerHp(newHp);
          playErrorSound();
          if (!checkDefeat(newHp)) {
            setEventMessage(locale === 'zh' ? `陷阱触发！-${prev.damage} HP` : `Trap triggered! -${prev.damage} HP`);
            setTimeout(() => {
              setEventMessage('');
              setGameState('exploring');
            }, 1000);
          }
          return null;
        }
        return { ...prev, timeLeft: newTime };
      });
    }, 1000);
    return () => { if (trapTimerRef.current) clearInterval(trapTimerRef.current); };
  }, [gameState, trapState, locale, checkDefeat]);

  const getAdjacentRooms = useCallback((): Array<{ room: Room; dir: string; emoji: string }> => {
    const dirs = [
      { dx: 0, dy: -1, dir: 'up', emoji: '⬆️' },
      { dx: 0, dy: 1, dir: 'down', emoji: '⬇️' },
      { dx: -1, dy: 0, dir: 'left', emoji: '⬅️' },
      { dx: 1, dy: 0, dir: 'right', emoji: '➡️' },
    ];
    const results: Array<{ room: Room; dir: string; emoji: string }> = [];
    for (const { dx, dy, dir, emoji } of dirs) {
      const nx = playerPos.x + dx;
      const ny = playerPos.y + dy;
      if (nx >= 0 && nx < MAP_SIZE && ny >= 0 && ny < MAP_SIZE && map[ny]?.[nx]?.revealed) {
        results.push({ room: map[ny][nx], dir, emoji });
      }
    }
    return results;
  }, [playerPos, map]);

  const handleMoveInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (gameState !== 'exploring') return;
    const val = e.target.value.trim().toLowerCase();
    setMoveInput(val);

    const adjacent = getAdjacentRooms();
    const match = adjacent.find(a => a.room.word === val);
    if (match) {
      setMoveInput('');
      const { room } = match;
      const newPos = { x: room.x, y: room.y };
      setPlayerPos(newPos);

      // Mark visited and reveal neighbors
      const newMap = map.map(row => row.map(r => ({ ...r })));
      newMap[room.y][room.x] = { ...newMap[room.y][room.x], visited: true };
      revealNeighbors(newMap, room.x, room.y);
      setMap(newMap);

      roomsVisitedRef.current++;
      setRoomsVisited(roomsVisitedRef.current);

      enterRoom(room);
    }
  };

  const handleBattleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (gameState !== 'battle' || !battleState) return;
    const val = e.target.value.trim().toLowerCase();
    setBattleState({ ...battleState, input: val });

    const currentWord = battleState.words[battleState.currentWordIdx];
    if (val === currentWord) {
      playKeySound();
      const damage = randInt(15, 25);
      const newEnemyHp = Math.max(0, battleState.enemyHp - damage);
      const nextIdx = battleState.currentWordIdx + 1;

      if (newEnemyHp <= 0 || nextIdx >= battleState.words.length) {
        // Enemy defeated
        monstersKilledRef.current++;
        setMonstersKilled(monstersKilledRef.current);
        const gold = randInt(10, 20);
        playerGoldRef.current += gold;
        setPlayerGold(playerGoldRef.current);
        setBattleState(null);
        setEventMessage(locale === 'zh' ? `击败了${battleState.enemyNameZh}！+${gold} 金币` : `Defeated ${battleState.enemyName}! +${gold} gold`);
        setTimeout(() => {
          setEventMessage('');
          setGameState('exploring');
        }, 1200);
      } else {
        setBattleState({
          ...battleState,
          enemyHp: newEnemyHp,
          currentWordIdx: nextIdx,
          input: '',
        });
      }
    } else if (val.length > 0 && !currentWord.startsWith(val)) {
      // Wrong input - enemy counterattack
      playErrorSound();
      const newHp = playerHpRef.current - 5;
      playerHpRef.current = newHp;
      setPlayerHp(newHp);
      setBattleState({ ...battleState, input: '' });
      checkDefeat(newHp);
    }
  };

  const handleTrapInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (gameState !== 'trap' || !trapState) return;
    const val = e.target.value.trim().toLowerCase();
    setTrapState({ ...trapState, input: val });

    if (val === trapState.word) {
      if (trapTimerRef.current) clearInterval(trapTimerRef.current);
      playKeySound();
      setTrapState(null);
      setEventMessage(locale === 'zh' ? '成功避开陷阱！' : 'Trap disarmed!');
      setTimeout(() => {
        setEventMessage('');
        setGameState('exploring');
      }, 800);
    }
  };

  const handleContinue = () => {
    setEventMessage('');
    setGameState('exploring');
    inputRef.current?.focus();
  };

  const hpPercent = (playerHp / INITIAL_HP) * 100;
  const hpColor = hpPercent > 60 ? '#22c55e' : hpPercent > 30 ? '#eab308' : '#ef4444';

  return (
    <div>
      {gameState === 'idle' && (
        <div className="glass-card p-8 text-center space-y-4" style={{ cursor: 'default' }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'none'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'none'; }}>
          <div className="text-6xl mb-4">🏰</div>
          <h2 className="text-2xl font-extrabold" style={{ color: 'var(--text-primary)' }}>
            {locale === 'zh' ? '地牢探险' : 'Dungeon Crawler'}
          </h2>
          <p style={{ color: 'var(--text-secondary)' }}>
            {locale === 'zh'
              ? '探索5×5地牢，输入单词移动到相邻房间。战斗怪物、收集宝藏、避开陷阱，到达出口🚪即为胜利！'
              : 'Explore a 5×5 dungeon by typing words to move. Battle monsters, collect treasure, avoid traps. Reach the exit 🚪 to win!'}
          </p>
          <div className="flex justify-center gap-2">
            {(['easy', 'medium', 'hard'] as const).map(d => (
              <button key={d} onClick={() => setDifficulty(d)}
                className="px-4 py-2 rounded-xl text-sm font-medium transition-all"
                style={{
                  background: difficulty === d ? 'rgba(99,102,241,0.15)' : 'var(--bg-card)',
                  color: difficulty === d ? 'var(--primary-color)' : 'var(--text-secondary)',
                  border: `1px solid ${difficulty === d ? 'var(--primary-color)' : 'var(--glass-border)'}`,
                }}>
                {d === 'easy' ? (locale === 'zh' ? '简单' : 'Easy') : d === 'medium' ? (locale === 'zh' ? '中等' : 'Medium') : (locale === 'zh' ? '困难' : 'Hard')}
              </button>
            ))}
          </div>
          <Button type="primary" size="large" onClick={startGame}>
            {locale === 'zh' ? '开始冒险' : 'Start Adventure'}
          </Button>
        </div>
      )}

      {(gameState === 'exploring' || gameState === 'battle' || gameState === 'trap' || gameState === 'treasure' || gameState === 'heal') && (
        <div>
          {/* HUD */}
          <div className="glass-card p-3 mb-4" style={{ cursor: 'default' }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'none'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'none'; }}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-4 text-sm">
                <span style={{ color: 'var(--text-secondary)' }}>🧙 HP:</span>
                <div className="flex items-center gap-2">
                  <div style={{ width: '120px', height: '12px', background: 'rgba(128,128,128,0.2)', borderRadius: '6px', overflow: 'hidden' }}>
                    <div style={{ width: `${hpPercent}%`, height: '100%', background: hpColor, borderRadius: '6px', transition: 'width 0.3s' }} />
                  </div>
                  <span style={{ color: hpColor, fontWeight: 700, fontSize: '13px' }}>{playerHp}/{INITIAL_HP}</span>
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <span style={{ color: '#eab308' }}>💰 {playerGold}</span>
                <span style={{ color: 'var(--text-secondary)' }}>{locale === 'zh' ? '房间' : 'Rooms'}: {roomsVisited}/25</span>
              </div>
            </div>
          </div>

          {/* Map */}
          <div className="flex justify-center mb-4">
            <div className="rounded-2xl p-3" style={{
              background: 'var(--glass-bg)',
              border: '1px solid var(--glass-border)',
              boxShadow: 'var(--glass-shadow)',
            }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${MAP_SIZE}, ${CELL_PX}px)`,
                gap: '3px',
              }}>
                {map.flatMap((row, y) => row.map((room, x) => {
                  const isPlayer = playerPos.x === x && playerPos.y === y;
                  const adjacent = gameState === 'exploring' && getAdjacentRooms().some(a => a.room.x === x && a.room.y === y);

                  let bg = 'rgba(128,128,128,0.1)';
                  let content = '❓';
                  let border = '2px solid transparent';

                  if (isPlayer) {
                    bg = 'rgba(99, 102, 241, 0.2)';
                    border = '2px solid var(--primary-color)';
                    content = '🧙';
                  } else if (room.visited) {
                    bg = 'rgba(128,128,128,0.15)';
                    content = room.icon;
                  } else if (room.revealed) {
                    bg = adjacent ? 'rgba(99,102,241,0.08)' : 'rgba(128,128,128,0.05)';
                    border = adjacent ? '2px solid rgba(99,102,241,0.3)' : '2px solid transparent';
                    content = room.icon;
                  }

                  return (
                    <div key={`${x}-${y}`} style={{
                      width: CELL_PX,
                      height: CELL_PX,
                      background: bg,
                      border,
                      borderRadius: '8px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '20px',
                      position: 'relative',
                      transition: 'all 0.2s',
                    }}>
                      {content}
                      {adjacent && !room.visited && gameState === 'exploring' && (
                        <div style={{
                          fontSize: '9px',
                          fontFamily: 'monospace',
                          color: 'var(--primary-color)',
                          fontWeight: 700,
                          marginTop: '2px',
                          maxWidth: CELL_PX - 8,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}>
                          {room.word}
                        </div>
                      )}
                    </div>
                  );
                }))}
              </div>
            </div>
          </div>

          {/* Event area */}
          {eventMessage && (
            <div className="glass-card p-4 mb-4 text-center" style={{ cursor: 'default' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'none'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'none'; }}>
              <p className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{eventMessage}</p>
              {(gameState === 'treasure' || gameState === 'heal') && (
                <Button className="mt-3" type="primary" onClick={handleContinue}>
                  {locale === 'zh' ? '继续探索' : 'Continue'}
                </Button>
              )}
            </div>
          )}

          {/* Battle UI */}
          {gameState === 'battle' && battleState && (
            <div className="glass-card p-6 mb-4 text-center" style={{ cursor: 'default' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'none'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'none'; }}>
              <div className="text-5xl mb-3">{battleState.enemyEmoji}</div>
              <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                {locale === 'zh' ? battleState.enemyNameZh : battleState.enemyName}
              </h3>
              {/* Enemy HP bar */}
              <div className="flex items-center justify-center gap-2 mb-4">
                <div style={{ width: '160px', height: '10px', background: 'rgba(128,128,128,0.2)', borderRadius: '5px', overflow: 'hidden' }}>
                  <div style={{
                    width: `${(battleState.enemyHp / battleState.enemyMaxHp) * 100}%`,
                    height: '100%',
                    background: '#ef4444',
                    borderRadius: '5px',
                    transition: 'width 0.3s',
                  }} />
                </div>
                <span className="text-sm font-mono" style={{ color: '#ef4444' }}>{battleState.enemyHp}/{battleState.enemyMaxHp}</span>
              </div>
              {/* Battle words */}
              <div className="flex gap-2 justify-center mb-3 flex-wrap">
                {battleState.words.map((w, i) => (
                  <span key={i} className="px-3 py-1.5 rounded-lg text-sm font-mono" style={{
                    background: i < battleState.currentWordIdx
                      ? 'rgba(34,197,94,0.15)'
                      : i === battleState.currentWordIdx
                        ? 'rgba(99,102,241,0.15)'
                        : 'rgba(128,128,128,0.1)',
                    color: i < battleState.currentWordIdx
                      ? '#22c55e'
                      : i === battleState.currentWordIdx
                        ? 'var(--primary-color)'
                        : 'var(--text-muted)',
                    border: `1px solid ${i === battleState.currentWordIdx ? 'var(--primary-color)' : 'transparent'}`,
                    fontWeight: i === battleState.currentWordIdx ? 700 : 400,
                    textDecoration: i < battleState.currentWordIdx ? 'line-through' : 'none',
                  }}>
                    {w}
                  </span>
                ))}
              </div>
              <input
                value={battleState.input}
                onChange={handleBattleInput}
                className="w-full max-w-xs px-5 py-3 rounded-2xl text-lg font-mono outline-none transition-all mx-auto block"
                style={{
                  background: 'var(--bg-input)',
                  border: '2px solid var(--glass-border)',
                  color: 'var(--text-primary)',
                }}
                onFocus={e => { e.currentTarget.style.borderColor = 'var(--primary-color)'; }}
                onBlur={e => { e.currentTarget.style.borderColor = 'var(--glass-border)'; }}
                placeholder={locale === 'zh' ? '输入单词攻击...' : 'Type to attack...'}
                autoFocus
              />
            </div>
          )}

          {/* Trap UI */}
          {gameState === 'trap' && trapState && (
            <div className="glass-card p-6 mb-4 text-center" style={{ cursor: 'default' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'none'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'none'; }}>
              <div className="text-5xl mb-3">⚠️</div>
              <h3 className="text-lg font-bold mb-2" style={{ color: '#ef4444' }}>
                {locale === 'zh' ? '陷阱！' : 'Trap!'}
              </h3>
              <p className="mb-3" style={{ color: 'var(--text-secondary)' }}>
                {locale === 'zh' ? `${trapState.timeLeft}秒内输入单词解除！失败扣${trapState.damage}HP` : `Type the word in ${trapState.timeLeft}s! Fail: -${trapState.damage}HP`}
              </p>
              <div className="text-3xl font-bold font-mono mb-3" style={{ color: '#ef4444' }}>
                {trapState.timeLeft}
              </div>
              <div className="text-xl font-bold font-mono mb-3" style={{ color: 'var(--text-primary)' }}>
                {trapState.word}
              </div>
              <input
                value={trapState.input}
                onChange={handleTrapInput}
                className="w-full max-w-xs px-5 py-3 rounded-2xl text-lg font-mono outline-none transition-all mx-auto block"
                style={{
                  background: 'var(--bg-input)',
                  border: '2px solid #ef4444',
                  color: 'var(--text-primary)',
                }}
                placeholder={locale === 'zh' ? '快输入！' : 'Type fast!'}
                autoFocus
              />
            </div>
          )}

          {/* Exploring - adjacent rooms and input */}
          {gameState === 'exploring' && (
            <div className="glass-card p-4 mb-4" style={{ cursor: 'default' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'none'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'none'; }}>
              <p className="text-sm mb-3 font-medium" style={{ color: 'var(--text-secondary)' }}>
                {locale === 'zh' ? '输入单词移动到相邻房间：' : 'Type a word to move:'}
              </p>
              <div className="flex gap-3 flex-wrap mb-3">
                {getAdjacentRooms().filter(a => !a.room.visited || a.room.type === 'exit').map(a => {
                  const matching = moveInput.length > 0 && a.room.word.startsWith(moveInput);
                  return (
                    <div key={a.dir} className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-mono" style={{
                      background: matching ? 'rgba(99,102,241,0.1)' : 'rgba(128,128,128,0.08)',
                      border: `1px solid ${matching ? 'var(--primary-color)' : 'var(--glass-border)'}`,
                      color: matching ? 'var(--primary-color)' : 'var(--text-primary)',
                      transition: 'all 0.2s',
                    }}>
                      <span>{a.emoji}</span>
                      <span>{a.room.icon}</span>
                      <span style={{ fontWeight: 700 }}>{a.room.word}</span>
                    </div>
                  );
                })}
              </div>
              <input
                ref={inputRef}
                value={moveInput}
                onChange={handleMoveInput}
                className="w-full px-5 py-3 rounded-2xl text-lg font-mono outline-none transition-all"
                style={{
                  background: 'var(--bg-input)',
                  border: '2px solid var(--glass-border)',
                  color: 'var(--text-primary)',
                }}
                onFocus={e => { e.currentTarget.style.borderColor = 'var(--primary-color)'; }}
                onBlur={e => { e.currentTarget.style.borderColor = 'var(--glass-border)'; }}
                placeholder={locale === 'zh' ? '输入单词移动...' : 'Type word to move...'}
                autoFocus
              />
            </div>
          )}
        </div>
      )}

      {/* Victory */}
      {gameState === 'victory' && (
        <div className="glass-card p-8 text-center space-y-4" style={{ cursor: 'default' }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'none'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'none'; }}>
          <div className="text-5xl mb-2">🏆</div>
          <h2 className="text-2xl font-extrabold" style={{ color: '#22c55e' }}>
            {locale === 'zh' ? '成功逃出地牢！' : 'Dungeon Cleared!'}
          </h2>
          <div className="grid grid-cols-2 gap-4 max-w-xs mx-auto text-sm">
            <div style={{ color: 'var(--text-secondary)' }}>{locale === 'zh' ? '探索房间' : 'Rooms'}</div>
            <div className="font-bold" style={{ color: 'var(--text-primary)' }}>{roomsVisited}</div>
            <div style={{ color: 'var(--text-secondary)' }}>{locale === 'zh' ? '击杀怪物' : 'Kills'}</div>
            <div className="font-bold" style={{ color: '#ef4444' }}>{monstersKilled}</div>
            <div style={{ color: 'var(--text-secondary)' }}>{locale === 'zh' ? '金币' : 'Gold'}</div>
            <div className="font-bold" style={{ color: '#eab308' }}>{playerGold}</div>
            <div style={{ color: 'var(--text-secondary)' }}>HP</div>
            <div className="font-bold" style={{ color: hpColor }}>{playerHp}/{INITIAL_HP}</div>
          </div>
          <div className="flex justify-center gap-3 pt-2">
            <Button type="primary" size="large" onClick={startGame}>{locale === 'zh' ? '再来一局' : 'Play Again'}</Button>
            <Button size="large" onClick={onBack}>{locale === 'zh' ? '返回' : 'Back'}</Button>
          </div>
          <GameLeaderboard gameId="dungeon" currentScore={playerGold + monstersKilled * 10} />
        </div>
      )}

      {/* Defeat */}
      {gameState === 'defeat' && (
        <div className="glass-card p-8 text-center space-y-4" style={{ cursor: 'default' }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'none'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'none'; }}>
          <div className="text-5xl mb-2">💀</div>
          <h2 className="text-2xl font-extrabold" style={{ color: '#ef4444' }}>
            {locale === 'zh' ? '你倒在了地牢中...' : 'You fell in the dungeon...'}
          </h2>
          <div className="grid grid-cols-2 gap-4 max-w-xs mx-auto text-sm">
            <div style={{ color: 'var(--text-secondary)' }}>{locale === 'zh' ? '探索房间' : 'Rooms'}</div>
            <div className="font-bold" style={{ color: 'var(--text-primary)' }}>{roomsVisited}</div>
            <div style={{ color: 'var(--text-secondary)' }}>{locale === 'zh' ? '击杀怪物' : 'Kills'}</div>
            <div className="font-bold" style={{ color: '#ef4444' }}>{monstersKilled}</div>
            <div style={{ color: 'var(--text-secondary)' }}>{locale === 'zh' ? '金币' : 'Gold'}</div>
            <div className="font-bold" style={{ color: '#eab308' }}>{playerGold}</div>
          </div>
          <div className="flex justify-center gap-3 pt-2">
            <Button type="primary" size="large" onClick={startGame}>{locale === 'zh' ? '再来一局' : 'Play Again'}</Button>
            <Button size="large" onClick={onBack}>{locale === 'zh' ? '返回' : 'Back'}</Button>
          </div>
          <GameLeaderboard gameId="dungeon" currentScore={playerGold + monstersKilled * 10} />
        </div>
      )}
    </div>
  );
}
