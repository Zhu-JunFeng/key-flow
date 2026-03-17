import { getDb } from './schema.js';
import type { LeaderboardEntry } from '../types.js';

// ===== User Count =====
export function getUserCount(): number {
  const db = getDb();
  const row = db.prepare('SELECT COUNT(*) as count FROM user_profiles').get() as { count: number };
  return row.count;
}

// ===== Leaderboard =====
export function addLeaderboardEntry(entry: {
  readonly deviceId?: string;
  readonly nickname: string;
  readonly avatar: number;
  readonly wpm: number;
  readonly accuracy: number;
  readonly textLength: number;
  readonly mode: 'practice' | 'multiplayer' | 'lesson' | 'test';
  readonly language?: string;
}): void {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT INTO leaderboard (device_id, nickname, avatar, wpm, accuracy, text_length, mode, language)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(
    entry.deviceId ?? null, entry.nickname, entry.avatar,
    entry.wpm, entry.accuracy, entry.textLength, entry.mode, entry.language ?? 'en'
  );
}

export function getLeaderboard(
  mode?: string,
  limit = 50
): readonly LeaderboardEntry[] {
  const db = getDb();
  const where = mode ? 'WHERE mode = ?' : '';
  const params = mode ? [mode, limit] : [limit];
  const stmt = db.prepare(`
    SELECT id, nickname, avatar, wpm, accuracy, text_length as textLength, mode, created_at as createdAt
    FROM leaderboard
    ${where}
    ORDER BY wpm DESC
    LIMIT ?
  `);
  return stmt.all(...params) as LeaderboardEntry[];
}

// ===== Match History =====
export function addMatchHistory(entry: {
  readonly roomId: string;
  readonly deviceId?: string;
  readonly nickname: string;
  readonly avatar: number;
  readonly wpm: number;
  readonly accuracy: number;
  readonly rank: number;
  readonly playerCount: number;
}): void {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT INTO match_history (room_id, device_id, nickname, avatar, wpm, accuracy, rank, player_count)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(
    entry.roomId, entry.deviceId ?? null, entry.nickname, entry.avatar,
    entry.wpm, entry.accuracy, entry.rank, entry.playerCount
  );
}

// ===== User Profiles (device-bound) =====
export interface UserProfile {
  readonly deviceId: string;
  readonly nickname: string;
  readonly avatar: number;
  readonly settings: Record<string, unknown>;
  readonly lessonProgress: Record<string, unknown>;
  readonly badges: readonly string[];
  readonly totalTyped: number;
  readonly totalTime: number;
  readonly keyStats: Record<string, { correct: number; total: number }>;
  readonly friendsCode: string | null;
  readonly streakDays: number;
  readonly lastActiveDate: string | null;
  readonly theme: string;
  readonly keyboardLayout: string;
  readonly customSounds: Record<string, unknown>;
}

interface UserProfileRow {
  device_id: string;
  nickname: string;
  avatar: number;
  settings: string;
  lesson_progress: string;
  badges: string;
  total_typed: number;
  total_time: number;
  key_stats: string;
  friends_code: string | null;
  streak_days: number;
  last_active_date: string | null;
  theme: string;
  keyboard_layout: string;
  custom_sounds: string;
}

function rowToProfile(row: UserProfileRow): UserProfile {
  return {
    deviceId: row.device_id,
    nickname: row.nickname,
    avatar: row.avatar,
    settings: JSON.parse(row.settings),
    lessonProgress: JSON.parse(row.lesson_progress),
    badges: JSON.parse(row.badges),
    totalTyped: row.total_typed,
    totalTime: row.total_time,
    keyStats: JSON.parse(row.key_stats),
    friendsCode: row.friends_code ?? null,
    streakDays: row.streak_days ?? 0,
    lastActiveDate: row.last_active_date ?? null,
    theme: row.theme ?? 'light',
    keyboardLayout: row.keyboard_layout ?? 'qwerty',
    customSounds: JSON.parse(row.custom_sounds ?? '{}'),
  };
}

function generateFriendsCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export function getOrCreateProfile(deviceId: string): UserProfile {
  const db = getDb();
  let row = db.prepare('SELECT * FROM user_profiles WHERE device_id = ?').get(deviceId) as UserProfileRow | undefined;

  if (!row) {
    const friendsCode = generateFriendsCode();
    db.prepare(`
      INSERT INTO user_profiles (device_id, nickname, avatar, friends_code) VALUES (?, ?, ?, ?)
    `).run(deviceId, 'Player_' + deviceId.slice(0, 6), 0, friendsCode);
    row = db.prepare('SELECT * FROM user_profiles WHERE device_id = ?').get(deviceId) as UserProfileRow;
  }

  return rowToProfile(row!);
}

export function updateProfile(deviceId: string, updates: {
  readonly nickname?: string;
  readonly avatar?: number;
  readonly settings?: Record<string, unknown>;
  readonly lessonProgress?: Record<string, unknown>;
  readonly badges?: readonly string[];
  readonly totalTyped?: number;
  readonly totalTime?: number;
  readonly keyStats?: Record<string, { correct: number; total: number }>;
  readonly theme?: string;
  readonly keyboardLayout?: string;
  readonly customSounds?: Record<string, unknown>;
}): UserProfile {
  const db = getDb();
  const current = getOrCreateProfile(deviceId);

  const merged = {
    nickname: updates.nickname ?? current.nickname,
    avatar: updates.avatar ?? current.avatar,
    settings: JSON.stringify(updates.settings ?? current.settings),
    lessonProgress: JSON.stringify(updates.lessonProgress ?? current.lessonProgress),
    badges: JSON.stringify(updates.badges ?? current.badges),
    totalTyped: updates.totalTyped ?? current.totalTyped,
    totalTime: updates.totalTime ?? current.totalTime,
    keyStats: JSON.stringify(updates.keyStats ?? current.keyStats),
    theme: updates.theme ?? current.theme,
    keyboardLayout: updates.keyboardLayout ?? current.keyboardLayout,
    customSounds: JSON.stringify(updates.customSounds ?? current.customSounds),
  };

  db.prepare(`
    UPDATE user_profiles SET
      nickname = ?, avatar = ?, settings = ?, lesson_progress = ?,
      badges = ?, total_typed = ?, total_time = ?, key_stats = ?,
      theme = ?, keyboard_layout = ?, custom_sounds = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE device_id = ?
  `).run(
    merged.nickname, merged.avatar, merged.settings, merged.lessonProgress,
    merged.badges, merged.totalTyped, merged.totalTime, merged.keyStats,
    merged.theme, merged.keyboardLayout, merged.customSounds,
    deviceId
  );

  return getOrCreateProfile(deviceId);
}

export function getPlayerStats(deviceId: string): {
  readonly totalGames: number;
  readonly avgWpm: number;
  readonly bestWpm: number;
  readonly avgAccuracy: number;
  readonly wins: number;
} {
  const db = getDb();
  const stats = db.prepare(`
    SELECT
      COUNT(*) as totalGames,
      ROUND(AVG(wpm), 1) as avgWpm,
      ROUND(MAX(wpm), 1) as bestWpm,
      ROUND(AVG(accuracy), 1) as avgAccuracy
    FROM leaderboard
    WHERE device_id = ?
  `).get(deviceId) as { totalGames: number; avgWpm: number; bestWpm: number; avgAccuracy: number };

  const winsResult = db.prepare(`
    SELECT COUNT(*) as wins
    FROM match_history
    WHERE device_id = ? AND rank = 1
  `).get(deviceId) as { wins: number };

  return { ...stats, wins: winsResult.wins };
}

export function getPlayerHistory(deviceId: string, limit = 20): readonly {
  readonly wpm: number;
  readonly accuracy: number;
  readonly mode: string;
  readonly createdAt: string;
}[] {
  const db = getDb();
  return db.prepare(`
    SELECT wpm, accuracy, mode, created_at as createdAt
    FROM leaderboard WHERE device_id = ?
    ORDER BY created_at DESC LIMIT ?
  `).all(deviceId, limit) as { wpm: number; accuracy: number; mode: string; createdAt: string }[];
}

