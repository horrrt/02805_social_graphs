// The rules under the kit's games, with no DOM: seeded randomness, a daily
// seed, a best-score store that survives a storage that throws, the run every
// game goes through (idle → playing → reveal), and each game's own logic.
// Pure functions over plain arrays and objects, so tests/game-core.test.mjs
// runs them in node. Graph measures come from graph-core.js; nothing here
// reads the clock or the page.
//
//   const rng = mulberry32(dailySeed("2026-10-07"));
//   const q = questInit(n, edges, home, pickTarget(n, edges, home, [3, 4], rng));
//   questMove(q, v); questHint(q); questUndo(q); score(q)
//
// Nodes are the integers 0 to n - 1 and an edge is [a, b], as in graph-core.

import { betweenness, bfsLayers, components, degrees, louvain, modularity, mulberry32, relabel, shuffle, toAdj } from "./graph-core.js";

export { mulberry32 };

// ---------------------------------------------------------------- randomness

/** A 32-bit seed from any string (FNV-1a), so a word or a date picks a run. */
export function hashSeed(text) {
  let h = 0x811c9dc5;
  for (const c of String(text)) {
    h ^= c.codePointAt(0);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

/** The seed everyone shares on one day: the date string ("2026-10-07") hashed. The caller reads the date. */
export function dailySeed(dateString) {
  return hashSeed(`daily:${String(dateString).slice(0, 10)}`);
}

/** One item of xs, or undefined for none. */
export function pick(xs, rng) {
  return xs.length ? xs[Math.floor(rng() * xs.length)] : undefined;
}

/** k items of xs without repeats, in the order drawn; all of them, shuffled, when k ≥ xs.length. */
export function sample(xs, k, rng) {
  return shuffle(xs, rng).slice(0, Math.max(0, k));
}

// ---------------------------------------------------------------- best scores

/**
 * Best scores by key, in `storage` (say window.localStorage, passed in by the
 * caller after hydration) or in memory when storage is null or throws. Every
 * read and write is wrapped in try/catch: a private window or blocked storage
 * keeps the scores for the page's life instead of failing.
 *   store.get(key) -> number | null
 *   store.record(key, score, better = "higher") -> { best, isNew }
 */
export function bestStore(storage, prefix = "kit-game:") {
  const memory = new Map();
  const read = (key) => {
    let raw = null;
    try {
      raw = storage ? storage.getItem(prefix + key) : null;
    } catch {
      raw = null;
    }
    if (raw === null || raw === undefined) raw = memory.get(key) ?? null;
    const v = raw === null ? NaN : Number(raw);
    return Number.isFinite(v) ? v : null;
  };
  const write = (key, v) => {
    memory.set(key, String(v));
    try {
      storage?.setItem(prefix + key, String(v));
    } catch {
      // The memory copy stands in.
    }
  };
  return {
    get: read,
    record(key, score, better = "higher") {
      const old = read(key);
      const wins = old === null || (better === "lower" ? score < old : score > old);
      if (wins) write(key, score);
      return { best: wins ? score : old, isNew: wins };
    },
  };
}

/** A store key for one game and its settings, the settings in key order so the same choice gives the same key. */
export function settingsKey(game, settings = {}) {
  const parts = Object.keys(settings)
    .sort()
    .map((k) => `${k}=${settings[k]}`);
  return [game, ...parts].join("|");
}

// ---------------------------------------------------------------- the run

/** A run before it starts: { phase: "idle", seed, runs, score }. */
export function runInit(seed = 1) {
  return { phase: "idle", seed, runs: 0, score: null };
}

/**
 * The run every game goes through: idle → playing → reveal, then back to idle
 * (replay) or straight into a new game (again: the next seed, or the one
 * given). Actions: { type: "start", seed? }, { type: "finish", score }, { type: "again", seed? },
 * { type: "replay" }. An action out of turn returns the state unchanged.
 */
export function runReducer(state, action) {
  switch (action.type) {
    case "start":
      if (state.phase !== "idle") return state;
      return { ...state, phase: "playing", seed: action.seed ?? state.seed, runs: state.runs + 1, score: null };
    case "finish":
      if (state.phase !== "playing") return state;
      return { ...state, phase: "reveal", score: action.score ?? null };
    case "again":
      if (state.phase !== "reveal") return state;
      return { ...state, phase: "playing", seed: action.seed ?? (state.seed + 1) >>> 0, runs: state.runs + 1, score: null };
    case "replay":
      if (state.phase === "idle") return state;
      return { ...state, phase: "idle", score: null };
    default:
      return state;
  }
}

// ---------------------------------------------------------------- path quest

/** Directed hop counts from src along out-links: -1 where unreachable. */
export function distancesOut(n, edges, src) {
  return bfsLayers(toAdj(n, edges, true), src, "out").dist;
}

/** Par for a round trip: d(home, target) + d(target, home), or null when either leg has no path. */
export function par(n, edges, home, target) {
  const out = distancesOut(n, edges, home)[target];
  const back = distancesOut(n, edges, target)[home];
  return out >= 0 && back >= 0 ? out + back : null;
}

/**
 * A target for a round trip from home: a node whose distance from home lies
 * in [lo, hi] and that has a path back. Drawn with rng; null when the band
 * holds none.
 */
export function pickTarget(n, edges, home, [lo, hi], rng) {
  const out = distancesOut(n, edges, home);
  const ok = [];
  for (let v = 0; v < n; v++) {
    if (v === home || out[v] < lo || out[v] > hi) continue;
    if (distancesOut(n, edges, v)[home] >= 0) ok.push(v);
  }
  return ok.length ? pick(ok, rng) : null;
}

/** Steps a hint adds on top of the step it takes; steps an undo adds. */
export const HINT_COST = 2;
export const UNDO_COST = 1;

/**
 * A quest from home to target and back. State: { n, edges, home, target,
 * path (nodes stood on, in order), phase ("outbound", "return" or "done"),
 * moves (every step taken, undone ones too), penalty, hints, undos, turn
 * (the path's index where the target was reached, or -1) }.
 */
export function questInit(n, edges, home, target) {
  return { n, edges, home, target, path: [home], phase: target === null || target === undefined ? "done" : "outbound", moves: 0, penalty: 0, hints: 0, undos: 0, turn: -1 };
}

/** Where the quest stands now. */
export const here = (q) => q.path[q.path.length - 1];

/** The node the current leg heads for: the target outbound, home on the way back. */
export const goal = (q) => (q.phase === "outbound" ? q.target : q.home);

/** The out-links from the node the quest stands on, in increasing order. */
export function exits(q) {
  const at = here(q);
  return [...new Set(q.edges.filter(([a]) => a === at).map(([, b]) => b))].sort((a, b) => a - b);
}

/** Fog of war: the nodes stood on and every node one out-link from them. */
export function revealed(q) {
  const stood = new Set(q.path);
  const seen = new Set(stood);
  for (const [a, b] of q.edges) if (stood.has(a)) seen.add(b);
  return seen;
}

/** Follow one out-link to v; refused (state unchanged) when v is not an exit or the quest is done. */
export function questMove(q, v) {
  if (q.phase === "done" || !exits(q).includes(v)) return q;
  const path = [...q.path, v];
  let { phase, turn } = q;
  if (phase === "outbound" && v === q.target) {
    phase = "return";
    turn = path.length - 1;
  } else if (phase === "return" && v === q.home) phase = "done";
  return { ...q, path, phase, turn, moves: q.moves + 1 };
}

/** The next step on a shortest path from where the quest stands to its goal, or null when there is none. */
export function nextStep(q) {
  if (q.phase === "done") return null;
  // A shortest route's next node is an exit one hop nearer the goal; distances to the goal come from following in-links.
  const back = bfsLayers(toAdj(q.n, q.edges, true), goal(q), "in").dist;
  const at = here(q);
  if (back[at] <= 0) return null;
  return exits(q).find((v) => back[v] === back[at] - 1) ?? null;
}

/** Take the next shortest step for HINT_COST extra steps; unchanged when no step leads on. */
export function questHint(q) {
  const v = nextStep(q);
  if (v === null) return q;
  const moved = questMove(q, v);
  return { ...moved, penalty: q.penalty + HINT_COST, hints: q.hints + 1 };
}

/** Step back to where the quest stood before, for UNDO_COST extra steps; the step undone still counts. Not past home or back across the target. */
export function questUndo(q) {
  if (q.phase === "done" || q.path.length < 2 || q.path.length - 1 === q.turn) return q;
  return { ...q, path: q.path.slice(0, -1), penalty: q.penalty + UNDO_COST, undos: q.undos + 1 };
}

/** Steps charged: every move plus the penalties. */
export const questSteps = (q) => q.moves + q.penalty;

/** A shortest route from a to b along out-links, as nodes, or null. */
export function shortestRoute(n, edges, a, b) {
  const { dist, parent } = bfsLayers(toAdj(n, edges, true), a, "out");
  if (dist[b] < 0) return null;
  const route = [b];
  while (route[0] !== a) route.unshift(parent[route[0]]);
  return route;
}

// ---------------------------------------------------------------- attack

// The edges left once `removed` is gone.
const keptEdges = (edges, gone) => edges.filter(([a, b]) => !gone.has(a) && !gone.has(b));

/** The nodes of the largest component once `removed` (a list or set) is gone; ties go to the component with the smaller node. */
export function coreAfter(n, edges, removed = []) {
  const gone = new Set(removed);
  const { comp } = components(n, keptEdges(edges, gone));
  const members = new Map();
  for (let v = 0; v < n; v++) {
    if (gone.has(v)) continue;
    if (!members.has(comp[v])) members.set(comp[v], []);
    members.get(comp[v]).push(v);
  }
  let best = [];
  for (const group of members.values()) if (group.length > best.length || (group.length === best.length && group[0] < (best[0] ?? Infinity))) best = group;
  return best.sort((a, b) => a - b);
}

/** Live nodes outside the largest component: cut off from the core. */
export function cutOff(n, edges, removed = []) {
  const gone = new Set(removed);
  const core = new Set(coreAfter(n, edges, removed));
  const out = [];
  for (let v = 0; v < n; v++) if (!gone.has(v) && !core.has(v)) out.push(v);
  return out;
}

/** Hits a run can spend: the budget, no more than the nodes there are. */
export const clampBudget = (n, budget) => Math.max(0, Math.min(n, Math.floor(budget)));

/** The core's size after 0, 1, … of `order`'s removals: [core0, core1, …]. */
export function coreCurve(n, edges, order) {
  const sizes = [coreAfter(n, edges, []).length];
  for (let i = 1; i <= order.length; i++) sizes.push(coreAfter(n, edges, order.slice(0, i)).length);
  return sizes;
}

// The live node with the largest value; ties go to the smaller id.
function argmax(values, gone) {
  let best = -1;
  for (let v = 0; v < values.length; v++) if (!gone.has(v) && (best < 0 || values[v] > values[best])) best = v;
  return best;
}

/**
 * A bot's hits: "degree" and "betweenness" take the live node that scores
 * highest on the graph left after each hit (adaptive, ties to the smaller id);
 * "random" takes live nodes in a seeded random order. At most clampBudget hits.
 */
export function botHits(n, edges, budget, kind, rng = mulberry32(1)) {
  const k = clampBudget(n, budget);
  if (kind === "random") return sample(Array.from({ length: n }, (_, v) => v), k, rng);
  const gone = new Set();
  const order = [];
  for (let i = 0; i < k; i++) {
    const kept = keptEdges(edges, gone);
    const values = kind === "betweenness" ? betweenness(n, kept) : degrees(n, kept);
    const v = argmax(values, gone);
    if (v < 0) break;
    gone.add(v);
    order.push(v);
  }
  return order;
}

/** The hint: the live node whose removal shrinks the core most (ties to the smaller id); -1 when none is left. */
export function bestHit(n, edges, removed = []) {
  const gone = new Set(removed);
  let best = -1;
  let size = Infinity;
  for (let v = 0; v < n; v++) {
    if (gone.has(v)) continue;
    const s = coreAfter(n, edges, [...removed, v]).length;
    if (s < size) {
      best = v;
      size = s;
    }
  }
  return best;
}

/** Final cores ranked smallest first: rows [{ key, core, rank }], equal cores sharing a rank. */
export function rankRuns(runs) {
  const rows = Object.entries(runs).map(([key, core]) => ({ key, core }));
  rows.sort((a, b) => a.core - b.core);
  return rows.map((r) => ({ ...r, rank: 1 + rows.filter((o) => o.core < r.core).length }));
}

// ---------------------------------------------------------------- seating

/**
 * A table's score, links above chance: L_in − (Σk)² / 4m, with L_in the links
 * among the seated, Σk their degrees summed over the whole graph and m all the
 * links. A table's share of modularity, times m. 0 with no links.
 */
export function tableScore(n, edges, seats) {
  const m = edges.length;
  if (m === 0) return 0;
  const at = new Set(seats);
  const k = degrees(n, edges);
  let inside = 0;
  for (const [a, b] of edges) if (at.has(a) && at.has(b)) inside += 1;
  let sum = 0;
  for (const v of at) sum += k[v];
  return inside - (sum * sum) / (4 * m);
}

/** What seating v adds to the table's score. */
export const seatDelta = (n, edges, seats, v) => tableScore(n, edges, [...seats, v]) - tableScore(n, edges, seats);

/** Who may sit next: anyone linked to the table, or, when nobody is, anyone not seated. Increasing order. */
export function candidates(n, edges, seats) {
  const at = new Set(seats);
  const near = new Set();
  for (const [a, b] of edges) {
    if (at.has(a) && !at.has(b)) near.add(b);
    if (at.has(b) && !at.has(a)) near.add(a);
  }
  const pool = near.size ? [...near] : Array.from({ length: n }, (_, v) => v).filter((v) => !at.has(v));
  return pool.sort((a, b) => a - b);
}

/** The greedy host: from the host, seat the candidate that adds most each time (ties to the smaller id) until k guests sit with the host. */
export function greedyTable(n, edges, host, k) {
  const seats = [host];
  while (seats.length < k + 1) {
    const pool = candidates(n, edges, seats);
    if (!pool.length) break;
    let best = pool[0];
    let gain = -Infinity;
    for (const v of pool) {
      const d = seatDelta(n, edges, seats, v);
      if (d > gain + 1e-12) {
        best = v;
        gain = d;
      }
    }
    seats.push(best);
  }
  return seats;
}

/** The random host: k guests drawn one at a time from the candidates. */
export function randomTable(n, edges, host, k, rng) {
  const seats = [host];
  while (seats.length < k + 1) {
    const v = pick(candidates(n, edges, seats), rng);
    if (v === undefined) break;
    seats.push(v);
  }
  return seats;
}

/** The best table found: the greedy table, then swaps of one guest for an outsider while any swap raises the score. */
export function bestTable(n, edges, host, k) {
  let seats = greedyTable(n, edges, host, k);
  let score = tableScore(n, edges, seats);
  for (let improved = true, rounds = 0; improved && rounds < 50; rounds++) {
    improved = false;
    for (let i = 1; i < seats.length && !improved; i++)
      for (let v = 0; v < n && !improved; v++) {
        if (seats.includes(v)) continue;
        const next = seats.map((s, j) => (j === i ? v : s));
        const s = tableScore(n, edges, next);
        if (s > score + 1e-12) {
          seats = next;
          score = s;
          improved = true;
        }
      }
  }
  return seats;
}

/** Newman's modularity Q of a partition, from graph-core (edges first). */
export const partitionQ = (edges, partition) => modularity(edges, partition);

/**
 * Seat the room from place cards: cards maps a node to its card's label. A
 * label propagation with the cards clamped (graph-core's labelPropagation
 * starts every node on its own label, so it cannot hold seeds): each round
 * visits the unclamped nodes in a seeded random order, and each takes the
 * label most of its labelled neighbours carry (ties broken by rng), until a
 * round changes nothing or maxRounds pass. A node no card reaches stays at
 * a table of its own: each such node gets a fresh label. Returns labels
 * numbered 0, 1, … by first appearance.
 */
export function seatFromCards(n, edges, cards, rng, maxRounds = 50) {
  const { out } = toAdj(n, edges);
  const label = new Array(n).fill(null);
  const fixed = new Set();
  for (const [v, l] of Object.entries(cards)) {
    const i = Number(v);
    if (i >= 0 && i < n) {
      label[i] = `c${l}`;
      fixed.add(i);
    }
  }
  const free = Array.from({ length: n }, (_, v) => v).filter((v) => !fixed.has(v));
  for (let round = 0; round < maxRounds; round++) {
    let changed = false;
    for (const v of shuffle(free, rng)) {
      const counts = new Map();
      for (const w of out[v]) if (w !== v && label[w] !== null) counts.set(label[w], (counts.get(label[w]) ?? 0) + 1);
      if (!counts.size) continue;
      const top = Math.max(...counts.values());
      if (label[v] !== null && counts.get(label[v]) === top) continue;
      const ties = [...counts].filter(([, c]) => c === top).map(([l]) => l).sort();
      label[v] = pick(ties, rng);
      changed = true;
    }
    if (!changed) break;
  }
  return relabel(label.map((l, v) => l ?? `alone${v}`));
}

/** A random seating into g tables (at least 1), every node drawn independently. */
export function randomPartition(n, g, rng) {
  const k = Math.max(1, g);
  return relabel(Array.from({ length: n }, () => Math.floor(rng() * k)));
}

/**
 * Greedy agglomeration (Clauset, Newman and Moore's rule, without their heap):
 * start with every node alone and merge the pair of linked tables that raises
 * Q most, until no merge raises it. Fine for a room of a few hundred.
 */
export function greedyModularity(n, edges) {
  let part = Array.from({ length: n }, (_, v) => v);
  let q = modularity(edges, part);
  for (;;) {
    const pairs = new Set();
    for (const [a, b] of edges) if (part[a] !== part[b]) pairs.add(part[a] < part[b] ? `${part[a]},${part[b]}` : `${part[b]},${part[a]}`);
    let best = null;
    let bestQ = q;
    for (const key of [...pairs].sort()) {
      const [x, y] = key.split(",").map(Number);
      const next = part.map((c) => (c === y ? x : c));
      const nq = modularity(edges, next);
      if (nq > bestQ + 1e-12) {
        best = next;
        bestQ = nq;
      }
    }
    if (!best) break;
    part = best;
    q = bestQ;
  }
  return relabel(part);
}

/** Louvain's seating, from graph-core, seeded. */
export const louvainSeating = (n, edges, rng) => (n === 0 ? [] : louvain(edges, rng, { n }).partition);

const entropy = (counts, total) => {
  let h = 0;
  for (const c of counts.values()) if (c) h -= (c / total) * Math.log(c / total);
  return h;
};

/** Normalised mutual information of two partitions, 2I / (H(a) + H(b)); 1 when both are a single table (or empty). */
export function nmi(a, b) {
  const total = a.length;
  if (total === 0) return 1;
  const ca = new Map();
  const cb = new Map();
  const joint = new Map();
  for (let i = 0; i < total; i++) {
    ca.set(a[i], (ca.get(a[i]) ?? 0) + 1);
    cb.set(b[i], (cb.get(b[i]) ?? 0) + 1);
    if (!joint.has(a[i])) joint.set(a[i], new Map());
    const row = joint.get(a[i]);
    row.set(b[i], (row.get(b[i]) ?? 0) + 1);
  }
  const ha = entropy(ca, total);
  const hb = entropy(cb, total);
  if (ha + hb === 0) return 1;
  let mi = 0;
  for (const [x, row] of joint) for (const [y, c] of row) mi += (c / total) * Math.log((c * total) / (ca.get(x) * cb.get(y)));
  return Math.max(0, Math.min(1, (2 * mi) / (ha + hb)));
}

/**
 * Where a seating disagrees with a reference: each of a's tables is matched to
 * the reference table it shares most guests with (ties to the smaller label),
 * and a node disagrees when its reference table is not its table's match.
 * Returns the disagreeing nodes in increasing order.
 */
export function disagreements(a, ref) {
  const overlap = new Map();
  a.forEach((x, i) => {
    if (!overlap.has(x)) overlap.set(x, new Map());
    const m = overlap.get(x);
    m.set(ref[i], (m.get(ref[i]) ?? 0) + 1);
  });
  const match = new Map();
  for (const [x, m] of overlap) {
    let best = null;
    for (const [y, c] of m) if (best === null || c > m.get(best) || (c === m.get(best) && y < best)) best = y;
    match.set(x, best);
  }
  const out = [];
  a.forEach((x, i) => {
    if (ref[i] !== match.get(x)) out.push(i);
  });
  return out;
}

// ---------------------------------------------------------------- quiz

/** Points for a clue round: total − revealed + 1 when right (all of them on the first clue, 1 on the last), 0 when wrong. */
export function cluePoints(revealedClues, total, correct) {
  if (!correct) return 0;
  return Math.max(1, total - Math.max(1, revealedClues) + 1);
}

/** How well each suspect's word bag fits the clues so far: the share of its words that are clue words. bags: { key: { word: count } }. */
export function clueScores(clues, bags) {
  const out = {};
  for (const [key, bag] of Object.entries(bags)) {
    let total = 0;
    let hit = 0;
    for (const [w, c] of Object.entries(bag)) {
      total += c;
      if (clues.includes(w)) hit += c;
    }
    out[key] = total ? hit / total : 0;
  }
  return out;
}

// The top key and score and the runner-up's score; ties go to the smaller key.
function topTwo(scores) {
  const rows = Object.entries(scores).sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1));
  return { key: rows[0]?.[0] ?? null, top: rows[0]?.[1] ?? 0, second: rows[1]?.[1] ?? 0 };
}

