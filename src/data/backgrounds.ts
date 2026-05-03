// Background images mapped to level ranges (every 20 levels = new nation)
const GAME_BACKGROUNDS = [
  '/assets/backgrounds/air-temple.webp',     // Levels 1-20
  '/assets/backgrounds/ba-sing-se.webp',     // Levels 21-40
  '/assets/backgrounds/fire-nation.webp',    // Levels 41-60
  '/assets/backgrounds/water-tribe.webp',    // Levels 61-80
  '/assets/backgrounds/spirit-world.webp',   // Levels 81-100
];

export const HOME_BACKGROUND = '/assets/backgrounds/spirit-world.webp';

export function getBackgroundForLevel(level: number): string {
  const index = Math.floor((level - 1) / 20) % GAME_BACKGROUNDS.length;
  return GAME_BACKGROUNDS[index];
}
