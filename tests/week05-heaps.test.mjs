// Pins the text of week 5's section 5 (#heaps) to analysis/week05_heaps.py's
// output, so a rerun that moves a number fails here instead of leaving the prose behind.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { block, flatten, notices } from "./week04-html.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (name) => readFileSync(join(ROOT, name), "utf8");
const html = read("docs/weeks/week05/index.html");
const h = JSON.parse(read("docs/weeks/week05/data/heaps.json"));
const section = block(html, "heaps");
const s = flatten(section);
const has = (t) => assert.ok(s.includes(t), `section 5 should say "${t}"`);

const count = (n) => Math.round(n).toLocaleString("en-US");
const pct = (x, digits = 0) => `${(100 * x).toFixed(digits)}%`;
const z = (v) => `${v < 0 ? "−" : ""}${Math.abs(v).toFixed(1)}`;
const at = (tokens) => h.checkpoints.find((c) => c.tokens === tokens);

test("section 5 is Niklas's card and loads its script", () => {
  assert.match(section, /^<section class="step" data-owner="Niklas" id="heaps">/);
  assert.match(section, /class="card w4-card w5-card"/);
  assert.equal(h.meta.owner, "Niklas");
  assert.match(read("analysis/week05_heaps.py"), /\nOwner: Niklas\n/);
  assert.match(html, /week05-heaps\.js\?v=7/);
  for (const id of ["chart-heaps-curve", "chart-heaps-gap", "heaps-table", "heaps-samples", "heaps-passages"]) {
    assert.ok(section.includes(`id="${id}"`), `section 5 needs #${id}`);
  }
});

