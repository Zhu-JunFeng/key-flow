export interface Player {
  readonly id: string;
  readonly nickname: string;
  readonly avatar: number;
}

export interface RoomPlayer extends Player {
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

export interface TextPassage {
  readonly id: number;
  readonly text: string;
  readonly display?: string;
  readonly difficulty: 'easy' | 'medium' | 'hard';
  readonly language: 'en' | 'zh';
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

export interface PlayerStats {
  readonly totalGames: number;
  readonly avgWpm: number;
  readonly bestWpm: number;
  readonly avgAccuracy: number;
  readonly wins: number;
}
