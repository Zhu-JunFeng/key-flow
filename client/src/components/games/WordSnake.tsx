import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@arco-design/web-react';
import { getRandomWord } from '../../lib/gameWords';
import { useLocale } from '../../lib/hooks';
import { calculateXp } from '../../lib/i18n';
import { playKeySound, playCompleteSound } from '../../lib/sounds';
import { submitGameScore } from '../../lib/api';
import GameLeaderboard from './GameLeaderboard';

const GRID_SIZE = 16;
const CELL_SIZE = 24;

type Direction = 'up' | 'down' | 'left' | 'right';

interface Position {
  readonly x: number;
  readonly y: number;
}

interface DirectionChoice {
  readonly direction: Direction;
  readonly word: string;
  readonly emoji: string;
  readonly disabled: boolean;
}

const DIRECTION_EMOJI: Record<Direction, string> = { up: '⬆️', down: '⬇️', left: '⬅️', right: '➡️' };

const OPPOSITE: Record<Direction, Direction> = { up: 'down', down: 'up', left: 'right', right: 'left' };

const DIR_OFFSET: Record<Direction, Position> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

type Difficulty = 'easy' | 'medium' | 'hard';

const DIFFICULTY_CONFIG: Record<Difficulty, {
  readonly initialSpeed: number;
  readonly minSpeed: number;
  readonly speedStep: number;
  readonly wordDifficulty: 'easy' | 'medium' | 'hard';
}> = {
  easy: { initialSpeed: 450, minSpeed: 250, speedStep: 3, wordDifficulty: 'easy' },
  medium: { initialSpeed: 300, minSpeed: 150, speedStep: 5, wordDifficulty: 'easy' },
  hard: { initialSpeed: 200, minSpeed: 100, speedStep: 7, wordDifficulty: 'medium' },
};

interface Props {
  readonly onBack: () => void;
}

function randomFood(snake: readonly Position[]): Position {
  const occupied = new Set(snake.map(p => `${p.x},${p.y}`));
  let pos: Position;
  do {
    pos = { x: Math.floor(Math.random() * GRID_SIZE), y: Math.floor(Math.random() * GRID_SIZE) };
  } while (occupied.has(`${pos.x},${pos.y}`));
  return pos;
}

function makeChoices(currentDir: Direction, wordDifficulty: 'easy' | 'medium' | 'hard'): DirectionChoice[] {
  const opposite = OPPOSITE[currentDir];
  return (['up', 'down', 'left', 'right'] as Direction[]).map(dir => ({
    direction: dir,
    word: getRandomWord(wordDifficulty),
    emoji: DIRECTION_EMOJI[dir],
    disabled: dir === opposite,
  }));
}

