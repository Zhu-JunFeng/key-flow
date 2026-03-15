import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  getAuthUser, guestLogin,
  startGoogleLogin, getAuthConfig,
  type AuthUser,
} from '../lib/auth';
import { useLocale } from '../lib/hooks';

interface LoginModalProps {
  readonly onClose: () => void;
  readonly onLogin: (user: AuthUser) => void;
}

export default function LoginModal({ onClose, onLogin }: LoginModalProps) {
  const locale = useLocale();
  const [authConfig, setAuthConfig] = useState({ google: false, github: false });
  const [loading, setLoading] = useState<'google' | null>(null);

  useEffect(() => {
    getAuthConfig().then(setAuthConfig);
  }, []);

  const handleGoogleLogin = () => {
    if (!authConfig.google) return;
    setLoading('google');
    startGoogleLogin();
  };

  const handleGuestLogin = () => {
    const user = guestLogin();
    onLogin(user);
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}>
      <div className="relative max-w-md w-full mx-4 p-6 rounded-3xl" style={{
        background: '#ffffff',
        border: '1px solid #e5e7eb',
        boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
      }} onClick={e => e.stopPropagation()}>
        <div className="text-center space-y-4">
          <div className="text-4xl">👤</div>
          <h3 className="text-lg font-bold" style={{ color: '#1f2937' }}>
            {locale === 'zh' ? '选择登录方式' : 'Sign In'}
          </h3>
          <p className="text-sm leading-relaxed" style={{ color: '#4b5563' }}>
            {locale === 'zh'
              ? '选择登录方式，开始你的打字之旅'
              : 'Choose how to sign in and start typing'}
          </p>
          <div className="flex flex-col gap-3 pt-2">
            {/* Guest - recommended */}
            <button onClick={handleGuestLogin}
              className="w-full flex items-center gap-3 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:-translate-y-0.5"
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 4px 15px rgba(99,102,241,0.35)' }}>
              <svg className="w-4 h-4 flex-shrink-0" fill="white" viewBox="0 0 24 24">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
              </svg>
              <span className="flex-1 text-left">
                {locale === 'zh' ? '游客模式继续' : 'Continue as Guest'}
              </span>
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.2)' }}>
                {locale === 'zh' ? '推荐' : 'Recommended'}
              </span>
            </button>

            {/* Google */}
            <button
              onClick={handleGoogleLogin}
              disabled={!authConfig.google || loading === 'google'}
              className="w-full flex items-center gap-3 px-5 py-2.5 rounded-xl text-sm font-medium transition-all hover:-translate-y-0.5 disabled:opacity-40 disabled:hover:translate-y-0 disabled:cursor-not-allowed"
              style={{ color: '#4b5563', background: '#f3f4f6', border: '1px solid #e5e7eb' }}>
              <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span className="flex-1 text-left">
                {loading === 'google'
                  ? (locale === 'zh' ? '跳转中...' : 'Redirecting...')
                  : (locale === 'zh' ? '使用 Google 登录' : 'Continue with Google')}
              </span>
            </button>
          </div>
          <p className="text-[11px] leading-relaxed" style={{ color: '#9ca3af' }}>
            {locale === 'zh'
              ? '游客数据绑定当前设备，清除浏览器数据后将丢失。'
              : 'Guest data is bound to this device.'}
          </p>
        </div>
      </div>
    </div>,
    document.body
  );
}

// User avatar button for Navbar
export function UserAvatar({ onClick }: { readonly onClick: () => void }) {
  const user = getAuthUser();
  const isGoogle = user.loginType === 'google';

  // Mask email: show first 4 chars + *** + domain
  const maskEmail = (email: string) => {
    const atIdx = email.indexOf('@');
    if (atIdx <= 0) return email;
    const local = email.slice(0, atIdx);
    const domain = email.slice(atIdx);
    const visible = local.slice(0, Math.min(4, local.length));
    return `${visible}***${domain}`;
  };

  return (
    <button onClick={onClick}
      className="flex items-center gap-1.5 px-1.5 py-1 rounded-lg transition-all duration-200 hover:scale-105"
      style={{ color: 'var(--text-secondary)', background: 'transparent' }}>
      <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold overflow-hidden"
        style={{
          background: isGoogle
            ? 'linear-gradient(135deg, #4285F4, #34A853)'
            : user.loginType === 'github'
            ? 'linear-gradient(135deg, #333, #666)'
            : 'linear-gradient(135deg, #6366f1, #06b6d4)',
          color: 'white',
          boxShadow: '0 1px 4px rgba(99,102,241,0.2)',
        }}>
        {user.avatarUrl
          ? <img src={user.avatarUrl} className="w-full h-full object-cover" alt="" referrerPolicy="no-referrer" />
          : user.nickname.charAt(0).toUpperCase()
        }
      </div>
      {isGoogle && user.email && (
        <span className="text-[11px] font-medium max-w-[120px] truncate" style={{ color: 'var(--text-muted)' }}>
          {maskEmail(user.email)}
        </span>
      )}
    </button>
  );
}
