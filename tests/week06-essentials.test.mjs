// Pins the Week 6 post, the essentials page at /weeks/week06/, to the files
// analysis/week06_essentials.py writes, so a rerun that moves a number fails
// here instead of leaving the prose behind. Each test reads one section's
// claims against its own file. The last tests check the routes: the essentials
// at /weeks/week06/, Marvel Lookalikes at /weeks/week06/alternative/, and the
// old /weeks/week06/essentials/ sending readers to the first.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { block, flatten } from "./week04-html.mjs";
import { builtPage } from "./built-page.mjs";
import { ESSENTIALS, FILES, START, leaning, pair, signed } from "../src/scripts/week06-essentials.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (name) => readFileSync(join(ROOT, name), "utf8");
const json = (key) => JSON.parse(read(`public/${FILES[key]}`));
const PAGE = process.env.W6E_PAGE ?? "out/weeks/week06/index.html";
const html = builtPage(PAGE);
const facts = JSON.parse(read("analysis/week06_essentials.json"));
const count = (n) => n.toLocaleString("en-US");
const pct = (v) => `${Math.round(v * 100)}%`;
const WORDS = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve"];
// Inline markup (italics for words used as words, bold, links) drops out, so a
// sentence reads as one string.
const text = (where) => flatten(block(html, where).replace(/<\/?(em|b|a)\b[^>]*>/g, ""));
const says = (where, sentence) => assert.ok(text(where).includes(sentence), `${where} should say "${sentence}"`);
// A formula's LaTeX as the server renders it (KaTeX typesets it after load),
// with the \htmlClass{x-…}{…} tags that drive its hover explanations unwrapped.
const untag = (s) => {
  for (let prev; prev !== s; ) {
    prev = s;
    s = s.replace(/\\htmlClass\{x-[\w-]+\}\{((?:[^{}]|\{[^{}]*\})*)\}/g, "$1");
  }
  return s;
};
const tex = (where) => untag(text(where));
// "a, b, c and d" from a list of words.
const and = (words) => `${words.slice(0, -1).join(", ")} and ${words.at(-1)}`;

test("every essential is an underlined glossary term in the section that uses it", () => {
  assert.equal(ESSENTIALS.length, 17);
  for (const [term, id] of ESSENTIALS) {
    // "Term frequency, TF" is marked by its abbreviation; the rest by the term itself.
    const slug = (term.split(", ")[1] ?? term).toLowerCase().replace(/[^a-z0-9]+/g, "-");
    assert.match(block(html, id), new RegExp(`aria-describedby="w6-term-${slug}"`), `${term} is a glossary term in #${id}`);
  }
});

test("each section has one heading, its opener; no card repeats it as a question", () => {
  for (const id of ["weights", "cosine", "contrast", "topics", "contexts", "pmi", "vectors", "glove"]) {
    const section = block(html, id);
    assert.equal(section.match(/<h2\b/g)?.length, 1, `#${id} has one h2`);
    assert.doesNotMatch(section, /class="w4-q"|class="w4-answer"/, `#${id} has no question header`);
  }
});

test("1 · weights", () => {
  const w = facts.weights;
  const worked = `He is on ${w.pronouns.he.df} pages, so its IDF is ${w.pronouns.he.idf.toFixed(2)}, while she is on ${w.pronouns.she.df}, so \\ln \\tfrac{303}{${w.pronouns.she.df}} = ${w.pronouns.she.idf.toFixed(2)}`;
  assert.ok(tex("weights").includes(worked), `weights should say "${worked}"`);
  const other = w.stop_size - w.low_idf_stop;
  says("weights", `NLTK's English list of ${w.stop_size} words. Only ${w.low_idf} words get an IDF under 0.1, and ${w.low_idf_stop} of them are NLTK stopwords. Of NLTK's other ${other}, ${other - w.stop_not_low} never appear on these pages and ${w.stop_not_low} keep real weight`);
  for (const x of ["character", "comics", "marvel"]) assert.ok(w.everywhere.includes(x), x);
  says("weights", `The pages hold ${count(w.tokens)} words, ${count(w.vocab)} of them different`);
  // The list rows show the bar's value first.
  const storm = json("weights").pages.find((p) => p.name === START.page);
  assert.equal(storm.tfidf[0][0], "storm");
});

