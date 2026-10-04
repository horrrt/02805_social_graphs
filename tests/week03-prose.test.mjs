// The week 3 post types numbers by hand into prose. Nothing checked that a
// hand-typed number still matched the file it claims to quote, which is how
// "z 5.92, sd 0.03" and "16 countries out of 228" survived a rebuild that
// changed both. This parses the page for the numbers this audit fixed and
// checks each one against the analysis output, so the next rebuild that
// moves a number gets caught here instead of by a reader.
import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { builtPage } from "./built-page.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const readText = (path) => readFileSync(join(ROOT, path), "utf8");
const loadData = (name) => JSON.parse(readText(join("public/assets/data", name)));
const loadAnalysis = (name) => JSON.parse(readText(join("analysis", name)));

const html = builtPage("out/weeks/week03/index.html");
const corridor = readText("src/scripts/corridor.js");

const glob = (dir) => readdirSync(join(ROOT, dir))
  .filter((name) => name.endsWith(".js"))
  .map((name) => join(dir, name));
// Week 3's code as it moves into React, every level down.
const tree = (dir) =>
  existsSync(join(ROOT, dir))
    ? readdirSync(join(ROOT, dir), { withFileTypes: true }).flatMap((e) =>
        e.isDirectory() ? tree(join(dir, e.name)) : /\.(js|ts|tsx)$/.test(e.name) ? [join(dir, e.name)] : [],
      )
    : [];
const jsFiles = [
  ...glob("src/scripts"),
  ...glob("src/scripts/variants"),
  ...tree("src/features/week03"),
  ...tree("src/components/week03"),
];

// The page wraps hand-written prose at ~70 columns, so a phrase that reads as
// one line in the source is split by newlines and indentation in the file.
// Match on the words with whitespace collapsed instead of a literal substring.
// React's output drops the whitespace between tags and writes inline styles
// without spaces ("text-align:right"), so both sides are normalised the same way.
const norm = (s) =>
  s
    .replace(/\s+/g, " ")
    .replace(/> </g, "><")
    .replace(/style="([^"]*)"/g, (_, v) => `style="${v.replace(/\s*:\s*/g, ":").replace(/;\s*$/, "")}"`);
const flat = norm(html);
const hasPhrase = (phrase) => flat.includes(norm(phrase));

const corridors = loadData("week03_corridors.json");
const edges = loadData("week03_edges.json");
const flights = loadData("week03_flights.json");
const cart = loadData("week03_cartography.json");
const tails = loadAnalysis("week03_tails.json");
const gravity = loadAnalysis("week03_gravity.json");
const communities = loadAnalysis("week03_communities.json");
const passengers = loadAnalysis("week03_passengers.json");
const countryFacts = loadAnalysis("week03_country_facts.json");
const reciprocity = loadAnalysis("week03_reciprocity.json");
const questions = readText("src/scripts/questions.js");
const corridorNodes = corridors.nodes;

test("the page's country counts match the corridors file", () => {
  const total = corridors.countries.length;
  const migration = corridors.totals["2024"].countries;
  const flightCountries = corridors.flight_snapshot.countries;
  assert.ok(
    hasPhrase(`<b>${total}</b> countries and territories are in the payload`),
    `page does not quote ${total} total countries`,
  );
  assert.ok(
    hasPhrase(`<b>${migration}</b> have migration figures`),
    `page does not quote ${migration} migration countries`,
  );
  assert.ok(
    hasPhrase(`<b>${flightCountries}</b> have a flight route`),
    `page does not quote ${flightCountries} flight countries`,
  );
});

test("flight partners are undirected, and match the corridors file for the two named examples", () => {
  // Section 2's callout names the US and France specifically: this is the
  // A2 fix (in + out degree double-counts a two-way route).
  const usa = corridors.nodes.USA;
  const fra = corridors.nodes.FRA;
  assert.equal(usa.flight_partners, 89);
  assert.equal(usa.flight_degree, 176);
  assert.equal(fra.flight_partners, 112);
  assert.equal(fra.flight_degree, 219);
  // The undirected count is never more than the directed one.
  for (const node of Object.values(corridors.nodes)) {
    assert.ok(node.flight_partners <= node.flight_degree);
  }
});

test("UK to Germany shows flight routes even with no DESA migration row", () => {
  // The A3 fix: flights are their own file, not riding along on a migration
  // edge, so a pair with routes and no migration row (or vice versa) still
  // shows its routes.
  const oi = flights.countries.indexOf("GBR");
  const di = flights.countries.indexOf("DEU");
  const edge = flights.edges.find(([o, d]) => o === oi && d === di);
  assert.ok(edge, "no GBR->DEU row in week03_flights.json");
  assert.equal(edge[2], 73);
});

