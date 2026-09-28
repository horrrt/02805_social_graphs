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
  "sixteen", "seventeen", "eighteen", "nineteen",
];
const TENS = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];
const strip = (id) => id.replace(/_/g, " ").replace(/\s*\(.*\)$/, "");
const spell = (n) => { if (n < 20) return WORDS[n]; if (n >= 100) return String(n); const tens = TENS[Math.floor(n / 10)]; return n % 10 ? `${tens}-${WORDS[n % 10]}` : tens; };
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
  has(`${facts.n_nodes} articles in Wikipedia’s Marvel Comics superheroes category, with ${count(facts.n_arcs)} links between them`);
  has(`Counting direction, there are ${count(facts.n_arcs)} links; ignoring it, they join ${count(facts.n_undirected)} distinct pairs of articles, since ${facts.mutual_pairs} pairs link both ways`);
  has(`the average in-degree and the average out-degree are equal: ${(facts.n_arcs / facts.n_nodes).toFixed(2)} links per article`);
  has(`There are ${facts.n_isolates}. The ${facts.zero_in} cards with no incoming links`);
});

test("post section: who links to whom (w1-a1-post-section-untested)", () => {
  const spiderman = byName.get("Spider-Man");
  const betsy = byName.get("Betsy Braddock");
  has(`Spider-Man receives references from ${count(spiderman.kin)} pages, while ${facts.zero_in}—including Baymax—receive none`);
  has(`Spider-Man therefore gets ${count(spiderman.kin + 1)} chances for every one Baymax gets`);
  has(`Spider-Man’s page points to ${spell(spiderman.kout)} other articles`);
  has(`Betsy Braddock’s points to ${betsy.kout}, but only ${spell(betsy.kin)} point back to her`);
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
  has(`Across all ${facts.n_nodes} articles, in- and out-degree correlate (Spearman ${facts.spearman_in_out.toFixed(2)}, Pearson ${facts.pearson_in_out.toFixed(2)}, both p < 0.001), despite the different leaders`);
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
  has(`A giant component of ${facts.giant_size} articles holds ${facts.giant_share}% of the roster. Then there is one ${spell(island.length)}-article island, and ${isolates.length} articles with no link in either direction`);
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
    (kout > kin ? orange : ink).push(name);
  }
  // Cross-check the split against arcade_graph.json's own kin/kout.
  const aboveLine = picks.filter((name) => {
    const node = byId[name.replace(/ /g, "_")];
    return node.kout <= node.kin;
  }).length;
  assert.equal(ink.length, aboveLine, `${spell(aboveLine)} picks should sit at or above the in = out line`);
  const alt = altOf("figures/in_vs_out.png");
  // INK hubs keep the figure's own picks order (w1-p7-01); ORANGE hubs read
  // in descending out-degree, as the alt text lists them.
  orange.sort((a, b) => byName.get(b).kout - byName.get(a).kout);
  assert.ok(
    alt.includes(
      `for all ${facts.n_nodes} articles with an in = out reference line. ` +
        `${joinList(ink.map(strip))} sit above the line; ` +
        `${joinList(orange.map(strip))} sit far to the right, below it.`,
    ),
  );
});

