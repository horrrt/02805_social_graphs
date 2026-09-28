// Pins docs/weeks/week04/data/staffing_deep.json (the who-q1 to who-q4,
// law-firm, ties and lottery figures) to the analysis JSON it copies from,
// so a rerun that moves a number fails here instead of silently going stale
// on the page.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const json = (rel) => JSON.parse(readFileSync(join(ROOT, rel), "utf8"));

const page = json("docs/weeks/week04/data/staffing_deep.json");
const staffing = json("analysis/week04_staffing.json");
const lottery = json("analysis/week04_lottery.json").lotteries;
const shift = json("analysis/week04_shift.json");
const lawfirms = json("analysis/week04_lawfirms.json");
const ties = json("analysis/week04_ties.json");

test("who-q1: the March 2023 draw's registrations and become-a-petition rates", () => {
  assert.equal(page.q1.client_company_share, staffing.years["2025"].client_company_share);
  const k = lottery["2024"].by_kind;
  for (const kind of ["direct", "placing", "small"]) {
    assert.equal(page.q1.by_kind[kind].registrations_per_approval, k[kind].registrations_per_approval);
    assert.equal(page.q1.by_kind[kind].selected_that_became_petitions, k[kind].selected_that_became_petitions);
  }
});

test("who-q3: single-vendor clients and the big-client concentration", () => {
  const m = staffing.main;
  assert.equal(page.q3.clients, m.clients);
  assert.equal(page.q3.single_vendor_clients, m.single_vendor_clients);
  assert.equal(page.q3.single_vendor_filing_share, m.single_vendor_filing_share);
  assert.equal(page.q3.big_clients, m.big_clients);
  assert.equal(page.q3.big_clients_over_90pct_one_vendor, m.big_clients_over_90pct_one_vendor);
  assert.equal(page.q3.big_clients_median_top_vendor_share, m.big_clients_median_top_vendor_share);
});

test("who-q4: the FY2026 January-June changes", () => {
  const c = shift.jan_jun.totals_change;
  const j = page.q4.jan_jun_change;
  assert.equal(j.certified_filings_percent.fy24_to_fy25, c.fy24_to_fy25.certified_filings.percent);
  assert.equal(j.certified_filings_percent.fy25_to_fy26, c.fy25_to_fy26.certified_filings.percent);
  assert.equal(j.client_company_filings_percent.fy24_to_fy25, c.fy24_to_fy25.client_company_filings.percent);
  assert.equal(j.client_company_filings_percent.fy25_to_fy26, c.fy25_to_fy26.client_company_filings.percent);
  const [before, after] = shift.jan_jun.client_churn.pairs;
  assert.equal(j.main_vendor_changed_share.before, before.main_vendor_changed_share);
  assert.equal(j.main_vendor_changed_share.after, after.main_vendor_changed_share);
});

test("who files the paperwork: outsourcing law-firm use and the top five firms", () => {
  const o = lawfirms.outsourcing;
  assert.equal(page.lawyers.outsourcing.placing.no_firm_share_pooled, o.placing.no_firm_share_pooled);
  assert.equal(page.lawyers.outsourcing.placing.top5_share_pooled, o.placing.top5_share_pooled);
  assert.equal(page.lawyers.outsourcing.direct.no_firm_share_pooled, o.direct.no_firm_share_pooled);
  assert.equal(page.lawyers.outsourcing.direct.top5_share_pooled, o.direct.top5_share_pooled);
  const top = lawfirms.years["2025"].concentration.top_firms_by_filings.slice(0, 5);
  assert.deepEqual(page.lawyers.top_firms_by_filings, top);
});

test("strong ties, weak ties and pay: overlap correlation and wage levels", () => {
  const w = ties.weak_ties["2025"];
  assert.equal(page.ties.spearman_weight_overlap_rho, w.spearman_weight_overlap.rho);
  assert.equal(page.ties.weight_shuffle_null.mean_rho, w.weight_shuffle_null.mean_rho);
  assert.equal(page.ties.weight_shuffle_null.sd_rho, w.weight_shuffle_null.sd_rho);
  assert.equal(page.ties.defined_links, w.defined_links);
  assert.deepEqual(page.ties.wage_distribution_placing_vs_direct_filings,
    ties.wage.wage_distribution_placing_vs_direct_filings);
});

test("do the firms that register the same workers staff the same clients", () => {
  const ct = lottery["2024"].community_test.unweighted;
  const ct23 = lottery["2023"].community_test.unweighted;
  assert.equal(page.lottery.high_mates_share, ct.high_mates_share);
  assert.equal(page.lottery.high_mates_share_shuffled, ct.high_mates_share_shuffled);
  assert.equal(page.lottery.ami_median, ct.ami_median);
  assert.equal(page.lottery.ami_min, ct.ami_min);
  assert.equal(page.lottery.ami_max, ct.ami_max);
  assert.equal(page.lottery.previous_year.high_mates_share, ct23.high_mates_share);
  assert.equal(page.lottery.previous_year.high_mates_share_shuffled, ct23.high_mates_share_shuffled);
});
