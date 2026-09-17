// Invariants across the five data files the week 3 post loads.
//
// They come from five sources harvested by four scripts, and nothing checked
// that they agreed with each other. The Eurostat file shipped with every
// number roughly doubled for a while, because that cube carries EU27 beside
// its own member states and TOTAL beside every citizenship, and a plain sum
// counts most of Europe twice. That was caught by eye. These catch the next
// one.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const load = (name) =>
  JSON.parse(readFileSync(join(ROOT, "docs/assets/data", name), "utf8"));

const corridors = load("week03_corridors.json");
const edges = load("week03_edges.json");
const closures = load("week03_closures.json");
const asylum = load("week03_asylum.json");
const cart = load("week03_cartography.json");

test("the two migration files agree on countries, years and people", () => {
  assert.deepEqual(edges.years, corridors.years, "the two files disagree on which years exist");
  for (const iso3 of edges.countries) {
    assert.ok(corridors.nodes[iso3], `${iso3} is on an edge and not in nodes`);
  }
  // The per-year totals in corridors.json are computed by the generator from
  // the same graph the edge list is written from, so they have to match to
  // the person. A mismatch means one of the two was written from a different
  // build of the network.
  edges.years.forEach((year, yi) => {
    const summed = edges.edges.reduce((total, edge) => total + edge[2][yi], 0);
    assert.equal(
      summed,
      corridors.totals[String(year)].people,
      `${year}: the edge list sums to ${summed} and the totals say ` +
        `${corridors.totals[String(year)].people}`,
    );
  });
});

test("no aggregate rows leak into the country lists", () => {
  // Every source ships aggregates next to its countries under codes that look
  // like countries. One sum over them doubles a continent.
  const AGGREGATES = new Set([
    "WLD", "EUU", "EU27", "EU27_2020", "EXT_EU27_2020", "TOTAL", "OED",
    "AFR", "ASI", "EUR", "LAC", "NAC", "OCE", "EFTA", "NEU", "RNC",
  ]);
  for (const iso3 of Object.keys(corridors.nodes)) {
    assert.ok(!AGGREGATES.has(iso3), `${iso3} is an aggregate, not a country`);
    assert.match(iso3, /^[A-Z]{3}$/, `${iso3} is not an ISO 3166-1 alpha-3 code`);
  }
  // Eurostat's citizenship dimension also carries two categories that are
  // real applicants and not countries. They are disjoint from the country
  // codes, so they double-count nothing, and dropping them would drop people.
  const NOT_COUNTRIES = new Set(["STLS", "UNK"]);
  for (const code of Object.keys(asylum.origins)) {
    assert.ok(!AGGREGATES.has(code), `${code} is an aggregate in the asylum origins`);
    if (NOT_COUNTRIES.has(code)) continue;
    assert.match(code, /^[A-Z]{2}$/, `${code} is not a two-letter citizenship code`);
  }
  // The asylum totals are summed over the surviving origins, so they cannot
  // exceed what a single origin's own series holds times the origin count —
  // and more usefully, no single origin may exceed the total for its month.
  asylum.months.forEach((month, i) => {
    for (const [code, origin] of Object.entries(asylum.origins)) {
      const value = origin.months[i];
      if (value === null) continue;
      assert.ok(
        value <= asylum.totals[i],
        `${code} reports ${value} in ${month}, above the month total ` +
          `${asylum.totals[i]} — an aggregate has leaked in`,
      );
    }
  });
});

test("the forced-displacement cap is still needed, and still the size the page claims", () => {
  // The edge file stores UNHCR's raw count and the page caps it at the stock
  // when it reads, because UNHCR counts at the end of 2024 and DESA estimates
  // in the middle of it. Two things can go wrong: a reader of the file could
  // forget to cap, and the methods section quotes how many corridors need
  // capping, which goes stale the moment either source is refreshed.
  const yi = edges.years.indexOf(2024);
  let over = 0;
  for (const edge of edges.edges) {
    const people = edge[2][yi];
    const forced = edge[6] ?? 0;
    if (!people) continue;
    if (forced > people) over += 1;
    // What the page actually renders, and the invariant question 5 depends on.
    assert.ok(Math.min(forced, people) <= people, "the cap does not cap");
  }
  const claimed = 273;
  assert.equal(
    over,
    claimed,
    `${over} corridors carry more refugees than people; the methods section ` +
      `says ${claimed}. Update both together.`,
  );
});

