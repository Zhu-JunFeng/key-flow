import type { Server } from 'socket.io';
import {
  createRoom,
  getRoom,
  addPlayerToRoom,
  removePlayerFromRoom,
  startCountdown,
} from './gameRoom.js';

interface QueueEntry {
  readonly socketId: string;
  readonly deviceId: string | null;
  readonly nickname: string;
  readonly avatar: number;
  readonly joinedAt: number;
  readonly difficulty: 'easy' | 'medium' | 'hard';
  readonly language: 'en' | 'zh';
}

const matchQueues = new Map<string, QueueEntry[]>();
const MIN_PLAYERS = 2;
const MAX_PLAYERS = 5;
const QUEUE_WAIT_TIME = 15_000; // 15s then start with whoever is in queue

const matchTimers = new Map<string, ReturnType<typeof setTimeout>>();

function getQueueKey(difficulty: string, language: string): string {
  return `${difficulty}:${language}`;
}

function getQueue(key: string): QueueEntry[] {
  if (!matchQueues.has(key)) {
    matchQueues.set(key, []);
  }
  return matchQueues.get(key)!;
}

export function addToQueue(
  socketId: string,
  deviceId: string | null,
  nickname: string,
  avatar: number,
  difficulty: 'easy' | 'medium' | 'hard',
  language: 'en' | 'zh',
  io: Server
): void {
  const key = getQueueKey(difficulty, language);
  const queue = getQueue(key);

  // Prevent duplicates across all queues
  for (const [, q] of matchQueues) {
    if (q.some(e => e.socketId === socketId)) return;
  }

  queue.push({ socketId, deviceId, nickname, avatar, joinedAt: Date.now(), difficulty, language });

  io.to(socketId).emit('queue:joined', { position: queue.length });
  broadcastQueueSize(io);

  if (queue.length >= MAX_PLAYERS) {
    createMatch(key, io);
  } else if (queue.length >= MIN_PLAYERS && !matchTimers.has(key)) {
    const timer = setTimeout(() => {
      const q = getQueue(key);
      if (q.length >= MIN_PLAYERS) {
        createMatch(key, io);
      }
      matchTimers.delete(key);
    }, QUEUE_WAIT_TIME);
    matchTimers.set(key, timer);
  }
}

export function removeFromQueue(socketId: string, io: Server): void {
  for (const [key, queue] of matchQueues) {
    const idx = queue.findIndex(e => e.socketId === socketId);
    if (idx !== -1) {
      queue.splice(idx, 1);
      broadcastQueueSize(io);

      if (queue.length < MIN_PLAYERS && matchTimers.has(key)) {
        clearTimeout(matchTimers.get(key)!);
        matchTimers.delete(key);
      }
      return;
    }
  }
}

function createMatch(queueKey: string, io: Server): void {
  const queue = getQueue(queueKey);
  const playersToMatch = queue.splice(0, MAX_PLAYERS);
  if (matchTimers.has(queueKey)) {
    clearTimeout(matchTimers.get(queueKey)!);
    matchTimers.delete(queueKey);
  }

  const first = playersToMatch[0];
  const room = createRoom(MAX_PLAYERS, first.difficulty, first.language);

  for (const entry of playersToMatch) {
    const socket = io.sockets.sockets.get(entry.socketId);
    if (!socket) continue;

    addPlayerToRoom(room, entry.socketId, entry.deviceId, entry.nickname, entry.avatar);
    socket.join(room.id);
    socket.data.roomId = room.id;
  }

  io.to(room.id).emit('match:found', {
    roomId: room.id,
    text: room.text,
    players: room.players.map(p => ({
      id: p.id,
      nickname: p.nickname,
      avatar: p.avatar,
    })),
  });

  // Start countdown immediately
  startCountdown(room, io);
  broadcastQueueSize(io);
}

function broadcastQueueSize(io: Server): void {
  let totalSize = 0;
  for (const [, queue] of matchQueues) {
    totalSize += queue.length;
  }
  io.emit('queue:size', { size: totalSize });
}

export function getQueueSize(): number {
  let totalSize = 0;
  for (const [, queue] of matchQueues) {
    totalSize += queue.length;
  }
  return totalSize;
}