test("2 · cosine", () => {
  const c = facts.cosine.all_pairs;
  const p = pair(json("cosine"), ...START.pair);
  says("cosine", `Storm and the Human Torch have a raw-count cosine of ${p.raw.toFixed(3)}, and the gives ${p.rawWords[0][1].toFixed(3)} of it. Under TF-IDF it's ${p.tfidf.toFixed(3)}, and storm, Johnny Storm's surname, gives ${p.tfidfWords[0][1].toFixed(3)}`);
  assert.equal(p.rawWords[0][0], "the");
  assert.equal(p.tfidfWords[0][0], "storm");
  says("cosine", `Every one of the ${count((303 * 302) / 2)} pairs of pages`);
  says("cosine", `Under raw counts the median pair scores ${c.raw.median.toFixed(3)} and the 99th percentile ${c.raw.p99.toFixed(3)}. Under TF-IDF the median is ${c.tfidf.median} and the 99th percentile ${c.tfidf.p99.toFixed(3)}, ${WORDS[Math.round(c.tfidf.p99 / c.tfidf.median)]} times as high`);
  assert.ok(facts.cosine.triple_diff < 1e-15, "tripling a page moves no cosine under either weighting");
  says("cosine", `checks all ${facts.cosine.pairs * 2} ordered pairs under both weightings, and no cosine moves by more than 10^{-15}`);
  const shown = json("cosine").pages.length;
  says("cosine", `${shown} pages a reader will know, which make ${facts.cosine.pairs} pairs`);
  assert.equal((shown * (shown - 1)) / 2, facts.cosine.pairs, "the chart's pages make its pairs");
});

test("3 · contrast", () => {
  const c = facts.contrast;
  const terms = json("contrast").terms;
  says("contrast", `labels ${c.pages.female} pages as women and ${c.pages.male} as men. The women's pages hold ${count(c.words.female)} words and the men's ${count(c.words.male)}`);
  says("contrast", `each of the ${count(c.plotted)} words seen 20 times or more`);
  says("contrast", `The same ${c.pages.female + c.pages.male} pages with their labels shuffled, ${c.null.runs} times over. On the real labels, ${c.beyond} words pass z = 1.96 and the shuffles give ${c.null.min} to ${c.null.max}`);
  says("contrast", `The largest z any shuffle produced is ${c.null.top_z_max}. Only`);
  const beyond = terms.filter((t) => Math.abs(t[5]) > c.null.top_z_max).map((t) => t[0]);
  assert.deepEqual([...beyond].sort(), ["he", "her", "his", "she"]);
  assert.equal(c.beyond_null_top, 4);
  says("contrast", `Only her (${c.top.female[0][1].toFixed(1)}), she, his and he go further`);
  says("contrast", "Her, she, his and he sit together in the top-right corner");
  for (const w of beyond) {
    const t = terms.find((x) => x[0] === w);
    assert.ok(t[3] > 0.95 && t[4] > 0.95, `${w} is common in both groups, so it sits in the top-right corner`);
  }
  says("contrast", `the ${303 - c.pages.female - c.pages.male} pages without a woman or man label are left out`);
});

test("3 · contrast: the names caption counts from the data", () => {
  const data = json("contrast");
  const lean = leaning(data);
  assert.equal(lean.all, data.beyond);
  assert.equal(lean.words + lean.names, data.beyond);
  // z is stored to two decimals: the words past 1.96 lie between those strictly past it and those at 1.96 or more.
  const words = (test) => data.terms.filter((t) => !t[6] && test(Math.abs(t[5]))).length;
  assert.ok(words((z) => z > 1.96) <= lean.words && lean.words <= words((z) => z >= 1.96), "the caption's count of non-name words is consistent with the terms");
  assert.equal(signed(-11.351), "−11.35");
  assert.equal(signed(-1.6), "−1.60");
});

test("4 · topics", () => {
  const t = facts.topics;
  says("topics", `on the ${count(t.vocab_size)} words left after removing`);
  says("topics", `words on fewer than 5 or more than ${Math.floor(303 / 2)} pages.`);
  says("topics", "twice each, with seeds 0 and 1");
  const p = (k) => pct(t.stability[k].mean_overlap);
  says("topics", `The twins share ${p("5")} of their top ten words at five topics, ${p("8")} at eight and ${p("10")} at ten`);
  assert.equal(START.k, 5, "the topics open at five");
});

