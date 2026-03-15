import { getDeviceId } from './device';

const API_BASE = '';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error ?? `HTTP ${res.status}`);
  }
  return res.json();
}

const deviceId = () => getDeviceId();

// ===== Daily Stats =====
export function fetchDailyStats(days = 30) {
  return request<readonly { date: string; chars: number; wpm: number; accuracy: number; sessions: number; timeMs: number }[]>(
    `/api/stats/${deviceId()}/daily?days=${days}`
  );
}

export function fetchKeyErrorStats() {
  return request<readonly { keyChar: string; correct: number; incorrect: number }[]>(
    `/api/stats/${deviceId()}/keys`
  );
}

export function reportSession(data: {
  chars: number;
  wpm: number;
  accuracy: number;
  timeMs: number;
  keyStats?: Record<string, { correct: number; incorrect: number }>;
}) {
  return request(`/api/stats/${deviceId()}/session`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// ===== Custom Texts =====
export function fetchCustomTexts() {
  return request<readonly { id: number; title: string; content: string; language: string; createdAt: string }[]>(
    `/api/custom-texts/${deviceId()}`
  );
}

export function createCustomText(data: { title: string; content: string; language?: string }) {
  return request<{ id: number }>(`/api/custom-texts/${deviceId()}`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function deleteCustomText(textId: number) {
  return request(`/api/custom-texts/${deviceId()}/${textId}`, { method: 'DELETE' });
}

// ===== Daily Challenge =====
export function fetchDailyChallenge() {
  return request<{ date: string; textContent: string }>('/api/daily-challenge');
}

export function submitDailyChallengeScore(data: { wpm: number; accuracy: number; timeMs: number }) {
  return request('/api/daily-challenge/score', {
    method: 'POST',
    body: JSON.stringify({
      deviceId: deviceId(),
      nickname: localStorage.getItem('nickname') ?? 'Anonymous',
      avatar: parseInt(localStorage.getItem('avatar') ?? '0'),
      ...data,
    }),
  });
}

export function fetchDailyChallengeLeaderboard(date?: string) {
  const q = date ? `?date=${date}` : '';
  return request<readonly { deviceId: string; nickname: string; avatar: number; wpm: number; accuracy: number; timeMs: number }[]>(
    `/api/daily-challenge/leaderboard${q}`
  );
}

// ===== Friends =====
export function fetchFriends() {
  return request<readonly { deviceId: string; nickname: string; avatar: number; friendsCode: string | null; status: string }[]>(
    `/api/friends/${deviceId()}`
  );
}

export function fetchPendingRequests() {
  return request<readonly { deviceId: string; nickname: string; avatar: number }[]>(
    `/api/friends/${deviceId()}/pending`
  );
}

export function addFriend(friendsCode: string) {
  return request<{ success: boolean; friend?: { deviceId: string; nickname: string; avatar: number } }>(
    `/api/friends/${deviceId()}/add`,
    { method: 'POST', body: JSON.stringify({ friendsCode }) }
  );
}

export function acceptFriend(friendDeviceId: string) {
  return request(`/api/friends/${deviceId()}/accept`, {
    method: 'POST',
    body: JSON.stringify({ friendDeviceId }),
  });
}

export function removeFriend(friendDeviceId: string) {
  return request(`/api/friends/${deviceId()}/remove`, {
    method: 'POST',
    body: JSON.stringify({ friendDeviceId }),
  });
}

// ===== Replays =====
export function fetchMyReplays(limit = 20) {
  return request<readonly { id: number; textContent: string; wpm: number; accuracy: number; durationMs: number; createdAt: string }[]>(
    `/api/replays/${deviceId()}?limit=${limit}`
  );
}

export function fetchReplay(replayId: number) {
  return request<{
    id: number;
    deviceId: string;
    nickname: string;
    textContent: string;
    replayData: readonly { timestamp: number; key: string; correct: boolean }[];
    wpm: number;
    accuracy: number;
    durationMs: number;
    createdAt: string;
  }>(`/api/replays/view/${replayId}`);
}

export function saveReplay(data: {
  textContent: string;
  replayData: readonly { timestamp: number; key: string; correct: boolean }[];
  wpm: number;
  accuracy: number;
  durationMs: number;
}) {
  return request<{ id: number }>('/api/replays', {
    method: 'POST',
    body: JSON.stringify({
      deviceId: deviceId(),
      nickname: localStorage.getItem('nickname') ?? 'Anonymous',
      ...data,
    }),
  });
}

// ===== Code Texts =====
export function fetchCodeTexts(language?: string) {
  const q = language ? `?language=${language}` : '';
  return request<readonly { id: string; text: string; language: string; title: string; difficulty: string }[]>(
    `/api/texts/code${q}`
  );
}
