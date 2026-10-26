// The Week 7 campaign's levels: one game per section of the brief, in the order
// it teaches them, and how much of each a level plays. Two games on one section
// would teach it twice, so Semantic Minefield (section 6, like Search Detective)
// stays a game of its own. `path` is each game's own page, relative to the
// campaign's. The level contract, the skip cost and the scoring rules are Cold
// Read's (levels.ts there).

export type LevelId = "same-word" | "two-stripes" | "topic-tetris" | "sentiment-trap" | "search-detective";
export type LevelSpec = { id: LevelId; section: number; name: string; topic: string; items: number; goal: string; path: string };

export const LEVELS: LevelSpec[] = [
  { id: "same-word", section: 1, name: "Same Word", topic: "static and contextual vectors", items: 6, goal: "Play 6 word pairs", path: "same-word/" },
  { id: "two-stripes", section: 2, name: "Two Stripes", topic: "corpus maps", items: 3, goal: "Find 3 nearest pages", path: "two-stripes/" },
  { id: "topic-tetris", section: 3, name: "Topic Tetris", topic: "three ways to group a corpus", items: 3, goal: "Group the same pages 3 ways", path: "../topic-tetris/" },
  { id: "sentiment-trap", section: 4, name: "Sentiment Trap", topic: "sentiment as a measurement", items: 4, goal: "Judge 4 sentiment scores", path: "sentiment-trap/" },
  { id: "search-detective", section: 6, name: "Search Detective", topic: "search by meaning", items: 6, goal: "Solve 6 search cases", path: "../search-detective/" },
];
