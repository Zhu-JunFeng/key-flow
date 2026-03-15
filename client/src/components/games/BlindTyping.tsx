import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@arco-design/web-react';
import { getRandomWords } from '../../lib/gameWords';
import { useLocale } from '../../lib/hooks';
import { playKeySound, playErrorSound, playCompleteSound } from '../../lib/sounds';

interface Props {
  readonly onBack: () => void;
}

export default function BlindTyping({ onBack }: Props) {
  const locale = useLocale();
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'reveal'>('idle');
  const [words, setWords] = useState<readonly string[]>([]);
  const [currentWordIdx, setCurrentWordIdx] = useState(0);
  const [typedChars, setTypedChars] = useState(0);
  const [correctTotal, setCorrectTotal] = useState(0);
  const [errorTotal, setErrorTotal] = useState(0);
  const [, setWordsCompleted] = useState(0);
  const [, setStartTime] = useState<number | null>(null);
  const [typedHistory, setTypedHistory] = useState<readonly { word: string; typed: string; correct: boolean }[]>([]);
  const [currentTyped, setCurrentTyped] = useState('');

  const correctRef = useRef(0);
  const errorRef = useRef(0);
  const gameStateRef = useRef<'idle' | 'playing' | 'reveal'>('idle');
  const totalWords = 10;

  const startGame = useCallback(() => {
    const newWords = getRandomWords(totalWords, 'medium');
    setWords(newWords);
    setCurrentWordIdx(0);
    setTypedChars(0);
    setCorrectTotal(0); correctRef.current = 0;
    setErrorTotal(0); errorRef.current = 0;
    setWordsCompleted(0);
    setStartTime(Date.now());
    setTypedHistory([]);
    setCurrentTyped('');
    setGameState('playing');
    gameStateRef.current = 'playing';
  }, []);

  const revealResults = useCallback(() => {
    setGameState('reveal');
    gameStateRef.current = 'reveal';
    playCompleteSound();

    const xp = correctRef.current * 3;
    const currentXp = parseInt(localStorage.getItem('typerace_xp') || '0');
    localStorage.setItem('typerace_xp', String(currentXp + xp));
  }, []);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (gameStateRef.current !== 'playing') return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key === 'Shift' || e.key === 'Control' || e.key === 'Meta' || e.key === 'Alt' ||
        e.key === 'CapsLock' || e.key === 'Tab' || e.key === 'Escape') return;
    e.preventDefault();

    if (e.key.length !== 1) return;

    const currentWord = words[currentWordIdx];
    if (!currentWord) return;

    const expected = currentWord[typedChars];
    const isCorrect = e.key === expected;

    if (isCorrect) {
      playKeySound();
      correctRef.current++;
      setCorrectTotal(correctRef.current);
    } else {
      playErrorSound();
      errorRef.current++;
      setErrorTotal(errorRef.current);
    }

    const newTypedChars = typedChars + 1;
    const newCurrentTyped = currentTyped + e.key;
    setTypedChars(newTypedChars);
    setCurrentTyped(newCurrentTyped);

    if (newTypedChars >= currentWord.length) {
      // Word done
      const wordCorrect = newCurrentTyped === currentWord;
      setTypedHistory(prev => [...prev, { word: currentWord, typed: newCurrentTyped, correct: wordCorrect }]);
      setWordsCompleted(prev => prev + 1);
      setCurrentTyped('');
      setTypedChars(0);

      if (currentWordIdx + 1 >= totalWords) {
        revealResults();
      } else {
        setCurrentWordIdx(prev => prev + 1);
      }
    }
  }, [words, currentWordIdx, typedChars, currentTyped, revealResults]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const accuracy = correctTotal + errorTotal > 0 ? Math.round((correctTotal / (correctTotal + errorTotal)) * 100) : 100;

  return (
    <div>
      {gameState === 'idle' && (
        <div className="glass-card p-8 text-center space-y-4" style={{ cursor: 'default' }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'none'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'none'; }}>
          <div className="text-6xl mb-4">🙈</div>
          <h2 className="text-2xl font-extrabold" style={{ color: 'var(--text-primary)' }}>
            {locale === 'zh' ? '盲打挑战' : 'Blind Typing'}
          </h2>
          <p style={{ color: 'var(--text-secondary)' }}>
            {locale === 'zh' ? '你能看到目标单词，但看不到你输入的内容！凭手感和记忆打出10个单词。' : 'You can see the target word but NOT what you type! Type 10 words by feel and memory.'}
          </p>
          <Button type="primary" size="large" onClick={startGame}>
            {locale === 'zh' ? '开始挑战' : 'Start Challenge'}
          </Button>
        </div>
      )}

      {gameState === 'playing' && (
        <div>
          {/* Progress */}
          <div className="flex gap-1 mb-4">
            {Array.from({ length: totalWords }, (_, i) => (
              <div key={i} className="h-1.5 flex-1 rounded-full transition-all duration-300" style={{
                background: i < currentWordIdx ? '#10b981' : i === currentWordIdx ? 'var(--primary-color)' : 'rgba(148,163,184,0.2)',
              }} />
            ))}
          </div>

          <div className="glass-card p-3 mb-6 flex items-center justify-between" style={{ cursor: 'default' }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'none'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'none'; }}>
            <div className="flex items-center gap-4 text-sm">
              <span style={{ color: 'var(--text-secondary)' }}>{currentWordIdx + 1}/{totalWords}</span>
              <span style={{ color: 'var(--text-secondary)' }}>{locale === 'zh' ? '正确' : 'Correct'}: <strong className="text-emerald-500">{correctTotal}</strong></span>
              <span style={{ color: 'var(--text-secondary)' }}>{locale === 'zh' ? '错误' : 'Errors'}: <strong className="text-red-500">{errorTotal}</strong></span>
            </div>
          </div>

          {/* Target word - visible */}
          <div className="glass-card p-10 mb-6 text-center" style={{ cursor: 'default' }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'none'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'none'; }}>
            <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
              {locale === 'zh' ? '目标单词' : 'Target Word'}
            </p>
            <div className="text-5xl font-mono font-bold tracking-[0.3em] select-none" style={{ color: 'var(--text-primary)' }}>
              {words[currentWordIdx]}
            </div>

            {/* Blind input indicator - just dots */}
            <div className="mt-8 flex justify-center gap-2">
              {Array.from({ length: words[currentWordIdx]?.length ?? 0 }, (_, i) => (
                <div key={i} className="w-4 h-4 rounded-full transition-all duration-200"
                  style={{
                    background: i < typedChars ? 'var(--primary-color)' : 'var(--glass-border)',
                    transform: i === typedChars ? 'scale(1.3)' : 'scale(1)',
                  }} />
              ))}
            </div>
            <p className="text-xs mt-4" style={{ color: 'var(--text-muted)' }}>
              {locale === 'zh' ? '你的输入被隐藏了 — 直接打字！' : 'Your input is hidden — just type!'}
            </p>
          </div>
        </div>
      )}

      {gameState === 'reveal' && (
        <div className="glass-card p-8 text-center space-y-5" style={{ cursor: 'default' }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'none'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'none'; }}>
          <div className="text-5xl mb-2">🎯</div>
          <h2 className="text-2xl font-extrabold" style={{ color: 'var(--text-primary)' }}>
            {locale === 'zh' ? '结果揭晓！' : 'Results Revealed!'}
          </h2>
          <div className="flex justify-center gap-6 text-lg">
            <span style={{ color: 'var(--text-secondary)' }}>{locale === 'zh' ? '准确率' : 'Accuracy'}: <strong className="text-emerald-500">{accuracy}%</strong></span>
            <span style={{ color: 'var(--text-secondary)' }}>{locale === 'zh' ? '正确' : 'Correct'}: <strong className="text-emerald-500">{correctTotal}</strong></span>
            <span style={{ color: 'var(--text-secondary)' }}>{locale === 'zh' ? '错误' : 'Errors'}: <strong className="text-red-500">{errorTotal}</strong></span>
          </div>

          {/* Word comparison */}
          <div className="space-y-2 text-left max-w-md mx-auto mt-4">
            {typedHistory.map((item, i) => (
              <div key={i} className="flex items-center gap-3 p-2 rounded-xl text-sm font-mono" style={{
                background: item.correct ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
                border: `1px solid ${item.correct ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`,
              }}>
                <span className="text-lg">{item.correct ? '✅' : '❌'}</span>
                <span style={{ color: 'var(--text-muted)' }}>{item.word}</span>
                <span style={{ color: 'var(--text-muted)' }}>&rarr;</span>
                <span style={{ color: item.correct ? '#10b981' : '#ef4444' }}>{item.typed}</span>
              </div>
            ))}
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
