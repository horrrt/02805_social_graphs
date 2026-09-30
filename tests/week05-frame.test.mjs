// Pins the frame of the week 5 page (the hero, the findings strip, the opening
// and the closing) to the section JSON files, so a rerun that moves a number
// fails here instead of leaving the frame behind the sections.
import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { block, flatten } from "./week04-html.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (name) => readFileSync(join(ROOT, name), "utf8");
const json = (name) => JSON.parse(read(`docs/weeks/week05/data/${name}.json`));
const html = read("docs/weeks/week05/index.html");
const [relations, copying, search, communities, autocomplete, heaps, fame, weird] = [
  "relations", "copying", "search", "communities", "autocomplete", "heaps", "fame", "weird",
].map(json);
const count = (n) => Math.round(n).toLocaleString("en-US");
const pct = (x) => `${Math.round(100 * x)}%`;
const says = (id) => {
  const text = flatten(block(html, id));
  return (t) => assert.ok(text.includes(t), `#${id} should say "${t}"`);
};

const enemy = relations.crossing.find((c) => c.label === "enemy");
const family = relations.crossing.find((c) => c.label === "family");
const c = copying.headline;
const s = search.summary;
const at100k = heaps.checkpoints.find((p) => p.tokens === 100000);

test("one word rule and one set of corpus counts", () => {
  assert.equal(heaps.meta.word_rule, fame.meta.word_rule);
  assert.equal(heaps.meta.word_rule, weird.meta.token_rule);
  assert.equal(heaps.meta.tokens, weird.corpus.tokens);
  assert.equal(heaps.meta.pages, 303);
  assert.equal(fame.corpus.arcs, heaps.meta.arcs);
  assert.equal(fame.corpus.arcs, relations.coverage.arcs);
  assert.equal(communities.network.edges, c.all_linked, "the pairs that link, two ways of counting them");
  assert.equal(fame.corpus.median_tokens, weird.corpus.median_tokens);
});

test("the hero asks the question and quotes its figure", () => {
  const has = says("top");
  has(`${count(heaps.meta.tokens)} words on ${heaps.meta.pages} pages`);
  has(`${count(fame.corpus.arcs)} links between the pages`);
  has(`We read the ${heaps.meta.pages} Marvel Wikipedia pages as text`);
  const sections = html.match(/<section class="step" data-owner="[^"]+" id="/g);
  assert.equal(sections.length, 7);
  has("asked seven questions");
  assert.ok(Math.abs(fame.fit.null_mean) < 0.005, '"0.00" needs a shuffled mean that rounds to zero');
  has(`Pearson r = ${fame.fit.pearson.toFixed(2)} on the logs, against 0.00 ± ${fame.fit.null_sd.toFixed(2)} when in-degree is shuffled`);
  assert.ok(fame.outliers.some((o) => o.side === "above" && o.place === 1));
  assert.ok(fame.outliers.some((o) => o.side === "below" && o.place === 1));
  assert.match(html, /week05-frame\.js\?v=\d+/);
});

test("the findings strip quotes each section's JSON", () => {
  const has = says("findings");
  const rows = block(html, "findings").match(/class="w4-finding"/g);
  assert.equal(rows.length, 7);
  for (const id of ["relations", "copying", "search", "autocomplete", "heaps", "fame", "weird"]) {
    assert.ok(block(html, "findings").includes(`href="#${id}"`), `the strip links to #${id}`);
  }
  has(`${pct(enemy.crossing)} of links written in fight words join two communities, against ${pct(enemy.null_mean)} when the labels are shuffled; family links cross only ${pct(family.crossing)} of the time`);
  assert.ok(family.crossing < family.null_mean, '"only" needs family below its baseline');
  has(`${c.copy_linked} of the ${c.pairs} pairs of pages that share a copied passage already link to each other, against ${(100 * c.all_linked_share).toFixed(1)}% of all pairs`);
  has(`in the top five for ${s.hits_at_5} of ${s.n_scored} queries, but first for only ${s.hits_at_1}: short pages win most misses`);
  assert.ok(s.miss_kinds.short_page > s.n_misses / 2, '"most misses" needs a majority of short-page wins');
  has(`Every fake page repeats a run of ${autocomplete.summary.run_min} to ${autocomplete.summary.run_max} words from its community's pages`);
  assert.equal(autocomplete.guessing.n_responses, 0, "the strip says no other group has guessed");
  has("No other group has guessed yet");
  has(`the first ${count(at100k.tokens)} words hold ${count(at100k.least_linked)} different words, against ${count(at100k.random_mean)} ± ${Math.round(at100k.random_sd)} in random orders: minor characters bring new words`);
  assert.ok(at100k.z_least_linked > 2, '"bring new words" needs the least-linked order two sd above random');
  has(`page length follows in-degree at Pearson ${fame.fit.pearson.toFixed(2)}, and each of the ten furthest pages`);
  assert.equal(fame.outliers.length, 10);
  has(`${weird.several.in_bottom_decile} of the ${weird.several.bottom_decile} most repetitive pages are about several characters who share one name, where ${weird.several.expected.toFixed(1)} would be expected`);
});

