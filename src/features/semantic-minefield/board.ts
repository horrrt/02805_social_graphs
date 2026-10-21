// Semantic Minefield's Minesweeper: a seeded board of characters, its clue
// numbers, the flood fill and a deduction solver. A tile is a bomb exactly
// when its character belongs to the round's target category, so a clue is
// always counted from the characters that are really there.
//
// Every board is built so that it can be cleared without a guess: it opens
// on a zero, and the solver below (single-clue rules, the subset rule
// between two clues, and the bomb count) must clear it from that opening, or
// the generator tries the next layout. The chips on hidden tiles are extra
// help; the numbers alone are always enough.
import { CHARACTERS, type CatId, type Character, isIn } from "./characters";

/** mulberry32: a small seeded PRNG, so a seed always deals the same board. */
export function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A stable number from a string, to seed a round from its id. */
export function hash(s: string) {
  let h = 2166136261;
  for (const ch of s) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return h >>> 0;
}

export function shuffle<T>(items: T[], rand: () => number) {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export type Spec = {
  target: CatId;
  rows: number;
  cols: number;
  bombs: number;
  /** Characters the board must hold, as bombs or decoys by their own rows. */
  include?: string[];
};

export type Board = {
  rows: number;
  cols: number;
  target: CatId;
  /** The character on each tile, row by row. */
  tiles: Character[];
  bomb: boolean[];
  /** The clue each tile shows when revealed: target members among its eight neighbours. */
  counts: number[];
  /** The category chip a hidden tile shows: one of its character's categories, never the target (see chipCategories). */
  chips: (CatId | null)[];
  /** The tiles open at the start: a zero and everything its flood fill reaches. */
  opening: number[];
  seed: number;
};

/** The up-to-eight tiles touching tile i. */
export function neighbours(i: number, rows: number, cols: number) {
  const r = Math.floor(i / cols);
  const c = i % cols;
  const out: number[] = [];
  for (let dr = -1; dr <= 1; dr++)
    for (let dc = -1; dc <= 1; dc++) {
      if (!dr && !dc) continue;
      const rr = r + dr;
      const cc = c + dc;
      if (rr >= 0 && rr < rows && cc >= 0 && cc < cols) out.push(rr * cols + cc);
    }
  return out;
}

export function countClues(bomb: boolean[], rows: number, cols: number) {
  return bomb.map((_, i) => neighbours(i, rows, cols).filter((j) => bomb[j]).length);
}

/**
 * The tiles a click on `start` opens: the tile itself, and, if it is a zero,
 * every tile the zeros connect to, as in Minesweeper. Bombs, flagged tiles
 * and tiles already open are never added.
 */
export function flood(start: number, board: Pick<Board, "rows" | "cols" | "bomb" | "counts">, open: ReadonlySet<number>, flagged: ReadonlySet<number> = new Set()) {
  const out: number[] = [];
  const seen = new Set<number>([start]);
  const stack = [start];
  while (stack.length) {
    const i = stack.pop()!;
    if (open.has(i) || flagged.has(i) || board.bomb[i]) continue;
    out.push(i);
    if (board.counts[i] !== 0) continue;
    for (const j of neighbours(i, board.rows, board.cols)) {
      if (!seen.has(j)) {
        seen.add(j);
        stack.push(j);
      }
    }
  }
  return out;
}

/**
 * Plays the board from its opening by deduction alone and returns whether it
 * clears every safe tile. It reads only what a player sees: the open tiles'
 * numbers and the total bomb count.
 */
export function solves(board: Pick<Board, "rows" | "cols" | "bomb" | "counts" | "opening">) {
  const n = board.bomb.length;
  const total = board.bomb.filter(Boolean).length;
  const open = new Set(board.opening);
  const known = new Set<number>();
  const reveal = (i: number) => {
    if (board.bomb[i]) throw new Error("the solver opened a bomb");
    for (const j of flood(i, board, open)) open.add(j);
  };
  for (let guard = 0; guard < n * 4; guard++) {
    if (open.size === n - total) return true;
    let progress = false;
    // Each open number: its hidden neighbours and how many bombs they still hold.
    const clues: { cells: number[]; need: number }[] = [];
    for (const i of open) {
      const around = neighbours(i, board.rows, board.cols);
      const cells = around.filter((j) => !open.has(j) && !known.has(j));
      if (!cells.length) continue;
      clues.push({ cells, need: board.counts[i] - around.filter((j) => known.has(j)).length });
    }
    const safe = new Set<number>();
    const mines = new Set<number>();
    for (const { cells, need } of clues) {
      if (need === 0) cells.forEach((j) => safe.add(j));
      if (need === cells.length) cells.forEach((j) => mines.add(j));
    }
    // The subset rule: when one clue's cells lie inside another's, the rest of
    // the bigger set holds exactly the difference in bombs.
    if (!safe.size && !mines.size) {
      for (const a of clues)
        for (const b of clues) {
          if (a === b || a.cells.length >= b.cells.length || !a.cells.every((j) => b.cells.includes(j))) continue;
          const rest = b.cells.filter((j) => !a.cells.includes(j));
          const need = b.need - a.need;
          if (need === 0) rest.forEach((j) => safe.add(j));
          if (need === rest.length) rest.forEach((j) => mines.add(j));
        }
    }
    // The bomb count: no bombs left means every hidden tile is safe, and as many
    // bombs as hidden tiles means they all are bombs.
    if (!safe.size && !mines.size) {
      const hidden = [...Array(n).keys()].filter((j) => !open.has(j) && !known.has(j));
      const left = total - known.size;
      if (left === 0) hidden.forEach((j) => safe.add(j));
      if (left === hidden.length) hidden.forEach((j) => mines.add(j));
    }
    for (const j of mines) if (!known.has(j)) (known.add(j), (progress = true));
    for (const j of safe) if (!open.has(j)) (reveal(j), (progress = true));
    if (!progress) return false;
  }
  return open.size === n - total;
}

/** Picks `k` items: the required ones first, then from the rest; repeats only when the pool runs short. */
function draw(pool: Character[], must: Character[], k: number, rand: () => number) {
  const rest = shuffle(pool.filter((c) => !must.includes(c)), rand);
  const out = [...must, ...rest].slice(0, k);
  while (out.length < k) out.push(pool[Math.floor(rand() * pool.length)]);
  return out;
}

/**
 * The categories a hidden tile may show as its chip in a round on `target`:
 * never the target, and only categories that some target member and some
 * non-member share in the pool, so no chip settles a tile on its own.
 */
export function chipCategories(target: CatId, pool: Character[] = CHARACTERS) {
  const cats = [...new Set(pool.flatMap((c) => c.cats))].filter((cat) => cat !== target);
  return cats.filter((cat) => pool.some((c) => isIn(c, cat) && isIn(c, target)) && pool.some((c) => isIn(c, cat) && !isIn(c, target)));
}

/** A hidden tile's chip: one of the character's allowed categories, or none. */
function chipFor(c: Character, allowed: CatId[], rand: () => number): CatId | null {
  const options = c.cats.filter((cat) => allowed.includes(cat));
  return options.length ? options[Math.floor(rand() * options.length)] : null;
}

/**
 * Deals a board for `spec` from `seed`, trying layouts until one opens on a
 * zero, leaves at least half the safe tiles hidden and clears by deduction.
 */
export function makeBoard(spec: Spec, seed: number, pool: Character[] = CHARACTERS): Board {
  const { rows, cols, target, bombs: k } = spec;
  const n = rows * cols;
  // A character with no allowed chip shows "?". If every such character sits on
  // one side of the target, "?" would settle a tile, so they sit this round out.
  const allowed = chipCategories(target, pool);
  const bare = pool.filter((c) => !c.cats.some((cat) => allowed.includes(cat)));
  if (bare.length && (bare.every((c) => isIn(c, target)) || bare.every((c) => !isIn(c, target)))) {
    const rest = pool.filter((c) => !bare.includes(c));
    if (rest.filter((c) => isIn(c, target)).length >= k && rest.some((c) => !isIn(c, target))) pool = rest;
  }
  const must = (spec.include ?? []).map((id) => pool.find((c) => c.id === id)!);
  const members = pool.filter((c) => isIn(c, target));
  const others = pool.filter((c) => !isIn(c, target));
  if (members.length < k) throw new Error(`only ${members.length} characters are in ${target}; the round needs ${k}`);
  if (must.filter((c) => isIn(c, target)).length > k) throw new Error(`more required bombs than ${k}`);
  for (let attempt = 0; attempt < 2000; attempt++) {
    const rand = rng(seed + attempt * 7919);
    const bombsAt = new Set(shuffle([...Array(n).keys()], rand).slice(0, k));
    const bomb = [...Array(n).keys()].map((i) => bombsAt.has(i));
    const counts = countClues(bomb, rows, cols);
    const zeros = bomb.map((b, i) => (!b && counts[i] === 0 ? i : -1)).filter((i) => i >= 0);
    if (!zeros.length) continue;
    const start = zeros[Math.floor(rand() * zeros.length)];
    const opening = flood(start, { rows, cols, bomb, counts }, new Set());
    if (opening.length > (n - k) / 2) continue;
    if (!solves({ rows, cols, bomb, counts, opening })) continue;
    const bad = shuffle(draw(members, must.filter((c) => isIn(c, target)), k, rand), rand);
    const good = shuffle(draw(others, must.filter((c) => !isIn(c, target)), n - k, rand), rand);
    const tiles = bomb.map((b) => (b ? bad.pop()! : good.pop()!));
    const chips = tiles.map((c) => chipFor(c, allowed, rand));
    return { rows, cols, target, tiles, bomb, counts, chips, opening, seed };
  }
  throw new Error(`no solvable board for ${target} from seed ${seed}`);
}