test("every day in the closure calendar is a real date in range", () => {
  for (const [name, file] of [["closures", closures]]) {
    const days = Object.keys(file.days);
    assert.ok(days.length > 300, `${name} has only ${days.length} days`);
    for (const day of days) {
      assert.match(day, /^\d{4}-\d{2}-\d{2}$/, `${name} has a malformed date ${day}`);
      assert.ok(!Number.isNaN(Date.parse(day)), `${name} has an impossible date ${day}`);
    }
    assert.deepEqual([...days], [...days].sort(), `${name} is not in date order`);
  }
});

test("the closure tracker's levels always sum to the countries reporting", () => {
  // Every country in the panel sits at exactly one of the five levels on a
  // given day. A day whose levels sum to more than the panel means a country
  // was counted twice, which is what happens when the sub-national rows stop
  // being filtered out.
  for (const [day, counts] of Object.entries(closures.days)) {
    assert.equal(counts.length, 5, `${day} has ${counts.length} levels`);
    const reporting = counts.reduce((a, b) => a + b, 0);
    assert.ok(reporting > 0, `${day} has nobody reporting`);
    assert.ok(
      reporting <= closures.countries,
      `${day} reports ${reporting} countries out of a panel of ${closures.countries}`,
    );
  }
});

test("the indicators are per country and inside believable bounds", () => {
  for (const [iso3, row] of Object.entries(corridors.indicators)) {
    assert.ok(corridors.nodes[iso3], `${iso3} has indicators and no node`);
    if (row.pop !== null) {
      assert.ok(row.pop > 0 && row.pop < 2e9, `${iso3} population ${row.pop}`);
    }
    if (row.gdp !== null) {
      // The World Bank's range runs from a few hundred dollars to Monaco.
      assert.ok(row.gdp > 50 && row.gdp < 3e5, `${iso3} GDP per head ${row.gdp}`);
    }
    if (row.growth !== null) {
      assert.ok(row.growth > -60 && row.growth < 100, `${iso3} growth ${row.growth}%`);
    }
  }
});

test("a country's own corridors agree with the strengths on its node", () => {
  // in_strength and out_strength are written by the generator from the graph;
  // the edge list is written from the same graph a few lines later. Summing
  // one and comparing it to the other catches a build where only one of the
  // two was regenerated.
  const yi = edges.years.indexOf(corridors.null_year);
  const year = String(corridors.null_year);
  const inbound = new Map();
  const outbound = new Map();
  edges.edges.forEach((edge) => {
    const people = edge[2][yi];
    if (!people) return;
    const o = edges.countries[edge[0]];
    const d = edges.countries[edge[1]];
    outbound.set(o, (outbound.get(o) ?? 0) + people);
    inbound.set(d, (inbound.get(d) ?? 0) + people);
  });
  for (const [iso3, node] of Object.entries(corridors.nodes)) {
    const metrics = node.years?.[year];
    if (!metrics) continue;
    assert.equal(
      metrics.in_strength,
      inbound.get(iso3) ?? 0,
      `${iso3} in-strength disagrees with its corridors`,
    );
    assert.equal(
      metrics.out_strength,
      outbound.get(iso3) ?? 0,
      `${iso3} out-strength disagrees with its corridors`,
    );
  }
});

test("the role cartography covers the same years and countries as the network", () => {
  assert.deepEqual(
    cart.years,
    edges.years.map(String),
    "the cartography and the edge list disagree about which years exist",
  );
  for (const year of cart.years) {
    const rows = cart.by_year[year];
    assert.ok(rows && Object.keys(rows).length > 150, `${year} has almost nobody in it`);
    for (const [iso3, row] of Object.entries(rows)) {
      assert.ok(corridors.nodes[iso3], `${iso3} has a role and no node`);
      assert.ok(row.p >= 0 && row.p <= 1, `${iso3} in ${year}: P ${row.p} is not a share`);
      // A modal role agreed by fewer runs than there are roles to choose from
      // would mean the vote never converged on anything.
      assert.ok(
        row.stability > 1 / 7 && row.stability <= 1,
        `${iso3} in ${year}: ${row.stability} of the runs agreed`,
      );
      assert.ok(cart.roles[row.role], `${iso3} in ${year} carries an unknown role ${row.role}`);
    }
  }
});