test("the opening describes the data from the JSON", () => {
  const has = says("opening");
  has(`from ${count(weird.corpus.min_tokens)} to ${count(weird.corpus.max_tokens)} words long, ${count(weird.corpus.median_tokens)} at the median`);
  has(`The pages hold ${count(fame.corpus.arcs)} such links, joining ${count(communities.network.edges)} pairs of pages`);
  has(`${fame.corpus.zero_in_degree} pages receive no link at all, and ${fame.corpus.isolates} of those also link to no page`);
  has(`${count(heaps.meta.tokens)} tokens, word occurrences, of ${count(heaps.meta.types)} types, different words`);

  // The example sentence under both rules, as the scripts tokenise it.
  const example = "Spider-Man's first appearance in 1962";
  const shared = (example.toLowerCase().match(/[\p{L}\p{M}]+(?:['’-][\p{L}\p{M}]+)*/gu) || []).map((w) => w.replace(/['’]s$/, ""));
  assert.deepEqual(shared, ["spider-man", "first", "appearance", "in"]);
  has(`"${example}" gives ${shared.join(", ")}.`);
  const split = example.toLowerCase().match(/[\p{L}\p{M}\p{N}]+(?:['’][\p{L}\p{M}\p{N}]+)?/gu);
  assert.deepEqual(split, ["spider", "man's", "first", "appearance", "in", "1962"]);
  has(`the same sentence gives ${split.join(", ")}, and the pages hold about 740,000 tokens, 4% more`);
  for (const n of [search.tokenisation.n_tokens, copying.meta.tokens]) {
    assert.equal(Math.round(n / 10000) * 10000, 740000);
    assert.equal(Math.round(100 * (n / heaps.meta.tokens - 1)), 4);
  }
});

test("the closing quotes the sections and its methods match the scripts", () => {
  const has = says("closing");
  has(`Page length follows in-degree at Pearson ${fame.fit.pearson.toFixed(2)}, ${c.copy_linked} of the ${c.pairs} copied pairs already link to each other, and ${pct(enemy.crossing)} of enemy links cross communities against ${pct(enemy.null_mean)} for shuffled labels`);
  has(`they put the right page first for ${s.hits_at_1} of ${s.n_scored} queries`);
  has(`Louvain run ${relations.meta.runs} times; ${count(relations.meta.shuffles)} label shuffles`);
  has(`Shared ${copying.meta.n}-word n-grams, n-grams on more than ${copying.meta.template_pages} pages set aside as template`);
  has(`A consensus of ${communities.runs} Louvain runs against ${communities.null_runs} rewired networks`);
  has(`against ${heaps.meta.runs} random orders`);
  has(`against ${count(fame.meta.shuffles)} shuffles of in-degree`);
  has(`over a ${weird.meta.window}-word window, scored against the ${weird.meta.neighbours} pages nearest in length and ${count(weird.meta.draws)} random stretches`);
  has(`${relations.meta.sample} sentences per relation label`);
  has("the ten outliers of section 6");
  assert.ok(html.includes('id="methods"') && html.includes('id="closing-ai"'));
  for (const [, file] of block(html, "closing").matchAll(/href="https:\/\/github\.com\/horrrt\/02805_social_graphs\/blob\/main\/(analysis\/[\w.]+)"/g)) {
    assert.ok(existsSync(join(ROOT, file)), `${file} is linked but missing`);
  }
});
