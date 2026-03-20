import { getDb } from './schema.js';
import type { LeaderboardEntry } from '../types.js';

interface DailyStatRow {
  readonly date: string;
  readonly chars: number;
  readonly wpm: number;
  readonly accuracy: number;
  readonly sessions: number;
  readonly timeMs: number;
}

interface KeyStatRow {
  readonly keyChar: string;
  readonly correct: number;
  readonly incorrect: number;
}

interface CustomTextEntry {
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

interface CustomTextRow {
  readonly id: number;
  readonly title: string;
  readonly content: string;
  readonly language: string;
  readonly collectionName: string;
  readonly tags: string;
  readonly isFavorite: number;
  readonly useCount: number;
  readonly lastUsedAt: string | null;
  readonly createdAt: string;
}

function safeJsonParse<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function average(values: readonly number[]): number {
  return values.length > 0 ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

function stdDev(values: readonly number[]): number {
  if (values.length <= 1) return 0;
  const avg = average(values);
  const variance = average(values.map(value => (value - avg) ** 2));
  return Math.sqrt(variance);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function toIsoDate(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

function customTextRowToEntry(row: CustomTextRow): CustomTextEntry {
  return {
    ...row,
    tags: safeJsonParse<readonly string[]>(row.tags, []),
    isFavorite: Boolean(row.isFavorite),
  };
}

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
  } else if (!row.friends_code) {
    const friendsCode = generateFriendsCode();
    db.prepare('UPDATE user_profiles SET friends_code = ? WHERE device_id = ?').run(friendsCode, deviceId);
    row = { ...row, friends_code: friendsCode };
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
  readonly collectionName?: string;
  readonly tags?: readonly string[];
  readonly isFavorite?: boolean;
}): number {
  const db = getDb();
  const result = db.prepare(`
    INSERT INTO custom_texts (device_id, title, content, language, collection_name, tags, is_favorite)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    deviceId,
    data.title,
    data.content,
    data.language ?? 'en',
    data.collectionName?.trim() || 'My Library',
    JSON.stringify(data.tags ?? []),
    data.isFavorite ? 1 : 0
  );
  return Number(result.lastInsertRowid);
}

export function getCustomTexts(deviceId: string): readonly {
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
}[] {
  const db = getDb();
  const rows = db.prepare(`
    SELECT id, title, content, language, collection_name as collectionName, tags,
           is_favorite as isFavorite, use_count as useCount, last_used_at as lastUsedAt,
           created_at as createdAt
    FROM custom_texts
    WHERE device_id = ?
    ORDER BY is_favorite DESC, COALESCE(last_used_at, created_at) DESC, created_at DESC
  `).all(deviceId) as CustomTextRow[];
  return rows.map(customTextRowToEntry);
}

export function deleteCustomText(deviceId: string, textId: number): boolean {
  const db = getDb();
  const result = db.prepare('DELETE FROM custom_texts WHERE id = ? AND device_id = ?').run(textId, deviceId);
  return result.changes > 0;
}

export function updateCustomText(deviceId: string, textId: number, updates: {
  readonly title?: string;
  readonly content?: string;
  readonly language?: string;
  readonly collectionName?: string;
  readonly tags?: readonly string[];
  readonly isFavorite?: boolean;
}): boolean {
  const db = getDb();
  const current = db.prepare(`
    SELECT id, title, content, language, collection_name as collectionName, tags,
           is_favorite as isFavorite, use_count as useCount, last_used_at as lastUsedAt,
           created_at as createdAt
    FROM custom_texts
    WHERE id = ? AND device_id = ?
  `).get(textId, deviceId) as CustomTextRow | undefined;
  if (!current) return false;

  const result = db.prepare(`
    UPDATE custom_texts
    SET title = ?, content = ?, language = ?, collection_name = ?, tags = ?, is_favorite = ?
    WHERE id = ? AND device_id = ?
  `).run(
    updates.title?.trim() || current.title,
    updates.content ?? current.content,
    updates.language ?? current.language,
    updates.collectionName?.trim() || current.collectionName,
    JSON.stringify(updates.tags ?? safeJsonParse<readonly string[]>(current.tags, [])),
    updates.isFavorite == null ? current.isFavorite : (updates.isFavorite ? 1 : 0),
    textId,
    deviceId
  );
  return result.changes > 0;
}

export function markCustomTextUsed(deviceId: string, textId: number): boolean {
  const db = getDb();
  const result = db.prepare(`
    UPDATE custom_texts
    SET use_count = use_count + 1, last_used_at = CURRENT_TIMESTAMP
    WHERE id = ? AND device_id = ?
  `).run(textId, deviceId);
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

// ===== Game Scores =====
export function submitGameScore(data: {
  readonly deviceId: string;
  readonly nickname: string;
  readonly avatar: number;
  readonly gameId: string;
  readonly score: number;
  readonly difficulty: string;
}): number {
  const db = getDb();
  const result = db.prepare(`
    INSERT INTO game_scores (device_id, nickname, avatar, game_id, score, difficulty)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(data.deviceId, data.nickname, data.avatar, data.gameId, data.score, data.difficulty);
  return result.lastInsertRowid as number;
}

export function getGameLeaderboard(gameId: string, limit = 20): readonly {
  readonly nickname: string;
  readonly avatar: number;
  readonly score: number;
  readonly difficulty: string;
  readonly deviceId: string;
  readonly createdAt: string;
}[] {
  const db = getDb();
  return db.prepare(`
    SELECT nickname, avatar, score, difficulty, device_id as deviceId, created_at as createdAt
    FROM game_scores
    WHERE game_id = ?
    ORDER BY score DESC
    LIMIT ?
  `).all(gameId, limit) as { nickname: string; avatar: number; score: number; difficulty: string; deviceId: string; createdAt: string }[];
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

function getModeBreakdown(deviceId: string): readonly {
  readonly mode: string;
  readonly sessions: number;
  readonly avgWpm: number;
  readonly avgAccuracy: number;
}[] {
  const db = getDb();
  return db.prepare(`
    SELECT mode, COUNT(*) as sessions, ROUND(AVG(wpm), 1) as avgWpm, ROUND(AVG(accuracy), 1) as avgAccuracy
    FROM leaderboard
    WHERE device_id = ? AND created_at >= datetime('now', '-30 days')
    GROUP BY mode
    ORDER BY sessions DESC
  `).all(deviceId) as {
    mode: string;
    sessions: number;
    avgWpm: number;
    avgAccuracy: number;
  }[];
}

function getBestHour(deviceId: string): { readonly hour: number; readonly avgWpm: number } | null {
  const db = getDb();
  const row = db.prepare(`
    SELECT CAST(strftime('%H', created_at) AS INTEGER) as hour, ROUND(AVG(wpm), 1) as avgWpm
    FROM leaderboard
    WHERE device_id = ?
    GROUP BY hour
    HAVING COUNT(*) >= 2
    ORDER BY avgWpm DESC
    LIMIT 1
  `).get(deviceId) as { hour: number; avgWpm: number } | undefined;
  return row ?? null;
}

function getSeasonRows(): {
  readonly deviceId: string;
  readonly nickname: string;
  readonly avatar: number;
  readonly matches: number;
  readonly wins: number;
  readonly podiums: number;
  readonly avgWpm: number;
  readonly avgAccuracy: number;
  readonly rating: number;
}[] {
  const db = getDb();
  return db.prepare(`
    SELECT
      device_id as deviceId,
      MAX(nickname) as nickname,
      MAX(avatar) as avatar,
      COUNT(*) as matches,
      SUM(CASE WHEN rank = 1 THEN 1 ELSE 0 END) as wins,
      SUM(CASE WHEN rank <= 3 THEN 1 ELSE 0 END) as podiums,
      ROUND(AVG(wpm), 1) as avgWpm,
      ROUND(AVG(accuracy), 1) as avgAccuracy,
      CAST(
        SUM(
          CASE
            WHEN rank = 1 THEN 28
            WHEN rank = 2 THEN 20
            WHEN rank = 3 THEN 15
            ELSE MAX(8 - rank, 1)
          END
        ) + AVG(wpm) + AVG(accuracy) / 4 AS INTEGER
      ) as rating
    FROM match_history
    WHERE device_id IS NOT NULL AND created_at >= datetime('now', '-30 days')
    GROUP BY device_id
    ORDER BY rating DESC, avgWpm DESC
  `).all() as {
    deviceId: string;
    nickname: string;
    avatar: number;
    matches: number;
    wins: number;
    podiums: number;
    avgWpm: number;
    avgAccuracy: number;
    rating: number;
  }[];
}

function getTierFromRating(rating: number): 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Diamond' {
  if (rating >= 540) return 'Diamond';
  if (rating >= 380) return 'Platinum';
  if (rating >= 250) return 'Gold';
  if (rating >= 140) return 'Silver';
  return 'Bronze';
}

export function getAdaptiveRecommendations(deviceId: string): {
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
} {
  const daily = getDailyStats(deviceId, 14);
  const keys = getKeyErrorStats(deviceId);
  const history = getPlayerHistory(deviceId, 20);
  const stats = getPlayerStats(deviceId);
  const recentAccuracy = average(history.slice(0, 8).map(entry => entry.accuracy));
  const recentWpm = average(history.slice(0, 8).map(entry => entry.wpm));
  const weeklySessions = daily.slice(-7).reduce((sum, item) => sum + item.sessions, 0);
  const weakKeys = keys
    .filter(key => key.correct + key.incorrect >= 5)
    .sort((a, b) => (b.incorrect / Math.max(b.correct + b.incorrect, 1)) - (a.incorrect / Math.max(a.correct + a.incorrect, 1)))
    .slice(0, 4)
    .map(key => key.keyChar);

  const suggestedDifficulty = recentWpm >= 65 && recentAccuracy >= 95
    ? 'hard'
    : recentWpm >= 35 && recentAccuracy >= 90
      ? 'medium'
      : 'easy';

  let priority: 'accuracy' | 'speed' | 'stamina' | 'competition' = 'speed';
  if (recentAccuracy > 0 && recentAccuracy < 92) priority = 'accuracy';
  else if (weeklySessions < 4) priority = 'stamina';
  else if (stats.wins < 5 && recentWpm >= 35) priority = 'competition';

  const recommendedMode = priority === 'accuracy'
    ? 'lessons'
    : priority === 'competition'
      ? 'multiplayer'
      : weakKeys.some(key => /[{}\[\]();,./]/.test(key))
        ? 'code'
        : weeklySessions >= 5
          ? 'daily'
          : 'practice';

  const targetWpm = Math.max(20, Math.round((recentWpm || stats.bestWpm || 20) + (priority === 'speed' ? 8 : 4)));
  const targetAccuracy = Math.min(99, Math.round(Math.max(recentAccuracy || stats.avgAccuracy || 88, 88) + (priority === 'accuracy' ? 4 : 2)));
  const targetSessions = Math.max(3, weeklySessions < 4 ? 6 : 4);

  const drills = [
    {
      id: 'warmup',
      title: priority === 'accuracy' ? 'Precision Warmup' : 'Speed Builder',
      description: priority === 'accuracy'
        ? `Run 3 short sessions and keep accuracy above ${targetAccuracy}%.`
        : `Push two short bursts above ${targetWpm} WPM before switching mode.`,
      path: '/practice',
    },
    {
      id: 'focus',
      title: weakKeys.length > 0 ? `Focus Keys: ${weakKeys.join(' ')}` : 'Technique Refresh',
      description: weakKeys.length > 0
        ? 'Use lessons or custom text drills that repeat your weakest keys.'
        : 'Review a lesson set and stabilize finger travel before adding speed.',
      path: '/lessons',
    },
    {
      id: 'pressure',
      title: priority === 'competition' ? 'Queue Into Ranked Pressure' : 'Daily Pressure Test',
      description: priority === 'competition'
        ? 'Play one multiplayer race and compare your opening pace with your practice speed.'
        : 'Use a single high-focus challenge to lock in today’s form.',
      path: priority === 'competition' ? '/multiplayer' : '/daily',
    },
  ] as const;

  return {
    priority,
    suggestedDifficulty,
    recommendedMode,
    focusKeys: weakKeys,
    targetWpm,
    targetAccuracy,
    targetSessions,
    drills,
  };
}

export function getDashboardInsights(deviceId: string): {
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
  readonly coach: ReturnType<typeof getAdaptiveRecommendations>;
} {
  const daily = getDailyStats(deviceId, 14);
  const recentWindow = daily.slice(-7);
  const previousWindow = daily.slice(-14, -7);
  const recentWpms = recentWindow.map(item => item.wpm).filter(Boolean);
  const recentAccuracies = recentWindow.map(item => item.accuracy).filter(Boolean);
  const modeBreakdown = getModeBreakdown(deviceId);
  const weeklySessions = recentWindow.reduce((sum, item) => sum + item.sessions, 0);
  const weeklyChars = recentWindow.reduce((sum, item) => sum + item.chars, 0);
  const weeklyMinutes = Math.round(recentWindow.reduce((sum, item) => sum + item.timeMs, 0) / 60000);
  const wpmTrend = Number((average(recentWindow.map(item => item.wpm)) - average(previousWindow.map(item => item.wpm))).toFixed(1));
  const accuracyTrend = Number((average(recentWindow.map(item => item.accuracy)) - average(previousWindow.map(item => item.accuracy))).toFixed(1));
  const consistencyScore = Math.round(clamp(100 - stdDev(recentWpms) * 2.2 - Math.max(0, 94 - average(recentAccuracies)), 42, 99));

  return {
    consistencyScore,
    weeklySessions,
    weeklyChars,
    weeklyMinutes,
    wpmTrend,
    accuracyTrend,
    bestHour: getBestHour(deviceId),
    modeBreakdown,
    coach: getAdaptiveRecommendations(deviceId),
  };
}

export function getSeasonOverview(deviceId: string): {
  readonly player: {
    readonly rank: number | null;
    readonly rating: number;
    readonly tier: string;
    readonly matches: number;
    readonly wins: number;
    readonly podiums: number;
    readonly avgWpm: number;
    readonly avgAccuracy: number;
    readonly winRate: number;
  };
  readonly leaderboard: readonly {
    readonly rank: number;
    readonly deviceId: string;
    readonly nickname: string;
    readonly avatar: number;
    readonly rating: number;
    readonly wins: number;
    readonly avgWpm: number;
    readonly tier: string;
  }[];
  readonly recentOpponents: readonly {
    readonly deviceId: string;
    readonly nickname: string;
    readonly avatar: number;
    readonly races: number;
    readonly lastSeen: string;
  }[];
  readonly friendLadder: readonly {
    readonly deviceId: string;
    readonly nickname: string;
    readonly avatar: number;
    readonly rating: number;
    readonly tier: string;
  }[];
} {
  const db = getDb();
  const seasonRows = getSeasonRows();
  const playerIndex = seasonRows.findIndex(row => row.deviceId === deviceId);
  const playerRow = playerIndex >= 0
    ? seasonRows[playerIndex]
    : { deviceId, nickname: 'You', avatar: 0, matches: 0, wins: 0, podiums: 0, avgWpm: 0, avgAccuracy: 0, rating: 0 };

  const leaderboard = seasonRows.slice(0, 10).map((row, index) => ({
    rank: index + 1,
    deviceId: row.deviceId,
    nickname: row.nickname,
    avatar: row.avatar,
    rating: row.rating,
    wins: row.wins,
    avgWpm: row.avgWpm,
    tier: getTierFromRating(row.rating),
  }));

  const recentOpponents = db.prepare(`
    SELECT other.device_id as deviceId, MAX(other.nickname) as nickname, MAX(other.avatar) as avatar,
           COUNT(*) as races, MAX(other.created_at) as lastSeen
    FROM match_history self
    JOIN match_history other
      ON self.room_id = other.room_id
     AND other.device_id IS NOT NULL
     AND other.device_id != self.device_id
    WHERE self.device_id = ? AND self.created_at >= datetime('now', '-30 days')
    GROUP BY other.device_id
    ORDER BY lastSeen DESC
    LIMIT 5
  `).all(deviceId) as {
    deviceId: string;
    nickname: string;
    avatar: number;
    races: number;
    lastSeen: string;
  }[];

  const friendIds = new Set(getFriends(deviceId).map(friend => friend.deviceId));
  const friendLadder = seasonRows
    .filter(row => friendIds.has(row.deviceId))
    .slice(0, 5)
    .map(row => ({
      deviceId: row.deviceId,
      nickname: row.nickname,
      avatar: row.avatar,
      rating: row.rating,
      tier: getTierFromRating(row.rating),
    }));

  return {
    player: {
      rank: playerIndex >= 0 ? playerIndex + 1 : null,
      rating: playerRow.rating,
      tier: getTierFromRating(playerRow.rating),
      matches: playerRow.matches,
      wins: playerRow.wins,
      podiums: playerRow.podiums,
      avgWpm: playerRow.avgWpm,
      avgAccuracy: playerRow.avgAccuracy,
      winRate: playerRow.matches > 0 ? Math.round((playerRow.wins / playerRow.matches) * 100) : 0,
    },
    leaderboard,
    recentOpponents,
    friendLadder,
  };
}

export function getReplayAnalysis(replayId: number): {
  readonly totalErrors: number;
  readonly correctionBursts: number;
  readonly longestPerfectStreak: number;
  readonly averageIntervalMs: number;
  readonly consistencyScore: number;
  readonly hardestSnippet: string;
  readonly mistakeHotspots: readonly { readonly char: string; readonly errors: number }[];
  readonly benchmark: {
    readonly replayId: number;
    readonly wpm: number;
    readonly accuracy: number;
    readonly deltaWpm: number;
    readonly deltaAccuracy: number;
  } | null;
} | null {
  const db = getDb();
  const replay = getReplay(replayId);
  if (!replay) return null;

  let cursor = 0;
  let currentPerfectStreak = 0;
  let longestPerfectStreak = 0;
  let correctionBursts = 0;
  let inBurst = false;
  const errorPositions: number[] = [];
  const mistakeCounts = new Map<string, number>();
  const keyTimestamps = replay.replayData
    .filter(event => event.key === 'Backspace' || event.key.length === 1)
    .map(event => event.timestamp);

  for (const event of replay.replayData) {
    if (event.key === 'Backspace') {
      cursor = Math.max(0, cursor - 1);
      currentPerfectStreak = 0;
      inBurst = false;
      continue;
    }
    if (event.key.length !== 1) {
      continue;
    }
    if (!event.correct) {
      const expected = replay.textContent[cursor] ?? event.key;
      mistakeCounts.set(expected, (mistakeCounts.get(expected) ?? 0) + 1);
      errorPositions.push(cursor);
      currentPerfectStreak = 0;
      if (!inBurst) {
        correctionBursts += 1;
        inBurst = true;
      }
    } else {
      currentPerfectStreak += 1;
      longestPerfectStreak = Math.max(longestPerfectStreak, currentPerfectStreak);
      inBurst = false;
    }
    cursor += 1;
  }

  const intervals = keyTimestamps.slice(1).map((timestamp, index) => timestamp - keyTimestamps[index]);
  const averageIntervalMs = Math.round(average(intervals));
  const hardestCenter = errorPositions[Math.floor(errorPositions.length / 2)] ?? Math.min(12, replay.textContent.length / 2);
  const hardestSnippet = replay.textContent.slice(Math.max(0, hardestCenter - 12), Math.min(replay.textContent.length, hardestCenter + 18)).trim();
  const mistakeHotspots = [...mistakeCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([char, errors]) => ({ char, errors }));

  const consistencyScore = Math.round(clamp(
    100 - stdDev(intervals) / 12 - correctionBursts * 4 - Math.max(0, 96 - replay.accuracy),
    28,
    99
  ));

  const benchmarkRow = db.prepare(`
    SELECT id, wpm, accuracy
    FROM typing_replays
    WHERE device_id = ? AND id != ?
    ORDER BY wpm DESC, accuracy DESC, duration_ms ASC
    LIMIT 1
  `).get(replay.deviceId, replay.id) as { id: number; wpm: number; accuracy: number } | undefined;

  return {
    totalErrors: replay.replayData.filter(event => event.key.length === 1 && !event.correct).length,
    correctionBursts,
    longestPerfectStreak,
    averageIntervalMs,
    consistencyScore,
    hardestSnippet,
    mistakeHotspots,
    benchmark: benchmarkRow ? {
      replayId: benchmarkRow.id,
      wpm: benchmarkRow.wpm,
      accuracy: benchmarkRow.accuracy,
      deltaWpm: Number((replay.wpm - benchmarkRow.wpm).toFixed(1)),
      deltaAccuracy: Number((replay.accuracy - benchmarkRow.accuracy).toFixed(1)),
    } : null,
  };
}

export function getGrowthOverview(deviceId: string): {
  readonly streakDays: number;
  readonly totalSessions: number;
  readonly totalChars: number;
  readonly totalReplays: number;
  readonly rewardLevel: number;
  readonly unlockedRewards: readonly {
    readonly id: string;
    readonly name: string;
    readonly unlocked: boolean;
  }[];
  readonly missions: readonly {
    readonly id: string;
    readonly title: string;
    readonly progress: number;
    readonly target: number;
    readonly reward: string;
    readonly completed: boolean;
  }[];
} {
  const db = getDb();
  const profile = getOrCreateProfile(deviceId);
  const totals = db.prepare(`
    SELECT
      (SELECT COUNT(*) FROM leaderboard WHERE device_id = ?) as totalSessions,
      (SELECT COALESCE(SUM(text_length), 0) FROM leaderboard WHERE device_id = ?) as totalChars,
      (SELECT COUNT(*) FROM typing_replays WHERE device_id = ?) as totalReplays,
      (SELECT COUNT(*) FROM game_scores WHERE device_id = ?) as totalGameRuns,
      (SELECT COUNT(*) FROM leaderboard WHERE device_id = ? AND created_at >= datetime('now', 'start of day')) as todaySessions,
      (SELECT COUNT(*) FROM typing_replays WHERE device_id = ? AND created_at >= datetime('now', 'start of day')) as todayReplays,
      (SELECT COUNT(*) FROM game_scores WHERE device_id = ? AND created_at >= datetime('now', 'start of day')) as todayGameRuns,
      (SELECT COUNT(*) FROM match_history WHERE device_id = ? AND created_at >= datetime('now', 'start of day')) as todayRaces,
      (SELECT COUNT(*) FROM custom_texts WHERE device_id = ?) as librarySize
  `).get(deviceId, deviceId, deviceId, deviceId, deviceId, deviceId, deviceId, deviceId, deviceId) as {
    totalSessions: number;
    totalChars: number;
    totalReplays: number;
    totalGameRuns: number;
    todaySessions: number;
    todayReplays: number;
    todayGameRuns: number;
    todayRaces: number;
    librarySize: number;
  };

  const rewardLevel = 1 + Math.floor((totals.totalSessions + totals.totalGameRuns + profile.streakDays * 2) / 12);
  const unlockedRewards = [
    { id: 'frame-bronze', name: 'Bronze Frame', unlocked: totals.totalSessions >= 5 },
    { id: 'title-streak', name: 'Streak Title', unlocked: profile.streakDays >= 7 },
    { id: 'avatar-lab', name: 'Replay Analyst Badge', unlocked: totals.totalReplays >= 3 },
    { id: 'library-keeper', name: 'Library Keeper Theme', unlocked: totals.librarySize >= 5 },
    { id: 'arcade-aura', name: 'Arcade Aura Trail', unlocked: totals.totalGameRuns >= 10 },
  ] as const;

  const missions = [
    { id: 'warmup', title: 'Warm up with two focused sessions', progress: totals.todaySessions, target: 2, reward: '+25 XP' },
    { id: 'replay-lab', title: 'Save one replay for review', progress: totals.todayReplays, target: 1, reward: 'Replay token' },
    { id: 'arcade-loop', title: 'Play two typing games', progress: totals.todayGameRuns, target: 2, reward: 'Arcade aura' },
    { id: 'social-race', title: 'Race one multiplayer match', progress: totals.todayRaces, target: 1, reward: 'Season boost' },
  ].map(mission => ({
    ...mission,
    completed: mission.progress >= mission.target,
  }));

  return {
    streakDays: profile.streakDays,
    totalSessions: totals.totalSessions,
    totalChars: totals.totalChars,
    totalReplays: totals.totalReplays,
    rewardLevel,
    unlockedRewards,
    missions,
  };
}

export function getGameMeta(deviceId: string): {
  readonly level: number;
  readonly totalRuns: number;
  readonly uniqueGames: number;
  readonly passportProgress: number;
  readonly topGames: readonly {
    readonly gameId: string;
    readonly plays: number;
    readonly bestScore: number;
    readonly avgScore: number;
    readonly lastPlayed: string;
  }[];
  readonly missions: readonly {
    readonly id: string;
    readonly title: string;
    readonly progress: number;
    readonly target: number;
    readonly completed: boolean;
  }[];
} {
  const db = getDb();
  const games = db.prepare(`
    SELECT game_id as gameId, COUNT(*) as plays, MAX(score) as bestScore, ROUND(AVG(score), 1) as avgScore,
           MAX(created_at) as lastPlayed
    FROM game_scores
    WHERE device_id = ?
    GROUP BY game_id
    ORDER BY plays DESC, bestScore DESC
  `).all(deviceId) as {
    gameId: string;
    plays: number;
    bestScore: number;
    avgScore: number;
    lastPlayed: string;
  }[];

  const totalRuns = games.reduce((sum, game) => sum + game.plays, 0);
  const uniqueGames = games.length;
  const totalGameCount = 13;
  const level = 1 + Math.floor((totalRuns + uniqueGames * 2) / 6);
  const missions = [
    { id: 'variety', title: 'Try 5 different games', progress: uniqueGames, target: 5 },
    { id: 'grind', title: 'Finish 12 game runs', progress: totalRuns, target: 12 },
    { id: 'score', title: 'Break 3 personal bests', progress: games.filter(game => game.bestScore > 0).length, target: 3 },
  ].map(mission => ({
    ...mission,
    completed: mission.progress >= mission.target,
  }));

  return {
    level,
    totalRuns,
    uniqueGames,
    passportProgress: Math.round((uniqueGames / totalGameCount) * 100),
    topGames: games.slice(0, 6),
    missions,
  };
}
