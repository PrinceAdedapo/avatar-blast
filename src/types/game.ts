export type GemColor = 'red' | 'orange' | 'yellow' | 'green' | 'blue' | 'purple';

export type SpecialType = 'none' | 'row' | 'col' | 'bomb' | 'rainbow';

export interface Gem {
  id: string;
  color: GemColor;
  special: SpecialType;
  row: number;
  col: number;
}

export interface Position {
  row: number;
  col: number;
}

export interface MatchResult {
  positions: Position[];
  special?: { type: SpecialType; position: Position };
}

export type LevelGoalType = 'score' | 'collect' | 'moves';

export interface LevelGoal {
  type: LevelGoalType;
  target: number;
  color?: GemColor;
}

export interface Level {
  id: number;
  moves: number;
  timeLimit: number;
  goals: LevelGoal[];
  gridSize: number;
  colors: GemColor[];
  targetScore: number[];  // [1-star, 2-star, 3-star]
}

export type Screen = 'home' | 'game' | 'levelComplete' | 'gameOver';

export type GamePhase = 'idle' | 'selected' | 'swapping' | 'matching' | 'falling' | 'shuffling' | 'complete';