test("section 5 defines its terms and states the word rule from heaps.json", () => {
  has('"the Hulk smashes the tank" has 5 tokens and 4 types');
  has(`We read the ${h.meta.pages} pages one after another, ${count(h.meta.tokens)} tokens in all`);
  has(`The whole corpus holds ${count(h.meta.types)} types`);
  // The Method drawer spells out WORD_RULE; hold its parts to the rule in the JSON.
  assert.match(h.meta.word_rule, /any alphabet.*inner apostrophe or hyphen kept.*lowercased.*possessive 's removed.*digits and punctuation dropped/);
  has("A word is a run of letters in any alphabet with an inner apostrophe or hyphen kept, lowercased, with a possessive 's removed; digits and punctuation are dropped");
  has(`Every curve is read off on ${h.meta.grid_points} token counts spaced evenly on a log scale from ${count(h.meta.grid_from)} tokens to the whole corpus`);
});

test("section 5 compares orders at equal tokens, with the random baseline", () => {
  const f = h.first_pages;
  has(`and ${h.meta.runs} random orders as the baseline`);
  assert.equal(f.pages, 10, 'the page says "ten"');
  has(`The ten most-linked pages hold ${count(f.most_linked_tokens)} tokens and the ten least-linked only ${count(f.least_linked_tokens)}`);
  assert.ok(f.most_linked_tokens > 5 * f.least_linked_tokens, "the page-count comparison must be dominated by length");
  has(`standard deviations of the ${h.meta.runs} random orders`);
  has(`Every order ends on the same ${count(h.meta.types)} types`);
  has(`Band: the middle 90% of ${h.meta.runs} random page orders`);

  // The finding, at the two token counts, in types and in z.
  const early = at(100000);
  const late = at(400000);
  assert.ok(early && late, "checkpoints at 100,000 and 400,000 tokens");
  assert.ok(early.z_least_linked > 2, "least-linked must sit above random at 100,000 tokens");
  assert.ok(late.z_most_linked < -2, "most-linked must sit below random at 400,000 tokens");
  assert.ok(late.tokens < 0.7 * h.meta.tokens, "checkpoints must stay well short of the end");
  const notice = notices(html, "heaps");
  const says = (t) => assert.ok(notice.includes(t), `the notice should say "${t}"`);
  says(`After 100,000 tokens the least-linked order has met ${count(early.least_linked)} types, ${count(early.least_linked - early.random_mean)} more than the random mean of ${count(early.random_mean)} ± ${count(early.random_sd)} (z = ${z(early.z_least_linked)})`);
  says(`After 400,000 tokens the most-linked order has met ${count(late.most_linked)}, ${count(late.random_mean - late.most_linked)} fewer than random (z = ${z(late.z_most_linked)})`);
  // The spans: the longest runs of grid points beyond 1.5 sd, recomputed here.
  const run = (key, sign) => {
    let best = [];
    let cur = [];
    for (const p of h.grid.slice(0, -1)) {
      cur = sign * p[`z_${key}`] > 1.5 ? [...cur, p] : [];
      if (cur.length > best.length) best = cur;
    }
    return best;
  };
  const span = (key) => h.spans.find((x) => x.order === key);
  for (const [key, sign] of [["least_linked", 1], ["most_linked", -1]]) {
    const best = run(key, sign);
    assert.equal(span(key).from, best[0].tokens, `${key} span start`);
    assert.equal(span(key).to, best.at(-1).tokens, `${key} span end`);
  }
  const sl = span("least_linked");
  const sm = span("most_linked");
  has(`The least-linked order stays ${sl.z_min.toFixed(1)} to ${sl.z_max.toFixed(1)} standard deviations above random from ${count(sl.from)} to ${count(sl.to)} tokens`);
  has(`the most-linked order ${Math.abs(sm.z_max).toFixed(1)} to ${Math.abs(sm.z_min).toFixed(1)} below from ${count(sm.from)} to ${count(sm.to)} tokens`);
  // "only while it reads its own end of the list": back at random by 400,000.
  assert.ok(Math.abs(late.z_least_linked) < 1, '"sits at random" needs |z| < 1');
  has(`by 400,000 tokens the least-linked order has begun ${late.pages_least_linked} pages, reached pages linked from ${late.in_degree_least_linked} others, and sits at random (z = ${z(late.z_least_linked)})`);
  has("the least-linked characters' pages bring more new vocabulary than random pages, and the most-linked pages bring less");

  // "within 11% of the random mean at every point" in the figure caption.
  const worst = Math.max(...h.grid.map((p) => Math.max(Math.abs(p.most_linked - p.random_mean), Math.abs(p.least_linked - p.random_mean)) / p.random_mean));
  has(`The two ordered lines stay within ${Math.ceil(100 * worst)}% of the random mean at every point`);
});

test("section 5 fits Heaps' law on the random mean and says whether it flattens", () => {
  const f = h.heaps;
  has(`On Marvel β = ${f.beta.toFixed(2)}, so reading 4 times as many words turns up about ${(4 ** f.beta).toFixed(1)} times as many types`);
  const points = h.grid.filter((p) => p.tokens >= f.fit_from && p.tokens <= f.fit_to).length;
  assert.equal(points, f.fit_points);
  has(`over the ${f.fit_points} grid points from ${count(f.fit_from)} to ${count(f.fit_to)} tokens: K = ${f.k.toFixed(1)}, β = ${f.beta.toFixed(2)}`);
  has(`β runs from ${f.beta_runs_p5.toFixed(2)} to ${f.beta_runs_p95.toFixed(2)} (5th to 95th percentile)`);
  // "Bends but never flattens out": the slope drops, and new types keep coming.
  assert.ok(f.beta_upper < f.beta_lower, '"bends" needs a lower slope on the upper half');
  assert.ok(f.tail_new_per_1000 > 5, '"never flattens out" needs new types still arriving at the end');
  has(`The slope on log-log axes is ${f.beta_lower.toFixed(2)} below ${count(f.split_at)} tokens and ${f.beta_upper.toFixed(2)} above`);
  has(`In the last tenth of the corpus the random orders still meet ${Math.round(f.tail_new_per_1000)} new types per 1,000 tokens`);
  assert.ok(Math.abs(f.tail_from / h.meta.tokens - 0.9) < 0.001, '"the last tenth"');
});

test("section 5 splits the late pages' new words and quotes them", () => {
  const l = h.late;
  has(`The last ${l.pages} pages in most-linked order, each linked from ${l.max_in_degree} pages or fewer, hold ${count(l.tokens)} tokens and add ${count(l.new_types)} types no earlier page used`);
  has(`${count(l.names)} of them (${pct(l.name_share)}) look like names`);
  has(`against ${pct(l.random_name_share_mean)} ± ${pct(l.random_name_share_sd, 1)} for the last ${l.pages} pages of the random orders`);
  has(`${l.names_initial_only} of those names are capitalised only where they open a sentence or a line`);
  assert.equal(l.names + l.others, l.new_types);
  // Each checked sentence holds its new word, once, and comes from a late page.
  for (const p of h.passages) {
    assert.ok(p.sentence.includes(p.surface), `${p.page}: the sentence holds "${p.surface}"`);
    assert.equal(p.sentence.toLowerCase().split(p.surface.toLowerCase()).length, 2, `${p.page}: "${p.surface}" occurs once`);
    assert.ok(p.in_degree <= l.max_in_degree, `${p.page} is a late page`);
  }
  assert.deepEqual(h.passages.map((p) => p.kind), ["name", "other"]);
});

test("section 5 names its real limits", () => {
  has("Pages differ in length");
  // "the most-linked pages are the long ones"
  assert.ok(h.first_pages.most_linked_tokens > 5 * h.first_pages.least_linked_tokens);
  has("and the most-linked pages are the long ones. Shuffling in-degree only among pages of similar length");
  has("one word rule");
  has(`the link count only covers links among these ${h.meta.pages} pages`);
  has(`${h.meta.zero_indegree_pages} of the pages get no link at all`);
});

test("section 5's gaps survive a baseline that keeps page length", () => {
  const m = h.meta;
  const [first, second] = h.checkpoints;
  const z1 = first.z_length_held_least_linked;
  const z2 = second.z_length_held_most_linked;
  assert.ok(z1 > 2 && z2 < -2, '"leaves both gaps standing" needs both beyond two sd');
  has(`in fifths by word count, ${m.length_runs} times, leaves both gaps standing (z = ${z(z1)} for least-linked first at ${count(first.tokens)} tokens, z = ${z(z2)} for most-linked first at ${count(second.tokens)})`);
  assert.equal(m.length_bins, 5, '"fifths" needs five length bins');
});

