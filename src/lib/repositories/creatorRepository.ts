import { Creator } from '../../types/creator';
import { mockCreators } from '../../data/creators';

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

export async function getCreatorById(id: string): Promise<Creator | null> {
  await delay(50);
  return mockCreators.find(c => c.id === id) || null;
}

export async function getCreatorByUsername(username: string): Promise<Creator | null> {
  await delay(50);
  return mockCreators.find(c => c.username.toLowerCase() === username.toLowerCase()) || null;
}

export async function searchCreators(query: string): Promise<Creator[]> {
  await delay(100);
  const q = query.toLowerCase();
  return mockCreators.filter(c => 
    c.username.toLowerCase().includes(q) || 
    c.displayName.toLowerCase().includes(q)
  );
}
