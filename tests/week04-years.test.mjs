// Pins public/weeks/week04/data/years.json (the "Five years of filings" box) to
// the analysis JSON it copies from, so a rerun that moves a number fails
// here instead of silently going stale on the page.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const json = (rel) => JSON.parse(readFileSync(join(ROOT, rel), "utf8"));

const years = json("public/weeks/week04/data/years.json");
const staffing = json("analysis/week04_staffing.json");
const shift = json("analysis/week04_shift.json");
const countries = json("analysis/week04_countries.json");
const lottery = json("analysis/week04_lottery.json");

test("FY2025 certified filings match week04_staffing.json", () => {
  assert.equal(years.years["2025"].certified_filings, staffing.years["2025"].certified_filings);
  assert.equal(years.years["2025"].certified_filings, 537796);
  assert.equal(years.finding.fy2025_certified_filings, staffing.years["2025"].certified_filings);
});

test("the placed share falls every year from FY2023", () => {
  const shares = ["2023", "2024", "2025", "2026"].map((y) => years.years[y].placed_share);
  for (let i = 1; i < shares.length; i++) assert.ok(shares[i] < shares[i - 1], `FY${2023 + i} did not fall`);
});

test("the October-to-June fall from FY2025 to FY2026 matches week04_shift.json", () => {
  const change = shift.oct_jun.totals_change.fy25_to_fy26.certified_filings.percent;
  assert.equal(years.oct_jun.certified_filings_change_fy25_fy26_percent, change);
  assert.equal(years.finding.fy25_to_fy26_certified_change_percent, change);
  assert.ok(change < 0, "FY2026 should fall against the same months a year earlier");
  for (const fy of ["FY2024", "FY2025", "FY2026"]) {
    assert.equal(years.oct_jun.totals[fy].certified_filings, shift.oct_jun.totals[fy].certified_filings);
  }
});

test("the FY2022 to FY2023 change rounds to the lead's 14% fall", () => {
  const computed = Math.round(
    100 * (staffing.years["2023"].certified_filings / staffing.years["2022"].certified_filings - 1),
  );
  assert.equal(computed, -14);
  assert.equal(years.finding.fy22_to_fy23_certified_change_percent, computed);
});

test("FY2025 certified filings rose above FY2024, as the lead says", () => {
  assert.ok(staffing.years["2025"].certified_filings > staffing.years["2024"].certified_filings);
});

test("each monthly series covers nine months, October to June, in order", () => {
  for (const fy of ["FY2024", "FY2025", "FY2026"]) {
    const rows = years.monthly[fy];
    assert.equal(rows.length, 9, `${fy} should have nine months`);
    assert.deepEqual(
      rows.map((m) => m.month.slice(5)),
      ["10", "11", "12", "01", "02", "03", "04", "05", "06"],
      `${fy} months out of order`,
    );
    assert.deepEqual(rows, shift.monthly[fy], `${fy} monthly rows do not match week04_shift.json`);
  }
});

test("the October 2025 shutdown numbers in the notice match week04_shift.json", () => {
  assert.equal(years.finding.oct_2025_certified_filings, shift.monthly.FY2026[0].certified_filings);
  assert.equal(years.finding.oct_2024_certified_filings, shift.monthly.FY2025[0].certified_filings);
  assert.equal(shift.monthly.FY2026[0].month, "2025-10");
  assert.equal(shift.monthly.FY2025[0].month, "2024-10");
});

test("uscis_series runs FY2022 to FY2026, matching week04_staffing.json", () => {
  assert.deepEqual(years.uscis_series.map((r) => r.year), [2022, 2023, 2024, 2025, 2026]);
  staffing.uscis_series.forEach((row, i) => {
    assert.equal(years.uscis_series[i].placing_initial_denial_rate, row.placing.initial_denial_rate);
    assert.equal(years.uscis_series[i].direct_initial_denial_rate, row.direct.initial_denial_rate);
  });
});

test("HCL is missing from FY2026's top firms by filings, as the caption says", () => {
  const names = years.years["2026"].top_firms_by_filings.map(([name]) => name);
  assert.ok(!names.includes("HCL"));
});

test("the lottery draws and funnels match week04_countries.json and week04_lottery.json", () => {
  for (const y of ["2022", "2023", "2024"]) {
    assert.equal(years.lottery_draws[y].registrations, countries.lottery[y].registrations);
  }
  for (const y of ["2023", "2024"]) {
    assert.equal(
      years.lottery_funnels[y].registrations_per_approval,
      lottery.lotteries[y].funnel.registrations_per_approval,
    );
  }
});

test("the Five years card's answer is the sentence years.json supports", () => {
  // week04-years.js writes the answer at run time; run its own lines on years.json.
  const src = readFileSync(join(ROOT, "src/scripts/week04-years.js"), "utf8");
  const start = src.indexOf("const oj = data.oct_jun.totals;");
  const end = src.indexOf('"against the same months a year earlier.";', start);
  assert.ok(start >= 0 && end > start, "week04-years.js should build the answer from data.oct_jun.totals");
  const whole = new Intl.NumberFormat("en-US");
  const num = (v) => whole.format(Math.round(v));
  const change = (a, b) => 100 * (b / a - 1);
  const code = src.slice(start, end + '"against the same months a year earlier.";'.length);
  const answer = new Function("data", "num", "change", `const ys = data.years;\n${code}\nreturn answer;`)(years, num, change);

  // The same sentence, built from the finding fields the analysis wrote.
  const f = years.finding;
  const verb = (p) => (p < 0 ? "fell" : "rose");
  const rose25 = years.years["2025"].certified_filings > years.years["2024"].certified_filings;
  const expected =
    `Certified filings ${verb(f.fy22_to_fy23_certified_change_percent)} ${Math.abs(f.fy22_to_fy23_certified_change_percent)}% in 2023, ` +
    `${rose25 ? "rose" : "fell"} to ${num(f.fy2025_certified_filings)} in 2025, and ` +
    `${verb(f.fy25_to_fy26_certified_change_percent)} ${Math.abs(f.fy25_to_fy26_certified_change_percent).toFixed(1)}% in 2026 ` +
    "against the same months a year earlier.";
  assert.equal(answer, expected);
});
