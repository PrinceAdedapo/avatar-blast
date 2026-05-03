import type { Level, GemColor } from '../types/game';

const ALL_COLORS: GemColor[] = ['red', 'orange', 'yellow', 'green', 'blue', 'purple'];

/*
 * ═══════════════════════════════════════════════════════════════
 *  INFINITE LEVEL SYSTEM — Game Psychology Design
 * ═══════════════════════════════════════════════════════════════
 *
 *  Core Psychology Principles Applied:
 *
 *  1. FLOW STATE (Csikszentmihalyi) — Difficulty rises with player skill
 *     but uses a logarithmic curve so it never becomes impossible.
 *     Every ~10 levels includes an "easy breather" to reset frustration.
 *
 *  2. VARIABLE RATIO REINFORCEMENT (Skinner) — Goal types cycle in
 *     a semi-random pattern. Dual-goal "challenge" levels appear at
 *     intervals that feel unpredictable but are ~every 3rd level.
 *
 *  3. PRESTIGE / ERA SYSTEM — Every 100 levels = 1 Era. Same 5 worlds
 *     cycle but with higher difficulty + new era badge. Gives "reset
 *     satisfaction" (like New Game+) while keeping all progress visible.
 *
 *  4. ENDOWED PROGRESS EFFECT (Nunes & Drèze) — Each new era starts
 *     slightly easier than the previous era ended, making the first few
 *     levels feel fast → builds momentum to continue.
 *
 *  5. NEAR-MISS DESIGN — Target scores sit just above typical scores,
 *     making 2-star feel achievable and 3-star feel tantalizingly close.
 *
 *  6. LOSS AVERSION (Kahneman) — Move/time limits create urgency.
 *     They tighten gradually, never suddenly.
 *
 *  7. MASTERY CURVE — Grid stays 7x7 for Era 1, grows to 8x8 in Era 2+,
 *     then 9x9 in Era 4+. Colors scale from 4 → 6 across eras.
 *
 *  8. ZEIGARNIK EFFECT — World progress bars + star counts create
 *     visible "incomplete" state that compels completion.
 *
 *  Difficulty Formula: Uses logarithmic scaling so it *always* gets
 *  harder but *never* becomes truly impossible. The curve flattens,
 *  giving even casual players a chance at high eras.
 */

/**
 * Worlds cycle every 100 levels. Each cycle = 1 Era.
 * Era 1 = levels 1-100, Era 2 = 101-200, etc.
 */
export const WORLDS = [
  { name: 'Air Temple',  icon: '🌀', accent: '#45aaf2' },
  { name: 'Ba Sing Se',  icon: '🏯', accent: '#26de81' },
  { name: 'Fire Nation',  icon: '🔥', accent: '#ff6b6b' },
  { name: 'Water Tribe',  icon: '🌊', accent: '#54a0ff' },
  { name: 'Spirit World', icon: '✨', accent: '#a55eea' },
] as const;

export const ERA_NAMES = [
  'Beginner',     // Era 1
  'Apprentice',   // Era 2
  'Warrior',      // Era 3
  'Master',       // Era 4
  'Avatar',       // Era 5
  'Legend',        // Era 6
  'Mythic',       // Era 7
  'Eternal',      // Era 8+
] as const;

export const ERA_COLORS = [
  '#45aaf2',  // Blue
  '#26de81',  // Green
  '#ff6b6b',  // Red
  '#ffd700',  // Gold
  '#a55eea',  // Purple
  '#ff8c00',  // Orange
  '#ff4757',  // Crimson
  '#ffffff',  // White (legendary)
] as const;

/** Get era info for any level number */
export function getEra(level: number) {
  const eraIndex = Math.floor((level - 1) / 100);  // 0-based
  const eraNum = eraIndex + 1;
  const nameIndex = Math.min(eraIndex, ERA_NAMES.length - 1);
  return {
    num: eraNum,
    name: ERA_NAMES[nameIndex],
    color: ERA_COLORS[Math.min(eraIndex, ERA_COLORS.length - 1)],
    suffix: eraNum > ERA_NAMES.length ? ` ${eraNum - ERA_NAMES.length + 1}` : '',
  };
}

/** Get world info for any level number */
export function getWorld(level: number) {
  const posInEra = ((level - 1) % 100);     // 0-99
  const worldIndex = Math.floor(posInEra / 20); // 0-4
  const world = WORLDS[worldIndex];
  const worldStart = Math.floor((level - 1) / 20) * 20 + 1;
  const worldEnd = worldStart + 19;
  return { ...world, index: worldIndex, start: worldStart, end: worldEnd };
}

/**
 * Generate level config for ANY level number (infinite).
 * Balanced: levels feel satisfying, not too easy or too hard.
 * Proper match-3 pacing — takes strategy to complete, not just spamming.
 */
