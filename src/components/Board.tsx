import { useState, useEffect, useCallback, useRef, useMemo, memo } from 'react';
import { useGameStore } from '../stores/useGameStore';
import { onEffect } from '../engine/events';
import { GemTile } from './GemTile';
import { useSwipe } from '../hooks/useSwipe';
import { BLAST_EFFECT_IMG, BLAST_HUE_ROTATE } from '../data/effects';
import type { GemColor } from '../types/game';

interface ScorePopup {
  id: number;
  score: number;
  x: number;
  y: number;
}

interface ComboPopup {
  id: number;
  message: string;
  combo: number;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  color: string;
  dx: number;
  dy: number;
}

interface BlastEffect {
  id: number;
  x: number;
  y: number;
  color: GemColor;
}

let popupId = 0;

const GAP = 3;
const BOARD_PAD = 10;
const BOARD_MARGIN = 8; // horizontal margin outside board

/** Calculate gem size to fit the screen */
function calcGemSize(gridSize: number): number {
  const vw = Math.min(window.innerWidth, 480);
  const available = vw - BOARD_MARGIN * 2 - BOARD_PAD * 2 - (gridSize - 1) * GAP;
  return Math.min(48, Math.floor(available / gridSize));
}

export function Board() {
  const board = useGameStore(s => s.board);
  const selected = useGameStore(s => s.selected);
  const matchedPositions = useGameStore(s => s.matchedPositions);
  const phase = useGameStore(s => s.phase);
  const selectGem = useGameStore(s => s.selectGem);
  const swipeGem = useGameStore(s => s.swipeGem);
  const swapAnim = useGameStore(s => s.swapAnim);
  const fallingGemIds = useGameStore(s => s.fallingGemIds);
  const hintPositions = useGameStore(s => s.hintPositions);
  const showHint = useGameStore(s => s.showHint);

  // Pre-compute Sets for O(1) lookup instead of O(n) .some() per gem
  const matchedSet = useMemo(() => new Set(matchedPositions.map(p => `${p.row},${p.col}`)), [matchedPositions]);
  const hintSet = useMemo(() => new Set((hintPositions ?? []).map(p => `${p.row},${p.col}`)), [hintPositions]);

  const [scorePopups, setScorePopups] = useState<ScorePopup[]>([]);
  const [comboPopups, setComboPopups] = useState<ComboPopup[]>([]);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [blastEffects, setBlastEffects] = useState<BlastEffect[]>([]);
  const [shaking, setShaking] = useState(false);
  const [gemSize, setGemSize] = useState(48);
  const boardRef = useRef<HTMLDivElement>(null);
  const hintTimerRef = useRef<ReturnType<typeof setTimeout>>(null!);
  const blastBatchRef = useRef<Map<string, { rows: number[]; cols: number[]; color: GemColor }>>(new Map());
  const gemSizeRef = useRef(48);

  // Recalculate gem size on mount and resize
  useEffect(() => {
    if (board.length === 0) return;
    const update = () => {
      const s = calcGemSize(board.length);
      gemSizeRef.current = s;
      setGemSize(s);
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, [board.length]);

  // Auto hint after 5s idle
  useEffect(() => {
    if (phase === 'idle') {
      hintTimerRef.current = setTimeout(() => showHint(), 5000);
      return () => clearTimeout(hintTimerRef.current);
    } else {
      clearTimeout(hintTimerRef.current);
    }
  }, [phase, showHint]);

  // Listen for effects
  useEffect(() => {
    const unsubs = [
      onEffect('score-popup', (data) => {
        const { score, row, col } = data as { score: number; row: number; col: number };
        const gs = gemSizeRef.current;
        const cellSize = gs + GAP;
        const id = ++popupId;
        setScorePopups(prev => [...prev, {
          id,
          score,
          x: (col as number) * cellSize + gs / 2,
          y: (row as number) * cellSize,
        }]);
        setTimeout(() => setScorePopups(prev => prev.filter(p => p.id !== id)), 1000);
      }),
      onEffect('combo', (data) => {
        const { message, combo } = data as { message: string; combo: number };
        const id = ++popupId;
        setComboPopups(prev => [...prev, { id, message, combo }]);
        setTimeout(() => setComboPopups(prev => prev.filter(p => p.id !== id)), 1200);
        if (combo >= 3) {
          setShaking(true);
          setTimeout(() => setShaking(false), 400);
        }
      }),
      onEffect('gem-pop', (data) => {
        const { row, col, color } = data as { row: number; col: number; color: GemColor };
        const gs = gemSizeRef.current;
        const cellSize = gs + GAP;
        const cx = col * cellSize + gs / 2 + 8;
        const cy = row * cellSize + gs / 2 + 8;
        const colorMap: Record<string, string> = {
          red: '#ff6b6b', orange: '#ffa502', yellow: '#feca57',
          green: '#26de81', blue: '#45aaf2', purple: '#a55eea',
        };
        const c = colorMap[color] || '#fff';
        const newParticles: Particle[] = [];
        for (let i = 0; i < 4; i++) {
          const angle = (Math.PI * 2 * i) / 4 + (Math.random() - 0.5) * 0.4;
          const speed = 20 + Math.random() * 20;
          newParticles.push({
            id: ++popupId,
            x: cx, y: cy, color: c,
            dx: Math.cos(angle) * speed,
            dy: Math.sin(angle) * speed + 15,
          });
        }
        setParticles(prev => [...prev, ...newParticles]);
        setTimeout(() => {
          setParticles(prev => prev.filter(p => !newParticles.includes(p)));
        }, 700);

        // Batch gem-pops per color into a single blast effect
        const batch = blastBatchRef.current;
        if (!batch.has(color)) {
          batch.set(color, { rows: [], cols: [], color });
          // Flush after a microtask so all gem-pops in the same match batch together
          setTimeout(() => {
            const entry = batch.get(color);
            if (entry) {
              batch.delete(color);
              const avgX = entry.cols.reduce((a, b) => a + b, 0) / entry.cols.length;
              const avgY = entry.rows.reduce((a, b) => a + b, 0) / entry.rows.length;
              const gs2 = gemSizeRef.current;
              const cs = gs2 + GAP;
              const blastId = ++popupId;
              setBlastEffects(prev => [...prev, {
                id: blastId,
                x: avgX * cs + gs2 / 2,
                y: avgY * cs + gs2 / 2,
                color: entry.color,
              }]);
              setTimeout(() => {
                setBlastEffects(prev => prev.filter(b => b.id !== blastId));
              }, 600);
            }
          }, 16);
        }
        batch.get(color)!.rows.push(row);
        batch.get(color)!.cols.push(col);
      }),
    ];
    return () => unsubs.forEach(fn => fn());
  }, []);

  const handleSwipe = useCallback((from: { row: number; col: number }, to: { row: number; col: number }) => {
    swipeGem(from, to);
  }, [swipeGem]);

  const handleSelect = useCallback((row: number, col: number) => {
    selectGem({ row, col });
  }, [selectGem]);

  const swipeHandlers = useSwipe(handleSwipe, gemSize, board.length);

  if (board.length === 0) return null;

  const size = board.length;
  const cellSize = gemSize + GAP;

  // Calculate swap offsets
  const getSwapOffset = (r: number, c: number): { x: number; y: number } | undefined => {
    if (!swapAnim) return undefined;
    const { from, to } = swapAnim;
    if (from.row === r && from.col === c) {
      return { x: (to.col - from.col) * cellSize, y: (to.row - from.row) * cellSize };
    }
    if (to.row === r && to.col === c) {
      return { x: (from.col - to.col) * cellSize, y: (from.row - to.row) * cellSize };
    }
    return undefined;
  };

  return (
    <div className="board-container">
      <div
        ref={boardRef}
        className={`board${shaking ? ' shake' : ''}${phase === 'shuffling' ? ' shuffling' : ''}`}
        style={{
          gridTemplateColumns: `repeat(${size}, ${gemSize}px)`,
          gridTemplateRows: `repeat(${size}, ${gemSize}px)`,
          position: 'relative',
          '--gem-size': `${gemSize}px`,
        } as React.CSSProperties}
        {...swipeHandlers}
      >
        {board.map((row, r) =>
          row.map((gem, c) => (
            <GemTile
              key={gem.id}
              gem={gem}
              row={r}
              col={c}
              isSelected={selected?.row === r && selected?.col === c}
              isMatched={matchedSet.has(`${r},${c}`)}
              isFalling={phase === 'falling' && fallingGemIds.has(gem.id)}
              isHint={hintSet.has(`${r},${c}`)}
              swapOffset={getSwapOffset(r, c)}
              onSelect={handleSelect}
            />
          ))
        )}

        {/* Score popups */}
        {scorePopups.map(p => (
          <div key={p.id} className="score-popup" style={{ left: p.x, top: p.y }}>
            +{p.score}
          </div>
        ))}

        {/* Particles */}
        {particles.map(p => (
          <div
            key={p.id}
            className="particle"
            style={{
              left: p.x,
              top: p.y,
              background: p.color,
              '--dx': `${p.dx}px`,
              '--dy': `${p.dy}px`,
            } as React.CSSProperties}
          />
        ))}

        {/* Blast effects */}
        {blastEffects.map(b => (
          <div
            key={b.id}
            className="blast-effect"
            style={{
              left: b.x,
              top: b.y,
              filter: BLAST_HUE_ROTATE[b.color] || undefined,
            }}
          >
            <img src={BLAST_EFFECT_IMG[b.color]} alt="" draggable={false} />
          </div>
        ))}
      </div>

      {/* Combo text */}
      {comboPopups.map(p => (
        <div key={p.id} className="combo-text">
          {p.message}
        </div>
      ))}

      {/* Shuffle overlay — Spirit Portal */}
      {phase === 'shuffling' && (
        <div className="shuffle-overlay">
          <div className="shuffle-portal">
            <img
              className="shuffle-portal-img"
              src="/assets/effects/spirit-portal.webp"
              alt="Spirit Portal"
              draggable={false}
            />
            <div className="shuffle-portal-glow" />
          </div>
          <div className="shuffle-text">No Moves! Reshuffling...</div>
        </div>
      )}
    </div>
  );
}
