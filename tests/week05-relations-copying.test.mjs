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
const Cap = (w) => w[0].toUpperCase() + w.slice(1);

test("section 1 quotes relations.json", () => {
  const r = json("docs/weeks/week05/data/relations.json");
  const s = text("relations");
  const has = (t) => assert.ok(s.includes(t), `section 1 should say "${t}"`);
  const label = Object.fromEntries(r.labels.map((l) => [l.label, l]));
  const cross = Object.fromEntries(r.crossing.map((c) => [c.label, c]));
  const pair = Object.fromEntries(r.one_per_pair.crossing.map((c) => [c.label, c]));
  const prec = r.precision;
  const labelled = r.labels.filter((l) => l.label !== "unlabelled").reduce((sum, l) => sum + l.arcs, 0);

  has(`For each of the ${count(r.coverage.arcs)} links`);
  has(`found one for ${count(r.coverage.with_sentence)} (${pct(r.coverage.share)})`);
  has(`${r.coverage.arcs_to_nameless} point at one of ${r.coverage.nameless_targets} alternate versions`);
  has(`${count(label.unlabelled.arcs)} of the sentences (${pct(label.unlabelled.share)}) match no word at all`);
  has(`${r.communities.runs} Louvain runs`);
  has(`compared it with ${count(r.meta.shuffles)} shuffles of the labels over the ${count(labelled)} labelled links`);

  // The finding: fight-word links cross more than shuffled labels, family-word links less.
  const e = cross.enemy;
  const f = cross.family;
  const a = cross.ally;
  assert.ok(e.z > 2 && f.z < -2, "enemy links must cross more and family links less than shuffled labels");
  assert.ok(pair.enemy.z > 2 && pair.family.z < -2, "and with one link per pair of characters");
  assert.ok(e.within_page_z > 2 && f.within_page_z < -2, "and against the within-page shuffle");
  has(`${pct(e.crossing)} of enemy links join two communities, against ${pct(e.null_mean)} when the labels are shuffled (z = ${z(e.z)})`);
  has(`Family links cross only ${pct(f.crossing)} of the time (z = ${z(f.z)})`);
  // "Still within chance": allies within two standard deviations.
  assert.ok(Math.abs(a.z) < 2, '"within chance" needs |z| < 2 for allies');
  has(`Allies cross ${pct(a.crossing)}, still within chance`);
  assert.ok(Math.abs(cross.teammate.z) < 2 && Math.abs(cross.killed.z) < 2, "teammate and killed must look like shuffled labels");
  has("teammate and killed links look like shuffled ones");
  has(`Enemies still cross more than it predicts (${pct(e.within_page_mean)}, z = ${z(e.within_page_z)}) and family less (${pct(f.within_page_mean)}, z = ${z(f.within_page_z)})`);
  has(`counting each pair once gives z = ${z(pair.enemy.z)} for enemies and ${z(pair.family.z)} for family`);
  has(`The labelled links: ${label.teammate.arcs} teammate, ${label.enemy.arcs} enemy, ${label.family.arcs} family, ${label.killed.arcs} killed and ${label.ally.arcs} ally`);
  has(`${r.coverage.multi_label} sentences match more than one label`);

  // The limitation: hand-read precision, with "best", "worst" and "in between" held to the numbers.
  const read = Object.values(prec).reduce((sum, p) => sum + p.read, 0);
  const right = Object.values(prec).reduce((sum, p) => sum + p.right, 0);
  has(`We read ${read} sentences, ${r.meta.sample} per label, drawn at random: ${right} of the labels describe how A and B relate`);
  assert.ok(right / read >= 0.4 && right / read <= 0.6, '"about half the links correctly" needs 40% to 60% right');
  has("the word list labels about half the links correctly");
  has(`Ally labels hold up best (${prec.ally.right} of ${prec.ally.read})`);
  has(`enemy and killed worst (${prec.enemy.right} of ${prec.enemy.read} each)`);
  has(`family in between (${prec.family.right} of ${prec.family.read})`);
  const scores = Object.values(prec).map((p) => p.right);
  assert.equal(prec.ally.right, Math.max(...scores), '"best" must be ally');
  assert.ok(prec.enemy.right === Math.min(...scores) && prec.killed.right === Math.min(...scores), '"worst" must be enemy and killed');
  assert.ok(prec.family.right > prec.enemy.right && prec.family.right < prec.ally.right, '"in between" for family');
  assert.ok(r.concordance.some((l) => l.label === "enemy" && l.verdict === "wrong" && l.page === "Phyla-Vell"),
    "the quoted fight-word sentence must be a wrong enemy label in the sample");
});

