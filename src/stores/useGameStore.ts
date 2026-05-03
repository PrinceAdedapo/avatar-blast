import { create } from 'zustand';
import type { Gem, GemColor, Screen, GamePhase, Position } from '../types/game';
import { getLevel } from '../data/levels';
import {
  createBoard,
  findMatches,
  areAdjacent,
  applyGravity,
  activateSpecial,
  calculateScore,
  hasValidMoves,
  findHint,
  shuffleBoard,
} from '../engine/match3-engine';
import { emitEffect } from '../engine/events';
import { playSwap, playMatch, playInvalidSwap, playSpecial, playSelect, playShuffle } from '../audio/sounds';

// --- Persistence ---
function loadProgress(): { unlockedLevel: number; levelStars: Record<number, number> } {
  try {
    const saved = localStorage.getItem('gemblast-progress');
    if (saved) return JSON.parse(saved);
  } catch { /* ignore */ }
  return { unlockedLevel: 1, levelStars: {} };
}

function saveProgress(unlockedLevel: number, levelStars: Record<number, number>) {
  try {
    localStorage.setItem('gemblast-progress', JSON.stringify({ unlockedLevel, levelStars }));
  } catch { /* ignore */ }
}

const saved = loadProgress();

// --- Types ---
interface SwapAnim {
  from: Position;
  to: Position;
}

interface GameState {
  screen: Screen;
  currentLevel: number;
  unlockedLevel: number;
  levelStars: Record<number, number>;

  board: Gem[][];
  phase: GamePhase;
  selected: Position | null;
  score: number;
  movesLeft: number;
  timeLeft: number;
  totalTime: number;
  combo: number;
  collected: Record<GemColor, number>;
  matchedPositions: Position[];
  fallingGemIds: Set<string>;
  stars: number;
  swapAnim: SwapAnim | null;
  hintPositions: Position[] | null;
  showGoalModal: boolean;

  setScreen: (screen: Screen) => void;
  startLevel: (level: number) => void;
  showLevelGoals: (level: number) => void;
  dismissGoalModal: () => void;
  closeGoalModal: () => void;
  selectGem: (pos: Position) => void;
  swipeGem: (from: Position, to: Position) => void;
  processMatches: () => void;
  nextLevel: () => void;
  restartLevel: () => void;
  showHint: () => void;
  tick: () => void;
  continueWithAd: () => void;
}