export default function WordSnake({ onBack }: Props) {
  const locale = useLocale();
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'over'>('idle');
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [snake, setSnake] = useState<Position[]>([{ x: 3, y: 3 }]);
  const [food, setFood] = useState<Position>({ x: 8, y: 8 });
  const [score, setScore] = useState(0);
  const [wordsCompleted, setWordsCompleted] = useState(0);
  const [input, setInput] = useState('');
  const [directionChoices, setDirectionChoices] = useState<DirectionChoice[]>([]);
  const [speed, setSpeed] = useState(450);

  const snakeRef = useRef<Position[]>([{ x: 3, y: 3 }]);
  const dirRef = useRef<Direction>('right');
  const foodRef = useRef<Position>({ x: 8, y: 8 });
  const scoreRef = useRef(0);
  const wordsRef = useRef(0);
  const speedRef = useRef(450);
  const difficultyRef = useRef<Difficulty>('easy');
  const gameStateRef = useRef<'idle' | 'playing' | 'over'>('idle');
  const tickRef = useRef<ReturnType<typeof setInterval>>(undefined);
  const inputRef = useRef<HTMLInputElement>(null);

  const endGame = useCallback(() => {
    setGameState('over');
    gameStateRef.current = 'over';
    if (tickRef.current) clearInterval(tickRef.current);
    playCompleteSound();
    const xp = calculateXp(0, 100, wordsRef.current * 5, 0) + scoreRef.current;
    const currentXp = parseInt(localStorage.getItem('typerace_xp') || '0');
    localStorage.setItem('typerace_xp', String(currentXp + xp));
    submitGameScore({ gameId: 'snake', score: scoreRef.current, difficulty: difficultyRef.current }).catch(() => {});
  }, []);

  const tick = useCallback(() => {
    if (gameStateRef.current !== 'playing') return;
    const s = snakeRef.current;
    const head = s[0];
    const offset = DIR_OFFSET[dirRef.current];
    const newHead = { x: head.x + offset.x, y: head.y + offset.y };

    // Wall collision
    if (newHead.x < 0 || newHead.x >= GRID_SIZE || newHead.y < 0 || newHead.y >= GRID_SIZE) {
      endGame();
      return;
    }

    // Self collision
    if (s.some(p => p.x === newHead.x && p.y === newHead.y)) {
      endGame();
      return;
    }

    let newSnake: Position[];
    let newFood = foodRef.current;
    if (newHead.x === foodRef.current.x && newHead.y === foodRef.current.y) {
      newSnake = [newHead, ...s];
      scoreRef.current += 10;
      setScore(scoreRef.current);
      newFood = randomFood(newSnake);
      foodRef.current = newFood;
      setFood(newFood);
      playKeySound();

      // Speed up
      const cfg = DIFFICULTY_CONFIG[difficultyRef.current];
      speedRef.current = Math.max(cfg.minSpeed, cfg.initialSpeed - wordsRef.current * cfg.speedStep);
      setSpeed(speedRef.current);
    } else {
      newSnake = [newHead, ...s.slice(0, -1)];
    }

    snakeRef.current = newSnake;
    setSnake(newSnake);
  }, [endGame]);

  // Restart tick interval when speed changes
  useEffect(() => {
    if (gameState !== 'playing') return;
    const id = setInterval(tick, speed);
    tickRef.current = id;
    return () => clearInterval(id);
  }, [gameState, speed, tick]);

  const startGame = useCallback(() => {
    const initialSnake = [{ x: 3, y: 3 }];
    const initialFood = { x: 8, y: 8 };
    const initialDir: Direction = 'right';
    const cfg = DIFFICULTY_CONFIG[difficulty];

    snakeRef.current = initialSnake;
    dirRef.current = initialDir;
    foodRef.current = initialFood;
    scoreRef.current = 0;
    wordsRef.current = 0;
    speedRef.current = cfg.initialSpeed;
    difficultyRef.current = difficulty;
    gameStateRef.current = 'playing';

    setSnake(initialSnake);
    setFood(initialFood);
    setScore(0);
    setWordsCompleted(0);
    setInput('');
    setSpeed(cfg.initialSpeed);
    setDirectionChoices(makeChoices(initialDir, cfg.wordDifficulty));
    setGameState('playing');
    inputRef.current?.focus();
  }, [difficulty]);

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.trim().toLowerCase();
    setInput(val);

    const match = directionChoices.find(c => !c.disabled && c.word === val);
    if (match) {
      dirRef.current = match.direction;
      wordsRef.current++;
      setWordsCompleted(wordsRef.current);
      setDirectionChoices(makeChoices(match.direction, DIFFICULTY_CONFIG[difficultyRef.current].wordDifficulty));
      setInput('');
      playKeySound();
    }
  };

  // Render grid cells
  const renderGrid = () => {
    const snakeSet = new Map<string, number>();
    snake.forEach((p, i) => snakeSet.set(`${p.x},${p.y}`, i));
    const cells: React.JSX.Element[] = [];

    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        const key = `${x},${y}`;
        const snakeIdx = snakeSet.get(key);
        const isFood = food.x === x && food.y === y;
        const isHead = snakeIdx === 0;

        let bg = 'transparent';
        let content = '';
        if (isHead) {
          bg = '#22c55e';
          content = '🐍';
        } else if (snakeIdx !== undefined) {
          const alpha = Math.max(0.3, 1 - snakeIdx * 0.06);
          bg = `rgba(34, 197, 94, ${alpha})`;
        } else if (isFood) {
          content = '🍎';
        }

        cells.push(
          <div key={key} style={{
            width: CELL_SIZE,
            height: CELL_SIZE,
            background: bg,
            borderRadius: isHead ? '6px' : snakeIdx !== undefined ? '4px' : '2px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '14px',
            lineHeight: 1,
          }}>
            {content}
          </div>
        );
      }
    }
    return cells;
  };

  // Direction panel layout
  const getChoiceByDir = (dir: Direction) => directionChoices.find(c => c.direction === dir);

  return (
    <div>
      {gameState === 'idle' && (
        <div className="glass-card p-8 text-center space-y-4" style={{ cursor: 'default' }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'none'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'none'; }}>
          <div className="text-6xl mb-4">🐍</div>
          <h2 className="text-2xl font-extrabold" style={{ color: 'var(--text-primary)' }}>
            {locale === 'zh' ? '单词蛇' : 'Word Snake'}
          </h2>
          <p style={{ color: 'var(--text-secondary)' }}>
            {locale === 'zh'
              ? '输入方向对应的单词来控制蛇的方向！吃到🍎得分，别撞墙或撞到自己！'
              : 'Type the word for a direction to steer the snake! Eat 🍎 to score, don\'t hit walls or yourself!'}
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
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {difficulty === 'easy' ? (locale === 'zh' ? '速度较慢，短词，适合新手' : 'Slower speed, short words, great for beginners')
              : difficulty === 'medium' ? (locale === 'zh' ? '标准速度，短词' : 'Standard speed, short words')
              : (locale === 'zh' ? '高速，中等词汇，挑战极限' : 'Fast speed, medium words, max challenge')}
          </p>
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
              <span style={{ color: 'var(--text-secondary)' }}>{locale === 'zh' ? '长度' : 'Length'}: <strong style={{ color: '#22c55e' }}>{snake.length}</strong></span>
              <span style={{ color: 'var(--text-secondary)' }}>{locale === 'zh' ? '单词' : 'Words'}: <strong>{wordsCompleted}</strong></span>
            </div>
          </div>

          {/* Grid */}
          <div className="flex justify-center mb-4">
            <div className="rounded-2xl p-3" style={{
              background: 'var(--glass-bg)',
              border: '1px solid var(--glass-border)',
              boxShadow: 'var(--glass-shadow)',
            }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${GRID_SIZE}, ${CELL_SIZE}px)`,
                gap: '1px',
                background: 'rgba(128,128,128,0.1)',
                borderRadius: '8px',
                overflow: 'hidden',
              }}>
                {renderGrid()}
              </div>
            </div>
          </div>

          {/* Direction words panel */}
          <div className="glass-card p-4 mb-4" style={{ cursor: 'default' }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'none'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'none'; }}>
            <div className="flex flex-col items-center gap-1">
              {/* Up */}
              <DirectionLabel choice={getChoiceByDir('up')} input={input} />
              {/* Left / Right */}
              <div className="flex items-center gap-8">
                <DirectionLabel choice={getChoiceByDir('left')} input={input} />
                <div className="w-12 h-8 flex items-center justify-center text-lg">🐍</div>
                <DirectionLabel choice={getChoiceByDir('right')} input={input} />
              </div>
              {/* Down */}
              <DirectionLabel choice={getChoiceByDir('down')} input={input} />
            </div>
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
              placeholder={locale === 'zh' ? '输入方向单词...' : 'Type direction word...'}
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
          <div className="text-5xl mb-2">🐍</div>
          <h2 className="text-2xl font-extrabold" style={{ color: 'var(--text-primary)' }}>
            {locale === 'zh' ? '游戏结束！' : 'Game Over!'}
          </h2>
          <div className="grid grid-cols-2 gap-4 max-w-xs mx-auto text-sm">
            <div style={{ color: 'var(--text-secondary)' }}>{locale === 'zh' ? '分数' : 'Score'}</div>
            <div style={{ color: 'var(--primary-color)' }} className="font-bold">{score}</div>
            <div style={{ color: 'var(--text-secondary)' }}>{locale === 'zh' ? '蛇长度' : 'Snake Length'}</div>
            <div className="font-bold" style={{ color: '#22c55e' }}>{snake.length}</div>
            <div style={{ color: 'var(--text-secondary)' }}>{locale === 'zh' ? '完成单词' : 'Words Typed'}</div>
            <div className="font-bold" style={{ color: 'var(--text-primary)' }}>{wordsCompleted}</div>
          </div>
          <div className="flex justify-center gap-3 pt-2">
            <Button type="primary" size="large" onClick={startGame}>{locale === 'zh' ? '再来一局' : 'Play Again'}</Button>
            <Button size="large" onClick={onBack}>{locale === 'zh' ? '返回' : 'Back'}</Button>
          </div>
          <GameLeaderboard gameId="snake" currentScore={score} />
        </div>
      )}
    </div>
  );
}

function DirectionLabel({ choice, input }: { readonly choice: DirectionChoice | undefined; readonly input: string }) {
  if (!choice) return null;
  const isMatching = !choice.disabled && input.length > 0 && choice.word.startsWith(input);
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-mono" style={{
      opacity: choice.disabled ? 0.3 : 1,
      color: isMatching ? 'var(--primary-color)' : choice.disabled ? 'var(--text-muted)' : 'var(--text-primary)',
      background: isMatching ? 'rgba(99,102,241,0.1)' : 'transparent',
      border: `1px solid ${isMatching ? 'var(--primary-color)' : 'transparent'}`,
      transition: 'all 0.2s',
    }}>
      <span>{choice.emoji}</span>
      <span style={{ fontWeight: 700 }}>{choice.word}</span>
    </div>
  );
}
