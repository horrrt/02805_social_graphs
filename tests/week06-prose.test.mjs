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
const lean = JSON.parse(read("public/weeks/week06/data/lean.json"));
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
  assert.match(flatten(block(html, "top")), new RegExp(`${share.replace(".", "\\.")}\\s*of all word weight sits on names`));
  says("names", `drops to ${two(f.names.hits)}, level with raw counts (${two(f.course.raw)}); with names alone it gets ${two(f.names_only.hits)}`);
  assert.ok(Math.abs(f.names.hits - f.course.raw) < 0.1, "\"level with raw counts\" needs the two within 0.1");
  says("names", `leaves ${two(f.null.mean)} ± ${two(f.null.sd)}, but those words carry ${(f.null.weight_removed * 100).toFixed(1)}% of the weight against the names' ${share}`);
  says("names", `fall from ${two(f.course.tfidf)} to ${two(f.names.hits)}`);
  says("names", `removed the ${count(f.names.types)} words`);
  says("names", `removed ${count(f.null.words_removed)} other words instead`);
  says("names", `in ${f.null.runs} runs`);
  says("names", `seeds ${f.seeds[0]} to ${f.seeds[1]}`);
  says("names", `brings the count to ${two(f.pronouns.hits)}`);
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
  assert.equal(n(removed, "story") + n(removed, "template"), f.read.n);
  const W = ["Zero", "One", "Two", "Three", "Four"];
  says("gender", `All ${f.read.n} join two women, and every match leads with she and her. ${W[n(removed, "story")]} pairs share a story`);
  says("gender", `The other ${n(removed, "template")} share no team or storyline`);
  for (const p of removed) assert.deepEqual(p.words.slice(0, 2).sort(), ["her", "she"], `${p.a} · ${p.b}`);
});

test("section 3 quotes the gender test", () => {
  const g = f.gender, nn = g.no_names, np = g.no_names_pronouns, tf = g.tfidf;
  const women = pct(nn.slots_to_women), pages = pct(g.female / f.pages);
  says("gender", `They fill ${women} of all the ten-nearest lists and make up ${pages} of the pages`);
  says("findings", `Pages about women fill ${women} of the ten-nearest lists and make up ${pages} of the pages, and still ${pct(np.slots_to_women)} with he and she removed. She and her make a woman's list ${pct(nn.female.observed)} women`);
  says("closing", `which fill ${women} of the lists`);
  assert.match(flatten(block(html, "top")), new RegExp(`${women}\\s*of nearest-page slots go to pages about women once names go; they are ${pages} of pages`));
  says("gender", `${g.female} women and ${g.male} men among the ${g.labelled} pages that have one`);
  says("gender", `${count(g.shuffles)} shuffles of the labels over the same lists put that gap at about 0`);
  assert.ok(Math.abs(nn.gap.null_mean) < 0.02 && Math.abs(np.gap.null_mean) < 0.02, "\"about 0\" needs the shuffled gaps near 0");
  says("gender", `Share of all ${count(f.pages * f.k)} ten-nearest slots that go to the ${g.female} pages about women`);
  says("gender", `${count(g.shuffles)} shuffles of the labels over the ${g.labelled} labelled pages`);
  const p = f.pronouns;
  says("gender", `He is on ${p.pages.he} pages and his on ${p.pages.his}`);
  says("gender", `an IDF of ${two(p.idf.he)} against ${two(p.idf.she)} for she`);
  says("gender", `without names a woman's list is ${points(nn.gap.observed)} points more female than a man's, and ${points(np.gap.observed)} points once the pronouns go too`);
  says("gender", `The lean itself barely moves, from ${women} to ${pct(np.slots_to_women)}`);
  says("gender", `women's lists are ${pct(tf.female.observed)} women and men's ${pct(tf.male.observed)}, a gap of ${points(tf.gap.observed)} points (z ${z(tf.gap.z)})`);
  says("gender", `the gap is ${points(nn.gap.observed)} points (z ${z(nn.gap.z)}); without pronouns too, ${points(np.gap.observed)} points (z ${z(np.gap.z)})`);
  const hubs = nn.hubs.map(([name, k]) => `${short(name)} in ${k}`);
  says("gender", `${short(nn.hubs[0][0])} sits in ${nn.hubs[0][1]} pages' ten nearest, ${hubs[1]} and ${hubs[2]}`);
  says("gender", `women's lists are ${pct(nn.female.null_mean)} women, the share of women among the ${g.labelled} labelled pages`);
  assert.equal(pct(g.female / g.labelled), pct(nn.female.null_mean));
  assert.deepEqual(g.words.no_names.slice(0, 2).map(([word]) => word).sort(), ["her", "she"]);
  says("gender", `${g.unlabelled} pages have no value: ${g.unlabelled_shared_name} are pages for a codename`);
  assert.deepEqual(g.other, { "female|male": 1, agender: 1 });
  says("gender", "Ajak has two values and Phoenix Force is agender; both are left out");
  says("gender", `the ${f.pages - g.labelled} pages without a woman or man label`);
  says("gender", `${pct(nn.female_all_slots)} are women`);
});

