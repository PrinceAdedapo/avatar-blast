import type { Gem, GemColor, Position, MatchResult, SpecialType } from '../types/game';

let idCounter = 0;
function nextId(): string {
  return `gem-${++idCounter}`;
}

export function createGem(row: number, col: number, colors: GemColor[]): Gem {
  return {
    id: nextId(),
    color: colors[Math.floor(Math.random() * colors.length)],
    special: 'none',
    row,
    col,
  };
}

export function createBoard(size: number, colors: GemColor[], level?: number): Gem[][] {
  const board: Gem[][] = [];

  for (let r = 0; r < size; r++) {
    board[r] = [];
    for (let c = 0; c < size; c++) {
      let gem = createGem(r, c, colors);
      // Prevent initial matches
      while (hasInitialMatch(board, gem, r, c)) {
        gem = createGem(r, c, colors);
      }
      board[r][c] = gem;
    }
  }

  // Give player ONE free special gem on level 1 only (tutorial)
  if (level === 1) {
    const midR = Math.floor(size / 2);
    const midC = Math.floor(size / 2);
    board[midR][midC] = { ...board[midR][midC], special: 'bomb' };
  }

  return board;
}

function hasInitialMatch(board: Gem[][], gem: Gem, row: number, col: number): boolean {
  // Check horizontal
  if (col >= 2) {
    if (board[row][col - 1]?.color === gem.color && board[row][col - 2]?.color === gem.color) {
      return true;
    }
  }
  // Check vertical
  if (row >= 2) {
    if (board[row - 1]?.[col]?.color === gem.color && board[row - 2]?.[col]?.color === gem.color) {
      return true;
    }
  }
  return false;
}

export function areAdjacent(a: Position, b: Position): boolean {
  const dr = Math.abs(a.row - b.row);
  const dc = Math.abs(a.col - b.col);
  return (dr === 1 && dc === 0) || (dr === 0 && dc === 1);
}

export function findMatches(board: Gem[][]): MatchResult[] {
  const size = board.length;
  const matched = new Set<string>();
  const results: MatchResult[] = [];

  // Find horizontal matches
  for (let r = 0; r < size; r++) {
    for (let c = 0; c <= size - 3; c++) {
      if (!board[r][c]) continue;
      const color = board[r][c].color;
      let len = 1;
      while (c + len < size && board[r][c + len]?.color === color) {
        len++;
      }
      if (len >= 3) {
        const positions: Position[] = [];
        for (let i = 0; i < len; i++) {
          positions.push({ row: r, col: c + i });
          matched.add(`${r},${c + i}`);
        }
        const special = getSpecialFromMatch(len, positions, 'horizontal');
        results.push({ positions, special });
        c += len - 1;
      }
    }
  }

  // Find vertical matches
  for (let c = 0; c < size; c++) {
    for (let r = 0; r <= size - 3; r++) {
      if (!board[r][c]) continue;
      const color = board[r][c].color;
      let len = 1;
      while (r + len < size && board[r + len]?.[c]?.color === color) {
        len++;
      }
      if (len >= 3) {
        const positions: Position[] = [];
        for (let i = 0; i < len; i++) {
          positions.push({ row: r + i, col: c });
          matched.add(`${r + i},${c}`);
        }
        const special = getSpecialFromMatch(len, positions, 'vertical');
        results.push({ positions, special });
        r += len - 1;
      }
    }
  }

  // Detect L/T shapes: merge intersecting horizontal + vertical matches into bomb specials
  const merged = new Set<number>();
  for (let i = 0; i < results.length; i++) {
    if (merged.has(i)) continue;
    for (let j = i + 1; j < results.length; j++) {
      if (merged.has(j)) continue;
      // Check if matches share a position (intersection)
      const intersection = results[i].positions.find(a =>
        results[j].positions.some(b => a.row === b.row && a.col === b.col)
      );
      if (intersection) {
        // Merge into one match with bomb special at intersection
        const mergedPositions = [...results[i].positions];
        for (const p of results[j].positions) {
          if (!mergedPositions.some(m => m.row === p.row && m.col === p.col)) {
            mergedPositions.push(p);
          }
        }
        results[i] = {
          positions: mergedPositions,
          special: { type: 'bomb', position: intersection },
        };
        merged.add(j);
      }
    }
  }

  return results.filter((_, idx) => !merged.has(idx));
}

function getSpecialFromMatch(
  length: number,
  positions: Position[],
  direction: 'horizontal' | 'vertical'
): { type: SpecialType; position: Position } | undefined {
  if (length === 4) {
    const mid = positions[Math.floor(positions.length / 2)];
    return { type: direction === 'horizontal' ? 'row' : 'col', position: mid };
  }
  if (length >= 5) {
    const mid = positions[Math.floor(positions.length / 2)];
    return { type: 'rainbow', position: mid };
  }
  return undefined;
}

