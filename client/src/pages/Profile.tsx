import { useNavigate } from 'react-router-dom';
import { getAuthUser, logout } from '../lib/auth';
import { useLocale } from '../lib/hooks';
import { getDeviceId } from '../lib/device';
import { getLevelInfo } from '../lib/i18n';
import { t } from '../lib/i18n';

export default function Profile() {
  const locale = useLocale();
  const navigate = useNavigate();
  const user = getAuthUser();
  const deviceId = getDeviceId();
  const isGuest = user.loginType === 'guest';

  const totalXp = parseInt(localStorage.getItem('typerace_xp') || '0');
  const totalTyped = parseInt(localStorage.getItem('typerace_total_typed') || '0');
  const levelInfo = getLevelInfo(totalXp);

  const handleLogout = () => {
    logout();
    window.dispatchEvent(new Event('auth-change'));
    navigate('/');
  };

  const loginTypeLabel = () => {
    switch (user.loginType) {
      case 'google': return 'Google';
      case 'github': return 'GitHub';
      default: return locale === 'zh' ? '游客' : 'Guest';
    }
  };

  const loginTypeColor = () => {
    switch (user.loginType) {
      case 'google': return 'linear-gradient(135deg, #4285F4, #34A853)';
      case 'github': return 'linear-gradient(135deg, #333, #666)';
      default: return 'linear-gradient(135deg, #6366f1, #06b6d4)';
    }
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-10">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <button onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:scale-105"
          style={{ color: 'var(--text-secondary)', background: 'var(--bg-card)', border: '1px solid var(--glass-border)' }}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>
        <h1 className="text-2xl font-extrabold" style={{
          background: 'linear-gradient(135deg, var(--text-primary) 0%, var(--primary-color) 100%)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
        }}>
          {locale === 'zh' ? '个人资料' : 'Profile'}
        </h1>
      </div>

      {/* Profile Card */}
      <div className="glass-card p-8 mb-6" style={{ cursor: 'default' }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'none'; }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'none'; }}>
        {/* Avatar + Name */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-24 h-24 rounded-2xl flex items-center justify-center text-3xl mb-4 relative overflow-hidden"
            style={{ background: loginTypeColor(), boxShadow: '0 8px 30px rgba(99,102,241,0.35)' }}>
            {user.avatarUrl
              ? <img src={user.avatarUrl} className="w-full h-full object-cover" alt="" referrerPolicy="no-referrer" />
              : <span className="text-white font-bold text-4xl">{user.nickname.charAt(0).toUpperCase()}</span>
            }
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            {user.nickname}
          </h2>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs font-medium px-3 py-1 rounded-full" style={{
              background: isGuest ? 'rgba(99,102,241,0.1)' : 'rgba(16,185,129,0.1)',
              color: isGuest ? 'var(--primary-color)' : '#10b981',
              border: `1px solid ${isGuest ? 'rgba(99,102,241,0.2)' : 'rgba(16,185,129,0.2)'}`,
            }}>
              {loginTypeLabel()} {locale === 'zh' ? '账户' : 'Account'}
            </span>
            {totalXp > 0 && (
              <span className="text-xs font-semibold px-3 py-1 rounded-full" style={{
                background: `${levelInfo.color}18`,
                border: `1px solid ${levelInfo.color}40`,
                color: levelInfo.color,
              }}>
                Lv.{levelInfo.level} {t(levelInfo.title, locale)}
              </span>
            )}
          </div>
        </div>

        {/* Info rows */}
        <div className="space-y-3">
          {user.email && (
            <InfoRow
              icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" /></svg>}
              label={locale === 'zh' ? '邮箱' : 'Email'}
              value={user.email}
            />
          )}
          <InfoRow
            icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15A2.25 2.25 0 002.25 6.75v10.5A2.25 2.25 0 004.5 19.5zm6-10.125a1.875 1.875 0 11-3.75 0 1.875 1.875 0 013.75 0zm1.294 6.336a6.721 6.721 0 01-3.17.789 6.721 6.721 0 01-3.168-.789 3.376 3.376 0 016.338 0z" /></svg>}
            label={locale === 'zh' ? '设备 ID' : 'Device ID'}
            value={`${deviceId.slice(0, 12)}...`}
          />
          <InfoRow
            icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" /></svg>}
            label="XP"
            value={`${totalXp} XP`}
          />
          {totalTyped > 0 && (
            <InfoRow
              icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" /></svg>}
              label={locale === 'zh' ? '总字符数' : 'Total Typed'}
              value={totalTyped.toLocaleString()}
            />
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-3">
        {/* Dashboard link */}
        <button onClick={() => navigate('/dashboard')}
          className="w-full flex items-center gap-3 px-5 py-3.5 rounded-2xl text-sm font-semibold transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] glass-card"
          style={{ cursor: 'pointer', color: 'var(--text-primary)' }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.01)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'none'; }}>
          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5} style={{ color: 'var(--primary-color)' }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
          </svg>
          <span className="flex-1 text-left">{locale === 'zh' ? '查看统计仪表盘' : 'View Dashboard'}</span>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5} style={{ color: 'var(--text-muted)' }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </button>

        {/* Logout */}
        <button onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl text-sm font-semibold transition-all duration-200 hover:scale-[1.01] active:scale-[0.99]"
          style={{
            color: '#ef4444',
            background: 'rgba(239,68,68,0.06)',
            border: '1px solid rgba(239,68,68,0.15)',
          }}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
          </svg>
          {isGuest
            ? (locale === 'zh' ? '退出游客模式' : 'Exit Guest Mode')
            : (locale === 'zh' ? '退出登录' : 'Logout')}
        </button>

        {/* Guest hint */}
        {isGuest && (
          <p className="text-center text-[11px] leading-relaxed px-4" style={{ color: 'var(--text-muted)' }}>
            {locale === 'zh'
              ? '游客数据绑定当前设备，清除浏览器数据后将丢失。'
              : 'Guest data is bound to this device and will be lost if browser data is cleared.'}
          </p>
        )}
      </div>
    </div>
  );
}

function InfoRow({ icon, label, value }: { readonly icon: React.ReactNode; readonly label: string; readonly value: string }) {
  return (
    <div className="flex items-center gap-3 p-3.5 rounded-xl" style={{
      background: 'var(--bg-card, rgba(148,163,184,0.05))',
      border: '1px solid var(--glass-border)',
    }}>
      <div className="flex-shrink-0" style={{ color: 'var(--text-muted)' }}>{icon}</div>
      <div className="flex-1 min-w-0">
        <div className="text-[10px] uppercase tracking-wider font-medium" style={{ color: 'var(--text-muted)' }}>{label}</div>
        <div className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{value}</div>
      </div>
    </div>
  );
}
