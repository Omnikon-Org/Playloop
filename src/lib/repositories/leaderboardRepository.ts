import { Leaderboard, LeaderboardEntry } from '../../types/leaderboard';

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

// Mock memory store
const store = new Map<string, Leaderboard>();

function generateMockLeaderboard(gameId: string): Leaderboard {
  const baseScore = 5000;
  const generateEntries = (multiplier: number): LeaderboardEntry[] => [
    { id: "l1", userId: "c_1", username: "alex_dev", score: Math.floor(baseScore * multiplier * 1.5), rank: 1, date: new Date().toISOString() },
    { id: "l2", userId: "c_2", username: "sam_studio", score: Math.floor(baseScore * multiplier * 1.2), rank: 2, date: new Date().toISOString() },
    { id: "l3", userId: "c_3", username: "pixel_ninja", score: Math.floor(baseScore * multiplier * 1.1), rank: 3, date: new Date().toISOString() },
    { id: "l4", userId: "c_4", username: "brain_gains", score: Math.floor(baseScore * multiplier * 0.9), rank: 4, date: new Date().toISOString() },
    { id: "l5", userId: "c_rishi", username: "rishi", score: Math.floor(baseScore * multiplier * 0.8), rank: 5, date: new Date().toISOString() },
  ];

  return {
    gameId,
    today: generateEntries(1),
    allTime: generateEntries(2),
    friends: generateEntries(0.8),
  };
}

export async function getLeaderboard(gameId: string): Promise<Leaderboard> {
  await delay(100);
  if (!store.has(gameId)) {
    store.set(gameId, generateMockLeaderboard(gameId));
  }
  return store.get(gameId)!;
}

export async function submitScore(gameId: string, userId: string, username: string, score: number): Promise<void> {
  await delay(50);
  if (!store.has(gameId)) {
    store.set(gameId, generateMockLeaderboard(gameId));
  }
  
  const lb = store.get(gameId)!;
  
  // Insert and re-rank 'today'
  const newEntry: LeaderboardEntry = {
    id: `l_${Date.now()}`,
    userId,
    username,
    score,
    rank: 0,
    date: new Date().toISOString()
  };
  
  lb.today.push({ ...newEntry });
  lb.today.sort((a, b) => b.score - a.score);
  lb.today.forEach((entry, idx) => entry.rank = idx + 1);
  lb.today = lb.today.slice(0, 100); // keep top 100

  // Insert and re-rank 'allTime'
  lb.allTime.push({ ...newEntry });
  lb.allTime.sort((a, b) => b.score - a.score);
  lb.allTime.forEach((entry, idx) => entry.rank = idx + 1);
  lb.allTime = lb.allTime.slice(0, 100);

  store.set(gameId, lb);
}