/**
 * When the machine commits: at the first clue c ≥ 2 where its top suspect
 * scores above 0 and at least twice the runner-up (a lone suspect has a
 * runner-up of 0), and at clue `total` whatever the scores. rows[c - 1] holds
 * the scores after c clues. Returns { clue, pick, forced }.
 */
export function machineCommit(rows, total) {
  const last = Math.max(1, Math.min(total, rows.length));
  for (let c = 2; c <= last; c++) {
    const { key, top, second } = topTwo(rows[c - 1]);
    if (top > 0 && top >= 2 * second) return { clue: c, pick: key, forced: false };
  }
  return { clue: last, pick: topTwo(rows[last - 1] ?? {}).key, forced: true };
}

/** n cases dealt from the pool in a seeded order; past the pool's end it deals a fresh shuffle. */
export function dealCases(pool, n, rng) {
  const out = [];
  if (!pool.length) return out;
  while (out.length < n) out.push(...shuffle(pool, rng).slice(0, n - out.length));
  return out;
}

/** A quiz tally: { score, streak, longest, answered, right }. */
export const quizInit = () => ({ score: 0, streak: 0, longest: 0, answered: 0, right: 0 });

/** One answer: right adds its points and extends the streak, wrong breaks it. */
export function quizAnswer(t, correct, points = correct ? 1 : 0) {
  const streak = correct ? t.streak + 1 : 0;
  return { score: t.score + (correct ? points : 0), streak, longest: Math.max(t.longest, streak), answered: t.answered + 1, right: t.right + (correct ? 1 : 0) };
}
