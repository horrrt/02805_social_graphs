// The numbers under DistributionPlot, NullHistogram, NullBoard and NullBars,
// with no DOM: degree counts, P(k) three ways (raw, mixed-binned, CCDF),
// reference curves, Zipf rank-frequency, ensemble envelopes and the
// statistics of a null model. Pure functions over plain arrays, so
// tests/dist-core.test.mjs runs them in node. The binning, CCDF, log-normal
// fit and normal CDF are adapted from socialgraphs2026-web, MIT, Sune Lehmann
// (docs/explorables/ccdf-live.js and real-degrees.js).
//
//   ks = degrees(edges, { nodes, mode: "in" })
//   rawPk(ks); binnedPk(ks); ccdf(ks); poissonCurve(mean(ks), 40)
//   s = nullStats(samples, real); verdict(s)

// ---- degrees and P(k)

/**
 * Each node's degree from an edge list `[[a, b], …]`, in the order of `nodes`
 * when given (so isolates count, as 0), else in order of first appearance.
 * mode "in" and "out" count edges (a repeated edge counts twice); "undirected"
 * (the default) counts distinct neighbours, as the course's degreeSets() does.
 * Self-loops count for "in" and "out" but give no neighbour.
 * @param {Iterable<[any, any]> | null | undefined} edges
 * @param {{ nodes?: Iterable<any>, mode?: "in" | "out" | "undirected" }} [opts]
 * @returns {number[]}
 */
export function degrees(edges, { nodes, mode = "undirected" } = {}) {
  const order = nodes ? [...nodes] : [];
  const index = new Map(order.map((id, i) => [id, i]));
  const at = (id) => {
    if (!index.has(id)) {
      index.set(id, order.length);
      order.push(id);
    }
    return index.get(id);
  };
  const ins = [];
  const outs = [];
  const nbrs = [];
  for (const [a, b] of edges ?? []) {
    const i = at(a);
    const j = at(b);
    outs[i] = (outs[i] ?? 0) + 1;
    ins[j] = (ins[j] ?? 0) + 1;
    if (i !== j) {
      (nbrs[i] ??= new Set()).add(j);
      (nbrs[j] ??= new Set()).add(i);
    }
  }
  return order.map((_, i) => (mode === "in" ? ins[i] ?? 0 : mode === "out" ? outs[i] ?? 0 : nbrs[i]?.size ?? 0));
}

/** [[k, nodes with degree k]] for every k present, k ascending. */
export function degreeCounts(ks) {
  const c = new Map();
  for (const k of ks ?? []) c.set(k, (c.get(k) ?? 0) + 1);
  return [...c.entries()].sort((a, b) => a[0] - b[0]);
}

/** Raw P(k): [[k, share of nodes]] for every k present. */
export function rawPk(ks) {
  const n = ks?.length ?? 0;
  return degreeCounts(ks).map(([k, m]) => [k, m / n]);
}

/**
 * Mixed-binned P(k): one bin per k below `exact` (8 by default, where counts
 * are still dense), then bins `factor` (2) times wider each, [8, 16), [16, 32),
 * …. Each bin's density is its nodes over all N over its width in k, so the
 * exact bins equal raw P(k); a wide bin sits at the geometric mean of its
 * integer range. Empty bins are left out. The course bins k + 1; this bins k,
 * so k = 0 keeps its own bin (which a log axis leaves off).
 * @param {number[]} ks
 * @param {{ exact?: number, factor?: number }} [opts]
 * @returns {[number, number][]}
 */
export function binnedPk(ks, { exact = 8, factor = 2 } = {}) {
  const n = ks?.length ?? 0;
  if (!n) return [];
  const counts = degreeCounts(ks);
  const max = counts[counts.length - 1][0];
  const out = [];
  const push = (lo, hi) => {
    const m = counts.reduce((s, [k, c]) => (k >= lo && k < hi ? s + c : s), 0);
    if (m > 0) out.push([hi - lo === 1 ? lo : Math.sqrt(lo * (hi - 1)), m / n / (hi - lo)]);
  };
  const first = Math.min(0, counts[0][0]);
  for (let k = first; k < exact && k <= max; k++) push(k, k + 1);
  const next = (lo) => Math.max(lo + 1, Math.ceil(lo * factor));
  for (let lo = Math.max(exact, 1); lo <= max; lo = next(lo)) push(lo, next(lo));
  return out;
}

