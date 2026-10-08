import { Comment } from '../../types/comment';

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

const store = new Map<string, Comment[]>();

function generateMockComments(gameId: string): Comment[] {
  return [
    { id: "cm1", gameId, userId: "c_1", username: "alex_dev", content: "This game is so addictive!", likes: 124, createdAt: new Date(Date.now() - 86400000).toISOString() },
    { id: "cm2", gameId, userId: "c_2", username: "sam_studio", content: "I can't get past 10,000 points... any tips?", likes: 45, createdAt: new Date(Date.now() - 43200000).toISOString() },
    { id: "cm3", gameId, userId: "c_3", username: "pixel_ninja", content: "Best game on here so far 🔥", likes: 890, createdAt: new Date(Date.now() - 21600000).toISOString() },
  ];
}

export async function getComments(gameId: string): Promise<Comment[]> {
  await delay(100);
  if (!store.has(gameId)) {
    store.set(gameId, generateMockComments(gameId));
  }
  return store.get(gameId)!;
}

export async function postComment(gameId: string, userId: string, username: string, content: string): Promise<Comment> {
  await delay(100);
  if (!store.has(gameId)) {
    store.set(gameId, generateMockComments(gameId));
  }
  
  const comments = store.get(gameId)!;
  const newComment: Comment = {
    id: `cm_${Date.now()}`,
    gameId,
    userId,
    username,
    content,
    likes: 0,
    createdAt: new Date().toISOString()
  };
  
  comments.unshift(newComment);
  store.set(gameId, comments);
  
  return newComment;
}
