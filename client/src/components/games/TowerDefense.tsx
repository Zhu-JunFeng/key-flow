import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@arco-design/web-react';
import { getRandomWord } from '../../lib/gameWords';
import { useLocale } from '../../lib/hooks';
import { playKeySound, playErrorSound } from '../../lib/sounds';
import { submitGameScore } from '../../lib/api';
import GameLeaderboard from './GameLeaderboard';

interface Props {
  readonly onBack: () => void;
}

interface Enemy {
  readonly id: number;
  readonly word: string;
  x: number;
  readonly speed: number;
  readonly color: string;
}

export default function TowerDefense({ onBack }: Props) {
  const locale = useLocale();
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'gameover'>('idle');
  const [enemies, setEnemies] = useState<readonly Enemy[]>([]);
  const [input, setInput] = useState('');
  const [score, setScore] = useState(0);
  const [wave, setWave] = useState(1);
  const [lives, setLives] = useState(5);
  const [killed, setKilled] = useState(0);
  const [targetEnemy, setTargetEnemy] = useState<number | null>(null);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');

  const inputRef = useRef<HTMLInputElement>(null);
  const animFrameRef = useRef<number>(0);
  const lastSpawnRef = useRef(0);
  const enemyIdRef = useRef(0);
  const gameStateRef = useRef(gameState);
  const enemiesRef = useRef(enemies);
  const livesRef = useRef(lives);
  const killedRef = useRef(0);
  const scoreRef = useRef(0);
  const difficultyRef = useRef(difficulty);

  gameStateRef.current = gameState;
  enemiesRef.current = enemies;
  livesRef.current = lives;
  scoreRef.current = score;
  difficultyRef.current = difficulty;

  const BASE_POSITION = 95; // where the base is

  const spawnEnemy = useCallback(() => {
    const wordDiff = difficulty === 'easy' ? 'easy' : difficulty === 'hard' ? (wave <= 3 ? 'medium' : 'hard') : (wave <= 3 ? 'easy' : wave <= 6 ? 'medium' : 'hard');
    const word = getRandomWord(wordDiff);
    const colors = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#8b5cf6', '#ef4444'];
    const newEnemy: Enemy = {
      id: enemyIdRef.current++,
      word,
      x: 0,
      speed: 0.3 + wave * 0.05 + Math.random() * 0.15,
      color: colors[Math.floor(Math.random() * colors.length)],
    };
    setEnemies(prev => [...prev, newEnemy]);
  }, [wave, difficulty]);

  const startGame = useCallback(() => {
    setScore(0);
    setWave(1);
    setLives(5);
    livesRef.current = 5;
    setKilled(0);
    killedRef.current = 0;
    setEnemies([]);
    setInput('');
    setTargetEnemy(null);
    setGameState('playing');
    gameStateRef.current = 'playing';
    lastSpawnRef.current = Date.now();
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  // Game loop
  useEffect(() => {
    if (gameState !== 'playing') return;

    const gameLoop = () => {
      if (gameStateRef.current !== 'playing') return;

      const now = Date.now();
      const spawnInterval = Math.max(1200, 3000 - wave * 200);

      if (now - lastSpawnRef.current > spawnInterval) {
        spawnEnemy();
        lastSpawnRef.current = now;
      }

      // Move enemies
      setEnemies(prev => {
        const updated = prev.map(e => ({ ...e, x: e.x + e.speed }));
        const survived: Enemy[] = [];
        let lostLives = 0;

        for (const e of updated) {
          if (e.x >= BASE_POSITION) {
            lostLives++;
          } else {
            survived.push(e);
          }
        }

        if (lostLives > 0) {
          setLives(hp => {
            const newHp = hp - lostLives;
            livesRef.current = newHp;
            if (newHp <= 0) {
              setGameState('gameover');
              gameStateRef.current = 'gameover';
              const xp = Math.round(scoreRef.current / 2) + killedRef.current * 3;
              const currentXp = parseInt(localStorage.getItem('typerace_xp') || '0');
              localStorage.setItem('typerace_xp', String(currentXp + xp));
              submitGameScore({ gameId: 'tower', score: scoreRef.current, difficulty: difficultyRef.current }).catch(() => {});
            }
            return Math.max(0, newHp);
          });
        }

        return survived;
      });

      // Wave progression
      if (killedRef.current > 0 && killedRef.current % 10 === 0) {
        setWave(Math.floor(killedRef.current / 10) + 1);
      }

      animFrameRef.current = requestAnimationFrame(gameLoop);
    };

    animFrameRef.current = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [gameState, wave, spawnEnemy]);

  const handleInput = (value: string) => {
    if (gameState !== 'playing') return;
    setInput(value);

    // Find target enemy
    const current = enemiesRef.current;
    let matched: Enemy | undefined;

    if (targetEnemy !== null) {
      matched = current.find(e => e.id === targetEnemy);
      if (matched && !matched.word.startsWith(value)) {
        // Lost target
        setTargetEnemy(null);
        matched = undefined;
      }
    }

    if (!matched) {
      // Find new target
      matched = current.find(e => e.word.startsWith(value));
      if (matched) setTargetEnemy(matched.id);
    }

    if (matched && value === matched.word) {
      // Enemy killed!
      playKeySound();
      setEnemies(prev => prev.filter(e => e.id !== matched!.id));
      setScore(prev => prev + matched!.word.length * 10 + wave * 5);
      killedRef.current++;
      setKilled(killedRef.current);
      setInput('');
      setTargetEnemy(null);
    } else if (matched) {
      playKeySound();
    } else if (value.length > 0) {
      playErrorSound();
    }
  };

  return (
    <div>
      {gameState === 'idle' && (
        <div className="glass-card p-8 text-center space-y-4" style={{ cursor: 'default' }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'none'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'none'; }}>
          <div className="text-6xl mb-4">🏰</div>
          <h2 className="text-2xl font-extrabold" style={{ color: 'var(--text-primary)' }}>
            {locale === 'zh' ? '塔防打字' : 'Tower Defense'}
          </h2>
          <p style={{ color: 'var(--text-secondary)' }}>
            {locale === 'zh'
              ? '敌人从左边冲来！打出它们身上的单词来消灭它们，保护你的基地！'
              : 'Enemies approach from the left! Type their words to destroy them and protect your base!'}
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
            {locale === 'zh' ? '开始防守' : 'Start Defense'}
          </Button>
        </div>
      )}

      {gameState === 'playing' && (
        <div>
          {/* Stats bar */}
          <div className="glass-card p-3 mb-4 flex items-center justify-between" style={{ cursor: 'default' }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'none'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'none'; }}>
            <div className="flex items-center gap-4 text-sm">
              <span style={{ color: 'var(--text-secondary)' }}>
                {locale === 'zh' ? '波次' : 'Wave'}: <strong style={{ color: 'var(--primary-color)' }}>{wave}</strong>
              </span>
              <span style={{ color: 'var(--text-secondary)' }}>
                {locale === 'zh' ? '分数' : 'Score'}: <strong className="text-emerald-500">{score}</strong>
              </span>
              <span style={{ color: 'var(--text-secondary)' }}>
                {locale === 'zh' ? '击杀' : 'Killed'}: <strong>{killed}</strong>
              </span>
            </div>
            <div className="flex items-center gap-1">
              {Array.from({ length: 5 }, (_, i) => (
                <span key={i} className="text-lg" style={{ opacity: i < lives ? 1 : 0.2 }}>❤️</span>
              ))}
            </div>
          </div>

          {/* Battlefield */}
          <div className="glass-card p-4 mb-4 relative overflow-hidden" style={{
            minHeight: '200px',
            cursor: 'default',
          }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'none'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'none'; }}>
            {/* Base */}
            <div className="absolute right-2 top-1/2 -translate-y-1/2 text-3xl">🏰</div>
            {/* Road */}
            <div className="absolute left-0 right-12 top-1/2 h-1 -translate-y-1/2 rounded" style={{
              background: 'rgba(148,163,184,0.15)',
            }} />

            {/* Enemies */}
            {enemies.map(enemy => (
              <div key={enemy.id}
                className="absolute transition-all duration-100"
                style={{
                  left: `${enemy.x}%`,
                  top: '50%',
                  transform: 'translateY(-50%)',
                }}>
                <div className="flex flex-col items-center gap-1">
                  <span className="text-2xl">👾</span>
                  <div className="px-2 py-0.5 rounded text-xs font-mono font-bold whitespace-nowrap" style={{
                    background: enemy.id === targetEnemy ? `${enemy.color}30` : 'var(--glass-bg)',
                    border: `1px solid ${enemy.id === targetEnemy ? enemy.color : 'var(--glass-border)'}`,
                    color: enemy.id === targetEnemy ? enemy.color : 'var(--text-primary)',
                  }}>
                    {enemy.word.split('').map((char, i) => (
                      <span key={i} style={{
                        color: enemy.id === targetEnemy && i < input.length
                          ? '#10b981'
                          : enemy.id === targetEnemy ? enemy.color : 'var(--text-primary)',
                      }}>{char}</span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Input */}
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => handleInput(e.target.value)}
            className="w-full px-4 py-3 rounded-xl text-center text-lg font-mono outline-none"
            style={{
              background: 'var(--bg-card)',
              border: '2px solid var(--glass-border)',
              color: 'var(--text-primary)',
            }}
            placeholder={locale === 'zh' ? '输入敌人的单词...' : 'Type enemy words...'}
            autoFocus
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
          />
        </div>
      )}

      {gameState === 'gameover' && (
        <div className="glass-card p-8 text-center space-y-4" style={{ cursor: 'default' }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'none'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'none'; }}>
          <div className="text-5xl mb-2">🏰💥</div>
          <h2 className="text-2xl font-extrabold" style={{ color: '#ef4444' }}>
            {locale === 'zh' ? '基地被攻破了！' : 'Base Destroyed!'}
          </h2>
          <div className="flex justify-center gap-6 text-lg">
            <span style={{ color: 'var(--text-secondary)' }}>
              {locale === 'zh' ? '分数' : 'Score'}: <strong className="text-emerald-500">{score}</strong>
            </span>
            <span style={{ color: 'var(--text-secondary)' }}>
              {locale === 'zh' ? '波次' : 'Wave'}: <strong style={{ color: 'var(--primary-color)' }}>{wave}</strong>
            </span>
            <span style={{ color: 'var(--text-secondary)' }}>
              {locale === 'zh' ? '击杀' : 'Killed'}: <strong>{killed}</strong>
            </span>
          </div>
          <div className="flex justify-center gap-3 pt-2">
            <Button type="primary" size="large" onClick={startGame}>{locale === 'zh' ? '再来一局' : 'Play Again'}</Button>
            <Button size="large" onClick={onBack}>{locale === 'zh' ? '返回' : 'Back'}</Button>
          </div>
          <GameLeaderboard gameId="tower" currentScore={score} />
        </div>
      )}
    </div>
  );
}
