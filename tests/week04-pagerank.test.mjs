// Pins the deep dive's PageRank explorable (#cut-pagerank) to
// analysis/week04_pagerank.py's output: the damping sweep actually reorders the
// ranking, PageRank disagrees with plain degree, and the hand-rolled power
// iteration the page steps through agrees with nx.pagerank.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const json = (name) => JSON.parse(readFileSync(join(ROOT, name), "utf8"));

const d = json("docs/weeks/week04/data/pagerank.json");

test("three damping factors, each with a full, ranked top list", () => {
  assert.equal(d.damping.length, 3);
  for (const damping of d.damping) {
    const key = String(damping);
    assert.ok(Array.isArray(d.rankings[key]) && d.rankings[key].length > 0, `rankings["${key}"] present`);
    const ranks = d.rankings[key].map((r) => r.rank);
    assert.deepEqual(ranks, [...ranks].sort((a, b) => a - b), `rankings["${key}"] sorted by rank`);
    assert.equal(ranks[0], 1);
  }
});

test("raising the damping factor really reorders the top 15, not merely rescales it", () => {
  const top = (damping, n = 15) => new Set(d.rankings[String(damping)].slice(0, n).map((r) => r.code));
  const lo = top(d.damping[0]);
  const hi = top(d.damping.at(-1));
  const overlap = [...lo].filter((code) => hi.has(code)).length;
  assert.equal(overlap, d.finding.top15_overlap_d0_5_vs_d0_99);
  assert.ok(overlap < 15, "the two damping extremes should not agree on every one of the top 15");
});

test("PageRank disagrees with plain degree and with strength, at least a little", () => {
  assert.ok(d.finding.pagerank_vs_degree_top15_overlap < 15, "PageRank top 15 should not equal degree's top 15");
  assert.ok(d.finding.pagerank_vs_strength_top15_overlap < 15, "PageRank top 15 should not equal strength's top 15");
});

test("the top occupation by PageRank is named correctly, and is also this list's top by strength", () => {
  const list = d.rankings[String(0.85)];
  const row = list[0];
  assert.equal(row.code, d.finding.top_occupation);
  assert.equal(row.title, d.finding.top_occupation_title);
  const topByStrength = [...list].sort((a, b) => b.strength - a.strength)[0];
  assert.equal(topByStrength.code, row.code, "the top-ranked occupation should also lead this list by strength");
});

test("the hand-rolled power iteration converges to nx.pagerank's own fixed point", () => {
  assert.ok(d.iteration.max_error_vs_nx_pagerank <= 1e-6, "the last step should match nx.pagerank tightly");
  const steps = d.iteration.steps.map((s) => s.step);
  assert.deepEqual(steps, [...steps].sort((a, b) => a - b), "steps should be listed in increasing order");
  assert.equal(steps[0], 0, "step 0 is the equal-score start, before any round");
  const last = d.iteration.steps.at(-1);
  const rankedAtLast = last.rows.map((r) => r.pagerank);
  assert.deepEqual(rankedAtLast, [...rankedAtLast].sort((a, b) => b - a), "the final step's rows are ranked");
});

test("every mover actually moves, and its rank_shift matches rank_d0_5 minus rank_d0_99", () => {
  assert.ok(d.movers.length > 0);
  for (const m of d.movers) {
    assert.equal(m.rank_shift, m.rank_d0_5 - m.rank_d0_99);
    assert.notEqual(m.rank_d0_5, m.rank_d0_99, `${m.title} should actually change rank between d = 0.5 and d = 0.99`);
  }
  // The movers list should be sorted by the size of the shift, largest first.
  const shifts = d.movers.map((m) => Math.abs(m.rank_shift));
  assert.deepEqual(shifts, [...shifts].sort((a, b) => b - a));
});

test("mover and row ranks are true network ranks, not ranks within a shortlist", () => {
  const nodes = d.meta.nodes;
  for (const m of d.movers) {
    for (const rank of [m.rank_d0_5, m.rank_d0_99, m.degree_rank]) {
      assert.ok(rank >= 1 && rank <= nodes, `${m.title}: rank ${rank} should fall within all ${nodes} network nodes`);
    }
  }
  // At least one mover's rank should land outside a 40-occupation shortlist,
  // proving the rank is not silently capped to whatever pool selected the movers.
  assert.ok(
    d.movers.some((m) => m.rank_d0_5 > 40 || m.rank_d0_99 > 40),
    "at least one mover's true rank should exceed a top-40 pool",
  );
});

