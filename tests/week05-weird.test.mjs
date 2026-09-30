// Pins the text of week 5's section 7 (#weird, owner Niklas) to weird.json, so
// a rerun of analysis/week05_weird.py that moves a number fails here instead
// of leaving the prose behind.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { block, flatten, notices } from "./week04-html.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (name) => readFileSync(join(ROOT, name), "utf8");
const html = read("docs/weeks/week05/index.html");
const w = JSON.parse(read("docs/weeks/week05/data/weird.json"));
const copy = JSON.parse(read("analysis/week05_weird.json"));

const count = (n) => n.toLocaleString("en-US");
const pct = (x, digits = 0) => `${(100 * x).toFixed(digits)}%`;
const signed = (v) => `${v < 0 ? "−" : "+"}${Math.abs(v).toFixed(2)}`;
const minus = (v) => `${v < 0 ? "−" : ""}${Math.abs(v).toFixed(2)}`;
const text = (id) => flatten(block(html, id));

test("section 7 is Niklas's, drawn by its script, and its two data files agree", () => {
  assert.match(html, /<section class="step" data-owner="Niklas" id="weird">/);
  assert.match(html, /week05-weird\.js\?v=3/);
  assert.match(block(html, "weird"), /class="w5-slots card w4-card w5-card"/);
  assert.deepEqual(copy, w, "analysis/week05_weird.json and the page copy must match");
  assert.equal(w.meta.owner, "Niklas");
  // The figure and the table are drawn from the JSON, never typed into the page.
  assert.doesNotMatch(block(html, "weird"), /<table/);
  const js = read("docs/assets/js/week05-weird.js");
  for (const id of ["chart-weird-scatter", "weird-table", "weird-passages"]) {
    assert.ok(html.includes(`id="${id}"`), `#${id} on the page`);
    assert.ok(js.includes(`"${id}"`), `week05-weird.js draws #${id}`);
  }
});

test("section 7 quotes weird.json", () => {
  const s = text("weird");
  const has = (t) => assert.ok(s.includes(t), `section 7 should say "${t}"`);
  const { corpus: c, checks: k, stability: st, several: sv, summary: sm, meta: m } = w;
  const [a, b, cc] = w.top;

  // the opener and the answer name the top three by their node-table names
  has(`and ${sv.in_bottom_decile} of the ${sv.bottom_decile} most repetitive pages are about several characters who share one name`);
  has(`Real text: ${a.name}, ${b.name} and ${cc.name} win`);
  // the word rule, stated on the page as the script states it
  has(`We split each page into words: ${m.token_rule}.`);
  has(`The ${c.pages} pages hold ${count(c.tokens)} words.`);
  has(`We slide a window of ${m.window} words`);
  has(`the shortest page, ${c.min_tokens} words, meet the longest, ${count(c.max_tokens)} words`);
  // the length problem MATTR alone leaves, and the fix
  assert.ok(Math.abs(k.spearman_length_raw) < 0.1, '"no trend with length" needs a rank correlation near zero');
  assert.ok(k.raw_sd_shortest > k.raw_sd_longest, '"short pages spread more"');
  has(`a standard deviation of ${k.raw_sd_shortest.toFixed(3)} in the shortest quarter of pages against ${k.raw_sd_longest.toFixed(3)} in the longest`);
  has(`a z-score against the ${m.neighbours} pages nearest to it in length`);
  has(`Then we read the five highest and the five lowest.`);
  assert.equal(sm.shown, 5, '"the five highest and the five lowest"');

  // Method drawer: the length checks and the stability under a second window
  assert.ok(Math.abs(k.spearman_length) < 0.1 && Math.abs(k.z_sd_shortest - k.z_sd_longest) < 0.25,
    '"passes its length checks" needs no trend and a similar spread at both ends');
  has(`Its rank correlation with page length is ${k.spearman_length.toFixed(2)}`);
  has(`its z-scores spread ${k.z_sd_shortest.toFixed(2)} in the shortest quarter and ${k.z_sd_longest.toFixed(2)} in the longest`);
  has(`${k.top10_shorter_than_median} of the top 10 pages are shorter than the median page of ${count(c.median_tokens)} words`);
  has(`With a ${st.window_alt}-word window instead of ${m.window}, ${st.top_survivors} of the top ${st.checked} and ${st.bottom_survivors} of the bottom ${st.checked} stay in their ten (rank correlation ${st.spearman.toFixed(3)} over all pages)`);
  has(`a rare word is one found on at most ${m.rare_pages} of the ${c.pages} pages`);
  has(`any run of ${m.n} words found on more than ${m.template_pages} pages`);
  has(`It finds ${c.common_ngrams} such runs, led by "${c.lead_ngram}" on ${c.lead_ngram_pages} pages`);
  assert.ok(k.spearman_rare_length > 0.3 && k.spearman_boilerplate_length < -0.3, '"both shares move with length"');
  has(`(rank correlation ${k.spearman_rare_length.toFixed(2)} for rare words and ${minus(k.spearman_boilerplate_length)} for house phrasing)`);
  has(`compared with the median of its ${m.neighbours} length neighbours`);
  has(`${count(m.draws)} random stretches of the whole corpus, every page joined in order, at each of ${sm.band_points} lengths (seed ${m.seed})`);
  has(`${sv.pages} pages do.`);

  // Figure captions
  has(`The solid line is the mean of each page's ${m.neighbours} length neighbours`);
  has(`Rank of ${c.pages} by z-score`);
  has(`found on at most ${m.rare_pages} pages`);
  has(`inside runs of ${m.n} found on more than ${m.template_pages} pages. In brackets, the median of the page's ${m.neighbours} length neighbours.`);

  // Limitation, beside the claim it limits
  assert.ok(k.outside_band_long > k.outside_band_short, '"long pages stray more often"');
  has(`${pct(k.outside_band_long, 1)} of pages longer than the median fall outside the corpus band, against ${pct(k.outside_band_short, 1)} of shorter pages`);
});

