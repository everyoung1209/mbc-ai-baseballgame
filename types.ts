
export enum GameStatus {
  PLAYING = 'PLAYING',
  WON = 'WON',
  LOST = 'LOST'
}

export interface GuessRecord {
  guess: string;
  strikes: number;
  balls: number;
  commentary?: string;
  timestamp: number;
}

export interface GameStats {
  wins: number;
  losses: number;
  bestScore: number | null;
}
