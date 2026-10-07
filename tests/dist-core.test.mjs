// Pins the numbers under the kit's distribution and null-model components
// (src/kit/dist-core.js): degree counts, the three views of P(k), reference
// curves, Zipf rank-frequency, ensemble envelopes, null statistics and the
// verdict. Pure functions, so this runs in node with no DOM.
import test from "node:test";
import assert from "node:assert/strict";
import {
  binnedPk, ccdf, degreeCounts, degrees, envelope, exponential, histogram, lnFactorial, logSpace, lognormalFit, lognormalPdf,
  normalPdf, nullStats, Phi, poisson, poissonCurve, powerLaw, quantile, rankFrequency, rawPk, verdict, zipfIdeal,
} from "../src/kit/dist-core.js";

const close = (a, b, eps = 1e-9, msg) => assert.ok(Math.abs(a - b) <= eps, `${msg ?? ""} ${a} ≈ ${b}`);

test("degrees counts in, out and distinct undirected neighbours, isolates included", () => {
  const edges = [["a", "b"], ["a", "c"], ["b", "a"], ["a", "b"], ["c", "c"]];
  const nodes = ["a", "b", "c", "d"];
  assert.deepEqual(degrees(edges, { nodes, mode: "out" }), [3, 1, 1, 0]);
  assert.deepEqual(degrees(edges, { nodes, mode: "in" }), [1, 2, 2, 0], "the repeated a → b counts twice");
  assert.deepEqual(degrees(edges, { nodes }), [2, 1, 1, 0], "undirected: a–b once, a–c once, the self-loop gives no neighbour");
  assert.deepEqual(degrees([[2, 1]]), [1, 1], "without nodes, in order of first appearance");
  assert.deepEqual(degrees([], { nodes: [1, 2] }), [0, 0]);
  assert.deepEqual(degrees(undefined), []);
});

test("raw P(k) sums to 1 and degreeCounts sorts by k", () => {
  const ks = [3, 1, 1, 0, 3, 3];
  assert.deepEqual(degreeCounts(ks), [[0, 1], [1, 2], [3, 3]]);
  const pk = rawPk(ks);
  assert.deepEqual(pk.map((p) => p[0]), [0, 1, 3]);
  close(pk.reduce((s, p) => s + p[1], 0), 1);
  assert.deepEqual(rawPk([]), []);
});

test("binnedPk: exact bins equal raw P(k), log bins sit at the geometric mean and keep total mass", () => {
  const ks = [0, 1, 1, 2, 5, 8, 9, 15, 16, 40];
  const bins = binnedPk(ks);
  const raw = new Map(rawPk(ks));
  for (const [x, p] of bins.filter(([x]) => x < 8)) close(p, raw.get(x), 1e-12, `k=${x}`);
  // [8, 16) holds 8, 9, 15: 3 of 10 nodes over a width of 8, at sqrt(8 · 15).
  const b8 = bins.find(([x]) => x > 8 && x < 16);
  close(b8[0], Math.sqrt(8 * 15));
  close(b8[1], 3 / 10 / 8);
  // Density × width over all bins is all the mass.
  const widths = [1, 1, 1, 1, 8, 16, 32];
  close(bins.reduce((s, [, p], i) => s + p * widths[i], 0), 1);
  assert.deepEqual(binnedPk([]), []);
  assert.ok(binnedPk([1, 50], { factor: 1 }).length > 0, "a factor of 1 still ends");
});

test("ccdf starts at 1 and steps down at each distinct k", () => {
  assert.deepEqual(ccdf([2, 1, 2, 5]), [[1, 1], [2, 0.75], [5, 0.25]]);
  assert.deepEqual(ccdf([]), []);
  assert.deepEqual(ccdf([0, 0]), [[0, 1]]);
});

