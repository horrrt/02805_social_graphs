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

const points = (v) => String(Math.round(v * 100));
const z = (v) => String(v).replace("-", "−");

test("the course's lookalikes are reproduced and the page says so", () => {
  const c = f.course;
  assert.equal(f.course_same_neighbours, f.pages, "every page has the course's ten TF-IDF neighbours");
  says("names", `all ${f.pages} lists match`);
  says("closing", `same ${count(c.vocab)} words`);
  says("closing", `${two(c.raw)}, ${two(c.stopwords)}, ${two(c.tfidf)} and ${two(c.random)}`);
  says("closing", `same ten nearest pages for all ${f.pages} pages`);
  says("opening", `${count(f.tokens)} words in all, with ${count(c.vocab)} different words`);
  assert.equal(f.on_every_page.length, 11);
  says("opening", "Eleven words sit on every page");
  for (const w of ["the", "and", "marvel", "comics"]) assert.ok(f.on_every_page.includes(w), w);
  says("names", `reproduces the course's ${count(f.stopword_vocab)} remaining words`);
});

test("section 2 and the hero quote the names numbers", () => {
  const share = `${(f.names.tfidf_share * 100).toFixed(1)}%`;
  says("names", `Names hold ${share} of all TF-IDF weight`);
  assert.match(flatten(block(html, "top")), new RegExp(`${share.replace(".", "\\.")}\\s*of TF-IDF weight sits on names`));
  says("names", `drops to ${two(f.names.hits)}, level with raw counts (${two(f.course.raw)}); with names alone it gets ${two(f.names_only.hits)}`);
  assert.ok(Math.abs(f.names.hits - f.course.raw) < 0.1, "\"level with raw counts\" needs the two within 0.1");
  says("names", `leaves ${two(f.null.mean)} ± ${two(f.null.sd)}, but those words carry ${(f.null.weight_removed * 100).toFixed(1)}% of the weight against the names' ${share}`);
  says("names", `fall from ${two(f.course.tfidf)} to ${two(f.names.hits)}`);
  says("names", `removed the ${count(f.names.types)} words`);
  says("names", `removed ${count(f.null.words_removed)} other words instead`);
  says("names", `in ${f.null.runs} runs`);
  says("names", `seeds ${f.seeds[0]} to ${f.seeds[1]}`);
  says("names", `brings the count to ${two(f.pronouns.hits)}`);
  says("top", `TF-IDF gets ${two(f.course.tfidf)} and names alone ${two(f.names_only.hits)}. Without names it gets ${two(f.names.hits)}; removing as many other words of the same rarity leaves ${two(f.null.mean)} ± ${two(f.null.sd)}`);
  says("findings", `against ${two(f.course.tfidf)} with them and ${two(f.names_only.hits)} with names alone`);
  says("closing", `names alone get ${two(f.names_only.hits)} linked pages among the ten nearest, and without them the count falls from ${two(f.course.tfidf)} to ${two(f.names.hits)}`);
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
  const nameWords = kept.filter((p) => p.bucket === "name").map((p) => p.words[0].replace(/^./, (x) => x.toUpperCase()));
  says("names", `${n(kept, "name")} share only a name word: ${nameWords.slice(0, -1).join(", ")} and ${nameWords.at(-1)}`);
  const storm = kept.find((p) => p.a === "Human Torch" && p.b === "Storm (Marvel Comics)");
  assert.equal(storm.bucket, "story");
  const story = n(kept, "story") + n(kept, "mantle");
  says("findings", `Of the ${f.read.n} closest unlinked pairs, ${story} share a story or a title and ${n(kept, "name")} share only a name`);
  says("closing", `Of the ${f.read.n} most similar pairs that do not link, ${story} still share a story or a title and ${n(kept, "name")} share only a name word`);
  assert.equal(f.read.no_names_both_women, f.read.n);
  assert.equal(n(removed, "story"), 1);
  assert.equal(n(removed, "template"), f.read.n - 1);
  says("gender", `All ${f.read.n} join two women, and every match leads with she and her. One pair shares a story`);
  says("gender", `The other ${n(removed, "template")} share no team or storyline`);
  for (const p of removed) assert.deepEqual(p.words.slice(0, 2).sort(), ["her", "she"], `${p.a} · ${p.b}`);
});

test("section 3 quotes the gender test", () => {
  const g = f.gender, nn = g.no_names, np = g.no_names_pronouns, tf = g.tfidf;
  const women = pct(nn.slots_to_women), pages = pct(g.female / f.pages);
  says("gender", `Pages about women fill ${women} of all the ten-nearest lists and make up ${pages} of the pages`);
  says("findings", `Pages about women fill ${women} of the ten-nearest lists and make up ${pages} of the pages`);
  says("closing", `which fill ${women} of the lists`);
  assert.match(flatten(block(html, "top")), new RegExp(`${women}\\s*of nearest-page slots go to pages about women once names go; they are ${pages} of pages`));
  says("gender", `labels ${g.labelled} of the pages as a woman or a man: ${g.female} women and ${g.male} men`);
  says("gender", `we ran ${count(g.shuffles)}`);
  says("gender", `the ${g.female} women's lists`);
  says("gender", `the ${g.male} men's lists`);
  const p = f.pronouns;
  says("gender", `He is on ${p.pages.he} pages and his on ${p.pages.his}`);
  says("gender", `${two(p.idf.he)} per use against ${two(p.idf.she)} for she`);
  says("gender", `a woman's labelled nearest pages are ${pct(nn.female.observed)} women and a man's ${pct(nn.male.observed)}, against ${pct(nn.female.null_mean)} and ${pct(nn.male.null_mean)} shuffled`);
  says("gender", `cuts the gap from ${points(nn.gap.observed)} to ${points(np.gap.observed)} points, but women's pages still fill ${pct(np.slots_to_women)} of the lists`);
  says("gender", `women's lists are ${pct(tf.female.observed)} women and men's ${pct(tf.male.observed)}, a gap of ${points(tf.gap.observed)} points (z ${z(tf.gap.z)})`);
  says("gender", `the gap is ${points(nn.gap.observed)} points (z ${z(nn.gap.z)}); without pronouns too, ${points(np.gap.observed)} points (z ${z(np.gap.z)})`);
  const hubs = nn.hubs.map(([name, k]) => `${short(name)} in ${k}`);
  says("gender", `${short(nn.hubs[0][0])} sits in ${nn.hubs[0][1]} pages' ten nearest, ${hubs[1]} and ${hubs[2]}`);
  const hs = g.words.no_names.filter(([word]) => word === "her" || word === "she").reduce((a, [, v]) => a + v, 0);
  assert.deepEqual(g.words.no_names.slice(0, 2).map(([word]) => word).sort(), ["her", "she"]);
  says("gender", `Her and she carry ${pct(hs)} of the similarity between women`);
  says("gender", `${g.unlabelled} pages have no value: ${g.unlabelled_shared_name} are pages for a codename`);
  assert.deepEqual(g.other, { "female|male": 1, agender: 1 });
  says("gender", "Ajak has two values and Phoenix Force is agender; both are left out");
  says("gender", `the ${f.pages - g.labelled} pages without a woman or man label`);
  says("gender", `${pct(nn.female_all_slots)} are women`);
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

test("the explorer's start and picks are pages in the file", async () => {
  const { START, PICKS } = await import("../src/scripts/week06-lookalikes.js");
  for (const name of [START, ...PICKS]) assert.ok(data.names.includes(name), name);
});
