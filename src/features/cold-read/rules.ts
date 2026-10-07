// Cold Read, round 1 (Clue Shop): the game's rules as pure functions, so the
// component only renders and tests need no DOM. The data is
// public/play/cold-read/data/clue_shop.json, written by
// analysis/week06_cold_read.py.

export type Kind = "loud" | "mid" | "sharp";
export type Card = { w: string; kind: Kind; n: number };
export type Word = { df: number; name: 0 | 1; post: [number, number][] };
export type Round = { page: number; on: Card[]; off: Card[] };
export type ClueShopData = {
  N: number;
  pages: { name: string; tokens: number }[];
  rounds: Round[];
  words: Record<string, Word>;
};

export const LIVES = 3;
export const SHORTLIST = 5;

/** ln(N / df), the brief's IDF. */
export const idf = (data: ClueShopData, w: string) => Math.log(data.N / data.words[w].df);

/** The brief's TF-IDF of a card on the hidden page: count / page length x ln(N / df). */
export function tfidf(data: ClueShopData, round: Round, card: Card) {
  return (card.n / data.pages[round.page].tokens) * idf(data, card.w);
}

/**
 * Cosine similarity between the flipped words, as a query weighted by IDF,
 * and every page's TF-IDF vector. Each posting already holds the page's
 * unit-vector entry, so a page's score is the sum over flipped words of
 * idf x entry, divided by the query's length.
 */
export function cosines(data: ClueShopData, flipped: string[]): Float64Array {
  const score = new Float64Array(data.N);
  let norm = 0;
  for (const w of flipped) {
    const q = idf(data, w);
    norm += q * q;
    for (const [page, x] of data.words[w].post) score[page] += q * x;
  }
  if (norm > 0) for (let i = 0; i < score.length; i++) score[i] /= Math.sqrt(norm);
  return score;
}

/** How many pages use every flipped word: 303 before any flip. */
export function pagesWithAll(data: ClueShopData, flipped: string[]) {
  // A word on every page rules nothing out, so only the others narrow the set.
  const sets = flipped.filter((w) => data.words[w].df < data.N).map((w) => new Set(data.words[w].post.map(([p]) => p)));
  if (sets.length === 0) return data.N;
  return [...sets[0]].filter((p) => sets.every((s) => s.has(p))).length;
}

/** The top pages by cosine, best first, leaving out struck pages and pages scoring 0. */
export function shortlist(data: ClueShopData, flipped: string[], struck: number[], size = SHORTLIST) {
  const score = cosines(data, flipped);
  const out: { page: number; cos: number }[] = [];
  score.forEach((cos, page) => {
    if (cos > 0 && !struck.includes(page)) out.push({ page, cos });
  });
  return out.sort((a, b) => b.cos - a.cos || a.page - b.page).slice(0, size);
}

/** Points for naming the page: 100, plus 100 per card left face down, doubled with names hidden. */
export function points(cardsLeft: number, namesHidden: boolean) {
  return (100 + 100 * cardsLeft) * (namesHidden ? 2 : 1);
}

/** A fresh order of the playable rounds, so a run never repeats a page. */
export function shuffled<T>(items: T[], random: () => number = Math.random): T[] {
  const out = items.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
