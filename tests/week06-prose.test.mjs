// Pins the Week 6 page (#explore, #names, #gender, the hero, findings and
// closing) to lookalikes.json, so a rerun of analysis/week06_lookalikes.py
// that moves a number fails here instead of leaving the prose behind.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { block, flatten } from "./week04-html.mjs";
import { builtPage } from "./built-page.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (name) => readFileSync(join(ROOT, name), "utf8");
const html = builtPage("out/weeks/week06/index.html");
const data = JSON.parse(read("public/weeks/week06/data/lookalikes.json"));
const f = data.facts;
const page = flatten(html);
const two = (v) => v.toFixed(2);
const pct = (v) => `${Math.round(v * 100)}%`;
const count = (n) => n.toLocaleString("en-US");
const short = (name) => name.replace(/ \((character|Marvel Comics|comics)\)$/, "");
const says = (where, text) => {
  const s = where === "page" ? page : flatten(block(html, where));
  assert.ok(s.includes(text), `${where} should say "${text}"`);
};

test("week 6 is Gyula's and has no placeholder left", () => {
  for (const id of ["opening", "explore", "names", "gender", "closing"]) {
    assert.match(html, new RegExp(`<section class="step" data-owner="Gyula" id="${id}">`));
  }
  assert.doesNotMatch(html, /[Tt]oy (figure|numbers|network)|<<<<<<<|>>>>>>>/);
  assert.match(read("analysis/week06_lookalikes.py"), /Owner: Gyula/);
});

test("the course's lookalikes are reproduced and the page says so", () => {
  const c = f.course, p = f.course_published;
  for (const k of ["raw", "stopwords", "tfidf", "random"]) assert.equal(Number(two(c[k])), p[k], k);
  assert.equal(c.vocab, p.vocab);
  says("closing", `same ${count(c.vocab)} words`);
  says("closing", `${two(c.raw)}, ${two(c.stopwords)}, ${two(c.tfidf)} and ${two(c.random)}`);
  says("opening", `${count(f.tokens)} words in all, with ${count(c.vocab)} different words`);
  assert.equal(f.on_every_page.length, 11);
  says("opening", "Eleven words sit on every page");
  for (const w of ["the", "and", "marvel", "comics"]) assert.ok(f.on_every_page.includes(w), w);
});

test("section 2 and the hero quote the names numbers", () => {
  const share = `${(f.names.tfidf_share * 100).toFixed(1)}%`;
  says("names", `Names hold ${share} of all TF-IDF weight`);
  says("top", share);
  says("names", `drops TF-IDF to ${two(f.names.hits)}, level with raw counts (${two(f.course.raw)})`);
  assert.ok(Math.abs(f.names.hits - f.course.raw) < 0.1, "\"level with raw counts\" needs the two within 0.1");
  says("names", `leaves ${two(f.null.mean)} ± ${two(f.null.sd)}`);
  says("names", `fall from ${two(f.course.tfidf)} to ${two(f.names.hits)}`);
  says("names", `removed the ${count(f.names.types)} words`);
  says("names", `removed ${count(f.null.words_removed)} other words instead`);
  says("names", `in ${f.null.runs} runs`);
  says("names", `brings the count to ${two(f.pronouns.hits)}`);
  says("top", `TF-IDF gets ${two(f.course.tfidf)}. Without names it gets ${two(f.names.hits)}; removing as many other words leaves ${two(f.null.mean)} ± ${two(f.null.sd)}`);
  says("closing", `from ${two(f.course.tfidf)} to ${two(f.names.hits)}, while removing as many other words leaves ${two(f.null.mean)}`);
  const d = f.distance;
  says("names", `${pct(d.tfidf["1"])} are linked and ${pct(d.tfidf.none)} have no path, against ${pct(d.all["1"])} and ${pct(d.all.none)} of all pairs`);
  says("names", `Without names ${pct(d.no_names["1"])} are linked and ${pct(d.no_names["2"])} are two steps away, against ${pct(d.tfidf["2"])} with names`);
});

