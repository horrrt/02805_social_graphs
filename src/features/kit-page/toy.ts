// The toy numbers the kit page's demos draw, as src/scripts/pages/kit.js held
// them. None of them is a result.
import type { StripOptions, StripRow } from "@/kit/StripChart";
import type { KwicRow } from "@/kit/Concordance";
import type { TableSpec } from "@/kit/Table";

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
