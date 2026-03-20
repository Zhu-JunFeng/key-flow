import { v4 as uuidv4 } from 'uuid';
import type { Server, Socket } from 'socket.io';
import type { GameRoom, RoomPlayer } from '../types.js';
import { getRandomPassage } from '../texts/passages.js';
import { addLeaderboardEntry, addMatchHistory } from '../db/queries.js';

const rooms = new Map<string, MutableGameRoom>();

interface MutableRoomPlayer {
  id: string;
  deviceId: string | null;
  nickname: string;
  avatar: number;
  progress: number;
  wpm: number;
  accuracy: number;
  finished: boolean;
  finishTime: number | null;
  rank: number | null;
  correctChars: number;
  totalKeystrokes: number;
}

interface MutableGameRoom {
  id: string;
  text: string;
  players: MutableRoomPlayer[];
  state: 'waiting' | 'countdown' | 'racing' | 'finished';
  startTime: number | null;
  countdownEnd: number | null;
  maxPlayers: number;
  difficulty: 'easy' | 'medium' | 'hard';
  language: 'en' | 'zh';
  countdownTimer: ReturnType<typeof setTimeout> | null;
  finishTimer: ReturnType<typeof setTimeout> | null;
}

function toImmutableRoom(room: MutableGameRoom): GameRoom {
  return {
    id: room.id,
    text: room.text,
    players: room.players.map(p => ({
      id: p.id,
      nickname: p.nickname,
      avatar: p.avatar,
      progress: p.progress,
      wpm: p.wpm,
      accuracy: p.accuracy,
      finished: p.finished,
      finishTime: p.finishTime,
      rank: p.rank,
    })),
    state: room.state,
    startTime: room.startTime,
    countdownEnd: room.countdownEnd,
    maxPlayers: room.maxPlayers,
    difficulty: room.difficulty,
    language: room.language,
  };
}

export function createRoom(
  maxPlayers = 5,
  difficulty: 'easy' | 'medium' | 'hard' = 'medium',
  language: 'en' | 'zh' = 'en'
): MutableGameRoom {
  const passage = getRandomPassage(difficulty, language);
  const room: MutableGameRoom = {
    id: uuidv4().slice(0, 8),
    text: passage.text,
    players: [],
    state: 'waiting',
    startTime: null,
    countdownEnd: null,
    maxPlayers,
    difficulty,
    language,
    countdownTimer: null,
    finishTimer: null,
  };
  rooms.set(room.id, room);
  return room;
}

export function getRoom(roomId: string): MutableGameRoom | undefined {
  return rooms.get(roomId);
}

export function addPlayerToRoom(
  room: MutableGameRoom,
  playerId: string,
  deviceId: string | null,
  nickname: string,
  avatar: number
): MutableRoomPlayer {
  const player: MutableRoomPlayer = {
    id: playerId,
    deviceId,
    nickname,
    avatar,
    progress: 0,
    wpm: 0,
    accuracy: 100,
    finished: false,
    finishTime: null,
    rank: null,
    correctChars: 0,
    totalKeystrokes: 0,
  };
  room.players.push(player);
  return player;
}

export function removePlayerFromRoom(room: MutableGameRoom, playerId: string): boolean {
  const idx = room.players.findIndex(p => p.id === playerId);
  if (idx === -1) return false;
  room.players.splice(idx, 1);

  if (room.players.length === 0) {
    if (room.countdownTimer) clearTimeout(room.countdownTimer);
    if (room.finishTimer) clearTimeout(room.finishTimer);
    rooms.delete(room.id);
    return true;
  }
  return false;
}

export function startCountdown(room: MutableGameRoom, io: Server): void {
  room.state = 'countdown';
  const countdownDuration = 5000;
  room.countdownEnd = Date.now() + countdownDuration;

  io.to(room.id).emit('room:update', toImmutableRoom(room));

  room.countdownTimer = setTimeout(() => {
    room.state = 'racing';
    room.startTime = Date.now();
    io.to(room.id).emit('room:update', toImmutableRoom(room));
    io.to(room.id).emit('race:start', { startTime: room.startTime });

    // Auto-finish after 3 minutes
    room.finishTimer = setTimeout(() => {
      finishRoom(room, io);
    }, 180_000);
  }, countdownDuration);
}

export function updatePlayerProgress(
  room: MutableGameRoom,
  playerId: string,
  progress: number,
  correctChars: number,
  totalKeystrokes: number,
  errorCount: number,
  io: Server
): void {
  const player = room.players.find(p => p.id === playerId);
  if (!player || room.state !== 'racing' || !room.startTime) return;

  player.progress = progress;
  player.correctChars = correctChars;
  player.totalKeystrokes = totalKeystrokes;

  const elapsedMinutes = (Date.now() - room.startTime) / 60000;
  if (elapsedMinutes > 0) {
    player.wpm = Math.round((correctChars / 5) / elapsedMinutes);
  }
  // Accuracy: correct keystrokes / total keystrokes (excluding auto-skipped spaces)
  const correctKeystrokes = totalKeystrokes - errorCount;
  player.accuracy = totalKeystrokes > 0
    ? Math.round((correctKeystrokes / totalKeystrokes) * 100)
    : 100;

  if (progress >= room.text.length) {
    player.finished = true;
    player.finishTime = Date.now();
    const finishedCount = room.players.filter(p => p.finished).length;
    player.rank = finishedCount;
  }

  io.to(room.id).emit('room:update', toImmutableRoom(room));

  const allFinished = room.players.every(p => p.finished);
  if (allFinished) {
    finishRoom(room, io);
  }
}

function finishRoom(room: MutableGameRoom, io: Server): void {
  if (room.state === 'finished') return;
  room.state = 'finished';
  if (room.finishTimer) clearTimeout(room.finishTimer);

  // Assign ranks to unfinished players
  let nextRank = room.players.filter(p => p.finished).length + 1;
  const unfinished = room.players
    .filter(p => !p.finished)
    .sort((a, b) => b.progress - a.progress);
  for (const p of unfinished) {
    p.rank = nextRank++;
    p.finished = true;
    p.finishTime = Date.now();
  }

  // Save to database
  for (const p of room.players) {
    addLeaderboardEntry({
      deviceId: p.deviceId ?? undefined,
      nickname: p.nickname,
      avatar: p.avatar,
      wpm: p.wpm,
      accuracy: p.accuracy,
      textLength: room.text.length,
      mode: 'multiplayer',
    });
    addMatchHistory({
      roomId: room.id,
      deviceId: p.deviceId ?? undefined,
      nickname: p.nickname,
      avatar: p.avatar,
      wpm: p.wpm,
      accuracy: p.accuracy,
      rank: p.rank ?? 0,
      playerCount: room.players.length,
    });
  }

  io.to(room.id).emit('room:update', toImmutableRoom(room));
  io.to(room.id).emit('race:finish', toImmutableRoom(room));

  // Cleanup after 30 seconds
  setTimeout(() => {
    rooms.delete(room.id);
  }, 30_000);
}

export function getRoomCount(): number {
  return rooms.size;
}

export function getActiveRooms(): readonly GameRoom[] {
  return Array.from(rooms.values())
    .filter(r => r.state !== 'finished')
    .map(toImmutableRoom);
}