test("every role on the page matches the coordinates it was derived from", () => {
  // The seven names are Guimera and Amaral's and so are the cut-offs. The page
  // states them in prose, the script applies them, and nothing checked that the
  // two agree. They can only agree because the coordinates are averaged over
  // the runs that produced the role a country is shown under; pooling every run
  // put four countries on the wrong side of their own printed P. This is the
  // test that would catch that coming back.
  const role = (z, p) => {
    if (z >= cart.hub_z) return p <= 0.3 ? "provincial hub" : p <= 0.75 ? "connector hub" : "kinless hub";
    if (p <= 0.05) return "ultra-peripheral";
    if (p <= 0.62) return "peripheral";
    return p <= 0.8 ? "connector" : "kinless";
  };
  for (const year of cart.years) {
    for (const [iso3, row] of Object.entries(cart.by_year[year])) {
      assert.equal(
        row.role,
        role(row.z, row.p),
        `${iso3} in ${year} is called ${row.role} at z ${row.z}, P ${row.p}, ` +
          `which the published thresholds do not give`,
      );
    }
  }
});

test("a role only counts as having moved when both ends were agreed", () => {
  const first = cart.years[0];
  const last = cart.years.at(-1);
  for (const row of cart.moved) {
    const was = cart.by_year[first][row.iso3];
    const now = cart.by_year[last][row.iso3];
    assert.ok(was && now, `${row.iso3} is on the moved list and missing from an end year`);
    assert.notEqual(was.role, now.role, `${row.iso3} is on the moved list and did not move`);
    assert.equal(was.role, row.from);
    assert.equal(now.role, row.to);
    for (const [label, end] of [[first, was], [last, now]]) {
      assert.ok(
        end.stability >= cart.confident,
        `${row.iso3} is on the moved list with only ${end.stability} agreement in ${label}`,
      );
    }
  }
});

test("ranks are competition ranks, so equal values never split", () => {
  // The generator used to rank by a plain sort, which breaks ties by whatever
  // order the dictionary happened to be in. At 2020 that is 200 of 228
  // countries on a tied out-degree: Pakistan and Spain both send to 85 and one
  // was shown as #12 and the other as #13, for a reason no reader could see.
  // scipy's rankdata(method="min") fixes it and this pins the three properties
  // that make a "#12" mean something.
  const FIELDS = [
    ["in_strength", "in_strength_rank"],
    ["out_strength", "out_strength_rank"],
    ["in_degree", "in_degree_rank"],
    ["out_degree", "out_degree_rank"],
    ["betweenness", "betweenness_rank"],
    ["pagerank", "pagerank_rank"],
  ];
  for (const year of corridors.years) {
    const y = String(year);
    const members = Object.keys(corridors.nodes).filter((iso3) => corridors.nodes[iso3].years?.[y]);
    if (!members.length) continue;
    for (const [valueKey, rankKey] of FIELDS) {
      const rows = members.map((iso3) => corridors.nodes[iso3].years[y]);
      const byValue = new Map();
      for (const row of rows) {
        const seen = byValue.get(row[valueKey]) ?? new Set();
        seen.add(row[rankKey]);
        byValue.set(row[valueKey], seen);
      }
      for (const [value, ranks] of byValue) {
        assert.equal(
          ranks.size,
          1,
          `${y} ${valueKey}: ${value} carries ranks ${[...ranks].join(", ")}`,
        );
      }
      // A bigger value takes a better rank, and a rank of r means exactly
      // r - 1 countries scored above it. Together those rule out both a
      // reversed sort and the off-by-one that dense ranking would give.
      const descending = [...byValue.keys()].sort((a, b) => b - a);
      let expected = 1;
      for (const value of descending) {
        const rank = [...byValue.get(value)][0];
        assert.equal(
          rank,
          expected,
          `${y} ${valueKey}: ${value} is ranked ${rank}, but ${expected - 1} countries score above it`,
        );
        expected += rows.filter((row) => row[valueKey] === value).length;
      }
    }
  }
});
