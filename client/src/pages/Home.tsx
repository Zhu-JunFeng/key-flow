import { Link } from 'react-router-dom';
import { t } from '../lib/i18n';
import { useLocale } from '../lib/hooks';
import { getLevelInfo } from '../lib/i18n';

export default function Home() {
  const locale = useLocale();
  const totalXp = parseInt(localStorage.getItem('typerace_xp') || '0');
  const levelInfo = getLevelInfo(totalXp);

  return (
    <div className="min-h-[calc(100vh-64px)] flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-16 relative overflow-hidden">
        <div className="text-center mb-14 relative">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium mb-6"
            style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', color: 'var(--primary-color)' }}>
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
            {t('home.badge', locale)}
          </div>
          <h1 className="text-5xl md:text-6xl font-extrabold mb-5 tracking-tight leading-[1.1]"
            style={{ animation: 'titleGlow 3s ease-in-out infinite' }}>
            <span style={{ color: 'var(--text-primary)' }}>{t('home.title1', locale)}</span>
            <br />
            <span style={{
              background: 'linear-gradient(135deg, #6366f1 0%, #ec4899 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              {t('home.title2', locale)}
            </span>
          </h1>
          <p className="text-lg max-w-md mx-auto leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            {t('home.subtitle', locale)}
          </p>

          {/* Level badge */}
          {totalXp > 0 && (
            <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold"
              style={{
                background: `rgba(${levelInfo.color === '#ffd700' ? '255,215,0' : '99,102,241'},0.1)`,
                border: `1px solid ${levelInfo.color}40`,
                color: levelInfo.color,
              }}>
              <span>Lv.{levelInfo.level}</span>
              <span>{t(levelInfo.title, locale)}</span>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>{totalXp} XP</span>
            </div>
          )}
        </div>

        {/* Mode Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-4xl w-full relative">
          <ModeCard to="/lessons" icon="📚" title={t('home.lessons', locale)} desc={t('home.lessonsDesc', locale)} gradient="linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)" />
          <ModeCard to="/practice" icon="🎯" title={t('home.practice', locale)} desc={t('home.practiceDesc', locale)} gradient="linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)" />
          <ModeCard to="/games" icon="🎮" title={locale === 'zh' ? '打字游戏' : 'Typing Games'} desc={locale === 'zh' ? '10种打字游戏：BOSS大战、塔防、赛车、格斗等' : '10 typing games: Boss Battle, Tower Defense, Racing & more'} gradient="linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)" badge={locale === 'zh' ? '热门' : 'Hot'} />
          <ModeCard to="/test" icon="⏱️" title={t('home.test', locale)} desc={t('home.testDesc', locale)} gradient="linear-gradient(135deg, #fa709a 0%, #fee140 100%)" />
          <ModeCard to="/multiplayer" icon="🏁" title={t('home.multiplayer', locale)} desc={t('home.multiplayerDesc', locale)} gradient="linear-gradient(135deg, #667eea 0%, #764ba2 100%)" badge={t('home.hot', locale)} />
          <ModeCard to="/leaderboard" icon="🏆" title={t('home.rank', locale)} desc={t('home.rankDesc', locale)} gradient="linear-gradient(135deg, #f093fb 0%, #f5576c 100%)" />
          <ModeCard to="/settings" icon="⚙️" title={t('home.settings', locale)} desc={t('home.settingsDesc', locale)} gradient="linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)" />
        </div>

        {/* Feature pills */}
        <div className="mt-12 flex flex-wrap justify-center gap-2.5 max-w-2xl">
          {[
            { icon: '⌨️', labelKey: 'home.feat.keyboard' as const },
            { icon: '🖐️', labelKey: 'home.feat.finger' as const },
            { icon: '🇨🇳', labelKey: 'home.feat.lang' as const },
            { icon: '🔊', labelKey: 'home.feat.sound' as const },
            { icon: '⭐', labelKey: 'home.feat.star' as const },
            { icon: '🏎️', labelKey: 'home.feat.race' as const },
          ].map(f => (
            <div key={f.labelKey} className="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-medium"
              style={{ color: 'var(--text-secondary)', background: 'var(--glass-bg)', backdropFilter: 'blur(10px)', border: '1px solid var(--glass-border)', boxShadow: 'var(--glass-shadow)' }}>
              <span>{f.icon}</span>
              <span>{t(f.labelKey, locale)}</span>
            </div>
          ))}
        </div>

        <section
          className="mt-14 max-w-4xl rounded-3xl p-6 md:p-8"
          style={{
            background: 'var(--glass-bg)',
            backdropFilter: 'blur(18px)',
            WebkitBackdropFilter: 'blur(18px)',
            border: '1px solid var(--glass-border)',
            boxShadow: 'var(--glass-shadow)',
          }}
        >
          <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
            {locale === 'zh' ? '在线打字练习、打字速度测试与多人竞速平台' : 'Online typing practice, typing test, and multiplayer racing'}
          </h2>
          <div className="space-y-3 text-sm md:text-base leading-7" style={{ color: 'var(--text-secondary)' }}>
            <p>
              {locale === 'zh'
                ? 'KeyFlow 是一个专注于在线打字练习的网站，支持中文打字、英文打字、打字速度测试、课程训练、每日挑战和多人实时竞速。'
                : 'KeyFlow is an online typing practice site with typing tests, lessons, daily challenges, and multiplayer races.'}
            </p>
            <p>
              {locale === 'zh'
                ? '如果你正在找打字练习网站、WPM 速度测试工具、打字课程或打字游戏，这里提供从新手到进阶用户都能使用的练习模式。'
                : 'It helps beginners and advanced typists improve speed, accuracy, and consistency through structured practice.'}
            </p>
            <p>
              {locale === 'zh'
                ? '你可以在首页进入打字课程、自由练习、打字游戏、排行榜和多人竞速模式，持续提升打字速度与准确率。'
                : 'You can access lessons, free practice, games, leaderboards, and multiplayer modes from the home page.'}
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}

function ModeCard({
  to, icon, title, desc, gradient, badge,
}: {
  readonly to: string;
  readonly icon: string;
  readonly title: string;
  readonly desc: string;
  readonly gradient: string;
  readonly badge?: string;
}) {
  return (
    <Link to={to} className="glass-card group relative block p-6 cursor-pointer"
      style={{ animation: 'fadeInUp 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards' }}>
      {badge && (
        <div className="absolute -top-2 right-4 px-3 py-0.5 rounded-full text-[10px] font-bold text-white shadow-md"
          style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 4px 12px rgba(99,102,241,0.4)' }}>
          {badge}
        </div>
      )}
      <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl mb-4 shadow-md"
        style={{ background: gradient }}>
        {icon}
      </div>
      <h3 className="font-bold text-sm mb-1.5 group-hover:text-indigo-600 transition-colors" style={{ color: 'var(--text-primary)' }}>
        {title}
      </h3>
      <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>{desc}</p>
    </Link>
  );
}
