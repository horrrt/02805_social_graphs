// Pins the text of week 5's section 4 (community autocomplete) to the analysis
// output, so a rerun that moves a number fails here instead of leaving the
// prose behind, and keeps the guessing honest until other groups answer.
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
const a = json("docs/weeks/week05/data/autocomplete.json");
const c = json("docs/weeks/week05/data/communities.json");
const js = read("docs/assets/js/week05-autocomplete.js");
const section = block(html, "autocomplete");
const s = flatten(section);
const has = (t, where = s) => assert.ok(where.includes(t), `section 4 should say "${t}"`);

const pct = (x) => `${Math.round(100 * x)}%`;
const p = a.partition;
const sm = a.summary;
const k = a.n_fakes;

test("section 4 is a wide Week 4 card with the brief's question", () => {
  assert.match(section, /class="w5-slots card w4-card w5-card w5-card-wide"/);
  has("Can someone who has not seen the pages tell which community a fake page came from?");
  assert.match(html, /week05-autocomplete\.js\?v=3/);
  assert.doesNotMatch(section, /—/, "no em dashes in section 4");
  assert.doesNotMatch(js, /—/, "no em dashes in the quiz text");
  assert.doesNotMatch(js, /innerHTML/, "build dynamic text with textContent");
});

test("the partition numbers come from communities.json", () => {
  assert.equal(p.runs, c.runs);
  assert.equal(p.runs, 100);
  has(`Louvain ran ${p.runs} times on the giant component of the link network, the ${p.giant_nodes} of ${p.nodes} pages joined to each other by links`);
  has(`they found ${p.distinct_partitions} different partitions, the most common one in only ${p.mode_count} runs, and ${p.common_k_runs} runs found ${p.common_k} groups`);
  has(`median normalised mutual information of ${p.nmi_median.toFixed(2)}`);
  assert.equal(p.consensus_threshold, 0.5);
  has(`at least half the runs put them together, which gives ${p.communities_in_giant} groups, the same for all ${p.consensus_seeds_agreeing} seeds we tried on it`);
  assert.equal(p.consensus_seeds_agreeing, p.runs, '"the same for all" needs every seed to agree');
  has(`The ${p.other_component_nodes} Strikeforce: Morituri pages link only to each other and form a ninth group; the ${p.isolates} pages with no links have none`);
  assert.equal(p.communities_in_giant + 1, k, '"a ninth group" needs 8 groups in the giant plus the Morituri component');
  // Modularity against the strength-preserving null: the runs' mean, not one run.
  assert.equal(p.modularity_mean, c.louvain.modularity_mean);
  has(`Louvain's modularity averages ${p.modularity_mean.toFixed(3)} over the ${p.runs} runs, against ${p.null_mean.toFixed(3)} ± ${p.null_sd.toFixed(3)} on ${p.null_runs} rewired copies of the network (z = ${p.null_z.toFixed(1)})`);
  assert.ok(p.null_z > 3, '"far more tightly than chance" needs z above 3');
  has(`The consensus groups score ${p.consensus_modularity.toFixed(3)}`);
  assert.equal(p.consensus_modularity, c.consensus.modularity);
  has(`Dot: Louvain's modularity on the real network, the mean of ${p.runs} runs. Band: the same on ${p.null_runs} rewired networks`);
  has(`${c.null.swaps_per_edge} swaps per link`);
  // The groups and their sizes.
  const sizes = a.options.map((o) => `${o.label}, ${o.size}`).join("; ").replace(/, (\d+);/, ", $1 pages;");
  has(sizes);
  assert.ok(a.options.every((o) => o.size >= a.tokenisation.min_community_size));
  has(`Each group of at least ${a.tokenisation.min_community_size} pages gets its own trigram model`);
  assert.equal(a.left_out.largest, 1, "only pages with no links are left without a generator");
  has(`The ${a.left_out.pages} pages with no links belong to no group and trained no generator`);
});

test("the method states the tokeniser, the template and the cap", () => {
  const t = a.tokenisation;
  assert.match(t.sentences, /week05_text\.sentences/);
  has("sentences with spaCy's rule-based sentencizer");
  has("Heading lines are dropped");
  assert.match(t.model, /no backoff/);
  has("The model has no smoothing and no backoff");
  assert.doesNotMatch(read("analysis/week05_autocomplete.py"), /def next_token|fallback/, "no dead backoff code");
  assert.equal(t.template, "NAME is a character appearing in American comic books published by Marvel Comics. (hand-written first sentence)");
  has(`one sentence we wrote by hand ("${a.fakes.find((f) => f.id === "fake-0").character} is a character appearing in American comic books published by Marvel Comics.")`);
  has(`continues with ${t.sentences_per_fake} sentences the model samples word by word`);
  has(`A sentence that reaches ${t.cap} words without ending is thrown away and drawn again, never cut; that happened to ${sm.redrawn} sentences`);
  has("P(w3 | w1, w2)");
  has("That is next-token prediction");
});

