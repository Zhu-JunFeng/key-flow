export interface Player {
  readonly id: string;
  readonly socketId: string;
  readonly nickname: string;
  readonly avatar: number;
}

export interface RoomPlayer {
  readonly id: string;
  readonly nickname: string;
  readonly avatar: number;
  readonly progress: number;
  readonly wpm: number;
  readonly accuracy: number;
  readonly finished: boolean;
  readonly finishTime: number | null;
  readonly rank: number | null;
}

export interface GameRoom {
  readonly id: string;
  readonly text: string;
  readonly players: readonly RoomPlayer[];
  readonly state: 'waiting' | 'countdown' | 'racing' | 'finished';
  readonly startTime: number | null;
  readonly countdownEnd: number | null;
  readonly maxPlayers: number;
  readonly difficulty?: 'easy' | 'medium' | 'hard';
  readonly language?: 'en' | 'zh';
}

export interface TypingProgress {
  readonly roomId: string;
  readonly playerId: string;
  readonly progress: number;
  readonly wpm: number;
  readonly accuracy: number;
  readonly correctChars: number;
  readonly totalKeystrokes: number;
  readonly finished: boolean;
}

export interface LeaderboardEntry {
  readonly id: number;
  readonly nickname: string;
  readonly avatar: number;
  readonly wpm: number;
  readonly accuracy: number;
  readonly textLength: number;
  readonly mode: 'practice' | 'multiplayer';
  readonly createdAt: string;
}

export interface MatchRequest {
  readonly nickname: string;
  readonly avatar: number;
}
