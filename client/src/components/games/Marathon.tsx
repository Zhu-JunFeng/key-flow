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

const MILESTONES = [10, 25, 50, 100, 150, 200, 300, 500];
const MILESTONE_EMOJIS = ['🏃', '🚶', '🏃‍♂️', '🚴', '🏎️', '🚀', '✈️', '🌟'];

export default function Marathon({ onBack }: Props) {
  const locale = useLocale();
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'finished'>('idle');
  const [words, setWords] = useState<readonly string[]>([]);
  const [currentWordIdx, setCurrentWordIdx] = useState(0);
  const [input, setInput] = useState('');
  const [wordsCompleted, setWordsCompleted] = useState(0);
  const [correctChars, setCorrectChars] = useState(0);
  const [totalChars, setTotalChars] = useState(0);
  const [startTime, setStartTime] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [lastMilestone, setLastMilestone] = useState(0);
  const [showMilestone, setShowMilestone] = useState<string | null>(null);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');

  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startGame = useCallback(() => {
    const newWords = getRandomWords(100, difficulty);
    setWords(newWords);
    setCurrentWordIdx(0);
    setInput('');
    setWordsCompleted(0);
    setCorrectChars(0);
    setTotalChars(0);
    setStartTime(Date.now());
    setElapsed(0);
    setCombo(0);
    setMaxCombo(0);
    setLastMilestone(0);
    setShowMilestone(null);
    setGameState('playing');
    setTimeout(() => inputRef.current?.focus(), 100);
  }, [difficulty]);

  // Timer
  useEffect(() => {
    if (gameState !== 'playing') {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    timerRef.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameState, startTime]);

  const finishGame = useCallback(() => {
    setGameState('finished');
    playCompleteSound();
    const xp = wordsCompleted * 2 + maxCombo;
    const currentXp = parseInt(localStorage.getItem('typerace_xp') || '0');
    localStorage.setItem('typerace_xp', String(currentXp + xp));
    submitGameScore({ gameId: 'marathon', score: wordsCompleted, difficulty }).catch(() => {});
  }, [wordsCompleted, maxCombo, difficulty]);

  const handleInput = (value: string) => {
    if (gameState !== 'playing') return;
    setInput(value);

    const currentWord = words[currentWordIdx];
    if (!currentWord) return;

    if (value.endsWith(' ') || value === currentWord) {
      const typed = value.trim();
      const isCorrect = typed === currentWord;
      setTotalChars(prev => prev + currentWord.length);

      if (isCorrect) {
        playKeySound();
        setCorrectChars(prev => prev + currentWord.length);
        setCombo(prev => {
          const newCombo = prev + 1;
          setMaxCombo(mc => Math.max(mc, newCombo));
          return newCombo;
        });
      } else {
        playErrorSound();
        setCombo(0);
      }

      const completedWords = wordsCompleted + 1;
      setWordsCompleted(completedWords);
      const milestoneIdx = MILESTONES.findIndex(m => m === completedWords);
      if (milestoneIdx >= 0 && completedWords > lastMilestone) {
        setLastMilestone(completedWords);
        setShowMilestone(`${MILESTONE_EMOJIS[milestoneIdx]} ${completedWords} ${locale === 'zh' ? '词!' : 'words!'}`);
        playCompleteSound();
        setTimeout(() => setShowMilestone(null), 2000);
      }
      setInput('');

      const nextIdx = currentWordIdx + 1;
      if (nextIdx >= words.length) {
        // Load more words
        const moreWords = getRandomWords(100, difficulty);
        setWords(prev => [...prev, ...moreWords]);
      }
      setCurrentWordIdx(nextIdx);
    }
  };

  const wpm = elapsed > 0 ? Math.round((correctChars / 5) / (elapsed / 60)) : 0;
  const accuracy = totalChars > 0 ? Math.round((correctChars / totalChars) * 100) : 100;
  const currentMilestoneIdx = MILESTONES.findIndex(m => m > wordsCompleted);
  const nextMilestone = currentMilestoneIdx >= 0 ? MILESTONES[currentMilestoneIdx] : null;
  const prevMilestone = currentMilestoneIdx > 0 ? MILESTONES[currentMilestoneIdx - 1] : 0;
  const progress = nextMilestone
    ? ((wordsCompleted - prevMilestone) / (nextMilestone - prevMilestone)) * 100
    : 100;

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <div>
      {gameState === 'idle' && (
        <div className="glass-card p-8 text-center space-y-4" style={{ cursor: 'default' }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'none'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'none'; }}>
          <div className="text-6xl mb-4">🏃</div>
          <h2 className="text-2xl font-extrabold" style={{ color: 'var(--text-primary)' }}>
            {locale === 'zh' ? '马拉松模式' : 'Marathon Mode'}
          </h2>
          <p style={{ color: 'var(--text-secondary)' }}>
            {locale === 'zh'
              ? '没有时间限制，持续打字，看你能坚持多久！每达到里程碑都有庆祝。随时可以结束。'
              : 'No time limit. Keep typing as long as you can! Milestones celebrate your progress. Stop whenever you want.'}
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
            {locale === 'zh' ? '开始跑步' : 'Start Running'}
          </Button>
        </div>
      )}

      {gameState === 'playing' && (
        <div>
          {/* Milestone popup */}
          {showMilestone && (
            <div className="fixed top-1/3 left-1/2 -translate-x-1/2 z-50 px-8 py-4 rounded-2xl text-2xl font-extrabold animate-bounce"
              style={{
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                color: 'white',
                boxShadow: '0 10px 40px rgba(99,102,241,0.5)',
              }}>
              {showMilestone}
            </div>
          )}

          {/* Stats */}
          <div className="glass-card p-3 mb-4 flex items-center justify-between flex-wrap gap-2" style={{ cursor: 'default' }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'none'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'none'; }}>
            <div className="flex items-center gap-4 text-sm">
              <span style={{ color: 'var(--text-secondary)' }}>
                ⏱ {formatTime(elapsed)}
              </span>
              <span style={{ color: 'var(--text-secondary)' }}>
                {locale === 'zh' ? '词数' : 'Words'}: <strong style={{ color: 'var(--primary-color)' }}>{wordsCompleted}</strong>
              </span>
              <span style={{ color: 'var(--text-secondary)' }}>
                WPM: <strong className="text-emerald-500">{wpm}</strong>
              </span>
              <span style={{ color: 'var(--text-secondary)' }}>
                {locale === 'zh' ? '准确率' : 'Acc'}: <strong>{accuracy}%</strong>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm" style={{ color: combo >= 5 ? '#ef4444' : combo >= 3 ? '#f59e0b' : 'var(--text-muted)' }}>
                {combo}x
              </span>
              <Button size="small" onClick={finishGame}>
                {locale === 'zh' ? '结束' : 'Finish'}
              </Button>
            </div>
          </div>

          {/* Progress to next milestone */}
          {nextMilestone && (
            <div className="mb-4">
              <div className="flex justify-between text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
                <span>{MILESTONE_EMOJIS[currentMilestoneIdx > 0 ? currentMilestoneIdx - 1 : 0]} {prevMilestone}</span>
                <span>{MILESTONE_EMOJIS[currentMilestoneIdx]} {nextMilestone}</span>
              </div>
              <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(148,163,184,0.15)' }}>
                <div className="h-full rounded-full transition-all duration-300" style={{
                  width: `${progress}%`,
                  background: 'linear-gradient(90deg, #6366f1, #8b5cf6)',
                }} />
              </div>
            </div>
          )}

          {/* Current word */}
          <div className="glass-card p-8 mb-4 text-center" style={{ cursor: 'default' }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'none'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'none'; }}>
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
            {words.slice(currentWordIdx + 1, currentWordIdx + 8).map((w, i) => (
              <span key={i} className="px-3 py-1 rounded-full text-xs" style={{
                background: 'var(--glass-bg)',
                border: '1px solid var(--glass-border)',
                color: 'var(--text-muted)',
                opacity: 1 - i * 0.1,
              }}>{w}</span>
            ))}
          </div>
        </div>
      )}

      {gameState === 'finished' && (
        <div className="glass-card p-8 text-center space-y-5" style={{ cursor: 'default' }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'none'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'none'; }}>
          <div className="text-5xl mb-2">🏅</div>
          <h2 className="text-2xl font-extrabold" style={{ color: 'var(--text-primary)' }}>
            {locale === 'zh' ? '马拉松完成！' : 'Marathon Complete!'}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-lg mx-auto">
            <div className="text-center">
              <div className="text-2xl font-extrabold" style={{ color: 'var(--primary-color)' }}>{wordsCompleted}</div>
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{locale === 'zh' ? '总词数' : 'Words'}</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-extrabold text-emerald-500">{wpm}</div>
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>WPM</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-extrabold">{accuracy}%</div>
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{locale === 'zh' ? '准确率' : 'Accuracy'}</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-extrabold text-orange-500">{maxCombo}x</div>
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{locale === 'zh' ? '最高连击' : 'Max Combo'}</div>
            </div>
          </div>
          <p style={{ color: 'var(--text-secondary)' }}>
            ⏱ {formatTime(elapsed)}
          </p>
          <div className="flex justify-center gap-3 pt-2">
            <Button type="primary" size="large" onClick={startGame}>{locale === 'zh' ? '再来一局' : 'Play Again'}</Button>
            <Button size="large" onClick={onBack}>{locale === 'zh' ? '返回' : 'Back'}</Button>
          </div>
          <GameLeaderboard gameId="marathon" currentScore={wordsCompleted} />
        </div>
      )}
    </div>
  );
}
