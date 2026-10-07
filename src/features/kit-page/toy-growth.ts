// Toy inputs for the growth batch's demos: BA graphs from the seeded models in
// src/kit/graph-core.js, toy names and toy debut years. None of it is a result.
import { ba, gnp, mulberry32 } from "@/kit/graph-core";
import { hubStats, rankBy } from "@/kit/growth-core.js";
import type { GrowthMode } from "@/kit/GrowthReplay";

type Edge = [number, number];

const FIRST = ["Iron", "Night", "Silver", "Star", "Storm", "Shadow", "Crimson", "Atom", "Frost", "Solar", "Echo", "Quantum"];
const LAST = ["Wasp", "Falcon", "Lynx", "Comet", "Warden", "Spark", "Oracle", "Viper", "Titan", "Raven", "Golem", "Nova"];
/** Toy hero names, one per node. */
export const toyName = (v: number) => `${FIRST[v % FIRST.length]} ${LAST[Math.floor(v / FIRST.length) % LAST.length]}${v >= FIRST.length * LAST.length ? ` ${Math.floor(v / (FIRST.length * LAST.length)) + 1}` : ""}`;

export const REPLAY_N = 150;
const pa = ba(REPLAY_N, 2, {}, mulberry32(11));
const uniform = ba(REPLAY_N, 2, { alpha: 0 }, mulberry32(11));

// Toy debut years, 1939 to 2020: drawn at random, so in the "real order" the
// network's hubs need not be the first to arrive.
const yearRng = mulberry32(1939);
export const toyYears: number[] = Array.from({ length: REPLAY_N }, () => 1939 + Math.floor(yearRng() * yearRng() * 82));

export const replayModes: GrowthMode[] = [
  {
    key: "real",
    label: "Toy debuts, 1939 → 2020",
    n: REPLAY_N,
    edges: pa.edges as Edge[],
    rank: rankBy(toyYears),
    note: "One fixed toy network, replayed in the order of its toy debut years: each link appears once both its ends have debuted.",
  },
  { key: "pa", label: "Preferential attachment", n: REPLAY_N, edges: pa.edges as Edge[], note: "Barabási–Albert, m = 2: each newcomer links to two nodes, picked in proportion to their links." },
  { key: "uniform", label: "Growth without preference", n: REPLAY_N, edges: uniform.edges as Edge[], note: "Each newcomer links to two nodes picked uniformly: growth, but no preference." },
];

export const replayCard = (v: number, mode: string) => ({
  title: toyName(v),
  line: mode === "real" ? `Toy debut ${toyYears[v]}.` : `Arrival ${v + 1} in the model.`,
});

// The lab's reference: a toy network of 303 nodes, and its biggest hub's share.
const refGraph = ba(303, 3, { alpha: 1.1 }, mulberry32(303));
export const labReference = { name: "toy reference, 303 nodes", ks: refGraph.degree as number[] };
const refHub = hubStats(refGraph.degree, refGraph.edges.length);
export const labRefShare = { label: `toy reference hub: ${refHub.k} of ${refGraph.edges.length} links`, share: refHub.share as number };

// The gallery: a sparse G(n, p), so many small components and some isolated nodes.
export const GALLERY_N = 90;
export const galleryEdges = gnp(GALLERY_N, 0.022, mulberry32(90)) as Edge[];
export const galleryNames = Array.from({ length: GALLERY_N }, (_, v) => toyName(v));

// The paradox: a scale-free and a random network of the same size and about the same links.
const sf = ba(300, 2, {}, mulberry32(4));
export const paradoxNets = {
  "scale-free": { edges: sf.edges as Edge[], note: "Barabási–Albert, 300 nodes, m = 2." },
  random: { edges: gnp(300, (2 * sf.edges.length) / (300 * 299), mulberry32(5)) as Edge[], note: "G(n, p) with the same mean degree." },
};
export type ParadoxNet = keyof typeof paradoxNets;
