import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { setupSocketHandlers, getOnlineUsers } from './socket/handlers.js';
import { getDb } from './db/schema.js';
import {
  getLeaderboard, getPlayerStats, getPlayerHistory,
  getOrCreateProfile, updateProfile, addLeaderboardEntry,
  upsertDailyStats, getDailyStats, upsertKeyErrorStats, getKeyErrorStats,
  createCustomText, getCustomTexts, deleteCustomText,
  getOrCreateDailyChallenge, submitDailyChallengeScore, getDailyChallengeLeaderboard,
  findProfileByFriendsCode, addFriend, acceptFriend, removeFriend, getFriends, getPendingFriendRequests,
  saveReplay, getReplay, getMyReplays,
  incrementLessonPracticeCount, getAllLessonPracticeCounts,
} from './db/queries.js';
import { passages, getRandomPassage } from './texts/passages.js';
import { CODE_TEXTS, getCodeTexts } from './texts/codeTexts.js';
import {
  getOAuthConfig, isGoogleConfigured, isGithubConfigured,
  getGoogleAuthUrl, getGithubAuthUrl,
  exchangeGoogleCode, exchangeGithubCode,
} from './auth/oauth.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3001;
const isProduction = process.env.NODE_ENV === 'production';

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: isProduction ? false : ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000'],
    methods: ['GET', 'POST'],
  },
});

app.use(cors());
app.use(express.json());

// Initialize database
getDb();

// ===== Text API =====
app.get('/api/texts', (req, res) => {
  const language = req.query.language as 'en' | 'zh' | undefined;
  const filtered = language ? passages.filter(p => p.language === language) : passages;
  res.json(filtered);
});

app.get('/api/texts/random', (req, res) => {
  const difficulty = req.query.difficulty as 'easy' | 'medium' | 'hard' | undefined;
  const language = req.query.language as 'en' | 'zh' | undefined;
  const text = getRandomPassage(difficulty, language);
  res.json(text);
});

// ===== Leaderboard API =====
app.get('/api/leaderboard', (req, res) => {
  const mode = req.query.mode as string | undefined;
  const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
  const entries = getLeaderboard(mode, limit);
  res.json(entries);
});

// ===== User Profile API (device-bound) =====
app.get('/api/profile/:deviceId', (req, res) => {
  const deviceId = req.params.deviceId;
  if (!deviceId || deviceId.length < 8) {
    res.status(400).json({ error: 'Invalid device ID' });
    return;
  }
  const profile = getOrCreateProfile(deviceId);
  res.json(profile);
});

app.put('/api/profile/:deviceId', (req, res) => {
  const deviceId = req.params.deviceId;
  if (!deviceId || deviceId.length < 8) {
    res.status(400).json({ error: 'Invalid device ID' });
    return;
  }
  const profile = updateProfile(deviceId, req.body);
  res.json(profile);
});

// ===== Stats API =====
app.get('/api/stats/:deviceId', (req, res) => {
  const stats = getPlayerStats(req.params.deviceId);
  res.json(stats);
});

app.get('/api/history/:deviceId', (req, res) => {
  const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
  const history = getPlayerHistory(req.params.deviceId, limit);
  res.json(history);
});

// ===== Score submission =====
app.post('/api/score', (req, res) => {
  const { deviceId, nickname, avatar, wpm, accuracy, textLength, mode, language } = req.body;
  if (!nickname || !wpm || !mode) {
    res.status(400).json({ error: 'Missing fields' });
    return;
  }
  addLeaderboardEntry({
    deviceId, nickname,
    avatar: avatar ?? 0,
    wpm: Math.round(wpm * 10) / 10,
    accuracy: Math.round(accuracy * 10) / 10,
    textLength: textLength ?? 0,
    mode,
    language: language ?? 'en',
  });
  res.json({ success: true });
});

// ===== Daily Stats API =====
app.get('/api/stats/:deviceId/daily', (req, res) => {
  const days = Math.min(parseInt(req.query.days as string) || 30, 365);
  const stats = getDailyStats(req.params.deviceId, days);
  res.json(stats);
});

app.get('/api/stats/:deviceId/keys', (req, res) => {
  const stats = getKeyErrorStats(req.params.deviceId);
  res.json(stats);
});

app.post('/api/stats/:deviceId/session', (req, res) => {
  const { chars, wpm, accuracy, timeMs, keyStats } = req.body;
  if (chars === undefined || wpm === undefined) {
    res.status(400).json({ error: 'Missing fields' });
    return;
  }
  upsertDailyStats(req.params.deviceId, { chars, wpm, accuracy, timeMs: timeMs ?? 0 });
  if (keyStats && typeof keyStats === 'object') {
    upsertKeyErrorStats(req.params.deviceId, keyStats);
  }
  res.json({ success: true });
});

