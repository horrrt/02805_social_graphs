// Pins the section 1 and 3 text and the closing of the week 4 post to the
// analysis output, so a rerun that moves a number fails here instead of leaving
// the prose behind.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (name) => readFileSync(join(ROOT, name), "utf8");
const json = (name) => JSON.parse(read(name));

const html = read("docs/weeks/week04/index.html");
const text = (from, to) => {
  const start = html.indexOf(from);
  return html
    .slice(start, html.indexOf(to, start))
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ");
};
// The section 3 lead, and the first-round staffing text now in the deep-dive section.
const prose = text('id="who"', 'id="who-switch"') + text('class="staffing-prose"', '<figure class="staffing"');
const regions = text('id="place-regions"', 'id="place-longhaul"');
const closing = text('id="closing"', 'id="cut"');
const staffing = json("analysis/week04_staffing.json");
const main = staffing.main;
const fy = staffing.years;
const flows = json("docs/weeks/week04/data/staffing_clients.json").years["2025"].flows;

const count = (n) => n.toLocaleString("en-US");
const pct = (x, digits = 0) => `${(100 * x).toFixed(digits)}%`;
const says = (t) => assert.ok(prose.includes(t), `section 3 should say "${t}"`);
const WORDS = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"];

test("how many workers sit at a client", () => {
  const now = fy["2025"];
  says(`One certified H-1B filing in ${WORDS[now.client_company_one_in]} names a client company`);
  says("A filing is a request to employ someone, not a hire.");
  says(`${count(now.placed_filings)} of the ${count(now.certified_filings)} certified filings`);
  says(`(${pct(now.placed_share, 1)}) mark a client site`);
  says(`the ${pct(now.placeholder_share)} of client entries`);
  says(`the ${count(now.own_company_client_rows)} where a firm names itself`);
  says(`Counted that way, ${count(now.client_company_filings)} filings (${pct(now.client_company_share, 1)}) name a client company`);
  says(`down from ${pct(fy["2022"].client_company_share, 1)} in FY2022`);
  says(`denied ${pct(staffing.uscis.placing.initial_denial_rate, 1)}`);
  says(`against ${pct(staffing.uscis.direct.initial_denial_rate, 1)} for direct employers`);
});

test("clients group weakly, about as much by industry as by vendor", () => {
  const m = main.modularity;
  const iv = main.industry_or_vendor;
  const plain = iv.unweighted;
  // The headline rests on the unweighted split because it beats its null ...
  assert.equal(m.wiring_only.null_runs_at_or_above_real, 0, "unweighted must beat every rewired network");
  says(`about ${main.weighted_vs_unweighted.communities_median_unweighted} groups`);
  says(`(modularity ${m.wiring_only.real.toFixed(2)} against ${m.wiring_only.null.toFixed(2)})`);
  says(`Among the ${count(iv.with_sector_label)} clients`);
  says(`(AMI) of ${plain.ami_community_main_vendor_same_clients.toFixed(2)} and the industry at ${plain.ami_community_industry.toFixed(2)}`);
  assert.ok(Math.abs(plain.ami_community_main_vendor_same_clients - plain.ami_community_industry) < 0.05,
    '"about as much" needs the two AMIs within 0.05');
  assert.ok(Math.abs(plain.ami_gap_over_runs.median) < 0.05, '"about as much" must hold over runs, not one partition');
  assert.ok(plain.p_vendor_same_clients < 0.05 && plain.p_industry < 0.05, "both must beat shuffled labels");
  says(`${iv.vendor_labels} main vendors but only ${iv.industry_labels} industries`);
  // ... and the weighted split, which favours vendors, loses to its own.
  assert.equal(m.weighted_vs_rewired.null_runs_at_or_above_real, 100, "weighted must lose to every rewired network");
  says(`main vendor (AMI ${iv.ami_community_main_vendor_same_clients.toFixed(2)} against ${iv.ami_community_industry.toFixed(2)})`);
  says(`(${m.weighted_vs_rewired.real.toFixed(2)} against ${m.weighted_vs_rewired.null.toFixed(2)})`);
  says(`${pct(iv.share_with_own_main_vendor)} of these clients land in its group`);
  const weights = json("docs/weeks/week04/data/staffing_communities.json").modularity.weights_check;
  assert.ok(weights.single_vendor_clients_with_their_firm > 0.99, "a one-firm client sits in its firm's group");
  assert.ok(weights.real_inside_share < weights.shuffled_inside_share, "real counts must leave more filings between groups");
  assert.ok(weights.filings_to_multi_vendor_clients_share > weights.links_to_multi_vendor_clients_share);
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

test("the groups hold only partly from year to year", () => {
  // Unweighted, like the headline, and against two seeds of the same year on the same clients.
  const across = staffing.stability.map((s) => s.unweighted_nmi);
  const within = staffing.stability.map((s) => s.unweighted_same_year_nmi);
  says(`NMI ${Math.min(...across).toFixed(2)} to ${Math.max(...across).toFixed(2)}`);
  says(`about half the ${Math.min(...within).toFixed(2)} to ${Math.max(...within).toFixed(2)} between two runs of the same year on the same clients`);
  staffing.stability.forEach((s) => {
    const ratio = s.unweighted_nmi / s.unweighted_same_year_nmi;
    assert.ok(ratio > 0.4 && ratio < 0.6, `"about half" but FY${s.from}-FY${s.to} is ${ratio.toFixed(2)}`);
  });
});

test("section 1: communities against the null, runs, FY2024 and Census", () => {
  const n = json("docs/assets/data/week04_place.json").null_model;
  const o = n.other_year;
  const has = (t) => assert.ok(regions.includes(t), `section 1 should say "${t}"`);
  has(`modularity is ${n.Q.toFixed(3)} against ${n.Q_null_mean.toFixed(3)}`);
  has(`(z = ${Math.round(n.z)})`);
  has(`finds it in ${n.modal_runs} of ${n.seeds} runs; the other ${n.seeds - n.modal_runs} find one other split`);
  assert.equal(n.partitions_found, 2, '"one other split" needs exactly two partitions');
  assert.equal(o.fy2025_runs_equal_to_other_year, n.seeds - n.modal_runs, "FY2024's split is FY2025's other one");
  has(`FY${o.year} gives that two-group split in all ${o.runs} runs`);
  assert.equal(o.modal_runs, o.runs);
  assert.equal(o.communities, 2);
  has(`at NMI ${o.nmi_across_years_median.toFixed(2)}, against ${o.nmi_within_fy2025_median.toFixed(2)} between two FY2025 runs`);
  has(`Census regions is ${n.nmi_census_region.toFixed(2)} and with divisions ${n.nmi_census_division.toFixed(2)}`);
  has(`(p = ${n.p_region.toFixed(2)} and ${n.p_division.toFixed(2)})`);
});

test("closing: what surprised us", () => {
  const moves = json("docs/weeks/week04/data/staffing_moves.json").finding;
  const says1 = (t) => assert.ok(closing.includes(t), `closing should say "${t}"`);
  says1(`${pct(moves.q1_pooled_observed_share, 1)} of vendor switches stay inside them, against ${pct(moves.q1_pooled_null_mean, 1)}`);
  const who = json("docs/weeks/week04/data/where_who.json").finding;
  says1(`no single link cuts off more than ${WORDS[who.q2_max_single_drop]} metros`);
});
