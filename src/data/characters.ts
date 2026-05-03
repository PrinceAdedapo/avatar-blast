import type { GemColor } from '../types/game';

// Small 96px versions for game board tiles (4-5KB each vs 55-114KB originals)
export const CHARACTER_IMG: Record<GemColor, string> = {
  red: '/assets/characters/zuko-sm.webp',
  orange: '/assets/characters/aang-sm.webp',
  yellow: '/assets/characters/sokka-sm.webp',
  green: '/assets/characters/toph-sm.webp',
  blue: '/assets/characters/katara-sm.webp',
  purple: '/assets/characters/korra-sm.webp',
};

export const CHARACTER_POWER_IMG: Record<GemColor, string> = {
  red: '/assets/characters/zuko-power-sm.webp',
  orange: '/assets/characters/aang-power-sm.webp',
  yellow: '/assets/characters/sokka-power-sm.webp',
  green: '/assets/characters/toph-power-sm.webp',
  blue: '/assets/characters/katara-power-sm.webp',
  purple: '/assets/characters/korra-power-sm.webp',
};

// Full-size versions for UI screens (HomeScreen, modals, etc.)
export const CHARACTER_IMG_FULL: Record<GemColor, string> = {
  red: '/assets/characters/zuko.webp',
  orange: '/assets/characters/aang.webp',
  yellow: '/assets/characters/sokka.webp',
  green: '/assets/characters/toph.webp',
  blue: '/assets/characters/katara.webp',
  purple: '/assets/characters/korra.webp',
};

export const CHARACTER_NAME: Record<GemColor, string> = {
  red: 'Zuko',
  orange: 'Aang',
  yellow: 'Sokka',
  green: 'Toph',
  blue: 'Katara',
  purple: 'Korra',
};

export const CHARACTER_LABEL: Record<GemColor, string> = {
  red: 'Z',
  orange: 'A',
  yellow: 'S',
  green: 'T',
  blue: 'K',
  purple: 'Ko',
};