// ===== Custom Texts API =====
app.get('/api/custom-texts/:deviceId', (req, res) => {
  const texts = getCustomTexts(req.params.deviceId);
  res.json(texts);
});

app.post('/api/custom-texts/:deviceId', (req, res) => {
  const { title, content, language } = req.body;
  if (!title || !content) {
    res.status(400).json({ error: 'Missing title or content' });
    return;
  }
  const id = createCustomText(req.params.deviceId, { title, content: content.slice(0, 5000), language });
  res.json({ id });
});

app.delete('/api/custom-texts/:deviceId/:textId', (req, res) => {
  const ok = deleteCustomText(req.params.deviceId, parseInt(req.params.textId));
  res.json({ success: ok });
});

// ===== Daily Challenge API =====
app.get('/api/daily-challenge', (_req, res) => {
  const challenge = getOrCreateDailyChallenge();
  res.json(challenge);
});

app.post('/api/daily-challenge/score', (req, res) => {
  const { deviceId, nickname, avatar, wpm, accuracy, timeMs } = req.body;
  if (!deviceId || !wpm) {
    res.status(400).json({ error: 'Missing fields' });
    return;
  }
  const today = new Date().toISOString().slice(0, 10);
  submitDailyChallengeScore({
    challengeDate: today,
    deviceId,
    nickname: nickname ?? 'Anonymous',
    avatar: avatar ?? 0,
    wpm: Math.round(wpm * 10) / 10,
    accuracy: Math.round(accuracy * 10) / 10,
    timeMs: timeMs ?? 0,
  });
  res.json({ success: true });
});

app.get('/api/daily-challenge/leaderboard', (req, res) => {
  const date = req.query.date as string | undefined;
  const leaderboard = getDailyChallengeLeaderboard(date);
  res.json(leaderboard);
});

// ===== Friends API =====
app.get('/api/friends/:deviceId', (req, res) => {
  const friends = getFriends(req.params.deviceId);
  res.json(friends);
});

app.get('/api/friends/:deviceId/pending', (req, res) => {
  const pending = getPendingFriendRequests(req.params.deviceId);
  res.json(pending);
});

app.post('/api/friends/:deviceId/add', (req, res) => {
  const { friendsCode } = req.body;
  if (!friendsCode) {
    res.status(400).json({ error: 'Missing friends code' });
    return;
  }
  const friendProfile = findProfileByFriendsCode(friendsCode);
  if (!friendProfile) {
    res.status(404).json({ error: 'Friend not found' });
    return;
  }
  if (friendProfile.deviceId === req.params.deviceId) {
    res.status(400).json({ error: 'Cannot add yourself' });
    return;
  }
  const ok = addFriend(req.params.deviceId, friendProfile.deviceId);
  res.json({ success: ok, friend: { deviceId: friendProfile.deviceId, nickname: friendProfile.nickname, avatar: friendProfile.avatar } });
});

app.post('/api/friends/:deviceId/accept', (req, res) => {
  const { friendDeviceId } = req.body;
  if (!friendDeviceId) {
    res.status(400).json({ error: 'Missing friend device ID' });
    return;
  }
  const ok = acceptFriend(req.params.deviceId, friendDeviceId);
  res.json({ success: ok });
});

app.post('/api/friends/:deviceId/remove', (req, res) => {
  const { friendDeviceId } = req.body;
  if (!friendDeviceId) {
    res.status(400).json({ error: 'Missing friend device ID' });
    return;
  }
  removeFriend(req.params.deviceId, friendDeviceId);
  res.json({ success: true });
});

// ===== Replays API =====
app.get('/api/replays/:deviceId', (req, res) => {
  const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
  const replays = getMyReplays(req.params.deviceId, limit);
  res.json(replays);
});

app.get('/api/replays/view/:replayId', (req, res) => {
  const replay = getReplay(parseInt(req.params.replayId));
  if (!replay) {
    res.status(404).json({ error: 'Replay not found' });
    return;
  }
  res.json(replay);
});

app.post('/api/replays', (req, res) => {
  const { deviceId, nickname, textContent, replayData, wpm, accuracy, durationMs } = req.body;
  if (!deviceId || !textContent || !replayData) {
    res.status(400).json({ error: 'Missing fields' });
    return;
  }
  const id = saveReplay({
    deviceId,
    nickname: nickname ?? 'Anonymous',
    textContent,
    replayData,
    wpm: wpm ?? 0,
    accuracy: accuracy ?? 0,
    durationMs: durationMs ?? 0,
  });
  res.json({ id });
});

