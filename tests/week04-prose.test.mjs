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
// Section 3 keeps one answer per question; its full text sits in the Go deeper box.
const section3 = text('id="who"', '<figure class="staffing"');
const prose = section3 + text('id="staffing-more"', "</details>");
const regions = text('id="place-regions"', 'id="place-longhaul"');
const closing = text('id="closing"', 'id="evidence"');
const lotteryText = text('id="staffing-lottery"', "</details>");
const staffing = json("analysis/week04_staffing.json");
const lottery = json("analysis/week04_lottery.json").lotteries;
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
  // The USCIS sentence quotes the hub's Tableau series, one source for every year.
  const series = Object.fromEntries(staffing.uscis_series.map((e) => [e.year, e]));
  for (const e of staffing.uscis_series) {
    const ratio = e.placing.initial_denial_rate / e.direct.initial_denial_rate;
    assert.ok(ratio >= 1.6 && ratio <= 2.5, `"about twice" fails in FY${e.year}: ${ratio.toFixed(2)}`);
  }
  says("every year from FY2022 on, it denied about twice the share");
  says(`${pct(series[2022].placing.initial_denial_rate, 1)} against ${pct(series[2022].direct.initial_denial_rate, 1)} for direct employers in FY2022`);
  says(`${pct(series[2026].placing.initial_denial_rate, 1)} against ${pct(series[2026].direct.initial_denial_rate, 1)} from October 2025 to June 2026`);
});

test("section 3's short answers match the full numbers", () => {
  const short = (s) => assert.ok(section3.includes(s), `section 3 should say "${s}"`);
  const now = fy["2025"];
  const k = lottery["2024"].by_kind;
  const series = staffing.uscis_series;
  const iv = main.industry_or_vendor.unweighted;
  const m = main.modularity;
  short(`${count(now.client_company_filings)} of the ${count(now.certified_filings)} certified filings (${pct(now.client_company_share, 1)}) name a client company`);
  short(`down from ${pct(fy["2022"].client_company_share, 1)} in FY2022`);
  short(`they sent ${k.placing.registrations_per_approval.toFixed(1)} registrations per approved petition, against ${k.direct.registrations_per_approval.toFixed(1)} for direct employers`);
  assert.ok(lottery["2024"].gap_to_direct.placing.petition_share > 0.5, '"mostly because drawn tickets went unused"');
  assert.ok(series.every((e) => e.placing.initial_denial_rate > 1.6 * e.direct.initial_denial_rate), '"about twice the share"');
  short(`about ${main.weighted_vs_unweighted.communities_median_unweighted} groups`);
  short(`(modularity ${m.wiring_only.real.toFixed(2)} against ${m.wiring_only.null.toFixed(2)})`);
  short(`main vendor (AMI ${iv.ami_community_main_vendor_same_clients.toFixed(2)}) about as well as its industry (${iv.ami_community_industry.toFixed(2)})`);
  short(`${count(main.single_vendor_clients)} of the ${count(main.clients)} clients use one firm`);
  short(`they hold ${pct(main.single_vendor_filing_share)} of placed filings`);
  const citi = main.largest_clients[0];
  short(`${citi.client}, the largest client, uses ${citi.vendors} firms`);
  const nmis = staffing.stability.map((s) => s.unweighted_nmi);
  const same = staffing.stability.map((s) => s.unweighted_same_year_nmi);
  short(`NMI ${Math.min(...nmis).toFixed(2)} to ${Math.max(...nmis).toFixed(2)}, about half the ${Math.min(...same).toFixed(2)} to ${Math.max(...same).toFixed(2)}`);
});

test("the lottery shows the same split one step earlier", () => {
  const l = lottery["2024"];
  const f = l.funnel;
  const k = l.by_kind;
  assert.equal(l.lottery_held, "March 2023");
  says(`every registration from the March 2023 draw`);
  says(`Direct employers sent ${k.direct.registrations_per_approval.toFixed(1)} registrations per approved petition`);
  says(`placing firms ${k.placing.registrations_per_approval.toFixed(1)}`);
  says(`firms with fewer than 20 filings ${k.small.registrations_per_approval.toFixed(1)}`);
  says(`those small firms sent ${pct(k.small.registration_share)} of the ${count(f.registrations)} registrations`);
  says(`When USCIS drew a direct employer's registration, a petition followed ${pct(k.direct.selected_that_became_petitions)} of the time`);
  says(`a placing firm's, ${pct(k.placing.selected_that_became_petitions)}; a small firm's, ${pct(k.small.selected_that_became_petitions)}`);
  const g = l.gap_to_direct.placing;
  assert.ok(g.petition_share > 0.5, '"Most of the gap is drawn tickets nobody used" needs the petition step above half');
  says(`That step carries ${pct(g.petition_share)} of the gap between placing and direct firms, and the draw itself ${pct(g.draw_share)}`);
  says(`${pct(f.multi_registration_share)} of registrations named one`);
  says(`a petition followed ${pct(f.selected_became_petitions_multi)} of the time, against ${pct(f.selected_became_petitions_single)}`);
  // The lottery rows must be keyed like the LCAs, or firms fall into "small".
  assert.ok(l.employer_keys.agreement_after > 0.99, "lottery and LCA employer keys disagree");
  says(`${count(l.clients.petitions_to_client_companies)} of the petitions lead to a client company`);
  const top = l.clients.top_clients[0];
  says(`${top.client} received the most, ${top.petitions} through ${top.vendors} firms`);
});

