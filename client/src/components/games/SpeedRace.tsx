import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@arco-design/web-react';
import { getRandomWords } from '../../lib/gameWords';
import { useLocale } from '../../lib/hooks';
import { playKeySound, playErrorSound, playCompleteSound } from '../../lib/sounds';

interface Props {
  readonly onBack: () => void;
}

export default function SpeedRace({ onBack }: Props) {
  const locale = useLocale();
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'over'>('idle');
  const [timeLeft, setTimeLeft] = useState(60);
  const [wordsCompleted, setWordsCompleted] = useState(0);
  const [totalChars, setTotalChars] = useState(0);
  const [errors, setErrors] = useState(0);
  const [currentWord, setCurrentWord] = useState('');
  const [typedChars, setTypedChars] = useState(0);
  const [wpm, setWpm] = useState(0);

  const wordQueueRef = useRef<string[]>([]);
  const startTimeRef = useRef(0);
  const totalCharsRef = useRef(0);
  const errorsRef = useRef(0);
  const wordsRef = useRef(0);
  const gameStateRef = useRef<'idle' | 'playing' | 'over'>('idle');

  const nextWord = useCallback(() => {
    if (wordQueueRef.current.length < 5) {
      wordQueueRef.current = [...wordQueueRef.current, ...getRandomWords(20, 'medium')];
    }
    const word = wordQueueRef.current.shift()!;
    setCurrentWord(word);
    setTypedChars(0);
  }, []);

  const startGame = useCallback(() => {
    setGameState('playing');
    gameStateRef.current = 'playing';
    setTimeLeft(60);
    setWordsCompleted(0); wordsRef.current = 0;
    setTotalChars(0); totalCharsRef.current = 0;
    setErrors(0); errorsRef.current = 0;
    setWpm(0);
    startTimeRef.current = Date.now();
    wordQueueRef.current = [...getRandomWords(20, 'medium')];
    nextWord();
  }, [nextWord]);

  const endGame = useCallback(() => {
    setGameState('over');
    gameStateRef.current = 'over';
    playCompleteSound();
    const elapsed = (Date.now() - startTimeRef.current) / 60000;
    const finalWpm = elapsed > 0 ? Math.round((totalCharsRef.current / 5) / elapsed) : 0;
    setWpm(finalWpm);

    const xp = finalWpm + wordsRef.current * 2;
    const currentXp = parseInt(localStorage.getItem('typerace_xp') || '0');
    localStorage.setItem('typerace_xp', String(currentXp + xp));
  }, []);

  // Timer
  useEffect(() => {
    if (gameState !== 'playing') return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { clearInterval(timer); endGame(); return 0; }
        // Update WPM
        const elapsed = (Date.now() - startTimeRef.current) / 60000;
        setWpm(elapsed > 0 ? Math.round((totalCharsRef.current / 5) / elapsed) : 0);
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [gameState, endGame]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (gameStateRef.current !== 'playing') return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key === 'Shift' || e.key === 'Control' || e.key === 'Meta' || e.key === 'Alt' ||
        e.key === 'CapsLock' || e.key === 'Tab' || e.key === 'Escape') return;
    e.preventDefault();

    if (e.key === ' ' || e.key.length !== 1) return;

    const expected = currentWord[typedChars];
    if (e.key === expected) {
      playKeySound();
      totalCharsRef.current++;
      setTotalChars(totalCharsRef.current);
      const newTyped = typedChars + 1;
      setTypedChars(newTyped);

      if (newTyped >= currentWord.length) {
        wordsRef.current++;
        setWordsCompleted(wordsRef.current);
        nextWord();
      }
    } else {
      playErrorSound();
      errorsRef.current++;
      setErrors(errorsRef.current);
    }
  }, [currentWord, typedChars, nextWord]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Progress bar for time
  const timePercent = (timeLeft / 60) * 100;

  return (
    <div>
      {gameState === 'idle' && (
        <div className="glass-card p-8 text-center space-y-4" style={{ cursor: 'default' }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'none'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'none'; }}>
          <div className="text-6xl mb-4">⚡</div>
          <h2 className="text-2xl font-extrabold" style={{ color: 'var(--text-primary)' }}>
            {locale === 'zh' ? '极速竞赛' : 'Speed Race'}
          </h2>
          <p style={{ color: 'var(--text-secondary)' }}>
            {locale === 'zh' ? '60秒限时！尽可能快地打出单词，看看你的WPM能到多少！' : '60 seconds! Type as fast as you can and see your WPM!'}
          </p>
          <Button type="primary" size="large" onClick={startGame}>
            {locale === 'zh' ? '开始竞赛' : 'Start Race'}
          </Button>
        </div>
      )}

      {gameState === 'playing' && (
        <div>
          {/* Time bar */}
          <div className="h-2 rounded-full overflow-hidden mb-4" style={{ background: 'var(--glass-border)' }}>
            <div className="h-full rounded-full transition-all duration-1000"
              style={{
                width: `${timePercent}%`,
                background: timeLeft <= 10 ? '#ef4444' : timeLeft <= 20 ? '#f59e0b' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              }} />
          </div>

          {/* HUD */}
          <div className="glass-card p-3 mb-6 flex items-center justify-between" style={{ cursor: 'default' }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'none'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'none'; }}>
            <div className="flex items-center gap-4 text-sm">
              <span style={{ color: 'var(--text-secondary)' }}>WPM: <strong style={{ color: 'var(--primary-color)' }}>{wpm}</strong></span>
              <span style={{ color: 'var(--text-secondary)' }}>{locale === 'zh' ? '单词' : 'Words'}: <strong className="text-emerald-500">{wordsCompleted}</strong></span>
              <span style={{ color: 'var(--text-secondary)' }}>{locale === 'zh' ? '错误' : 'Errors'}: <strong className="text-red-500">{errors}</strong></span>
            </div>
            <div className="text-2xl font-extrabold tabular-nums" style={{ color: timeLeft <= 10 ? '#ef4444' : 'var(--primary-color)' }}>
              {timeLeft}
            </div>
          </div>

          {/* Current word */}
          <div className="glass-card p-10 mb-6 text-center" style={{ cursor: 'default' }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'none'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'none'; }}>
            {/* Upcoming words preview */}
            <div className="flex justify-center gap-3 mb-6 text-sm" style={{ color: 'var(--text-muted)' }}>
              {wordQueueRef.current.slice(0, 3).map((w, i) => (
                <span key={i} className="px-3 py-1 rounded-lg" style={{ background: 'var(--bg-card)', border: '1px solid var(--glass-border)' }}>{w}</span>
              ))}
            </div>

            <div className="text-5xl font-mono font-bold tracking-[0.3em] select-none">
              {currentWord.split('').map((char, i) => (
                <span key={i} style={{
                  color: i < typedChars ? '#10b981' : i === typedChars ? 'var(--primary-color)' : 'var(--text-muted)',
                  textDecoration: i === typedChars ? 'underline' : 'none',
                  textDecorationColor: 'var(--primary-color)',
                  textUnderlineOffset: '10px',
                }}>
                  {char}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {gameState === 'over' && (
        <div className="glass-card p-8 text-center space-y-4" style={{ cursor: 'default' }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'none'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'none'; }}>
          <div className="text-5xl mb-2">⚡</div>
          <h2 className="text-2xl font-extrabold" style={{ color: 'var(--text-primary)' }}>
            {locale === 'zh' ? '竞赛结束！' : 'Race Complete!'}
          </h2>
          <div className="text-4xl font-extrabold my-4" style={{ color: 'var(--primary-color)' }}>
            {wpm} WPM
          </div>
          <div className="flex justify-center gap-8 text-lg">
            <span style={{ color: 'var(--text-secondary)' }}>{locale === 'zh' ? '单词' : 'Words'}: <strong className="text-emerald-500">{wordsCompleted}</strong></span>
            <span style={{ color: 'var(--text-secondary)' }}>{locale === 'zh' ? '字符' : 'Chars'}: <strong style={{ color: 'var(--primary-color)' }}>{totalChars}</strong></span>
            <span style={{ color: 'var(--text-secondary)' }}>{locale === 'zh' ? '错误' : 'Errors'}: <strong className="text-red-500">{errors}</strong></span>
            <span style={{ color: 'var(--text-secondary)' }}>{locale === 'zh' ? '准确率' : 'Accuracy'}: <strong className="text-emerald-500">{totalChars + errors > 0 ? Math.round((totalChars / (totalChars + errors)) * 100) : 100}%</strong></span>
          </div>
          <div className="flex justify-center gap-3 pt-2">
            <Button type="primary" size="large" onClick={startGame}>{locale === 'zh' ? '再来一局' : 'Play Again'}</Button>
            <Button size="large" onClick={onBack}>{locale === 'zh' ? '返回' : 'Back'}</Button>
          </div>
        </div>
      )}
    </div>
  );
}