/** The CCDF: [[k, P(K ≥ k)]] for every distinct k present, so the first point is [min k, 1]. */
export function ccdf(ks) {
  const n = ks?.length ?? 0;
  const s = [...(ks ?? [])].sort((a, b) => a - b);
  const out = [];
  for (let i = 0; i < n; i++) if (i === 0 || s[i] !== s[i - 1]) out.push([s[i], (n - i) / n]);
  return out;
}

export const mean = (a) => (a.length ? a.reduce((s, v) => s + v, 0) / a.length : NaN);

// ---- reference curves

const LN_FACT = [0];
/** ln(k!) for a whole k ≥ 0, cached; Stirling's series past 1000. */
export function lnFactorial(k) {
  if (k < LN_FACT.length) return LN_FACT[k];
  if (k > 1000) return k * Math.log(k) - k + 0.5 * Math.log(2 * Math.PI * k) + 1 / (12 * k);
  for (let i = LN_FACT.length; i <= k; i++) LN_FACT[i] = LN_FACT[i - 1] + Math.log(i);
  return LN_FACT[k];
}

/** The Poisson pmf P(K = k) for mean λ, in log space so a large k neither overflows nor underflows to NaN. */
export function poisson(k, lambda) {
  if (k < 0 || !Number.isInteger(k)) return 0;
  if (lambda <= 0) return k === 0 ? 1 : 0;
  return Math.exp(k * Math.log(lambda) - lambda - lnFactorial(k));
}

/** [[k, P(K = k)]] for k = 0 … kMax. */
export function poissonCurve(lambda, kMax) {
  const out = [];
  for (let k = 0; k <= kMax; k++) out.push([k, poisson(k, lambda)]);
  return out;
}

/** `n` points spread evenly in log between lo and hi (both > 0). */
export function logSpace(lo, hi, n = 50) {
  if (!(lo > 0 && hi > 0) || n < 1) return [];
  if (n === 1 || lo === hi) return [lo];
  const a = Math.log(lo);
  const b = Math.log(hi);
  return Array.from({ length: n }, (_, i) => Math.exp(a + ((b - a) * i) / (n - 1)));
}

/** A power law y = y0 · (x / x0)^(−γ) through the anchor [x0, y0], at each x > 0. */
export function powerLaw(xs, gamma, [x0, y0] = [1, 1]) {
  return xs.filter((x) => x > 0).map((x) => [x, y0 * (x / x0) ** -gamma]);
}

/** An exponential y = y0 · e^(−rate · (x − x0)) through the anchor [x0, y0]. */
export function exponential(xs, rate, [x0, y0] = [0, 1]) {
  return xs.map((x) => [x, y0 * Math.exp(-rate * (x - x0))]);
}

/** The log-normal fitted by moments of ln k over k ≥ 1: { mu, sigma, frac } with frac the share of nodes with k ≥ 1. */
export function lognormalFit(ks) {
  const l = (ks ?? []).filter((k) => k >= 1).map(Math.log);
  if (!l.length) return { mu: NaN, sigma: NaN, frac: 0 };
  const mu = mean(l);
  return { mu, sigma: Math.sqrt(mean(l.map((v) => (v - mu) ** 2))), frac: l.length / ks.length };
}

/** The log-normal density at x > 0. */
export function lognormalPdf(x, mu, sigma) {
  if (!(x > 0) || !(sigma > 0)) return 0;
  return Math.exp(-((Math.log(x) - mu) ** 2) / (2 * sigma * sigma)) / (x * sigma * Math.sqrt(2 * Math.PI));
}