test("registering the same workers does not mark a cluster of firms", () => {
  const has = (t) => assert.ok(lotteryText.includes(t), `the lottery disclosure should say "${t}"`);
  const now = lottery["2024"].community_test;
  const before = lottery["2023"].community_test;
  has(`We took the ${count(now.firms_tested)} firms in the FY${now.lca_year} staffing network`);
  has(`registered (${pct(now.median_multi_share)})`);
  has(`It is ${pct(now.unweighted.high_mates_share, 1)} high, against ${pct(now.unweighted.high_mates_share_shuffled, 1)} when the labels are shuffled (p = ${now.unweighted.p_mates} over 1,000 shuffles)`);
  has(`AMI with the groups is ${now.unweighted.ami_median.toFixed(3)} over 100 runs`);
  has(`the FY${before.lca_year} network gives ${pct(before.unweighted.high_mates_share, 1)} against ${pct(before.unweighted.high_mates_share_shuffled, 1)}`);
  assert.ok(now.unweighted.ami_median < 0.02 && before.unweighted.ami_median < 0.02, '"spread across" needs AMI near zero');
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
  const where = json("analysis/week04_where.json").longhaul;
  const [leader, links] = where.long_leaders[0];
  const says1 = (t) => assert.ok(closing.includes(t), `closing should say "${t}"`);
  says1(`${leader} alone leads ${links} of the ${where.long_links} backbone links longer than ${count(where.threshold_km)} km`);
  says1(`together lead ${where.long_led_by_shortlist}`);
  assert.ok(links > where.long_led_by_shortlist, "the leader alone must lead more than the five firms");
  says1(`lead only ${pct(where.long_led_by_shortlist / where.long_links)} of the long links`);
});

// The Go deeper boxes: one per extra network, each pinned to its script's JSON.
const box = (id) => text(`id="${id}"`, "</details>");
const inBox = (id) => (s) => assert.ok(box(id).includes(s), `#${id} should say "${s}"`);

test("law-firm backbone", () => {
  const has = inBox("deeper-lawfirms");
  const y = json("analysis/week04_lawfirms.json").years;
  const now = y["2025"];
  const c = now.coverage;
  const b = now.backbones["0.2"];
  has(`In FY2025, ${pct(c.share_with_a_law_firm, 1)} of certified filings name the law firm`);
  has(`five firms file ${pct(c.top_5_share_of_filings_with_a_firm, 1)} of those; Fragomen alone files ${pct(c.top_10_law_firms[0].share_of_filings_with_a_firm, 1)}`);
  assert.ok(c.top_10_law_firms[0].firm.startsWith("Fragomen"));
  has(`(${pct(now.network.employers_with_2plus_firms_share, 1)} of employers did)`);
  assert.equal(b.threshold.t, 2);
  has(`keeps ${b.threshold.links_kept} links, and ${pct(b.threshold.top_5_share_of_links, 1)} of them touch the five`);
  has(`keeps fewer links (${b.disparity.links_kept}) but more firms (${b.disparity.firms_with_a_link} against ${b.threshold.firms_with_a_link})`);
  has(`only ${pct(b.disparity.top_5_share_of_links, 1)} of its links touch the big five: ${b.kept_by_filter_dropped_by_threshold.firms} small firms`);
  const cm = now.communities;
  // The two nulls say different things, and the box says both.
  assert.ok(cm.wiring_only.real > cm.wiring_only.null && cm.Q_mean < cm.null_mean);
  has(`(modularity ${cm.wiring_only.real.toFixed(2)} against ${cm.wiring_only.null.toFixed(2)}), but not once shared employers`);
  has(`weight the links (${cm.Q_mean.toFixed(2)} against ${cm.null_mean.toFixed(2)})`);
  has(`FY2025 (AMI ${now.labels.client_kind.ami.toFixed(2)} against ${now.labels.employer_state.ami.toFixed(2)})`);
  const before = y["2024"].labels;
  has(`FY2024 (${before.client_kind.ami.toFixed(2)} against ${before.employer_state.ami.toFixed(2)})`);
  assert.ok(before.client_kind.ami < before.employer_state.ami, '"the order flips in FY2024"');
});