test("poisson is computed in log space, sums to 1 and handles λ = 0", () => {
  close(poisson(3, 2), (Math.exp(-2) * 8) / 6, 1e-12);
  close(poissonCurve(5.9, 60).reduce((s, p) => s + p[1], 0), 1, 1e-9);
  assert.ok(Number.isFinite(poisson(400, 300)) && poisson(400, 300) > 0, "k past 170 does not overflow");
  assert.equal(poisson(0, 0), 1);
  assert.equal(poisson(2, 0), 0);
  assert.equal(poisson(-1, 2), 0);
  assert.equal(poisson(1.5, 2), 0);
  close(lnFactorial(5), Math.log(120), 1e-12);
  close(lnFactorial(2000), lnFactorial(1000) + Array.from({ length: 1000 }, (_, i) => Math.log(1001 + i)).reduce((a, b) => a + b), 1e-6);
});

test("reference curves pass through their anchors", () => {
  const pl = powerLaw([0, 1, 10, 100], 2, [10, 0.01]);
  assert.equal(pl.length, 3, "x ≤ 0 is dropped from a power law");
  close(pl[1][1], 0.01);
  close(pl[2][1], 0.0001);
  const ex = exponential([2, 3], Math.log(2), [2, 0.5]);
  close(ex[0][1], 0.5);
  close(ex[1][1], 0.25);
  const xs = logSpace(1, 1000, 4);
  xs.forEach((x, i) => close(x, 10 ** i, 1e-9));
  assert.deepEqual(logSpace(0, 10), []);
});

test("lognormalFit uses moments of ln k over k ≥ 1", () => {
  const fit = lognormalFit([0, 1, Math.E ** 2]);
  close(fit.mu, 1);
  close(fit.sigma, 1);
  close(fit.frac, 2 / 3);
  assert.equal(lognormalFit([0, 0]).frac, 0);
  assert.equal(lognormalPdf(0, 0, 1), 0);
  close(lognormalPdf(1, 0, 1), 1 / Math.sqrt(2 * Math.PI));
});

test("Phi and the normal density", () => {
  close(Phi(0), 0.5, 1e-7);
  close(Phi(1.96), 0.975, 1e-4);
  close(Phi(-1.96), 0.025, 1e-4);
  close(normalPdf(0, 0, 1), 1 / Math.sqrt(2 * Math.PI));
  assert.equal(normalPdf(0, 0, 0), 0);
});

test("zipfIdeal and rankFrequency with tie levels", () => {
  assert.deepEqual(zipfIdeal(3, 1, 600), [[1, 600], [2, 300], [3, 200]]);
  assert.deepEqual(zipfIdeal(0), []);
  const { points, levels } = rankFrequency({ the: 9, of: 4, a: 4, b: 1, c: 1, d: 1, zero: 0 });
  assert.deepEqual(points, [[1, 9], [2, 4], [3, 4], [4, 1], [5, 1], [6, 1]]);
  assert.deepEqual(levels, [[9, 1, 1], [4, 2, 3], [1, 4, 6]]);
  assert.deepEqual(rankFrequency(new Map([["x", 2]])).levels, [[2, 1, 1]]);
  assert.deepEqual(rankFrequency([]), { points: [], levels: [] });
});

test("quantile interpolates linearly", () => {
  assert.equal(quantile([1, 2, 3, 4, 5], 0.5), 3);
  close(quantile([0, 10], 0.05), 0.5);
  assert.equal(quantile([7], 0.95), 7);
  assert.ok(Number.isNaN(quantile([], 0.5)));
});

test("envelope fills a missing x as zero, as the CCDF's next step, or skips it", () => {
  const runs = [[[1, 0.5], [2, 0.5]], [[1, 1]], [[1, 0.2], [3, 0.8]]];
  const zero = envelope(runs);
  assert.deepEqual(zero.map((r) => r.x), [1, 2, 3]);
  assert.equal(zero[1].median, 0, "x = 2: 0.5, 0, 0");
  assert.equal(zero[0].median, 0.5);
  assert.equal(zero[0].n, 3);
  const skip = envelope(runs, { missing: "skip" });
  assert.equal(skip[1].n, 1);
  assert.equal(skip[1].median, 0.5);
  const step = envelope([[[1, 1], [3, 0.4]], [[1, 1], [2, 0.6]]], { missing: "ccdf" });
  assert.deepEqual(step.map((r) => r.median), [1, (0.4 + 0.6) / 2, (0.4 + 0) / 2]);
  const band = envelope(Array.from({ length: 101 }, (_, i) => [[0, i]]));
  close(band[0].lo, 5);
  close(band[0].hi, 95);
  assert.deepEqual(envelope([]), []);
});

