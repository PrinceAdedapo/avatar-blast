import type { GemColor } from '../types/game';

// Match/blast effect images per character element
// Fire (Zuko) reuses earth-blast with a CSS hue-rotate as placeholder
export const BLAST_EFFECT_IMG: Record<GemColor, string> = {
  red: '/assets/effects/earth-blast.webp',       // Fire blast — placeholder (no fire image yet)
  orange: '/assets/effects/air-blast.webp',       // Air swirl — Aang
  yellow: '/assets/effects/boomerang-blast.webp', // Boomerang — Sokka
  green: '/assets/effects/earth-blast.webp',      // Earth shatter — Toph
  blue: '/assets/effects/water-blast.webp',       // Water splash — Katara
  purple: '/assets/effects/avatar-blast.webp',    // Avatar State — Korra
};

// CSS hue-rotate to tint the placeholder for fire (red uses green earth image)
export const BLAST_HUE_ROTATE: Partial<Record<GemColor, string>> = {
  red: 'hue-rotate(-80deg) saturate(1.5)',
};
