import { getDeviceId } from './device';
import { getStoredAvatar, getStoredNickname } from './userPrefs';

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

export interface TrainingRecommendations {
  readonly priority: 'accuracy' | 'speed' | 'stamina' | 'competition';
  readonly suggestedDifficulty: 'easy' | 'medium' | 'hard';
  readonly recommendedMode: 'practice' | 'lessons' | 'code' | 'multiplayer' | 'daily';
  readonly focusKeys: readonly string[];
  readonly targetWpm: number;
  readonly targetAccuracy: number;
  readonly targetSessions: number;
  readonly drills: readonly {
    readonly id: string;
    readonly title: string;
    readonly description: string;
    readonly path: string;
  }[];
}

export interface DashboardInsights {
  readonly consistencyScore: number;
  readonly weeklySessions: number;
  readonly weeklyChars: number;
  readonly weeklyMinutes: number;
  readonly wpmTrend: number;
  readonly accuracyTrend: number;
  readonly bestHour: { readonly hour: number; readonly avgWpm: number } | null;
  readonly modeBreakdown: readonly {
    readonly mode: string;
    readonly sessions: number;
    readonly avgWpm: number;
    readonly avgAccuracy: number;
  }[];
  readonly coach: TrainingRecommendations;
}

export function fetchDashboardInsights() {
  return request<DashboardInsights>(`/api/stats/${deviceId()}/insights`);
}

export function fetchTrainingRecommendations() {
  return request<TrainingRecommendations>(`/api/training/${deviceId()}/recommendations`);
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
export interface CustomTextEntry {
  readonly id: number;
  readonly title: string;
  readonly content: string;
  readonly language: string;
  readonly collectionName: string;
  readonly tags: readonly string[];
  readonly isFavorite: boolean;
  readonly useCount: number;
  readonly lastUsedAt: string | null;
  readonly createdAt: string;
}

export function fetchCustomTexts() {
  return request<readonly CustomTextEntry[]>(
    `/api/custom-texts/${deviceId()}`
  );
}

export function createCustomText(data: {
  title: string;
  content: string;
  language?: string;
  collectionName?: string;
  tags?: readonly string[];
  isFavorite?: boolean;
}) {
  return request<{ id: number }>(`/api/custom-texts/${deviceId()}`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function updateCustomText(textId: number, data: {
  title?: string;
  content?: string;
  language?: string;
  collectionName?: string;
  tags?: readonly string[];
  isFavorite?: boolean;
}) {
  return request<{ success: boolean }>(`/api/custom-texts/${deviceId()}/${textId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export function markCustomTextUsed(textId: number) {
  return request<{ success: boolean }>(`/api/custom-texts/${deviceId()}/${textId}/use`, {
    method: 'POST',
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
      nickname: getStoredNickname('Anonymous'),
      avatar: getStoredAvatar(),
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

export function fetchReplayAnalysis(replayId: number) {
  return request<{
    totalErrors: number;
    correctionBursts: number;
    longestPerfectStreak: number;
    averageIntervalMs: number;
    consistencyScore: number;
    hardestSnippet: string;
    mistakeHotspots: readonly { char: string; errors: number }[];
    benchmark: {
      replayId: number;
      wpm: number;
      accuracy: number;
      deltaWpm: number;
      deltaAccuracy: number;
    } | null;
  }>(`/api/replays/view/${replayId}/analysis`);
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
      nickname: getStoredNickname('Anonymous'),
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

// ===== Game Scores =====
export function submitGameScore(data: { gameId: string; score: number; difficulty: string }) {
  return request<{ id: number }>('/api/game-scores', {
    method: 'POST',
    body: JSON.stringify({
      deviceId: deviceId(),
      nickname: getStoredNickname('Anonymous'),
      avatar: getStoredAvatar(),
      ...data,
    }),
  });
}

export interface GameScoreEntry {
  readonly nickname: string;
  readonly avatar: number;
  readonly score: number;
  readonly difficulty: string;
  readonly deviceId: string;
  readonly createdAt: string;
}

export function fetchGameLeaderboard(gameId: string) {
  return request<readonly GameScoreEntry[]>(`/api/game-scores/${gameId}`);
}

export function fetchSeasonOverview() {
  return request<{
    player: {
      rank: number | null;
      rating: number;
      tier: string;
      matches: number;
      wins: number;
      podiums: number;
      avgWpm: number;
      avgAccuracy: number;
      winRate: number;
    };
    leaderboard: readonly {
      rank: number;
      deviceId: string;
      nickname: string;
      avatar: number;
      rating: number;
      wins: number;
      avgWpm: number;
      tier: string;
    }[];
    recentOpponents: readonly {
      deviceId: string;
      nickname: string;
      avatar: number;
      races: number;
      lastSeen: string;
    }[];
    friendLadder: readonly {
      deviceId: string;
      nickname: string;
      avatar: number;
      rating: number;
      tier: string;
    }[];
  }>(`/api/season/${deviceId()}`);
}

export function fetchGrowthOverview() {
  return request<{
    streakDays: number;
    totalSessions: number;
    totalChars: number;
    totalReplays: number;
    rewardLevel: number;
    unlockedRewards: readonly {
      id: string;
      name: string;
      unlocked: boolean;
    }[];
    missions: readonly {
      id: string;
      title: string;
      progress: number;
      target: number;
      reward: string;
      completed: boolean;
    }[];
  }>(`/api/growth/${deviceId()}`);
}

export function fetchGameMeta() {
  return request<{
    level: number;
    totalRuns: number;
    uniqueGames: number;
    passportProgress: number;
    topGames: readonly {
      gameId: string;
      plays: number;
      bestScore: number;
      avgScore: number;
      lastPlayed: string;
    }[];
    missions: readonly {
      id: string;
      title: string;
      progress: number;
      target: number;
      completed: boolean;
    }[];
  }>(`/api/games/meta/${deviceId()}`);
}
