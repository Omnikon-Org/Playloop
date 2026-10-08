export interface LeaderboardEntry {
  id: string;
  userId: string;
  username: string;
  score: number;
  rank: number;
  date: string;
}

export interface Leaderboard {
  gameId: string;
  today: LeaderboardEntry[];
  allTime: LeaderboardEntry[];
  friends: LeaderboardEntry[];
}
