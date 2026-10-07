// Cold Read, round 3 (Mix Desk): the rules as pure functions. The data is
// public/play/cold-read/data/mix_desk.json, written by
// analysis/week06_mix_desk.py: the brief's LDA (8 topics, names removed),
// each topic's top words, and for each playable page its topic mixture and
// its most used words, each tagged with the topic most likely to produce it.

export type MixPage = { name: string; theta: number[]; words: [string, number, number][] };
export type MixDeskData = { K: number; vocab: number; topics: { words: [string, number][] }[]; pages: MixPage[] };

export const CHIPS = 10;
export const PAGES_PER_RUN = 6;

/** Total variation distance between the chips (as shares) and the page's mixture: 0 is a perfect read, 1 the worst. */
export function distance(chips: number[], theta: number[]) {
  const total = chips.reduce((a, b) => a + b, 0) || 1;
  return 0.5 * theta.reduce((s, x, k) => s + Math.abs((chips[k] ?? 0) / total - x), 0);
}

/** Points for a read: 1,000 times one minus the distance, rounded. */
export const score = (chips: number[], theta: number[]) => Math.round(1000 * (1 - distance(chips, theta)));

export function grade(points: number) {
  if (points >= 850) return "Perfect read";
  if (points >= 700) return "Sharp read";
  if (points >= 500) return "Half read";
  return "Misread";
}

/** The best possible chips: theta rounded to tenths by largest remainder, so they sum to CHIPS. */
export function bestChips(theta: number[]) {
  const raw = theta.map((x) => x * CHIPS);
  const chips = raw.map(Math.floor);
  const order = raw.map((x, k) => [x - Math.floor(x), k]).sort((a, b) => b[0] - a[0]);
  const missing = CHIPS - chips.reduce((a, b) => a + b, 0);
  for (let i = 0; i < missing; i++) chips[order[i][1]] += 1;
  return chips;
}

/** A word chip's size bucket, 1 to 4, by its count on the page relative to the page's most used word. */
export function sizeBucket(count: number, max: number) {
  const r = count / max;
  return r > 0.6 ? 4 : r > 0.35 ? 3 : r > 0.18 ? 2 : 1;
}
