// Toy inputs for the growth batch's edge states: one node, no modes, a mode
// with no nodes, one component, many tiny components, empty groups and a
// network with no links. None of it is a result.
import { mulberry32, ringLattice } from "@/kit/graph-core";
import type { GrowthMode } from "@/kit/GrowthReplay";

type Edge = [number, number];

export const oneNodeModes: GrowthMode[] = [{ key: "one", label: "One node", n: 1, edges: [] }];

export const emptyModeFirst: GrowthMode[] = [
  { key: "none", label: "A mode with no nodes", n: 0, edges: [] },
  { key: "pair", label: "Two nodes, a self-loop and a link", n: 2, edges: [[0, 1], [1, 1]] },
];

export const longCard = (v: number) => ({
  title: `A toy character with a very long name that has to wrap inside the arrival card, number ${v + 1}`,
  line: "A line under it that also runs on for a good while, so the card has to hold two long lines.",
});

/** One component: a ring of 24 with second neighbours. */
export const ringEdges = ringLattice(24, 4) as Edge[];

/** 240 nodes: 50 pairs, 20 triangles and 80 isolated nodes, shuffled ids. */
export function tinyComponents(): { n: number; edges: Edge[] } {
  const n = 240;
  const rng = mulberry32(240);
  const ids = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [ids[i], ids[j]] = [ids[j], ids[i]];
  }
  const edges: Edge[] = [];
  let at = 0;
  for (let p = 0; p < 50; p++, at += 2) edges.push([ids[at], ids[at + 1]]);
  for (let t = 0; t < 20; t++, at += 3) edges.push([ids[at], ids[at + 1]], [ids[at + 1], ids[at + 2]], [ids[at], ids[at + 2]]);
  return { n, edges };
}

export const groupCase = {
  n: 6,
  edges: [[0, 1], [1, 2], [3, 4]] as Edge[],
  groups: [
    { title: "A group with a very long title that has to wrap inside its tile", nodes: [0, 1, 2] },
    { title: "One member", nodes: [5] },
    { title: "Nobody", nodes: [] },
    { title: "Ids out of range", nodes: [4, 99, -1] },
  ],
};
