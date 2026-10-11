// The toy numbers the kit page's demos draw, as src/scripts/pages/kit.js held
// them. None of them is a result.
import type { StripOptions, StripRow } from "@/kit/StripChart";
import type { KwicRow } from "@/kit/Concordance";
import type { TableSpec } from "@/kit/Table";
import type { AnalogyPoints, GuessItem, MapPoint, MixPart, RankedRow, SplitPart, SplitRow } from "@/kit";

export const toy = [
  { word: "the", count: 900 },
  { word: "of", count: 520 },
  { word: "marvel", count: 310 },
  { word: "comics", count: 280 },
  { word: "power", count: 90 },
];

export const toyOption = {
  xAxis: { type: "category", data: toy.map((r) => r.word), name: "word" },
  yAxis: { type: "value", name: "count (toy)" },
  series: [{ type: "bar", data: toy.map((r) => r.count), label: { show: true, position: "top" } }],
};

export const toyCaption = "Toy counts. Each bar is one word; taller bars are more frequent.";

export const toyTable: TableSpec = {
  columns: [{ key: "word", label: "Word" }, { key: "count", label: "Count", num: true }],
  rows: toy,
};

export const stripRows: StripRow[] = [
  { label: "Toy result", real: 0.62, realLabel: "0.62", base: [0.41, 0.03], baseLabel: "toy baseline 0.41 ± 0.03" },
  { label: "Second toy row", real: 0.2, realLabel: "0.20", base: [0.22, 0.05], baseLabel: "0.22 ± 0.05" },
];

export const stripOpts: StripOptions = {
  domain: [0, 1],
  ticks: [0, 0.5, 1],
  fmt: (v) => v.toFixed(1),
  aria: "Toy strip chart: two results against their baselines",
};

export const kwicRows: KwicRow[] = [
  { page: "Thor_(Marvel_Comics)", left: "toy text before the word ", hit: "power", right: " toy text after the word" },
  { page: "Storm_(Marvel_Comics)", left: "another made-up left context ", hit: "power", right: " and a right context" },
];

export const passage = { page: "Thor_(Marvel_Comics)", text: "Toy passage: a made-up sentence that mentions power twice, power.", highlight: "power" };

export const term = {
  text: "A hapax is a word that occurs exactly once in the corpus.",
  phrase: "hapax",
  definition: "A type observed exactly once in the corpus.",
  id: "kit-term-hapax",
};

// The text explorables' toys. Made-up words and numbers, chosen to show each
// component's idea; none is a result.

export const vecA: [number, number] = [4, 1];
export const vecB: [number, number] = [1, 3];

export const splitParts: SplitPart[] = [
  { name: "names", color: "--people" },
  { name: "habit words", color: "--w4-group-0" },
  { name: "everything else", color: "--access" },
];

export const splitRows: SplitRow[] = [
  { key: "torch", label: "Toy page A", sub: "same team", parts: [0.27, 0.01, 0.03], value: 0.31, valueLabel: "0.31", status: { text: "not linked", tone: "bad" } },
  { key: "panther", label: "Toy page B", sub: "same city", parts: [0.2, 0.01, 0.03], value: 0.24, valueLabel: "0.24", status: { text: "linked", tone: "good" } },
  { key: "cyclops", label: "Toy page C", parts: [0.14, 0.01, 0.04], value: 0.19, valueLabel: "0.19", status: { text: "linked", tone: "good" } },
  { key: "grey", label: "Toy page D", parts: [0.1, 0.03, 0.02], value: 0.15, valueLabel: "0.15" },
];

export const sweepPoints: [number, number][] = [[0, 2], [10, 2.2], [25, 2.7], [40, 3.2], [50, 3.5], [60, 3.7], [75, 3.85], [90, 3.95], [100, 4]];

export const sentence = ["the", "puppy", "chased", "the", "ball", "through", "the", "park"];
export const negatives = ["cloud", "window", "budget", "river"];