test("green cards as the strong tie", () => {
  const has = inBox("deeper-perm");
  const y = json("analysis/week04_perm.json").years;
  const now = y["2025"];
  const one = (x) => x.toFixed(1);
  has(`filed ${one(now.scored_median_ratio)} green cards per 100`);
  has(`(Spearman ${now.lca_vs_perm_filings.spearman_rho.toFixed(2)})`);
  const high = Object.fromEntries(now.highest_ratio_among_big_filers.map((r) => [r.employer.split(" ")[0], r]));
  for (const name of ["Oracle", "Uber", "Salesforce"]) {
    // A high ratio must not come from H-1B filings split over tax numbers.
    const r = high[name];
    assert.ok(Math.abs(r.lca_filings - r.lca_filings_by_name) / r.lca_filings_by_name < 0.2, `${name}: keyed and by-name H-1B counts disagree`);
  }
  has(`Oracle filed ${Math.round(high.Oracle.ratio)} green cards per 100 H-1B filings, Uber ${Math.round(high.Uber.ratio)} and Salesforce ${Math.round(high.Salesforce.ratio)}`);
  const low = Object.fromEntries(now.lowest_ratio_among_big_filers.map((r) => [r.employer, r]));
  for (const name of ["Amazon", "Cognizant", "Google"]) {
    // "almost none" must hold by key and by a raw name search.
    assert.ok(low[name].perm_filings_by_name <= 5 && low[name].ratio < 1, `${name} must file almost no green cards`);
    has(`${name} (${count(low[name].lca_filings)}`);
  }
  const g = now.kind_gap;
  has(`(${one(g.placing_pooled_ratio)} against ${one(g.direct_pooled_ratio)} per 100)`);
  has(`gives a gap that large ${pct(g.p_gap)} of the time (p = ${g.p_gap})`);
  const b = y["2024"].kind_gap;
  has(`(${one(b.placing_pooled_ratio)} against ${one(b.direct_pooled_ratio)}, p = ${b.p_gap})`);
  has(`Only ${pct(now.perm_employer_key_matches_lca_share)} of certified green cards`);
});

test("wage levels and the staffing groups", () => {
  const has = inBox("deeper-wages");
  const w = json("analysis/week04_wages.json");
  const y = w.years["2025"];
  has(`${pct(y.placed.shares_of_known.II)} of placed filings against ${pct(y.not_placed.shares_of_known.II)} of the rest`);
  has(`${pct(y.placed.shares_of_known.IV)} reach Level IV against ${pct(y.not_placed.shares_of_known.IV)}`);
  const a = w.octjun.fy2025.all.shares_of_known;
  const b = w.octjun.fy2026.all.shares_of_known;
  has(`Level IV rose from ${pct(a.IV)} of filings with a recorded level in FY2025 to ${pct(b.IV)} in FY2026, and Level I fell from ${pct(a.I)} to ${pct(b.I)}`);
  const c = w.community_test["2025"];
  has(`Among the ${count(c.clients_with_wage_label)} clients`);
  has(`explain ${pct(c.unweighted.eta_squared)} of the variance`);
  has(`against ${pct(c.unweighted.eta_squared_shuffled)} when the group labels`);
  has(`only at AMI ${c.unweighted.ami_median.toFixed(2)}: pay follows the network a little`);
});

test("a network of countries", () => {
  const has = inBox("deeper-countries");
  const c = json("analysis/week04_countries.json");
  const p = c.perm["2023"];
  assert.equal(c.min_cell, 10);
  has(`dropping every count under ${c.min_cell}`);
  has(`drops ${pct(p.cells_dropped_share)} of the cells and ${pct(p.filings_dropped_share)} of FY2023's`);
  const [india, china] = p.descriptive.top;
  assert.equal(india.country, "INDIA");
  assert.equal(china.country, "CHINA");
  has(`India holds ${pct(india.share)} of those filings and China ${pct(china.share)}`);
  has(`India holds ${pct(c.lottery["2023"].descriptive.top[0].share)} in the March 2022 draw and ${pct(c.lottery["2024"].descriptive.top[0].share)} in March 2023`);
  has(`and ${c.network["2023"].country_nodes} countries remain`);
  const m = c.modularity;
  has(`into ${m.communities_median === 3 ? "three" : m.communities_median} groups`);
  assert.ok(m.wiring_only.real > m.wiring_only.null && m.weighted_vs_rewired.real < m.weighted_vs_rewired.null);
  has(`copies (modularity ${m.wiring_only.real.toFixed(2)} against ${m.wiring_only.null.toFixed(2)})`);
  has(`they group less (${m.weighted_vs_rewired.real.toFixed(2)} against ${m.weighted_vs_rewired.null.toFixed(2)})`);
  has(`India keeps ${pct(c.labels.india_share_of_weight_inside_its_community)} of its weight inside it`);
  const india5 = c.labels.largest_communities.find((g) => g.top_countries.includes("India"));
  assert.deepEqual(india5.top_countries.slice(0, 5), ["China", "India", "Canada", "Belarus", "Costa Rica"]);
  has(`world regions (AMI ${c.labels.ami_region.toFixed(2)}) and Week 3's migration communities (${c.labels.ami_week3_migrant_communities.toFixed(2)})`);
  const d = Object.fromEntries(c.diversity.top_employers.map((e) => [e.employer, e]));
  assert.equal(Math.max(...c.diversity.top_employers.map((e) => e.effective_countries)), d.Google.effective_countries);
  has(`${d.Google.effective_countries.toFixed(1)} effective countries with India at ${pct(d.Google.india_share)}, against Amazon's ${d.Amazon.effective_countries.toFixed(1)} at ${pct(d.Amazon.india_share)}`);
});
