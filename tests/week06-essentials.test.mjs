// Pins the Week 6 essentials page to the files analysis/week06_essentials.py
// writes, so a rerun that moves a number fails here instead of leaving the
// prose behind. Each test reads one section's claims against its own file.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { block, flatten } from "./week04-html.mjs";
import { builtPage } from "./built-page.mjs";
import { ESSENTIALS, FILES, START, pair } from "../src/scripts/week06-essentials.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (name) => readFileSync(join(ROOT, name), "utf8");
const json = (key) => JSON.parse(read(`public/${FILES[key]}`));
// Both versions of the page quote the same numbers: the house-style page and the data story.
const PAGE = process.env.W6E_PAGE ?? "out/weeks/week06/essentials/index.html";
const html = builtPage(PAGE);
const facts = JSON.parse(read("analysis/week06_essentials.json"));
const count = (n) => n.toLocaleString("en-US");
const says = (where, text) => {
  const s = flatten(block(html, where));
  assert.ok(s.includes(text), `${where} should say "${text}"`);
};

test("every essential is used in a section that exists", () => {
  assert.equal(ESSENTIALS.length, 17);
  for (const [term, id] of ESSENTIALS) {
    assert.ok(html.includes(`id="${id}"`), `${term} points at #${id}`);
    assert.ok(flatten(block(html, "closing")).includes(term), `the checklist lists ${term}`);
  }
});

test("1 · weights", () => {
  const w = facts.weights;
  const storm = json("weights").pages.find((p) => p.name === START.page);
  const the = storm.count.find(([x]) => x === "the");
  const st = storm.count.find(([x]) => x === "storm");
  assert.equal(storm.tfidf[0][0], "storm");
  says("weights", `"the" appears ${the[1]} times and weighs nothing; "storm" appears ${st[1]} times and tops her TF-IDF list`);
  says("weights", `He is on ${w.pronouns.he.df} pages, so its IDF is ${w.pronouns.he.idf.toFixed(2)}; she is on ${w.pronouns.she.df}, so ln(303 / ${w.pronouns.she.df}) = ${w.pronouns.she.idf.toFixed(2)}`);
  says("weights", `Only ${w.low_idf} words get an IDF under 0.1, and ${w.low_idf_stop} of them are NLTK stopwords; ${w.stop_not_low} of NLTK's ${w.stop_size} stopwords keep real weight`);
  for (const x of ["character", "comics", "marvel"]) assert.ok(w.everywhere.includes(x), x);
  says("weights", `${count(w.tokens)} words, ${count(w.vocab)} different ones`);
});

test("2 · cosine", () => {
  const c = facts.cosine.all_pairs;
  const p = pair(json("cosine"), ...START.pair);
  says("cosine", `the median pair of pages has a cosine of ${c.raw.median.toFixed(3)}. Under TF-IDF the median is ${c.tfidf.median}`);
  says("cosine", `Storm and the Human Torch have a raw-count cosine of ${p.raw.toFixed(3)}, of which the word the gives ${p.rawWords[0][1].toFixed(3)}. Under TF-IDF it is ${p.tfidf.toFixed(3)}, and the word storm gives ${p.tfidfWords[0][1].toFixed(3)}`);
  assert.equal(p.rawWords[0][0], "the");
  assert.equal(p.tfidfWords[0][0], "storm");
  says("cosine", `the 99th percentile is ${c.raw.p99.toFixed(3)}, only ${(c.raw.p99 - c.raw.median).toFixed(3)} above the median; under TF-IDF it is ${c.tfidf.p99.toFixed(3)}, eleven times the median`);
  assert.equal(Math.round(c.tfidf.p99 / c.tfidf.median), 11);
  assert.ok(facts.cosine.triple_diff < 1e-12, "tripling a page moves no cosine under either weighting");
  says("cosine", "no cosine moves by more than 10⁻¹⁵");
  assert.ok(facts.cosine.triple_diff < 1e-15);
  says("cosine", `${facts.cosine.pairs} pairs`);
});

test("3 · contrast", () => {
  const c = facts.contrast;
  const terms = json("contrast").terms;
  says("contrast", `labels ${c.pages.female} pages as women and ${c.pages.male} as men, ${count(c.words.female)} and ${count(c.words.male)} words`);
  says("contrast", `each of the ${count(c.plotted)} words seen 20 times or more`);
  says("contrast", `${c.beyond} words pass z = 1.96 for real, and shuffles give ${c.null.min} to ${c.null.max}`);
  says("contrast", `The largest z any shuffle produced is ${c.null.top_z_max}`);
  const beyond = terms.filter((t) => Math.abs(t[5]) > c.null.top_z_max).map((t) => t[0]).sort();
  assert.deepEqual(beyond, ["he", "her", "his", "she"]);
  assert.equal(c.beyond_null_top, 4);
  says("contrast", `only her (${c.top.female[0][1].toFixed(1)}), she, his and he go further`);
  for (const w of ["him", "woman", "herself"]) {
    const t = terms.find((x) => x[0] === w);
    assert.ok(Math.abs(t[5]) > 1.96 && Math.abs(t[5]) < c.null.top_z_max, `${w} leans, but no further than a shuffle's strongest word`);
  }
  says("contrast", "such as him, woman and herself, but no further than a random split's strongest word");
  assert.doesNotMatch(flatten(block(html, "contrast")), /Only four words/);
});

