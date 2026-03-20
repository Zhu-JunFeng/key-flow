import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@arco-design/web-react';
import { getRandomWord } from '../../lib/gameWords';
import { useLocale } from '../../lib/hooks';
import { playKeySound, playCompleteSound } from '../../lib/sounds';
import { submitGameScore } from '../../lib/api';
import GameLeaderboard from './GameLeaderboard';

interface Bubble {
  readonly id: number;
  readonly word: string;
  readonly x: number;
  readonly y: number;
  readonly size: number;
  readonly speed: number;
  readonly hue: number;
}

interface Props {
  readonly onBack: () => void;
}

export default function WordBubbles({ onBack }: Props) {
  const locale = useLocale();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'over'>('idle');
  const [score, setScore] = useState(0);
  const [input, setInput] = useState('');
  const [timeLeft, setTimeLeft] = useState(60);
  const [popped, setPopped] = useState(0);
  const [missed, setMissed] = useState(0);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');

  const bubblesRef = useRef<Bubble[]>([]);
  const nextIdRef = useRef(0);
  const animRef = useRef(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const scoreRef = useRef(0);
  const poppedRef = useRef(0);
  const missedRef = useRef(0);
  const spawnTimerRef = useRef(0);
  const gameStateRef = useRef<'idle' | 'playing' | 'over'>('idle');

  const startGame = useCallback(() => {
    setGameState('playing');
    gameStateRef.current = 'playing';
    setScore(0); scoreRef.current = 0;
    setPopped(0); poppedRef.current = 0;
    setMissed(0); missedRef.current = 0;
    setTimeLeft(60);
    setInput('');
    bubblesRef.current = [];
    nextIdRef.current = 0;
    spawnTimerRef.current = 0;
    inputRef.current?.focus();
  }, []);

  const endGame = useCallback(() => {
    setGameState('over');
    gameStateRef.current = 'over';
    cancelAnimationFrame(animRef.current);
    playCompleteSound();
    const xp = Math.round(scoreRef.current / 2);
    const currentXp = parseInt(localStorage.getItem('typerace_xp') || '0');
    localStorage.setItem('typerace_xp', String(currentXp + xp));
    submitGameScore({ gameId: 'bubbles', score: scoreRef.current, difficulty }).catch(() => {});
  }, [difficulty]);

  // Timer
  useEffect(() => {
    if (gameState !== 'playing') return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          endGame();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [gameState, endGame]);

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

      // Spawn bubbles
      spawnTimerRef.current += dt;
      if (spawnTimerRef.current >= 1.5) {
        spawnTimerRef.current = 0;
        const hue = Math.floor(Math.random() * 360);
        bubblesRef.current = [...bubblesRef.current, {
          id: nextIdRef.current++,
          word: getRandomWord(difficulty),
          x: 40 + Math.random() * (w - 80),
          y: h + 30,
          size: 35 + Math.random() * 15,
          speed: 30 + Math.random() * 25,
          hue,
        }];
      }

      // Update
      const alive: Bubble[] = [];
      for (const b of bubblesRef.current) {
        const newY = b.y - b.speed * dt;
        if (newY < -b.size * 2) {
          missedRef.current++;
          setMissed(missedRef.current);
        } else {
          alive.push({ ...b, y: newY, x: b.x + Math.sin(now / 500 + b.id) * 0.3 });
        }
      }
      bubblesRef.current = alive;

      // Draw
      ctx.clearRect(0, 0, w, h);
      const isDark = document.documentElement.classList.contains('dark');

      for (const b of bubblesRef.current) {
        // Bubble circle
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.size, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${b.hue}, 70%, ${isDark ? '40%' : '70%'}, 0.3)`;
        ctx.fill();
        ctx.strokeStyle = `hsla(${b.hue}, 70%, ${isDark ? '60%' : '50%'}, 0.6)`;
        ctx.lineWidth = 2;
        ctx.stroke();

        // Highlight
        ctx.beginPath();
        ctx.arc(b.x - b.size * 0.25, b.y - b.size * 0.25, b.size * 0.2, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${b.hue}, 70%, 90%, 0.4)`;
        ctx.fill();

        // Word
        ctx.font = 'bold 13px monospace';
        ctx.fillStyle = isDark ? '#e2e8f0' : '#1e293b';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(b.word, b.x, b.y);
      }

      animRef.current = requestAnimationFrame(loop);
    };

    animRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animRef.current);
  }, [gameState, difficulty]);

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.trim().toLowerCase();
    setInput(val);

    const matchIdx = bubblesRef.current.findIndex(b => b.word === val);
    if (matchIdx >= 0) {
      playKeySound();
      bubblesRef.current = bubblesRef.current.filter((_, i) => i !== matchIdx);
      setInput('');
      poppedRef.current++;
      setPopped(poppedRef.current);
      const pts = 15;
      scoreRef.current += pts;
      setScore(scoreRef.current);
    }
  };

  return (
    <div>
      {gameState === 'idle' && (
        <div className="glass-card p-8 text-center space-y-4" style={{ cursor: 'default' }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'none'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'none'; }}>
          <div className="text-6xl mb-4">🫧</div>
          <h2 className="text-2xl font-extrabold" style={{ color: 'var(--text-primary)' }}>
            {locale === 'zh' ? '词汇气泡' : 'Word Bubbles'}
          </h2>
          <p style={{ color: 'var(--text-secondary)' }}>
            {locale === 'zh' ? '气泡飘起来了！60秒内尽可能多地输入单词消除气泡！' : 'Bubbles are floating up! Pop as many as you can in 60 seconds!'}
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
          <div className="glass-card p-3 mb-4 flex items-center justify-between" style={{ cursor: 'default' }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'none'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'none'; }}>
            <div className="flex items-center gap-4 text-sm">
              <span style={{ color: 'var(--text-secondary)' }}>{locale === 'zh' ? '分数' : 'Score'}: <strong style={{ color: 'var(--primary-color)' }}>{score}</strong></span>
              <span style={{ color: 'var(--text-secondary)' }}>{locale === 'zh' ? '消除' : 'Popped'}: <strong className="text-emerald-500">{popped}</strong></span>
              <span style={{ color: 'var(--text-secondary)' }}>{locale === 'zh' ? '漏掉' : 'Missed'}: <strong className="text-red-500">{missed}</strong></span>
            </div>
            <div className="text-lg font-bold tabular-nums" style={{ color: timeLeft <= 10 ? '#ef4444' : 'var(--primary-color)' }}>
              {timeLeft}s
            </div>
          </div>

          <div className="rounded-3xl overflow-hidden mb-4" style={{
            background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', boxShadow: 'var(--glass-shadow)',
          }}>
            <canvas ref={canvasRef} className="w-full" style={{ height: '400px', display: 'block' }} />
          </div>

          <div className="flex gap-3">
            <input ref={inputRef} value={input} onChange={handleInput}
              className="flex-1 px-5 py-3 rounded-2xl text-lg font-mono outline-none transition-all"
              style={{ background: 'var(--bg-input)', border: '2px solid var(--glass-border)', color: 'var(--text-primary)' }}
              onFocus={e => { e.currentTarget.style.borderColor = 'var(--primary-color)'; }}
              onBlur={e => { e.currentTarget.style.borderColor = 'var(--glass-border)'; }}
              placeholder={locale === 'zh' ? '输入单词...' : 'Type the word...'}
              autoFocus />
            <Button onClick={endGame} size="large">{locale === 'zh' ? '结束' : 'End'}</Button>
          </div>
        </div>
      )}

      {gameState === 'over' && (
        <div className="glass-card p-8 text-center space-y-4" style={{ cursor: 'default' }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'none'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'none'; }}>
          <div className="text-5xl mb-2">🎉</div>
          <h2 className="text-2xl font-extrabold" style={{ color: 'var(--text-primary)' }}>
            {locale === 'zh' ? '时间到！' : 'Time\'s Up!'}
          </h2>
          <div className="flex justify-center gap-8 text-lg">
            <span style={{ color: 'var(--text-secondary)' }}>{locale === 'zh' ? '分数' : 'Score'}: <strong style={{ color: 'var(--primary-color)' }}>{score}</strong></span>
            <span style={{ color: 'var(--text-secondary)' }}>{locale === 'zh' ? '消除' : 'Popped'}: <strong className="text-emerald-500">{popped}</strong></span>
            <span style={{ color: 'var(--text-secondary)' }}>{locale === 'zh' ? '漏掉' : 'Missed'}: <strong className="text-red-500">{missed}</strong></span>
          </div>
          <div className="flex justify-center gap-3 pt-2">
            <Button type="primary" size="large" onClick={startGame}>{locale === 'zh' ? '再来一局' : 'Play Again'}</Button>
            <Button size="large" onClick={onBack}>{locale === 'zh' ? '返回' : 'Back'}</Button>
          </div>
          <GameLeaderboard gameId="bubbles" currentScore={score} />
        </div>
      )}
    </div>
  );
}
