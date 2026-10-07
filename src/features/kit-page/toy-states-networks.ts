// Toy inputs for the networks batch's edge states: an empty graph, a lone
// node with no position, every value equal, a self-loop, 2,000 nodes and long
// readout labels. None of it is a result.
import { gnm, gnp, mulberry32, ringLattice } from "@/kit/graph-core";
import type { CanvasLink, CanvasNode, NetCanvasSpec } from "@/kit/NetCanvas";
import type { ReadoutItem } from "@/kit/Readouts";
import type { NetworkSpec } from "@/kit";

const STATES = ["ghost", "picked", "new", "ring"] as const;

// 2,000 nodes and 3,000 links scattered at random positions (seeded).
export function bigSpec(): NetCanvasSpec {
  const rng = mulberry32(2000);
  const nodes: CanvasNode[] = Array.from({ length: 2000 }, (_, i) => ({ id: String(i), x: rng(), y: rng(), value: rng() * 10, group: i % 9 === 8 ? null : i % 8 }));
  const links: CanvasLink[] = (gnm(2000, 3000, rng) as number[][]).map(([a, b], i) => ({ s: String(a), t: String(b), highlight: i < 20 }));
  return { nodes, links, aria: "Toy: 2,000 random nodes and 3,000 random links in a half-width column", height: 300 };
}

// Six nodes with equal values, every state, a self-loop and a link to a node that is not there.
export const directedLoop: NetCanvasSpec = {
  nodes: Array.from({ length: 6 }, (_, i) => ({ id: `n${i}`, value: 1, state: STATES[i % 5] as CanvasNode["state"] })),
  links: [
    { s: "n0", t: "n1", highlight: true },
    { s: "n1", t: "n2" },
    { s: "n2", t: "n2" },
    { s: "n3", t: "n0" },
    { s: "n4", t: "n5", highlight: true },
    { s: "n5", t: "missing" },
  ],
  directed: true,
  color: "sequential",
  aria: "Toy: six nodes with one value, every node state, a self-loop and a link to a missing node",
  height: 240,
};

export const oneNode: NetCanvasSpec = { nodes: [{ id: "alone", value: 3 }], links: [], aria: "Toy: one node with no position", height: 160 };
export const emptyGraph: NetCanvasSpec = { nodes: [], links: [], aria: "Toy: a network with no nodes", height: 160 };

// Small multiples: G(n, p) at three densities and an empty panel.
export function multiples(): NetCanvasSpec[] {
  return [0.02, 0.06, 0.15].map((p, k) => {
    const edges = gnp(40, p, mulberry32(k + 1)) as number[][];
    return {
      title: `p = ${p}`,
      nodes: Array.from({ length: 40 }, (_, i) => ({ id: String(i), group: 4 })),
      links: edges.map(([a, b]) => ({ s: String(a), t: String(b) })),
      aria: `Toy: G(40, ${p})`,
      height: 180,
    };
  }).concat([{ title: "a panel with a very long title that has to wrap inside its column", nodes: [], links: [], aria: "Toy: empty panel", height: 180 }]);
}

// NetworkView with every addition at once: a circle, arrows, equal values, all states, a highlighted subset.
export const viewAll: NetworkSpec = {
  ratio: 0.6,
  layout: "circle",
  directed: true,
  color: "sequential",
  scale: [4, 12],
  nodes: Array.from({ length: 12 }, (_, i) => ({ id: i, x: 0, y: 0, label: `v${i}`, value: 5, state: i < 4 ? STATES[i] : undefined })),
  links: (ringLattice(12, 2) as number[][]).map(([a, b]) => ({ source: a, target: b })).concat([{ source: 3, target: 3 }]),
  highlightLinks: [[0, 1], [1, 2], [11, 0]],
  aria: "Toy: twelve nodes round a circle, every addition on, all values equal",
};

export const readoutsLong: ReadoutItem[] = [
  { label: "A very long label that names exactly what the number underneath it is", value: "1,234,567.891" },
  { label: "Q", value: "0.419", sub: "a note under the value that runs on for a good while" },
  { label: "Empty value", value: "" },
  { label: "Nodes", value: "34" },
  { label: "Links", value: "78" },
  { label: "Communities", value: "4" },
  { label: "Moves", value: "1,374" },
  { label: "Phase", value: "level 3, sweep 12" },
];
