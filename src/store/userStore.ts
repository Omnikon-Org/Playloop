import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UserState {
  likedGames: Record<string, boolean>;
  following: Record<string, boolean>;
  bestScores: Record<string, number>;
  toggleLike: (gameId: string) => void;
  toggleFollow: (creatorId: string) => void;
  updateBestScore: (gameId: string, score: number) => boolean; // returns true if new best
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      likedGames: {},
      following: {},
      bestScores: {},
      toggleLike: (gameId) => set((state) => {
        const next = { ...state.likedGames };
        if (next[gameId]) delete next[gameId];
        else next[gameId] = true;
        return { likedGames: next };
      }),
      toggleFollow: (creatorId) => set((state) => {
        const next = { ...state.following };
        if (next[creatorId]) delete next[creatorId];
        else next[creatorId] = true;
        return { following: next };
      }),
      updateBestScore: (gameId, score) => {
        const current = get().bestScores[gameId] || 0;
        if (score > current) {
          set((state) => ({
            bestScores: {
              ...state.bestScores,
              [gameId]: score
            }
          }));
          return true;
        }
        return false;
      }
    }),
    {
      name: 'playloop-user',
    }
  )
);
