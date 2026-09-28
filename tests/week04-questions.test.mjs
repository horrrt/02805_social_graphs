// Pins the second-round question cards of the week 4 post to their scripts'
// output, so a rerun that moves a number or flips an answer fails here.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { block, flatten } from "./week04-html.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (name) => readFileSync(join(ROOT, name), "utf8");
const json = (name) => JSON.parse(read(name));
const html = read("docs/weeks/week04/index.html");
const card = (id) => flatten(block(html, id));
const says = (id, t) => assert.ok(card(id).includes(t), `${id} should say "${t}"`);
const pct = (x, digits = 0) => `${(100 * x).toFixed(digits)}%`;
const f2 = (x) => x.toFixed(2);
const count = (n) => n.toLocaleString("en-US");

test("section 1: cities group by who hires, not by region", () => {
  const f = json("docs/weeks/week04/data/where_who.json").finding;
  const s = f.q1_scores;
  assert.equal(f.q1_answer, "yes, by who hires");
  says("place-who", `IT-services share matches the groups at AMI ${f2(s.naics54_share_tercile.ami)} (p = ${s.naics54_share_tercile.p_shuffle.toFixed(3)})`);
  says("place-who", `placed share at ${f2(s.placed_share_tercile.ami)} (p = ${s.placed_share_tercile.p_shuffle.toFixed(3)})`);
  says("place-who", `Census regions reach ${f2(s.census_region.ami)} (p = ${f2(s.census_region.p_shuffle)})`);
  says("place-who", `divisions ${f2(s.census_division.ami)} (p = ${f2(s.census_division.p_shuffle)})`);
  says("place-who", "Census regions and divisions do no better than chance");
  assert.ok(Math.min(s.census_region.p_shuffle, s.census_division.p_shuffle) >= 0.05, '"no better than chance" needs both p at 0.05 or above');
  says("place-who", `${f.naics54_dominant_metros} of the 40 metros`);
  assert.ok(Math.min(s.naics54_share_tercile.ami, s.placed_share_tercile.ami) > Math.max(s.census_region.ami, s.census_division.ami));
});

test("section 1: the backbone sheds metros, it does not snap", () => {
  const d = json("docs/weeks/week04/data/where_who.json");
  const f = d.finding;
  says("place-break", `The first metro falls off at α = ${f.q2_alpha_drops_below_40.toFixed(3)}`);
  assert.equal(f.q2_max_single_drop, 2);
  says("place-break", `No single removal cuts off more than two metros`);
  const names = d.break.steps.map((s) => s.links.map((l) => `${l.a_name}–${l.b_name}`).join(", "));
  says("place-break", `${names[0]} at α = ${d.break.steps[0].alpha.toFixed(3)}`);
  says("place-break", `${names[1]} at ${d.break.steps[1].alpha.toFixed(3)}`);
  says("place-break", `The fall from ${f.q2_gc_size_alpha_0_1} to ${f.q2_gc_size_alpha_0_05} is ${f.q2_breaking_steps_in_window} separate links`);
  says("place-break", `the largest piece of the map fell from ${f.q2_gc_size_alpha_0_1} metros at α = 0.1 to ${f.q2_gc_size_alpha_0_05} at α = 0.05`);
  assert.equal(d.breaking_links.length, f.q2_breaking_steps_in_window);
  says("place-break", `Of the ${f.q2_breaking_links_flagged} links whose removal cuts a metro loose`);
  says("place-break", `lead ${f.q2_breaking_links_led_by_shortlist} (${pct(f.q2_flagged_shortlist_share)})`);
  says("place-break", `(${pct(f.q2_backbone_shortlist_share)}, p = ${f2(f.q2_hypergeom_p)})`);
  assert.ok(f.q2_hypergeom_p >= 0.05, '"no more of the links than of any others" needs p at 0.05 or above');
  const lead = Object.fromEntries(f.q2_leaders);
  says("place-break", `Amazon (${["zero", "one", "two", "three"][lead.Amazon]})`);
  says("place-break", `Table: ${d.breaking_links.length} links that peel metros off`);
});

