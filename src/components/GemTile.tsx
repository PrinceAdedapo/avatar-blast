import { memo, useCallback } from 'react';
import type { Gem } from '../types/game';
import { CHARACTER_IMG, CHARACTER_POWER_IMG, CHARACTER_LABEL } from '../data/characters';

interface GemProps {
  gem: Gem;
  row: number;
  col: number;
  isSelected: boolean;
  isMatched: boolean;
  isFalling: boolean;
  isHint: boolean;
  swapOffset?: { x: number; y: number };
  onSelect: (row: number, col: number) => void;
}

const SPECIAL_OVERLAY: Record<string, string> = {
  row: '↔️',
  col: '↕️',
  bomb: '💥',
  rainbow: '🌈',
};

export const GemTile = memo(function GemTile({ gem, row, col, isSelected, isMatched, isFalling, isHint, swapOffset, onSelect }: GemProps) {
  const handleClick = useCallback(() => onSelect(row, col), [onSelect, row, col]);

  const classes = [
    'gem',
    `gem-${gem.color}`,
    isSelected && 'selected',
    isMatched && 'matched',
    isFalling && 'falling',
    isHint && 'hint',
    gem.special !== 'none' && 'gem-powered',
  ].filter(Boolean).join(' ');

  const style: React.CSSProperties = {};
  if (swapOffset) {
    style.transform = `translate(${swapOffset.x}px, ${swapOffset.y}px)`;
    style.transition = 'transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)';
    style.zIndex = 20;
  }

  const isSpecial = gem.special !== 'none';
  const imgSrc = isSpecial ? CHARACTER_POWER_IMG[gem.color] : CHARACTER_IMG[gem.color];

  return (
    <div className={classes} onClick={handleClick} style={style}>
      {isSpecial && <div className="gem-special-glow" />}
      <div className="gem-shine" />
      <img
        className="gem-character-img"
        src={imgSrc}
        alt={gem.color}
        draggable={false}
        decoding="async"
        loading="eager"
        onError={(e) => {
          (e.target as HTMLImageElement).style.display = 'none';
          const fallback = (e.target as HTMLImageElement).nextElementSibling as HTMLElement;
          if (fallback) fallback.style.display = 'flex';
        }}
      />
      <span className="gem-fallback" style={{ display: 'none' }}>
        {CHARACTER_LABEL[gem.color]}
      </span>
      {isSpecial && (
        <span className="gem-special-badge">{SPECIAL_OVERLAY[gem.special]}</span>
      )}
    </div>
  );
});