test("histogram keeps a fixed domain, puts the top edge in the last bin and widens a zero-width domain", () => {
  const h = histogram([0, 0.5, 1, 2, -1], { bins: 2, domain: [0, 1] });
  assert.deepEqual(h.map((b) => b.count), [1, 2]);
  const flat = histogram([3, 3, 3], { bins: 4 });
  assert.equal(flat[0].x0, 2.5);
  assert.equal(flat.reduce((s, b) => s + b.count, 0), 3);
  assert.equal(histogram([], { bins: 5 }).length, 5);
});

test("nullStats: mean, sample sd, z and +1-corrected empirical p", () => {
  const s = nullStats([1, 2, 3, 4], 4);
  close(s.mean, 2.5);
  close(s.sd, Math.sqrt(5 / 3));
  close(s.z, 1.5 / Math.sqrt(5 / 3));
  close(s.pAbove, 2 / 5, 1e-12, "one sample ≥ 4, plus one");
  close(s.pBelow, 5 / 5);
  close(s.pOne, 2 / 5);
  close(s.pTwo, 4 / 5);
  const far = nullStats([1, 2, 3], 100);
  close(far.pAbove, 1 / 4, 1e-12, "never 0");
  close(far.pTwo, 1 / 2);
  const low = nullStats([1, 2, 3], -5);
  close(low.pOne, 1 / 4, 1e-12, "the tail on real's side");
  assert.equal(nullStats([5], 5).sd, 0);
  const equal = nullStats(Array.from({ length: 300 }, () => 5.9), 5.9);
  assert.equal(equal.mean, 5.9, "equal samples keep their value as the mean, with no rounding error");
  assert.equal(equal.sd, 0);
  assert.equal(equal.z, null);
  assert.equal(nullStats([5], 5).z, null);
  assert.deepEqual(nullStats([], 1), { n: 0, mean: null, sd: null, z: null, pAbove: null, pBelow: null, pOne: null, pTwo: null });
});

test("verdict: fixed, survives and dies at their boundaries", () => {
  const fixed = [2, 2, 2];
  assert.equal(verdict(nullStats(fixed, 2), 2), "fixed");
  assert.equal(verdict(nullStats(Array.from({ length: 300 }, () => 5.9), 5.9), 5.9), "fixed");
  assert.equal(verdict(nullStats(fixed, 2 + 1e-12), 2 + 1e-12), "fixed", "within eps");
  assert.equal(verdict(nullStats(fixed, 3), 3), "dies", "sd 0 but missed: p = 1/4 with three samples");
  const many = Array.from({ length: 99 }, () => 2);
  assert.equal(verdict(nullStats(many, 3), 3), "survives", "sd 0, missed, p = 2 · 1/100");
  const spread = Array.from({ length: 199 }, (_, i) => i);
  // Real above all 199: pAbove = 1/200, pTwo = 0.01.
  assert.equal(verdict(nullStats(spread, 500), 500), "survives");
  // Real at the 3rd largest: pAbove = 3/200 = 0.015, pTwo = 0.03 < 0.05.
  assert.equal(verdict(nullStats(spread, 197), 197), "survives");
  // pAbove = 5/200 = 0.025, pTwo = 0.05: not below alpha.
  assert.equal(verdict(nullStats(spread, 195), 195), "dies");
  assert.equal(verdict(nullStats(spread, 195), 195, { sided: "one" }), "survives");
  assert.equal(verdict(nullStats(spread, 100), 100), "dies");
  assert.equal(verdict(nullStats([], 1), 1), null);
  assert.equal(verdict(null, 1), null);
});
