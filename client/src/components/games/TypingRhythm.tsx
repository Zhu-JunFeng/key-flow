import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@arco-design/web-react';
import { getRandomWord } from '../../lib/gameWords';
import { useLocale } from '../../lib/hooks';
import { calculateXp } from '../../lib/i18n';
import { playKeySound, playErrorSound, playCompleteSound } from '../../lib/sounds';
import { submitGameScore } from '../../lib/api';
import GameLeaderboard from './GameLeaderboard';

const HIT_ZONE_CENTER = 15;
const HIT_ZONE_WIDTH = 12;
const HIT_ZONE_LEFT = HIT_ZONE_CENTER - HIT_ZONE_WIDTH / 2; // 9
const HIT_ZONE_RIGHT = HIT_ZONE_CENTER + HIT_ZONE_WIDTH / 2; // 21
const PERFECT_LEFT = HIT_ZONE_CENTER - 3; // 12
const PERFECT_RIGHT = HIT_ZONE_CENTER + 3; // 18
const TOTAL_WORDS = 40;
const SPAWN_INTERVAL = 1.5;

interface RhythmWord {
  readonly id: number;
  readonly word: string;
  readonly track: number;
  readonly x: number;
  readonly speed: number;
  readonly hit: boolean;
}

interface Props {
  readonly onBack: () => void;
}

type Judge = 'perfect' | 'good' | 'miss';

