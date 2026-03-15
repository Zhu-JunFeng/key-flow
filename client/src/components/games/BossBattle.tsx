import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@arco-design/web-react';
import { getRandomWords } from '../../lib/gameWords';
import { useLocale } from '../../lib/hooks';
import { playKeySound, playErrorSound, playCompleteSound } from '../../lib/sounds';

interface Props {
  readonly onBack: () => void;
}

interface Boss {
  readonly name: string;
  readonly nameZh: string;
  readonly maxHp: number;
  readonly emoji: string;
  readonly attack: number;
  readonly color: string;
}

const BOSSES: readonly Boss[] = [
  { name: 'Slime King', nameZh: '史莱姆王', maxHp: 100, emoji: '👾', attack: 5, color: '#10b981' },
  { name: 'Dark Knight', nameZh: '暗黑骑士', maxHp: 200, emoji: '🗡️', attack: 8, color: '#6366f1' },
  { name: 'Fire Dragon', nameZh: '火焰龙', maxHp: 350, emoji: '🐉', attack: 12, color: '#ef4444' },
  { name: 'Shadow Lord', nameZh: '暗影领主', maxHp: 500, emoji: '👹', attack: 15, color: '#8b5cf6' },
  { name: 'Final Boss', nameZh: '最终BOSS', maxHp: 800, emoji: '💀', attack: 20, color: '#f59e0b' },
];

