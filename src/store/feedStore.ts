import { create } from 'zustand';

interface FeedState {
  activeGameId: string | null;
  setActiveGameId: (id: string | null) => void;
  interactionMode: 'idle' | 'playing';
  setInteractionMode: (mode: 'idle' | 'playing') => void;
}

export const useFeedStore = create<FeedState>()((set) => ({
  activeGameId: null,
  setActiveGameId: (id) => set({ activeGameId: id }),
  interactionMode: 'idle',
  setInteractionMode: (mode) => set({ interactionMode: mode }),
}));