// ===== Daily Stats =====
export function upsertDailyStats(deviceId: string, data: {
  readonly chars: number;
  readonly wpm: number;
  readonly accuracy: number;
  readonly timeMs: number;
}): void {
  const db = getDb();
  const today = new Date().toISOString().slice(0, 10);
  db.prepare(`
    INSERT INTO daily_stats (device_id, date, chars, wpm, accuracy, sessions, time_ms)
    VALUES (?, ?, ?, ?, ?, 1, ?)
    ON CONFLICT(device_id, date) DO UPDATE SET
      chars = chars + excluded.chars,
      wpm = ROUND((wpm * sessions + excluded.wpm) / (sessions + 1), 1),
      accuracy = ROUND((accuracy * sessions + excluded.accuracy) / (sessions + 1), 1),
      sessions = sessions + 1,
      time_ms = time_ms + excluded.time_ms
  `).run(deviceId, today, data.chars, data.wpm, data.accuracy, data.timeMs);

  // Update streak
  updateStreak(deviceId, today);
}

function updateStreak(deviceId: string, today: string): void {
  const db = getDb();
  const profile = db.prepare('SELECT last_active_date, streak_days FROM user_profiles WHERE device_id = ?')
    .get(deviceId) as { last_active_date: string | null; streak_days: number } | undefined;
  if (!profile) return;

  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  let newStreak = profile.streak_days;

  if (profile.last_active_date === today) {
    return; // Already updated today
  } else if (profile.last_active_date === yesterday) {
    newStreak += 1;
  } else {
    newStreak = 1;
  }

  db.prepare('UPDATE user_profiles SET streak_days = ?, last_active_date = ? WHERE device_id = ?')
    .run(newStreak, today, deviceId);
}

export function getDailyStats(deviceId: string, days = 30): readonly {
  readonly date: string;
  readonly chars: number;
  readonly wpm: number;
  readonly accuracy: number;
  readonly sessions: number;
  readonly timeMs: number;
}[] {
  const db = getDb();
  return db.prepare(`
    SELECT date, chars, wpm, accuracy, sessions, time_ms as timeMs
    FROM daily_stats
    WHERE device_id = ? AND date >= date('now', '-' || ? || ' days')
    ORDER BY date ASC
  `).all(deviceId, days) as { date: string; chars: number; wpm: number; accuracy: number; sessions: number; timeMs: number }[];
}

