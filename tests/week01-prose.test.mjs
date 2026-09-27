// Pins the Week 1 page's numbers that tests/week01-data.test.mjs does not
// reach: the hero/dataset primer, the "What we found" narrative and its
// deeper degree-evidence copy, the map and island sections, the takeaway
// tiles, the coupon-collector disclosure, the Wikipedia API-check table, and
// hero-packs.svg's three card counts. Each assertion builds its expected text
// from the analysis JSON (never a bare literal copied from the page), so a
// rerun that moves a number fails here instead of leaving stale prose behind.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { expectedDistinct } from "../docs/assets/js/collection-model.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (name) => readFileSync(join(ROOT, name), "utf8");
const json = (name) => JSON.parse(read(name));

const raw = read("docs/weeks/week01/index.html");
const svg = read("docs/assets/images/hero-packs.svg");
const plain = raw
  .replace(/<[^>]+>/g, " ")
  .replace(/&lt;/g, "<")
  .replace(/&gt;/g, ">")
  .replace(/&amp;/g, "&")
  .replace(/\s+/g, " ");
const has = (t) => assert.ok(plain.includes(t), `the page should say "${t}"`);

const facts = json("analysis/week01_facts.json");
const packs = json("docs/assets/data/week01_packs.json");
const graph = json("docs/assets/data/arcade_graph.json");
const apiCheck = json("analysis/week01_api_check.json");

const count = (n) => n.toLocaleString("en-US");
const WORDS = [
  "zero", "one", "two", "three", "four", "five", "six", "seven", "eight",
  "nine", "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen",
  "sixteen", "seventeen", "eighteen", "nineteen", "twenty",
];
const strip = (id) => id.replace(/_/g, " ").replace(/\s*\(.*\)$/, "");
const spell = (n) => (n < 20 ? WORDS[n] : n < 30 ? `twenty-${WORDS[n - 20]}` : String(n));
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const joinList = (names) =>
  names.length <= 1
    ? names[0] || ""
    : `${names.slice(0, -1).join(", ")} and ${names.at(-1)}`;

// A section slice, tag-stripped and whitespace-collapsed, for assertions
// scoped to one part of the page (so "58" in the takeaway tiles cannot be
// satisfied by an unrelated "58" elsewhere).
const section = (from, to) => {
  const start = raw.indexOf(from);
  assert.ok(start !== -1, `marker "${from}" not found`);
  return raw
    .slice(start, raw.indexOf(to, start))
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ");
};

// An <img> tag's alt attribute, found by a fragment of its src, independent
// of attribute order (tag-stripping for the rest of the page destroys alt
// text, so these are read from the raw markup instead).
const altOf = (srcFragment) => {
  const at = raw.indexOf(srcFragment);
  assert.ok(at !== -1, `no reference to "${srcFragment}"`);
  const tagStart = raw.lastIndexOf("<img", at);
  const tagEnd = raw.indexOf(">", at);
  const m = raw.slice(tagStart, tagEnd + 1).match(/alt="([^"]*)"/);
  assert.ok(m, `no alt attribute on the tag for "${srcFragment}"`);
  return m[1];
};

const byId = Object.fromEntries(graph.nodes.map((n) => [n.id, n]));
const byName = new Map();
for (const row of [...facts.top_in, ...facts.top_out, ...facts.most_inward, ...facts.most_outward])
  byName.set(row.name, { kin: row.kin, kout: row.kout });

test("hero and dataset-primer numbers (w1-a1-hero-section-untested)", () => {
  has(`303 articles in Wikipedia’s Marvel Comics superheroes category, with ${count(facts.n_arcs)} links between them`);
  has(`Counting direction, there are ${count(facts.n_arcs)} links; ignoring it, they join ${count(facts.n_undirected)} distinct pairs of articles, since ${facts.mutual_pairs} pairs link both ways`);
  has(`the average in-degree and the average out-degree are equal: ${(facts.n_arcs / facts.n_nodes).toFixed(2)} links per article`);
  has(`There are ${facts.n_isolates}. The ${facts.zero_in} cards with no incoming links`);
});

test("post section: who links to whom (w1-a1-post-section-untested)", () => {
  const spiderman = byName.get("Spider-Man");
  const betsy = byName.get("Betsy Braddock");
  has(`Spider-Man receives references from ${count(spiderman.kin)} pages, while ${facts.zero_in}—including Baymax—receive none`);
  has(`Spider-Man therefore gets ${count(spiderman.kin + 1)} chances for every one Baymax gets`);
  has(`Spider-Man’s page points to ${WORDS[spiderman.kout]} other articles`);
  has(`Betsy Braddock’s points to ${betsy.kout}, but only ${WORDS[betsy.kin]} point back to her`);
});