test("5 · contexts", () => {
  const c = json("contexts");
  const the = facts.words.the;
  const first = Object.values(the).filter((x) => x.count_rank === 1).length;
  says("contexts", `counted raw, the is the most common context of ${first} of our ${Object.keys(the).length} words`);
  const rank = (w, win, x) => c.rows[w][win].findIndex(([y]) => y === x) + 1;
  assert.equal(rank("hammer", "2", "mjolnir"), 4);
  assert.equal(rank("hammer", "5", "mjolnir"), 8);
  says("contexts", "Within two words, mjolnir is hammer's fourth neighbour, and within five it's the eighth. The stays first at every size");
  for (const w of ["2", "5", "10"]) assert.equal(c.rows.hammer[w][0][0], "the", `the is hammer's first neighbour at window ${w}`);
  const g = c.grid;
  const cell = (r, col) => g.cells[g.rows.indexOf(r)][g.cols.indexOf(col)];
  says("contexts", `Storm sits next to weather only ${cell("storm", "weather")} times within five words, and next to the ${cell("storm", "the")} times`);
});

test("6 · PMI", () => {
  const p = json("pmi").rows.web;
  const the = Object.values(facts.words.the);
  says("pmi", `The is the most common neighbour of ${the.filter((x) => x.count_rank === 1).length} of the ${the.length} words`);
  const pmi = the.map((x) => x.pmi);
  says("pmi", `its PMI ranges from ${signed(Math.min(...pmi))} to ${signed(Math.max(...pmi))}, at most twice what independence predicts.`);
  assert.ok(Math.exp(Math.max(...pmi)) <= 2.05);
  says("pmi", `Web's top PPMI neighbour, ${p.ppmi[0][0]}, scores ${p.ppmi[0][2].toFixed(2)}`);
  assert.ok(p.pmi_any.slice(0, 5).every(([, n]) => n <= 2), "plain PMI's top contexts are seen once or twice");
  assert.equal(START.pmiList, "ppmi", "PPMI sits beside the counts at first");
});

test("7 · vectors", () => {
  const v = json("vectors");
  const w = facts.words;
  const sym = v.near.symbiote.skipgram.slice(0, 4).map(([x]) => x);
  says("vectors", `skip-gram keeps ${pct(w.seed_overlap.skipgram)} of each top ten, and symbiote's nearest are ${and(sym)}`);
  const ex = v.examples[0];
  assert.equal(ex.window[0], ex.centre, "Storm's example starts the page");
  says("vectors", `skip-gram makes pairs such as (${ex.centre}, ${ex.positive[0]}) and (${ex.centre}, ${ex.positive[1]}), while CBOW makes one example, (${ex.positive.join(", ")}) → ${ex.centre}`);
  says("vectors", `Each real pair is set against ${v.settings.negative} random words`);
  const storm = v.near.storm.skipgram.map(([x]) => x);
  for (const x of ["cyclops", "panther", "pryde", "ororo"]) assert.ok(storm.includes(x), x);
  for (const x of ["weather", "rain", "wind", "hurricane"]) assert.ok(!storm.includes(x), `storm's skip-gram list has no ${x}`);
  says("vectors", "On these pages storm is the character, not the weather, and its nearest words are cyclops, panther, pryde and ororo");
  says("vectors", `A word's ten nearest average a cosine of ${w.skipgram_near_cos.toFixed(3)} under skip-gram, but words drawn at random have ten nearest averaging ${w.skipgram_random_top.toFixed(3)}`);
  says("vectors", `skip-gram keeps ${pct(w.seed_overlap.skipgram)} of each top ten and CBOW ${pct(w.seed_overlap.cbow)}`);
  says("vectors", `words seen 20 times or more (${count(w.vocab_20)})`);
  assert.equal(START.vectorList, "skipgram", "skip-gram sits beside the PPMI rows at first");
});

test("8 · GloVe", () => {
  const g = json("glove").compare;
  const shared = facts.words.glove_shared;
  for (const x of ["storm", "web", "vision", "beast", "thing"]) assert.equal(shared[x], 0, x);
  says("glove", `both ranked over the ${count(facts.words.glove_candidates)} words the two models know`);
  says("glove", `School shares ${shared.school} of 10 neighbours`);
  assert.deepEqual([...g.school.shared].sort(), ["college", "high", "student", "students", "teacher", "university"]);
  says("glove", "(college, high, student, students, teacher, university)");
  says("glove", `${Object.values(shared).filter((n) => n === 0).length} of the ${Object.keys(shared).length} words share none`);
  says("glove", `two runs of the same skip-gram from different seeds keep ${pct(facts.words.seed_overlap.skipgram)} of each top ten`);
  says("glove", `nearest words for storm are ${and(g.storm.glove_open.slice(0, 3).map(([x]) => x))}`);
});

