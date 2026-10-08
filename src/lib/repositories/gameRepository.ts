import { GameMeta } from '../../types/game';
import { mockGames } from '../../data/games';

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

export async function getFeedPage(cursor: number, limit: number): Promise<{ items: GameMeta[]; nextCursor: number | null }> {
  await delay(50);
  // Loop the mock games to simulate infinite feed
  const items: GameMeta[] = [];
  for (let i = 0; i < limit; i++) {
    items.push(mockGames[(cursor + i) % mockGames.length]);
  }
  return { items, nextCursor: cursor + limit };
}

export async function getGameById(id: string): Promise<GameMeta | null> {
  await delay(50);
  return mockGames.find(g => g.id === id) || null;
}

export async function searchGames(query: string): Promise<GameMeta[]> {
  await delay(100);
  const q = query.toLowerCase();
  return mockGames.filter(g => 
    g.title.toLowerCase().includes(q) || 
    g.description.toLowerCase().includes(q) ||
    g.tags.some(t => t.toLowerCase().includes(q))
  );
}

export async function getGamesByCategory(category: string): Promise<GameMeta[]> {
  await delay(50);
  return mockGames.filter(g => g.category.toLowerCase() === category.toLowerCase());
}
