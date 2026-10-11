// The tree under Dendrogram, with no DOM: merges into a tree, the leaf order
// that keeps every cluster contiguous, a cut at one height, a cut chosen
// branch by branch, and the levels a metric strip plots. Pure functions over
// arrays, so tests/dendro-core.test.mjs runs them in node. Edge betweenness
// comes from graph-core.js.
//
// A merge list is scipy's linkage read as objects: leaves are 0 … n − 1 and
// merge i, { a, b, h }, joins clusters a and b at height h into cluster n + i.
//
//   const { merges } = girvanNewman(n, edges);
//   const t = buildTree(n, merges);
//   cutAt(t, 0.5); bestCut(t, modularityTerms(edges)); levels(t)

import { edgeBetweenness } from "./graph-core.js";

/**
 * A nested tree as a merge list. A leaf is a number, a string or { id }; an
 * inner node is { h, children } (more than two children chain at the same
 * height; one child passes through). Leaves are numbered in the order met.
 * Returns { n, merges, ids }, ids[i] the original id of leaf i.
 */
export function fromTree(tree) {
  const ids = [];
  const pending = [];
  // Walk once to number the leaves, keeping the inner nodes in post-order.
  const walk = (node) => {
    if (node === null || node === undefined) return null;
    if (typeof node !== "object" || !Array.isArray(node.children)) {
      ids.push(typeof node === "object" ? node.id : node);
      return { leaf: ids.length - 1 };
    }
    const kids = node.children.map(walk).filter(Boolean);
    if (kids.length === 0) return null;
    if (kids.length === 1) return kids[0];
    const ref = { kids, h: Number(node.h) || 0 };
    pending.push(ref);
    return ref;
  };
  const root = walk(tree);
  const n = ids.length;
  const merges = [];
  const idOf = (ref) => (ref.leaf !== undefined ? ref.leaf : ref.cluster);
  for (const ref of pending) {
    let acc = idOf(ref.kids[0]);
    for (const kid of ref.kids.slice(1)) {
      merges.push({ a: acc, b: idOf(kid), h: ref.h });
      acc = n + merges.length - 1;
    }
    ref.cluster = acc;
  }
  return root ? { n, merges, ids } : { n: 0, merges: [], ids: [] };
}

/**
 * The tree of n leaves and a merge list: { n, h, parent, kids, members,
 * roots, order, pos }. Cluster c exists when members[c] is an array; a merge
 * that names a missing or already merged cluster is skipped, so its cluster
 * stays missing. Heights are made monotone (a cluster is never below its
 * children). Fewer than n − 1 merges leaves a forest: roots holds every top
 * cluster, ordered by its smallest leaf. order is the leaf order that keeps
 * each cluster contiguous (a before b); pos[c] is a cluster's x in leaf
 * units: a leaf's place in order, an inner cluster's the mean of its two.
 */
export function buildTree(n, merges = []) {
  const total = n + merges.length;
  const h = new Array(total).fill(0);
  const parent = new Array(total).fill(-1);
  const kids = new Array(total).fill(null);
  const members = new Array(total).fill(null);
  for (let i = 0; i < n; i++) members[i] = [i];
  merges.forEach((m, i) => {
    const c = n + i;
    const { a, b } = m;
    const ok = (x) => Number.isInteger(x) && x >= 0 && x < c && members[x] && parent[x] === -1;
    if (!ok(a) || !ok(b) || a === b) return;
    parent[a] = c;
    parent[b] = c;
    kids[c] = [a, b];
    h[c] = Math.max(Number(m.h) || 0, h[a], h[b]);
    members[c] = [...members[a], ...members[b]];
  });
  const roots = [];
  for (let c = 0; c < total; c++) if (members[c] && parent[c] === -1) roots.push(c);
  roots.sort((x, y) => Math.min(...members[x]) - Math.min(...members[y]));
  const order = [];
  const visit = (c) => (kids[c] ? kids[c].forEach(visit) : order.push(c));
  roots.forEach(visit);
  const pos = new Array(total).fill(NaN);
  order.forEach((leaf, i) => (pos[leaf] = i));
  for (let c = n; c < total; c++) if (kids[c]) pos[c] = (pos[kids[c][0]] + pos[kids[c][1]]) / 2;
  return { n, h, parent, kids, members, roots, order, pos };
}

// Clusters in leaf order, by the place of their first leaf.
const inOrder = (t, clusters) => clusters.slice().sort((x, y) => Math.min(...t.members[x].map((v) => t.pos[v])) - Math.min(...t.members[y].map((v) => t.pos[v])));

