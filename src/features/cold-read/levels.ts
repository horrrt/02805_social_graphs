// The campaign's rules: the five rounds as levels in the order the Week 6
// brief teaches them, how much of each a level plays, and what a skip costs.

/**
 * A round played as one level: the game plays `items` pages, words or
 * matches, then offers "Finish level", which hands its points to onDone.
 * Without a level, a round is the open practice game.
 */
export type Level = { items: number; onDone: (points: number) => void };

export const FINISH = "Finish level";

export type LevelId = "clue" | "groups" | "mix" | "contexts" | "vectors";
export type LevelSpec = { id: LevelId; name: string; topic: string; items: number; goal: string; path: string; blurb: string };
/** A level's outcome: the points it added, or for a skip the points it actually took (less than SKIP_COST near 0). */
export type Result = { points: number; skipped: boolean; lost: number };

export const LEVELS: LevelSpec[] = [
  { id: "clue", name: "Clue Shop", topic: "TF-IDF", items: 3, goal: "Name 3 hidden pages", path: "round-1/", blurb: "Flip word cards from a hidden Marvel page and name it. Rare words clear the board." },
  { id: "groups", name: "Whose Line", topic: "comparing groups", items: 1, goal: "Call one match of 8 words", path: "round-2/", blurb: "Two communities face off. Call which one uses a word more, or spot the one-page fluke." },
  { id: "mix", name: "Mix Desk", topic: "topic models", items: 3, goal: "Mix 3 pages", path: "round-3/", blurb: "Read a page's words and spread ten chips over eight topics to guess its mix." },
  { id: "contexts", name: "Tezgüino", topic: "context and PPMI", items: 4, goal: "Name 4 words from their company", path: "round-4/", blurb: "See only the words near a hidden word. Buy wider windows, PPMI or a peek, then name it." },
  { id: "vectors", name: "Hot & Cold", topic: "word vectors", items: 2, goal: "Find 2 hidden words", path: "round-5/", blurb: "Guess a hidden word. Every guess lands on a radar by its cosine similarity." },
];

export const SKIP_COST = 500;

/** The total after a skip: SKIP_COST less, never below 0. */
export const afterSkip = (total: number) => Math.max(0, total - SKIP_COST);
