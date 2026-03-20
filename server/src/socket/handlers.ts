import type { Server, Socket } from 'socket.io';
import { addToQueue, removeFromQueue } from './matchmaking.js';
import {
  getRoom,
  removePlayerFromRoom,
  updatePlayerProgress,
  getActiveRooms,
  createRoom,
  addPlayerToRoom,
  startCountdown,
} from './gameRoom.js';
import { addLeaderboardEntry } from '../db/queries.js';

// Track online users: deviceId -> active socketIds
const onlineUsers = new Map<string, Set<string>>();
// Track spectators: roomId -> Set<socketId>
const spectators = new Map<string, Set<string>>();

function sanitizeNickname(nickname: string | undefined): string | null {
  if (!nickname) return null;
  const trimmed = nickname.trim();
  if (trimmed.length === 0) return null;
  return trimmed.slice(0, 20);
}

function sanitizeAvatar(avatar: number | undefined): number {
  return Math.max(0, Math.min(9, avatar ?? 0));
}

function getSocketDeviceId(socket: Socket, deviceId?: string): string | null {
  const normalized = deviceId?.trim();
  if (normalized) {
    socket.data.deviceId = normalized;
    return normalized;
  }
  return (socket.data.deviceId as string | undefined) ?? null;
}

export function setupSocketHandlers(io: Server): void {
  io.on('connection', (socket: Socket) => {
    console.log(`Player connected: ${socket.id}`);

    // ===== Online presence =====
    socket.on('user:online', (data: { deviceId: string }) => {
      if (!data.deviceId) return;
      const deviceId = data.deviceId.trim();
      if (!deviceId) return;

      const existingSockets = onlineUsers.get(deviceId) ?? new Set<string>();
      const wasOffline = existingSockets.size === 0;
      existingSockets.add(socket.id);
      onlineUsers.set(deviceId, existingSockets);
      socket.data.deviceId = deviceId;

      if (wasOffline) {
        socket.broadcast.emit('friend:online', { deviceId });
      }
    });

    // ===== Match Queue =====
    socket.on('queue:join', (data: { deviceId?: string; nickname: string; avatar: number; difficulty?: string; language?: string }) => {
      const nickname = sanitizeNickname(data.nickname);
      if (!nickname) return;
      const avatar = sanitizeAvatar(data.avatar);
      const difficulty = (['easy', 'medium', 'hard'].includes(data.difficulty ?? '') ? data.difficulty : 'medium') as 'easy' | 'medium' | 'hard';
      const language = (['en', 'zh'].includes(data.language ?? '') ? data.language : 'en') as 'en' | 'zh';
      addToQueue(socket.id, getSocketDeviceId(socket, data.deviceId), nickname, avatar, difficulty, language, io);
    });

    socket.on('queue:leave', () => {
      removeFromQueue(socket.id, io);
    });

    // ===== Typing progress =====
    socket.on('typing:progress', (data: {
      roomId: string;
      progress: number;
      correctChars: number;
      totalKeystrokes: number;
      errorCount: number;
    }) => {
      const room = getRoom(data.roomId);
      if (!room) return;
      updatePlayerProgress(
        room,
        socket.id,
        data.progress,
        data.correctChars,
        data.totalKeystrokes,
        data.errorCount ?? 0,
        io
      );
    });

    // ===== Practice mode - save result =====
    socket.on('practice:complete', (data: {
      nickname: string;
      avatar: number;
      wpm: number;
      accuracy: number;
      textLength: number;
    }) => {
      const nickname = sanitizeNickname(data.nickname);
      if (!nickname || data.wpm <= 0) return;
      addLeaderboardEntry({
        deviceId: getSocketDeviceId(socket),
        nickname,
        avatar: sanitizeAvatar(data.avatar),
        wpm: Math.round(data.wpm * 10) / 10,
        accuracy: Math.round(data.accuracy * 10) / 10,
        textLength: data.textLength,
        mode: 'practice',
      });
    });

    // ===== Spectate =====
    socket.on('spectate:rooms', () => {
      const rooms = getActiveRooms();
      socket.emit('spectate:rooms', rooms);
    });

    socket.on('spectate:join', (data: { roomId: string }) => {
      const room = getRoom(data.roomId);
      if (!room) {
        socket.emit('spectate:error', { message: 'Room not found' });
        return;
      }
      socket.join(data.roomId);
      if (!spectators.has(data.roomId)) {
        spectators.set(data.roomId, new Set());
      }
      spectators.get(data.roomId)!.add(socket.id);
      socket.data.spectatingRoom = data.roomId;
    });

    socket.on('spectate:leave', () => {
      const roomId = socket.data.spectatingRoom as string | undefined;
      if (roomId) {
        socket.leave(roomId);
        spectators.get(roomId)?.delete(socket.id);
        delete socket.data.spectatingRoom;
      }
    });

    // ===== Private Rooms =====
    socket.on('room:create-private', (data: { deviceId?: string; nickname: string; avatar: number; difficulty?: string; language?: string }) => {
      const nickname = sanitizeNickname(data.nickname);
      if (!nickname) return;
      const difficulty = (['easy', 'medium', 'hard'].includes(data.difficulty ?? '') ? data.difficulty : 'medium') as 'easy' | 'medium' | 'hard';
      const language = (['en', 'zh'].includes(data.language ?? '') ? data.language : 'en') as 'en' | 'zh';
      const room = createRoom(5, difficulty, language);
      const avatar = sanitizeAvatar(data.avatar);
      addPlayerToRoom(room, socket.id, getSocketDeviceId(socket, data.deviceId), nickname, avatar);
      socket.join(room.id);
      socket.data.roomId = room.id;
      socket.emit('room:created', {
        roomId: room.id,
        text: room.text,
        players: room.players.map(p => ({ id: p.id, nickname: p.nickname, avatar: p.avatar })),
        difficulty,
        language,
      });
    });

    socket.on('room:join-private', (data: { roomId: string; deviceId?: string; nickname: string; avatar: number }) => {
      const room = getRoom(data.roomId);
      if (!room) {
        socket.emit('room:error', { message: 'Room not found' });
        return;
      }
      if (room.state !== 'waiting') {
        socket.emit('room:error', { message: 'Race already started' });
        return;
      }
      if (room.players.length >= room.maxPlayers) {
        socket.emit('room:error', { message: 'Room is full' });
        return;
      }
      const nickname = sanitizeNickname(data.nickname) ?? 'Guest';
      const avatar = sanitizeAvatar(data.avatar);
      addPlayerToRoom(room, socket.id, getSocketDeviceId(socket, data.deviceId), nickname, avatar);
      socket.join(room.id);
      socket.data.roomId = room.id;
      io.to(room.id).emit('room:player-joined', {
        players: room.players.map(p => ({ id: p.id, nickname: p.nickname, avatar: p.avatar })),
      });
    });

    socket.on('room:start-private', (data: { roomId: string }) => {
      const room = getRoom(data.roomId);
      if (!room || room.state !== 'waiting' || room.players.length < 1) return;
      // Only the first player (host) can start
      if (room.players[0].id !== socket.id) return;
      io.to(room.id).emit('match:found', {
        roomId: room.id,
        text: room.text,
        players: room.players.map(p => ({ id: p.id, nickname: p.nickname, avatar: p.avatar })),
      });
      startCountdown(room, io);
    });

    // ===== Disconnect =====
    socket.on('disconnect', () => {
      console.log(`Player disconnected: ${socket.id}`);
      removeFromQueue(socket.id, io);

      // Clean up online presence
      const deviceId = socket.data.deviceId as string | undefined;
      if (deviceId) {
        const activeSockets = onlineUsers.get(deviceId);
        if (activeSockets) {
          activeSockets.delete(socket.id);
          if (activeSockets.size === 0) {
            onlineUsers.delete(deviceId);
            socket.broadcast.emit('friend:offline', { deviceId });
          }
        }
      }

      // Clean up spectating
      const spectatingRoom = socket.data.spectatingRoom as string | undefined;
      if (spectatingRoom) {
        spectators.get(spectatingRoom)?.delete(socket.id);
      }

      // Clean up room membership
      const roomId = socket.data.roomId as string | undefined;
      if (roomId) {
        const room = getRoom(roomId);
        if (room) {
          removePlayerFromRoom(room, socket.id);
          io.to(roomId).emit('player:left', { playerId: socket.id });
        }
      }
    });
  });
}

export function isUserOnline(deviceId: string): boolean {
  return (onlineUsers.get(deviceId)?.size ?? 0) > 0;
}

export function getOnlineUsers(): ReadonlyMap<string, ReadonlySet<string>> {
  return onlineUsers;
}