test("island figure alt text names every member and every arc (w1-p7-02, w1-m6)", () => {
  const island = facts.islands[0];
  const edges = graph.links.filter(([a, b]) => island.includes(a) && island.includes(b));
  const outOf = (id) => edges.filter(([a]) => a === id).map(([, b]) => b);
  const into = (id) => edges.filter(([, b]) => b === id).map(([a]) => a);
  const alt = altOf("figures/island.png");

  // Every member is named, including Scatterbrain (w1-m6): the hub (most
  // out-arcs inside the island) first, then its out-neighbours, then the rest,
  // each group sorted by display name.
  const members = graph.nodes.filter((n) => n.component === "island").map((n) => n.id);
  assert.deepEqual([...members].sort(), [...island].sort(), "arcade_graph.json's island should match week01_facts.json");
  const hub = [...members].sort((a, b) => outOf(b).length - outOf(a).length)[0];
  const byDisplay = (ids) => ids.map(strip).sort();
  const order = [
    strip(hub),
    ...byDisplay(outOf(hub)),
    ...byDisplay(members.filter((id) => id !== hub && !outOf(hub).includes(id))),
  ];
  assert.deepEqual([...order].sort(), byDisplay(members), "the listed order should name each member once");
  assert.ok(alt.includes(`the ${spell(members.length)} Strikeforce: Morituri characters: ${joinList(order)}.`));

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

  // Backhand's neighbours, most shared arcs first (Vyking both ways, Shear one).
  const backhand = "Backhand_(character)";
  const shared = new Map();
  for (const [a, b] of edges) {
    if (a !== backhand && b !== backhand) continue;
    const other = a === backhand ? b : a;
    shared.set(other, (shared.get(other) || 0) + 1);
  }
  const backhandOrder = [...shared]
    .sort(([a, x], [b, y]) => y - x || strip(a).localeCompare(strip(b)))
    .map(([id]) => strip(id));
  assert.ok(alt.includes(`${strip(backhand)} hangs off ${joinList(backhandOrder)}.`));

  // The total still has to add up to every arc in the drawing.
  assert.ok(alt.includes(`${cap(spell(edges.length))} arrows in total, none leaving the group`));
});

test("headline, map, isolate, distribution and closing numbers", () => {
  has(`${facts.zero_in} articles receive no incoming links.`);
  has(`Equal odds use p = 1/${facts.n_nodes};`);
  has(`In- and out-degree are positively correlated across all ${facts.n_nodes} articles (Spearman ${facts.spearman_in_out.toFixed(2)})`);
  has(`the roster is not one network but ${spell(facts.n_wcc)}.`);
  assert.ok(altOf("figures/map.png").includes(`a grid of ${facts.n_isolates} green dots labelled the ${facts.n_isolates} isolates.`));
  has(`The ${facts.n_isolates} isolates are a different phenomenon.`);
  has(`${facts.n_isolates} of the ${facts.n_nodes} characters`);
  const atMax = facts.top_in.filter((r) => r.k === facts.max_in).length;
  assert.equal(atMax, 1, "exactly one article should hold the maximum in-degree");
  has(`Most articles receive very few links. ${cap(spell(atMax))} gets ${facts.max_in}.`);
  has(`so the ${facts.zero_in} zero-incoming articles remain visible`);
  const minWeight = Math.min(...packs.cards.map((c) => c.weight));
  const atMin = packs.cards.filter((c) => c.weight === minWeight).length;
  assert.equal(atMin, packs.collector.minimumRateCards);
  assert.ok(raw.includes(`>${atMin} minimum-rate cards</option>`), `the rare option should read "${atMin} minimum-rate cards"`);
  has(`${facts.n_nodes} article entries and ${count(facts.n_arcs)} directed links`);
});

test("every number in \"What surprised us\"", () => {
  const box = section("<h3>What surprised us</h3>", "</div>");
  const has = (t) => assert.ok(box.includes(t), `"What surprised us" should say "${t}"`);
  const betsy = facts.most_outward[0];
  assert.equal(betsy.name, "Betsy Braddock");
  assert.deepEqual([betsy.kin, betsy.kout], [byId.Betsy_Braddock.kin, byId.Betsy_Braddock.kout]);
  const spiderman = byId["Spider-Man"];
  const island = facts.islands[0];
  const islandEdges = graph.links.filter(([a, b]) => island.includes(a) && island.includes(b));
  const c = packs.collector;
  has(`Betsy Braddock links out to ${betsy.kout} articles but only ${betsy.kin} link back to her`);
  has(`while Spider-Man alone is linked by ${spiderman.kin}.`);
  has(`a ${spell(island.length)}-character island from a single series`);
  has(`that cites itself ${islandEdges.length} times`);
  has(`so those same ${spiderman.kin} links make Spider-Man common`);
  has(`while ${facts.zero_in} articles, including all ${facts.n_isolates} isolates, share the lowest drop rate`);
  has(
    `takes about ${count(c.expectedPacksRounded)} packs on average, about ` +
      `${spell(Math.round(c.expectedPacksRounded / c.uniformExpectedPacks))} times the ${count(c.uniformExpectedPacks)} packs`,
  );
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
