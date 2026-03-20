const NICKNAME_KEYS = ['nickname', 'typerace_nickname'] as const;
const AVATAR_KEYS = ['avatar', 'typerace_avatar'] as const;

function readFirst(keys: readonly string[]): string | null {
  for (const key of keys) {
    const value = localStorage.getItem(key);
    if (value && value.trim().length > 0) {
      return value;
    }
  }
  return null;
}

export function getStoredNickname(fallback = ''): string {
  return readFirst(NICKNAME_KEYS) ?? fallback;
}

export function setStoredNickname(nickname: string): void {
  for (const key of NICKNAME_KEYS) {
    localStorage.setItem(key, nickname);
  }
}

export function getStoredAvatar(fallback = 0): number {
  const raw = readFirst(AVATAR_KEYS);
  const parsed = raw ? parseInt(raw, 10) : fallback;
  return Number.isNaN(parsed) ? fallback : parsed;
}

export function setStoredAvatar(avatar: number): void {
  const value = String(avatar);
  for (const key of AVATAR_KEYS) {
    localStorage.setItem(key, value);
  }
}

export function saveStoredProfile(nickname: string, avatar: number): void {
  setStoredNickname(nickname);
  setStoredAvatar(avatar);
}
