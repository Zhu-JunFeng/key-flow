import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@arco-design/web-react';
import { getRandomWords } from '../../lib/gameWords';
import { useLocale } from '../../lib/hooks';
import { playKeySound, playErrorSound, playCompleteSound } from '../../lib/sounds';

interface Props {
  readonly onBack: () => void;
}

interface Fighter {
  readonly name: string;
  readonly nameZh: string;
  readonly emoji: string;
  hp: number;
  readonly maxHp: number;
}

export default function FightingRPG({ onBack }: Props) {
  const locale = useLocale();
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'win' | 'lose'>('idle');
  const [player, setPlayer] = useState<Fighter>({ name: 'Hero', nameZh: '勇者', emoji: '🦸', hp: 100, maxHp: 100 });
  const [enemy, setEnemy] = useState<Fighter>({ name: 'Warrior', nameZh: '战士', emoji: '⚔️', hp: 100, maxHp: 100 });
  const [round, setRound] = useState(1);
  const [words, setWords] = useState<readonly string[]>([]);
  const [currentWordIdx, setCurrentWordIdx] = useState(0);
  const [input, setInput] = useState('');
  const [timeLeft, setTimeLeft] = useState(8);
  const [correctChars, setCorrectChars] = useState(0);
  const [totalChars, setTotalChars] = useState(0);
  const [wordsThisRound, setWordsThisRound] = useState(0);
  const [roundPhase, setRoundPhase] = useState<'typing' | 'result'>('typing');
  const [lastAction, setLastAction] = useState('');
  const [combo, setCombo] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const startTimeRef = useRef(0);

  const ENEMIES: readonly Fighter[] = [
    { name: 'Goblin', nameZh: '哥布林', emoji: '👺', hp: 80, maxHp: 80 },
    { name: 'Knight', nameZh: '骑士', emoji: '🗡️', hp: 120, maxHp: 120 },
    { name: 'Mage', nameZh: '法师', emoji: '🧙', hp: 100, maxHp: 100 },
    { name: 'Dragon', nameZh: '飞龙', emoji: '🐲', hp: 150, maxHp: 150 },
    { name: 'Demon King', nameZh: '魔王', emoji: '👿', hp: 200, maxHp: 200 },
  ];

  const startGame = useCallback(() => {
    const newWords = getRandomWords(100, 'medium');
    setWords(newWords);
    setCurrentWordIdx(0);
    setInput('');
    setRound(1);
    setPlayer({ name: 'Hero', nameZh: '勇者', emoji: '🦸', hp: 100, maxHp: 100 });
    setEnemy({ ...ENEMIES[0] });
    setTimeLeft(8);
    setCorrectChars(0);
    setTotalChars(0);
    setWordsThisRound(0);
    setRoundPhase('typing');
    setLastAction('');
    setCombo(0);
    startTimeRef.current = Date.now();
    setGameState('playing');
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  // Round timer
  useEffect(() => {
    if (gameState !== 'playing' || roundPhase !== 'typing') return;
    const interval = setInterval(() => {
      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      const remaining = Math.max(0, 8 - elapsed);
      setTimeLeft(Math.round(remaining * 10) / 10);

      if (remaining <= 0) {
        // Round ends - calculate damage
        resolveRound();
      }
    }, 100);
    return () => clearInterval(interval);
  }, [gameState, roundPhase]);

  const resolveRound = useCallback(() => {
    setRoundPhase('result');
    const accuracy = totalChars > 0 ? correctChars / totalChars : 0;
    const wpm = wordsThisRound * 12; // approximate

    // Player attack: WPM-based
    const baseDamage = Math.round(wpm * 0.5 + wordsThisRound * 3);
    const isCrit = accuracy > 0.95 && Math.random() < 0.4;
    const playerDamage = isCrit ? baseDamage * 2 : baseDamage;

    // Enemy attack: fixed
    const enemyDamage = 10 + round * 3;

    let action = '';
    if (wordsThisRound === 0) {
      action = locale === 'zh' ? '你发呆了...' : 'You froze...';
    } else if (isCrit) {
      action = locale === 'zh' ? `暴击！造成 ${playerDamage} 伤害！` : `CRITICAL! ${playerDamage} damage!`;
    } else {
      action = locale === 'zh' ? `攻击！造成 ${playerDamage} 伤害` : `Attack! ${playerDamage} damage`;
    }
    action += ` | ${locale === 'zh' ? '受到' : 'Took'} ${enemyDamage} ${locale === 'zh' ? '伤害' : 'damage'}`;
    setLastAction(action);

    // Apply damage
    setEnemy(prev => {
      const newHp = Math.max(0, prev.hp - playerDamage);
      if (newHp <= 0) {
        // Enemy defeated
        const nextEnemyIdx = ENEMIES.findIndex(e => e.name === prev.name) + 1;
        if (nextEnemyIdx >= ENEMIES.length) {
          setTimeout(() => {
            setGameState('win');
            playCompleteSound();
          }, 1500);
        } else {
          // Heal player a bit, next enemy
          setPlayer(p => ({ ...p, hp: Math.min(p.maxHp, p.hp + 15) }));
          setTimeout(() => {
            setEnemy({ ...ENEMIES[nextEnemyIdx] });
            startNextRound();
          }, 1500);
        }
        return { ...prev, hp: 0 };
      }
      return { ...prev, hp: newHp };
    });

    setPlayer(prev => {
      const newHp = Math.max(0, prev.hp - enemyDamage);
      if (newHp <= 0) {
        setTimeout(() => setGameState('lose'), 1500);
        return { ...prev, hp: 0 };
      }
      return { ...prev, hp: newHp };
    });

    // Auto-next round after delay
    setTimeout(() => {
      if (gameState === 'playing') startNextRound();
    }, 2000);
  }, [totalChars, correctChars, wordsThisRound, round, locale, gameState]);

  const startNextRound = () => {
    setRound(prev => prev + 1);
    setTimeLeft(8);
    setCorrectChars(0);
    setTotalChars(0);
    setWordsThisRound(0);
    setRoundPhase('typing');
    startTimeRef.current = Date.now();
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleInput = (value: string) => {
    if (gameState !== 'playing' || roundPhase !== 'typing') return;
    setInput(value);

    const currentWord = words[currentWordIdx];
    if (!currentWord) return;

    if (value === currentWord) {
      playKeySound();
      setCorrectChars(prev => prev + currentWord.length);
      setTotalChars(prev => prev + currentWord.length);
      setWordsThisRound(prev => prev + 1);
      setCombo(prev => prev + 1);
      setInput('');

      const nextIdx = currentWordIdx + 1;
      if (nextIdx >= words.length) {
        const moreWords = getRandomWords(100, 'medium');
        setWords(prev => [...prev, ...moreWords]);
      }
      setCurrentWordIdx(nextIdx);
    } else if (currentWord.startsWith(value)) {
      playKeySound();
    } else {
      playErrorSound();
      setTotalChars(prev => prev + 1);
      setCombo(0);
    }
  };

  const playerHpPercent = (player.hp / player.maxHp) * 100;
  const enemyHpPercent = (enemy.hp / enemy.maxHp) * 100;

  return (
    <div>
      {gameState === 'idle' && (
        <div className="glass-card p-8 text-center space-y-4" style={{ cursor: 'default' }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'none'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'none'; }}>
          <div className="text-6xl mb-4">⚔️</div>
          <h2 className="text-2xl font-extrabold" style={{ color: 'var(--text-primary)' }}>
            {locale === 'zh' ? '打字格斗' : 'Typing Fighter'}
          </h2>
          <p style={{ color: 'var(--text-secondary)' }}>
            {locale === 'zh'
              ? '每回合8秒打字时间，WPM决定攻击力，准确率决定暴击率！击败5个对手赢得胜利！'
              : '8 seconds per round. WPM = Attack Power, Accuracy = Crit Chance! Defeat 5 opponents to win!'}
          </p>
          <Button type="primary" size="large" onClick={startGame}>
            {locale === 'zh' ? '开始战斗' : 'Start Fight'}
          </Button>
        </div>
      )}

      {gameState === 'playing' && (
        <div>
          {/* Fighter bars */}
          <div className="glass-card p-4 mb-4" style={{ cursor: 'default' }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'none'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'none'; }}>
            <div className="flex items-center justify-between gap-4">
              {/* Player */}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xl">{player.emoji}</span>
                  <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                    {locale === 'zh' ? player.nameZh : player.name}
                  </span>
                </div>
                <div className="h-3 rounded-full overflow-hidden" style={{ background: 'rgba(148,163,184,0.15)' }}>
                  <div className="h-full rounded-full transition-all duration-500" style={{
                    width: `${playerHpPercent}%`,
                    background: playerHpPercent > 50 ? '#10b981' : playerHpPercent > 25 ? '#f59e0b' : '#ef4444',
                  }} />
                </div>
                <div className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{player.hp}/{player.maxHp}</div>
              </div>

              <div className="text-xl font-extrabold px-3" style={{ color: 'var(--text-muted)' }}>VS</div>

              {/* Enemy */}
              <div className="flex-1 text-right">
                <div className="flex items-center gap-2 mb-1 justify-end">
                  <span className="text-sm font-bold" style={{ color: '#ef4444' }}>
                    {locale === 'zh' ? enemy.nameZh : enemy.name}
                  </span>
                  <span className="text-xl">{enemy.emoji}</span>
                </div>
                <div className="h-3 rounded-full overflow-hidden" style={{ background: 'rgba(148,163,184,0.15)' }}>
                  <div className="h-full rounded-full transition-all duration-500 ml-auto" style={{
                    width: `${enemyHpPercent}%`,
                    background: '#ef4444',
                  }} />
                </div>
                <div className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{enemy.hp}/{enemy.maxHp}</div>
              </div>
            </div>

            {/* Round info */}
            <div className="flex items-center justify-between mt-3 text-xs" style={{ color: 'var(--text-muted)' }}>
              <span>{locale === 'zh' ? `回合 ${round}` : `Round ${round}`}</span>
              <span>{locale === 'zh' ? `连击 ${combo}x` : `Combo ${combo}x`}</span>
              <span className="font-bold tabular-nums" style={{
                color: timeLeft <= 3 ? '#ef4444' : timeLeft <= 5 ? '#f59e0b' : 'var(--primary-color)',
                fontSize: '1rem',
              }}>
                {timeLeft.toFixed(1)}s
              </span>
            </div>
          </div>

          {/* Action log */}
          {lastAction && (
            <div className="text-center text-sm mb-3 px-4 py-2 rounded-xl" style={{
              background: 'rgba(99,102,241,0.08)',
              color: 'var(--text-secondary)',
              border: '1px solid rgba(99,102,241,0.15)',
            }}>
              {lastAction}
            </div>
          )}

          {/* Typing area */}
          {roundPhase === 'typing' && (
            <div className="glass-card p-8 mb-4 text-center" style={{ cursor: 'default' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'none'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'none'; }}>
              <div className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
                {locale === 'zh' ? `本回合已打 ${wordsThisRound} 词` : `${wordsThisRound} words this round`}
              </div>
              <div className="text-3xl font-mono font-bold tracking-wider mb-4" style={{ color: 'var(--text-primary)' }}>
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
          )}

          {roundPhase === 'result' && (
            <div className="glass-card p-8 text-center" style={{ cursor: 'default' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'none'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'none'; }}>
              <div className="text-4xl animate-bounce mb-2">⚔️</div>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                {locale === 'zh' ? '计算伤害中...' : 'Calculating damage...'}
              </p>
            </div>
          )}
        </div>
      )}

      {gameState === 'win' && (
        <div className="glass-card p-8 text-center space-y-4" style={{ cursor: 'default' }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'none'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'none'; }}>
          <div className="text-6xl mb-2">🏆</div>
          <h2 className="text-2xl font-extrabold" style={{ color: '#f59e0b' }}>
            {locale === 'zh' ? '胜利！你击败了所有对手！' : 'Victory! You defeated all opponents!'}
          </h2>
          <div className="flex justify-center gap-3 pt-2">
            <Button type="primary" size="large" onClick={startGame}>{locale === 'zh' ? '再来一局' : 'Play Again'}</Button>
            <Button size="large" onClick={onBack}>{locale === 'zh' ? '返回' : 'Back'}</Button>
          </div>
        </div>
      )}

      {gameState === 'lose' && (
        <div className="glass-card p-8 text-center space-y-4" style={{ cursor: 'default' }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'none'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'none'; }}>
          <div className="text-6xl mb-2">💀</div>
          <h2 className="text-2xl font-extrabold" style={{ color: '#ef4444' }}>
            {locale === 'zh' ? '战败...' : 'Defeated...'}
          </h2>
          <p style={{ color: 'var(--text-secondary)' }}>
            {locale === 'zh' ? `你坚持了 ${round} 回合` : `You lasted ${round} rounds`}
          </p>
          <div className="flex justify-center gap-3 pt-2">
            <Button type="primary" size="large" onClick={startGame}>{locale === 'zh' ? '再来一局' : 'Play Again'}</Button>
            <Button size="large" onClick={onBack}>{locale === 'zh' ? '返回' : 'Back'}</Button>
          </div>
        </div>
      )}
    </div>
  );
}
