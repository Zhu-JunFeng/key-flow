import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@arco-design/web-react';
import { getRandomWords } from '../../lib/gameWords';
import { useLocale } from '../../lib/hooks';
import { playKeySound, playErrorSound, playCompleteSound } from '../../lib/sounds';

interface Props {
  readonly onBack: () => void;
}

export default function SurvivalMode({ onBack }: Props) {
  const locale = useLocale();
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'over'>('idle');
  const [lives, setLives] = useState(3);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [currentWord, setCurrentWord] = useState('');
  const [typedChars, setTypedChars] = useState(0);
  const [wordsCompleted, setWordsCompleted] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');

  const wordQueueRef = useRef<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const nextWord = useCallback(() => {
    if (wordQueueRef.current.length === 0) {
      wordQueueRef.current = [...getRandomWords(20, difficulty)];
    }
    const word = wordQueueRef.current.shift()!;
    setCurrentWord(word);
    setTypedChars(0);
  }, [difficulty]);

  const startGame = useCallback(() => {
    setGameState('playing');
    setLives(3);
    setScore(0);
    setCombo(0);
    setMaxCombo(0);
    setWordsCompleted(0);
    setStartTime(Date.now());
    wordQueueRef.current = [...getRandomWords(20, difficulty)];
    nextWord();
    setTimeout(() => inputRef.current?.focus(), 100);
  }, [difficulty, nextWord]);

  const endGame = useCallback(() => {
    setGameState('over');
    playCompleteSound();
    const xp = score + maxCombo * 2;
    const currentXp = parseInt(localStorage.getItem('typerace_xp') || '0');
    localStorage.setItem('typerace_xp', String(currentXp + xp));
  }, [score, maxCombo]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (gameState !== 'playing') return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key === 'Shift' || e.key === 'Control' || e.key === 'Meta' || e.key === 'Alt' ||
        e.key === 'CapsLock' || e.key === 'Tab' || e.key === 'Escape') return;

    e.preventDefault();

    if (e.key.length !== 1) return;

    const expected = currentWord[typedChars];
    if (e.key === expected) {
      playKeySound();
      const newTyped = typedChars + 1;
      setTypedChars(newTyped);

      if (newTyped >= currentWord.length) {
        // Word completed
        setWordsCompleted(prev => prev + 1);
        setCombo(prev => {
          const newCombo = prev + 1;
          setMaxCombo(mc => Math.max(mc, newCombo));
          return newCombo;
        });
        setScore(prev => prev + 10 + currentWord.length * 2);
        nextWord();
      }
    } else {
      playErrorSound();
      setCombo(0);
      setLives(prev => {
        const newLives = prev - 1;
        if (newLives <= 0) {
          endGame();
        }
        return newLives;
      });
    }
  }, [gameState, currentWord, typedChars, nextWord, endGame]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const elapsed = startTime ? Math.round((Date.now() - startTime) / 1000) : 0;

  return (
    <div>
      {gameState === 'idle' && (
        <div className="glass-card p-8 text-center space-y-4" style={{ cursor: 'default' }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'none'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'none'; }}>
          <div className="text-6xl mb-4">💀</div>
          <h2 className="text-2xl font-extrabold" style={{ color: 'var(--text-primary)' }}>
            {locale === 'zh' ? '生存模式' : 'Survival Mode'}
          </h2>
          <p style={{ color: 'var(--text-secondary)' }}>
            {locale === 'zh' ? '3条命，每打错一个字母扣一条命。坚持越久分数越高！' : '3 lives, each typo costs one life. Survive as long as you can!'}
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
            {locale === 'zh' ? '开始挑战' : 'Start Challenge'}
          </Button>
        </div>
      )}

      {gameState === 'playing' && (
        <div>
          {/* HUD */}
          <div className="glass-card p-3 mb-6 flex items-center justify-between" style={{ cursor: 'default' }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'none'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'none'; }}>
            <div className="flex items-center gap-4 text-sm">
              <span style={{ color: 'var(--text-secondary)' }}>{locale === 'zh' ? '分数' : 'Score'}: <strong style={{ color: 'var(--primary-color)' }}>{score}</strong></span>
              <span style={{ color: 'var(--text-secondary)' }}>{locale === 'zh' ? '单词' : 'Words'}: <strong className="text-emerald-500">{wordsCompleted}</strong></span>
              {combo > 1 && (
                <span className="px-2 py-0.5 rounded-full text-xs font-bold animate-pulse"
                  style={{ background: combo >= 10 ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.15)', color: combo >= 10 ? '#ef4444' : '#f59e0b' }}>
                  Combo x{combo}
                </span>
              )}
              <span style={{ color: 'var(--text-muted)' }}>{elapsed}s</span>
            </div>
            <div className="flex items-center gap-1">
              {Array.from({ length: 3 }, (_, i) => (
                <span key={i} className="text-lg">{i < lives ? '❤️' : '🖤'}</span>
              ))}
            </div>
          </div>

          {/* Current word display */}
          <div className="glass-card p-10 mb-6 text-center" style={{ cursor: 'default' }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'none'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'none'; }}>
            <div className="text-4xl font-mono font-bold tracking-[0.3em] select-none">
              {currentWord.split('').map((char, i) => (
                <span key={i} style={{
                  color: i < typedChars ? '#10b981' : i === typedChars ? 'var(--primary-color)' : 'var(--text-muted)',
                  textDecoration: i === typedChars ? 'underline' : 'none',
                  textDecorationColor: 'var(--primary-color)',
                  textUnderlineOffset: '8px',
                }}>
                  {char}
                </span>
              ))}
            </div>
            <p className="text-sm mt-6" style={{ color: 'var(--text-muted)' }}>
              {locale === 'zh' ? '直接打字，不需要点击输入框' : 'Just type, no need to click'}
            </p>
          </div>
        </div>
      )}

      {gameState === 'over' && (
        <div className="glass-card p-8 text-center space-y-4" style={{ cursor: 'default' }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'none'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'none'; }}>
          <div className="text-5xl mb-2">💀</div>
          <h2 className="text-2xl font-extrabold" style={{ color: 'var(--text-primary)' }}>
            {locale === 'zh' ? '挑战结束！' : 'Challenge Over!'}
          </h2>
          <div className="flex justify-center gap-8 text-lg">
            <span style={{ color: 'var(--text-secondary)' }}>{locale === 'zh' ? '分数' : 'Score'}: <strong style={{ color: 'var(--primary-color)' }}>{score}</strong></span>
            <span style={{ color: 'var(--text-secondary)' }}>{locale === 'zh' ? '单词' : 'Words'}: <strong className="text-emerald-500">{wordsCompleted}</strong></span>
            <span style={{ color: 'var(--text-secondary)' }}>Combo: <strong style={{ color: '#f59e0b' }}>x{maxCombo}</strong></span>
            <span style={{ color: 'var(--text-secondary)' }}>{locale === 'zh' ? '时间' : 'Time'}: <strong className="text-purple-500">{elapsed}s</strong></span>
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
