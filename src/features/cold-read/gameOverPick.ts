// Which game-over card plays: a weighted draw that keeps the last RECENT cards
// in this browser and gives each of them a tenth of a fresh card's weight. A
// recent card can still come back, just rarely: with 145 cards, about 1 game
// over in 27 repeats one of the last 40, and the card just seen returns about
// 1 time in 1,000.
const KEY = "cold-read:game-over-recent";
export const RECENT = 40;
export const RECENT_WEIGHT = 0.1;

/** A card from 1 to `count`, drawn with `recent` (newest last) down-weighted. */
export function pickCard(count: number, recent: number[], random: () => number = Math.random): number {
  const seen = new Set(recent);
  const weight = (n: number) => (seen.has(n) ? RECENT_WEIGHT : 1);
  let total = 0;
  for (let n = 1; n <= count; n++) total += weight(n);
  let r = random() * total;
  for (let n = 1; n <= count; n++) {
    r -= weight(n);
    if (r < 0) return n;
  }
  return count;
}

/** `recent` with `card` moved to the end, cut to the last RECENT. */
export const remember = (recent: number[], card: number) => [...recent.filter((n) => n !== card), card].slice(-RECENT);

function readRecent(): number[] {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    return Array.isArray(saved) ? saved.filter((n) => Number.isInteger(n)) : [];
  } catch {
    return [];
  }
}

/** Picks the next card and keeps it in the recent list. */
export function nextCard(count: number, random: () => number = Math.random): number {
  const recent = readRecent();
  const card = pickCard(count, recent, random);
  try {
    localStorage.setItem(KEY, JSON.stringify(remember(recent, card)));
  } catch {
    // Storage blocked: every game over draws from the full deck.
  }
  return card;
}
