// Pins docs/weeks/week04/data/more.json (the "More networks" figures' data)
// to the five analysis files it is copied from, so a rerun that moves a
// number fails here instead of leaving a stale figure on the page.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { block, flatten } from "./week04-html.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const json = (name) => JSON.parse(readFileSync(join(ROOT, name), "utf8"));
const html = readFileSync(join(ROOT, "docs/weeks/week04/index.html"), "utf8");

const more = json("docs/weeks/week04/data/more.json");
const perm = json("analysis/week04_perm.json").years["2025"];
const countries = json("analysis/week04_countries.json");
const oews = json("analysis/week04_oews.json").metro_rates;
const ties = json("analysis/week04_ties.json").strength_vs_degree.clients;
const lottery = json("analysis/week04_lottery.json").lotteries;

test("perm: the median ratio and the six named employers match week04_perm.json", () => {
  assert.equal(more.perm.median_ratio, perm.scored_median_ratio);
  const hi = Object.fromEntries(perm.highest_ratio_among_big_filers.map((e) => [e.employer, e]));
  const lo = Object.fromEntries(perm.lowest_ratio_among_big_filers.map((e) => [e.employer, e]));
  const want = [
    ["Oracle", hi["Oracle America"]],
    ["Uber", hi["Uber Technologies"]],
    ["Salesforce", hi.Salesforce],
    ["Amazon", lo.Amazon],
    ["Cognizant", lo.Cognizant],
    ["Google", lo.Google],
  ];
  assert.equal(more.perm.rows.length, want.length);
  want.forEach(([label, e], i) => {
    assert.equal(more.perm.rows[i].label, label);
    assert.equal(more.perm.rows[i].lca_filings, e.lca_filings);
    assert.equal(more.perm.rows[i].ratio, e.ratio);
  });
});

test("countries: the top eight and both modularity checks match week04_countries.json", () => {
  const top = countries.perm["2023"].descriptive.top.slice(0, 8);
  assert.equal(more.countries.top.length, top.length);
  const titled = (s) => s.toLowerCase().replace(/\b\w/g, (ch) => ch.toUpperCase());
  top.forEach((c, i) => {
    assert.equal(more.countries.top[i].country, titled(c.country));
    assert.equal(more.countries.top[i].share, c.share);
  });
  assert.deepEqual(more.countries.modularity.unweighted, countries.modularity.wiring_only);
  assert.deepEqual(more.countries.modularity.weighted, countries.modularity.weighted_vs_rewired);
  // The deeper-countries notice: "a little more than rewired copies", weighted "less".
  const [u, w] = [countries.modularity.wiring_only, countries.modularity.weighted_vs_rewired];
  const f2 = (x) => x.toFixed(2);
  const page = flatten(block(html, "deeper-countries"));
  assert.ok(page.includes(`Counted once, the country links group a little more than rewired copies (modularity ${f2(u.real)} against ${f2(u.null)}); weighted by shared green cards they group less (${f2(w.real)} against ${f2(w.null)}).`));
  assert.ok(u.real > u.null && u.real - u.null < 0.1 && u.null_runs_at_or_above_real === 0, '"a little more" needs the real value above every rewired copy by under 0.1');
  assert.ok(w.real < w.null, '"weighted ... group less" needs the real value below the rewired mean');
});

test("countries: the groups match world regions only weakly, and more.json carries the numbers", () => {
  const lab = countries.labels;
  assert.deepEqual(more.countries.labels, {
    ami_region: lab.ami_region,
    ami_week3: lab.ami_week3_migrant_communities,
    p_region_shuffled_nmi: lab.p_region,
    p_week3_shuffled_nmi: lab.p_week3,
  });
  const f2 = (x) => x.toFixed(2);
  const m = more.countries.labels;
  const page = flatten(block(html, "deeper-countries"));
  assert.ok(page.includes(`then ask whether those links form regional groups. The groups match world regions only weakly (AMI ${f2(m.ami_region)}).`));
  assert.ok(page.includes(`The groups match world regions (AMI ${f2(m.ami_region)}) and Week 3's migration communities (${f2(m.ami_week3)}) only weakly`));
  // "Only weakly": both AMIs under 0.15.
  assert.ok(Math.max(m.ami_region, m.ami_week3) < 0.15, '"only weakly" needs both AMIs under 0.15');
  // "Barely" is held to the law-firm threshold (AMI under 0.1); the region match misses it.
  assert.ok(m.ami_region >= 0.1 ? !/\bbarely\b/.test(page) : true, '"barely" needs the region AMI under 0.1');
});

test("density: the ten densest metros, New York and the national rate match week04_oews.json", () => {
  const top = oews.top_by_intensity.slice(0, 10);
  assert.equal(more.density.rows.length, top.length);
  top.forEach((m, i) => {
    assert.equal(more.density.rows[i].metro, m.metro);
    assert.equal(more.density.rows[i].rate, m.rate);
  });
  const ny = oews.top_by_count.find((m) => m.metro === "35620");
  assert.equal(more.density.new_york.rate, ny.rate);
  assert.equal(more.density.national_rate, oews.national_rate_per_1000);
});

test("strength: the five heaviest one-to-one client ties match week04_ties.json", () => {
  const hs = ties.high_strength_low_degree.slice(0, 5);
  assert.equal(more.strength.rows.length, hs.length);
  hs.forEach((c, i) => {
    assert.equal(more.strength.rows[i].label, c.label);
    assert.equal(more.strength.rows[i].strength, c.strength);
  });
  assert.equal(more.strength.rows.filter((r) => r.health_care).length, 4, "three named clinics plus Grady Memorial Hospital");
});

test("lottery: registrations per approval, both draws and all three employer kinds, match week04_lottery.json", () => {
  const a23 = lottery["2023"];
  const a24 = lottery["2024"];
  const series = Object.fromEntries(more.lottery.series.map((s) => [s.label, s.values]));
  assert.deepEqual(series["All employers"], [a23.funnel.registrations_per_approval, a24.funnel.registrations_per_approval]);
  assert.deepEqual(series["Placing firms"], [a23.by_kind.placing.registrations_per_approval, a24.by_kind.placing.registrations_per_approval]);
  assert.deepEqual(series["Direct employers"], [a23.by_kind.direct.registrations_per_approval, a24.by_kind.direct.registrations_per_approval]);
});