/** The standard normal CDF (Abramowitz and Stegun 7.1.26). */
export function Phi(z) {
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const d = 0.3989422804014327 * Math.exp((-z * z) / 2);
  const p = d * t * (0.31938153 + t * (-0.356563782 + t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))));
  return z >= 0 ? 1 - p : p;
}

/** The normal density at x. */
export function normalPdf(x, mu, sd) {
  if (!(sd > 0)) return 0;
  return Math.exp(-(((x - mu) / sd) ** 2) / 2) / (sd * Math.sqrt(2 * Math.PI));
}

// ---- Zipf

/** An ideal Zipf curve: [[r, top / r^s]] for ranks r = 1 … n. */
export function zipfIdeal(n, s = 1, top = 1) {
  return Array.from({ length: Math.max(0, n) }, (_, i) => [i + 1, top / (i + 1) ** s]);
}

/**
 * Rank-frequency from counts (an array of numbers, a Map or an object of
 * word → count): `points` [[rank, f]], highest f first, and `levels`
 * [[f, firstRank, lastRank]], one per distinct f, since tied items share no
 * natural order. Counts of 0 or below are left out.
 */
export function rankFrequency(counts) {
  const values = Array.isArray(counts) ? counts : counts instanceof Map ? [...counts.values()] : Object.values(counts ?? {});
  const fs = values.map(Number).filter((f) => f > 0).sort((a, b) => b - a);
  const points = fs.map((f, i) => [i + 1, f]);
  const levels = [];
  fs.forEach((f, i) => {
    const last = levels[levels.length - 1];
    if (last && last[0] === f) last[2] = i + 1;
    else levels.push([f, i + 1, i + 1]);
  });
  return { points, levels };
}

// ---- ensembles

/** The q-quantile of an ascending array by linear interpolation (R's type 7); NaN when empty. */
export function quantile(sorted, q) {
  if (!sorted.length) return NaN;
  const h = (sorted.length - 1) * Math.min(1, Math.max(0, q));
  const lo = Math.floor(h);
  return sorted[lo] + (h - lo) * ((sorted[Math.min(lo + 1, sorted.length - 1)] ?? sorted[lo]) - sorted[lo]);
}

/**
 * Per-x quantiles across an ensemble of runs, each run `[[x, y], …]`:
 * [{ x, median, lo, hi, n }] for every x any run has, x ascending, with lo and
 * hi the `lo` and `hi` quantiles (5% and 95% by default). A run without some x
 * counts as `missing` there:
 * - "zero" (the default): y = 0, right for P(k), where a missing k had no node;
 * - "ccdf": the run's y at its next larger x, or 0 past its last, right for a CCDF;
 * - "skip": the run is left out at that x (n says how many runs remain).
 * @param {[number, number][][]} runs
 * @param {{ lo?: number, hi?: number, missing?: "zero" | "ccdf" | "skip" }} [opts]
 */
export function envelope(runs, { lo = 0.05, hi = 0.95, missing = "zero" } = {}) {
  const maps = (runs ?? []).map((run) => {
    const sorted = [...run].sort((a, b) => a[0] - b[0]);
    return { sorted, at: new Map(sorted.map(([x, y]) => [x, y])) };
  });
  const xs = [...new Set(maps.flatMap((m) => m.sorted.map((p) => p[0])))].sort((a, b) => a - b);
  return xs.map((x) => {
    const ys = [];
    for (const m of maps) {
      if (m.at.has(x)) ys.push(m.at.get(x));
      else if (missing === "zero") ys.push(0);
      else if (missing === "ccdf") ys.push(m.sorted.find((p) => p[0] > x)?.[1] ?? 0);
    }
    ys.sort((a, b) => a - b);
    return { x, median: quantile(ys, 0.5), lo: quantile(ys, lo), hi: quantile(ys, hi), n: ys.length };
  });
}

// ---- null models

