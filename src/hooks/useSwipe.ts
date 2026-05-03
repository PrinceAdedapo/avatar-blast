import { useRef, useCallback } from 'react';
import type { Position } from '../types/game';

const SWIPE_THRESHOLD = 15;

export function useSwipe(onSwipe: (from: Position, direction: Position) => void, gemSize: number, gridSize: number) {
  const startRef = useRef<{ x: number; y: number; row: number; col: number } | null>(null);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    const board = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const padding = 10;
    const x = e.clientX - board.left - padding;
    const y = e.clientY - board.top - padding;
    const gap = 3;
    const cellSize = gemSize + gap;
    const col = Math.floor(x / cellSize);
    const row = Math.floor(y / cellSize);

    if (row >= 0 && row < gridSize && col >= 0 && col < gridSize) {
      startRef.current = { x: e.clientX, y: e.clientY, row, col };
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    }
  }, [gemSize, gridSize]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!startRef.current) return;
    const dx = e.clientX - startRef.current.x;
    const dy = e.clientY - startRef.current.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > SWIPE_THRESHOLD) {
      const { row, col } = startRef.current;
      let toRow = row, toCol = col;

      if (Math.abs(dx) > Math.abs(dy)) {
        toCol += dx > 0 ? 1 : -1;
      } else {
        toRow += dy > 0 ? 1 : -1;
      }

      if (toRow >= 0 && toRow < gridSize && toCol >= 0 && toCol < gridSize) {
        onSwipe({ row, col }, { row: toRow, col: toCol });
      }
      startRef.current = null;
    }
  }, [onSwipe, gridSize]);

  const onPointerUp = useCallback(() => {
    startRef.current = null;
  }, []);

  return { onPointerDown, onPointerMove, onPointerUp };
}
