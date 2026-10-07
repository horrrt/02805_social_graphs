// The numbers under the kit's growth pieces (GrowthReplay, GrowthLab,
// ComponentGallery, FriendshipParadox): where an arrival sits on the spiral,
// the degrees at time t, the top k, the biggest hub's share, a seeded sweep of
// that share over the attachment exponent α, a network split into its
// components, and the friendship-paradox sampler. DOM-free and seeded, so
// tests/growth-core.test.mjs runs it in node. The models and searches
// themselves are graph-core.js's.
import { ba, components, mulberry32, toAdj } from "./graph-core.js";

const GOLDEN = Math.PI * (3 - Math.sqrt(5));

/**
 * Where the arrival of rank `rank` (0 first) of `total` sits in the unit
 * square: a sunflower spiral, the first at the centre and the last on the rim
 * at radius 0.46. The radius grows as √rank so the disc fills evenly; it
 * depends on the total, never on the time, so a node never moves once placed.
 */
export function spiralPosition(rank, total) {
  if (total <= 1 || rank <= 0) return [0.5, 0.5];
  const r = 0.46 * Math.sqrt(Math.min(rank, total - 1) / (total - 1));
  const a = rank * GOLDEN;
  return [0.5 + r * Math.cos(a), 0.5 + r * Math.sin(a)];
}

/** spiralPosition for every rank 0 … total − 1. */
export function spiralLayout(total) {
  return Array.from({ length: total }, (_, i) => spiralPosition(i, total));
}

/**
 * The arrival rank of each node from a value per node (say a debut year):
 * smaller values arrive first, ties in node order. rank[v] is 0 for the first.
 */
export function rankBy(values) {
  const order = values.map((_, i) => i).sort((a, b) => values[a] - values[b] || a - b);
  const rank = new Array(values.length);
  order.forEach((v, r) => (rank[v] = r));
  return rank;
}

/** The node ids in arrival order, from a rank per node. */
export function orderOf(rank) {
  const order = new Array(rank.length);
  rank.forEach((r, v) => (order[r] = v));
  return order;
}

/**
 * Each node's degree once the first t nodes have arrived: an edge counts
 * when both its ends have (rank < t). Nodes still to come have degree 0.
 * `rank` defaults to the node ids, so node v arrives at rank v.
 */
export function degreesAt(n, edges, rank, t) {
  const deg = new Array(n).fill(0);
  const r = rank ?? deg.map((_, i) => i);
  for (const [a, b] of edges) {
    if (r[a] >= t || r[b] >= t) continue;
    deg[a] += 1;
    if (b !== a) deg[b] += 1;
  }
  return deg;
}

/** The edges whose ends have both arrived by time t, in their own order. */
export function edgesAt(edges, rank, t) {
  return edges.filter(([a, b]) => (rank ? rank[a] < t && rank[b] < t : a < t && b < t));
}

/**
 * The k nodes with the most links among those arrived (rank < t): rows
 * { node, k, rank }, most links first, ties to the earlier arrival.
 */
export function topK(degree, k, rank, t = Infinity) {
  const r = rank ?? degree.map((_, i) => i);
  return degree
    .map((d, node) => ({ node, k: d, rank: r[node] }))
    .filter((row) => row.rank < t)
    .sort((a, b) => b.k - a.k || a.rank - b.rank)
    .slice(0, Math.max(0, k));
}

/**
 * The biggest hub: { hub, k, share, arrival }. share is its links over all
 * links (a star's centre holds every link, share 1; no links, share 0);
 * arrival is its 1-based arrival rank. Ties go to the earlier arrival.
 * hub is −1 for no nodes.
 */
export function hubStats(degree, links, rank) {
  const [top] = topK(degree, 1, rank);
  if (!top) return { hub: -1, k: 0, share: 0, arrival: 0 };
  return { hub: top.node, k: top.k, share: links > 0 ? top.k / links : 0, arrival: top.rank + 1 };
}

/** The attachment exponent the growth pieces accept: 0 to 50. Past that k^α overflows for a big hub. */
export const ALPHA_MAX = 50;
export const clampAlpha = (alpha) => Math.min(ALPHA_MAX, Math.max(0, Number.isFinite(alpha) ? alpha : 1));

/** "sub", "linear" or "super": which side of α = 1 the exponent is on. */
export function regime(alpha, eps = 1e-9) {
  return alpha < 1 - eps ? "sub" : alpha > 1 + eps ? "super" : "linear";
}