test("the tails table in the page matches the rebuilt tails.json, row by row", () => {
  const rows = [
    ["Origins per destination", tails.fits.in_degree],
    ["People on a corridor", tails.fits.corridor_people],
    ["Destinations per origin", tails.fits.out_degree],
    ["Flight partners", tails.fits.flight_partners],
  ];
  for (const [label, fit] of rows) {
    assert.ok(fit, `no tails.json entry behind the "${label}" row`);
    // Pull the exact <tr> this label sits in, not the whole page, so a
    // number belonging to a different row's fit cannot satisfy this one.
    const rowMatch = html.match(
      new RegExp(`<td>${label}</td>([\\s\\S]*?)</tr>`),
    );
    assert.ok(rowMatch, `page is missing a "${label}" tails row`);
    const row = rowMatch[1];
    const xmin = fit.xmin >= 1000
      ? Math.round(fit.xmin).toLocaleString("en-US")
      : String(Math.round(fit.xmin));
    assert.ok(row.includes(`>${xmin}<`), `"${label}" row does not show x_min ${xmin}`);
    assert.ok(
      row.includes(`>${fit.alpha.toFixed(2)}<`),
      `"${label}" row does not show alpha ${fit.alpha.toFixed(2)}`,
    );
    assert.ok(
      row.includes(`>${fit.n_tail}<`),
      `"${label}" row does not show n_tail ${fit.n_tail}`,
    );
    assert.ok(
      row.includes(`>${fit.p.toFixed(2)}<`),
      `"${label}" row does not show fit p ${fit.p.toFixed(2)}`,
    );
  }
  // Exactly one of the four survives its own goodness-of-fit test.
  const survives = Object.values(tails.fits).filter((f) => f.p >= 0.1);
  assert.equal(survives.length, 1, "the page says three of four fail; that assumes exactly one survives p >= 0.1");
});

test("the gravity table matches the rebuilt gravity.json", () => {
  const corridorsText = gravity.corridors.toLocaleString("en-US");
  assert.ok(
    hasPhrase(`${corridorsText} corridors with population and`),
    `page does not quote ${gravity.corridors} gravity corridors`,
  );
  const nonZero = gravity.corridors - gravity.zero_corridors;
  assert.ok(
    hasPhrase(`${nonZero.toLocaleString("en-US")} non-zero corridors`),
    `page does not derive ${nonZero} non-zero corridors from corridors - zero_corridors`,
  );
  assert.ok(
    hasPhrase(`plus ${gravity.zero_corridors} more`),
    `page does not quote ${gravity.zero_corridors} zero-stock corridors`,
  );
  // The residual table's leader.
  const leader = gravity.over[0];
  assert.equal(leader.origin_name, "Russia");
  assert.equal(leader.destination_name, "Ukraine");
  const ratio = Math.round(leader.ratio);
  assert.ok(hasPhrase(`<b>×${ratio}</b>`), `page does not show ×${ratio} for the leading residual`);
});

const NUMBER_WORDS = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"];

test("the community count and stability numbers match communities.json", () => {
  const n = communities.communities.length;
  const word = NUMBER_WORDS[n] ?? String(n);
  assert.ok(
    hasPhrase(`one of ${word}`) || hasPhrase(`${n} groups`),
    `page does not say ${n} (${word}) community groups`,
  );
  assert.ok(
    hasPhrase(`It returns ${word} groups over ${communities.nodes} countries`),
    `page does not quote ${communities.nodes} countries and ${n} groups in the community graph`,
  );
  assert.ok(
    hasPhrase(`Modularity is ${communities.modularity.toFixed(3)}`) ||
      hasPhrase(`Modularity is ${communities.modularity.toFixed(2)}`),
    "page's modularity does not match communities.json",
  );
  assert.ok(
    hasPhrase(`${communities.stability.same_group_count} times out of 100`),
    "page's seed-stability count does not match communities.json",
  );
  assert.ok(
    hasPhrase(`mean NMI of ${communities.stability.mean_nmi.toFixed(2)}`),
    "page's mean NMI does not match communities.json",
  );
});