test("4 · topics", () => {
  const t = facts.topics;
  says("topics", `on ${count(t.vocab_size)} words`);
  says("topics", `At eight topics only ${["zero", "one", "two", "three", "four", "five"][t.stability["8"].kept]} keep half`);
  const pc = (k) => `${Math.round(t.stability[k].mean_overlap * 100)}%`;
  says("topics", `they share ${pc("5")} of their top ten words at five topics, ${pc("8")} at eight and ${pc("10")} at ten`);
  // The three themes, at five topics: the matched overlap of the seed-0 topic that carries each word.
  const data = json("topics");
  const kept = ["mutants", "symbiote", "armor"].map((word) => {
    const i = data.fits["5-0"].topics.findIndex((tp) => tp.some(([w]) => w === word));
    return Math.round(data.stability["5"].overlap[i] * 10);
  });
  says("topics", `mutants, symbiotes, and armour and suits keep ${kept[0]}, ${kept[1]} and ${kept[2]} of their top ten words`);
  for (const n of kept) assert.ok(n >= 5, "each theme is kept at five topics");
});

test("5 · contexts", () => {
  const c = json("contexts");
  const the = facts.words.the;
  const first = Object.values(the).filter((x) => x.count_rank === 1).length;
  says("contexts", `For ${first} of ${Object.keys(the).length} words we tried, the most common neighbour is the`);
  const rank = (w, win, x) => c.rows[w][win].findIndex(([y]) => y === x) + 1;
  assert.equal(rank("hammer", "2", "mjolnir"), 4);
  assert.equal(rank("hammer", "5", "mjolnir"), 8);
  const g = c.grid;
  const cell = (r, col) => g.cells[g.rows.indexOf(r)][g.cols.indexOf(col)];
  says("contexts", `Storm sits next to weather only ${cell("storm", "weather")} times within five words, and next to the ${cell("storm", "the")} times`);
});

test("6 · PMI", () => {
  const p = json("pmi").rows.web;
  const the = Object.values(facts.words.the).map((x) => x.pmi);
  const fmt = (v) => (v < 0 ? `−${Math.abs(v).toFixed(2)}` : v.toFixed(2));
  says("pmi", `Web's PPMI neighbours are ${p.ppmi.slice(0, 3).map(([w]) => w).join(", ")} and ${p.ppmi[3][0]}`);
  says("pmi", `its PMI ranges from ${fmt(Math.min(...the))} to ${fmt(Math.max(...the))}, at most twice what independence predicts`);
  assert.ok(Math.exp(Math.max(...the)) <= 2.05);
  says("pmi", `web's top PPMI neighbour, ${p.ppmi[0][0]}, scores ${p.ppmi[0][2].toFixed(2)}`);
  says("pmi", `For web, ${p.negative_cells} of ${p.cells} cells have negative PMI`);
  assert.ok(p.pmi_any.slice(0, 5).every(([, n]) => n <= 2), "plain PMI's top contexts are seen once or twice");
});

test("7 · vectors", () => {
  const v = json("vectors");
  const w = facts.words;
  says("vectors", `Symbiote's nearest words under skip-gram are ${v.near.symbiote.skipgram.slice(0, 3).map(([x]) => x).join(", ")} and ${v.near.symbiote.skipgram[3][0]}`);
  const storm = v.near.storm.skipgram.map(([x]) => x);
  for (const x of ["cyclops", "panther", "pryde", "ororo"]) assert.ok(storm.includes(x), x);
  for (const x of ["weather", "rain", "wind", "hurricane"]) assert.ok(!storm.includes(x), `storm's skip-gram list has no ${x}`);
  says("vectors", `A word's ten nearest average a cosine of ${w.skipgram_near_cos.toFixed(3)} under skip-gram, but the ten nearest of random words average ${w.skipgram_random_top.toFixed(3)}`);
  says("vectors", `skip-gram keeps ${Math.round(w.seed_overlap.skipgram * 100)}% of each top ten and CBOW ${Math.round(w.seed_overlap.cbow * 100)}%`);
  says("vectors", `words seen 20 times or more (${count(w.vocab_20)})`);
});

test("8 · GloVe", () => {
  const g = json("glove").compare;
  const shared = facts.words.glove_shared;
  for (const x of ["storm", "web", "vision", "beast", "thing"]) assert.equal(shared[x], 0, x);
  says("glove", `both ranked over the ${count(facts.words.glove_candidates)} words the two models know`);
  says("glove", `Vision's nearest words in GloVe are ${g.vision.glove.slice(0, 2).map(([x]) => x).join(", ")} and ${g.vision.glove[2][0]}`);
  says("glove", `on the Marvel pages they are ${g.vision.marvel.slice(0, 2).map(([x]) => x).join(", ")} and ${g.vision.marvel[2][0]}`);
  says("glove", `School shares ${shared.school} of 10 neighbours`);
  assert.deepEqual([...g.school.shared].sort(), ["college", "high", "student", "students", "teacher", "university"]);
  says("glove", "(college, high, student, students, teacher, university)");
  says("glove", `${Object.values(shared).filter((n) => n === 0).length} of the ${Object.keys(shared).length} words share none`);
});

test("the closing takeaways quote the same numbers", () => {
  const c = facts.cosine.all_pairs;
  says("closing", `scores ${c.raw.median.toFixed(3)} on raw counts and ${c.tfidf.median} on TF-IDF`);
  says("closing", `skip-gram keeps ${Math.round(facts.words.seed_overlap.skipgram * 100)}% of each top ten`);
  says("closing", `${Object.values(facts.words.glove_shared).filter((n) => n === 0).length} of 26 words share no neighbour even among words both models know`);
  says("closing", `only ${["zero", "one", "two", "three", "four", "five"][facts.topics.stability["8"].kept]} of eight keep at least half their top ten words`);
  const w = facts.weights;
  says("closing", `${w.stop_not_low} of NLTK's ${w.stop_size} keep weight`);
});