export const useGameStore = create<GameState>((set, get) => ({
  screen: 'home',
  currentLevel: 1,
  unlockedLevel: saved.unlockedLevel,
  levelStars: saved.levelStars,
  board: [],
  phase: 'idle',
  selected: null,
  score: 0,
  movesLeft: 0,
  timeLeft: 0,
  totalTime: 0,
  combo: 0,
  collected: { red: 0, orange: 0, yellow: 0, green: 0, blue: 0, purple: 0 },
  matchedPositions: [],
  fallingGemIds: new Set<string>(),
  stars: 0,
  swapAnim: null,
  hintPositions: null,
  showGoalModal: false,

  setScreen: (screen) => set({ screen }),

  showLevelGoals: (level) => {
    set({ currentLevel: level, showGoalModal: true, screen: 'home' });
  },

  dismissGoalModal: () => {
    const { currentLevel } = get();
    set({ showGoalModal: false });
    get().startLevel(currentLevel);
  },

  closeGoalModal: () => {
    set({ showGoalModal: false });
  },

  startLevel: (level) => {
    const config = getLevel(level);
    const board = createBoard(config.gridSize, config.colors, level);
    set({
      screen: 'game',
      currentLevel: level,
      board,
      phase: 'idle',
      selected: null,
      score: 0,
      movesLeft: config.moves,
      timeLeft: config.timeLimit,
      totalTime: config.timeLimit,
      combo: 0,
      collected: { red: 0, orange: 0, yellow: 0, green: 0, blue: 0, purple: 0 },
      matchedPositions: [],
      fallingGemIds: new Set<string>(),
      stars: 0,
      swapAnim: null,
      hintPositions: null,
      showGoalModal: false,
    });
  },

  showHint: () => {
    const { board, phase } = get();
    if (phase !== 'idle' && phase !== 'selected') return;
    const hint = findHint(board);
    if (hint) {
      set({ hintPositions: [hint.from, hint.to] });
      setTimeout(() => set(s => s.hintPositions ? { hintPositions: null } : {}), 2000);
    }
  },

  selectGem: (pos) => {
    const { phase, selected } = get();
    if (phase !== 'idle' && phase !== 'selected') return;
    set({ hintPositions: null });

    if (!selected) {
      playSelect();
      set({ selected: pos, phase: 'selected' });
      return;
    }

    if (pos.row === selected.row && pos.col === selected.col) {
      set({ selected: null, phase: 'idle' });
      return;
    }

    if (!areAdjacent(selected, pos)) {
      playSelect();
      set({ selected: pos });
      return;
    }

    get().swipeGem(selected, pos);
  },

  swipeGem: (from, to) => {
    const { phase, board, movesLeft } = get();
    if (phase !== 'idle' && phase !== 'selected') return;
    if (movesLeft <= 0) return;
    if (!areAdjacent(from, to)) return;

    set({ hintPositions: null });
    playSwap();
    set({
      swapAnim: { from, to },
      phase: 'swapping',
      selected: null,
    });

    setTimeout(() => {
      const currentBoard = get().board;
      const newBoard = currentBoard.map(row => [...row]);
      const gemA = newBoard[from.row][from.col];
      const gemB = newBoard[to.row][to.col];

      newBoard[from.row][from.col] = { ...gemB, row: from.row, col: from.col };
      newBoard[to.row][to.col] = { ...gemA, row: to.row, col: to.col };

      const matches = findMatches(newBoard);

      if (matches.length === 0) {
        playInvalidSwap();
        emitEffect('invalid-swap', { from, to });
        set({ swapAnim: { from: to, to: from }, phase: 'swapping' });
        setTimeout(() => set({ phase: 'idle', swapAnim: null }), 250);
        return;
      }

      set({
        board: newBoard,
        phase: 'matching',
        movesLeft: movesLeft - 1,
        combo: 1,
        swapAnim: null,
      });

      setTimeout(() => get().processMatches(), 80);
    }, 250);
  },

  processMatches: () => {
    const { board, score, combo, collected, currentLevel } = get();
    const config = getLevel(currentLevel);
    const matches = findMatches(board);

    if (matches.length === 0) {
      const state = get();
      const goalsMet = checkGoals(state);

      if (goalsMet) {
        const stars = calculateStars(state.score, config.targetScore);
        const newLevelStars = { ...state.levelStars };
        newLevelStars[currentLevel] = Math.max(newLevelStars[currentLevel] || 0, stars);
        const newUnlocked = Math.max(state.unlockedLevel, currentLevel + 1);
        saveProgress(newUnlocked, newLevelStars);
        set({ phase: 'complete', stars, unlockedLevel: newUnlocked, levelStars: newLevelStars });
        emitEffect('level-complete', { stars, score: state.score });
        setTimeout(() => set({ screen: 'levelComplete' }), 700);
      } else if (state.movesLeft <= 0 || state.timeLeft <= 0) {
        set({ phase: 'complete', stars: 0 });
        emitEffect('game-over', {});
        setTimeout(() => set({ screen: 'gameOver' }), 700);
      } else if (!hasValidMoves(board)) {
        playShuffle();
        emitEffect('shuffle', {});
        set({ phase: 'shuffling' });
        setTimeout(() => {
          const currentBoard = get().board;
          const newBoard = shuffleBoard(currentBoard);
          set({ board: newBoard, phase: 'idle' });
        }, 1500);
      } else {
        set({ phase: 'idle' });
      }
      return;
    }

    const allMatched: Position[] = [];
    const newCollected = { ...collected };
    const specialsToActivate: Position[] = [];
    let hasSpecials = false;

    for (const match of matches) {
      for (const pos of match.positions) {
        if (!allMatched.some(p => p.row === pos.row && p.col === pos.col)) {
          allMatched.push(pos);
          const gem = board[pos.row][pos.col];
          if (gem) {
            newCollected[gem.color] = (newCollected[gem.color] || 0) + 1;
            if (gem.special !== 'none') {
              specialsToActivate.push(pos);
              hasSpecials = true;
            }
          }
        }
      }
    }

    for (const sPos of specialsToActivate) {
      const gem = board[sPos.row][sPos.col];
      if (gem) {
        const extra = activateSpecial(board, gem);
        for (const p of extra) {
          if (!allMatched.some(m => m.row === p.row && m.col === p.col)) {
            allMatched.push(p);
            const g = board[p.row][p.col];
            if (g) newCollected[g.color]++;
          }
        }
      }
    }

    const matchScore = calculateScore(allMatched.length, combo);
    const firstMatchedGem = board[allMatched[0].row][allMatched[0].col];
    if (hasSpecials) playSpecial();
    else playMatch(combo, firstMatchedGem?.color);

    const comboMessages = ['', '', 'Nice!', 'Great!', 'Amazing!', 'Incredible!', 'LEGENDARY!'];
    const comboMsg = comboMessages[Math.min(combo, comboMessages.length - 1)] || 'GODLIKE!';
    if (combo >= 2) emitEffect('combo', { combo, message: comboMsg });

    for (const pos of allMatched) {
      const gem = board[pos.row][pos.col];
      if (gem) emitEffect('gem-pop', { row: pos.row, col: pos.col, color: gem.color });
    }

    emitEffect('score-popup', { score: matchScore, row: allMatched[0].row, col: allMatched[0].col });

    const newBoard: (Gem | null)[][] = board.map(row => [...row]);
    for (const pos of allMatched) newBoard[pos.row][pos.col] = null;

    for (const match of matches) {
      if (match.special) {
        const { type, position } = match.special;
        const gem = board[position.row][position.col];
        if (gem) {
          newBoard[position.row][position.col] = {
            ...gem, id: gem.id, special: type, row: position.row, col: position.col,
          };
        }
      }
    }

    set({ matchedPositions: allMatched, score: score + matchScore, collected: newCollected });

    setTimeout(() => {
      const { newBoard: filledBoard, movements } = applyGravity(newBoard, config.colors);
      const fallingIds = new Set(movements.map(m => m.gem.id));
      set({ board: filledBoard, matchedPositions: [], fallingGemIds: fallingIds, combo: combo + 1, phase: 'falling' });
      setTimeout(() => { set({ phase: 'matching', fallingGemIds: new Set() }); get().processMatches(); }, 350);
    }, 380);
  },

  nextLevel: () => {
    const { currentLevel } = get();
    const next = currentLevel + 1;
    get().showLevelGoals(next);
  },

  restartLevel: () => { get().startLevel(get().currentLevel); },

  tick: () => {
    const { timeLeft, phase, screen } = get();
    if (screen !== 'game') return;
    if (phase === 'complete') return;
    if (timeLeft <= 0) return;

    const next = timeLeft - 1;
    set({ timeLeft: next });

    if (next <= 0) {
      set({ phase: 'complete', stars: 0 });
      emitEffect('game-over', {});
      setTimeout(() => set({ screen: 'gameOver' }), 700);
    }
  },

  continueWithAd: () => {
    set({
      screen: 'game',
      phase: 'idle',
      timeLeft: 30,
      movesLeft: get().movesLeft + 5,
    });
  },
}));

function checkGoals(state: GameState): boolean {
  const config = getLevel(state.currentLevel);
  for (const goal of config.goals) {
    if (goal.type === 'score' && state.score < goal.target) return false;
    if (goal.type === 'collect' && goal.color && state.collected[goal.color] < goal.target) return false;
  }
  return true;
}

function calculateStars(score: number, targets: number[]): number {
  if (score >= targets[2]) return 3;
  if (score >= targets[1]) return 2;
  return 1;
}