test("section 2 quotes copying.json", () => {
  const c = json("docs/weeks/week05/data/copying.json");
  const s = text("copying");
  const has = (t) => assert.ok(s.includes(t), `section 2 should say "${t}"`);
  const h = c.headline;
  const lead = c.template.top[0];
  assert.equal(lead.ngram, "in american comic books published by marvel comics", "the page quotes the most common 8-gram");
  const section = Object.fromEntries(c.sections.map((x) => [x.section, x.tokens]));
  const share = (name) => pct(section[name] / h.section_tokens);

  has(`${h.pairs} pairs of pages, in ${h.clusters} clusters, nearly all about characters who already link to each other`);
  assert.ok(h.copy_linked / h.pairs >= 0.85, '"nearly all" needs at least 85% of the pairs linked');
  has(`${count(c.meta.tokens)} in all`);
  has(`is on ${lead.pages} of the ${c.meta.pages} pages`);
  has(`8-grams on more than ${c.meta.template_pages} pages are set aside`);
  has(`a passage of ${c.meta.min_passage} words or more`);
  has(`compared with all ${count(h.all_pairs)} pairs of pages and with the ${count(h.phrase_pairs)} pairs that share only a phrase`);
  has(`${h.copy_linked} of the ${h.pairs} copying pairs link to each other, against ${pct(h.all_linked_share, 1)} of all pairs of pages and ${pct(h.phrase_linked_share)} of pairs that share only a phrase`);

  // The two unlinked pairs are Wild Child's.
  const unlinked = c.links.filter((l) => !l.linked);
  assert.equal(h.pairs - h.copy_linked, unlinked.length);
  assert.ok(unlinked.every((l) => l.a === "Wild_Child_(character)" || l.b === "Wild_Child_(character)"), "the unlinked pairs must be Wild Child's");
  assert.ok(unlinked.every((l) => l.quote.includes("Krakoa")), "and share the Krakoa sentence");
  has(`The ${WORDS[unlinked.length]} pairs that do not link are Wild Child's`);

  // What ties the clusters, read by hand into the ties table.
  const ties = Object.fromEntries(["mantle", "team", "family"].map((t) => [t, c.clusters.filter((x) => x.tie === t).length]));
  assert.equal(ties.mantle + ties.team + ties.family, h.clusters, "every cluster has a tie");
  has(`${Cap(WORDS[ties.mantle])} clusters share a codename (Venom and Eddie Brock), ${WORDS[ties.team]} a team (Rocket Raccoon and Star-Lord) and ${WORDS[ties.family]} a family`);
  const tieOf = (page) => c.clusters.find((x) => x.pages.includes(page)).tie;
  assert.equal(tieOf("Venom_(character)"), "mantle");
  assert.equal(tieOf("Rocket_Raccoon"), "team");
  assert.ok(ties.mantle + ties.team > ties.family, '"a codename or a team" must cover most clusters');

  has(`${share("Publication history")} of the copied words sit under Publication history and ${share("In other media")} under In other media`);
  has(`only ${share("Fictional character biography")} in the character's biography`);
  assert.ok(section["Publication history"] > section["Fictional character biography"], '"rarely the story"');

  // The limitation: the sweep holds both cutoff claims, the 12-gram block the Morituri one.
  const row = (t, m) => c.sweep.find((r) => r.n === c.meta.n && r.template_pages === t && r.min_passage === m);
  const same = c.sweep.filter((r) => r.n === c.meta.n && r.min_passage === c.meta.min_passage && r.template_pages <= 20);
  assert.ok(same.every((r) => r.pairs === h.pairs), "cutoffs 3 to 20 must give the headline's pairs");
  has(`any cutoff from ${Math.min(...same.map((r) => r.template_pages))} to ${Math.max(...same.map((r) => r.template_pages))} pages gives the same ${h.pairs} pairs`);
  const loose = row(c.meta.template_pages, 20);
  const strict = row(c.meta.template_pages, 50);
  assert.equal(strict.linked_share, 1, '"all of them link" at 50 words');
  has(`at 20 words, ${loose.pairs} pairs copy and ${Math.round(loose.linked_share * loose.pairs)} of them link; at 50 words, ${strict.pairs} copy and all of them link`);
  const extra = c.alt_extra;
  const pages = extra.groups.reduce((sum, g) => sum + g.pages.length, 0);
  assert.ok(extra.groups.every((g) => g.quote.includes("Strikeforce: Morituri")), "the 12-word pairs must all be the Morituri lead");
  assert.equal(extra.groups.length, 2, '"two versions" of the lead');
  has(`runs of ${extra.n} words add ${extra.pairs} pairs from a templated lead that 8-word runs split, on ${WORDS[pages]} Strikeforce: Morituri pages whose leads come in two versions`);
});
