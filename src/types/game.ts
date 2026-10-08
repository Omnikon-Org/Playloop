// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type GameConfig = Record<string, any>;

export type GameDifficulty = 'easy' | 'medium' | 'hard';

export interface GameMeta {
  id: string;
  slug: string;
  title: string;
  description: string;
  creatorId: string;
  category: string;
  tags: string[];
  difficulty: GameDifficulty;
  thumbnail: {
    gradient: [string, string];
    emoji?: string;
    svgKey?: string;
  };
  plays: number;
  likes: number;
  commentsCount: number;
  engineKey: string;
  config: GameConfig;
  controlsHint: string;
  createdAt: string;
}
