// The toy numbers the kit page's "Distributions and nulls" demos draw. Every
// random draw comes from a seeded generator, so each build draws the same
// toys. None of them is a result.
import type { BoardAxis, BoardCell, DistView, NullBarRow, RefCurve } from "@/kit";
import { binnedPk, ccdf, degrees, envelope, poissonCurve, rankFrequency, rawPk, zipfIdeal } from "@/kit/dist-core.js";

/** mulberry32: a small seeded generator of uniform numbers in [0, 1). */
export function seeded(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A normal draw by Box–Muller. */
const normal = (rand: () => number, mean: number, sd: number) => mean + sd * Math.sqrt(-2 * Math.log(1 - rand())) * Math.cos(2 * Math.PI * rand());

/**
 * A toy growing network, preferential attachment as in Barabási–Albert: each
 * new node links to `m` distinct older nodes (or 1–4 of them when `m` is
 * "mixed"), picked in proportion to their degree. Edges point new → old.
 */
export function growNetwork(n: number, m: number | "mixed", seed: number): [number, number][] {
  const rand = seeded(seed);
  const edges: [number, number][] = [];
  const ends: number[] = [];
  const start = 5;
  for (let i = 0; i < start; i++)
    for (let j = 0; j < i; j++) {
      edges.push([i, j]);
      ends.push(i, j);
    }
  for (let v = start; v < n; v++) {
    const k = m === "mixed" ? 1 + Math.floor(rand() * 4) : m;
    const picked = new Set<number>();
    while (picked.size < Math.min(k, v)) picked.add(ends[Math.floor(rand() * ends.length)]);
    for (const u of picked) {
      edges.push([v, u]);
      ends.push(v, u);
    }
  }
  return edges;
}

const N = 300;
const NODES = Array.from({ length: N }, (_, i) => i);

// ---- a degree distribution against the Poisson of the same mean

export const degreeEdges = growNetwork(N, "mixed", 7);
export type DegreeMode = "in" | "out" | "undirected";
export const degreeSets: Record<DegreeMode, number[]> = {
  in: degrees(degreeEdges, { nodes: NODES, mode: "in" }),
  out: degrees(degreeEdges, { nodes: NODES, mode: "out" }),
  undirected: degrees(degreeEdges, { nodes: NODES }),
};

const mean = (ks: number[]) => ks.reduce((s, k) => s + k, 0) / ks.length;

/** The Poisson with the same mean as `ks`, in the form the view needs: the pmf, or its CCDF. */
export function poissonRef(ks: number[], view: DistView): RefCurve[] {
  const lambda = mean(ks);
  const pmf = poissonCurve(lambda, Math.max(...ks, 10)) as [number, number][];
  let left = 1;
  const points: [number, number][] =
    view === "ccdf"
      ? pmf.map(([k, p]) => {
          const at: [number, number] = [k, Math.max(0, left)];
          left -= p;
          return at;
        })
      : pmf;
  return [{ key: "poisson", name: `Poisson, same mean ⟨k⟩ = ${lambda.toFixed(1)}`, points: points.filter(([, p]) => p >= 1e-4) }];
}

/** The ten toy nodes with the highest degree, named. */
export function topNodes(ks: number[]) {
  return ks
    .map((k, i) => ({ i, k }))
    .sort((a, b) => b.k - a.k || a.i - b.i)
    .slice(0, 8)
    .map(({ i, k }) => ({ label: `Toy node ${i}`, value: k }));
}

// ---- Zipf: ideal against a toy corpus

const ZIPF_WORDS = ["the", "of", "and", "to", "a", "in", "hero", "that", "was", "his", "power", "team", "with", "for", "city"];

/** Toy word counts: 400 types drawn around 6,000 / r with seeded noise, so ties appear in the tail. */
export const zipfCounts: Record<string, number> = (() => {
  const rand = seeded(11);
  const out: Record<string, number> = {};
  for (let r = 1; r <= 400; r++) out[ZIPF_WORDS[r - 1] ?? `word${r}`] = Math.max(1, Math.round((6000 / r ** 1.08) * Math.exp(normal(rand, 0, 0.15))));
  return out;
})();

export const zipfObserved = rankFrequency(zipfCounts).points as [number, number][];
export const zipfTop = Object.entries(zipfCounts)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 8)
  .map(([w, c]) => ({ label: w, value: c.toLocaleString("en-GB") }));