// ===== Key Error Stats =====
export function upsertKeyErrorStats(deviceId: string, keyStats: Record<string, { correct: number; incorrect: number }>): void {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT INTO key_error_stats (device_id, key_char, correct, incorrect)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(device_id, key_char) DO UPDATE SET
      correct = correct + excluded.correct,
      incorrect = incorrect + excluded.incorrect
  `);
  const transaction = db.transaction(() => {
    for (const [key, stats] of Object.entries(keyStats)) {
      stmt.run(deviceId, key, stats.correct, stats.incorrect);
    }
  });
  transaction();
}

export function getKeyErrorStats(deviceId: string): readonly {
  readonly keyChar: string;
  readonly correct: number;
  readonly incorrect: number;
}[] {
  const db = getDb();
  return db.prepare(`
    SELECT key_char as keyChar, correct, incorrect
    FROM key_error_stats WHERE device_id = ?
    ORDER BY incorrect DESC
  `).all(deviceId) as { keyChar: string; correct: number; incorrect: number }[];
}

// ===== Custom Texts =====
export function createCustomText(deviceId: string, data: {
  readonly title: string;
  readonly content: string;
  readonly language?: string;
}): number {
  const db = getDb();
  const result = db.prepare(`
    INSERT INTO custom_texts (device_id, title, content, language) VALUES (?, ?, ?, ?)
  `).run(deviceId, data.title, data.content, data.language ?? 'en');
  return Number(result.lastInsertRowid);
}

export function getCustomTexts(deviceId: string): readonly {
  readonly id: number;
  readonly title: string;
  readonly content: string;
  readonly language: string;
  readonly createdAt: string;
}[] {
  const db = getDb();
  return db.prepare(`
    SELECT id, title, content, language, created_at as createdAt
    FROM custom_texts WHERE device_id = ? ORDER BY created_at DESC
  `).all(deviceId) as { id: number; title: string; content: string; language: string; createdAt: string }[];
}

export function deleteCustomText(deviceId: string, textId: number): boolean {
  const db = getDb();
  const result = db.prepare('DELETE FROM custom_texts WHERE id = ? AND device_id = ?').run(textId, deviceId);
  return result.changes > 0;
}

// ===== Daily Challenges =====
const CHALLENGE_TEXTS = [
  "The ability to speak does not make you intelligent. It is the substance of your words and the clarity of your thoughts that truly define wisdom and understanding.",
  "Every line of code is a creative act. Behind every program lies a story of problem-solving, experimentation, and the relentless pursuit of elegance in simplicity.",
  "In the depth of winter, I finally learned that within me there lay an invincible summer. The human spirit has a remarkable capacity to find light in darkness.",
  "Technology is best when it brings people together. The most powerful tools are those that connect minds, bridge distances, and amplify human potential for good.",
  "The only way to do great work is to love what you do. Passion fuels persistence, and persistence transforms ordinary effort into extraordinary achievement.",
  "Knowledge is power, but enthusiasm pulls the switch. The combination of deep understanding and genuine excitement creates an unstoppable force for innovation.",
  "Success is not final, failure is not fatal: it is the courage to continue that counts. Each setback is merely a stepping stone on the path to greatness.",
  "The future belongs to those who believe in the beauty of their dreams. Imagination is the compass that guides us toward possibilities yet unseen.",
  "Creativity is intelligence having fun. When we approach problems with playful curiosity, we discover solutions that rigid thinking could never reveal.",
  "The best time to plant a tree was twenty years ago. The second best time is now. Every moment offers a fresh opportunity to begin building something meaningful.",
  "In a world of algorithms, hashtags, and followers, know the true value of human connection. Technology should enhance, not replace, genuine relationships.",
  "The measure of intelligence is the ability to change. Adaptability is the hallmark of those who thrive in an ever-evolving landscape of challenges and opportunities.",
  "Science is organized knowledge. Wisdom is organized life. Both require patience, discipline, and the humility to recognize how much we have yet to learn.",
  "Innovation distinguishes between a leader and a follower. Those who dare to think differently and challenge the status quo shape the future for generations.",
  "The greatest teacher, failure is. Through our mistakes we gain wisdom that success alone could never provide, building resilience and depth of character.",
  "Life is what happens when you are busy making other plans. Embrace the unexpected detours, for they often lead to the most remarkable destinations.",
  "Stay hungry, stay foolish. The willingness to maintain curiosity and take risks is what separates those who merely exist from those who truly live.",
  "The only limit to our realization of tomorrow will be our doubts of today. Believe in possibility, and watch as barriers transform into stepping stones.",
  "Do what you can, with what you have, where you are. Greatness is not about having perfect conditions but about making the most of every situation.",
  "The mind is everything. What you think you become. Guard your thoughts carefully, for they are the architects of your destiny and the builders of your reality.",
  "Education is the most powerful weapon which you can use to change the world. A single idea, properly nurtured, can transform entire societies.",
  "We are what we repeatedly do. Excellence, then, is not an act, but a habit. Small daily improvements eventually result in stunning achievements.",
  "The purpose of life is not to be happy. It is to be useful, to be honorable, to be compassionate, to have it make some difference that you have lived.",
  "In three words I can sum up everything I learned about life: it goes on. No matter what challenges we face, time continues its relentless forward march.",
  "Be the change you wish to see in the world. Every positive action, no matter how small, creates ripples that extend far beyond our immediate perception.",
  "Logic will get you from A to B. Imagination will take you everywhere. The most transformative breakthroughs come from those who dare to dream beyond convention.",
  "An investment in knowledge pays the best interest. The returns compound over time, enriching not only the individual but everyone they touch along the way.",
  "The secret of getting ahead is getting started. The hardest part of any journey is the first step, but once taken, momentum carries us forward.",
  "It is during our darkest moments that we must focus to see the light. Adversity reveals character and provides the catalyst for our greatest growth.",
  "Not everything that counts can be counted, and not everything that can be counted counts. True value often resides in the immeasurable aspects of human experience.",
  "The two most important days in your life are the day you are born and the day you find out why. Purpose transforms mere existence into a meaningful adventure.",
];

export function getOrCreateDailyChallenge(dateStr?: string): {
  readonly date: string;
  readonly textContent: string;
} {
  const db = getDb();
  const date = dateStr ?? new Date().toISOString().slice(0, 10);

  const existing = db.prepare('SELECT date, text_content as textContent FROM daily_challenges WHERE date = ?')
    .get(date) as { date: string; textContent: string } | undefined;
  if (existing) return existing;

  // Deterministic selection based on date
  const dateNum = parseInt(date.replace(/-/g, ''), 10);
  const index = dateNum % CHALLENGE_TEXTS.length;
  const textContent = CHALLENGE_TEXTS[index];

  db.prepare('INSERT INTO daily_challenges (date, text_content) VALUES (?, ?)').run(date, textContent);
  return { date, textContent };
}

export function submitDailyChallengeScore(data: {
  readonly challengeDate: string;
  readonly deviceId: string;
  readonly nickname: string;
  readonly avatar: number;
  readonly wpm: number;
  readonly accuracy: number;
  readonly timeMs: number;
}): void {
  const db = getDb();
  db.prepare(`
    INSERT INTO daily_challenge_scores (challenge_date, device_id, nickname, avatar, wpm, accuracy, time_ms)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(challenge_date, device_id) DO UPDATE SET
      wpm = CASE WHEN excluded.wpm > wpm THEN excluded.wpm ELSE wpm END,
      accuracy = CASE WHEN excluded.wpm > wpm THEN excluded.accuracy ELSE accuracy END,
      time_ms = CASE WHEN excluded.wpm > wpm THEN excluded.time_ms ELSE time_ms END,
      nickname = excluded.nickname,
      avatar = excluded.avatar
  `).run(data.challengeDate, data.deviceId, data.nickname, data.avatar, data.wpm, data.accuracy, data.timeMs);
}

export function getDailyChallengeLeaderboard(date?: string): readonly {
  readonly deviceId: string;
  readonly nickname: string;
  readonly avatar: number;
  readonly wpm: number;
  readonly accuracy: number;
  readonly timeMs: number;
}[] {
  const db = getDb();
  const targetDate = date ?? new Date().toISOString().slice(0, 10);
  return db.prepare(`
    SELECT device_id as deviceId, nickname, avatar, wpm, accuracy, time_ms as timeMs
    FROM daily_challenge_scores
    WHERE challenge_date = ?
    ORDER BY wpm DESC
    LIMIT 50
  `).all(targetDate) as { deviceId: string; nickname: string; avatar: number; wpm: number; accuracy: number; timeMs: number }[];
}

// ===== Friendships =====
export function findProfileByFriendsCode(code: string): UserProfile | null {
  const db = getDb();
  const row = db.prepare('SELECT * FROM user_profiles WHERE friends_code = ?').get(code) as UserProfileRow | undefined;
  return row ? rowToProfile(row) : null;
}

export function addFriend(deviceId: string, friendDeviceId: string): boolean {
  const db = getDb();
  try {
    db.prepare('INSERT INTO friendships (device_id, friend_device_id, status) VALUES (?, ?, ?)')
      .run(deviceId, friendDeviceId, 'pending');
    return true;
  } catch {
    return false;
  }
}

export function acceptFriend(deviceId: string, friendDeviceId: string): boolean {
  const db = getDb();
  const result = db.prepare(`
    UPDATE friendships SET status = 'accepted'
    WHERE device_id = ? AND friend_device_id = ? AND status = 'pending'
  `).run(friendDeviceId, deviceId);

  if (result.changes > 0) {
    // Create reverse friendship
    try {
      db.prepare(`
        INSERT INTO friendships (device_id, friend_device_id, status) VALUES (?, ?, 'accepted')
        ON CONFLICT(device_id, friend_device_id) DO UPDATE SET status = 'accepted'
      `).run(deviceId, friendDeviceId);
    } catch { /* ignore */ }
    return true;
  }
  return false;
}

export function removeFriend(deviceId: string, friendDeviceId: string): void {
  const db = getDb();
  db.prepare('DELETE FROM friendships WHERE (device_id = ? AND friend_device_id = ?) OR (device_id = ? AND friend_device_id = ?)')
    .run(deviceId, friendDeviceId, friendDeviceId, deviceId);
}

export function getFriends(deviceId: string): readonly {
  readonly deviceId: string;
  readonly nickname: string;
  readonly avatar: number;
  readonly friendsCode: string | null;
  readonly status: string;
}[] {
  const db = getDb();
  return db.prepare(`
    SELECT
      CASE WHEN f.device_id = ? THEN f.friend_device_id ELSE f.device_id END as deviceId,
      u.nickname, u.avatar, u.friends_code as friendsCode, f.status
    FROM friendships f
    JOIN user_profiles u ON u.device_id = CASE WHEN f.device_id = ? THEN f.friend_device_id ELSE f.device_id END
    WHERE (f.device_id = ? OR f.friend_device_id = ?) AND f.status = 'accepted'
  `).all(deviceId, deviceId, deviceId, deviceId) as { deviceId: string; nickname: string; avatar: number; friendsCode: string | null; status: string }[];
}

export function getPendingFriendRequests(deviceId: string): readonly {
  readonly deviceId: string;
  readonly nickname: string;
  readonly avatar: number;
}[] {
  const db = getDb();
  return db.prepare(`
    SELECT f.device_id as deviceId, u.nickname, u.avatar
    FROM friendships f
    JOIN user_profiles u ON u.device_id = f.device_id
    WHERE f.friend_device_id = ? AND f.status = 'pending'
  `).all(deviceId) as { deviceId: string; nickname: string; avatar: number }[];
}

// ===== Typing Replays =====
export function saveReplay(data: {
  readonly deviceId: string;
  readonly nickname: string;
  readonly textContent: string;
  readonly replayData: readonly { timestamp: number; key: string; correct: boolean }[];
  readonly wpm: number;
  readonly accuracy: number;
  readonly durationMs: number;
}): number {
  const db = getDb();
  const result = db.prepare(`
    INSERT INTO typing_replays (device_id, nickname, text_content, replay_data, wpm, accuracy, duration_ms)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(data.deviceId, data.nickname, data.textContent, JSON.stringify(data.replayData), data.wpm, data.accuracy, data.durationMs);
  return Number(result.lastInsertRowid);
}

