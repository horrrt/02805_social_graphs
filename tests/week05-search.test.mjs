// Pins the text of week 5's section 3 (#search) to search.json, so a rerun
// that moves a number fails here instead of leaving the prose behind.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { block, flatten } from "./week04-html.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (name) => readFileSync(join(ROOT, name), "utf8");
const d = JSON.parse(read("docs/weeks/week05/data/search.json"));
const live = JSON.parse(read("docs/weeks/week05/data/search_live.json"));
const html = read("docs/weeks/week05/index.html");
const s = flatten(block(html, "search"));
const has = (t) => assert.ok(s.includes(t), `section 3 should say "${t}"`);
const count = (n) => n.toLocaleString("en-US");
const pct = (x, digits = 0) => `${(100 * x).toFixed(digits)}%`;

test("section 3 quotes search.json", () => {
  const t = d.tokenisation;
  const sum = d.summary;
  const q = Object.fromEntries(d.queries.map((x) => [x.id, x]));
  const storm = q.storm;
  const win = storm.top5[0];
  const c = d.checked;

  // The corpus and the method.
  has(`The ${t.n_pages} pages and their ${count(t.n_terms)} different words form a document-term matrix that is ${pct(t.sparsity, 1)} empty`);
  assert.equal(t.most_common[0].term, "the");
  has(`The most common word, the, makes up ${pct(t.most_common[0].share, 1)} of all ${count(t.n_tokens)} words`);
  has(`We wrote ${sum.n_queries} queries`);
  assert.equal(q.thunder.scored, false, "the thunder query has no target");
  has(`spaCy's list of ${live.stopwords.length} words`);
  assert.ok(t.stoplist.includes(`(${live.stopwords.length})`));

  // The answer and the finding, with the words that describe them.
  has(`the right page comes first for ${sum.hits_at_1} of ${sum.n_scored} queries and in the top five for ${sum.hits_at_5}`);
  has(`(p = ${Number(sum.p_at_1.toPrecision(2))} against the 1 in ${t.n_pages} of a random ranking)`);
  has(`Removing stopwords lifts that to ${sum.hits_at_1_nostop} and ${sum.hits_at_5_nostop}`);
  assert.ok(sum.hits_at_1_nostop > sum.hits_at_1 && sum.hits_at_5_nostop > sum.hits_at_5, '"lifts" and "cost real hits" need both to rise');
  const ns = sum.miss_kinds_nostop;
  has(`without stopwords, ${ns.short_page} of the ${sum.n_misses_nostop} misses still lose to a page at most a third as long as the target`);
  assert.ok(ns.short_page > sum.n_misses_nostop / 2, '"most of the rest" needs a majority of short-page wins without stopwords');
  assert.equal(d.queries.filter((x) => x.scored && !x.hit_at_1_nostop && x.failure_kind_nostop === "short_page").length, ns.short_page);
  has(`With raw counts, ${sum.misses_won_by_shorter_than_median} of the ${sum.n_misses} misses are won by a page shorter than the median page of ${count(t.median_page_tokens)} words`);
  assert.ok(sum.miss_kinds.short_page > sum.n_misses / 2, '"most misses" needs a majority of short-page wins');
  has("Short pages win most misses");
  // "Rarely first": at most a quarter of queries.
  assert.ok(sum.hits_at_1 / sum.n_scored <= 0.25, '"rarely first" needs a hit rate at most 25%');

  // The single hit and the example in the opener and the checked slot.
  const hits = d.queries.filter((x) => x.hit_at_1).map((x) => x.expected_name);
  assert.deepEqual(hits, ["Moon Knight"]);
  has("the single first-place hit, Moon Knight");
  assert.equal(win.name, "Redneck (comics)");
  assert.equal(c.winner_name, win.name);
  has(`a ${count(win.n_tokens)}-word page beats Storm's ${count(storm.expected_tokens)} words`);
  has(`Its ${count(c.winner_tokens)} words make that one mutant count for more than all of Storm's ${count(c.expected_tokens)} words`);
  assert.deepEqual(c.terms, ["mutant"], "Redneck shares one word besides stopwords");
  assert.ok(c.quote.includes("mutant"));
});

test("the search box runs the scored stopword-free model", () => {
  assert.equal(live.n_terms, d.tokenisation.n_terms_nostop, "one vocabulary for the box and the table");
  assert.equal(live.n_pages, d.tokenisation.n_pages);
  assert.match(html, /week05-search\.js\?v=\d+/);
});
