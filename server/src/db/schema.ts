import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, '..', '..', '..', 'data', 'typing-race.db');

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (db) return db;

  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  db.exec(`
    CREATE TABLE IF NOT EXISTS leaderboard (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      device_id TEXT,
      nickname TEXT NOT NULL,
      avatar INTEGER NOT NULL DEFAULT 0,
      wpm REAL NOT NULL,
      accuracy REAL NOT NULL,
      text_length INTEGER NOT NULL,
      mode TEXT NOT NULL CHECK (mode IN ('practice', 'multiplayer', 'lesson', 'test')),
      language TEXT NOT NULL DEFAULT 'en',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_leaderboard_wpm ON leaderboard(wpm DESC);
    CREATE INDEX IF NOT EXISTS idx_leaderboard_mode ON leaderboard(mode);
    CREATE INDEX IF NOT EXISTS idx_leaderboard_device ON leaderboard(device_id);

    CREATE TABLE IF NOT EXISTS match_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      room_id TEXT NOT NULL,
      device_id TEXT,
      nickname TEXT NOT NULL,
      avatar INTEGER NOT NULL DEFAULT 0,
      wpm REAL NOT NULL,
      accuracy REAL NOT NULL,
      rank INTEGER NOT NULL,
      player_count INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS user_profiles (
      device_id TEXT PRIMARY KEY,
      nickname TEXT NOT NULL,
      avatar INTEGER NOT NULL DEFAULT 0,
      settings TEXT NOT NULL DEFAULT '{}',
      lesson_progress TEXT NOT NULL DEFAULT '{}',
      badges TEXT NOT NULL DEFAULT '[]',
      total_typed INTEGER NOT NULL DEFAULT 0,
      total_time INTEGER NOT NULL DEFAULT 0,
      key_stats TEXT NOT NULL DEFAULT '{}',
      friends_code TEXT,
      streak_days INTEGER NOT NULL DEFAULT 0,
      last_active_date TEXT,
      theme TEXT NOT NULL DEFAULT 'light',
      keyboard_layout TEXT NOT NULL DEFAULT 'qwerty',
      custom_sounds TEXT NOT NULL DEFAULT '{}',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // New tables for extended features
  db.exec(`
    CREATE TABLE IF NOT EXISTS daily_stats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      device_id TEXT NOT NULL,
      date TEXT NOT NULL,
      chars INTEGER NOT NULL DEFAULT 0,
      wpm REAL NOT NULL DEFAULT 0,
      accuracy REAL NOT NULL DEFAULT 0,
      sessions INTEGER NOT NULL DEFAULT 0,
      time_ms INTEGER NOT NULL DEFAULT 0,
      UNIQUE(device_id, date)
    );
    CREATE INDEX IF NOT EXISTS idx_daily_stats_device_date ON daily_stats(device_id, date);

    CREATE TABLE IF NOT EXISTS key_error_stats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      device_id TEXT NOT NULL,
      key_char TEXT NOT NULL,
      correct INTEGER NOT NULL DEFAULT 0,
      incorrect INTEGER NOT NULL DEFAULT 0,
      UNIQUE(device_id, key_char)
    );
    CREATE INDEX IF NOT EXISTS idx_key_error_stats_device ON key_error_stats(device_id);

    CREATE TABLE IF NOT EXISTS custom_texts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      device_id TEXT NOT NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      language TEXT NOT NULL DEFAULT 'en',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_custom_texts_device ON custom_texts(device_id);

    CREATE TABLE IF NOT EXISTS daily_challenges (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL UNIQUE,
      text_content TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS daily_challenge_scores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      challenge_date TEXT NOT NULL,
      device_id TEXT NOT NULL,
      nickname TEXT NOT NULL DEFAULT '',
      avatar INTEGER NOT NULL DEFAULT 0,
      wpm REAL NOT NULL,
      accuracy REAL NOT NULL,
      time_ms INTEGER NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(challenge_date, device_id)
    );
    CREATE INDEX IF NOT EXISTS idx_challenge_scores_date ON daily_challenge_scores(challenge_date);

    CREATE TABLE IF NOT EXISTS friendships (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      device_id TEXT NOT NULL,
      friend_device_id TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'blocked')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(device_id, friend_device_id)
    );
    CREATE INDEX IF NOT EXISTS idx_friendships_device ON friendships(device_id);
    CREATE INDEX IF NOT EXISTS idx_friendships_friend ON friendships(friend_device_id);

    CREATE TABLE IF NOT EXISTS typing_replays (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      device_id TEXT NOT NULL,
      nickname TEXT NOT NULL DEFAULT '',
      text_content TEXT NOT NULL,
      replay_data TEXT NOT NULL DEFAULT '[]',
      wpm REAL NOT NULL DEFAULT 0,
      accuracy REAL NOT NULL DEFAULT 0,
      duration_ms INTEGER NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_replays_device ON typing_replays(device_id);

    CREATE TABLE IF NOT EXISTS lesson_practice_counts (
      lesson_id INTEGER PRIMARY KEY,
      practice_count INTEGER NOT NULL DEFAULT 0
    );
  `);

  // Add new columns to user_profiles if they don't exist (migration)
  const columns = db.prepare("PRAGMA table_info(user_profiles)").all() as { name: string }[];
  const columnNames = new Set(columns.map(c => c.name));
  const migrations: Record<string, string> = {
    friends_code: "ALTER TABLE user_profiles ADD COLUMN friends_code TEXT",
    streak_days: "ALTER TABLE user_profiles ADD COLUMN streak_days INTEGER NOT NULL DEFAULT 0",
    last_active_date: "ALTER TABLE user_profiles ADD COLUMN last_active_date TEXT",
    theme: "ALTER TABLE user_profiles ADD COLUMN theme TEXT NOT NULL DEFAULT 'light'",
    keyboard_layout: "ALTER TABLE user_profiles ADD COLUMN keyboard_layout TEXT NOT NULL DEFAULT 'qwerty'",
    custom_sounds: "ALTER TABLE user_profiles ADD COLUMN custom_sounds TEXT NOT NULL DEFAULT '{}'",
  };
  for (const [col, sql] of Object.entries(migrations)) {
    if (!columnNames.has(col)) {
      db.exec(sql);
    }
  }

  return db;
}

export function closeDb(): void {
  if (db) {
    db.close();
    db = null;
  }
}