/** The clusters a cut at height `height` leaves: each the top cluster at or below it, in leaf order. */
export function cutAt(t, height) {
  const out = [];
  const down = (c) => {
    if (t.h[c] <= height || !t.kids[c]) out.push(c);
    else t.kids[c].forEach(down);
  };
  t.roots.forEach(down);
  return inOrder(t, out);
}

/**
 * The cut chosen branch by branch to maximise a score that adds up over
 * clusters (score(members) per cluster, such as modularityTerms): a cluster
 * is kept whole when its own score is at least the best its two children
 * reach, so the result scores at least as well as any single-height cut.
 * Returns { clusters (in leaf order), score }.
 */
export function bestCut(t, score) {
  const best = new Map();
  const total = t.members.length;
  for (let c = 0; c < total; c++) {
    if (!t.members[c]) continue;
    const own = score(t.members[c]);
    if (!t.kids[c]) {
      best.set(c, { score: own, clusters: [c] });
      continue;
    }
    const [l, r] = t.kids[c].map((k) => best.get(k));
    const split = l.score + r.score;
    best.set(c, own >= split - 1e-12 ? { score: own, clusters: [c] } : { score: split, clusters: [...l.clusters, ...r.clusters] });
  }
  const clusters = t.roots.flatMap((r) => best.get(r).clusters);
  return { clusters: inOrder(t, clusters), score: t.roots.reduce((s, r) => s + best.get(r).score, 0) };
}

/**
 * Each leaf's block for a set of clusters, numbered by size, largest first
 * (ties in leaf order): { partition, blocks }, blocks[i] = { cluster,
 * members, rank }. A leaf in none of the clusters gets -1.
 */
export function blocksOf(t, clusters) {
  const sorted = inOrder(t, clusters).sort((x, y) => t.members[y].length - t.members[x].length);
  const partition = new Array(t.n).fill(-1);
  const blocks = sorted.map((c, rank) => {
    for (const v of t.members[c]) partition[v] = rank;
    return { cluster: c, members: t.members[c].slice().sort((a, b) => a - b), rank };
  });
  return { partition, blocks };
}

/**
 * Every distinct cut, lowest first: { h, clusters } at height 0 (every leaf
 * apart) and at each merge height.
 */
export function levels(t) {
  const heights = [...new Set([0, ...t.h.filter((v, c) => c >= t.n && t.members[c])])].sort((a, b) => a - b);
  return heights.map((h) => ({ h, clusters: cutAt(t, h) }));
}

/**
 * One community's share of Newman's modularity, as a function of its
 * members: L_c / m − (d_c / 2m)². Summed over a partition's communities it is
 * graph-core's modularity(edges, partition). Edges may carry a weight third.
 */
export function modularityTerms(edges) {
  let m = 0;
  const deg = new Map();
  for (const [a, b, w0] of edges) {
    const w = w0 ?? 1;
    m += w;
    deg.set(a, (deg.get(a) ?? 0) + w);
    deg.set(b, (deg.get(b) ?? 0) + w);
  }
  return (members) => {
    if (m === 0) return 0;
    const set = new Set(members);
    let inside = 0;
    let d = 0;
    for (const v of set) d += deg.get(v) ?? 0;
    for (const [a, b, w0] of edges) if (set.has(a) && set.has(b)) inside += w0 ?? 1;
    return inside / m - (d / (2 * m)) ** 2;
  };
}

/**
 * Girvan and Newman's divisive method as a merge list: remove the link of
 * highest edge betweenness (the first on a tie), recompute, repeat until no
 * link is left; then read the splits back as merges. A merge's height is the
 * share of links still in place when its split happened, so the first split
 * sits highest. Returns { merges, removed }, removed the links in the order
 * they went.
 */
export function girvanNewman(n, edges) {
  let left = edges.map(([a, b]) => [a, b]);
  const removed = [];
  while (left.length) {
    const eb = edgeBetweenness(n, left, false);
    let top = 0;
    for (let i = 1; i < eb.length; i++) if (eb[i] > eb[top] + 1e-12) top = i;
    removed.push(left[top]);
    left = left.filter((_, i) => i !== top);
  }
  // Put the links back, last removed first; a link that joins two clusters is a merge.
  const m = removed.length;
  const root = Array.from({ length: n }, (_, i) => i);
  const find = (x) => (root[x] === x ? x : (root[x] = find(root[x])));
  const cluster = Array.from({ length: n }, (_, i) => i);
  const merges = [];
  for (let r = m - 1; r >= 0; r--) {
    const [a, b] = removed[r];
    const ra = find(a);
    const rb = find(b);
    if (ra === rb) continue;
    merges.push({ a: cluster[ra], b: cluster[rb], h: (m - r) / m });
    root[rb] = ra;
    cluster[ra] = n + merges.length - 1;
  }
  return { merges, removed };
}