export default function BossBattle({ onBack }: Props) {
  const locale = useLocale();
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'victory' | 'defeat'>('idle');
  const [bossIdx, setBossIdx] = useState(0);
  const [bossHp, setBossHp] = useState(0);
  const [playerHp, setPlayerHp] = useState(100);
  const [words, setWords] = useState<readonly string[]>([]);
  const [currentWordIdx, setCurrentWordIdx] = useState(0);
  const [input, setInput] = useState('');
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [totalDamage, setTotalDamage] = useState(0);
  const [critHit, setCritHit] = useState(false);
  const [shakeScreen, setShakeScreen] = useState(false);
  const [damagePopup, setDamagePopup] = useState<{ value: number; crit: boolean } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const bossAttackTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const boss = BOSSES[bossIdx];

  const startGame = useCallback(() => {
    const newWords = getRandomWords(50, 'medium');
    setWords(newWords);
    setCurrentWordIdx(0);
    setInput('');
    setCombo(0);
    setMaxCombo(0);
    setTotalDamage(0);
    setBossIdx(0);
    setBossHp(BOSSES[0].maxHp);
    setPlayerHp(100);
    setGameState('playing');
    setCritHit(false);
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  // Boss attacks player periodically
  useEffect(() => {
    if (gameState !== 'playing') {
      if (bossAttackTimer.current) clearInterval(bossAttackTimer.current);
      return;
    }
    bossAttackTimer.current = setInterval(() => {
      const currentBoss = BOSSES[bossIdx];
      setPlayerHp(prev => {
        const newHp = prev - currentBoss.attack;
        if (newHp <= 0) {
          setGameState('defeat');
          return 0;
        }
        setShakeScreen(true);
        setTimeout(() => setShakeScreen(false), 300);
        return newHp;
      });
    }, 3000);
    return () => {
      if (bossAttackTimer.current) clearInterval(bossAttackTimer.current);
    };
  }, [gameState, bossIdx]);

  const handleInput = (value: string) => {
    if (gameState !== 'playing') return;
    setInput(value);

    const currentWord = words[currentWordIdx];
    if (!currentWord) return;

    if (value === currentWord) {
      // Word completed - deal damage
      const isCrit = Math.random() < Math.min(0.05 + combo * 0.02, 0.5);
      const baseDamage = currentWord.length * 2 + combo;
      const damage = isCrit ? baseDamage * 3 : baseDamage;

      playKeySound();
      setCritHit(isCrit);
      setDamagePopup({ value: Math.round(damage), crit: isCrit });
      setTimeout(() => setDamagePopup(null), 800);
      setTimeout(() => setCritHit(false), 500);

      setCombo(prev => {
        const newCombo = prev + 1;
        setMaxCombo(mc => Math.max(mc, newCombo));
        return newCombo;
      });
      setTotalDamage(prev => prev + damage);

      setBossHp(prev => {
        const newHp = prev - damage;
        if (newHp <= 0) {
          // Boss defeated
          const nextBossIdx = bossIdx + 1;
          if (nextBossIdx >= BOSSES.length) {
            // All bosses defeated
            setGameState('victory');
            playCompleteSound();
            const xp = Math.round(totalDamage / 5) + maxCombo * 2;
            const currentXp = parseInt(localStorage.getItem('typerace_xp') || '0');
            localStorage.setItem('typerace_xp', String(currentXp + xp));
            return 0;
          }
          // Next boss
          setBossIdx(nextBossIdx);
          setPlayerHp(hp => Math.min(hp + 20, 100)); // Heal 20 HP
          return BOSSES[nextBossIdx].maxHp;
        }
        return newHp;
      });

      setInput('');
      setCurrentWordIdx(prev => {
        const next = prev + 1;
        if (next >= words.length) {
          const moreWords = getRandomWords(50, 'medium');
          setWords(w => [...w, ...moreWords]);
        }
        return next;
      });
    } else if (currentWord.startsWith(value)) {
      playKeySound();
    } else {
      playErrorSound();
      setCombo(0);
    }
  };

  return (
    <div className={shakeScreen ? 'animate-shake' : ''}>
      {gameState === 'idle' && (
        <div className="glass-card p-8 text-center space-y-4" style={{ cursor: 'default' }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'none'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'none'; }}>
          <div className="text-6xl mb-4">👹</div>
          <h2 className="text-2xl font-extrabold" style={{ color: 'var(--text-primary)' }}>
            {locale === 'zh' ? 'BOSS 大战' : 'Boss Battle'}
          </h2>
          <p style={{ color: 'var(--text-secondary)' }}>
            {locale === 'zh'
              ? '打字攻击BOSS！连击越多伤害越高，准确率决定暴击率。击败5个BOSS赢得胜利！'
              : 'Type words to attack the Boss! Higher combo = more damage. Accuracy determines crit rate. Defeat 5 bosses to win!'}
          </p>
          <Button type="primary" size="large" onClick={startGame}>
            {locale === 'zh' ? '开始战斗' : 'Start Battle'}
          </Button>
        </div>
      )}

      {gameState === 'playing' && (
        <div>
          {/* Boss info */}
          <div className="glass-card p-4 mb-4" style={{ cursor: 'default' }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'none'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'none'; }}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-3xl">{boss.emoji}</span>
                <div>
                  <div className="font-bold" style={{ color: boss.color }}>
                    {locale === 'zh' ? boss.nameZh : boss.name}
                  </div>
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    Boss {bossIdx + 1}/{BOSSES.length}
                  </div>
                </div>
              </div>
              {damagePopup && (
                <div className="text-2xl font-extrabold animate-bounce" style={{
                  color: damagePopup.crit ? '#f59e0b' : '#ef4444',
                }}>
                  {damagePopup.crit ? 'CRIT! ' : ''}-{damagePopup.value}
                </div>
              )}
            </div>
            {/* Boss HP bar */}
            <div className="h-4 rounded-full overflow-hidden" style={{ background: 'rgba(148,163,184,0.15)' }}>
              <div className="h-full rounded-full transition-all duration-300" style={{
                width: `${Math.max(0, (bossHp / boss.maxHp) * 100)}%`,
                background: `linear-gradient(90deg, ${boss.color}, ${boss.color}88)`,
              }} />
            </div>
            <div className="text-xs mt-1 text-right" style={{ color: 'var(--text-muted)' }}>
              HP: {Math.max(0, Math.round(bossHp))}/{boss.maxHp}
            </div>
          </div>

          {/* Player info */}
          <div className="glass-card p-3 mb-4 flex items-center justify-between" style={{ cursor: 'default' }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'none'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'none'; }}>
            <div className="flex items-center gap-3">
              <span className="text-xl">🦸</span>
              <div>
                <div className="h-2.5 w-32 rounded-full overflow-hidden" style={{ background: 'rgba(148,163,184,0.15)' }}>
                  <div className="h-full rounded-full transition-all duration-300" style={{
                    width: `${playerHp}%`,
                    background: playerHp > 50 ? '#10b981' : playerHp > 25 ? '#f59e0b' : '#ef4444',
                  }} />
                </div>
                <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>HP: {playerHp}/100</div>
              </div>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <span style={{ color: combo >= 5 ? '#ef4444' : combo >= 3 ? '#f59e0b' : 'var(--text-secondary)' }}>
                {locale === 'zh' ? '连击' : 'Combo'}: <strong>{combo}x</strong>
              </span>
              <span style={{ color: 'var(--text-secondary)' }}>
                {locale === 'zh' ? '总伤害' : 'DMG'}: <strong className="text-red-500">{Math.round(totalDamage)}</strong>
              </span>
            </div>
          </div>

          {/* Current word */}
          <div className={`glass-card p-8 mb-4 text-center ${critHit ? 'ring-2 ring-yellow-400' : ''}`}
            style={{ cursor: 'default' }}
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

          {/* Upcoming words */}
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

      {gameState === 'victory' && (
        <div className="glass-card p-8 text-center space-y-4" style={{ cursor: 'default' }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'none'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'none'; }}>
          <div className="text-6xl mb-2">🏆</div>
          <h2 className="text-2xl font-extrabold" style={{ color: '#f59e0b' }}>
            {locale === 'zh' ? '胜利！' : 'Victory!'}
          </h2>
          <p style={{ color: 'var(--text-secondary)' }}>
            {locale === 'zh' ? '你击败了所有BOSS！' : 'You defeated all the bosses!'}
          </p>
          <div className="flex justify-center gap-6 text-lg">
            <span style={{ color: 'var(--text-secondary)' }}>
              {locale === 'zh' ? '总伤害' : 'Total DMG'}: <strong className="text-red-500">{Math.round(totalDamage)}</strong>
            </span>
            <span style={{ color: 'var(--text-secondary)' }}>
              {locale === 'zh' ? '最高连击' : 'Max Combo'}: <strong className="text-orange-500">{maxCombo}x</strong>
            </span>
          </div>
          <div className="flex justify-center gap-3 pt-2">
            <Button type="primary" size="large" onClick={startGame}>{locale === 'zh' ? '再来一局' : 'Play Again'}</Button>
            <Button size="large" onClick={onBack}>{locale === 'zh' ? '返回' : 'Back'}</Button>
          </div>
        </div>
      )}

      {gameState === 'defeat' && (
        <div className="glass-card p-8 text-center space-y-4" style={{ cursor: 'default' }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'none'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'none'; }}>
          <div className="text-6xl mb-2">💀</div>
          <h2 className="text-2xl font-extrabold" style={{ color: '#ef4444' }}>
            {locale === 'zh' ? '战败...' : 'Defeated...'}
          </h2>
          <p style={{ color: 'var(--text-secondary)' }}>
            {locale === 'zh'
              ? `你在第 ${bossIdx + 1} 个BOSS处倒下了`
              : `You fell at Boss ${bossIdx + 1}`}
          </p>
          <div className="flex justify-center gap-6 text-lg">
            <span style={{ color: 'var(--text-secondary)' }}>
              {locale === 'zh' ? '总伤害' : 'Total DMG'}: <strong className="text-red-500">{Math.round(totalDamage)}</strong>
            </span>
            <span style={{ color: 'var(--text-secondary)' }}>
              {locale === 'zh' ? '最高连击' : 'Max Combo'}: <strong className="text-orange-500">{maxCombo}x</strong>
            </span>
          </div>
          <div className="flex justify-center gap-3 pt-2">
            <Button type="primary" size="large" onClick={startGame}>{locale === 'zh' ? '再来一局' : 'Play Again'}</Button>
            <Button size="large" onClick={onBack}>{locale === 'zh' ? '返回' : 'Back'}</Button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .animate-shake { animation: shake 0.3s ease-in-out; }
      `}</style>
    </div>
  );
}
