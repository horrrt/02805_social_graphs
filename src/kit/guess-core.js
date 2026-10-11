// The rules under GuessRanker, with no DOM: a reader names words one at a
// time, a scorer ranks the items by those words, and the round is won when the
// target ranks first on its own. Pure functions over plain objects, so
// tests/guess-core.test.mjs runs them in node.
//
//   state = start(12)
//   ({ state, status } = addWord(state, "claws", { banned, score, target }))
//   ranking(score(scored(state)), 10); points(state)

/** A fresh round with `budget` words to spend. */
export function start(budget) {
  return { budget, used: [], won: false };
}

/** The words the scorer sees: every used word that was not banned, in order. */
export function scored(state) {
  return state.used.filter((u) => !u.banned).map((u) => u.word);
}

const entries = (scores) => (scores instanceof Map ? [...scores.entries()] : Object.entries(scores ?? {}));

/**
 * The top `n` items by score, highest first; ties go to the smaller key, so
 * the order never depends on the scorer's insertion order. Each row is
 * { key, score, rank } with rank counted from 1. Takes a Map or a plain object.
 */
export function ranking(scores, n = Infinity) {
  const rows = entries(scores)
    .map(([key, score]) => ({ key: String(key), score: Number(score) || 0 }))
    .sort((a, b) => b.score - a.score || (a.key < b.key ? -1 : a.key > b.key ? 1 : 0));
  return rows.slice(0, n).map((r, i) => ({ ...r, rank: i + 1 }));
}

/** True when `target` ranks first with a score above 0 and above the runner-up's: a tie at the top is not a win. */
export function isWin(rows, target) {
  const [first, second] = rows;
  return Boolean(first && first.key === target && first.score > 0 && (!second || first.score > second.score));
}

/**
 * Spend one word. `word` is what the reader typed; it is trimmed and
 * lowercased here. opts: { banned(word) -> boolean, score(words) -> scores,
 * target }. Returns { state, status }, the state unchanged unless status is
 * "added" or "banned":
 * - "empty": nothing but spaces;
 * - "done": the round is already won or the budget spent;
 * - "repeat": the word was used before;
 * - "banned": the word counts against the budget but is not scored;
 * - "added": the word is scored, and `won` set when score and target are given.
 */
export function addWord(state, word, opts = {}) {
  const w = String(word ?? "").trim().toLowerCase();
  if (!w) return { state, status: "empty" };
  if (state.won || state.used.length >= state.budget) return { state, status: "done" };
  if (state.used.some((u) => u.word === w)) return { state, status: "repeat" };
  const banned = Boolean(opts.banned?.(w));
  const next = { ...state, used: [...state.used, { word: w, banned }] };
  if (!banned && opts.score && opts.target !== undefined) next.won = isWin(ranking(opts.score(scored(next))), String(opts.target));
  return { state: next, status: banned ? "banned" : "added" };
}

/** The words left to spend. */
export function left(state) {
  return Math.max(0, state.budget - state.used.length);
}

/** Points for a won round: one more than the words left, so a win on the last word scores 1; 0 until won. */
export function points(state) {
  return state.won ? left(state) + 1 : 0;
}