test("degree-evidence section: in vs out, overlap and correlation (w1-a1-post-section-untested, w1-a2)", () => {
  const spiderman = byName.get("Spider-Man");
  const betsy = byName.get("Betsy Braddock");
  has(`Spider-Man receives ${spiderman.kin} links and links out to ${spiderman.kout}; Betsy Braddock links out to ${betsy.kout} and receives ${betsy.kin}`);
  const cutoff = facts.top_out[9].k;
  const tieCount = facts.top_out.filter((r) => r.k === cutoff).length;
  has(`${cap(spell(tieCount))} articles tie for tenth place in outgoing links`);
  const overlap = joinList(facts.top10_overlap.map(strip));
  has(`counting all of them, ${overlap} appear in both top-ten lists`);
  assert.ok(facts.pearson_in_out_p < 0.001 && facts.spearman_in_out_p < 0.001, "both p-values must round to under 0.001 for the page's shorthand");
  has(`in- and out-degree correlate (Spearman ${facts.spearman_in_out.toFixed(2)}, Pearson ${facts.pearson_in_out.toFixed(2)}, both p < 0.001), despite the different leaders`);
});

test("degree-distributions figure alt text (w1-a1-evidence-structure-untested)", () => {
  const alt = altOf("figures/degree_distributions.png");
  assert.ok(alt.includes(`In-degree has a long tail reaching ${facts.max_in}; out-degree stops at ${facts.max_out}.`));
});

test("map section and island population (w1-a1-evidence-structure-untested)", () => {
  const island = facts.islands[0];
  const isolates = facts.isolates;
  const islandEdges = graph.links.filter(([a, b]) => island.includes(a) && island.includes(b));
  has(`${facts.n_nodes} ARTICLES · ${facts.n_wcc} PIECES · UNDIRECTED`);
  has(`A giant component of ${facts.giant_size} articles holds ${facts.giant_share}% of the roster. Then there is one ${WORDS[island.length]}-article island, and ${isolates.length} articles with no link in either direction`);
  has(`Its characters cite each other ${islandEdges.length} times`);
  has(`${cap(spell(island.length))} characters, ${islandEdges.length} arcs among themselves, zero to the other ${facts.n_nodes - island.length}`);
  has(`Following arrows only, the roster splits further: ${facts.n_scc} strongly connected components, the largest holding ${facts.largest_scc} articles`);
});

test("in-vs-out scatter alt text names every labelled hub (w1-p7-01)", () => {
  const picks = [
    "Spider-Man", "Hulk", "Wolverine (character)", "Doctor Strange",
    "Betsy Braddock", "Adam Warlock", "Noh-Varr", "U.S. Agent",
    "Cloak and Dagger (characters)", "She-Hulk", "Deadpool", "Quasar (character)",
  ];
  const ink = [], orange = [];
  for (const name of picks) {
    const { kin, kout } = byName.get(name);
    (kout > kin ? orange : ink).push(strip(name));
  }
  assert.equal(ink.length, 7, "seven picks should sit at or above the in = out line");
  const alt = altOf("figures/in_vs_out.png");
  // The fix (w1-p7-01) is naming every INK hub, in the order the figure's own
  // picks list produces them; the ORANGE half was already complete and keeps
  // its own established order, so only presence is checked there.
  assert.ok(alt.includes(`${joinList(ink)} sit above the line`));
  for (const name of orange) assert.ok(alt.includes(name), `alt text should name "${name}"`);
});

test("island figure alt text names every member and every arc (w1-p7-02, w1-m6)", () => {
  const island = facts.islands[0];
  const edges = graph.links.filter(([a, b]) => island.includes(a) && island.includes(b));
  const outOf = (id) => edges.filter(([a]) => a === id).map(([, b]) => b);
  const into = (id) => edges.filter(([, b]) => b === id).map(([a]) => a);
  const alt = altOf("figures/island.png");

  // Every member is named, including Scatterbrain (w1-m6).
  for (const id of island) assert.ok(alt.includes(strip(id)), `alt text should name "${strip(id)}"`);

  // Radian's own edges, exactly as the graph has them.
  const radianOut = outOf("Radian_(Morituri)").map(strip).sort();
  const radianIn = into("Radian_(Morituri)").map(strip).sort();
  assert.ok(alt.includes(`it links out to ${joinList(radianOut)}`));
  assert.ok(alt.includes(`is linked from ${joinList(radianIn)}`));

  // The triangle the old alt text left out: Scaredycat, Scatterbrain and Toxyn
  // link to each other in both directions (6 of the 22 arcs).
  const triangle = ["Scaredycat", "Scatterbrain_(Morituri)", "Toxyn"];
  const triangleEdges = edges.filter(([a, b]) => triangle.includes(a) && triangle.includes(b));
  assert.equal(triangleEdges.length, 6, "the triangle should hold 6 of the 22 arcs");
  for (const id of triangle) assert.ok(alt.includes(strip(id)));
  assert.ok(/Scaredycat,\s*Scatterbrain\s*and\s*Toxyn.*both directions/.test(alt));

  // Snapdragon's extra links the old alt text left out: one-way to Blackthorn,
  // both ways with Vyking.
  assert.ok(outOf("Snapdragon_(Morituri)").includes("Blackthorn_(character)"));
  assert.ok(!into("Snapdragon_(Morituri)").includes("Blackthorn_(character)"));
  assert.ok(outOf("Snapdragon_(Morituri)").includes("Vyking") && into("Snapdragon_(Morituri)").includes("Vyking"));
  assert.ok(/Snapdragon.*Blackthorn.*one way.*Vyking.*both directions/.test(alt));

  // Backhand's own two neighbours, as before.
  assert.ok(alt.includes("Backhand hangs off Vyking and Shear"));

  // The total still has to add up to every arc in the drawing.
  assert.ok(alt.includes(`${cap(spell(edges.length))} arrows in total, none leaving the group`));
});