test("section 7's notice answers real or boilerplate with the numbers", () => {
  const n = notices(html, "weird");
  const has = (t) => assert.ok(n.includes(t), `the notice should say "${t}"`);
  const { corpus: c, several: sv, summary: sm } = w;
  // the counts, recomputed from the rows the table shows
  const below = w.top.filter((r) => r.boilerplate_share < r.boilerplate_near).length;
  const rarer = w.top.filter((r) => r.rare_share > r.rare_near).length;
  const above = w.bottom.filter((r) => r.boilerplate_share > r.boilerplate_near).length;
  assert.equal(below, sm.top_boilerplate_below_near);
  assert.equal(rarer, sm.top_rare_above_near);
  assert.equal(above, sm.bottom_boilerplate_above_near);
  assert.ok(below > sm.shown / 2 && rarer > sm.shown / 2, '"the winners are real writing" needs most of the top below and above their neighbours');
  has(`${below} of the top ${sm.shown} carry less house phrasing than their length neighbours, and ${rarer} use more rare words`);
  assert.ok(sv.p < 0.05 && sv.in_bottom_decile > sv.expected, "several-name pages must gather at the bottom beyond chance");
  has(`${sv.in_bottom_decile} of the ${sv.bottom_decile} lowest pages are about several characters sharing one name, against ${sv.expected.toFixed(1)} expected by chance (p = ${sv.p.toFixed(4)})`);
  has(`${above} of the bottom ${sm.shown} carry more house phrasing than their neighbours`);
  const last = w.bottom[0];
  assert.equal(last.rank, c.pages);
  has(`${last.name} comes last (z = ${signed(last.z)})`);
  const k = w.checks;
  assert.ok(k.spearman_z_boilerplate < 0 && k.spearman_z_boilerplate_p < 0.001, '"more house phrasing goes with a lower score"');
  has(`Across all ${c.pages} pages, more house phrasing goes with a lower score (rank correlation ${minus(k.spearman_z_boilerplate)}, p &lt; 0.001)`);
});

test("section 7's quotes are the top three pages and the last, with one name per page", () => {
  assert.deepEqual(w.quotes.slice(0, 3).map((q) => q.node), w.top.slice(0, 3).map((r) => r.node));
  assert.equal(w.quotes.at(-1).node, w.bottom[0].node);
  const byNode = Object.fromEntries(w.points.map((p) => [p.node, p.name]));
  for (const r of [...w.top, ...w.bottom, ...w.quotes]) assert.equal(r.name, byNode[r.node], `${r.node} keeps one display name`);
  // the lead sentence every page shares is not what we quote
  for (const q of w.quotes) assert.ok(!q.text.includes("published by Marvel Comics"), `${q.node}: quote is past the house lead`);
  // the limitation's example is the winner
  assert.equal(w.top[0].node, "Coldblood", "the limitation names Coldblood as the winner");
  assert.ok(text("weird").includes("Coldblood wins by naming each cyborg part once"));
});
