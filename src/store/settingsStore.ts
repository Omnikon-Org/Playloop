import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SettingsState {
  reducedMotion: boolean;
  muted: boolean;
  hasSeenSwipeHint: boolean;
  setReducedMotion: (val: boolean) => void;
  setMuted: (val: boolean) => void;
  setHasSeenSwipeHint: (val: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      reducedMotion: false, // Default will be updated by a hook checking matchMedia
      muted: false,
      hasSeenSwipeHint: false,
      setReducedMotion: (val) => set({ reducedMotion: val }),
      setMuted: (val) => set({ muted: val }),
      setHasSeenSwipeHint: (val) => set({ hasSeenSwipeHint: val }),
    }),
    {
      name: 'playloop-settings',
    }
  )
);