test("takeaway tiles: 58 and 107x (w1-a1-takeaway-untested)", () => {
  const tiles = section('<p class="eyebrow">THE TAKEAWAY</p>', "</section>");
  const spiderman = byId["Spider-Man"];
  const baymax = byId["Baymax"];
  const spiderCard = packs.cards.find((c) => c.id === "Spider-Man");
  const baymaxCard = packs.cards.find((c) => c.id === "Baymax");
  assert.equal(spiderCard.weight / baymaxCard.weight, spiderman.kin + 1);
  assert.ok(tiles.includes(`${facts.zero_in} cards share the lowest chance of appearing`));
  assert.ok(tiles.includes(`${spiderCard.weight / baymaxCard.weight}× Spider-Man’s drop rate versus Baymax’s`));
});

test("collector disclosure: the coupon-collector wait (w1-a1-collector-untested)", () => {
  const c = packs.collector;
  has(`The expected wait is about ${count(Math.round(c.expectedDraws))} individual draws`);
  has(`Each minimum-rate card has a 1 / ${count(packs.totalWeight)} chance per draw`);
  has(`${c.minimumRateCards - facts.n_isolates} other articles share their drop rate`);
  has(`Requiring the ${facts.n_isolates} isolates adds about ${count(Math.round(c.isolateMarginalExpectedDraws))} draws`);
  has(`That is about ${(c.isolateMarginalShare * 100).toFixed(1)}% of the full expected wait`);
  has(`checked against ${count(c.simulationTrials)} independent exponential-race simulations`);
});

test("the 2,087 total weight is quoted consistently everywhere it appears (w1-m1)", () => {
  const total = packs.totalWeight.toLocaleString("en-US");
  const mentions = plain.match(new RegExp(total.replace(",", "\\,"), "g")) || [];
  assert.equal(mentions.length, 6, `expected six mentions of ${total}, found ${mentions.length}`);
  const spiderCard = packs.cards.find((c) => c.id === "Spider-Man");
  const baymaxCard = packs.cards.find((c) => c.id === "Baymax");
  has(`${spiderCard.weight} chances out of ${total} on each draw`);
  has(`${baymaxCard.weight} chance out of ${total} on each draw`);
});

test("the odds-comparison static fallback matches the JS it stands in for (w1-m2)", () => {
  const draws = 20 * packs.packSize;
  const weighted = expectedDistinct(packs.cards.map((c) => c.probability), draws);
  const uniform = expectedDistinct(graph.nodes.map(() => 1 / graph.nodes.length), draws);
  assert.ok(raw.includes(`<strong id="weighted-unique">${weighted.toFixed(1)}</strong>`));
  assert.ok(raw.includes(`<strong id="uniform-unique">${uniform.toFixed(1)}</strong>`));
  assert.ok(raw.includes(`style="width: ${((weighted / graph.nodes.length) * 100).toFixed(2)}%"`));
  assert.ok(raw.includes(`style="width: ${((uniform / graph.nodes.length) * 100).toFixed(2)}%"`));
  has(`equal odds give about ${Math.round(uniform - weighted)} more different cards on average`);
});

test("the Wikipedia API-check table matches week01_api_check.json (w1-a1-apicheck-table-untested)", () => {
  const table = raw.slice(raw.indexOf('<caption class="fine">'), raw.indexOf("</table>"));
  for (const row of apiCheck) {
    const rowHtml = table.slice(table.indexOf(`>${row.article.replace(/_/g, " ")}<`));
    const cells = [...rowHtml.matchAll(/<td>(\d+)<\/td>/g)].slice(0, 5).map((m) => Number(m[1]));
    assert.deepEqual(
      cells,
      [row.live, row.snapshot, row.agree, row.only_live.length, row.only_snapshot.length],
      `the ${row.article} row should read live/snapshot/agree/only-live/only-snapshot from week01_api_check.json`,
    );
  }
});

test("hero-packs.svg's three counts read kin from arcade_graph.json (w1-a1-svg-hardcoded-counts)", () => {
  assert.equal((svg.match(new RegExp(`MARVEL / ${graph.nodes.length}`, "g")) || []).length, 3);
  for (const [label, id] of [["BAYMAX", "Baymax"], ["HULK", "Hulk"], ["SPIDER-MAN", "Spider-Man"]]) {
    const m = svg.match(new RegExp(`${label}[\\s\\S]*?Mentioned by (\\d+) articles`));
    assert.ok(m, `${label} card should have a "Mentioned by N articles" string`);
    assert.equal(Number(m[1]), byId[id].kin, `${label}'s count should equal its kin in arcade_graph.json`);
  }
});
