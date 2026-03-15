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
  readonly nickname: string;
  readonly avatar: number;
  readonly joinedAt: number;
}

const matchQueue: QueueEntry[] = [];
const MIN_PLAYERS = 2;
const MAX_PLAYERS = 5;
const QUEUE_WAIT_TIME = 15_000; // 15s then start with whoever is in queue

let matchTimer: ReturnType<typeof setTimeout> | null = null;

export function addToQueue(
  socketId: string,
  nickname: string,
  avatar: number,
  io: Server
): void {
  // Prevent duplicates
  if (matchQueue.some(e => e.socketId === socketId)) return;

  matchQueue.push({ socketId, nickname, avatar, joinedAt: Date.now() });

  io.to(socketId).emit('queue:joined', { position: matchQueue.length });
  broadcastQueueSize(io);

  if (matchQueue.length >= MAX_PLAYERS) {
    createMatch(io);
  } else if (matchQueue.length >= MIN_PLAYERS && !matchTimer) {
    matchTimer = setTimeout(() => {
      if (matchQueue.length >= MIN_PLAYERS) {
        createMatch(io);
      }
      matchTimer = null;
    }, QUEUE_WAIT_TIME);
  }
}

export function removeFromQueue(socketId: string, io: Server): void {
  const idx = matchQueue.findIndex(e => e.socketId === socketId);
  if (idx !== -1) {
    matchQueue.splice(idx, 1);
    broadcastQueueSize(io);
  }

  if (matchQueue.length < MIN_PLAYERS && matchTimer) {
    clearTimeout(matchTimer);
    matchTimer = null;
  }
}

function createMatch(io: Server): void {
  const playersToMatch = matchQueue.splice(0, MAX_PLAYERS);
  if (matchTimer) {
    clearTimeout(matchTimer);
    matchTimer = null;
  }

  const room = createRoom(MAX_PLAYERS);

  for (const entry of playersToMatch) {
    const socket = io.sockets.sockets.get(entry.socketId);
    if (!socket) continue;

    addPlayerToRoom(room, entry.socketId, entry.nickname, entry.avatar);
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
  io.emit('queue:size', { size: matchQueue.length });
}

export function getQueueSize(): number {
  return matchQueue.length;
}