test("degree_rank is the same occupation-wide rank at every damping factor", () => {
  const byCode = new Map();
  for (const damping of d.damping) {
    for (const row of d.rankings[String(damping)]) {
      if (byCode.has(row.code)) {
        assert.equal(row.degree_rank, byCode.get(row.code), `${row.code}: degree_rank should not depend on d`);
      } else {
        byCode.set(row.code, row.degree_rank);
      }
    }
  }
});

test("each iteration step exports its own top 10, sorted by that step's own score", () => {
  for (const step of d.iteration.steps) {
    assert.equal(step.rows.length, 10, `step ${step.step} should carry exactly its own top 10`);
    const scores = step.rows.map((r) => r.pagerank);
    assert.deepEqual(scores, [...scores].sort((a, b) => b - a), `step ${step.step}: rows must be sorted by that step's score`);
  }
  // The converged step's top 10 should agree with the same-damping ranking's own top 10:
  // both describe the same fixed point, so this is the step's "true" top 10, not a stale list.
  const finalCodes = d.iteration.steps.at(-1).rows.map((r) => r.code);
  const rankingCodes = d.rankings[String(d.iteration.alpha)].slice(0, 10).map((r) => r.code);
  assert.deepEqual(finalCodes, rankingCodes, "the converged step's top 10 should match nx.pagerank's own top 10 at that damping");
  // An early step's leader need not be the final leader: this is exactly the bug the fix
  // corrects (a fixed top-10 list mislabelled an early leader), so the data must show it.
  const leaders = d.iteration.steps.map((s) => s.rows[0].code);
  assert.ok(new Set(leaders).size > 1, "the leading occupation should change across at least one early step");
});

test("the network is section 2's own occupation projection, filtered to a stricter backbone", () => {
  const jobs = json("docs/weeks/week04/data/jobs.json");
  assert.equal(d.meta.year, jobs.meta.year);
  assert.ok(d.meta.alpha_filter < 0.2, "the PageRank backbone should be stricter than section 2's own 0.2 backbone");
  assert.ok(d.meta.nodes < d.meta.nodes_before_backbone);
  assert.ok(d.meta.edges < d.meta.edges_before_backbone);
});

// The iteration card (#cut-pagerank-iteration) writes its answer and notice from
// iteration.steps. These rebuild the same claims here, check they say something
// (each settles before the last round), and tie them to the page's template.
const stable = (steps, key) => {
  const last = key(steps.at(-1));
  let at = steps.at(-1).step;
  for (let i = steps.length - 1; i >= 0 && key(steps[i]) === last; i--) at = steps[i].step;
  return at;
};
const claimsOf = (steps) => {
  const codes = (s) => s.rows.map((r) => r.code);
  const first = steps.find((s) => s.step > 0);
  return {
    leaderStep: stable(steps, (s) => s.rows[0].code),
    setStep: stable(steps, (s) => [...codes(s)].sort().join(",")),
    orderStep: stable(steps, (s) => codes(s).join(",")),
    leaderTitle: steps.at(-1).rows[0].title,
    firstStep: first.step,
    firstLeaderTitle: first.rows[0].title,
  };
};

test("the iteration card's claims: first leader, takeover, settle round", () => {
  const steps = d.iteration.steps;
  const c = claimsOf(steps);
  const last = steps.at(-1).step;
  assert.equal(c.leaderTitle, d.finding.top_occupation_title, "the final leader is the PageRank leader");
  assert.equal(c.leaderTitle, "Software Developers");
  assert.ok(c.leaderStep < last, '"leads from round N" needs the leader to settle before the last round');
  assert.ok(c.orderStep < last, '"settles by round M" and "the grey lines stop crossing" need the order to settle before the last round');
  assert.ok(c.leaderStep <= c.orderStep && c.setStep <= c.orderStep, "the top list cannot hold its order before its leader or its members");
  // The notice takes the "after round 1 X lead" branch when the first leader differs.
  assert.equal(c.firstLeaderTitle !== c.leaderTitle, c.leaderStep > c.firstStep);
  // A top list that still reorders in the last round would move the settle step to the end.
  const shaken = structuredClone(steps);
  const rows = shaken.at(-1).rows;
  [rows[2], rows[3]] = [rows[3], rows[2]];
  assert.equal(claimsOf(shaken).orderStep, last, "the settle check must bite when the last round reorders");
  // The page builds its answer and notice from exactly these claims.
  const src = readFileSync(join(ROOT, "docs/assets/js/week04-pagerank.js"), "utf8");
  assert.ok(src.includes("${claims.leaderTitle} leads from round ${claims.leaderStep}; the rest of the top ${n} settles by round ${claims.orderStep}."));
  assert.ok(src.includes("The grey lines stop crossing by round ${claims.orderStep}"));
  assert.equal(steps.at(-1).rows.length, 10, "the answer's top ${n} is the final step's ten rows");
});
