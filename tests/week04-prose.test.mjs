// Pins the section 3 text of the week 4 post to the analysis output, so a rerun
// that moves a number fails here instead of leaving the prose behind.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (name) => readFileSync(join(ROOT, name), "utf8");
const json = (name) => JSON.parse(read(name));

const html = read("docs/weeks/week04/index.html");
const start = html.indexOf('id="who"');
const prose = html
  .slice(start, html.indexOf('<figure class="staffing"', start))
  .replace(/<[^>]+>/g, " ")
  .replace(/\s+/g, " ");
const staffing = json("analysis/week04_staffing.json");
const main = staffing.main;
const fy = staffing.years;
const flows = json("docs/weeks/week04/data/staffing_clients.json").years["2025"].flows;

const count = (n) => n.toLocaleString("en-US");
const pct = (x, digits = 0) => `${(100 * x).toFixed(digits)}%`;
const says = (text) => assert.ok(prose.includes(text), `section 3 should say "${text}"`);

test("how many workers sit at a client", () => {
  says(`${count(fy["2025"].placed_filings)} of the ${count(fy["2025"].certified_filings)} certified filings`);
  says(`(${pct(fy["2025"].placed_share, 1)})`);
  says(`down from ${pct(fy["2022"].placed_share, 1)} in FY2022`);
  says(`the ${pct(fy["2025"].placeholder_share)} of client entries`);
  says(`denied ${pct(staffing.uscis.placing.initial_denial_rate, 1)}`);
  says(`against ${pct(staffing.uscis.direct.initial_denial_rate, 1)} for direct employers`);
});

test("clients group by vendor, not industry", () => {
  const iv = main.industry_or_vendor;
  says(`about ${main.modularity.communities_median} groups`);
  says(`Among the ${count(iv.with_sector_label)} clients`);
  says(`NMI ${iv.nmi_community_main_vendor_same_clients.toFixed(2)} against ${iv.nmi_community_industry.toFixed(2)}`);
  assert.ok(iv.p_vendor_same_clients < 0.05 && iv.p_industry < 0.05, "both must beat shuffled labels");
  says(`Infomap agrees (${main.infomap.nmi_community_main_vendor_same_clients.toFixed(2)} against ${main.infomap.nmi_community_industry.toFixed(2)})`);
  says(`vendor match falls to ${iv.unweighted.nmi_community_main_vendor_same_clients.toFixed(2)}`);
});

test("who relies on a single vendor", () => {
  says(`${count(main.single_vendor_clients)} of the ${count(main.clients)} clients use one firm`);
  says(`hold ${pct(main.single_vendor_filing_share)} of placed filings`);
  says(`Of the ${count(main.big_clients)} clients with 20 or more filings, ${main.big_clients_over_90pct_one_vendor} get over 90%`);
  says(`gets ${pct(main.big_clients_median_top_vendor_share)} from its largest`);
  const citi = main.largest_clients[0];
  assert.equal(citi.client, "Citigroup");
  says(`uses ${citi.vendors} firms`);
  assert.equal(citi.top_vendor, "Tata Consultancy Services");
  assert.ok(Math.abs(citi.top_vendor_share - 0.25) < 0.02, `"a quarter" but the share is ${citi.top_vendor_share}`);
  says(`eight largest firms supply only ${pct(flows.from_top_vendors / flows.client_filings)}`);
  assert.equal(flows.vendors.filter((v) => !v.other).length, 8);
});

test("the groups do not hold from year to year", () => {
  const nmis = staffing.stability.map((s) => s.nmi);
  says(`NMI ${Math.min(...nmis).toFixed(2)} to ${Math.max(...nmis).toFixed(2)}`);
  says(`far below the ${main.weighted_vs_unweighted.nmi_between_seeds_weighted.toFixed(2)} between two runs`);
});
