import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@arco-design/web-react';
import { getRandomWord } from '../../lib/gameWords';
import { useLocale } from '../../lib/hooks';
import { calculateXp } from '../../lib/i18n';
import { playKeySound, playErrorSound, playCompleteSound } from '../../lib/sounds';
import { submitGameScore } from '../../lib/api';
import GameLeaderboard from './GameLeaderboard';

interface FallingWord {
  readonly id: number;
  readonly word: string;
  readonly x: number;
  readonly y: number;
  readonly speed: number;
}

interface Props {
  readonly onBack: () => void;
}

export default function FallingWords({ onBack }: Props) {
  const locale = useLocale();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'over'>('idle');
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [input, setInput] = useState('');
  const [, setWords] = useState<FallingWord[]>([]);
  const [wordsTyped, setWordsTyped] = useState(0);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const nextIdRef = useRef(0);
  const animRef = useRef(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const wordsRef = useRef<FallingWord[]>([]);
  const livesRef = useRef(3);
  const scoreRef = useRef(0);
  const wordsTypedRef = useRef(0);
  const spawnTimerRef = useRef(0);
  const gameStateRef = useRef<'idle' | 'playing' | 'over'>('idle');
  const levelRef = useRef(1);

  const startGame = useCallback(() => {
    setGameState('playing');
    gameStateRef.current = 'playing';
    setScore(0);
    scoreRef.current = 0;
    setLives(3);
    livesRef.current = 3;
    setWords([]);
    wordsRef.current = [];
    setInput('');
    setWordsTyped(0);
    wordsTypedRef.current = 0;
    nextIdRef.current = 0;
    levelRef.current = 1;
    spawnTimerRef.current = 0;
    inputRef.current?.focus();
  }, []);

  const endGame = useCallback(() => {
    setGameState('over');
    gameStateRef.current = 'over';
    cancelAnimationFrame(animRef.current);
    playCompleteSound();

    // Save XP
    const xp = calculateXp(0, 100, wordsTypedRef.current * 5, 0) + scoreRef.current;
    const currentXp = parseInt(localStorage.getItem('typerace_xp') || '0');
    localStorage.setItem('typerace_xp', String(currentXp + xp));
    submitGameScore({ gameId: 'falling', score: scoreRef.current, difficulty }).catch(() => {});
  }, [difficulty]);

  // Game loop
  useEffect(() => {
    if (gameState !== 'playing') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.offsetWidth * 2;
    canvas.height = canvas.offsetHeight * 2;
    ctx.scale(2, 2);
    const w = canvas.offsetWidth;
    const h = canvas.offsetHeight;

    let lastTime = performance.now();

    const loop = (now: number) => {
      if (gameStateRef.current !== 'playing') return;

      const dt = (now - lastTime) / 1000;
      lastTime = now;

      // Spawn words
      spawnTimerRef.current += dt;
      const spawnInterval = Math.max(0.8, 2.5 - levelRef.current * 0.15);
      if (spawnTimerRef.current >= spawnInterval) {
        spawnTimerRef.current = 0;
        const word = getRandomWord(difficulty);
        const newWord: FallingWord = {
          id: nextIdRef.current++,
          word,
          x: 30 + Math.random() * (w - 100),
          y: -20,
          speed: 25 + levelRef.current * 5 + Math.random() * 15,
        };
        wordsRef.current = [...wordsRef.current, newWord];
        setWords([...wordsRef.current]);
      }

      // Update positions
      const updatedWords: FallingWord[] = [];
      let lostLife = false;

      for (const word of wordsRef.current) {
        const newY = word.y + word.speed * dt;
        if (newY > h) {
          lostLife = true;
        } else {
          updatedWords.push({ ...word, y: newY });
        }
      }

      wordsRef.current = updatedWords;
      setWords([...updatedWords]);

      if (lostLife) {
        livesRef.current--;
        setLives(livesRef.current);
        playErrorSound();
        if (livesRef.current <= 0) {
          endGame();
          return;
        }
      }

      // Level up every 5 words
      levelRef.current = 1 + Math.floor(wordsTypedRef.current / 5);

      // Draw
      ctx.clearRect(0, 0, w, h);

      // Draw gradient background
      const isDark = document.documentElement.classList.contains('dark');
      ctx.fillStyle = isDark ? 'rgba(15, 23, 42, 0.3)' : 'rgba(255, 255, 255, 0.1)';
      ctx.fillRect(0, 0, w, h);

      // Draw danger zone
      ctx.fillStyle = 'rgba(239, 68, 68, 0.05)';
      ctx.fillRect(0, h - 40, w, 40);
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.3)';
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(0, h - 40);
      ctx.lineTo(w, h - 40);
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw words
      for (const word of wordsRef.current) {
        ctx.font = 'bold 16px monospace';
        const textWidth = ctx.measureText(word.word).width;

        // Background pill
        ctx.fillStyle = isDark ? 'rgba(30, 41, 59, 0.9)' : 'rgba(255, 255, 255, 0.9)';
        ctx.strokeStyle = 'rgba(99, 102, 241, 0.4)';
        ctx.lineWidth = 1.5;
        const px = 10, py = 6, radius = 8;
        const rx = word.x - px;
        const ry = word.y - 14 - py;
        const rw = textWidth + px * 2;
        const rh = 20 + py * 2;
        ctx.beginPath();
        ctx.roundRect(rx, ry, rw, rh, radius);
        ctx.fill();
        ctx.stroke();

        // Text
        ctx.fillStyle = isDark ? '#e2e8f0' : '#1e293b';
        ctx.fillText(word.word, word.x, word.y);
      }

      animRef.current = requestAnimationFrame(loop);
    };

    animRef.current = requestAnimationFrame(loop);

    return () => cancelAnimationFrame(animRef.current);
  }, [gameState, difficulty, endGame]);

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.trim().toLowerCase();
    setInput(val);

    // Check for match
    const matchIdx = wordsRef.current.findIndex(w => w.word === val);
    if (matchIdx >= 0) {
      playKeySound();
      wordsRef.current = wordsRef.current.filter((_, i) => i !== matchIdx);
      setWords([...wordsRef.current]);
      setInput('');

      wordsTypedRef.current++;
      setWordsTyped(wordsTypedRef.current);

      const points = 10 + Math.floor(val.length * 2);
      scoreRef.current += points;
      setScore(scoreRef.current);
    }
  };

  const currentLevel = 1 + Math.floor(wordsTyped / 5);

  return (
    <div>
      {gameState === 'idle' && (
        <div className="glass-card p-8 text-center space-y-4" style={{ cursor: 'default' }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'none'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'none'; }}>
          <div className="text-6xl mb-4">🌧️</div>
          <h2 className="text-2xl font-extrabold" style={{ color: 'var(--text-primary)' }}>
            {locale === 'zh' ? '落字挑战' : 'Falling Words'}
          </h2>
          <p style={{ color: 'var(--text-secondary)' }}>
            {locale === 'zh' ? '单词从天而降，在落地前输入正确的单词消除它！3条命，加油！' : 'Words fall from the sky. Type them before they hit the ground! 3 lives!'}
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
            {locale === 'zh' ? '开始游戏' : 'Start Game'}
          </Button>
        </div>
      )}

      {gameState === 'playing' && (
        <div>
          {/* HUD */}
          <div className="glass-card p-3 mb-4 flex items-center justify-between" style={{ cursor: 'default' }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'none'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'none'; }}>
            <div className="flex items-center gap-4 text-sm">
              <span style={{ color: 'var(--text-secondary)' }}>{locale === 'zh' ? '分数' : 'Score'}: <strong style={{ color: 'var(--primary-color)' }}>{score}</strong></span>
              <span style={{ color: 'var(--text-secondary)' }}>{locale === 'zh' ? '单词' : 'Words'}: <strong style={{ color: '#10b981' }}>{wordsTyped}</strong></span>
              <span style={{ color: 'var(--text-secondary)' }}>Lv.<strong>{currentLevel}</strong></span>
            </div>
            <div className="flex items-center gap-1">
              {Array.from({ length: 3 }, (_, i) => (
                <span key={i} className="text-lg">{i < lives ? '❤️' : '🖤'}</span>
              ))}
            </div>
          </div>

          {/* Canvas */}
          <div className="rounded-3xl overflow-hidden mb-4" style={{
            background: 'var(--glass-bg)',
            border: '1px solid var(--glass-border)',
            boxShadow: 'var(--glass-shadow)',
          }}>
            <canvas ref={canvasRef} className="w-full" style={{ height: '400px', display: 'block' }} />
          </div>

          {/* Input */}
          <div className="flex gap-3">
            <input
              ref={inputRef}
              value={input}
              onChange={handleInput}
              className="flex-1 px-5 py-3 rounded-2xl text-lg font-mono outline-none transition-all"
              style={{
                background: 'var(--bg-input)',
                border: '2px solid var(--glass-border)',
                color: 'var(--text-primary)',
              }}
              onFocus={e => { e.currentTarget.style.borderColor = 'var(--primary-color)'; }}
              onBlur={e => { e.currentTarget.style.borderColor = 'var(--glass-border)'; }}
              placeholder={locale === 'zh' ? '输入单词...' : 'Type the word...'}
              autoFocus
            />
            <Button onClick={endGame} size="large">{locale === 'zh' ? '结束' : 'End'}</Button>
          </div>
        </div>
      )}

      {gameState === 'over' && (
        <div className="glass-card p-8 text-center space-y-4" style={{ cursor: 'default' }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'none'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'none'; }}>
          <div className="text-5xl mb-2">🏆</div>
          <h2 className="text-2xl font-extrabold" style={{ color: 'var(--text-primary)' }}>
            {locale === 'zh' ? '游戏结束！' : 'Game Over!'}
          </h2>
          <div className="flex justify-center gap-8 text-lg">
            <span style={{ color: 'var(--text-secondary)' }}>{locale === 'zh' ? '分数' : 'Score'}: <strong style={{ color: 'var(--primary-color)' }}>{score}</strong></span>
            <span style={{ color: 'var(--text-secondary)' }}>{locale === 'zh' ? '单词' : 'Words'}: <strong className="text-emerald-500">{wordsTyped}</strong></span>
          </div>
          <div className="flex justify-center gap-3 pt-2">
            <Button type="primary" size="large" onClick={startGame}>{locale === 'zh' ? '再来一局' : 'Play Again'}</Button>
            <Button size="large" onClick={onBack}>{locale === 'zh' ? '返回' : 'Back'}</Button>
          </div>
          <GameLeaderboard gameId="falling" currentScore={score} />
        </div>
      )}
    </div>
  );
}