test("section 2: outsourcers bundle jobs differently from companies like them", () => {
  const d = json("docs/weeks/week04/data/jobs_split.json");
  const f = d.finding;
  const nulls = json("analysis/week04_jobs_split.json").q1.null;
  assert.equal(f.q1_matched_verdict, "different");
  says("jobs-split", `the ${count(f.q1_placing_companies)} firms that place 20 or more`);
  says("jobs-split", `(${pct(f.q1_placing_filing_share)} of all filings) and the ${count(f.q1_direct_companies)} others`);
  says("jobs-split", `on the ${f.q1_observed_n} occupations`);
  says("jobs-split", `agree at NMI ${f2(f.q1_observed_nmi)}`);
  says("jobs-split", `matched on size agree at ${f2(f.q1_null_matched_nmi_mean)} ± ${f2(f.q1_null_matched_nmi_sd)} (z = −${(-f.q1_matched_z).toFixed(1)})`);
  says("jobs-split", `hold ${pct(nulls.company_count_matched.filing_share_of_group_a_mean, 1)} of filings and agree at ${f2(f.q1_null_count_matched_nmi_mean)} ± ${f2(f.q1_null_count_matched_nmi_sd)}`);
  const share = (list, id) => list.find((o) => o.id === id).share;
  const [p, q] = [d.q1.placing_top_occupations, d.q1.direct_top_occupations];
  says("jobs-split", `software developers are ${pct(share(p, "15-1252"))} of the outsourcing firms' filings and ${pct(share(q, "15-1252"))}`);
  says("jobs-split", `is ${pct(share(p, "15-1299"))} of the outsourcing firms' filings and ${pct(share(q, "15-1299"))}`);
  says("jobs-split", `direct employers file for ${d.q1.only_in_direct.count} occupations`);
  const runs = Object.values(json("analysis/week04_jobs_split.json").q1.null).map((n) => n.runs);
  assert.ok(runs.every((r) => r === runs[0]), "every baseline draws the same number of random splits");
  says("jobs-split", `Whiskers span one standard deviation over ${runs[0]} random splits`);
  says("jobs-split", `the baseline draws ${runs[0]} random groups`);
});

test("section 2: link communities find no clear two-cluster job", () => {
  const f = json("docs/weeks/week04/data/jobs_split.json").finding;
  assert.ok(f.q2_D_at_cut >= 0 && f.q2_D_at_cut <= 1, "partition density lies in [0, 1]");
  says("jobs-linkcom", `D = ${f2(f.q2_D_at_cut)}`);
  says("jobs-linkcom", `${f.q2_link_clusters_of_3_or_more} communities have three links or more, counting it`);
  says("jobs-linkcom", `(Spearman ${f2(f.q2_spearman_communities_vs_degree)})`);
  says("jobs-linkcom", `Only ${f.q2_bridges_in_top15_count} of the ${f.q2_bridges_count} occupations`);
  // The counts, the names and the chart captions, so a rerun that changes who ranks fails here.
  const d = json("docs/weeks/week04/data/jobs_split.json");
  const q2 = d.q2;
  const occupations = json("docs/weeks/week04/data/jobs.json").meta.occupations;
  assert.equal(json("analysis/week04_jobs_split.json").q2.occupations, occupations);
  says("jobs-linkcom", `On the ${count(q2.links)} links between ${count(occupations)} occupations it peaks at D = ${f2(f.q2_D_at_cut)} with one community holding ${pct(q2.largest_link_community_links / q2.links)} of the links; ${f.q2_link_clusters_of_3_or_more} communities have three links or more, counting it.`);
  const plain = (title) => title.toLowerCase().replace(/, all other$/, "").replace(/ and repairers$/, "");
  const list = (names) => (names.length < 3 ? names.join(" and ") : `${names.slice(0, -1).join(", ")}, and ${names.at(-1)}`);
  const top = q2.top15_by_communities_per_link;
  const tied = top.filter((o) => o.links === top[0].links && o.communities === top[0].communities);
  says("jobs-linkcom", `such as ${list(tied.map((o) => plain(o.title)))} (${top[0].communities} communities over ${top[0].links} links${tied.length > 1 ? " each" : ""})`);
  const title = Object.fromEntries(q2.bridges.all_occupations.map((o) => [o.id, o.title]));
  assert.equal(q2.bridges.in_top15.length, f.q2_bridges_in_top15_count);
  says("jobs-linkcom", `flagged as bridges appear in it: ${list(q2.bridges.in_top15.map((id) => plain(title[id])))}.`);
  says("jobs-linkcom", `The ${top.length} jobs with the most communities per link`);
  says("jobs-linkcom", `Rings: the ${["no", "one", "two", "three", "four", "five", "six"][f.q2_bridges_in_top15_count]} jobs section 2's first test flagged as bridges`);
});

