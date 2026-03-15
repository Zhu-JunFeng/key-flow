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

// Start real OAuth flow by redirecting to server
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
