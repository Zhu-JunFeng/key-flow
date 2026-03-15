import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { getStoredTheme, setStoredTheme, type Theme } from '../lib/theme';
import { t, getStoredLocale, setStoredLocale, type Locale } from '../lib/i18n';
import { getAuthUser, isLoggedIn, type AuthUser } from '../lib/auth';
import LoginModal, { UserAvatar } from './LoginModal';

const NAV_ITEMS = [
  { path: '/', labelKey: 'nav.home' as const, exact: true },
  { path: '/lessons', labelKey: 'nav.lessons' as const },
  { path: '/practice', labelKey: 'nav.practice' as const },
  { path: '/games', labelKey: 'nav.games' as const },
  { path: '/test', labelKey: 'nav.test' as const },
  { path: '/multiplayer', labelKey: 'nav.multiplayer' as const },
  { path: '/dashboard', labelKey: 'nav.dashboard' as const },
  { path: '/daily', labelKey: 'nav.daily' as const },
  { path: '/friends', labelKey: 'nav.friends' as const },
  { path: '/leaderboard', labelKey: 'nav.leaderboard' as const },
] as const;

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [theme, setTheme] = useState<Theme>(getStoredTheme);
  const [locale, setLocale] = useState<Locale>(getStoredLocale);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [onlineCount, setOnlineCount] = useState(0);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [, setAuthUser] = useState<AuthUser>(getAuthUser);

  // Listen for auth changes
  useEffect(() => {
    const handler = () => setAuthUser(getAuthUser());
    window.addEventListener('auth-change', handler);
    return () => window.removeEventListener('auth-change', handler);
  }, []);

  // Fetch online count periodically
  useEffect(() => {
    const fetchCount = () => {
      fetch('/api/online-count')
        .then(r => r.json())
        .then(d => setOnlineCount(d.count ?? 0))
        .catch(() => {});
    };
    fetchCount();
    const interval = setInterval(fetchCount, 15000);
    return () => clearInterval(interval);
  }, []);

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    setStoredTheme(next);
  };

  const toggleLocale = () => {
    const next = locale === 'zh' ? 'en' : 'zh';
    setLocale(next);
    setStoredLocale(next);
    // Force re-render by dispatching a storage event
    window.dispatchEvent(new Event('locale-change'));
  };

  const isActive = (item: typeof NAV_ITEMS[number]) =>
    'exact' in item && item.exact
      ? location.pathname === item.path
      : location.pathname.startsWith(item.path) && item.path !== '/';

  return (
    <nav className="sticky top-0 z-50" style={{
      background: 'var(--nav-bg, rgba(255,255,255,0.25))',
      backdropFilter: 'blur(30px)',
      WebkitBackdropFilter: 'blur(30px)',
      borderBottom: '1px solid var(--glass-border)',
      boxShadow: 'var(--glass-shadow)',
    }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5 transition-all hover:scale-[1.02]">
          <div className="w-9 h-9 rounded-2xl flex items-center justify-center text-white text-lg font-bold shadow-md relative overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #06b6d4 100%)', boxShadow: '0 4px 12px rgba(99,102,241,0.4)' }}>
            <svg width="22" height="22" viewBox="0 0 48 48" fill="none">
              <rect x="8" y="20" width="32" height="18" rx="4" stroke="white" strokeWidth="2" opacity="0.9"/>
              <rect x="11" y="23" width="5" height="4" rx="1" fill="white" opacity="0.4"/>
              <rect x="17.5" y="23" width="5" height="4" rx="1" fill="white" opacity="0.6"/>
              <rect x="24" y="23" width="5" height="4" rx="1" fill="white" opacity="0.4"/>
              <rect x="30.5" y="23" width="5" height="4" rx="1" fill="white" opacity="0.4"/>
              <rect x="14" y="30" width="20" height="4" rx="1.5" fill="white" opacity="0.4"/>
              <path d="M8 18 Q16 8, 24 13 Q32 18, 40 10" stroke="white" strokeWidth="2.2" strokeLinecap="round" opacity="0.85"/>
              <circle cx="40" cy="10" r="1.5" fill="white" opacity="0.7"/>
            </svg>
          </div>
          <span className="font-extrabold text-lg tracking-tight" style={{
            background: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>KeyFlow</span>
        </Link>

        {/* Desktop nav */}
        <div className="nav-desktop items-center gap-1">
          {NAV_ITEMS.map(item => {
            const active = isActive(item);
            return (
              <Link
                key={item.path}
                to={item.path}
                className="px-3 py-2 rounded-xl text-sm font-medium transition-all duration-300"
                style={{
                  color: active ? 'var(--primary-color)' : 'var(--text-secondary)',
                  background: active ? 'rgba(99,102,241,0.15)' : 'var(--nav-item-bg, rgba(255,255,255,0.7))',
                  fontWeight: active ? 600 : 500,
                }}
                onMouseEnter={e => {
                  if (!active) {
                    e.currentTarget.style.color = 'var(--primary-color)';
                    e.currentTarget.style.background = 'rgba(99,102,241,0.12)';
                  }
                }}
                onMouseLeave={e => {
                  if (!active) {
                    e.currentTarget.style.color = 'var(--text-secondary)';
                    e.currentTarget.style.background = getComputedStyle(document.documentElement).getPropertyValue('--nav-item-bg').trim() || 'rgba(255,255,255,0.7)';
                  }
                }}
              >
                {t(item.labelKey, locale)}
              </Link>
            );
          })}
          <div className="w-px h-5 mx-1" style={{ background: 'var(--glass-border)' }} />

          {/* Online count */}
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs" style={{
            color: '#10b981',
            background: 'var(--nav-item-bg, rgba(255,255,255,0.7))',
            border: '1px solid rgba(16,185,129,0.2)',
          }}>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-medium tabular-nums">{onlineCount}</span>
            <span style={{ color: 'var(--text-muted)' }}>{t('nav.online', locale)}</span>
          </div>

          {/* Language toggle */}
          <button onClick={toggleLocale}
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-300 text-xs font-bold"
            style={{ color: 'var(--text-secondary)', background: 'var(--nav-item-bg, rgba(255,255,255,0.7))' }}
            title={locale === 'zh' ? 'Switch to English' : '切换到中文'}>
            {locale === 'zh' ? 'EN' : '中'}
          </button>

          {/* Theme toggle */}
          <button onClick={toggleTheme}
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-300"
            style={{ color: 'var(--text-secondary)', background: 'var(--nav-item-bg, rgba(255,255,255,0.7))' }}
            title={theme === 'light' ? '切换暗色主题' : '切换亮色主题'}>
            {theme === 'light' ? (
              <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
              </svg>
            ) : (
              <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
              </svg>
            )}
          </button>

          <Link
            to="/settings"
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-300"
            style={{
              color: location.pathname === '/settings' ? 'var(--primary-color)' : 'var(--text-muted)',
              background: location.pathname === '/settings' ? 'rgba(99,102,241,0.15)' : 'var(--nav-item-bg, rgba(255,255,255,0.7))',
            }}
          >
            <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </Link>
          <div className="w-px h-5 mx-0.5" style={{ background: 'var(--glass-border)' }} />
          <UserAvatar onClick={() => {
            if (isLoggedIn()) {
              navigate('/profile');
            } else {
              setShowLoginModal(true);
            }
          }} />
        </div>

        {/* Mobile hamburger */}
        <div className="nav-mobile-toggle items-center gap-2">
          {/* Online count mobile */}
          <div className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs" style={{
            color: '#10b981', background: 'rgba(16,185,129,0.08)',
          }}>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-medium tabular-nums">{onlineCount}</span>
          </div>
          <button onClick={toggleLocale}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold"
            style={{ color: 'var(--text-secondary)' }}>
            {locale === 'zh' ? 'EN' : '中'}
          </button>
          <button onClick={toggleTheme}
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ color: 'var(--text-secondary)' }}>
            {theme === 'light' ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
              </svg>
            )}
          </button>
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ color: 'var(--text-secondary)' }}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="nav-mobile-menu px-4 pb-4 space-y-1" style={{
          background: 'var(--nav-bg, rgba(255,255,255,0.25))',
          backdropFilter: 'blur(30px)',
          borderTop: '1px solid var(--glass-border)',
        }}>
          {NAV_ITEMS.map(item => {
            const active = isActive(item);
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className="block px-4 py-3 rounded-xl text-sm font-medium transition-all"
                style={{
                  color: active ? 'var(--primary-color)' : 'var(--text-secondary)',
                  background: active ? 'rgba(99,102,241,0.15)' : 'var(--nav-item-bg, rgba(255,255,255,0.7))',
                  fontWeight: active ? 600 : 500,
                }}
              >
                {t(item.labelKey, locale)}
              </Link>
            );
          })}
          <Link
            to="/settings"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-4 py-3 rounded-xl text-sm font-medium"
            style={{
              color: location.pathname === '/settings' ? 'var(--primary-color)' : 'var(--text-secondary)',
              background: location.pathname === '/settings' ? 'rgba(99,102,241,0.12)' : 'transparent',
            }}
          >
            {t('nav.settings', locale)}
          </Link>
        </div>
      )}

      {/* Login Modal */}
      {showLoginModal && (
        <LoginModal
          onClose={() => setShowLoginModal(false)}
          onLogin={(user) => setAuthUser(user)}
        />
      )}
    </nav>
  );
}