/** The α values a sweep takes by default: 0 to 2.5 in steps of 0.1. */
export const SWEEP_ALPHAS = Array.from({ length: 26 }, (_, i) => Math.round(i * 10) / 100);

// One seed per (α, n, run), so a point repeats on its own, whatever else is swept.
const pointSeed = (seed, alpha, n, run) => (seed * 1_000_003 + Math.round(alpha * 1000) * 7919 + n * 104_729 + run * 15_485_863) >>> 0;

/**
 * The biggest hub's mean share of links over `runs` networks grown with
 * Π(k) ∝ k^α to n nodes, m links per newcomer. Seeded: the same arguments
 * give the same share.
 */
export function sweepPoint(alpha, n, m, seed = 1, runs = 3) {
  const a = clampAlpha(alpha);
  let sum = 0;
  for (let run = 0; run < runs; run++) {
    const g = ba(n, m, { alpha: a }, mulberry32(pointSeed(seed, a, n, run)));
    sum += hubStats(g.degree, g.edges.length).share;
  }
  return sum / runs;
}

/**
 * The hub-share curve at each n: [{ n, points: [[α, share], …] }]. A page
 * that must not block runs sweepPoint one point per tick instead; both give
 * the same numbers.
 */
export function sweepHubShare({ alphas = SWEEP_ALPHAS, ns = [300, 1000], m = 2, seed = 1, runs = 3 } = {}) {
  return ns.map((n) => ({ n, points: alphas.map((a) => [a, sweepPoint(a, n, m, seed, runs)]) }));
}

/**
 * A network as its connected components, largest first: [{ nodes, edges }],
 * nodes the original ids in increasing order and edges [i, j] indexes into
 * nodes. With `groups` (arrays of node ids), each group's induced subgraph
 * instead, in the order given; ids outside 0 … n − 1 are dropped.
 */
export function splitComponents(n, edges, groups) {
  let sets = groups;
  if (!sets) {
    const { comp, sizes } = components(n, edges);
    sets = sizes.map(() => []);
    for (let v = 0; v < n; v++) sets[comp[v]].push(v);
  }
  return sets.map((g) => {
    const nodes = [...new Set(g.filter((v) => Number.isInteger(v) && v >= 0 && v < n))].sort((a, b) => a - b);
    const at = new Map(nodes.map((v, i) => [v, i]));
    const local = [];
    for (const [a, b] of edges) if (at.has(a) && at.has(b)) local.push([at.get(a), at.get(b)]);
    return { nodes, edges: local };
  });
}

/**
 * One draw of the friendship paradox: a person uniformly from the nodes with
 * at least one friend (an isolate has no friend to ask, so it is never
 * drawn), then one of their friends uniformly. { person, friend, kPerson,
 * kFriend }, or null when nobody has a friend. `adj` is toAdj(…).out.
 * Adapted from socialgraphs2026-web, MIT, Sune Lehmann.
 */
export function samplePair(adj, rng, linked) {
  const pool = linked ?? adj.map((_, v) => v).filter((v) => adj[v].length > 0);
  if (pool.length === 0) return null;
  const person = pool[Math.floor(rng() * pool.length)];
  const friends = adj[person];
  const friend = friends[Math.floor(rng() * friends.length)];
  return { person, friend, kPerson: adj[person].length, kFriend: adj[friend].length };
}

/** `count` draws of samplePair: { person: k[], friend: k[], last }, empty for a network with no links. */
export function sampleMany(n, edges, count, rng) {
  const adj = toAdj(n, edges).out;
  const linked = adj.map((_, v) => v).filter((v) => adj[v].length > 0);
  const out = { person: [], friend: [], last: null };
  for (let i = 0; i < count; i++) {
    const s = samplePair(adj, rng, linked);
    if (!s) break;
    out.person.push(s.kPerson);
    out.friend.push(s.kFriend);
    out.last = s;
  }
  return out;
}

/** The share of `ks` at each k from 0 to cap, the last bin holding everything at cap or above: [[k, share], …]. */
export function degreeShares(ks, cap = 30) {
  const bins = new Array(cap + 1).fill(0);
  for (const k of ks) bins[Math.min(cap, Math.max(0, Math.round(k)))] += 1;
  return bins.map((c, k) => [k, ks.length ? c / ks.length : 0]);
}
