// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type GameConfig = Record<string, any>;
export type GameStats = Record<string, unknown>;

export interface GameEvents {
  onScore: (score: number) => void;
  onGameOver: (result: { score: number; stats?: GameStats; isNewBest?: boolean }) => void;
  onReady: () => void;
  onError: (error: Error) => void;
}

export interface InputManager {
  isPointerDown: boolean;
  pointerX: number;
  pointerY: number;
  isKeyDown: (code: string) => boolean;
  isKeyPressed: (code: string) => boolean;
  isPointerJustDown: boolean;
  isPointerJustUp: boolean;
  update: () => void;
  cleanup: () => void;
}

export interface GameContext {
  canvas: HTMLCanvasElement;
  config: GameConfig;
  events: GameEvents;
  input: InputManager;
  reducedMotion: boolean;
  seed?: number;
}

export interface GameInstance {
  initialize: () => void;
  start: () => void;
  pause: () => void;
  resume: () => void;
  restart: () => void;
  destroy: () => void;
  resize?: (width: number, height: number) => void;
}

export interface GameModule {
  create: (ctx: GameContext) => GameInstance;
}
