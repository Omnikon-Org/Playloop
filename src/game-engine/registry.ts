import { GameModule } from './types';

const registry: Record<string, () => Promise<GameModule>> = {
  'reaction-test': () => import('../games/reaction-test').then(m => m.default as GameModule),
  'flappy-glide': () => import('../games/flappy-glide').then(m => m.default as GameModule),
  'dodge-rush': () => import('../games/dodge-rush').then(m => m.default as GameModule),
  'memory-flip': () => import('../games/memory-flip').then(m => m.default as GameModule),
  'math-blitz': () => import('../games/math-blitz').then(m => m.default as GameModule),
};

export function getGameModuleLoader(engineKey: string) {
  const loader = registry[engineKey];
  if (!loader) throw new Error(`Game engine ${engineKey} not found in registry`);
  return loader;
}
