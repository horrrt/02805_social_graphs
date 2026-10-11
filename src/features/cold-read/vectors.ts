// Cold Read, round 5 (Hot & Cold): the rules as pure functions. The data is
// public/play/cold-read/data/hot_cold.json and hot_cold.bin, written by
// analysis/week06_hot_cold.py: unit-length GloVe vectors as int8 rows, one
// scale per row, so a dot product of two decoded rows is their cosine.

export type HotColdMeta = { dims: number; vocab: string[]; scale: number[]; df: number[]; targets: number[] };
export type HotColdData = HotColdMeta & { q: Int8Array; index: Map<string, number> };
export type Guess = { w: string; cos: number; rank: number; hint?: boolean };
export type Heat = "found" | "burning" | "hot" | "warm" | "cool" | "cold";

/** Hints reveal the hidden word's neighbours at these ranks, far to near. */
export const HINT_RANKS = [100, 30, 10, 3];
export const HINT_COST = 200;
export const MAX_STREAK = 5;

export function prepare(meta: HotColdMeta, buffer: ArrayBuffer): HotColdData {
  return { ...meta, q: new Int8Array(buffer), index: new Map(meta.vocab.map((w, i) => [w, i])) };
}

/** Cosine of every vocabulary word with word t. */
export function cosinesTo(data: HotColdData, t: number): Float64Array {
  const { dims: D, q, scale } = data;
  const out = new Float64Array(data.vocab.length);
  const base = t * D;
  for (let i = 0; i < out.length; i++) {
    let dot = 0;
    const row = i * D;
    for (let j = 0; j < D; j++) dot += q[row + j] * q[base + j];
    out[i] = dot * scale[i] * scale[t];
  }
  return out;
}

/** Each word's rank by cosine with the hidden word: the hidden word is 0, its nearest neighbour 1. */
export function ranks(cos: Float64Array, t: number): Int32Array {
  const order = Array.from(cos.keys()).sort((a, b) => (a === t ? -1 : b === t ? 1 : cos[b] - cos[a] || a - b));
  const rank = new Int32Array(cos.length);
  order.forEach((i, r) => {
    rank[i] = r;
  });
  return rank;
}

export function heat(rank: number): Heat {
  if (rank === 0) return "found";
  if (rank <= 10) return "burning";
  if (rank <= 100) return "hot";
  if (rank <= 500) return "warm";
  if (rank <= 2000) return "cool";
  return "cold";
}

/** The word at a rank: the hint for HINT_RANKS[n]. */
export const atRank = (rank: Int32Array, r: number) => rank.indexOf(r);

/**
 * Points for finding the word: 1,000, minus 30 per guess after the first and
 * 200 per hint, at least 100, times the streak (words found in a row without
 * giving up, this one included, up to MAX_STREAK).
 */
export function points(guesses: number, hints: number, streak = 1) {
  const base = Math.max(100, 1000 - 30 * Math.max(guesses - 1, 0) - HINT_COST * hints);
  return base * Math.min(Math.max(streak, 1), MAX_STREAK);
}

/** Where a guess sits on the radar: distance grows with log rank, angle comes from the word. */
export function radarPoint(w: string, rank: number, size: number, radius: number) {
  let h = 2166136261;
  for (const c of w) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  const angle = ((h >>> 0) % 360) * (Math.PI / 180);
  const r = (Math.log(rank + 1) / Math.log(size + 1)) * radius;
  return { x: Math.cos(angle) * r, y: Math.sin(angle) * r };
}

/** The radar's ring radius for a rank, on the same log scale. */
export const ringRadius = (rank: number, size: number, radius: number) => (Math.log(rank + 1) / Math.log(size + 1)) * radius;