/**
 * Counts of `values` in `bins` equal-width bins over `domain` ([min, max] of
 * the values by default): [{ x0, x1, count }]. A value on the top edge falls
 * in the last bin; values outside the domain are not counted. A domain of zero
 * width becomes one unit wide around its value.
 * @param {number[]} values
 * @param {{ bins?: number, domain?: [number, number] }} [opts]
 */
export function histogram(values, { bins = 30, domain } = {}) {
  const vs = (values ?? []).filter(Number.isFinite);
  let [a, b] = domain ?? (vs.length ? [Math.min(...vs), Math.max(...vs)] : [0, 1]);
  if (a === b) [a, b] = [a - 0.5, b + 0.5];
  const n = Math.max(1, Math.floor(bins));
  const w = (b - a) / n;
  const out = Array.from({ length: n }, (_, i) => ({ x0: a + i * w, x1: a + (i + 1) * w, count: 0 }));
  for (const v of vs) {
    if (v < a || v > b) continue;
    out[Math.min(n - 1, Math.floor((v - a) / w))].count++;
  }
  return out;
}

/**
 * The real value against its null samples. Returns { n, mean, sd, z, pAbove,
 * pBelow, pOne, pTwo }:
 * - sd is the sample sd (n − 1), exactly 0 when every sample is equal;
 * - z = (real − mean) / sd, null when sd is 0;
 * - pAbove = (1 + #{null ≥ real}) / (n + 1) and pBelow = (1 + #{null ≤ real}) / (n + 1),
 *   the +1 counting the real network as one more draw, so p is never 0;
 * - pOne is the tail on real's side of the null mean, pTwo = min(1, 2 · min(pAbove, pBelow)).
 * With no samples every field but n is null.
 */
export function nullStats(samples, real) {
  const s = (samples ?? []).filter(Number.isFinite);
  const n = s.length;
  if (!n) return { n: 0, mean: null, sd: null, z: null, pAbove: null, pBelow: null, pOne: null, pTwo: null };
  // Equal samples have sd 0 exactly; summing them would leave rounding error (300 × 5.9 / 300 ≠ 5.9).
  const same = s.every((v) => v === s[0]);
  const m = same ? s[0] : mean(s);
  const sd = !same && n > 1 ? Math.sqrt(s.reduce((acc, v) => acc + (v - m) ** 2, 0) / (n - 1)) : 0;
  const pAbove = (1 + s.filter((v) => v >= real).length) / (n + 1);
  const pBelow = (1 + s.filter((v) => v <= real).length) / (n + 1);
  return {
    n,
    mean: m,
    sd,
    z: sd > 0 ? (real - m) / sd : null,
    pAbove,
    pBelow,
    pOne: real >= m ? pAbove : pBelow,
    pTwo: Math.min(1, 2 * Math.min(pAbove, pBelow)),
  };
}

/**
 * What the null says about a real value, from nullStats(samples, real):
 * - "fixed": every null sample equals the real value (sd 0, |real − mean| ≤
 *   eps · max(1, |mean|)), so the null model holds it by construction;
 * - "survives": p below alpha (two-sided by default, `sided: "one"` for pOne);
 * - "dies": the null reproduces it.
 * Null when there are no samples. A null with sd 0 that misses the real value
 * is not fixed: p decides, and with few samples p cannot go below 1 / (n + 1).
 * @param {{ n: number, mean: number | null, sd: number | null, pOne: number | null, pTwo: number | null } | null} stats
 * @param {number} real
 * @param {{ alpha?: number, sided?: "one" | "two", eps?: number }} [opts]
 * @returns {"survives" | "dies" | "fixed" | null}
 */
export function verdict(stats, real, { alpha = 0.05, sided = "two", eps = 1e-9 } = {}) {
  if (!stats || !stats.n) return null;
  if (stats.sd === 0 && Math.abs(real - stats.mean) <= eps * Math.max(1, Math.abs(stats.mean))) return "fixed";
  const p = sided === "one" ? stats.pOne : stats.pTwo;
  return p < alpha ? "survives" : "dies";
}