test("the hero shows Storm's own contrast", () => {
  const storm = data.names.indexOf("Storm (Marvel Comics)");
  const [first] = data.kept[storm];
  assert.equal(short(data.names[first[0]]), "Human Torch");
  assert.equal(first[2], 0);
  for (const [j, , , , words] of data.removed[storm].slice(0, 4)) {
    assert.equal(data.gender[j], "female", data.names[j]);
    assert.ok(words.includes("her") && words.includes("she"));
  }
  says("top", "With names, the Human Torch leads on his surname (the two also served together in the Fantastic Four); without names, four women, matched on her and she");
  assert.equal(f.pairs.find((p) => p.a === "Human Torch" && p.b === "Storm (Marvel Comics)").bucket, "story");
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
  for (const [, , , , words] of data.removed[storm].slice(0, 4)) assert.ok(words.includes("her") && words.includes("she"));
});

test("the explorer's start and picks are pages in the file", async () => {
  const { START, PICKS } = await import("../src/scripts/week06-lookalikes.js");
  for (const name of [START, ...PICKS]) assert.ok(data.names.includes(name), name);
});

test("the explorer's answer and notice match the lists", () => {
  const w = f.gender.no_names.women_in_ten;
  says("explore", `a woman's list is almost all women, ${w.female} in ten on average, and a man's about four in ten (${w.male})`);
  assert.ok(w.female >= 9 && w.male >= 3.5 && w.male < 4.5, "\"almost all\" and \"about four in ten\"");
  assert.doesNotMatch(flatten(block(html, "explore")), /whoever you pick/);
  const women = (rep, name) => data[rep][data.names.indexOf(name)].filter(([j]) => data.gender[j] === "female").length;
  const men = (rep, name) => data[rep][data.names.indexOf(name)].filter(([j]) => data.gender[j] === "male").length;
  assert.equal(women("kept", "Storm (Marvel Comics)"), 5);
  assert.equal(women("kept", "Wolverine (character)"), 5);
  assert.equal(women("removed", "Storm (Marvel Comics)"), 10);
  assert.equal(men("removed", "Wolverine (character)"), 6);
  says("explore", "With names, half of each list is women, mostly X-Men teammates. Without names, Storm's ten nearest pages are all women; Wolverine's keep six men");
});

test("section 3's follow-up quotes lean.json", () => {
  const l = lean.lean, m = lean.model, pct1 = (v) => `${Math.round(v * 100)}%`;
  says("gender", `deleting every reception and relationship section leaves it at ${pct1(l.sections_removed)}, against ${pct1(l.control_mean)} ± ${(l.control_sd * 100).toFixed(1)} when the same number of words is cut from other sections (${lean.runs} runs)`);
  assert.ok(l.sections_removed >= l.control_mean, "\"Not reception sections\" needs the deletion to cut no more than the control");
  says("gender", `a page twice as long sits in ${m.per_doubling} more lists`);
  says("gender", `median ${count(lean.median_words.female)} words against ${count(lean.median_words.male)}`);
  says("gender", `a woman's page still sits in ${m.terms.female.coef.toFixed(1)} more lists (p = ${m.terms.female.p.toFixed(2)})`);
  assert.ok(m.terms.reception_share.p > 0.05 && m.terms.relations_share.p > 0.05);
});