export function generateLevel(level: number): Level {
  const era = getEra(level);
  const posInEra = ((level - 1) % 100);        // 0-99 position within era
  const posInWorld = ((level - 1) % 20);        // 0-19 position within world

  // ── Difficulty curve ──
  // Smooth ramp: levels 1-5 intro, 6-20 learning, 21+ real challenge
  const rawDifficulty = level <= 5
    ? level * 0.4                               // 0.4 → 2.0
    : level <= 20
      ? 2.0 + (level - 5) * 0.25               // 2.0 → 5.75
      : level <= 50
        ? 5.75 + (level - 20) * 0.15           // 5.75 → 10.25
        : Math.log2(level + 1) * 1.5;          // Log curve 50+

  // ── "Breather" levels: every 10th level is slightly easier ──
  const isBreather = posInWorld === 0 || posInWorld === 10;
  const breatherBonus = isBreather ? -1.0 : 0;

  // ── Era start bonus: first 3 levels of each era slightly easier ──
  const eraStartBonus = posInEra < 3 ? -(1.0 - posInEra * 0.3) : 0;

  const difficulty = Math.max(0, rawDifficulty + breatherBonus + eraStartBonus);

  // ── Moves: enough to complete but requires smart play ──
  // Level 1: 30, Level 5: 28, Level 10: 25, Level 30: 20, floor 14
  const moves = level <= 3
    ? 30                           // Intro: comfortable
    : level <= 10
      ? Math.round(28 - (level - 3) * 0.5)  // 28 → 24
      : Math.max(14, Math.round(25 - difficulty * 0.9));

  // ── Time: enough pressure to think, not panic ──
  // Level 1: 90s, tightens to 40s floor
  const timeLimit = level <= 5
    ? 90
    : level <= 15
      ? 80
      : Math.max(40, Math.round(85 - difficulty * 3.5));

  // ── Grid size: 7x7 standard, grows in later eras ──
  const gridSize = level <= 3 ? 7
    : era.num >= 4 ? 9
    : era.num >= 2 ? 8
    : 7;

  // ── Colors: 4 early → 5 mid → 6 late (more = harder to match) ──
  const numColors = level <= 15 ? 4
    : level <= 40 ? 5
    : Math.min(4 + Math.floor(difficulty / 3.5), 6);
  const colors = ALL_COLORS.slice(0, numColors);

  // ── Score targets: require multiple combos to hit ──
  // With 20pts/gem scoring, a 3-match = 60pts, 4-match = 95pts
  // Average move yields ~80-120pts with cascades
  // So ~25 moves should yield ~2000-3000 naturally if played well
  const baseScore = level <= 3
    ? 600 + level * 150            // 750-1050 (intro)
    : level <= 10
      ? 1000 + (level - 3) * 200   // 1200-2400
      : level <= 30
        ? 2000 + (level - 10) * 150 // 2000-5000
        : Math.round(2500 + difficulty * 400);

  const targetScore: [number, number, number] = [
    baseScore,                       // 1-star: complete the level
    Math.round(baseScore * 1.5),     // 2-star: play well
    Math.round(baseScore * 2.2),     // 3-star: master it
  ];

  // ── Goal variety ──
  // Levels 1-3: score only (learn mechanics)
  // Levels 4-8: introduce collection
  // Level 9+: mixed goals that require planning
  let goals: Level['goals'];

  if (level <= 3) {
    goals = [{ type: 'score', target: baseScore }];
  } else if (level <= 8) {
    const collectColor = colors[(level * 3 + 5) % colors.length];
    const collectTarget = 10 + level * 2;  // 18-26
    goals = [{ type: 'collect', target: collectTarget, color: collectColor }];
  } else {
    const goalSeed = (level * 7 + 13) % 10;
    if (goalSeed <= 3) {
      // Score challenge (40%)
      goals = [{ type: 'score', target: baseScore }];
    } else if (goalSeed <= 6) {
      // Collection challenge (30%)
      const collectColor = colors[(level * 3 + 5) % colors.length];
      const collectTarget = Math.round(15 + difficulty * 2.5);
      goals = [{ type: 'collect', target: collectTarget, color: collectColor }];
    } else {
      // Dual-goal (30%) — must juggle both objectives
      const collectColor = colors[(level * 11 + 3) % colors.length];
      goals = [
        { type: 'score', target: Math.round(baseScore * 0.6) },
        { type: 'collect', target: Math.round(12 + difficulty * 2), color: collectColor },
      ];
    }
  }

  return {
    id: level,
    moves,
    timeLimit,
    goals,
    gridSize,
    colors,
    targetScore,
  };
}

/** 
 * Backwards-compatible: Pre-generate first 100 levels.
 * But any level > 100 is generated on-demand via generateLevel().
 */
const _cache = new Map<number, Level>();

export function getLevel(level: number): Level {
  let config = _cache.get(level);
  if (!config) {
    config = generateLevel(level);
    _cache.set(level, config);
  }
  return config;
}

// Legacy export — first 100 levels as an array for backward compat
export const LEVELS: Level[] = Array.from({ length: 100 }, (_, i) => getLevel(i + 1));

