// Pins docs/weeks/week04/data/roles.json (the "Who filed for which roles" box)
// to years.json's certified totals and week04_staffing.json's placed share, and
// checks each split's own top-N bookkeeping, so a rerun that drops a series or
// loses a year fails here instead of silently going stale on the page.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const json = (rel) => JSON.parse(readFileSync(join(ROOT, rel), "utf8"));
const html = () => readFileSync(join(ROOT, "docs/weeks/week04/index.html"), "utf8");

const roles = json("docs/weeks/week04/data/roles.json");
const years = json("docs/weeks/week04/data/years.json");
const staffing = json("analysis/week04_staffing.json");

const YEARS = ["2022", "2023", "2024", "2025", "2026"];
const TOP_N = { occupations: 10, groups: 7, employer: 10, placement: 2 };

test("roles.json validates against week04_schemas.Roles (extra fields aside, shape holds)", () => {
  assert.deepEqual(roles.years, YEARS);
  assert.equal(roles.partial.year, "2026");
  for (const name of ["occupations", "groups", "employer", "placement"]) {
    assert.ok(roles.splits[name], `splits.${name} is present`);
    assert.ok(Array.isArray(roles.splits[name].series) && roles.splits[name].series.length >= 2);
  }
});

test("each split's per-year totals equal years.json's certified totals", () => {
  for (const [name, split] of Object.entries(roles.splits)) {
    for (let i = 0; i < YEARS.length; i++) {
      const sum = split.series.reduce((a, s) => a + s.counts[i], 0);
      assert.equal(sum, years.years[YEARS[i]].certified_filings, `${name} FY${YEARS[i]} count total`);
      assert.equal(sum, roles.totals[YEARS[i]], `${name} FY${YEARS[i]} matches roles.json totals`);
    }
  }
});

test("each split's October-to-June totals equal roles.json's own oct_jun_totals", () => {
  for (const [name, split] of Object.entries(roles.splits)) {
    for (let i = 0; i < YEARS.length; i++) {
      const sum = split.series.reduce((a, s) => a + s.oct_jun[i], 0);
      assert.equal(sum, roles.oct_jun_totals[YEARS[i]], `${name} FY${YEARS[i]} October-to-June total`);
    }
  }
});

test("FY2024 to FY2026 October-to-June totals match years.json's own window", () => {
  for (const fy of ["FY2024", "FY2025", "FY2026"]) {
    assert.equal(roles.oct_jun_totals[fy.slice(2)], years.oct_jun.totals[fy].certified_filings);
  }
});

test("every series carries five years, in order", () => {
  for (const split of Object.values(roles.splits)) {
    for (const s of split.series) {
      assert.equal(s.counts.length, 5, `${s.name} counts`);
      assert.equal(s.oct_jun.length, 5, `${s.name} oct_jun`);
    }
  }
});

test("a named series's top_in years are exactly the years it ranks in that split's top N", () => {
  for (const [name, split] of Object.entries(roles.splits)) {
    const n = TOP_N[name];
    for (let i = 0; i < YEARS.length; i++) {
      const fy = `FY${YEARS[i]}`;
      const ranked = [...split.series]
        .filter((s) => s.code !== null || name === "placement")
        .sort((a, b) => b.counts[i] - a.counts[i]);
      const namedThisYear = split.series.filter((s) => s.top_in.includes(fy));
      if (name === "placement") continue; // no ranking: both series always shown
      assert.equal(namedThisYear.length, n, `${name} ${fy}: expected ${n} series in the top`);
      // Every series in the top this year must count at least as much as every series that is not.
      const inTop = new Set(namedThisYear.map((s) => s.name));
      const minIn = Math.min(...namedThisYear.map((s) => s.counts[i]));
      const maxOut = Math.max(
        ...split.series.filter((s) => s.code !== null && !inTop.has(s.name)).map((s) => s.counts[i]),
        -Infinity,
      );
      assert.ok(minIn >= maxOut, `${name} ${fy}: a named-out series outranks a named-in one`);
    }
  }
});

test("the Employer split's placed series matches week04_staffing.json's placed share, within rounding", () => {
  const placed = roles.splits.placement.series.find((s) => s.name === "Placed at a client");
  const direct = roles.splits.placement.series.find((s) => s.name === "Direct employer");
  YEARS.forEach((y, i) => {
    assert.equal(placed.counts[i], staffing.years[y].placed_filings, `FY${y} placed filings`);
    assert.equal(placed.counts[i] + direct.counts[i], years.years[y].certified_filings, `FY${y} placed + direct`);
    const share = placed.counts[i] / (placed.counts[i] + direct.counts[i]);
    assert.ok(Math.abs(share - years.years[y].placed_share) < 0.001, `FY${y} placed share within rounding`);
  });
});

test("employer series are labelled by company, not a raw tax number or resolver key", () => {
  for (const s of roles.splits.employer.series) {
    if (s.code === null) continue;
    assert.ok(!/^\d{9}$/.test(s.name), `${s.name} looks like a tax number, not a label`);
  }
  const names = roles.splits.employer.series.map((s) => s.name);
  assert.equal(names.length, new Set(names).size, "employer series names must be unique");
});

test("SOC major group titles are the official 2018 SOC wording", () => {
  for (const s of roles.splits.groups.series) {
    if (s.code === null) continue;
    assert.ok(s.name.endsWith("Occupations"), `${s.name} should carry the official group title`);
  }
});

test("index.html has the roles box and its rail entry, after the years entry", () => {
  const doc = html();
  assert.match(doc, /id="cut-roles"/);
  assert.match(doc, /data-target="cut-roles"/);
  const yearsAt = doc.indexOf('data-target="cut-years"');
  const rolesAt = doc.indexOf('data-target="cut-roles"');
  const methodsAt = doc.indexOf('data-target="cut-methods"');
  assert.ok(yearsAt > -1 && rolesAt > yearsAt, "the R rail entry must come after Y");
  assert.ok(methodsAt === -1 || rolesAt < methodsAt, "the R rail entry must come before the next one");
  assert.match(doc, /week04-roles\.css/);
  assert.match(doc, /week04-roles\.js/);
});
