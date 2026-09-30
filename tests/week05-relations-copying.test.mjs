// Pins the text of week 5's sections 1 and 2 to the analysis output, so a
// rerun that moves a number fails here instead of leaving the prose behind.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { block, flatten } from "./week04-html.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (name) => readFileSync(join(ROOT, name), "utf8");
const json = (name) => JSON.parse(read(name));
const html = read("docs/weeks/week05/index.html");
const text = (id) => flatten(block(html, id));

const count = (n) => n.toLocaleString("en-US");
const pct = (x, digits = 0) => `${(100 * x).toFixed(digits)}%`;
const z = (v) => `${v < 0 ? "−" : ""}${Math.abs(v).toFixed(1)}`;
const WORDS = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve"];

test("section 1 quotes relations.json", () => {
  const r = json("docs/weeks/week05/data/relations.json");
  const s = text("relations");
  const has = (t) => assert.ok(s.includes(t), `section 1 should say "${t}"`);
  const label = Object.fromEntries(r.labels.map((l) => [l.label, l]));
  const cross = Object.fromEntries(r.crossing.map((c) => [c.label, c]));
  const prec = r.precision;
  const labelled = r.labels.filter((l) => l.label !== "unlabelled").reduce((sum, l) => sum + l.arcs, 0);

  has(`For each of the ${count(r.coverage.arcs)} links`);
  has(`found one for ${count(r.coverage.with_sentence)} (${pct(r.coverage.share)})`);
  has(`${count(label.unlabelled.arcs)} of the sentences (${pct(label.unlabelled.share)}) match no word at all`);
  has(`${r.communities.runs} Louvain runs`);
  has(`compared it with ${count(r.meta.shuffles)} shuffles of the labels over the ${count(labelled)} labelled links`);

  // The finding: enemies cross more than shuffled labels, family less.
  const e = cross.enemy;
  const f = cross.family;
  const a = cross.ally;
  assert.ok(e.z > 2 && f.z < -2, "enemies must cross more and family less than shuffled labels");
  has(`${pct(e.crossing)} of enemy links join two communities, against ${pct(e.null_mean)} when the labels are shuffled (z = ${z(e.z)})`);
  has(`Family links cross only ${pct(f.crossing)} of the time (z = ${z(f.z)})`);
  // "In between": allies sit between family and enemies.
  assert.ok(f.crossing < a.crossing && a.crossing < e.crossing, '"in between" needs family < ally < enemy');
  has(`Allies sit in between at ${pct(a.crossing)}`);
  // "Look like shuffled ones": teammate and killed within two standard deviations.
  assert.ok(Math.abs(cross.teammate.z) < 2 && Math.abs(cross.killed.z) < 2, "teammate and killed must look like shuffled labels");
  has("teammate and killed links look like shuffled ones");
  has(`Enemies still cross more than it predicts (${pct(e.within_page_mean)}, z = ${z(e.within_page_z)}) and family less (${pct(f.within_page_mean)}, z = ${z(f.within_page_z)})`);
  has(`The labelled links: ${label.teammate.arcs} teammate, ${label.enemy.arcs} enemy, ${label.family.arcs} family, ${label.killed.arcs} killed and ${label.ally.arcs} ally`);
  has(`${r.coverage.multi_label} sentences match more than one label`);

  // The limitation: hand-read precision, with "best" and "worst" held to the numbers.
  const read = Object.values(prec).reduce((sum, p) => sum + p.read, 0);
  const right = Object.values(prec).reduce((sum, p) => sum + p.right, 0);
  has(`Of the ${read} labels we read, ${right} describe how A and B relate`);
  has(`Enemy and ally labels hold up best (${prec.enemy.right} and ${prec.ally.right} of ${prec.enemy.read})`);
  has(`teammate worst (${prec.teammate.right} of ${prec.teammate.read})`);
  const ranked = Object.entries(prec).sort((x, y) => y[1].right - x[1].right).map(([k]) => k);
  assert.deepEqual(ranked.slice(0, 2).sort(), ["ally", "enemy"], '"best" must be enemy and ally');
  assert.equal(ranked.at(-1), "teammate", '"worst" must be teammate');
  has(`The ${read} sentences we read, ${r.meta.sample} per label`);
});

test("section 2 quotes copying.json", () => {
  const c = json("docs/weeks/week05/data/copying.json");
  const s = text("copying");
  const has = (t) => assert.ok(s.includes(t), `section 2 should say "${t}"`);
  const h = c.headline;
  const lead = c.template.top[0];
  assert.equal(lead.ngram, "in american comic books published by marvel comics", "the page quotes the most common 8-gram");
  const section = Object.fromEntries(c.sections.map((x) => [x.section, x.tokens]));
  const share = (name) => pct(section[name] / h.copied_tokens);

  has(`${h.pairs} pairs in ${h.clusters} clusters, and ${h.copy_linked} of those pairs already link to each other`);
  has(`${count(c.meta.tokens)} in all`);
  has(`is on ${lead.pages} of the ${c.meta.pages} pages`);
  has(`8-grams on more than ${c.meta.template_pages} pages are set aside`);
  has(`a passage of ${c.meta.min_passage} words or more`);
  has(`compared with all ${count(h.all_pairs)} pairs of pages and with the ${count(h.phrase_pairs)} pairs that share only a phrase`);
  has(`${h.copy_linked} of the ${h.pairs} copying pairs link to each other, against ${pct(h.all_linked_share, 1)} of all pairs of pages and ${pct(h.phrase_linked_share)} of pairs that share only a phrase`);
  has(`${share("Publication history")} sit under Publication history and ${share("In other media")} under In other media`);
  has(`only ${share("Fictional character biography")} in the character's biography`);
  // "The paperwork": the two paperwork sections hold more than the biography.
  assert.ok(section["Publication history"] > section["Fictional character biography"]);

  // The limitation: the sweep holds the cutoff claim, the 12-gram block the Morituri one.
  const same = c.sweep.filter((r) => r.n === c.meta.n && r.min_passage === c.meta.min_passage && r.template_pages <= 20);
  assert.ok(same.every((r) => r.pairs === h.pairs), "cutoffs 3 to 20 must give the headline's pairs");
  has(`anywhere from ${Math.min(...same.map((r) => r.template_pages))} to ${Math.max(...same.map((r) => r.template_pages))} pages gives the same ${h.pairs} pairs`);
  const extra = c.alt_extra;
  const pages = extra.groups.reduce((sum, g) => sum + g.pages.length, 0);
  assert.ok(extra.groups.every((g) => g.quote.includes("Strikeforce: Morituri")), "the 12-word pairs must all be the Morituri lead");
  has(`runs of ${extra.n} words add ${extra.pairs} pairs from one templated paragraph, the lead that ${WORDS[pages]} Strikeforce: Morituri pages share`);
});
