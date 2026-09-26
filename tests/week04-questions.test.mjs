// Pins the second-round question cards of the week 4 post to their scripts'
// output, so a rerun that moves a number or flips an answer fails here.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (name) => readFileSync(join(ROOT, name), "utf8");
const json = (name) => JSON.parse(read(name));
const html = read("docs/weeks/week04/index.html");
const card = (id) => {
  const start = html.indexOf(`id="${id}"`);
  assert.ok(start > 0, `no card ${id}`);
  const end = html.indexOf('<div class="card', start + 1);
  return html.slice(start, end > 0 ? end : undefined).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
};
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
  says("place-who", `${f.naics54_dominant_metros} of the 40 metros`);
  assert.ok(Math.min(s.naics54_share_tercile.ami, s.placed_share_tercile.ami) > Math.max(s.census_region.ami, s.census_division.ami));
});

test("section 1: the backbone sheds metros, it does not snap", () => {
  const d = json("docs/weeks/week04/data/where_who.json");
  const f = d.finding;
  says("place-break", `The first metro falls off at α = ${f.q2_alpha_drops_below_40.toFixed(3)}`);
  says("place-break", `No single removal cuts off more than two metros`);
  assert.equal(f.q2_max_single_drop, 2);
  says("place-break", `is ${d.breaking_links.length} separate links`);
  says("place-break", `Of the ${f.q2_breaking_links_flagged} links whose removal cuts a metro loose`);
  says("place-break", `lead ${f.q2_breaking_links_led_by_shortlist} (${pct(f.q2_flagged_shortlist_share)})`);
  says("place-break", `(${pct(f.q2_backbone_shortlist_share)}, p = ${f2(f.q2_hypergeom_p)})`);
  const amazon = d.breaking_links.filter((l) => l.top_employer === "Amazon").length;
  says("place-break", `Amazon leads ${["zero", "one", "two", "three", "four", "five"][amazon]}`);
});

test("section 2: outsourcers and direct employers bundle jobs alike", () => {
  const f = json("docs/weeks/week04/data/jobs_split.json").finding;
  assert.match(f.q1_verdict, /^no/);
  says("jobs-split", `the ${count(f.q1_placing_companies)} firms that place 20 or more`);
  says("jobs-split", `(${pct(f.q1_placing_filing_share)} of all filings) and the ${count(f.q1_direct_companies)} others`);
  says("jobs-split", `on the ${f.q1_observed_n} occupations`);
  says("jobs-split", `agree at NMI ${f2(f.q1_observed_nmi)}`);
  says("jobs-split", `numbers of companies agree at ${f2(f.q1_null_count_matched_nmi_mean)}`);
  says("jobs-split", `same filing volumes agree at ${f2(f.q1_null_filings_matched_nmi_mean)}`);
});

test("section 2: link communities find no clear two-cluster job", () => {
  const f = json("docs/weeks/week04/data/jobs_split.json").finding;
  assert.ok(f.q2_D_at_cut >= 0 && f.q2_D_at_cut <= 1, "partition density lies in [0, 1]");
  says("jobs-linkcom", `D = ${f2(f.q2_D_at_cut)}`);
  says("jobs-linkcom", `${f.q2_link_clusters_of_3_or_more} small ones`);
  says("jobs-linkcom", `(Spearman ${f2(f.q2_spearman_communities_vs_degree)})`);
  says("jobs-linkcom", `Only ${f.q2_bridges_in_top15_count} of the ${f.q2_bridges_count} occupations`);
});

test("section 3: switches stay in the group, movers and split clients", () => {
  const d = json("docs/weeks/week04/data/staffing_moves.json");
  const f = d.finding;
  assert.equal(f.q1_answer, "yes");
  const switches = d.q1_pairs.reduce((sum, p) => sum + p.switches_scored, 0);
  says("who-switch", `found ${count(switches)} switches`);
  says("who-switch", `${pct(f.q1_pooled_observed_share, 1)} of switches stay in the group against ${pct(f.q1_pooled_null_mean, 1)}`);
  says("who-movers", `${pct(f.q2_share_move, 1)} of clients move`);
  says("who-movers", `above the ${pct(f.q2_noise_floor_weighted, 1)} between two weighted seeds`);
  says("who-movers", `the ${pct(f.q2_noise_floor_unweighted, 1)} between two unweighted ones`);
  says("who-movers", `${pct(f.q2_movers_2plus_vendor_share, 1)} of movers have two or more vendors, against ${pct(f.q2_all_clients_2plus_vendor_share, 1)}`);
  says("who-overlap", `${count(f.q3_two_community_clients)} clients get a fifth or more`);
  says("who-overlap", `give ${count(Math.round(f.q3_null_mean))} ±`);
  says("who-overlap", `(z = −${Math.round(-f.q3_z)})`);
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
  says("beyond-wage", `Mantel–Haenszel odds ratio is ${f2(f.q3_odds_ratio)} (95% interval ${f2(f.q3_odds_ratio_ci95[0])} to ${f2(f.q3_odds_ratio_ci95[1])})`);
  says("beyond-wage", `${pct(d.q3.crude.placed_low_share)} of placed filings sit at level I or II against ${pct(d.q3.crude.direct_low_share)}`);
  says("beyond-wage", `Within the ${d.q3.strata_kept_20plus_each_side} occupations`);
});
