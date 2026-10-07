// The network models and measures under the kit's network explorables, with
// no DOM: random graphs, growth, rewiring, search, centralities, clustering,
// null models and community detection. Pure functions over plain arrays, so
// tests/graph-core.test.mjs runs them in node and checks them against
// networkx. Every random choice goes through an rng from mulberry32(seed), so
// a seed gives the same graph every time.
//
// Nodes are the integers 0 to n - 1. An edge is [a, b] (undirected unless a
// function says otherwise), or [a, b, w] where a weight is allowed.
//
//   const rng = mulberry32(7);
//   const { edges } = ba(200, 2, { alpha: 1 }, rng);
//   pagerank(200, edges); betweenness(200, edges); louvain(edges, rng).partition
//
// mulberry32, the BFS layering and the Louvain move rule follow the course
// explorables' graphlib.js and community.js (adapted from socialgraphs2026-web,
// MIT, Sune Lehmann); the rest is written here.

// ---------------------------------------------------------------- randomness

/** A seeded uniform rng on [0, 1): mulberry32. The same seed gives the same stream. */
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function rng() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** An integer in [0, n) from rng. */
const randInt = (rng, n) => Math.floor(rng() * n);

/** A copy of xs in a random order (Fisher–Yates). */
export function shuffle(xs, rng) {
  const out = xs.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = randInt(rng, i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

const key = (a, b) => (a < b ? `${a},${b}` : `${b},${a}`);

// ---------------------------------------------------------------- structure

/** Each node's degree; a self-loop counts twice, as networkx counts it. */
export function degrees(n, edges) {
  const k = new Array(n).fill(0);
  for (const [a, b] of edges) {
    k[a] += 1;
    k[b] += 1;
  }
  return k;
}

/**
 * Neighbour lists: { n, out, in }. Undirected, out and in are the same lists;
 * directed, out[a] holds b and in[b] holds a for each edge [a, b].
 */
export function toAdj(n, edges, directed = false) {
  const out = Array.from({ length: n }, () => []);
  const inn = directed ? Array.from({ length: n }, () => []) : out;
  for (const [a, b] of edges) {
    out[a].push(b);
    if (directed) inn[b].push(a);
    else if (a !== b) out[b].push(a);
  }
  return { n, out, in: inn };
}

const asAdj = (adj) => (Array.isArray(adj) ? { n: adj.length, out: adj, in: adj } : adj);

/**
 * Breadth-first search from src: { dist, parent, layers }. dist[v] is the hop
 * count (-1 when unreachable), parent[v] the node it was reached from (-1 for
 * src and the unreached), layers[d] the nodes at distance d in the order they
 * were found. adj is a list of neighbour lists or toAdj()'s result; dir picks
 * which links a directed graph follows: "out", "in" or "any" (either way).
 */
export function bfsLayers(adj, src, dir = "any") {
  const g = asAdj(adj);
  const dist = new Array(g.n).fill(-1);
  const parent = new Array(g.n).fill(-1);
  const layers = [];
  if (src < 0 || src >= g.n) return { dist, parent, layers };
  dist[src] = 0;
  let frontier = [src];
  while (frontier.length) {
    layers.push(frontier);
    const next = [];
    for (const u of frontier) {
      const nbrs = dir === "out" ? g.out[u] : dir === "in" ? g.in[u] : g.out === g.in ? g.out[u] : [...g.out[u], ...g.in[u]];
      for (const v of nbrs) {
        if (dist[v] !== -1) continue;
        dist[v] = dist[u] + 1;
        parent[v] = u;
        next.push(v);
      }
    }
    frontier = next;
  }
  return { dist, parent, layers };
}

/**
 * Connected components: { comp, sizes }. comp[v] is v's component, numbered
 * by size, largest first (ties: the one holding the smaller node first).
 */
export function components(n, edges) {
  const { out } = toAdj(n, edges);
  const raw = new Array(n).fill(-1);
  const groups = [];
  for (let s = 0; s < n; s++) {
    if (raw[s] !== -1) continue;
    const members = [s];
    raw[s] = groups.length;
    for (let i = 0; i < members.length; i++)
      for (const v of out[members[i]])
        if (raw[v] === -1) {
          raw[v] = groups.length;
          members.push(v);
        }
    groups.push(members);
  }
  const order = groups.map((g, i) => i).sort((a, b) => groups[b].length - groups[a].length || a - b);
  const rank = new Array(groups.length);
  order.forEach((g, r) => (rank[g] = r));
  return { comp: raw.map((g) => rank[g]), sizes: order.map((g) => groups[g].length) };
}

/** The nodes of the largest connected component, in increasing order. */
export function giant(n, edges) {
  if (n === 0) return [];
  const { comp } = components(n, edges);
  const out = [];
  for (let v = 0; v < n; v++) if (comp[v] === 0) out.push(v);
  return out;
}

// ---------------------------------------------------------------- models

/** G(n, p): each of the n(n-1)/2 pairs linked with probability p. Edges [a, b], a < b. */
export function gnp(n, p, rng) {
  const edges = [];
  for (let a = 0; a < n; a++) for (let b = a + 1; b < n; b++) if (rng() < p) edges.push([a, b]);
  return edges;
}

/** G(n, m): m distinct pairs drawn uniformly (at most every pair). Edges [a, b], a < b, in draw order. */
export function gnm(n, m, rng) {
  const max = (n * (n - 1)) / 2;
  const want = Math.max(0, Math.min(m, max));
  const seen = new Set();
  const edges = [];
  while (edges.length < want) {
    const a = randInt(rng, n);
    const b = randInt(rng, n);
    if (a === b || seen.has(key(a, b))) continue;
    seen.add(key(a, b));
    edges.push(a < b ? [a, b] : [b, a]);
  }
  return edges;
}

/**
 * The start of a growth run: a clique of m + 1 nodes (at least two), so the
 * first newcomer finds m distinct targets. State: { n, m, alpha, edges,
 * degree, born }, born[i] the step that added edge i (0 for the seed clique).
 */
export function baInit(m = 1, alpha = 1) {
  const m0 = Math.max(2, m + 1);
  const edges = [];
  for (let a = 0; a < m0; a++) for (let b = a + 1; b < m0; b++) edges.push([a, b]);
  return { n: m0, m, alpha, edges, degree: degrees(m0, edges), born: edges.map(() => 0) };
}

/**
 * One newcomer: node n links to m distinct existing nodes, each picked with
 * probability proportional to k^alpha (alpha 1 is Barabási–Albert, 0 uniform
 * attachment, above 1 a winner takes all). Returns a new state; the old one
 * is left as it was.
 */
export function baStep(state, rng) {
  const { n, m, alpha } = state;
  const w = state.degree.map((k) => Math.pow(k, alpha));
  const picked = [];
  const want = Math.min(m, n);
  while (picked.length < want) {
    let total = 0;
    for (let v = 0; v < n; v++) if (!picked.includes(v)) total += w[v];
    let r = rng() * total;
    let choice = -1;
    for (let v = 0; v < n; v++) {
      if (picked.includes(v)) continue;
      choice = v;
      r -= w[v];
      if (r < 0) break;
    }
    picked.push(choice);
  }
  const degree = state.degree.slice();
  degree.push(picked.length);
  for (const v of picked) degree[v] += 1;
  const step = n - Math.max(2, m + 1) + 1;
  return {
    ...state,
    n: n + 1,
    degree,
    edges: [...state.edges, ...picked.map((v) => [n, v])],
    born: [...state.born, ...picked.map(() => step)],
  };
}

/**
 * Preferential attachment grown to n nodes: { n, edges, born, degree }.
 * Each edge is [newcomer, target]; born[i] is the step (1, 2, …) that added
 * it, 0 for the seed clique, so node ids are arrival order. opts.alpha sets
 * the attachment kernel Π ∝ k^alpha (1 by default).
 */
export function ba(n, m, opts = {}, rng) {
  let s = baInit(m, opts.alpha ?? 1);
  while (s.n < n) s = baStep(s, rng);
  return { n: s.n, edges: s.edges, born: s.born, degree: s.degree };
}

/** A ring of n nodes, each linked to its k nearest neighbours (k/2 each side; k rounded down to even). */
export function ringLattice(n, k) {
  const edges = [];
  const half = Math.min(Math.floor(k / 2), Math.floor((n - 1) / 2));
  for (let i = 0; i < n; i++) for (let j = 1; j <= half; j++) edges.push([i, (i + j) % n]);
  return edges;
}

/**
 * Watts–Strogatz: the ring lattice with each edge's far end moved, with
 * probability q, to a node drawn uniformly (no self-loops or repeats). Returns
 * { edges, rewired } with rewired[i] true for a moved edge. Each edge's coin
 * is drawn before any move, so under one seed the moved edges at a larger q
 * include those at a smaller one.
 */
export function wattsStrogatz(n, k, q, rng) {
  const ring = ringLattice(n, k);
  const coins = ring.map(() => rng());
  const seen = new Set(ring.map(([a, b]) => key(a, b)));
  const edges = [];
  const rewired = [];
  ring.forEach(([a, b], i) => {
    if (coins[i] >= q || n < 3) {
      edges.push([a, b]);
      rewired.push(false);
      return;
    }
    let c = -1;
    for (let tries = 0; tries < 50 * n; tries++) {
      const t = randInt(rng, n);
      if (t !== a && !seen.has(key(a, t))) {
        c = t;
        break;
      }
    }
    if (c === -1) {
      edges.push([a, b]);
      rewired.push(false);
      return;
    }
    seen.delete(key(a, b));
    seen.add(key(a, c));
    edges.push([a, c]);
    rewired.push(true);
  });
  return { edges, rewired };
}

/**
 * The ring lattice plus s shortcuts between random non-adjacent pairs:
 * { edges, shortcut }. The shortcuts come from one sequence the seed fixes,
 * taken in order, so the graph at s + 1 is the graph at s with one more link.
 */
export function ringPlusShortcuts(n, k, s, rng) {
  const edges = ringLattice(n, k);
  const shortcut = edges.map(() => false);
  const seen = new Set(edges.map(([a, b]) => key(a, b)));
  const max = (n * (n - 1)) / 2;
  let added = 0;
  while (added < s && seen.size < max) {
    const a = randInt(rng, n);
    const b = randInt(rng, n);
    if (a === b || seen.has(key(a, b))) continue;
    seen.add(key(a, b));
    edges.push(a < b ? [a, b] : [b, a]);
    shortcut.push(true);
    added += 1;
  }
  return { edges, shortcut };
}

/** G(n, p) with a clique planted on k nodes drawn at random: { edges, clique } (clique sorted). */
export function plantedClique(n, p, k, rng) {
  const base = gnp(n, p, rng);
  const clique = shuffle(Array.from({ length: n }, (_, i) => i), rng).slice(0, Math.min(k, n)).sort((a, b) => a - b);
  const seen = new Set(base.map(([a, b]) => key(a, b)));
  const edges = base.slice();
  for (let i = 0; i < clique.length; i++)
    for (let j = i + 1; j < clique.length; j++)
      if (!seen.has(key(clique[i], clique[j]))) {
        seen.add(key(clique[i], clique[j]));
        edges.push([clique[i], clique[j]]);
      }
  return { edges, clique };
}

/**
 * The configuration-model null: nSwaps double-edge swaps, each taking two
 * edges (a, b) and (c, d) and making (a, d) and (c, b), refused when that
 * would make a self-loop or a repeated edge. Every degree stays as it was.
 * Gives up after 100 tries per swap (a star cannot swap). Returns new edges.
 */
export function degreePreservingSwaps(edges, nSwaps, rng) {
  const out = edges.map(([a, b]) => [a, b]);
  if (out.length < 2) return out;
  const seen = new Set(out.map(([a, b]) => key(a, b)));
  let done = 0;
  for (let tries = 0; done < nSwaps && tries < 100 * nSwaps; tries++) {
    const i = randInt(rng, out.length);
    const j = randInt(rng, out.length);
    if (i === j) continue;
    let [a, b] = out[i];
    const [c, d] = out[j];
    if (rng() < 0.5) [a, b] = [b, a];
    if (a === d || c === b || seen.has(key(a, d)) || seen.has(key(c, b))) continue;
    seen.delete(key(a, b));
    seen.delete(key(c, d));
    seen.add(key(a, d));
    seen.add(key(c, b));
    out[i] = [a, d];
    out[j] = [c, b];
    done += 1;
  }
  return out;
}

// ---------------------------------------------------------------- layouts

/** n points evenly round a circle in the unit square, node 0 at the top. */
export function circleLayout(n) {
  return Array.from({ length: n }, (_, i) => {
    const t = (2 * Math.PI * i) / Math.max(1, n) - Math.PI / 2;
    return [0.5 + 0.46 * Math.cos(t), 0.5 + 0.46 * Math.sin(t)];
  });
}

/**
 * A Fruchterman–Reingold layout scaled into the unit square: [x, y] per node.
 * opts: { iterations = 120, init (positions to start from, e.g. the last
 * frame's), rng (for nodes with no start) }. Deterministic for one rng.
 */
export function forceLayout(n, edges, opts = {}) {
  const rng = opts.rng ?? mulberry32(1);
  const iterations = opts.iterations ?? 120;
  const pos = Array.from({ length: n }, (_, i) => (opts.init?.[i] ? [opts.init[i][0], opts.init[i][1]] : [rng(), rng()]));
  if (n === 0) return pos;
  const kk = Math.sqrt(1 / n);
  let temp = opts.init ? 0.03 : 0.1;
  const cool = temp / (iterations + 1);
  for (let it = 0; it < iterations; it++) {
    const disp = pos.map(() => [0, 0]);
    for (let i = 0; i < n; i++)
      for (let j = i + 1; j < n; j++) {
        let dx = pos[i][0] - pos[j][0];
        let dy = pos[i][1] - pos[j][1];
        let d2 = dx * dx + dy * dy;
        if (d2 < 1e-9) {
          dx = 1e-3 * (i - j);
          dy = 1e-3;
          d2 = dx * dx + dy * dy;
        }
        const f = (kk * kk) / d2;
        disp[i][0] += dx * f;
        disp[i][1] += dy * f;
        disp[j][0] -= dx * f;
        disp[j][1] -= dy * f;
      }
    for (const [a, b] of edges) {
      if (a === b) continue;
      const dx = pos[a][0] - pos[b][0];
      const dy = pos[a][1] - pos[b][1];
      const d = Math.sqrt(dx * dx + dy * dy) || 1e-6;
      const f = d / kk;
      disp[a][0] -= dx * f;
      disp[a][1] -= dy * f;
      disp[b][0] += dx * f;
      disp[b][1] += dy * f;
    }
    for (let i = 0; i < n; i++) {
      // A weak pull to the middle keeps loose components on the page.
      disp[i][0] += (0.5 - pos[i][0]) * 0.05 * n;
      disp[i][1] += (0.5 - pos[i][1]) * 0.05 * n;
      const d = Math.hypot(disp[i][0], disp[i][1]) || 1;
      const step = Math.min(d, temp);
      pos[i][0] += (disp[i][0] / d) * step;
      pos[i][1] += (disp[i][1] / d) * step;
    }
    temp = Math.max(temp - cool, 0.002);
  }
  return normalise(pos);
}

/** Positions moved and scaled, keeping their shape, to fill the unit square with a small margin. */
export function normalise(pos) {
  if (pos.length === 0) return pos;
  const xs = pos.map((p) => p[0]);
  const ys = pos.map((p) => p[1]);
  const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
  const span = Math.max(x1 - x0, y1 - y0) || 1;
  const s = 0.92 / span;
  const ox = 0.5 - ((x0 + x1) / 2) * s;
  const oy = 0.5 - ((y0 + y1) / 2) * s;
  return pos.map(([x, y]) => [ox + x * s, oy + y * s]);
}

// ---------------------------------------------------------------- centrality

/** Degree over n - 1, as networkx degree_centrality. */
export function degreeCentrality(n, edges) {
  const k = degrees(n, edges);
  return n <= 1 ? k.map(() => 1) : k.map((d) => d / (n - 1));
}

const hops = (n, edges) => {
  const { out } = toAdj(n, edges);
  return (s) => bfsLayers(out, s).dist;
};

/**
 * Closeness with Wasserman and Faust's correction for disconnected graphs, as
 * networkx closeness_centrality (wf_improved): (r - 1) / Σd · (r - 1) / (n - 1),
 * r the nodes v reaches including itself; 0 for an isolate.
 */
export function closeness(n, edges) {
  const dist = hops(n, edges);
  return Array.from({ length: n }, (_, s) => {
    let sum = 0;
    let r = 0;
    for (const d of dist(s)) if (d >= 0) {
      sum += d;
      r += 1;
    }
    if (sum === 0 || n <= 1) return 0;
    return ((r - 1) / sum) * ((r - 1) / (n - 1));
  });
}

/** Harmonic centrality: Σ 1/d over the nodes v reaches, unnormalised, as networkx. */
export function harmonic(n, edges) {
  const dist = hops(n, edges);
  return Array.from({ length: n }, (_, s) => dist(s).reduce((acc, d) => (d > 0 ? acc + 1 / d : acc), 0));
}

// Brandes' accumulation from every source, unweighted: node and edge scores
// with each unordered pair counted from both ends.
function brandes(n, edges) {
  const { out } = toAdj(n, edges);
  const node = new Array(n).fill(0);
  const edge = new Map(edges.map(([a, b]) => [key(a, b), 0]));
  for (let s = 0; s < n; s++) {
    const stack = [];
    const preds = Array.from({ length: n }, () => []);
    const sigma = new Array(n).fill(0);
    const dist = new Array(n).fill(-1);
    sigma[s] = 1;
    dist[s] = 0;
    const queue = [s];
    for (let qi = 0; qi < queue.length; qi++) {
      const v = queue[qi];
      stack.push(v);
      for (const w of out[v]) {
        if (dist[w] < 0) {
          dist[w] = dist[v] + 1;
          queue.push(w);
        }
        if (dist[w] === dist[v] + 1) {
          sigma[w] += sigma[v];
          preds[w].push(v);
        }
      }
    }
    const delta = new Array(n).fill(0);
    while (stack.length) {
      const w = stack.pop();
      for (const v of preds[w]) {
        const c = (sigma[v] / sigma[w]) * (1 + delta[w]);
        const k = key(v, w);
        if (edge.has(k)) edge.set(k, edge.get(k) + c);
        delta[v] += c;
      }
      if (w !== s) node[w] += delta[w];
    }
  }
  return { node, edge };
}

/**
 * Brandes betweenness, unweighted. Normalised (the default) as networkx:
 * the fraction of pairs of other nodes whose shortest paths run through v,
 * over (n-1)(n-2)/2 pairs; unnormalised, the count of pairs.
 */
export function betweenness(n, edges, normalized = true) {
  const { node } = brandes(n, edges);
  if (normalized) return node.map((b) => (n > 2 ? b / ((n - 1) * (n - 2)) : 0));
  return node.map((b) => b / 2);
}

/**
 * Edge betweenness, one value per edge in input order. Normalised (the
 * default) over n(n-1)/2 pairs, as networkx edge_betweenness_centrality;
 * unnormalised, the count of pairs.
 */
export function edgeBetweenness(n, edges, normalized = true) {
  const { edge } = brandes(n, edges);
  return edges.map(([a, b]) => {
    const raw = edge.get(key(a, b)) ?? 0;
    return normalized ? (n > 1 ? raw / (n * (n - 1)) : 0) : raw / 2;
  });
}

/**
 * Eigenvector centrality: the leading eigenvector of the adjacency matrix,
 * found by power iteration on A + I (as networkx), scaled to unit length
 * (L2), every entry ≥ 0. Converges for a connected graph; on a disconnected
 * one it settles on the component with the largest eigenvalue.
 */
export function eigenvector(n, edges, { maxIter = 1000, tol = 1e-12 } = {}) {
  if (n === 0) return [];
  const { out } = toAdj(n, edges);
  let x = new Array(n).fill(1 / n);
  for (let it = 0; it < maxIter; it++) {
    const y = x.slice();
    for (let v = 0; v < n; v++) for (const w of out[v]) y[w] += x[v];
    const norm = Math.hypot(...y) || 1;
    for (let v = 0; v < n; v++) y[v] /= norm;
    let diff = 0;
    for (let v = 0; v < n; v++) diff += Math.abs(y[v] - x[v]);
    x = y;
    if (diff < n * tol) break;
  }
  return x;
}

/**
 * PageRank by power iteration: alpha the damping (0.85), the rest teleports
 * uniformly, and a node with no out-links (dangling) spreads its rank over
 * every node, as networkx. Undirected edges count both ways; directed: true
 * reads [a, b] as a → b. Sums to 1.
 */
export function pagerank(n, edges, { alpha = 0.85, directed = false, maxIter = 1000, tol = 1e-12 } = {}) {
  if (n === 0) return [];
  const { out } = toAdj(n, edges, directed);
  const outDeg = out.map((l) => l.length);
  let x = new Array(n).fill(1 / n);
  for (let it = 0; it < maxIter; it++) {
    let dangling = 0;
    for (let v = 0; v < n; v++) if (outDeg[v] === 0) dangling += x[v];
    const y = new Array(n).fill((1 - alpha) / n + (alpha * dangling) / n);
    for (let v = 0; v < n; v++) for (const w of out[v]) y[w] += (alpha * x[v]) / outDeg[v];
    let diff = 0;
    for (let v = 0; v < n; v++) diff += Math.abs(y[v] - x[v]);
    x = y;
    if (diff < n * tol) break;
  }
  return x;
}

// ---------------------------------------------------------------- clustering

const neighbourSets = (n, edges) => {
  const sets = Array.from({ length: n }, () => new Set());
  for (const [a, b] of edges)
    if (a !== b) {
      sets[a].add(b);
      sets[b].add(a);
    }
  return sets;
};

// Per node: the links among its neighbours (each counted once) and its degree.
function triangles(n, edges) {
  const sets = neighbourSets(n, edges);
  return sets.map((s) => {
    const nb = [...s];
    let t = 0;
    for (let i = 0; i < nb.length; i++) for (let j = i + 1; j < nb.length; j++) if (sets[nb[i]].has(nb[j])) t += 1;
    return { t, k: nb.length };
  });
}

/** Each node's clustering coefficient: links among its neighbours over k(k-1)/2; 0 below degree 2. */
export function localClustering(n, edges) {
  return triangles(n, edges).map(({ t, k }) => (k < 2 ? 0 : (2 * t) / (k * (k - 1))));
}

/** Transitivity: 3 × triangles over connected triples; 0 with no triples. */
export function transitivity(n, edges) {
  let tri = 0;
  let triples = 0;
  for (const { t, k } of triangles(n, edges)) {
    tri += t;
    triples += (k * (k - 1)) / 2;
  }
  return triples === 0 ? 0 : tri / triples;
}

// ---------------------------------------------------------------- communities

const nodeCount = (edges) => edges.reduce((m, [a, b]) => Math.max(m, a + 1, b + 1), 0);

/**
 * Newman's modularity of a partition (partition[v] is v's community):
 * Σ_c [L_c / m − (d_c / 2m)²], with weights where edges carry a third entry.
 * A self-loop adds its weight to L_c and twice its weight to d_c. 0 with no edges.
 */
export function modularity(edges, partition) {
  let m = 0;
  const inside = new Map();
  const deg = new Map();
  for (const [a, b, w0] of edges) {
    const w = w0 ?? 1;
    m += w;
    const ca = partition[a];
    const cb = partition[b];
    deg.set(ca, (deg.get(ca) ?? 0) + w);
    deg.set(cb, (deg.get(cb) ?? 0) + w);
    if (ca === cb) inside.set(ca, (inside.get(ca) ?? 0) + w);
  }
  if (m === 0) return 0;
  let q = 0;
  for (const [c, d] of deg) q += (inside.get(c) ?? 0) / m - (d / (2 * m)) ** 2;
  return q;
}

/** Labels renumbered 0, 1, … in order of first appearance. */
export function relabel(labels) {
  const seen = new Map();
  return labels.map((l) => {
    if (!seen.has(l)) seen.set(l, seen.size);
    return seen.get(l);
  });
}

// One level's graph: weighted neighbour maps without self-loops, each node's
// self-loop weight and its strength (a self-loop counted twice).
function levelGraph(n, edges) {
  const adj = Array.from({ length: n }, () => new Map());
  const self = new Array(n).fill(0);
  const k = new Array(n).fill(0);
  for (const [a, b, w0] of edges) {
    const w = w0 ?? 1;
    k[a] += w;
    k[b] += w;
    if (a === b) self[a] += w;
    else {
      adj[a].set(b, (adj[a].get(b) ?? 0) + w);
      adj[b].set(a, (adj[b].get(a) ?? 0) + w);
    }
  }
  return { n, adj, self, k };
}

function startLevel(s, g, level) {
  const ids = Array.from({ length: g.n }, (_, i) => i);
  const order = s.seed === null ? ids : shuffle(ids, mulberry32(s.seed + level));
  return { ...s, g, level, comm: ids.slice(), tot: g.k.slice(), order, cursor: 0, sweepMoves: 0, sweeps: 0, phase: "move" };
}

/**
 * Louvain, one move at a time. init(edges, { n, rng }) starts with every node
 * in its own community; rng (optional) only draws a seed that fixes the order
 * each level visits its nodes in (in id order without it). The state is plain
 * data, and stepMove, sweep and aggregate return a new state:
 *
 *   s = louvainInit(edges, { rng }); s = stepMove(s); s.last; louvainPartition(s); s.q
 *
 * phase is "move" (local moves), "aggregate" (a sweep moved nothing: collapse
 * the communities), or "done" (aggregating changed nothing).
 */
export function louvainInit(edges, { n, rng } = {}) {
  const count = n ?? nodeCount(edges);
  const base = {
    edges,
    n: count,
    m2: 2 * edges.reduce((acc, e) => acc + (e[2] ?? 1), 0),
    seed: rng ? Math.floor(rng() * 2 ** 31) : null,
    // Each original node's node in the level graph.
    member: Array.from({ length: count }, (_, i) => i),
    moves: 0,
    last: null,
  };
  const s = startLevel(base, levelGraph(count, edges), 0);
  return { ...s, q: modularity(edges, louvainPartition(s)) };
}

// Visit nodes in order until one moves (or, with atBoundary, until the sweep
// ends): the move rule under stepMove and sweep.
function advance(s, atBoundary) {
  if (s.phase !== "move") return s;
  const { g, m2 } = s;
  const comm = s.comm.slice();
  const tot = s.tot.slice();
  let cursor = s.cursor;
  let sweepMoves = s.sweepMoves;
  let sweeps = s.sweeps;
  let moves = s.moves;
  let last = null;
  while (true) {
    if (cursor >= s.order.length) {
      sweeps += 1;
      if (sweepMoves === 0 || m2 === 0) return { ...s, comm, tot, cursor: 0, sweepMoves: 0, sweeps, moves, phase: "aggregate", last };
      cursor = 0;
      sweepMoves = 0;
      if (atBoundary) break;
    }
    const v = s.order[cursor];
    cursor += 1;
    const own = comm[v];
    const kv = g.k[v];
    // Links from v into each neighbouring community.
    const links = new Map();
    for (const [w, wt] of g.adj[v]) links.set(comm[w], (links.get(comm[w]) ?? 0) + wt);
    tot[own] -= kv;
    const gain = (c) => (links.get(c) ?? 0) - (tot[c] * kv) / m2;
    let best = own;
    let bestGain = gain(own);
    for (const c of [...links.keys()].sort((a, b) => a - b)) {
      const gc = gain(c);
      if (gc > bestGain + 1e-12) {
        best = c;
        bestGain = gc;
      }
    }
    tot[best] += kv;
    if (best !== own) {
      comm[v] = best;
      sweepMoves += 1;
      moves += 1;
      last = { node: s.member.indexOf(v), from: own, to: best };
      if (!atBoundary) break;
    }
  }
  const next = { ...s, comm, tot, cursor, sweepMoves, sweeps, moves };
  const q = modularity(s.edges, louvainPartition(next));
  return { ...next, q, last: last && { ...last, gain: q - s.q } };
}

/**
 * Visit nodes in order until one moves to the neighbouring community that
 * raises modularity most (strictly; ties go to the smaller community id).
 * last: { node (an original node in the moved group), from, to, gain }. When
 * a whole sweep passes with no move, phase becomes "aggregate".
 */
export function stepMove(s) {
  return advance(s, false);
}

/** Runs the sweep under way to its end: every remaining node visited once. */
export function sweep(s) {
  return advance(s, true);
}

/**
 * Collapse each community into one node (links between communities summed,
 * links inside one kept as a self-loop) and start the next level; when no two
 * nodes share a community, phase becomes "done". Runs the level out first.
 */
export function aggregate(s) {
  let t = s;
  while (t.phase === "move") t = stepMove(t);
  if (t.phase === "done") return t;
  const labels = relabel(t.comm);
  const count = Math.max(0, ...labels.map((l) => l + 1));
  if (count === t.g.n) return { ...t, phase: "done", last: null };
  const edges = [];
  for (let v = 0; v < t.g.n; v++) {
    if (t.g.self[v]) edges.push([labels[v], labels[v], t.g.self[v]]);
    for (const [w, wt] of t.g.adj[v]) if (v < w) edges.push([labels[v], labels[w], wt]);
  }
  const member = t.member.map((v) => labels[v]);
  const next = startLevel({ ...t, member, last: null }, levelGraph(count, edges), t.level + 1);
  return next;
}

/** The stepper as one object: louvainStepper.init(edges, { rng }), .stepMove, .sweep, .aggregate. */
export const louvainStepper = { init: louvainInit, stepMove, sweep, aggregate };

/** Each original node's community in the state now, numbered 0, 1, … by first appearance. */
export function louvainPartition(s) {
  return relabel(s.member.map((v) => s.comm[v]));
}

/** Louvain run to the end: { partition, q, levels }. rng fixes the visiting order. */
export function louvain(edges, rng, { n } = {}) {
  let s = louvainInit(edges, { n, rng });
  while (s.phase !== "done") s = aggregate(s);
  const partition = louvainPartition(s);
  return { partition, q: modularity(edges, partition), levels: s.level + 1 };
}

/**
 * Asynchronous label propagation: each node, in a random order per round,
 * takes the label most of its neighbours carry (ties broken by rng), until
 * every node already carries one of its neighbours' most common labels or
 * maxRounds pass. Returns labels numbered 0, 1, … by first appearance.
 */
export function labelPropagation(n, edges, rng, maxRounds = 100) {
  const { out } = toAdj(n, edges);
  const label = Array.from({ length: n }, (_, i) => i);
  const best = (v) => {
    const counts = new Map();
    for (const w of out[v]) if (w !== v) counts.set(label[w], (counts.get(label[w]) ?? 0) + 1);
    let top = 0;
    for (const c of counts.values()) top = Math.max(top, c);
    return [...counts].filter(([, c]) => c === top).map(([l]) => l).sort((a, b) => a - b);
  };
  for (let round = 0; round < maxRounds; round++) {
    for (const v of shuffle(Array.from({ length: n }, (_, i) => i), rng)) {
      const top = best(v);
      if (top.length && !top.includes(label[v])) label[v] = top[randInt(rng, top.length)];
    }
    let settled = true;
    for (let v = 0; v < n && settled; v++) {
      const top = best(v);
      if (top.length && !top.includes(label[v])) settled = false;
    }
    if (settled) break;
  }
  return relabel(label);
}