test("the closing takeaways quote the same numbers", () => {
  const w = facts.weights;
  const c = facts.cosine.all_pairs;
  const t = facts.topics.stability;
  const words = facts.words;
  const the = Object.values(words.the);
  const g = json("glove").compare.vision;
  says("closing", `${w.stop_not_low} of NLTK's ${w.stop_size} stopwords keep weight`);
  says("closing", `Under raw counts the 99th-percentile pair of pages sits only ${(c.raw.p99 - c.raw.median).toFixed(3)} above the ${c.raw.median.toFixed(3)} median, and under TF-IDF it sits at ${WORDS[Math.round(c.tfidf.p99 / c.tfidf.median)]} times the ${c.tfidf.median} median`);
  says("closing", `At five topics, ${WORDS[t["5"].kept]} of five keep at least half their top ten words when the seed changes. At eight, only ${WORDS[t["8"].kept]} of eight do`);
  says("closing", `By count, the is the top neighbour of ${the.filter((x) => x.count_rank === 1).length} of ${the.length} words, but its PMI is at most ${Math.max(...the.map((x) => x.pmi)).toFixed(2)}, so association finds the telling neighbours`);
  says("closing", `skip-gram keeps ${pct(words.seed_overlap.skipgram)} of each top ten, and symbiote's nearest are ${and(json("vectors").near.symbiote.skipgram.slice(0, 4).map(([x]) => x))}`);
  says("closing", `Vision sits beside ${and(g.marvel.slice(0, 3).map(([x]) => x))} on these pages and beside ${and(g.glove.slice(0, 3).map(([x]) => x))} in GloVe`);
  says("closing", `${Object.values(words.glove_shared).filter((n) => n === 0).length} of ${Object.keys(words.glove_shared).length} words share no neighbour, even among words both models know`);
  assert.doesNotMatch(block(html, "closing"), /<ol class="w6e-takeaways">[\s\S]*?<a href="#/, "the takeaways carry no section links");
});

test("/weeks/week06/ is the essentials post; the hero links the alternative", () => {
  assert.match(html, /<h1>Here, storm means Ororo, not the weather<\/h1>/);
  assert.match(block(html, "top"), /<a href="alternative\/">alternative Week 6 post<\/a>/);
  assert.match(html, /<link rel="canonical" href="https:\/\/horrrt\.github\.io\/02805_social_graphs\/weeks\/week06\/"/);
  assert.match(html, /"@type":"Article"[^<]*"url":"https:\/\/horrrt\.github\.io\/02805_social_graphs\/weeks\/week06\/"/);
});

test("/weeks/week06/alternative/ is the Marvel Lookalikes post", () => {
  const alt = builtPage("out/weeks/week06/alternative/index.html");
  assert.match(alt, /Why do two Marvel pages read alike\?/);
  for (const id of ["explore", "names", "gender"]) assert.match(alt, new RegExp(`id="${id}"`));
  assert.match(alt, /<link rel="canonical" href="https:\/\/horrrt\.github\.io\/02805_social_graphs\/weeks\/week06\/alternative\/"/);
  assert.match(alt, /"url":"https:\/\/horrrt\.github\.io\/02805_social_graphs\/weeks\/week06\/alternative\/"/);
  assert.match(alt, /<a href="\.\.\/">Week 6 post<\/a>/, "the closing links back to the Week 6 post");
});

test("/weeks/week06/essentials/ sends readers to /weeks/week06/", () => {
  const old = builtPage("out/weeks/week06/essentials/index.html");
  const head = old.slice(0, old.indexOf("</head>"));
  assert.match(head, /<meta http-equiv="refresh" content="0; url=\.\.\/"\/?>/, "a meta refresh in the head");
  assert.match(head, /<meta name="robots" content="noindex"\/?>/, "kept out of search");
  assert.match(old, /<a href="\.\.\/">Week 6 post<\/a>/, "a link for browsers that do not refresh");
});
