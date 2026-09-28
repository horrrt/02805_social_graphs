// Pins the deep dive's O*NET skills radar (#cut-skills-radar) to
// analysis/week04_skills_radar.py's output: every rating stays inside O*NET's
// 1-to-5 Importance scale, every ratings array covers all three descriptor
// groups, section 2's own 60 occupations are all present, and the page wires
// the card in.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const json = (name) => JSON.parse(readFileSync(join(ROOT, name), "utf8"));
const text = (name) => readFileSync(join(ROOT, name), "utf8");

const page = json("docs/weeks/week04/data/skills_radar.json");
const jobs = json("docs/weeks/week04/data/jobs.json");

test("skills_radar.json parses and has the expected top-level shape", () => {
  assert.ok(page.meta && typeof page.meta === "object");
  assert.ok(page.meta.groups && typeof page.meta.groups === "object");
  assert.ok(Array.isArray(page.occupations) && page.occupations.length > 0);
  assert.ok(Array.isArray(page.default));
});

test("the three descriptor groups have ids and names of equal length", () => {
  for (const group of ["skills", "knowledge", "work_activities"]) {
    const g = page.meta.groups[group];
    assert.ok(g, `meta.groups.${group} is present`);
    assert.ok(Array.isArray(g.ids) && Array.isArray(g.names));
    assert.equal(g.ids.length, g.names.length, `${group}: ids and names must match`);
  }
});

test("every occupation's ratings array matches the combined descriptor count", () => {
  const total = ["skills", "knowledge", "work_activities"]
    .reduce((sum, g) => sum + page.meta.groups[g].ids.length, 0);
  assert.ok(total > 0);
  for (const occ of page.occupations) {
    assert.equal(occ.ratings.length, total, `${occ.code}: ratings length should be ${total}, was ${occ.ratings.length}`);
  }
});

test("every rating lies in O*NET's Importance range, 1 to 5", () => {
  for (const occ of page.occupations) {
    for (const value of occ.ratings) {
      assert.ok(value >= 1 && value <= 5, `${occ.code} has a rating out of [1, 5]: ${value}`);
    }
  }
});

test("all 60 of section 2's in-network codes are present", () => {
  const codes = new Set(page.occupations.map((o) => o.code));
  const networkIds = jobs.nodes.map((n) => n.id);
  assert.equal(networkIds.length, 60, "jobs.json should still list 60 nodes");
  for (const id of networkIds) assert.ok(codes.has(id), `${id} from jobs.json is missing from skills_radar.json`);
  const flagged = page.occupations.filter((o) => o.in_network).map((o) => o.code);
  assert.equal(flagged.length, networkIds.length, "in_network should flag exactly the 60 network codes");
});

test("in_network codes carry the same cluster jobs.json assigns them", () => {
  const clusterOf = new Map(jobs.nodes.map((n) => [n.id, n.cluster]));
  for (const occ of page.occupations) {
    if (occ.in_network) assert.equal(occ.cluster, clusterOf.get(occ.code), `${occ.code}: cluster should match jobs.json`);
    else assert.equal(occ.cluster, null, `${occ.code}: an out-of-network code should have a null cluster`);
  }
});

test("default lists 1 to 5 codes, all of them present occupations", () => {
  assert.ok(page.default.length >= 1 && page.default.length <= 5);
  const codes = new Set(page.occupations.map((o) => o.code));
  for (const code of page.default) assert.ok(codes.has(code), `default code ${code} is not in occupations`);
});

test("index.html wires in the radar card", () => {
  const html = text("docs/weeks/week04/index.html");
  assert.ok(
    html.includes('id="cut-skills-radar"') || html.includes("week04-skills-radar.js"),
    "index.html should reference cut-skills-radar or the script that builds it",
  );
});