test("guessing stays honest: no hit rate without real answers", () => {
  const g = a.guessing;
  assert.equal(g.chance_rate, a.chance_rate);
  assert.equal(a.chance_rate, Math.round(10000 / k) / 10000);
  assert.equal(k, a.options.length);
  for (const key of ["n_groups", "n_responses", "n_correct", "p_value", "collected_on"]) assert.ok(key in g, `guessing.${key}`);
  if (g.n_responses > 0) {
    assert.equal(g.hit_rate, Math.round((10000 * g.n_correct) / g.n_responses) / 10000);
  } else {
    assert.equal(g.hit_rate, null);
    assert.equal(g.p_value, null);
    assert.equal(g.collected_on, null);
    assert.equal(g.status, "awaiting_other_groups");
    has("No other group has guessed yet");
    has(`We will post the ${k} masked fakes in the week 5 Teams channel and report the correct guesses out of all guesses, against the 1 in ${k} (${pct(a.chance_rate)}) a random guess gets right`);
    assert.doesNotMatch(s, /hit rate/i, "no hit rate on the page before anyone has guessed");
    assert.doesNotMatch(js, /hit_rate/, "the page script never shows a hit rate");
  }
});

test("the quiz spoils nothing and keeps visitor clicks apart", () => {
  const checked = block(html, "autocomplete-checked");
  // The only source of an answer in the checked slot sits in a closed drawer.
  assert.match(checked, /<details class="rx-drawer"><summary>/);
  assert.doesNotMatch(checked, /<details[^>]* open/);
  // Only the template's example name appears in the static text, and it says nothing of its group.
  for (const f of a.fakes.filter((f) => f.id !== "fake-0")) assert.ok(!s.includes(f.character), `the static text names ${f.character}`);
  assert.match(section, /aria-live="polite" class="w5-scoreboard"/);
  assert.match(section, /aria-live="polite" class="w5-reveal" hidden/);
  assert.match(section, /id="ac-submit" type="button">Lock and reveal</);
  assert.doesNotMatch(section, /ac-reveal-btn|Lock guess/);
  has("Your score stays in this browser and is not part of our results");
  assert.match(js, /select\.disabled = done/, "a locked guess cannot change");
  assert.doesNotMatch(js, /fetch\(|localStorage|sendBeacon/, "visitor clicks go nowhere");
  assert.equal(a.quiz_variant, "masked");
  has("The quiz shows these masked fakes");
});

test("the fakes are masked, and the page says what the mask leaves", () => {
  for (const f of a.fakes) {
    assert.ok(f.text.includes(f.character));
    assert.deepEqual(f.own_names, [], `${f.id} names a member of its own group`);
    assert.ok(!/xnamex/.test(f.text), "the placeholder shows as [name]");
    assert.ok(f.typical_phrases.every((ph) => !/<\/?s>|\[name\]/.test(ph)), "no sentence markers in the phrases");
  }
  assert.equal(sm.own_names_masked, 0);
  const unmasked = sm.own_names_unmasked === k ? `all ${k}` : `${sm.own_names_unmasked} of the ${k}`;
  has(`Without the mask, ${unmasked} fakes name a member of their own group`);
  // The examples the limitation quotes are words left in the masked fakes.
  for (const w of ["mephisto", "khonshu", "krakoa"]) {
    assert.ok(a.fakes.some((f) => f.name_like.includes(w) && f.text.toLowerCase().includes(w)), `"${w}" is in no masked fake`);
  }
  has(`all ${sm.name_like_fakes} masked fakes keep some, such as mephisto, khonshu and krakoa`);
  assert.equal(sm.name_like_fakes, k);
  has(`The mask covers only the ${p.nodes} characters' own names`);
  has(`as the median normalised mutual information of ${p.nmi_median.toFixed(2)} shows`);
});

test("sparsity and copying are measured, and the example is real text", () => {
  const one = [pct(sm.one_continuation_min), pct(sm.one_continuation_max)];
  const two = [pct(sm.bigram_one_continuation_min), pct(sm.bigram_one_continuation_max)];
  assert.ok(sm.bigram_one_continuation_max < sm.one_continuation_min, "two-word contexts must be sparser than one-word ones");
  has(`${one[0]} to ${one[1]} of two-word contexts in a community's pages have only one next word`);
  has(`In each group's pages, ${one[0]} to ${one[1]} of two-word contexts (a pair of words in a row) have only one next word, against ${two[0]} to ${two[1]} of one-word contexts`);
  has(`${pct(sm.forced_share)} of the words the model drew for the quiz fakes had a single candidate`);
  const runs = a.fakes.map((f) => f.longest_run.length);
  assert.equal(sm.run_min, Math.min(...runs));
  assert.equal(sm.run_max, Math.max(...runs));
  has(`every fake page repeats a run of ${sm.run_min} to ${sm.run_max} words straight from its community's text`);
  has(`every fake repeats a run of ${sm.run_min} to ${sm.run_max} words from its group's pages, ${sm.runs_single_page} of the ${k} runs from a single page`);
  has(`The runs are ${sm.run_min} to ${sm.run_max} words long, and ${sm.runs_single_page} of the ${k} come from a single page`);
  assert.equal(sm.runs_single_page, a.fakes.filter((f) => f.longest_run.pages_with_run === 1).length);
  const ex = a.fakes.find((f) => f.id === sm.example).longest_run;
  assert.equal(ex.pages_with_run, 1);
  assert.ok(ex.sentence.includes(ex.highlight));
  const words = ex.highlight.toLowerCase().match(/[\p{L}\p{M}]+(?:['’-][\p{L}\p{M}]+)*/gu);
  assert.equal(words.length, ex.length, "the highlight holds exactly the copied words");
  const fake = a.fakes.find((f) => f.id === sm.example);
  assert.ok(fake.text.toLowerCase().includes(ex.run), "the run is in the quiz fake");
});
