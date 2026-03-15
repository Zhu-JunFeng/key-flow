import { useState } from 'react';
import { useLocale } from '../lib/hooks';
import FallingWords from '../components/games/FallingWords';
import WordBubbles from '../components/games/WordBubbles';
import SurvivalMode from '../components/games/SurvivalMode';
import SpeedRace from '../components/games/SpeedRace';
import BlindTyping from '../components/games/BlindTyping';
import BossBattle from '../components/games/BossBattle';
import TowerDefense from '../components/games/TowerDefense';
import Marathon from '../components/games/Marathon';
import TypingRaceCar from '../components/games/TypingRaceCar';
import FightingRPG from '../components/games/FightingRPG';

type GameId = 'falling' | 'bubbles' | 'survival' | 'speed' | 'blind' | 'boss' | 'tower' | 'marathon' | 'racecar' | 'fighting' | null;

const GAMES = [
  { id: 'falling' as const, icon: '🌧️', titleZh: '落字挑战', titleEn: 'Falling Words', descZh: '单词从天而降，在落地前打出来！', descEn: 'Type words before they hit the ground!', gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
  { id: 'bubbles' as const, icon: '🫧', titleZh: '词汇气泡', titleEn: 'Word Bubbles', descZh: '气泡飘起来了，快打字消除它们！', descEn: 'Pop the word bubbles before they float away!', gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' },
  { id: 'survival' as const, icon: '💀', titleZh: '生存模式', titleEn: 'Survival', descZh: '3条命，打错扣命，坚持到最后！', descEn: '3 lives, mistakes cost lives, survive as long as you can!', gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' },
  { id: 'speed' as const, icon: '⚡', titleZh: '极速竞赛', titleEn: 'Speed Race', descZh: '60秒限时，越打越快，刷新纪录！', descEn: '60s time limit, type as fast as you can!', gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
  { id: 'blind' as const, icon: '🙈', titleZh: '盲打挑战', titleEn: 'Blind Typing', descZh: '输入不可见，凭记忆和手感盲打！', descEn: "You can't see what you type - trust your fingers!", gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' },
  { id: 'boss' as const, icon: '👹', titleZh: 'BOSS大战', titleEn: 'Boss Battle', descZh: '打字攻击BOSS！连击增伤，击败5个BOSS！', descEn: 'Type to attack bosses! Combo for more damage!', gradient: 'linear-gradient(135deg, #f97316 0%, #ef4444 100%)', badge: true },
  { id: 'tower' as const, icon: '🏰', titleZh: '塔防打字', titleEn: 'Tower Defense', descZh: '敌人逼近基地，打出单词消灭它们！', descEn: 'Enemies approach your base - type to destroy!', gradient: 'linear-gradient(135deg, #14b8a6 0%, #06b6d4 100%)', badge: true },
  { id: 'marathon' as const, icon: '🏃', titleZh: '马拉松', titleEn: 'Marathon', descZh: '无限模式，看你能坚持多久！', descEn: 'No time limit - how far can you go?', gradient: 'linear-gradient(135deg, #a855f7 0%, #6366f1 100%)', badge: true },
  { id: 'racecar' as const, icon: '🏎️', titleZh: '打字赛车', titleEn: 'Racing', descZh: '打字速度就是车速，冲向终点！', descEn: 'Your WPM is your speed - race to the finish!', gradient: 'linear-gradient(135deg, #eab308 0%, #f97316 100%)', badge: true },
  { id: 'fighting' as const, icon: '⚔️', titleZh: '打字格斗', titleEn: 'Fighter', descZh: 'WPM决定攻击力，准确率决定暴击！', descEn: 'WPM = Attack, Accuracy = Crit Chance!', gradient: 'linear-gradient(135deg, #dc2626 0%, #9333ea 100%)', badge: true },
] as const;

const GAME_COMPONENTS: Record<Exclude<GameId, null>, React.ComponentType<{ onBack: () => void }>> = {
  falling: FallingWords,
  bubbles: WordBubbles,
  survival: SurvivalMode,
  speed: SpeedRace,
  blind: BlindTyping,
  boss: BossBattle,
  tower: TowerDefense,
  marathon: Marathon,
  racecar: TypingRaceCar,
  fighting: FightingRPG,
};

export default function Games() {
  const locale = useLocale();
  const [activeGame, setActiveGame] = useState<GameId>(null);

  if (activeGame) {
    const GameComponent = GAME_COMPONENTS[activeGame];
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => setActiveGame(null)}
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-all"
            style={{ color: 'var(--text-muted)', background: 'var(--bg-card)', border: '1px solid var(--glass-border)' }}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <h1 className="text-2xl font-extrabold" style={{
            background: 'linear-gradient(135deg, var(--text-primary) 0%, var(--primary-color) 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          }}>
            {GAMES.find(g => g.id === activeGame)?.[locale === 'zh' ? 'titleZh' : 'titleEn']}
          </h1>
        </div>
        <GameComponent onBack={() => setActiveGame(null)} />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold mb-2" style={{
          background: 'linear-gradient(135deg, var(--text-primary) 0%, var(--primary-color) 100%)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
        }}>{locale === 'zh' ? '打字游戏' : 'Typing Games'}</h1>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          {locale === 'zh' ? `${GAMES.length}种有趣的打字游戏，边玩边提升！` : `${GAMES.length} fun typing games - improve while playing!`}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {GAMES.map(game => (
          <button key={game.id} onClick={() => setActiveGame(game.id)}
            className="glass-card group relative block p-6 cursor-pointer text-left w-full"
            style={{ animation: 'fadeInUp 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards' }}>
            {'badge' in game && game.badge && (
              <div className="absolute -top-2 right-4 px-3 py-0.5 rounded-full text-[10px] font-bold text-white shadow-md"
                style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 4px 12px rgba(99,102,241,0.4)' }}>
                {locale === 'zh' ? '新' : 'New'}
              </div>
            )}
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl mb-4 shadow-md"
              style={{ background: game.gradient }}>
              {game.icon}
            </div>
            <h3 className="font-bold text-sm mb-1.5 group-hover:text-indigo-600 transition-colors" style={{ color: 'var(--text-primary)' }}>
              {locale === 'zh' ? game.titleZh : game.titleEn}
            </h3>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              {locale === 'zh' ? game.descZh : game.descEn}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}
