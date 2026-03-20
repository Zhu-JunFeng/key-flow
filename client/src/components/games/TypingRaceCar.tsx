import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@arco-design/web-react';
import { getRandomWords } from '../../lib/gameWords';
import { useLocale } from '../../lib/hooks';
import { playKeySound, playErrorSound, playCompleteSound } from '../../lib/sounds';
import { submitGameScore } from '../../lib/api';
import GameLeaderboard from './GameLeaderboard';

interface Props {
  readonly onBack: () => void;
}

const RACE_DURATION = 60; // seconds
const TRACK_LENGTH = 1000; // meters

export default function TypingRaceCar({ onBack }: Props) {
  const locale = useLocale();
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'finished'>('idle');
  const [words, setWords] = useState<readonly string[]>([]);
  const [currentWordIdx, setCurrentWordIdx] = useState(0);
  const [input, setInput] = useState('');
  const [timeLeft, setTimeLeft] = useState(RACE_DURATION);
  const [distance, setDistance] = useState(0);
  const [speed, setSpeed] = useState(0); // current WPM
  const [wordsCompleted, setWordsCompleted] = useState(0);
  const [correctChars, setCorrectChars] = useState(0);
  const [gear, setGear] = useState(1);
  const [boostActive, setBoostActive] = useState(false);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');

  const inputRef = useRef<HTMLInputElement>(null);
  const startTimeRef = useRef(0);
  const lastWordTimeRef = useRef(0);

  const startGame = useCallback(() => {
    const newWords = getRandomWords(100, difficulty);
    setWords(newWords);
    setCurrentWordIdx(0);
    setInput('');
    setTimeLeft(RACE_DURATION);
    setDistance(0);
    setSpeed(0);
    setWordsCompleted(0);
    setCorrectChars(0);
    setGear(1);
    setBoostActive(false);
    startTimeRef.current = Date.now();
    lastWordTimeRef.current = Date.now();
    setGameState('playing');
    setTimeout(() => inputRef.current?.focus(), 100);
  }, [difficulty]);

  // Timer & physics
  useEffect(() => {
    if (gameState !== 'playing') return;
    const interval = setInterval(() => {
      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      const remaining = Math.max(0, RACE_DURATION - elapsed);
      setTimeLeft(Math.round(remaining));

      // Calculate current speed from recent typing
      const currentWpm = elapsed > 0 ? Math.round((correctChars / 5) / (elapsed / 60)) : 0;
      setSpeed(currentWpm);

      // Update distance based on speed
      setDistance(prev => {
        const increment = (currentWpm / 60) * 10; // distance per tick
        return Math.min(TRACK_LENGTH, prev + increment);
      });

      // Update gear
      if (currentWpm >= 80) setGear(5);
      else if (currentWpm >= 60) setGear(4);
      else if (currentWpm >= 40) setGear(3);
      else if (currentWpm >= 20) setGear(2);
      else setGear(1);

      if (remaining <= 0) {
        setGameState('finished');
        playCompleteSound();
        const xp = wordsCompleted * 2 + Math.round(distance / 50);
        const currentXp = parseInt(localStorage.getItem('typerace_xp') || '0');
        localStorage.setItem('typerace_xp', String(currentXp + xp));
        submitGameScore({ gameId: 'racecar', score: Math.round(distance), difficulty }).catch(() => {});
      }
    }, 100);
    return () => clearInterval(interval);
  }, [gameState, correctChars, wordsCompleted, distance, difficulty]);

  const handleInput = (value: string) => {
    if (gameState !== 'playing') return;
    setInput(value);

    const currentWord = words[currentWordIdx];
    if (!currentWord) return;

    if (value === currentWord) {
      playKeySound();
      setCorrectChars(prev => prev + currentWord.length);
      setWordsCompleted(prev => prev + 1);
      setInput('');

      // Boost on fast word completion
      const timeSinceLast = Date.now() - lastWordTimeRef.current;
      if (timeSinceLast < 1500) {
        setBoostActive(true);
        setTimeout(() => setBoostActive(false), 500);
      }
      lastWordTimeRef.current = Date.now();

      const nextIdx = currentWordIdx + 1;
      if (nextIdx >= words.length) {
        const moreWords = getRandomWords(100, difficulty);
        setWords(prev => [...prev, ...moreWords]);
      }
      setCurrentWordIdx(nextIdx);
    } else if (currentWord.startsWith(value)) {
      playKeySound();
    } else {
      playErrorSound();
    }
  };

  const trackProgress = (distance / TRACK_LENGTH) * 100;
  const timeProgress = (timeLeft / RACE_DURATION) * 100;
  const gearColors = ['#94a3b8', '#10b981', '#3b82f6', '#f59e0b', '#ef4444'];

  return (
    <div>
      {gameState === 'idle' && (
        <div className="glass-card p-8 text-center space-y-4" style={{ cursor: 'default' }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'none'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'none'; }}>
          <div className="text-6xl mb-4">🏎️</div>
          <h2 className="text-2xl font-extrabold" style={{ color: 'var(--text-primary)' }}>
            {locale === 'zh' ? '打字赛车' : 'Typing Race Car'}
          </h2>
          <p style={{ color: 'var(--text-secondary)' }}>
            {locale === 'zh'
              ? '你的打字速度就是车速！60秒内跑尽可能远的距离。打字越快，档位越高！'
              : 'Your typing speed IS your car speed! Drive as far as you can in 60 seconds. Faster typing = higher gear!'}
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
            {locale === 'zh' ? '发动引擎' : 'Start Engine'}
          </Button>
        </div>
      )}

      {gameState === 'playing' && (
        <div>
          {/* Dashboard */}
          <div className="glass-card p-4 mb-4" style={{ cursor: 'default' }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'none'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'none'; }}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-4">
                {/* Speedometer */}
                <div className="text-center">
                  <div className="text-3xl font-extrabold tabular-nums" style={{
                    color: gearColors[gear - 1],
                  }}>
                    {speed}
                  </div>
                  <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>WPM</div>
                </div>
                {/* Gear */}
                <div className="w-10 h-10 rounded-lg flex items-center justify-center text-lg font-extrabold" style={{
                  background: `${gearColors[gear - 1]}20`,
                  border: `2px solid ${gearColors[gear - 1]}`,
                  color: gearColors[gear - 1],
                }}>
                  {gear}
                </div>
              </div>
              {/* Time */}
              <div className="text-right">
                <div className="text-2xl font-extrabold tabular-nums" style={{
                  color: timeLeft <= 10 ? '#ef4444' : timeLeft <= 20 ? '#f59e0b' : 'var(--text-primary)',
                }}>
                  {timeLeft}s
                </div>
                <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                  {locale === 'zh' ? '剩余' : 'Left'}
                </div>
              </div>
            </div>

            {/* Time bar */}
            <div className="h-1.5 rounded-full overflow-hidden mb-3" style={{ background: 'rgba(148,163,184,0.15)' }}>
              <div className="h-full rounded-full transition-all duration-100" style={{
                width: `${timeProgress}%`,
                background: timeLeft <= 10 ? '#ef4444' : timeLeft <= 20 ? '#f59e0b' : '#10b981',
              }} />
            </div>

            {/* Race track */}
            <div className="relative h-12 rounded-xl overflow-hidden" style={{
              background: 'rgba(148,163,184,0.08)',
              border: '1px solid var(--glass-border)',
            }}>
              {/* Track markings */}
              {[0, 25, 50, 75, 100].map(p => (
                <div key={p} className="absolute top-0 bottom-0 w-px" style={{
                  left: `${p}%`,
                  background: 'rgba(148,163,184,0.15)',
                }} />
              ))}
              {/* Car */}
              <div className="absolute top-1/2 -translate-y-1/2 text-2xl transition-all duration-200" style={{
                left: `${Math.min(trackProgress, 96)}%`,
                filter: boostActive ? 'drop-shadow(0 0 8px #f59e0b)' : 'none',
              }}>
                🏎️
              </div>
              {/* Finish flag */}
              <div className="absolute right-1 top-1/2 -translate-y-1/2 text-lg">🏁</div>
              {/* Distance */}
              <div className="absolute bottom-1 right-2 text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>
                {Math.round(distance)}m / {TRACK_LENGTH}m
              </div>
            </div>
          </div>

          {/* Current word */}
          <div className={`glass-card p-8 mb-4 text-center ${boostActive ? 'ring-2 ring-yellow-400' : ''}`}
            style={{ cursor: 'default' }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'none'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'none'; }}>
            {boostActive && (
              <div className="text-xs font-bold mb-2" style={{ color: '#f59e0b' }}>
                🔥 BOOST!
              </div>
            )}
            <div className="text-4xl font-mono font-bold tracking-wider mb-4" style={{ color: 'var(--text-primary)' }}>
              {words[currentWordIdx]?.split('').map((char, i) => (
                <span key={i} style={{
                  color: i < input.length
                    ? input[i] === char ? '#10b981' : '#ef4444'
                    : 'var(--text-primary)',
                }}>{char}</span>
              ))}
            </div>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => handleInput(e.target.value)}
              className="w-full max-w-md mx-auto px-4 py-3 rounded-xl text-center text-lg font-mono outline-none"
              style={{
                background: 'var(--bg-card)',
                border: '2px solid var(--glass-border)',
                color: 'var(--text-primary)',
              }}
              autoFocus
              autoComplete="off"
              autoCapitalize="off"
              spellCheck={false}
            />
          </div>

          {/* Upcoming */}
          <div className="flex gap-2 justify-center flex-wrap">
            {words.slice(currentWordIdx + 1, currentWordIdx + 6).map((w, i) => (
              <span key={i} className="px-3 py-1 rounded-full text-xs" style={{
                background: 'var(--glass-bg)',
                border: '1px solid var(--glass-border)',
                color: 'var(--text-muted)',
                opacity: 1 - i * 0.15,
              }}>{w}</span>
            ))}
          </div>
        </div>
      )}

      {gameState === 'finished' && (
        <div className="glass-card p-8 text-center space-y-5" style={{ cursor: 'default' }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'none'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'none'; }}>
          <div className="text-5xl mb-2">{trackProgress >= 100 ? '🏆' : '🏎️'}</div>
          <h2 className="text-2xl font-extrabold" style={{ color: 'var(--text-primary)' }}>
            {trackProgress >= 100
              ? (locale === 'zh' ? '冲线！' : 'Finish Line!')
              : (locale === 'zh' ? '比赛结束！' : 'Race Over!')}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-lg mx-auto">
            <div className="text-center">
              <div className="text-2xl font-extrabold" style={{ color: 'var(--primary-color)' }}>{Math.round(distance)}m</div>
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{locale === 'zh' ? '距离' : 'Distance'}</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-extrabold text-emerald-500">{speed}</div>
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{locale === 'zh' ? '最终速度' : 'Final WPM'}</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-extrabold">{wordsCompleted}</div>
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{locale === 'zh' ? '词数' : 'Words'}</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-extrabold" style={{ color: gearColors[gear - 1] }}>{locale === 'zh' ? `${gear}档` : `Gear ${gear}`}</div>
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{locale === 'zh' ? '最高档位' : 'Top Gear'}</div>
            </div>
          </div>
          <div className="flex justify-center gap-3 pt-2">
            <Button type="primary" size="large" onClick={startGame}>{locale === 'zh' ? '再来一局' : 'Play Again'}</Button>
            <Button size="large" onClick={onBack}>{locale === 'zh' ? '返回' : 'Back'}</Button>
          </div>
          <GameLeaderboard gameId="racecar" currentScore={Math.round(distance)} />
        </div>
      )}
    </div>
  );
}
