// The Marvel posts say our pipeline reproduces the figures the course briefs
// quote. analysis/course_reference.py writes the comparison; this test fails
// when that file records a miss, and builds each sentence the pages print from
// it, so a rerun that moves a number cannot leave the claim behind.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ROOT, builtPage } from "./built-page.mjs";

const ref = JSON.parse(readFileSync(join(ROOT, "analysis/course_reference.json"), "utf8"));
const plain = (path) => builtPage(path).replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/\s+/g, " ");
const count = (n) => n.toLocaleString("en-US");
const ours = (what) => {
  const row = ref.network.find((r) => r.what.startsWith(what));
  assert.ok(row, `analysis/course_reference.json has no row for "${what}"`);
  return row;
};
const shown = (what) => {
  const r = ours(what);
  return r.digits ? r.ours.toFixed(r.digits) : count(Math.round(r.ours));
};

test("every network figure the course quotes is reproduced", () => {
  const misses = ref.network.filter((r) => !r.match).map((r) => `${r.what}: ${r.course} vs ${r.ours}`);
  assert.deepEqual(misses, []);
});

test("Week 1 lists the reproduced figures", () => {
  const page = plain("out/weeks/week01/index.html");
  const out = ours("highest out-degree").what.match(/\((.+)\)/)[1];
  const expected =
    `${shown("nodes")} characters, ${shown("directed links")} links, ${shown("undirected pairs")} linked pairs ` +
    `(${shown("pairs linked both ways")} of them both ways), an average degree of ${shown("average undirected degree")}, ` +
    `${shown("isolates")} isolates, one island of ${shown("characters on the one island")}, ` +
    `Spider-Man's ${shown("highest in-degree")} incoming links, ${out}'s ${shown("highest out-degree")} outgoing, ` +
    `and in the largest component an average distance of ${shown("average distance")} and a diameter of ${shown("diameter")}.`;
  assert.ok(page.includes(expected), `Week 1 should say: ${expected}`);
});

test("Week 2 compares its random null with the course's", () => {
  const page = plain("out/weeks/week02/index.html");
  const hub = ours("random network: biggest hub");
  const dist = ours("random network: average distance");
  const expected =
    `the biggest hub has ${count(Math.round(hub.ours))} links on average and the average distance is ` +
    `${dist.ours.toFixed(2)}; the course brief gives about ${hub.course} and ${dist.course},`;
  assert.ok(page.includes(expected), `Week 2 should say: ${expected}`);
});

test("Week 5 reports the token counts under both rules", () => {
  const page = plain("out/weeks/week05/index.html");
  const { course, ours: o, spacy: s } = ref.text;
  const pct = (x) => `${Math.round(x * 100)}%`;
  for (const expected of [
    `about ${count(course.tokens)} tokens and ${count(course.types)} types for these pages, ${pct(course.hapax_share)} of them used once`,
    `Our word rule counts ${count(o.tokens)} words and ${count(o.types)} types, ${pct(o.hapax_share)} used once: it keeps ${count(o.kept_whole)} words`,
    `gives ${count(s.tokens)} tokens, ${count(s.types)} types and ${pct(s.hapax_share)} used once`,
  ]) {
    assert.ok(page.includes(expected), `Week 5 should say: ${expected}`);
  }
});