export function activateSpecial(board: Gem[][], gem: Gem): Position[] {
  const size = board.length;
  const affected: Position[] = [];

  switch (gem.special) {
    case 'row':
      for (let c = 0; c < size; c++) {
        affected.push({ row: gem.row, col: c });
      }
      break;
    case 'col':
      for (let r = 0; r < size; r++) {
        affected.push({ row: r, col: gem.col });
      }
      break;
    case 'bomb':
      // 3x3 blast radius centered on the gem
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          const r = gem.row + dr;
          const c = gem.col + dc;
          if (r >= 0 && r < size && c >= 0 && c < size) {
            affected.push({ row: r, col: c });
          }
        }
      }
      break;
    case 'rainbow': {
      // Destroy all gems of a random color
      const colors = new Set<GemColor>();
      for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
          if (board[r][c]) colors.add(board[r][c].color);
        }
      }
      const targetColor = [...colors][Math.floor(Math.random() * colors.size)];
      for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
          if (board[r][c]?.color === targetColor) {
            affected.push({ row: r, col: c });
          }
        }
      }
      break;
    }
  }

  return affected;
}

export function applyGravity(board: (Gem | null)[][], colors: GemColor[]): { newBoard: Gem[][]; movements: { gem: Gem; fromRow: number; toRow: number }[] } {
  const size = board.length;
  const movements: { gem: Gem; fromRow: number; toRow: number }[] = [];
  const newBoard: (Gem | null)[][] = board.map(row => [...row]);

  for (let c = 0; c < size; c++) {
    let writeRow = size - 1;

    // Move existing gems down
    for (let r = size - 1; r >= 0; r--) {
      if (newBoard[r][c] !== null) {
        if (r !== writeRow) {
          const gem = newBoard[r][c]!;
          movements.push({ gem, fromRow: r, toRow: writeRow });
          newBoard[writeRow][c] = gem;
          newBoard[writeRow][c]!.row = writeRow;
          newBoard[r][c] = null;
        }
        writeRow--;
      }
    }

    // Fill empty spaces from top
    for (let r = writeRow; r >= 0; r--) {
      const gem = createGem(r, c, colors);
      newBoard[r][c] = gem;
      movements.push({ gem, fromRow: -1 - (writeRow - r), toRow: r });
    }
  }

  return { newBoard: newBoard as Gem[][], movements };
}

export function hasValidMoves(board: Gem[][]): boolean {
  const size = board.length;

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      // Try swap right
      if (c < size - 1) {
        swap(board, r, c, r, c + 1);
        if (findMatches(board).length > 0) {
          swap(board, r, c, r, c + 1);
          return true;
        }
        swap(board, r, c, r, c + 1);
      }
      // Try swap down
      if (r < size - 1) {
        swap(board, r, c, r + 1, c);
        if (findMatches(board).length > 0) {
          swap(board, r, c, r + 1, c);
          return true;
        }
        swap(board, r, c, r + 1, c);
      }
    }
  }

  return false;
}

function swap(board: Gem[][], r1: number, c1: number, r2: number, c2: number) {
  const temp = board[r1][c1];
  board[r1][c1] = board[r2][c2];
  board[r2][c2] = temp;
}

export function calculateScore(matchCount: number, combo: number): number {
  // Balanced match-3 scoring:
  // 3 gems = 60pts base, 4 gems = 100pts, 5 gems = 150pts
  // Combos reward cascades but don't break the economy
  const base = matchCount * 20;
  const comboMultiplier = 1 + (combo - 1) * 0.5;  // 1x, 1.5x, 2x, 2.5x...
  const sizeBonus = matchCount > 3 ? (matchCount - 3) * 20 : 0;
  return Math.floor((base + sizeBonus) * comboMultiplier);
}

export function findHint(board: Gem[][]): { from: Position; to: Position } | null {
  const size = board.length;
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (c < size - 1) {
        swap(board, r, c, r, c + 1);
        if (findMatches(board).length > 0) {
          swap(board, r, c, r, c + 1);
          return { from: { row: r, col: c }, to: { row: r, col: c + 1 } };
        }
        swap(board, r, c, r, c + 1);
      }
      if (r < size - 1) {
        swap(board, r, c, r + 1, c);
        if (findMatches(board).length > 0) {
          swap(board, r, c, r + 1, c);
          return { from: { row: r, col: c }, to: { row: r + 1, col: c } };
        }
        swap(board, r, c, r + 1, c);
      }
    }
  }
  return null;
}

export function shuffleBoard(board: Gem[][]): Gem[][] {
  const size = board.length;
  const colorPool: GemColor[] = [];

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      colorPool.push(board[r][c].color);
    }
  }

  for (let attempt = 0; attempt < 30; attempt++) {
    const shuffled = [...colorPool];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    const newBoard: Gem[][] = [];
    let idx = 0;
    let valid = true;

    for (let r = 0; r < size && valid; r++) {
      newBoard[r] = [];
      for (let c = 0; c < size && valid; c++) {
        let placed = false;
        for (let k = idx; k < shuffled.length; k++) {
          const testGem: Gem = {
            id: nextId(),
            color: shuffled[k],
            special: 'none',
            row: r,
            col: c,
          };
          if (!hasInitialMatch(newBoard, testGem, r, c)) {
            [shuffled[idx], shuffled[k]] = [shuffled[k], shuffled[idx]];
            newBoard[r][c] = testGem;
            idx++;
            placed = true;
            break;
          }
        }
        if (!placed) valid = false;
      }
    }

    if (valid && hasValidMoves(newBoard)) {
      return newBoard;
    }
  }

  const uniqueColors = [...new Set(colorPool)];
  return createBoard(size, uniqueColors);
}