/** The ideal Zipf curve through the top count, for exponent s. */
export const zipfRef = (s: number): RefCurve[] => [{ key: "ideal", name: `ideal Zipf, s = ${s.toFixed(2)}`, points: zipfIdeal(400, s, zipfObserved[0]?.[1] ?? 1) as [number, number][] }];

// ---- a BA-like ensemble: 40 runs, and one more run drawn as points

const RUNS = Array.from({ length: 40 }, (_, i) => degrees(growNetwork(N, 2, 100 + i), { nodes: NODES }));
export const baOne = degrees(growNetwork(N, 2, 99), { nodes: NODES });
const ENVELOPES = {
  raw: envelope(RUNS.map((ks) => rawPk(ks) as [number, number][])),
  binned: envelope(RUNS.map((ks) => binnedPk(ks))),
  ccdf: envelope(RUNS.map((ks) => ccdf(ks) as [number, number][]), { missing: "ccdf" }),
};
export const baEnvelope = (view: DistView) => [{ key: "ba", name: "40 runs of preferential attachment, m = 2", rows: ENVELOPES[view] }];

// ---- a shuffle test: 1,000 toy shuffles of average clustering

export const shuffleReal = 0.302;
export const shuffleSamples: number[] = (() => {
  const rand = seeded(23);
  return Array.from({ length: 1000 }, () => normal(rand, 0.262, 0.016));
})();

// ---- the survivor board: four measures under three null models

export const boardMeasures: BoardAxis[] = [
  { key: "C", label: "Average clustering" },
  { key: "L", label: "Mean distance" },
  { key: "r", label: "Degree assortativity" },
  { key: "kmax", label: "Largest degree" },
];
export const boardModels: BoardAxis[] = [
  { key: "gnm", label: "G(n, m)" },
  { key: "config", label: "Degree-preserving shuffle" },
  { key: "sbm", label: "Group-preserving shuffle" },
];

// [real, null mean, null sd] per measure × model; sd 0 is a null that holds the measure fixed.
const BOARD: Record<string, [number, number, number][]> = {
  C: [[0.32, 0.019, 0.003], [0.32, 0.27, 0.018], [0.32, 0.31, 0.012]],
  L: [[2.61, 3.05, 0.04], [2.61, 2.58, 0.03], [2.61, 2.64, 0.03]],
  r: [[-0.21, 0.0, 0.03], [-0.21, -0.17, 0.02], [-0.21, -0.2, 0.025]],
  kmax: [[106, 17, 1.6], [106, 106, 0], [106, 61, 7]],
};

/** The board's cells: 300 seeded draws per cell from its null. */
export function boardCells(table: Record<string, [number, number, number][]> = BOARD, measures = boardMeasures, models = boardModels, seed = 31): BoardCell[] {
  const rand = seeded(seed);
  return measures.flatMap((ms) =>
    models.flatMap((md, j) => {
      const row = table[ms.key]?.[j];
      if (!row) return [];
      const [real, m, sd] = row;
      return [{ measure: ms.key, model: md.key, real, samples: Array.from({ length: 300 }, () => (sd ? normal(rand, m, sd) : m)) }];
    }),
  );
}

// ---- links by type against a label shuffle

const LINKS: [string, string, number, number, number][] = [
  ["hh", "hero – hero", 412, 330, 14],
  ["hv", "hero – villain", 268, 301, 13],
  ["vv", "villain – villain", 95, 71, 7],
  ["ht", "hero – team", 140, 138, 9],
  ["vt", "villain – team", 22, 41, 5],
];

export const linkRows: NullBarRow[] = (() => {
  const rand = seeded(41);
  return LINKS.map(([key, label, observed, m, sd]) => ({ key, label, observed, samples: Array.from({ length: 500 }, () => Math.round(normal(rand, m, sd))) }));
})();