export const matrixRows = ["wine", "bourbon", "tea"];
export const matrixCols = ["bottle", "corn", "drink", "glass", "hot", "make", "we"];
export const matrixCells = [
  [3, 0, 2, 4, 0, 1, 1],
  [2, 3, 2, 1, 0, 2, 0],
  [0, 0, 3, 0, 4, 1, 2],
];

export const mixParts: MixPart[] = [
  { label: "Crime", share: 0.62 },
  { label: "Mutants", share: 0.08 },
  { label: "Space", share: 0.3 },
];

export const mixWords: Record<string, [string, number][]> = {
  Crime: [["crime", 0.16], ["gang", 0.14], ["police", 0.12], ["lawyer", 0.1], ["street", 0.09]],
  Mutants: [["mutant", 0.2], ["school", 0.11], ["gene", 0.08]],
  Space: [["planet", 0.18], ["cosmic", 0.15], ["empire", 0.07], ["star", 0.06]],
};

export const rankedBase: Omit<RankedRow, "muted" | "onClick">[] = [
  { key: "toyname", label: "toyname", value: 0.31, cols: ["196×", "83 of 303"] },
  { key: "adamantium", label: "adamantium", value: 0.12, cols: ["19×", "14 of 303"] },
  { key: "canadian", label: "canadian", value: 0.1, cols: ["19×", "17 of 303"] },
  { key: "claws", label: "claws", value: 0.08, cols: ["17×", "26 of 303"] },
  { key: "samurai", label: "samurai", value: 0.07, cols: ["9×", "7 of 303"] },
];
export const rankedNames = new Set(["toyname", "canadian"]);

// A small deterministic cloud for AxisMap: points on a spiral, three groups.
export const mapPoints: MapPoint[] = Array.from({ length: 40 }, (_, i) => {
  const t = i * 0.55;
  const r = 0.2 + i * 0.045;
  return { key: `p${i}`, label: `Toy point ${i + 1}`, x: +(r * Math.cos(t)).toFixed(3), y: +(r * Math.sin(t)).toFixed(3), size: 1 + (i % 7), group: ["first", "second", "third"][i % 3] };
});
export const mapAxes = { left: "science", right: "magic", bottom: "street", top: "cosmic" };
export const mapHighlight = ["p5", "p18", "p33"];

export const analogy: AnalogyPoints = {
  a: { label: "man", x: 1, y: 1 },
  b: { label: "woman", x: 1.2, y: 3 },
  c: { label: "king", x: 4, y: 1.2 },
  d: { label: "queen", x: 4.6, y: 3.0 },
};

// GuessRanker's toy: each item lists the words that describe it; an item
// scores the share of the reader's words it lists, over √(words said).
const DESCRIBE: Record<string, string[]> = {
  wolverine: ["claws", "canadian", "healing", "adamantium", "samurai", "berserker"],
  storm: ["weather", "lightning", "africa", "goddess", "wind"],
  thor: ["hammer", "lightning", "asgard", "god", "thunder"],
  strange: ["magic", "sorcerer", "surgeon", "cloak", "dimension"],
  hulk: ["green", "rage", "gamma", "smash", "scientist"],
  panther: ["king", "africa", "vibranium", "suit", "claws"],
};
export const guessItems: GuessItem[] = [
  { key: "wolverine", label: "Wolverine" },
  { key: "storm", label: "Storm" },
  { key: "thor", label: "Thor" },
  { key: "strange", label: "Doctor Strange" },
  { key: "hulk", label: "Hulk" },
  { key: "panther", label: "Black Panther" },
];
export const guessScore = (words: string[]) =>
  Object.fromEntries(Object.entries(DESCRIBE).map(([k, ws]) => [k, words.filter((w) => ws.includes(w)).length / Math.sqrt(words.length || 1)]));
export const guessBanned = (w: string) => w === "wolverine" || w === "logan";
