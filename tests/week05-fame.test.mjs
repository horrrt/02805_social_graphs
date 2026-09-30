// Pins the text of week 5's section 6 (#fame, owner Niklas) to fame.json, so a
// rerun of analysis/week05_fame.py that moves a number fails here instead of
// leaving the prose behind.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { block, flatten } from "./week04-html.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (name) => readFileSync(join(ROOT, name), "utf8");
const html = read("docs/weeks/week05/index.html");
const d = JSON.parse(read("docs/weeks/week05/data/fame.json"));
const s = flatten(block(html, "fame"));
const has = (t) => assert.ok(s.includes(t), `section 6 should say "${t}"`);

const count = (n) => n.toLocaleString("en-US");
const two = (v) => `${v < 0 ? "−" : ""}${Math.abs(v).toFixed(2)}`;
const WORDS = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"];
const short = (name) => name.replace(/ \((character|Marvel Comics|comics)\)$/, "");

test("section 6 is Niklas's and loads its script", () => {
  assert.match(html, /<section class="step" data-owner="Niklas" id="fame">/);
  assert.match(html, /week05-fame\.js\?v=6"/);
  assert.match(read("analysis/week05_fame.py"), /Owner: Niklas/);
  assert.equal(d.meta.owner, "Niklas");
  // The table and the passages come from the JSON; none is typed into the page.
  assert.doesNotMatch(block(html, "fame"), /<table|<blockquote/);
});

test("fame.json holds 303 points and ten outliers that agree with them", () => {
  const c = d.corpus;
  assert.equal(d.points.length, c.pages);
  assert.equal(d.points.filter((p) => p.isolate).length, c.isolates);
  assert.equal(d.points.filter((p) => p.in_degree === 0).length, c.zero_in_degree);
  assert.ok(d.points.filter((p) => p.isolate).every((p) => p.in_degree === 0 && p.out_degree === 0));
  const byResidual = [...d.points].sort((a, b) => b.residual - a.residual);
  const top = d.outliers.filter((o) => o.side === "above").length;
  assert.deepEqual(d.outliers.filter((o) => o.side === "above").map((o) => o.id), byResidual.slice(0, top).map((p) => p.id));
  assert.deepEqual(d.outliers.filter((o) => o.side === "below").map((o) => o.id), byResidual.slice(-top).reverse().map((p) => p.id));
  for (const o of d.outliers) {
    assert.ok(Math.abs(o.ratio - Math.exp(o.residual)) < 1e-9, `${o.name}: ratio is exp(residual)`);
    assert.ok(Math.abs(o.predicted - Math.exp(d.fit.intercept + d.fit.slope * Math.log1p(o.in_degree))) <= 0.5);
    assert.ok(o.quote.text.includes(o.quote.highlight), `${o.name}: the highlight is in the quote`);
    assert.ok(o.reason.length > 0);
  }
});

test("section 6 states the fit and its baseline from fame.json", () => {
  const f = d.fit;
  const c = d.corpus;
  const [out, rank] = ["out-degree", "PageRank"].map((m) => d.other_measures.find((x) => x.measure === m).spearman);
  // "Yes, and strongly": far above every shuffle.
  assert.ok(f.pearson > 0.5 && f.pearson > f.null_max, '"strongly" needs r above 0.5 and every shuffle');
  has(`Yes, and strongly (Pearson ${f.pearson.toFixed(2)}, Spearman ${f.spearman.toFixed(2)})`);
  // "Four of the five below it": minor characters every linking page of which names one team or place.
  const teamed = d.outliers.filter((o) => o.side === "below" && o.cast && o.cast.with_word === o.cast.linkers);
  const cap = (w) => w[0].toUpperCase() + w.slice(1);
  has(`${cap(WORDS[teamed.length])} of the ${WORDS[d.outliers.length / 2]} below the line are minor characters whose every linking page names the same team or place`);
  has(`We counted the words on each of the ${c.pages} pages by the rule sections 5 to 7 share: ${d.meta.word_rule}.`);
  has(`The 1 + keeps the ${c.zero_in_degree} pages nobody links to, ${c.isolates} of them isolates with no links at all.`);
  has(`The slope is ${f.slope.toFixed(2)}: each doubling of 1 + in-degree multiplies the predicted length by ${f.per_doubling.toFixed(2)}, starting from ${count(Math.round(f.base_tokens))} words at zero in-degree.`);
  assert.ok(Math.abs(f.null_mean) < 0.005, 'the shuffles must average "0.00"');
  has(`The correlation of ${f.pearson.toFixed(2)} is far from chance: in ${count(d.meta.shuffles)} shuffles of in-degree over the pages it averaged 0.00 ± ${f.null_sd.toFixed(2)} and never passed ${f.null_max.toFixed(2)}.`);
  has(`For the ${WORDS[d.outliers.length / 2]} pages furthest above the line and the ${WORDS[d.outliers.length / 2]} furthest below`);
  has(`Each shuffle test uses ${count(d.meta.shuffles)} shuffles with seed ${d.meta.seed}.`);
  // "Even more closely": out-degree above in-degree.
  assert.ok(out > f.spearman, '"even more closely" needs out-degree above in-degree');
  has(`Out-degree, the links a page makes, tracks length even more closely (Spearman ${out.toFixed(2)})`);
  has(`gives ${rank.toFixed(2)}.`);
  has(`Each dot is one of the ${c.pages} pages, on log scales; hollow dots are the ${c.isolates} isolates.`);
  has(`The ${WORDS[d.outliers.length]} named pages`);
  has(`The ${WORDS[d.outliers.length]} pages furthest from the line, above it first.`);
});

test("section 6 states the pattern tests and names the outliers from fame.json", () => {
  const m = d.patterns.mentions;
  const h = d.patterns.hubs;
  // "One holds": the hub gap passes p < 0.05, the mentions test does not.
  assert.ok(h.p < 0.05 && m.p > 0.05, '"one holds" needs the hub test below p = 0.05 and the mentions test above');
  assert.ok(Math.abs(m.null_mean) < 0.005);
  has(`Pages named without a link: Spearman ${m.rho.toFixed(2)} with the residual, against 0.00 ± ${m.null_sd.toFixed(2)} in shuffles (p = ${m.p.toFixed(3)}).`);
  has(`The ${h.pages} hub pages: mean residual ${two(h.mean_residual)}, against ${two(h.rest_mean_residual)} for the other pages (p = ${h.p.toFixed(3)}).`);
  // "Barely": a rank correlation under 0.2 that shuffles match often.
  assert.ok(m.rho > 0 && m.rho < 0.2 && m.p > 0.05, '"barely" needs a small positive rho and p above 0.05');
  has(`barely goes with a longer page (Spearman ${m.rho.toFixed(2)}, p = ${m.p.toFixed(3)})`);
  assert.ok(h.gap < 0);
  has(`the ${h.pages} hub pages sit ${Math.abs(h.gap).toFixed(2)} below the rest (×${Math.exp(h.gap).toFixed(2)}, p = ${h.p.toFixed(3)})`);
  assert.equal(d.meta.hub_rule.startsWith("its first sentence"), true, "the hub rule reads the first sentence, as the page says");

  // "Each shows at its extreme in one outlier": one hub below the line, one codename undercount above it.
  const above = d.outliers.filter((o) => o.side === "above");
  const below = d.outliers.filter((o) => o.side === "below");
  assert.equal(h.below, 1);
  assert.deepEqual(below.filter((o) => o.hub).map((o) => o.id), [below[0].id]);
  const coded = above.filter((o) => o.codename);
  assert.deepEqual(coded.map((o) => o.id), [above[0].id]);
  const b = above[0];
  const q = below[0];
  has(`Each of the two explanations, hub pages and names without a link, shows at its extreme in one outlier: ${b.name}'s codename, ${b.codename.name}, is on ${b.codename.pages} other pages but linked from ${b.codename.linked}, and ${short(q.name)} is a page for a name ${WORDS[q.holders.length]} characters share, with ${q.in_degree} incoming links.`);
  assert.equal(b.codename.page_ids.length, b.codename.pages);

  // The limitation names two characters from outside the link set: both above the line, no links in.
  has(`In-degree counts only links among these ${d.corpus.pages} pages.`);
  for (const name of ["Miracleman", "Isaiah Bradley"]) {
    const o = above.find((x) => short(x.name) === name);
    assert.ok(o && o.in_degree === 0, `${name} must be above the line with no incoming links`);
    has(name);
  }
});

test("the fame outliers' reasons carry the measured numbers", () => {
  const o = Object.fromEntries(d.outliers.map((x) => [x.id, x]));
  const times = (r) => `×${r >= 1 ? r.toFixed(1) : r.toFixed(2)}`;
  const brian = o.Brian_Braddock;
  assert.ok(brian.reason.includes(`on ${brian.codename.pages} other pages`));
  assert.ok(brian.reason.includes(`only ${brian.codename.linked} of them links`));
  // "Undercounts him": linking the naming pages takes most of his gap away.
  assert.ok(brian.ratio_if_linked < brian.ratio / 2, '"undercounts him" needs the counterfactual to halve the ratio');
  assert.ok(brian.reason.includes(`at ${times(brian.ratio_if_linked)} predicted instead of ${times(brian.ratio)}`));
  // "Only moves him": U.S. Agent stays far above the line.
  const agent = o["U.S._Agent"];
  assert.ok(agent.ratio_if_linked > 3, '"only moves him" needs U.S. Agent still well above the line');
  assert.ok(agent.reason.includes(`from ${times(agent.ratio)} to ${times(agent.ratio_if_linked)} predicted`));
  // The two passages about names without links come from pages that do not link.
  assert.equal(brian.quote.links, false);
  assert.equal(agent.quote.links, false);
  assert.ok(o["Quasar_(character)"].reason.includes(`${WORDS[o["Quasar_(character)"].holders.length]} characters have been Quasar`));
  assert.ok(o["Miracleman_(character)"].isolate && o["Miracleman_(character)"].mentions === 0);
  const betsy = o.Betsy_Braddock;
  assert.ok(betsy.in_degree > betsy.mentions, '"not undercounted" needs more links than mentions');
  for (const x of d.outliers.filter((y) => y.cast)) {
    assert.equal(x.cast.with_word, x.cast.linkers, `${x.name}: every linker mentions ${x.cast.word}`);
    assert.ok(x.reason.includes(`${x.headings} headings`));
    // "short" pages: fewer headings than the median page.
    assert.ok(x.headings < d.corpus.median_headings);
  }
  for (const x of d.outliers.filter((y) => y.side === "above" && /headings/.test(y.reason))) {
    assert.ok(x.headings > d.corpus.median_headings, `${x.name}: a long page has more headings than the median`);
  }
});
