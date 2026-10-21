// The Week 7 campaign's levels: this week's games in the order the brief
// teaches their sections, and how much of each a level plays. The level
// contract, the skip cost and the scoring rules are Cold Read's (levels.ts there).

export type LevelId = "same-word" | "two-stripes" | "sentiment-trap" | "semantic-minefield";
export type LevelSpec = { id: LevelId; name: string; topic: string; items: number; goal: string; path: string };

export const LEVELS: LevelSpec[] = [
  { id: "same-word", name: "Same Word", topic: "static and contextual vectors", items: 6, goal: "Play 6 word pairs", path: "same-word/" },
  { id: "two-stripes", name: "Two Stripes", topic: "corpus maps", items: 3, goal: "Find 3 nearest pages", path: "two-stripes/" },
  { id: "sentiment-trap", name: "Sentiment Trap", topic: "sentiment as a measurement", items: 4, goal: "Judge 4 sentiment scores", path: "sentiment-trap/" },
  { id: "semantic-minefield", name: "Semantic Minefield", topic: "search by meaning", items: 3, goal: "Sweep 3 boards", path: "semantic-minefield/" },
];