test("section 2's deep dive: the cluster-composition captions follow jobs.json", () => {
  const jobs = json("docs/weeks/week04/data/jobs.json");
  const q = jobs.quality;
  const WORDS = ["no", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"];
  const sizes = jobs.clusters.map((c) => Object.values(c.majors).reduce((a, b) => a + b, 0));
  const shown = sizes.reduce((a, b) => a + b, 0);
  const others = q.louvain.clusters_of_two_or_more - jobs.clusters.length;
  // The clusters left off the chart are the smallest possible, two occupations each.
  assert.equal(q.occupations - shown, 2 * others);
  assert.ok(Math.min(...sizes) > 2);
  says("jobs-groups", `Every occupation in the ${WORDS[jobs.clusters.length]} largest clusters, ${count(shown)} in all`);
  says("jobs-groups", `The other ${WORDS[others]} clusters of two or more hold two occupations each`);
  says("jobs-groups", `the official labels shuffled ${q.nmi_shuffled.runs} times`);
});

test("the every-draw chart's caption starts at the first draw", () => {
  const draws = json("docs/weeks/week04/data/more.json").lottery.all_draws;
  says("deeper-lottery", `Every draw since ${draws[0].label.split(" ").at(-1)}`);
});

test("section 3: switches stay in the group, movers and split clients", () => {
  const d = json("docs/weeks/week04/data/staffing_moves.json");
  const f = d.finding;
  assert.equal(f.q1_answer, "yes");
  const switches = d.q1_pairs.reduce((sum, p) => sum + p.switches_scored, 0);
  says("who-switch", `found ${count(switches)} switches`);
  says("who-switch", `${pct(f.q1_pooled_observed_share, 1)} of switches stay in the group against ${pct(f.q1_pooled_null_mean, 1)} ± ${pct(f.q1_pooled_null_sd, 1)} for random vendors (z = ${Math.round(f.q1_pooled_z)})`);
  says("who-switch", `${pct(f.q1_share_new_vendor_already_linked)} of new main vendors`);
  says("who-switch", `${pct(f.q1_pooled_stricter_observed_share, 1)} against ${pct(f.q1_pooled_stricter_null_mean, 1)} ± ${pct(f.q1_pooled_stricter_null_sd, 1)} (z = ${Math.round(f.q1_pooled_stricter_z)}), a lift of ${f2(f.q1_pooled_stricter_lift)} rather than ${f.q1_pooled_lift.toFixed(1)}`);
  says("who-movers", `${pct(f.q2_share_move, 1)} of clients move`);
  says("who-movers", `a median ${pct(f.q2_noise_floor_weighted, 1)} between two weighted seeds and ${pct(f.q2_noise_floor_unweighted, 1)} between two unweighted ones`);
  says("who-movers", `(ranges ${pct(f.q2_noise_floor_weighted_min, 1)} to ${pct(f.q2_noise_floor_weighted_max, 1)} and ${pct(f.q2_noise_floor_unweighted_min, 1)} to ${pct(f.q2_noise_floor_unweighted_max, 1)})`);
  assert.ok(f.q2_share_move > f.q2_noise_floor_unweighted_max, "movers must exceed every seed pair");
  says("who-movers", `${pct(f.q2_movers_2plus_vendor_share, 1)} of movers have two or more vendors, against ${pct(f.q2_all_clients_2plus_vendor_share, 1)}`);
  says("who-overlap", `${count(f.q3_two_community_clients)} clients get a fifth or more`);
  says("who-overlap", `give ${count(Math.round(f.q3_null_mean))} ± ${Math.round(f.q3_null_sd)} split clients (z = −${Math.round(-f.q3_z)})`);
});

test("section 3: the named movers and split clients follow the JSON", () => {
  // Names are not numbers, so the checks above let a rerun on new company keys leave them behind.
  const d = json("docs/weeks/week04/data/staffing_moves.json");
  const poss = (name) => (name.endsWith("s") ? `${name}'` : `${name}'s`);
  const plain = (id) => card(id).replace(/&amp;/g, "&");
  const has = (id, t) => assert.ok(plain(id).includes(t), `${id} should say "${t}"`);
  const mover = (name) => d.q2_top_movers.find((m) => m.client === name);
  assert.equal(d.q2_top_movers[0].client, "Citigroup", '"the largest movers are the largest clients" starts with Citigroup');
  const citi = mover("Citigroup");
  const boa = mover("Bank of America");
  has("who-movers", `Citigroup sits with ${citi.weighted_community_top_firm} when filings count and with ${citi.unweighted_community_top_firm} when they do not`);
  has("who-movers", `Bank of America moves from ${poss(boa.weighted_community_top_firm)} group to ${poss(boa.unweighted_community_top_firm)}`);
  const split = (name) => d.q3_top_clients.find((c) => c.client === name);
  const usaa = split("USAA");
  const stellantis = split("Stellantis");
  has("who-overlap", `USAA gets ${pct(usaa.shares[0])} of its filings from ${poss(usaa.communities[0])} group and ${pct(usaa.shares[1])} from ${poss(usaa.communities[1])}`);
  has("who-overlap", `Stellantis ${pct(stellantis.shares[0])} from ${poss(stellantis.communities[0])} group and ${pct(stellantis.shares[1])} from ${poss(stellantis.communities[1])}`);
});

test("beyond: law firms, green cards and wage levels", () => {
  const d = json("docs/weeks/week04/data/beyond.json");
  const f = d.finding;
  says("beyond-law", `${pct(d.q1.lawfirm_column_coverage, 1)} of certified filings name a law firm`);
  says("beyond-law", `there are ${count(d.q1.distinct_law_firms_after_normalize)}`);
  says("beyond-law", `AMI ${f.q1_ami.toFixed(3)} against`);
  says("beyond-law", `(z = ${Math.round(f.q1_ami_z_vs_rewired)})`);
  says("beyond-law", `${pct(d.q1.single_law_firm_filing_share)} of filings come from`);
  const [lo, hi] = d.q2.placing_firms_20plus_placed.pooled_ci95;
  says("beyond-perm", `file ${f2(f.q2_placing_pooled_ratio)} green cards per H-1B filing (95% interval ${f2(lo)} to ${f2(hi)})`);
  says("beyond-perm", `direct employers ${f2(f.q2_direct_pooled_ratio)}`);
  says("beyond-perm", `(p = ${f2(f.q2_permutation_p)})`);
  assert.equal(f.q2_between_communities_matters, false);
  assert.equal(f.q3_placed_pays_lower_level, true);
  says("beyond-wage", `Mantel–Haenszel odds ratio is ${f2(f.q3_odds_ratio)}`);
  says("beyond-wage", `${pct(d.q3.crude.placed_low_share)} of placed filings sit at level I or II against ${pct(d.q3.crude.direct_low_share)}`);
  const [clo, chi] = f.q3_odds_ratio_cluster_ci95;
  says("beyond-wage", `resampling whole employers: ${f2(clo)} to ${f2(chi)}`);
  const drops = d.q3.odds_ratio_after_dropping_top_placing_firms;
  says("beyond-wage", `rises to ${f2(drops.top5.odds_ratio)}, ${f2(drops.top10.odds_ratio)} and ${f2(drops.top20.odds_ratio)}`);
  says("beyond-wage", `placed filings offer a median ${f2(f.q3_wage_ratio_placed_max)} times`);
  says("beyond-wage", `direct ones ${f2(f.q3_wage_ratio_direct_min)} to ${f2(f.q3_wage_ratio_direct_max)} times`);
  const [dlo, dhi] = f.q2_direct_pooled_ci95;
  says("beyond-perm", `direct employers ${f2(f.q2_direct_pooled_ratio)} (${f2(dlo)} to ${f2(dhi)})`);
  const named = d.q2_named_perm;
  says("beyond-perm", `from ${count(named.Amazon.fy2024.all_statuses_name_match)} and ${count(named.Google.fy2024.all_statuses_name_match)} in 2024 to ${named.Amazon.fy2025.all_statuses_name_match} and ${named.Google.fy2025.all_statuses_name_match} in 2025`);
  says("beyond-wage", `Within the ${d.q3.strata_kept_20plus_each_side} occupations`);
});

test("section 4: without the biggest firms", () => {
  const d = json("docs/weeks/week04/data/footprint.json");
  const at = (part, id) => d[part].variants.find((v) => v.id === id);
  const lead = card("footprint");
  const has = (t) => assert.ok(lead.includes(t), `section 4 should say "${t}"`);
  const [full, short, shortc, top10, top10c] = ["full", "drop_shortlist", "control_shortlist", "drop_top10_filings", "control_top10_filings"].map((id) => at("metros", id));
  const vs = d.finding.metros;
  has(`file ${pct(short.filings_removed_share, 1)} of the filings in the 40 metros, and the ten largest filers of any kind ${pct(top10.filings_removed_share, 1)}`);
  has(`match Census regions at AMI ${f2(top10.ami_region)} (p = ${top10.p_region.toFixed(3)}), against ${f2(full.ami_region)} for the full network and ${f2(top10c.ami_region)} ± ${f2(top10c.ami_region_sd)}`);
  has(`${vs.drop_top10_vs_control.ami_region_vs_control_sd.toFixed(1)} standard deviations away`);
  assert.ok(vs.drop_top10_vs_control.ami_region_vs_control_sd > 2, "the regional turn must stand clear of random cuts");
  has(`(NMI ${f2(short.nmi_vs_full)}, random cuts ${f2(shortc.nmi_vs_full)} ± ${f2(shortc.nmi_vs_full_sd)})`);
  has(`rises only to ${f2(short.ami_region)}, inside the range of random cuts (${f2(shortc.ami_region)} ± ${f2(shortc.ami_region_sd)})`);
  assert.ok(Math.abs(vs.drop_shortlist_vs_control.ami_region_vs_control_sd) < 2 && Math.abs(vs.drop_shortlist_vs_control.nmi_vs_control_sd) < 2);
  const [js, jsc, jt, jtc] = ["drop_shortlist", "control_shortlist", "drop_top10_filings", "control_top10_filings"].map((id) => at("jobs", id));
  const jv = d.finding.jobs;
  has(`hold at NMI ${f2(js.nmi_vs_full)} and ${f2(jt.nmi_vs_full)}`);
  has(`(${f2(jsc.nmi_vs_full)} and ${f2(jtc.nmi_vs_full)}, ${(-jv.drop_shortlist_vs_control.nmi_vs_control_sd).toFixed(1)} and ${(-jv.drop_top10_vs_control.nmi_vs_control_sd).toFixed(1)} standard deviations away)`);
  has(`from ${f2(at("jobs", "full").Q)} to ${f2(jt.Q)}`);
  const minZ = Math.min(...["metros", "jobs"].flatMap((part) => d[part].variants.filter((v) => !v.control).map((v) => v.z)));
  has(`(z = ${Math.floor(minZ)} or more)`);
});

test("section 4: which firm hides the regions", () => {
  const d = json("docs/weeks/week04/data/footprint_rank.json");
  const f = d.finding;
  const part = card("footprint-which");
  const has = (t) => assert.ok(part.includes(t), `the which-firm part should say "${t}"`);
  const firm = (name) => d.single.find((s) => s.firm === name);
  const amazon = firm("Amazon");
  has(`Amazon files ${pct(amazon.filings_removed_share, 1)} of the filings`);
  has(`at AMI ${f2(amazon.ami_region)} (${amazon.ami_vs_control_sd.toFixed(1)} standard deviations above its random cuts), more than the ${f2(f.q_single_firm.all10_ami_region)} without all ten`);
  assert.ok(amazon.ami_region > f.q_single_firm.all10_ami_region, '"more than without all ten" needs Amazon alone above the ten-firm value');
  // Only Amazon pushes the match up beyond its random cuts.
  const up = d.single.filter((s) => s.ami_vs_control_sd >= 2).map((s) => s.firm);
  assert.deepEqual(up, ["Amazon"]);
  for (const name of ["EY", "Meta", "Deloitte", "Apple"]) {
    assert.ok(firm(name).ami_region < 0, `${name} alone must give a negative AMI`);
  }
  has(`ignores regions (AMI −${Math.abs(firm("Deloitte").ami_region).toFixed(3)})`);
  // "Above random cuts at every step from one to twenty."
  const steps = d.sweep.filter((s) => s.k >= 1);
  assert.equal(steps.length, 20);
  assert.ok(steps.every((s) => s.ami_region - s.control_ami_mean > 2 * s.control_ami_sd), "every step must clear 2 sd");
  const at = (k) => d.sweep.find((s) => s.k === k).ami_region;
  for (const k of [17, 18, 19]) assert.ok(Math.abs(at(k) - 0.07) < 0.01, `"about 0.07" at k = ${k}`);
  assert.ok(d.sweep.filter((s) => s.k >= 1 && s.k <= 16).every((s) => s.ami_region > 0.1), "no other dip before k = 17");
  has(`peaks at ${f2(at(20))} without the top 20`);
  assert.equal(Math.max(...d.sweep.map((s) => s.ami_region)), at(20));
  const y = Object.fromEntries(d.fy2024.map((r) => [r.id, r]));
  has(`no regional match (AMI −${Math.abs(y.full.ami_region).toFixed(3)})`);
  has(`the match is ${f2(y.drop_fy2024_top10.ami_region)} (p = ${y.drop_fy2024_top10.p_region.toFixed(3)}), against ${f2(y.drop_fy2024_top10.control_ami_mean).replace("-", "−")} ± ${f2(y.drop_fy2024_top10.control_ami_sd)}`);
});