export default function TypingRhythm({ onBack }: Props) {
  const locale = useLocale();
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'over'>('idle');
  const [input, setInput] = useState('');
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [perfectCount, setPerfectCount] = useState(0);
  const [goodCount, setGoodCount] = useState(0);
  const [missCount, setMissCount] = useState(0);
  const [lastJudge, setLastJudge] = useState<Judge | null>(null);
  const [displayWords, setDisplayWords] = useState<RhythmWord[]>([]);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');

  const wordsRef = useRef<RhythmWord[]>([]);
  const scoreRef = useRef(0);
  const comboRef = useRef(0);
  const maxComboRef = useRef(0);
  const perfectRef = useRef(0);
  const goodRef = useRef(0);
  const missRef = useRef(0);
  const spawnedRef = useRef(0);
  const nextIdRef = useRef(0);
  const spawnTimerRef = useRef(0);
  const animRef = useRef(0);
  const lastTimeRef = useRef(0);
  const gameStateRef = useRef<'idle' | 'playing' | 'over'>('idle');
  const inputRef = useRef<HTMLInputElement>(null);
  const judgeTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const trackRef = useRef(0);

  const getDifficulty = useCallback((idx: number): 'easy' | 'medium' | 'hard' => {
    if (difficulty === 'easy') return 'easy';
    if (difficulty === 'hard') return idx < 5 ? 'medium' : 'hard';
    // medium: progressive
    if (idx < 10) return 'easy';
    if (idx < 25) return 'medium';
    return 'hard';
  }, [difficulty]);

  const spawnWord = useCallback(() => {
    if (spawnedRef.current >= TOTAL_WORDS) return;
    const diff = getDifficulty(spawnedRef.current);
    const word: RhythmWord = {
      id: nextIdRef.current++,
      word: getRandomWord(diff),
      track: trackRef.current,
      x: 105,
      speed: 8 + spawnedRef.current * 0.15,
      hit: false,
    };
    trackRef.current = trackRef.current === 0 ? 1 : 0;
    spawnedRef.current++;
    wordsRef.current = [...wordsRef.current, word];
  }, [getDifficulty]);

  const showJudge = useCallback((judge: Judge) => {
    setLastJudge(judge);
    if (judgeTimerRef.current) clearTimeout(judgeTimerRef.current);
    judgeTimerRef.current = setTimeout(() => setLastJudge(null), 600);
  }, []);

  const applyHit = useCallback((judge: Judge) => {
    if (judge === 'perfect') {
      perfectRef.current++;
      setPerfectCount(perfectRef.current);
      comboRef.current++;
      const points = 100 * Math.max(1, Math.floor(comboRef.current / 5));
      scoreRef.current += points;
      playKeySound();
    } else if (judge === 'good') {
      goodRef.current++;
      setGoodCount(goodRef.current);
      comboRef.current++;
      const points = 50 * Math.max(1, Math.floor(comboRef.current / 5));
      scoreRef.current += points;
      playKeySound();
    } else {
      missRef.current++;
      setMissCount(missRef.current);
      comboRef.current = 0;
      scoreRef.current += 10;
      playErrorSound();
    }
    setCombo(comboRef.current);
    if (comboRef.current > maxComboRef.current) {
      maxComboRef.current = comboRef.current;
      setMaxCombo(maxComboRef.current);
    }
    setScore(scoreRef.current);
    showJudge(judge);
  }, [showJudge]);

  const endGame = useCallback(() => {
    setGameState('over');
    gameStateRef.current = 'over';
    cancelAnimationFrame(animRef.current);
    playCompleteSound();
    const xp = calculateXp(0, 100, spawnedRef.current * 5, maxComboRef.current) + Math.floor(scoreRef.current / 10);
    const currentXp = parseInt(localStorage.getItem('typerace_xp') || '0');
    localStorage.setItem('typerace_xp', String(currentXp + xp));
    submitGameScore({ gameId: 'rhythm', score: scoreRef.current, difficulty }).catch(() => {});
  }, [difficulty]);

  const startGame = useCallback(() => {
    setGameState('playing');
    gameStateRef.current = 'playing';
    setInput('');
    setScore(0);
    setCombo(0);
    setMaxCombo(0);
    setPerfectCount(0);
    setGoodCount(0);
    setMissCount(0);
    setLastJudge(null);
    setDisplayWords([]);
    wordsRef.current = [];
    scoreRef.current = 0;
    comboRef.current = 0;
    maxComboRef.current = 0;
    perfectRef.current = 0;
    goodRef.current = 0;
    missRef.current = 0;
    spawnedRef.current = 0;
    nextIdRef.current = 0;
    spawnTimerRef.current = 0;
    trackRef.current = 0;
    lastTimeRef.current = 0;
    inputRef.current?.focus();
  }, []);

  // Game loop
  useEffect(() => {
    if (gameState !== 'playing') return;

    const loop = (now: number) => {
      if (gameStateRef.current !== 'playing') return;
      if (lastTimeRef.current === 0) lastTimeRef.current = now;
      const dt = Math.min((now - lastTimeRef.current) / 1000, 0.1);
      lastTimeRef.current = now;

      // Spawn
      spawnTimerRef.current += dt;
      if (spawnTimerRef.current >= SPAWN_INTERVAL && spawnedRef.current < TOTAL_WORDS) {
        spawnTimerRef.current = 0;
        spawnWord();
      }

      // Move words
      const updated: RhythmWord[] = [];
      let hadMiss = false;
      for (const w of wordsRef.current) {
        const newX = w.x - w.speed * dt;
        if (newX < -10) {
          if (!w.hit) {
            hadMiss = true;
          }
          continue; // remove
        }
        updated.push({ ...w, x: newX });
      }
      wordsRef.current = updated;
      setDisplayWords([...updated]);

      if (hadMiss) {
        missRef.current++;
        setMissCount(missRef.current);
        comboRef.current = 0;
        setCombo(0);
        showJudge('miss');
        playErrorSound();
      }

      // Check game end
      if (spawnedRef.current >= TOTAL_WORDS && wordsRef.current.length === 0) {
        endGame();
        return;
      }

      animRef.current = requestAnimationFrame(loop);
    };

    animRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animRef.current);
  }, [gameState, spawnWord, endGame, showJudge]);

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.trim().toLowerCase();
    setInput(val);

    const matchIdx = wordsRef.current.findIndex(w => !w.hit && w.word === val);
    if (matchIdx >= 0) {
      const matched = wordsRef.current[matchIdx];
      const hitWord = { ...matched, hit: true };
      wordsRef.current = wordsRef.current.map((w, i) => i === matchIdx ? hitWord : w);

      // Judge timing
      const x = matched.x;
      if (x >= PERFECT_LEFT && x <= PERFECT_RIGHT) {
        applyHit('perfect');
      } else if (x >= HIT_ZONE_LEFT && x <= HIT_ZONE_RIGHT) {
        applyHit('good');
      } else {
        applyHit('miss');
      }
      setInput('');
    }
  };

  const judgeColor = lastJudge === 'perfect' ? '#a855f7' : lastJudge === 'good' ? '#10b981' : '#ef4444';
  const judgeText = lastJudge === 'perfect' ? 'PERFECT!' : lastJudge === 'good' ? 'GOOD' : lastJudge === 'miss' ? 'MISS' : '';

  return (
    <div>
      {gameState === 'idle' && (
        <div className="glass-card p-8 text-center space-y-4" style={{ cursor: 'default' }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'none'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'none'; }}>
          <div className="text-6xl mb-4">🎵</div>
          <h2 className="text-2xl font-extrabold" style={{ color: 'var(--text-primary)' }}>
            {locale === 'zh' ? '打字节奏' : 'Typing Rhythm'}
          </h2>
          <p style={{ color: 'var(--text-secondary)' }}>
            {locale === 'zh'
              ? '单词如音符般从右侧滚来，在紫色击中区打出它们！瞄准中心获得 Perfect！'
              : 'Words scroll from the right like notes. Type them in the purple hit zone! Aim for the center for Perfect!'}
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
              <span style={{ color: 'var(--text-secondary)' }}>Combo: <strong style={{ color: '#a855f7' }}>{combo}</strong></span>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <span style={{ color: '#a855f7' }}>P:{perfectCount}</span>
              <span style={{ color: '#10b981' }}>G:{goodCount}</span>
              <span style={{ color: '#ef4444' }}>M:{missCount}</span>
            </div>
          </div>

          {/* Track area */}
          <div className="rounded-3xl overflow-hidden mb-4 relative" style={{
            background: 'var(--glass-bg)',
            border: '1px solid var(--glass-border)',
            boxShadow: 'var(--glass-shadow)',
            height: '180px',
          }}>
            {/* Hit zone */}
            <div style={{
              position: 'absolute',
              left: `${HIT_ZONE_LEFT}%`,
              width: `${HIT_ZONE_WIDTH}%`,
              top: 0,
              bottom: 0,
              background: 'rgba(168, 85, 247, 0.08)',
              borderLeft: '2px solid rgba(168, 85, 247, 0.3)',
              borderRight: '2px solid rgba(168, 85, 247, 0.3)',
              zIndex: 1,
            }} />
            {/* Center line */}
            <div style={{
              position: 'absolute',
              left: `${HIT_ZONE_CENTER}%`,
              top: 0,
              bottom: 0,
              width: '2px',
              background: 'rgba(168, 85, 247, 0.5)',
              zIndex: 2,
            }} />

            {/* Judge text */}
            {lastJudge && (
              <div style={{
                position: 'absolute',
                left: `${HIT_ZONE_CENTER}%`,
                top: '50%',
                transform: 'translate(-50%, -50%)',
                fontSize: '24px',
                fontWeight: 900,
                color: judgeColor,
                zIndex: 10,
                textShadow: `0 0 20px ${judgeColor}`,
                animation: 'fadeInUp 0.3s ease-out',
                pointerEvents: 'none',
              }}>
                {judgeText}
              </div>
            )}

            {/* Track 0 */}
            <div style={{ position: 'absolute', top: '30px', left: 0, right: 0, height: '50px' }}>
              {displayWords.filter(w => w.track === 0 && !w.hit).map(w => (
                <div key={w.id} style={{
                  position: 'absolute',
                  left: `${w.x}%`,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  padding: '6px 14px',
                  borderRadius: '12px',
                  background: w.x >= HIT_ZONE_LEFT && w.x <= HIT_ZONE_RIGHT
                    ? 'rgba(168, 85, 247, 0.2)' : 'var(--bg-card)',
                  border: `1.5px solid ${w.x >= HIT_ZONE_LEFT && w.x <= HIT_ZONE_RIGHT
                    ? 'rgba(168, 85, 247, 0.5)' : 'var(--glass-border)'}`,
                  color: 'var(--text-primary)',
                  fontFamily: 'monospace',
                  fontWeight: 700,
                  fontSize: '15px',
                  whiteSpace: 'nowrap',
                  zIndex: 5,
                  transition: 'background 0.2s, border-color 0.2s',
                }}>
                  {w.word}
                </div>
              ))}
            </div>

            {/* Track 1 */}
            <div style={{ position: 'absolute', top: '98px', left: 0, right: 0, height: '50px' }}>
              {displayWords.filter(w => w.track === 1 && !w.hit).map(w => (
                <div key={w.id} style={{
                  position: 'absolute',
                  left: `${w.x}%`,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  padding: '6px 14px',
                  borderRadius: '12px',
                  background: w.x >= HIT_ZONE_LEFT && w.x <= HIT_ZONE_RIGHT
                    ? 'rgba(168, 85, 247, 0.2)' : 'var(--bg-card)',
                  border: `1.5px solid ${w.x >= HIT_ZONE_LEFT && w.x <= HIT_ZONE_RIGHT
                    ? 'rgba(168, 85, 247, 0.5)' : 'var(--glass-border)'}`,
                  color: 'var(--text-primary)',
                  fontFamily: 'monospace',
                  fontWeight: 700,
                  fontSize: '15px',
                  whiteSpace: 'nowrap',
                  zIndex: 5,
                  transition: 'background 0.2s, border-color 0.2s',
                }}>
                  {w.word}
                </div>
              ))}
            </div>

            {/* Track divider */}
            <div style={{
              position: 'absolute', top: '88px', left: 0, right: 0,
              height: '1px', background: 'var(--glass-border)', opacity: 0.5,
            }} />
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
              placeholder={locale === 'zh' ? '在击中区时输入单词...' : 'Type when word hits the zone...'}
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
          <div className="text-5xl mb-2">🎵</div>
          <h2 className="text-2xl font-extrabold" style={{ color: 'var(--text-primary)' }}>
            {locale === 'zh' ? '演奏结束！' : 'Performance Over!'}
          </h2>
          <div className="grid grid-cols-2 gap-4 max-w-xs mx-auto text-sm">
            <div style={{ color: 'var(--text-secondary)' }}>{locale === 'zh' ? '总分' : 'Score'}</div>
            <div style={{ color: 'var(--primary-color)' }} className="font-bold">{score}</div>
            <div style={{ color: '#a855f7' }}>Perfect</div>
            <div className="font-bold" style={{ color: '#a855f7' }}>{perfectCount}</div>
            <div style={{ color: '#10b981' }}>Good</div>
            <div className="font-bold" style={{ color: '#10b981' }}>{goodCount}</div>
            <div style={{ color: '#ef4444' }}>Miss</div>
            <div className="font-bold" style={{ color: '#ef4444' }}>{missCount}</div>
            <div style={{ color: 'var(--text-secondary)' }}>{locale === 'zh' ? '最高连击' : 'Max Combo'}</div>
            <div className="font-bold" style={{ color: 'var(--text-primary)' }}>{maxCombo}</div>
          </div>
          <div className="flex justify-center gap-3 pt-2">
            <Button type="primary" size="large" onClick={startGame}>{locale === 'zh' ? '再来一局' : 'Play Again'}</Button>
            <Button size="large" onClick={onBack}>{locale === 'zh' ? '返回' : 'Back'}</Button>
          </div>
          <GameLeaderboard gameId="rhythm" currentScore={score} />
        </div>
      )}
    </div>
  );
}
