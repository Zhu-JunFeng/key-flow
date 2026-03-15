// Authentication state management
// Default: guest mode bound to device ID
// Supports: Google, GitHub, Guest login

import { getDeviceId } from './device';

export interface AuthUser {
  readonly id: string;
  readonly nickname: string;
  readonly avatar: number;
  readonly loginType: 'guest' | 'google' | 'github';
  readonly email?: string;
  readonly avatarUrl?: string;
}

const AUTH_KEY = 'keyflow_auth_user';

export function getAuthUser(): AuthUser {
  const stored = localStorage.getItem(AUTH_KEY);
  if (stored) {
    try {
      return JSON.parse(stored) as AuthUser;
    } catch {
      // fall through to default
    }
  }
  // Default guest user
  const deviceId = getDeviceId();
  return {
    id: deviceId,
    nickname: localStorage.getItem('typerace_nickname') || `Player_${deviceId.slice(0, 6)}`,
    avatar: parseInt(localStorage.getItem('typerace_avatar') || '0'),
    loginType: 'guest',
  };
}

export function setAuthUser(user: AuthUser): void {
  localStorage.setItem(AUTH_KEY, JSON.stringify(user));
  localStorage.setItem('typerace_nickname', user.nickname);
  if (user.avatar !== undefined) {
    localStorage.setItem('typerace_avatar', String(user.avatar));
  }
  window.dispatchEvent(new Event('auth-change'));
}

export function logout(): void {
  localStorage.removeItem(AUTH_KEY);
  window.dispatchEvent(new Event('auth-change'));
}

export function isLoggedIn(): boolean {
  return localStorage.getItem(AUTH_KEY) !== null;
}

// Google Identity Services (GIS) — 前端 credential 模式
// 无需服务端访问 Google API，绕过国内网络限制
const GOOGLE_CLIENT_ID = '566904688287-v4155gbbfc495ge58tapofk3fb5j9hv9.apps.googleusercontent.com';

interface GoogleCredentialResponse {
  readonly credential: string;
}

declare global {
  interface Window {
    readonly google?: {
      readonly accounts: {
        readonly id: {
          initialize(config: {
            readonly client_id: string;
            readonly callback: (response: GoogleCredentialResponse) => void;
          }): void;
          prompt(): void;
        };
      };
    };
  }
}

function parseJwtPayload(token: string): Record<string, unknown> {
  const base64Url = token.split('.')[1];
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const jsonPayload = decodeURIComponent(
    atob(base64)
      .split('')
      .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
      .join('')
  );
  return JSON.parse(jsonPayload) as Record<string, unknown>;
}

export function initGoogleLogin(onSuccess: (user: AuthUser) => void): void {
  if (!window.google?.accounts?.id) {
    console.error('Google Identity Services SDK not loaded');
    return;
  }
  window.google.accounts.id.initialize({
    client_id: GOOGLE_CLIENT_ID,
    callback: (response: GoogleCredentialResponse) => {
      const payload = parseJwtPayload(response.credential);
      const user: AuthUser = {
        id: (payload.sub as string) || getDeviceId(),
        nickname: (payload.name as string) || 'User',
        avatar: 0,
        loginType: 'google',
        email: payload.email as string | undefined,
        avatarUrl: payload.picture as string | undefined,
      };
      setAuthUser(user);
      onSuccess(user);
    },
  });
  window.google.accounts.id.prompt();
}

// Legacy: redirect to server (kept for backward compat)
export function startGoogleLogin(): void {
  const deviceId = getDeviceId();
  window.location.href = `/auth/google?device_id=${deviceId}`;
}

export function startGithubLogin(): void {
  const deviceId = getDeviceId();
  window.location.href = `/auth/github?device_id=${deviceId}`;
}

export function guestLogin(): AuthUser {
  const deviceId = getDeviceId();
  const user: AuthUser = {
    id: deviceId,
    nickname: localStorage.getItem('typerace_nickname') || `Player_${deviceId.slice(0, 6)}`,
    avatar: parseInt(localStorage.getItem('typerace_avatar') || '0'),
    loginType: 'guest',
  };
  setAuthUser(user);
  return user;
}

// Handle OAuth callback data from URL params
export function handleAuthCallback(): AuthUser | null {
  const params = new URLSearchParams(window.location.search);
  const authData = params.get('auth');
  if (!authData) return null;

  try {
    const data = JSON.parse(decodeURIComponent(authData)) as {
      id: string;
      nickname: string;
      email?: string;
      avatarUrl?: string;
      loginType: 'google' | 'github';
    };
    const user: AuthUser = {
      id: data.id || getDeviceId(),
      nickname: data.nickname || 'User',
      avatar: 0,
      loginType: data.loginType,
      email: data.email,
      avatarUrl: data.avatarUrl,
    };
    setAuthUser(user);
    // Clean URL
    window.history.replaceState({}, '', window.location.pathname);
    return user;
  } catch {
    return null;
  }
}

// Check which OAuth providers are configured on server
export async function getAuthConfig(): Promise<{ google: boolean; github: boolean }> {
  try {
    const res = await fetch('/api/auth/config');
    return await res.json() as { google: boolean; github: boolean };
  } catch {
    return { google: false, github: false };
  }
}