test("the flight-partners glossary and legend say partners, not degree, everywhere", () => {
  // A2: every place the page says "partners" must read the undirected
  // field. flight_degree (directed, double-counted) may still exist in the
  // data for other uses, but the visible label must not call it "partners".
  assert.ok(!/Flight degree/.test(html), "the page still labels something 'Flight degree'");
  assert.match(corridor, /"Flight partners":\s*\n\s*"How many other countries/);
});

test("no page script reads flight_degree or labels a chart 'Flight degree'", () => {
  // peersOf() (corridor.js) stopped returning flight_degree; every variant
  // that used to read it off focus.peers, or plot it in the histogram/CCDF,
  // has to read flight_partners instead. A leftover flight_degree read draws
  // NaN bars silently, which is what this audit caught.
  for (const path of jsFiles) {
    const text = readText(path);
    assert.ok(!/\bflight_degree\b/.test(text), `${path} still reads flight_degree`);
    assert.ok(!/Flight degree/.test(text), `${path} still labels something "Flight degree"`);
  }
});

test("the forced-displacement cap count in the test suite matches the edges file", () => {
  const yi = edges.years.indexOf(2024);
  let over = 0;
  for (const edge of edges.edges) {
    const people = edge[2][yi];
    const forced = edge[5] ?? 0;
    if (!people) continue;
    if (forced > people) over += 1;
  }
  assert.ok(
    hasPhrase(`so on ${over} fast-moving corridors`),
    `page does not quote ${over} fast-moving corridors capped`,
  );
});

test("the broker headline matches broker_summary in the corridors file", () => {
  // Both conditions: z >= 2 against the null, and excess betweenness above
  // a twentieth of the leader's. Neither test alone is what the headline
  // claims, and this recomputes both straight from the null_summary and
  // per-country metrics rather than trusting the precomputed field, so a
  // future rewrite of broker_summary itself cannot drift from the page.
  const year = String(corridors.null_year);
  const rows = Object.entries(corridors.null_summary).map(([iso3, stats]) => {
    const m = corridors.nodes[iso3].years[year];
    return { iso3, z: m.z ?? 0, excess: m.betweenness - stats.null_mean };
  });
  const tested = rows.length;
  const zFloor = rows.filter((r) => r.z >= 2);
  const leaderExcess = Math.max(...rows.map((r) => r.excess));
  const brokers = zFloor.filter((r) => r.excess > leaderExcess / 20);

  assert.equal(tested, corridors.broker_summary.tested);
  assert.equal(zFloor.length, corridors.broker_summary.z_floor_count);
  assert.equal(brokers.length, corridors.broker_summary.broker_count);

  assert.ok(
    hasPhrase(`${brokers.length} countries out of ${tested} broker more than their number of`),
    `page headline does not say ${brokers.length} countries out of ${tested}`,
  );
  assert.ok(
    hasPhrase(`${zFloor.length} countries clear z = 2 on its own`),
    `page does not quote ${zFloor.length} for the z >= 2 count on its own`,
  );
});

test("the community share matches share_inside, not share_inside_kept", () => {
  // The notice explicitly counts every 2024 corridor, including the ones
  // below the 10,000-person threshold that the graph itself drops, which is
  // share_inside rather than share_inside_kept.
  const share = communities.share_inside.toFixed(1);
  assert.ok(
    hasPhrase(`<b>${share}% of the world's migrants move inside one of nine`),
    `page headline does not quote share_inside ${share}%`,
  );
  assert.ok(
    hasPhrase(`<b>${share}% of the world's 282 million migrants live inside`),
    `page notice does not quote share_inside ${share}%`,
  );
});

test("the passenger-per-route figures match week03_passengers.json, Venezuela handled explicitly", () => {
  const withVenezuela = passengers.per_route;
  const exVenezuela = passengers.per_route.without_venezuela;
  const venezuela = withVenezuela.lowest.find((row) => row.country === "Venezuela");
  assert.ok(venezuela, "no Venezuela row in week03_passengers.json per_route.lowest");

  assert.ok(
    hasPhrase(`among the ${exVenezuela.countries} countries with five routes`),
    `page does not quote ${exVenezuela.countries} countries (excluding Venezuela)`,
  );
  const highest = withVenezuela.highest[0];
  assert.ok(
    hasPhrase(`${highest.per_route.toLocaleString("en-US")} (${highest.country})`),
    `page does not quote the top per-route figure ${highest.per_route} (${highest.country})`,
  );
  assert.ok(
    hasPhrase(`a factor of ${exVenezuela.spread.toFixed(1)}`),
    `page does not quote the ex-Venezuela spread factor ${exVenezuela.spread}`,
  );
  assert.ok(
    hasPhrase(`${exVenezuela.middle_half[0].toLocaleString("en-US")} and ${exVenezuela.middle_half[1].toLocaleString("en-US")}`),
    `page does not quote the ex-Venezuela middle half ${exVenezuela.middle_half}`,
  );
  assert.ok(
    hasPhrase(`${venezuela.routes} routes for ${venezuela.per_route.toLocaleString("en-US")}`),
    `page does not quote Venezuela's exact per_route figure ${venezuela.per_route}`,
  );
});

test("the top-15 destination overlap names match country_facts.json, not the old Iran mix-up", () => {
  const overlap = countryFacts.destination_overlap;
  const names = overlap.in_both.map((iso3) => corridorNodes[iso3].name);
  assert.ok(
    hasPhrase(`only four appear in both: ${names.join(", ")}`),
    `page's shared-destination list does not match country_facts.json (${names.join(", ")})`,
  );
});

test("the raw-count R2 in the gravity paragraph matches gravity.json", () => {
  const r2 = gravity.r2_counts.toFixed(2);
  assert.ok(
    hasPhrase(`and ${r2} on the raw counts`),
    `page does not quote r2_counts ${r2} from week03_gravity.json`,
  );
});

test("the role-change count and named movers match cartography.json", () => {
  const moved = cart.moved;
  assert.ok(
    hasPhrase(`<b>${moved.length} countries changed the part they play`),
    `page does not quote ${moved.length} moved countries from cartography.json`,
  );
  const venezuela = moved.find((row) => row.iso3 === "VEN");
  const colombia = moved.find((row) => row.iso3 === "COL");
  assert.ok(venezuela, "Venezuela is not in cartography.json's moved list");
  assert.ok(colombia, "Colombia is not in cartography.json's moved list");
  assert.ok(
    hasPhrase(`Venezuela moved from ${venezuela.from} to ${venezuela.to}`),
    `page does not describe Venezuela's move as ${venezuela.from} to ${venezuela.to}`,
  );
  assert.ok(
    hasPhrase(`Colombia moved from ${colombia.from} to ${colombia.to}`),
    `page does not describe Colombia's move as ${colombia.from} to ${colombia.to}`,
  );
  // Ukraine no longer appears in the "both moved" sentence; the JSON is the
  // reason why (it is not in the moved list at all).
  assert.ok(
    !cart.moved.some((row) => row.iso3 === "UKR"),
    "Ukraine now appears in cartography.json's moved list; the page's Ukraine removal should be revisited",
  );
});

test("the destinations-per-origin fit p in the tail-fix paragraph matches tails.json, rounded", () => {
  const p = tails.fits.out_degree.p.toFixed(2);
  assert.ok(
    hasPhrase(`and it reads ${p}`),
    `page does not quote the corrected out-degree fit p ${p} from week03_tails.json`,
  );
});

test("the null-model overclaim framing names what the null holds fixed", () => {
  // Issue 6: the null preserves each country's number of partners (degree),
  // not its total corridor weight, so the headline and glossary must not
  // claim the degree sequence alone "explains" or "cannot explain"
  // betweenness.
  assert.ok(!/the degree sequence cannot explain/.test(flat));
  assert.ok(!/partners can explain/.test(flat));
  assert.ok(
    hasPhrase("predicts when the corridor sizes are dealt out at random"),
    "page does not reword the broker headline around what the null preserves",
  );
});

test("PageRank's damping factor (0.85) is stated where PageRank appears", () => {
  assert.ok(
    hasPhrase("damping factor"),
    "page never states the PageRank damping factor where PageRank is introduced",
  );
  assert.ok(hasPhrase("0.85"), "page never states the PageRank damping factor 0.85");
  assert.ok(
    /0\.85/.test(corridor),
    "corridor.js panel text does not mention the 0.85 damping factor",
  );
});

test("the topology-null table (clustering, assortativity, distance, diameter, clique) matches country_facts.json", () => {
  // Issue 7: these rows had no baseline before. Each cell reads
  // "<real> (null <mean> ± <sd>, z = <z>)"; z = null instead prints
  // "no spread" (sd 0, which is what the migrant diameter null gives).
  // The page writes negatives with a true minus sign (U+2212), as elsewhere on it.
  const minus = (s) => s.replace("-", "\u2212");
  const fmtZ = (z) => (z === null ? "no spread" : `z = ${z >= 0 ? "+" : "\u2212"}${Math.abs(z).toFixed(1)}`);

  for (const [net, label] of [["stock", "Migrants"], ["refugees", "Refugees"]]) {
    const topo = countryFacts[net].topology;
    const real = countryFacts[net];
    const cases = [
      ["Clustering", minus(real.clustering.toFixed(2)), topo.null.clustering],
      ["Degree assortativity", minus(real.degree_assortativity.toFixed(2)), topo.null.assortativity],
      ["Average distance", minus(real.mean_path.toFixed(2)), topo.null.mean_path],
      ["Diameter", String(real.diameter), topo.null.diameter],
    ];
    for (const [rowLabel, realStr, nullValue] of cases) {
      const rowMatch = html.match(new RegExp(`<td>${rowLabel}</td>([\\s\\S]*?)</tr>`));
      assert.ok(rowMatch, `page is missing a "${rowLabel}" row`);
      assert.ok(
        rowMatch[1].includes(realStr),
        `"${rowLabel}" (${label}) does not show real value ${realStr}`,
      );
      // The migrant diameter's null has zero spread, and the page writes
      // that mean as a bare integer ("null 3") rather than "3.00".
      const nullMeanStr = nullValue.sd === 0 ? String(nullValue.mean) : minus(nullValue.mean.toFixed(2));
      assert.ok(
        rowMatch[1].includes(`null ${nullMeanStr}`),
        `"${rowLabel}" (${label}) does not show null mean ${nullMeanStr}`,
      );
      assert.ok(
        rowMatch[1].includes(fmtZ(nullValue.z)),
        `"${rowLabel}" (${label}) does not show ${fmtZ(nullValue.z)}`,
      );
    }
    const clique = topo.largest_clique;
    const rowMatch = html.match(new RegExp(`<td>Largest clique</td>([\\s\\S]*?)</tr>`));
    assert.ok(rowMatch, "page is missing a \"Largest clique\" row");
    assert.ok(
      rowMatch[1].includes(String(clique.size)),
      `Largest clique row (${label}) does not show real size ${clique.size}`,
    );
    assert.ok(
      rowMatch[1].includes(`null ${clique.null.mean.toFixed(2)}`),
      `Largest clique row (${label}) does not show null mean ${clique.null.mean.toFixed(2)}`,
    );
    assert.ok(
      rowMatch[1].includes(fmtZ(clique.null.z)),
      `Largest clique row (${label}) does not show ${fmtZ(clique.null.z)}`,
    );
  }
});

test("the two named cliques list exactly the countries in country_facts.json's largest_clique.members", () => {
  const nodes = loadData("week03_corridors.json").nodes;
  for (const net of ["stock", "refugees"]) {
    const members = countryFacts[net].topology.largest_clique.members;
    const names = members.map((iso3) => nodes[iso3].name).sort();
    for (const name of names) {
      assert.ok(hasPhrase(name), `clique write-up is missing ${name} (from ${net})`);
    }
    assert.ok(
      hasPhrase(`(${members.length} countries)`),
      `clique write-up does not state the ${members.length}-country count for ${net}`,
    );
  }
});

test("section references point at sections that exist (1-8 only)", () => {
  const numbers = [...html.matchAll(/\bSection (\d+)\b/g)].map((m) => Number(m[1]));
  assert.ok(numbers.length > 0, "no 'Section N' references found to check");
  for (const n of numbers) {
    assert.ok(n >= 1 && n <= 8, `"Section ${n}" is referenced but the page only has sections 1-8`);
  }
});

// -------------------------------------------------------------- data-treatment pass

test("the reporting-coverage paragraph matches corridors.json for every year, not one stale reading", () => {
  const usaYears = Object.entries(corridors.nodes.USA.years);
  const usaDegrees = new Set(usaYears.map(([, y]) => y.in_degree));
  assert.equal(usaDegrees.size, 1, "the USA's in-degree is not constant across years any more");
  const usaConstant = [...usaDegrees][0];
  assert.ok(
    hasPhrase(`United States names ${usaConstant} origins in every year`),
    `page does not quote the USA's constant in-degree (${usaConstant})`,
  );
  const dnkYears = corridors.nodes.DNK.years;
  const first = String(corridors.years[0]);
  const last = String(corridors.years.at(-1));
  const dnkFirst = dnkYears[first].in_degree;
  const dnkLast = dnkYears[last].in_degree;
  assert.ok(
    dnkLast > dnkFirst && hasPhrase(`Denmark rises from ${dnkFirst} in ${first} to ${dnkLast} by ${last}`),
    `page does not quote Denmark's ${first}-${last} in-degree range (${dnkFirst} to ${dnkLast})`,
  );
});

test("the migrant-destinations table is ordered exactly as country_facts.json's stock_rankings", () => {
  const ranked = countryFacts.stock_rankings.weighted_in_degree.slice(0, 10)
    .map((iso3) => corridorNodes[iso3].name);
  const rowMatch = html.match(
    /Where migrants live[\s\S]*?<\/table>/,
  );
  assert.ok(rowMatch, "could not find the migrant-destinations table");
  const cells = [...rowMatch[0].matchAll(/<td[^>]*>([^<]+)<\/td>/g)].map((m) => m[1]);
  // Three columns per row (rank, destination, refugee country); the
  // destination name is the second cell of each row.
  const tableNames = cells.filter((_, i) => i % 3 === 1);
  assert.deepEqual(
    tableNames,
    ranked,
    `migrant-destinations table order (${tableNames.join(", ")}) does not match stock_rankings (${ranked.join(", ")})`,
  );
});

test("the in-degree tie count matches tails.json's own n and n_distinct, not a stale docstring figure", () => {
  const fit = tails.fits.in_degree;
  assert.ok(fit.n_distinct, "week03_tails.json's in_degree fit has no n_distinct field");
  assert.ok(
    hasPhrase(`${fit.n} countries share ${fit.n_distinct} distinct in-degrees`),
    `page does not quote tails.json's in_degree n/n_distinct (${fit.n}/${fit.n_distinct})`,
  );
});

test("the 'which countries, and how many' paragraph names nine counts, matching every quantity it lists", () => {
  const total = corridors.countries.length;
  const migration = corridors.totals[String(corridors.years.at(-1))].countries;
  const flightCountries = corridors.flight_snapshot.countries;
  const anyIndicator = Object.values(corridors.indicators).filter(
    (v) => Object.values(v).some((x) => x !== null),
  ).length;
  const income = Object.values(corridors.indicators).filter((v) => v.gdp !== null).length;
  const floor2024 = Object.keys(cart.by_year[String(cart.years.at(-1))]).length;
  const floor1990 = Object.keys(cart.by_year[String(cart.years[0])]).length;
  const oxford = loadData("week03_closures.json").countries;
  const usPassengers = passengers.countries;
  const counts = [
    ["total", total], ["migration", migration], ["flight", flightCountries],
    ["any indicator", anyIndicator], ["income", income],
    ["2024 floor", floor2024], ["1990 floor", floor1990],
    ["Oxford", oxford], ["US passengers", usPassengers],
  ];
  for (const [label, n] of counts) {
    assert.ok(hasPhrase(`<b>${n}</b>`), `page does not quote <b>${n}</b> for the "${label}" count`);
  }
  const word = NUMBER_WORDS[counts.length];
  assert.ok(hasPhrase(`${word[0].toUpperCase()}${word.slice(1)} different counts appear on this page`),
    `the paragraph lists ${counts.length} counts and should say so`);
});

test("the section-2 histogram callout matches corridors.json's 2020 in-degree distribution", () => {
  const year = String(corridors.null_year);
  const values = Object.values(corridors.nodes)
    .map((n) => n.years[year]?.in_degree)
    .filter((v) => v !== undefined)
    .sort((a, b) => a - b);
  const median = values[Math.floor(values.length / 2)];
  const max = values.at(-1);
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const belowMean = values.filter((v) => v < mean).length;
  const shareBelowMean = Math.round((belowMean / values.length) * 10);
  const shareBelow10 = Math.round((values.filter((v) => v < 10).length / values.length) * 100);
  assert.ok(
    hasPhrase(`median country has ${median} origins and the busiest has ${max}`),
    `page does not quote median ${median} / max ${max} from corridors.json`,
  );
  assert.ok(
    hasPhrase(`${NUMBER_WORDS[shareBelowMean]} countries in ten sit below the mean of ${Math.round(mean)}`),
    `page does not quote the mean ${Math.round(mean)} and its ${shareBelowMean}-in-ten share`,
  );
  assert.ok(
    hasPhrase(`Only ${shareBelow10}% have fewer than ten`),
    `page does not quote the ${shareBelow10}% share below ten partners`,
  );
});

test("the reciprocity row and passage quote the density baseline and the degree-preserving null", () => {
  for (const net of ["stock", "refugees"]) {
    const r = reciprocity[net];
    assert.equal(r.reciprocity, countryFacts[net].reciprocity, `${net}: reciprocity.json disagrees with country_facts.json`);
    assert.equal(r.density, countryFacts[net].density, `${net}: reciprocity.json disagrees with country_facts.json's density`);
  }
  assert.equal(reciprocity.stock.null.n, reciprocity.refugees.null.n);
  assert.ok(hasPhrase(`the directed network and ${reciprocity.stock.null.n} directed shuffles`),
    `the table note should say ${reciprocity.stock.null.n} directed shuffles`);
  const zText = (z) => `${z < 0 ? "−" : "+"}${Math.abs(z).toFixed(1)}`;
  const cell = (r) => `${r.reciprocity.toFixed(2)} (null ${r.null.mean.toFixed(2)} ± ${r.null.sd.toFixed(3)}, z = ${zText(r.null.z)})`;
  assert.ok(
    hasPhrase(`<tr><td>Reciprocity</td><td style="text-align: right">${cell(reciprocity.stock)}</td><td style="text-align: right">${cell(reciprocity.refugees)}</td></tr>`),
    `the table's reciprocity row should read ${cell(reciprocity.stock)} and ${cell(reciprocity.refugees)}`,
  );
  assert.ok(hasPhrase(`Comparing ${reciprocity.stock.reciprocity.toFixed(2)} against ${reciprocity.refugees.reciprocity.toFixed(2)} the way the table does`),
    "the passage should open with the two reciprocities");
  assert.ok(hasPhrase(`<strong>${reciprocity.stock.vs_density.toFixed(1)}×</strong> more than chance`),
    `the passage should give migration ${reciprocity.stock.vs_density.toFixed(1)}x the density baseline`);
  assert.ok(hasPhrase(`displacement <strong>${reciprocity.refugees.vs_density.toFixed(1)}×</strong>`),
    `the passage should give displacement ${reciprocity.refugees.vs_density.toFixed(1)}x the density baseline`);
  // The degree-preserving bar moves each network the way the passage says, from its density.
  const moves = (r) => `${r.null.mean > r.density ? "raises" : "lowers"} chance reciprocity from ${r.density.toFixed(2)} to ${r.null.mean.toFixed(2)}`;
  assert.ok(hasPhrase(`For migration that ${moves(reciprocity.stock)}`), `the passage should say migration's bar ${moves(reciprocity.stock)}`);
  assert.ok(hasPhrase(`For displacement it ${moves(reciprocity.refugees)}`), `the passage should say displacement's bar ${moves(reciprocity.refugees)}`);
  // ...and for the reasons it gives: in- and out-degree go together for migration,
  // while the biggest refugee hosts send refugees to few countries.
  assert.ok(reciprocity.stock.degrees.in_out_spearman > 0.3, "migration's in- and out-degree no longer go together");
  for (const h of reciprocity.refugees.degrees.top_hosts) {
    assert.ok(h.out < h.in / 4, `${h.iso3} hosts refugees from ${h.in} countries but sends them to ${h.out}, not few`);
  }
  // "Both networks clear their bar": the excess over the null, which compares across
  // networks where z does not.
  const excess = (r) => (r.reciprocity - r.null.mean).toFixed(2);
  for (const net of ["stock", "refugees"]) assert.ok(reciprocity[net].null.z > 2, `${net} no longer clears its null`);
  assert.ok(hasPhrase(`Both networks clear their bar, migration by ${excess(reciprocity.stock)} and displacement by ${excess(reciprocity.refugees)}.`),
    `the passage should give the excess over the null: ${excess(reciprocity.stock)} and ${excess(reciprocity.refugees)}`);
  assert.ok(!hasPhrase("no more two-way than a random graph of its size"),
    "the page again claims displacement is no more two-way than a random graph");
});

test("the Venezuela out-migration figures in corridor.js are read from data, not hand-typed", () => {
  assert.ok(!/216,183/.test(corridor), "corridor.js still hand-types Venezuela's 1990 out-migration figure");
  assert.ok(!/8,328,514/.test(corridor), "corridor.js still hand-types Venezuela's 2024 out-migration figure");
  assert.match(corridor, /metrics\("VEN",\s*first\)/, "corridor.js no longer reads Venezuela's out_strength from metrics()");
});

test("the Russia-Ukraine distance in questions.js is read from the corridor data, not hand-typed", () => {
  assert.ok(!/3,950 km/.test(questions), "questions.js still hand-types the Russia-Ukraine distance");
  assert.match(questions, /r\.o === "RUS" && r\.d === "UKR"/, "questions.js no longer looks up the RUS-UKR row from model.rows");
});

// ----------------------------------------- gravity, communities, floors and income from the rerun

const nameOf = (iso3) => corridors.nodes[iso3].name;
const signed = (x) => `${x < 0 ? "−" : "+"}${Math.abs(x).toFixed(2)}`;

test("the gravity coefficient table and its notice match gravity.json", () => {
  const rows = [
    ["Distance between the two", "log distance"],
    ["Destination income per head", "log destination GDP per head"],
    ["Destination population", "log destination population"],
    ["Origin population", "log origin population"],
    ["Origin income per head", "log origin GDP per head"],
    ["Under 1,000 km apart", "under 1,000 km"],
  ];
  for (const [label, key] of rows) {
    const { beta, ci } = gravity.coefficients[key];
    const row = flat.match(new RegExp(`<tr><td>${label}</td>(.*?)</tr>`));
    assert.ok(row, `no coefficient row for ${label}`);
    assert.ok(row[1].includes(signed(beta)), `${label}: page should show ${signed(beta)}`);
    assert.ok(row[1].includes(`${signed(ci[0])} to ${signed(ci[1])}`), `${label}: page should show its interval`);
  }
  const distance = gravity.coefficients["log distance"].beta;
  assert.ok(2 ** distance > 0.4 && 2 ** distance < 0.6, `"doubling the distance roughly halves" fails: ${2 ** distance}`);
  const richer = 2 ** gravity.coefficients["log destination GDP per head"].beta;
  assert.ok(hasPhrase(`twice as rich holds about ${richer.toFixed(1)} times`), `page should say about ${richer.toFixed(1)} times`);
  const withoutProxy = gravity.without_contiguity.coefficients["log distance"];
  assert.ok(hasPhrase(`${signed(distance)} to ${signed(withoutProxy)} and leaves everything else`),
    `page should say dropping the proxy moves distance from ${signed(distance)} to ${signed(withoutProxy)}`);
});

test("the residual table lists gravity.json's twelve largest ratios, row by row", () => {
  const top = gravity.over.slice(0, 12);
  for (const r of top) {
    const row = `<td>${r.origin_name} → ${r.destination_name}</td> <td style="text-align: right">${r.people.toLocaleString("en-US")}</td> ` +
      `<td style="text-align: right">${r.predicted.toLocaleString("en-US")}</td> <td style="text-align: right"><b>×${Math.round(r.ratio)}</b></td>`;
    assert.ok(hasPhrase(row), `residual table should have the row ${r.origin_name} → ${r.destination_name}`);
  }
  const russian = top.filter((r) => r.origin_name === "Russia" || r.destination_name === "Russia").length;
  assert.ok(hasPhrase(`${NUMBER_WORDS[russian][0].toUpperCase()}${NUMBER_WORDS[russian].slice(1)} of the top twelve involve Russia`),
    `the notice should count ${russian} corridors involving Russia`);
  assert.ok(Math.min(...top.map((r) => r.ratio)) >= 30, "a top-twelve corridor no longer beats the model by thirty or more");
  const uncategorised = top.find((r) => r.origin === "PSE");
  assert.ok(uncategorised && hasPhrase(`${uncategorised.origin_name} to ${uncategorised.destination_name} does not sort`),
    "the notice should name the one corridor it cannot categorise, as gravity.json names it");
});

test("the community table names each group's size and first five members from communities.json", () => {
  for (const group of communities.communities) {
    const members = group.names.slice(0, 5).join(", ");
    assert.ok(
      hasPhrase(`<td style="text-align: right">${group.size}</td> <td style="text-align: left">${members}</td>`) ||
        hasPhrase(`<td style="text-align: right">${group.size}</td> <td>${members}</td>`),
      `community table should show ${group.size} countries led by ${members}`,
    );
  }
});

test("the broker-floor table, its callout and the surprise line agree with the threshold sweep", () => {
  const sweep = countryFacts.stock_threshold_sweep;
  const top5 = (row) => row.top_betweenness.slice(0, 5);
  for (const row of sweep) {
    const cells = `<td style="text-align: right">${row.threshold.toLocaleString("en-US")}</td> ` +
      `<td style="text-align: right">${row.arcs.toLocaleString("en-US")}</td> ` +
      `<td style="text-align: left">${top5(row).map(nameOf).join(", ")}</td>`;
    assert.ok(hasPhrase(cells), `floor table row for ${row.threshold} should read ${top5(row).map(nameOf).join(", ")}`);
  }
  const registers = ["AUS", "NOR", "DNK"];
  assert.ok(registers.every((iso) => top5(sweep[0]).includes(iso)), "Australia, Norway and Denmark no longer lead at floor zero");
  const dropsAt = (iso) => sweep.findIndex((row) => row.threshold > 0 && !top5(row).includes(iso));
  assert.equal(dropsAt("NOR"), 1, "Norway no longer vanishes at the first raised floor");
  assert.equal(dropsAt("DNK"), 1, "Denmark no longer vanishes at the first raised floor");
  const longer = NUMBER_WORDS[dropsAt("AUS") - 1];
  const floor = sweep[dropsAt("AUS")].threshold.toLocaleString("en-US");
  assert.ok(hasPhrase(`Raise it a little and Norway and Denmark vanish; Australia holds on ${longer} floors longer, dropping out only at ${floor}.`),
    `the callout should say Australia holds on ${longer} floors longer and drops out at ${floor}`);
  assert.ok(hasPhrase(`two of the three, Norway and Denmark, vanish immediately; Australia holds on ${longer} floors longer`),
    "the surprise line should agree with the callout");
});

test("the refugee-destination income sentence is computed from corridors.json and country_facts.json", () => {
  const gdp = Object.values(corridors.indicators).map((v) => v.gdp).filter((v) => typeof v === "number");
  const mean = gdp.reduce((a, b) => a + b, 0) / gdp.length;
  const top = countryFacts.refugee_rankings.weighted_in_degree.slice(0, 10);
  const below = top.filter((iso) => typeof corridors.indicators[iso]?.gdp === "number" && corridors.indicators[iso].gdp < mean).length;
  assert.ok(
    hasPhrase(`${NUMBER_WORDS[below]} of its ten sit below the unweighted average GDP per head of the ${gdp.length} countries with World Bank figures, $${Math.round(mean).toLocaleString("en-US")}.`),
    `page should say ${below} of ten sit below $${Math.round(mean).toLocaleString("en-US")} over ${gdp.length} countries`,
  );
});
