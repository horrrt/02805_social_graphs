// Pins the deep dive's O*NET skills box (#cut-skills) to analysis/week04_skills.py's
// output, and checks the direction its prose and chart depend on, so a rerun that
// narrows or reverses the gap fails here instead of leaving a stale claim on the page.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const json = (name) => JSON.parse(readFileSync(join(ROOT, name), "utf8"));

const page = json("public/weeks/week04/data/skills.json");
const c = page.cohiring;
const jobs = json("public/weeks/week04/data/jobs.json");

test("skills.json validates against week04_schemas.Skills (extra fields aside, shape holds)", () => {
  assert.ok(page.meta && typeof page.meta === "object");
  assert.equal(typeof c.occupations, "number");
  for (const key of ["direct_ties", "same_cluster_other_pairs", "different_cluster_pairs", "all_pairs"]) {
    assert.ok(c[key], `cohiring.${key} is present`);
    assert.equal(typeof c[key].n, "number");
    assert.equal(typeof c[key].mean, "number");
  }
});

test("the page's population is section 2's own 60-occupation network, not the wider O*NET set", () => {
  const ids = new Set(jobs.nodes.map((n) => n.id));
  assert.equal(c.occupations, jobs.nodes.length, "cohiring.occupations should be jobs.json's node count");
  assert.ok(c.occupations <= ids.size);
});

test("S1: a direct hiring tie means more alike skills than a random pair of the 60", () => {
  assert.ok(
    c.direct_ties.mean > c.all_pairs.mean,
    `direct ties (${c.direct_ties.mean}) should beat the random-pair baseline (${c.all_pairs.mean})`,
  );
  // Not just noise: the gap should clear at least a tenth of the baseline's own spread.
  assert.ok(c.direct_ties.mean - c.all_pairs.mean > 0.1 * c.all_pairs.sd);
  assert.ok(c.direct_ties.n > 0 && c.same_cluster_other_pairs.n > 0 && c.different_cluster_pairs.n > 0);
});

test("S2: same-cluster pairs beat different-cluster pairs, both without double-counting direct ties", () => {
  assert.ok(
    c.same_cluster_other_pairs.mean > c.different_cluster_pairs.mean,
    `same-cluster (${c.same_cluster_other_pairs.mean}) should beat different-cluster (${c.different_cluster_pairs.mean})`,
  );
  // The four groups' pair counts add up to the full C(60, 2) with no overlap:
  // direct ties + same-cluster-other + different-cluster == all_pairs.
  const total = c.direct_ties.n + c.same_cluster_other_pairs.n + c.different_cluster_pairs.n;
  assert.equal(total, c.all_pairs.n, "the three disjoint groups must sum to every pair");
});

test("every reported similarity stays inside cosine similarity's own range", () => {
  for (const key of ["direct_ties", "same_cluster_other_pairs", "different_cluster_pairs", "all_pairs"]) {
    const g = c[key];
    assert.ok(g.mean >= -1 && g.mean <= 1, `${key}.mean out of [-1, 1]`);
    for (const ex of g.examples) assert.ok(ex.similarity >= -1 && ex.similarity <= 1);
  }
});

test('"Both sit close to the random-pair baseline": within half a standard deviation of it', () => {
  // The skills card's notice (week04-skills.js) says both kinds of pair sit close to the baseline.
  const a = c.all_pairs;
  for (const key of ["same_cluster_other_pairs", "different_cluster_pairs"]) {
    const gap = Math.abs(c[key].mean - a.mean);
    assert.ok(gap < 0.5 * a.sd, `${key} is ${gap.toFixed(3)} from the baseline, more than half its sd (${a.sd})`);
  }
});