test("the hand-read pairs match their counts", () => {
  const kept = f.pairs.filter((p) => p.rep === "tfidf");
  const removed = f.pairs.filter((p) => p.rep === "no_names");
  assert.equal(kept.length, f.read.n);
  assert.equal(removed.length, f.read.n);
  const n = (rows, b) => rows.filter((p) => p.bucket === b).length;
  const morituri = kept.filter((p) => p.bucket === "story" && p.words.includes("morituri")).length;
  says("names", `${n(kept, "story")} share a story: ${morituri} are teammates in Strikeforce: Morituri`);
  says("names", `${n(kept, "mantle")} hold the same title`);
  says("names", `${n(kept, "name")} share only a name word`);
  const story = n(kept, "story") + n(kept, "mantle");
  says("findings", `Of the ${f.read.n} closest unlinked pairs, ${story} share a story or a title and ${n(kept, "name")} share only a name`);
  says("closing", `Of the ${f.read.n} closest pairs that do not link, ${story} share a story or a title and ${n(kept, "name")} share only a name word`);
  assert.equal(n(removed, "template"), f.read.n);
  assert.equal(f.read.no_names_both_women, f.read.n);
  says("gender", `All ${f.read.n} join two women, and every match leads with she and her`);
  for (const p of removed) assert.deepEqual(p.words.slice(0, 2).sort(), ["her", "she"], `${p.a} · ${p.b}`);
});

test("section 3 quotes the gender test", () => {
  const g = f.gender;
  const w = g.no_names.female, wp = g.no_names_pronouns.female, wt = g.tfidf.female;
  says("gender", `${pct(w.observed)} of a woman's nearest pages are about women, against ${pct(w.null_mean)} when the labels are shuffled`);
  says("findings", `${pct(w.observed)} of a woman's nearest pages are about women, against ${pct(w.null_mean)} ± ${pct(w.null_sd)}`);
  says("top", pct(w.observed));
  says("gender", `for ${g.labelled} of the pages: ${g.female} women and ${g.male} men`);
  says("gender", `${count(g.shuffles)} shuffles`);
  says("gender", `falls to ${pct(wp.observed)}, still far above ${pct(wp.null_mean)}`);
  const hs = g.words.no_names.filter(([word]) => word === "her" || word === "she").reduce((a, [, v]) => a + v, 0);
  assert.deepEqual(g.words.no_names.slice(0, 2).map(([word]) => word).sort(), ["her", "she"]);
  says("gender", `Her and she carry ${pct(hs)} of the similarity between women`);
  const left = g.words.no_names_pronouns.map(([word]) => word);
  for (const word of ["list", "best", "female", "ranked", "mutants"]) assert.ok(left.includes(word), word);
  const m = g.no_names.male, mt = g.tfidf.male, mp = g.no_names_pronouns.male;
  says("gender", `${pct(mt.observed)} against ${pct(mt.null_mean)}`);
  says("gender", `${pct(m.observed)} against ${pct(m.null_mean)} (z ${String(m.z).replace("-", "−")})`);
  says("gender", `to ${pct(mp.observed)} once he and she go`);
  says("gender", `${pct(wt.observed)} against ${pct(wt.null_mean)} (z ${wt.z})`);
  says("gender", `${pct(w.observed)} (z ${w.z})`);
  says("gender", `${pct(wp.observed)} (z ${wp.z})`);
  says("gender", `${g.unlabelled} pages have no value: ${g.unlabelled_shared_name} are pages for a codename`);
  says("closing", `${pct(w.observed)} of a woman's nearest pages are about women, against ${pct(w.null_mean)} by chance`);
});

test("section 1 quotes the explorer's own lists", () => {
  says("findings", `${f.names.first_linked} of the ${f.pages} pages. Without names, for ${f.names.first_linked_no_names}`);
  says("explore", `for ${f.names.first_linked} of the ${f.pages} pages; without names, for ${f.names.first_linked_no_names}`);
  says("explore", `on average ${two(f.names.mean_kept)} of the ten stay`);
  assert.equal(f.names.lists_unchanged, 0);
  const storm = data.names.indexOf("Storm (Marvel Comics)");
  const [first] = data.kept[storm];
  assert.equal(data.names[first[0]], "Human Torch");
  assert.equal(first[2], 0, "Storm and the Human Torch do not link");
  assert.ok(first[4].includes("storm"));
  const removed = data.removed[storm].slice(0, 4).map(([j]) => short(data.names[j]));
  says("explore", `her nearest pages are ${removed.slice(0, 3).join(", ")} and ${removed[3]}, matched on her and she`);
  for (const [, , , , words] of data.removed[storm].slice(0, 4)) assert.ok(words.includes("her") && words.includes("she"));
});