export function getReplay(replayId: number): {
  readonly id: number;
  readonly deviceId: string;
  readonly nickname: string;
  readonly textContent: string;
  readonly replayData: readonly { timestamp: number; key: string; correct: boolean }[];
  readonly wpm: number;
  readonly accuracy: number;
  readonly durationMs: number;
  readonly createdAt: string;
} | null {
  const db = getDb();
  const row = db.prepare(`
    SELECT id, device_id as deviceId, nickname, text_content as textContent, replay_data as replayData,
           wpm, accuracy, duration_ms as durationMs, created_at as createdAt
    FROM typing_replays WHERE id = ?
  `).get(replayId) as { id: number; deviceId: string; nickname: string; textContent: string; replayData: string; wpm: number; accuracy: number; durationMs: number; createdAt: string } | undefined;

  if (!row) return null;
  return { ...row, replayData: JSON.parse(row.replayData) };
}

export function getMyReplays(deviceId: string, limit = 20): readonly {
  readonly id: number;
  readonly textContent: string;
  readonly wpm: number;
  readonly accuracy: number;
  readonly durationMs: number;
  readonly createdAt: string;
}[] {
  const db = getDb();
  return db.prepare(`
    SELECT id, text_content as textContent, wpm, accuracy, duration_ms as durationMs, created_at as createdAt
    FROM typing_replays WHERE device_id = ?
    ORDER BY created_at DESC LIMIT ?
  `).all(deviceId, limit) as { id: number; textContent: string; wpm: number; accuracy: number; durationMs: number; createdAt: string }[];
}

// ===== Lesson Practice Counts =====
export function incrementLessonPracticeCount(lessonId: number): void {
  const db = getDb();
  db.prepare(`
    INSERT INTO lesson_practice_counts (lesson_id, practice_count) VALUES (?, 1)
    ON CONFLICT(lesson_id) DO UPDATE SET practice_count = practice_count + 1
  `).run(lessonId);
}

export function getAllLessonPracticeCounts(): Record<number, number> {
  const db = getDb();
  const rows = db.prepare('SELECT lesson_id, practice_count FROM lesson_practice_counts').all() as { lesson_id: number; practice_count: number }[];
  const result: Record<number, number> = {};
  for (const row of rows) {
    result[row.lesson_id] = row.practice_count;
  }
  return result;
}
