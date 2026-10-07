// The editors batch's awkward cases for the edge-state page: an empty tree, a
// forest with long labels, a wide tree with no room for labels, matrices of
// nothing, one cell and twelve long names, a lone node, a crowded ego network,
// a puzzle with too few nodes, long pipelines and stages, and a crowded
// detail panel. All toys.
import type { DetailItem, FlowStep, Merge, PickerGraph, Stage } from "@/kit";
import { mulberry32 } from "@/kit/graph-core";

const LONG = "a very long label that will not fit anywhere sensible";

/** Eight leaves in three trees: (0 1 2), (3 4) and five singletons merged at equal heights; long labels. */
export const forest = {
  n: 8,
  merges: [
    { a: 0, b: 1, h: 2 },
    { a: 8, b: 2, h: 2 },
    { a: 3, b: 4, h: 2 },
  ] as Merge[],
  labels: ["Wolverine (character)", "Spider-Man (Marvel Mangaverse)", "x", LONG, "Hulk", "", "Rom the Space Knight", "Mahr Vehl"],
};

/** 120 leaves joined at random (seeded), so no leaf label fits. */
export function wideTree(): { n: number; merges: Merge[] } {
  const rng = mulberry32(5);
  const n = 120;
  const live = Array.from({ length: n }, (_, i) => i);
  const merges: Merge[] = [];
  let h = 0;
  while (live.length > 1) {
    const a = live.splice(Math.floor(rng() * live.length), 1)[0];
    const b = live.splice(Math.floor(rng() * live.length), 1)[0];
    h += rng();
    merges.push({ a, b, h });
    live.push(n + merges.length - 1);
  }
  return { n, merges };
}

export const WIDE_LABELS = Array.from({ length: 12 }, (_, i) => (i === 3 ? LONG : `Person ${i + 1}`));
/** Twelve rows: junk, negatives, decimals and a self-loop. */
export const WIDE_MATRIX = Array.from({ length: 12 }, (_, i) => Array.from({ length: 12 }, (_, j) => (i === j ? (i === 0 ? 5 : 0) : (i * 7 + j * 3) % 11 === 0 ? -2.5 : (i + j) % 5 === 0 ? 12345.678 : 0)));

export const crowdedEgo = Array.from({ length: 16 }, (_, i) => String.fromCharCode(66 + i));

/** Three nodes for a five-pick puzzle. */
export const tinyPuzzle = (): PickerGraph => ({
  nodes: [
    { id: 0, x: 0.2, y: 0.3, label: "A" },
    { id: 1, x: 0.5, y: 0.1, label: "B" },
    { id: 2, x: 0.8, y: 0.4, label: "C" },
  ],
  links: [{ source: 0, target: 1 }],
});

export const longFlow: FlowStep[] = [
  { title: LONG.repeat(2), body: "A body that runs on and on ".repeat(6), transition: `${LONG} as a transition` },
  { title: "No body, no example" },
  { title: "Only an example", example: "averyveryverylongwordwithnospacesthatmustwrapsomewhereinsteadofspillingoutofitscolumn".repeat(2), exampleTitle: LONG },
];

export const manyStages: Stage[] = Array.from({ length: 12 }, (_, i) => ({
  key: `s${i}`,
  title: i === 2 ? LONG : `Stage ${i + 1}`,
  fields: i === 2 ? { [LONG]: LONG.repeat(3), Empty: "" } : i % 2 ? {} : { Representation: `step ${i + 1}` },
}));

export const longItems: DetailItem[] = Array.from({ length: 6 }, (_, i) => ({ title: i === 0 ? LONG.repeat(2) : `Item ${i + 1}`, text: i % 2 ? undefined : "A made-up description ".repeat(8) }));
export const longWords = ["supercalifragilisticexpialidocious", "x", LONG, "word", "another-long-hyphenated-compound-word-here", "a", "b", "c", "d", "e", "f", "g"];