// ===== Code Texts API =====
app.get('/api/texts/code', (req, res) => {
  const language = req.query.language as string | undefined;
  const texts = getCodeTexts(language);
  res.json(texts);
});

// ===== Online Count API =====
app.get('/api/online-count', (_req, res) => {
  const count = getOnlineUsers().size;
  res.json({ count });
});

// ===== Lesson Practice Counts API =====
app.get('/api/lesson-counts', (_req, res) => {
  const counts = getAllLessonPracticeCounts();
  res.json(counts);
});

app.post('/api/lesson-counts/:lessonId', (req, res) => {
  const lessonId = parseInt(req.params.lessonId);
  if (isNaN(lessonId) || lessonId < 1) {
    res.status(400).json({ error: 'Invalid lesson ID' });
    return;
  }
  incrementLessonPracticeCount(lessonId);
  res.json({ success: true });
});

// ===== OAuth Status =====
app.get('/api/auth/config', (_req, res) => {
  res.json({
    google: isGoogleConfigured(),
    github: isGithubConfigured(),
  });
});

// ===== Google OAuth =====
app.get('/auth/google', (req, res) => {
  if (!isGoogleConfigured()) {
    res.status(503).json({ error: 'Google OAuth not configured' });
    return;
  }
  const deviceId = (req.query.device_id as string) || '';
  const state = Buffer.from(JSON.stringify({ deviceId })).toString('base64url');
  res.redirect(getGoogleAuthUrl(state));
});

app.get('/auth/google/callback', async (req, res) => {
  const code = req.query.code as string;
  const stateRaw = req.query.state as string;
  if (!code) { res.status(400).send('Missing code'); return; }

  let deviceId = '';
  try {
    const stateData = JSON.parse(Buffer.from(stateRaw, 'base64url').toString());
    deviceId = stateData.deviceId || '';
  } catch { /* ignore */ }

  const user = await exchangeGoogleCode(code);
  if (!user) { res.status(401).send('OAuth failed'); return; }

  // Create/update profile
  if (deviceId) {
    const profile = getOrCreateProfile(deviceId);
    updateProfile(deviceId, { nickname: user.name });
  }

  // Redirect back to client with user data
  const userData = encodeURIComponent(JSON.stringify({
    id: deviceId || user.id,
    nickname: user.name,
    email: user.email,
    avatarUrl: user.picture,
    loginType: 'google',
  }));
  const clientUrl = isProduction ? '/' : 'http://localhost:5173/';
  res.redirect(`${clientUrl}?auth=${userData}`);
});

// ===== GitHub OAuth =====
app.get('/auth/github', (req, res) => {
  if (!isGithubConfigured()) {
    res.status(503).json({ error: 'GitHub OAuth not configured' });
    return;
  }
  const deviceId = (req.query.device_id as string) || '';
  const state = Buffer.from(JSON.stringify({ deviceId })).toString('base64url');
  res.redirect(getGithubAuthUrl(state));
});

app.get('/auth/github/callback', async (req, res) => {
  const code = req.query.code as string;
  const stateRaw = req.query.state as string;
  if (!code) { res.status(400).send('Missing code'); return; }

  let deviceId = '';
  try {
    const stateData = JSON.parse(Buffer.from(stateRaw, 'base64url').toString());
    deviceId = stateData.deviceId || '';
  } catch { /* ignore */ }

  const user = await exchangeGithubCode(code);
  if (!user) { res.status(401).send('OAuth failed'); return; }

  // Create/update profile
  if (deviceId) {
    const profile = getOrCreateProfile(deviceId);
    updateProfile(deviceId, { nickname: user.name || user.login });
  }

  // Redirect back to client with user data
  const userData = encodeURIComponent(JSON.stringify({
    id: deviceId || user.id,
    nickname: user.name || user.login,
    email: user.email,
    avatarUrl: user.avatarUrl,
    loginType: 'github',
  }));
  const clientUrl = isProduction ? '/' : 'http://localhost:5173/';
  res.redirect(`${clientUrl}?auth=${userData}`);
});

// Socket.IO
setupSocketHandlers(io);

// Serve static files in production
if (isProduction) {
  const clientBuildPath = path.join(__dirname, '..', '..', 'client', 'dist');
  app.use(express.static(clientBuildPath));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(clientBuildPath, 'index.html'));
  });
}

server.listen(PORT, () => {
  console.log(`Typing Race server running on http://localhost:${PORT}`);
  console.log(`  Mode: ${isProduction ? 'production' : 'development'}`);
});
