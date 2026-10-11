// Section 3 deep dive: one figure per part owned here, the first round
// (who-q1 to who-q4), who files the paperwork, the community-stats
// modularity chart, strong/weak ties and the lottery. This module builds
// each figure's spec from the page's own JSON; the strip island
// (src/features/week04/strips/) draws them as plain SVG, every chart with a
// hover <title> beside a caption that says how to read it. Colours are CSS
// custom property names (post.css, week04-vis-staffing.css), never hex
// literals here.

/** The files every figure here reads, all three at once. */
export const FILES = ["staffing_communities", "staffing_deep", "years"];

const whole = new Intl.NumberFormat("en-US");
const num = (v) => whole.format(v);
const pct = (v, digits = 0) => `${(v * 100).toFixed(digits)}%`;
// The figures as specs: { kind, ... } for src/features/week04/strips/Strips.tsx.
const strip = (rows, opts) => ({ kind: "strip", rows, opts });
const mini = (spec) => ({ kind: "mini", spec });
const hbars = (rows, opts) => ({ kind: "hbars", rows, opts });
const stacked = (groups, names, tints, opts) => ({ kind: "stacked", groups, names, tints, opts });

// One modularity row: the real network against its null, the z-score as a badge.
function modularityRow(label, sub, part, nullWord) {
  return {
    label, sub, real: part.real, realLabel: part.real.toFixed(2), base: [part.null, part.null_sd],
    baseLabel: `${nullWord} ${part.null.toFixed(2)}`, badge: `z = ${Math.round(part.z)}`,
  };
}

// ---- who-q1: how many workers sit at a client -----------------------------

function drawQ1(out, deep, years) {
  const fy = years.years["2025"];
  out["who-q1-split"] = (stacked(
    [
      ["Placed at a client", [fy.placed_share, 1 - fy.placed_share]],
      ["Name a client company", [deep.q1.client_company_share, 1 - deep.q1.client_company_share]],
    ],
    ["yes", "no"], ["--w4-vis-client", "--w4-band"],
    { aria: `Share of 2025's ${fy.certified_filings.toLocaleString("en-US")} certified filings that place a worker at a client, and that name a client company`, digits: 1 },
  ));

  const series = Object.fromEntries(years.uscis_series.map((e) => [e.year, e]));
  const denialRow = (year, sub, when) => {
    const placing = series[year].placing_initial_denial_rate;
    const direct = series[year].direct_initial_denial_rate;
    return {
      label: String(year), sub, real: placing, color: "--w4-vis-client",
      realLabel: pct(placing, 1),
      realTip: `Placing firms, ${when}: ${pct(placing, 1)}`,
      ref: [direct, `direct ${pct(direct, 1)}`],
    };
  };
  out["who-q1-denial"] = (strip(
    [denialRow(2022, "first-time petitions", "2022"), denialRow(2026, "Oct-Jun", "2026 Oct-Jun")],
    { domain: [0, 0.04], ticks: [0, 0.01, 0.02, 0.03, 0.04], fmt: (v) => pct(v, 0), width: 520, labelW: 150,
      badgeW: 20, rowH: 56,
      aria: "USCIS first-time denial rate, placing firms against direct employers, 2022 and 2026" },
  ));

  const k = deep.q1.by_kind;
  const kinds = [
    ["Direct employers", k.direct, "--w4-accent"],
    ["Placing firms", k.placing, "--w4-vis-client"],
    ["Firms under 20 filings", k.small, "--ink-mute"],
  ];
  out["who-q1-funnel-registrations"] = (hbars(
    kinds.map(([label, kind, color]) => ({
      label, value: kind.registrations_per_approval, color,
      tip: `${kind.registrations_per_approval.toFixed(1)} registrations per approved petition`,
    })),
    { domain: [0, 13], fmt: (v) => v.toFixed(1), width: 520, labelW: 160,
      aria: "Registrations per approved petition, March 2023 draw, by kind of employer" },
  ));
  out["who-q1-funnel-petitions"] = (hbars(
    kinds.map(([label, kind, color]) => ({
      label, value: kind.selected_that_became_petitions, color,
      valueLabel: pct(kind.selected_that_became_petitions), tip: "A drawn ticket became a petition",
    })),
    { domain: [0, 1], fmt: (v) => pct(v), width: 520, labelW: 160,
      aria: "Share of drawn registrations that became a petition, by kind of employer" },
  ));
}

// ---- who-q2: industry or vendor -------------------------------------------

function drawQ2(out, comm) {
  const m = comm.modularity;
  out["who-q2-modularity"] = (strip(
    [
      modularityRow("Each link counted once", "against rewired networks", m.wiring_only, "rewired"),
      modularityRow("Weighted by filings", "against rewired networks", m.weighted_vs_rewired, "rewired"),
    ],
    { domain: [0.4, 0.8], ticks: [0.4, 0.5, 0.6, 0.7, 0.8], fmt: (v) => v.toFixed(1), width: 520, labelW: 175,
      badgeW: 58, rowH: 56, aria: "Modularity of the firm-client network, real against rewired networks" },
  ));

  const iv = comm.industry_or_vendor;
  const un = iv.unweighted;
  out["who-q2-ami"] = (strip(
    [
      { label: "Main vendor", sub: "each link counted once", real: un.ami_community_main_vendor_same_clients,
        realLabel: un.ami_community_main_vendor_same_clients.toFixed(2) },
      { label: "Industry", sub: "each link counted once", real: un.ami_community_industry,
        realLabel: un.ami_community_industry.toFixed(2), hollow: true },
      { label: "Main vendor", sub: "weighted by filings", real: iv.ami_community_main_vendor_same_clients,
        realLabel: iv.ami_community_main_vendor_same_clients.toFixed(2), divider: true },
      { label: "Industry", sub: "weighted by filings", real: iv.ami_community_industry,
        realLabel: iv.ami_community_industry.toFixed(2), hollow: true },
    ],
    { domain: [0, 0.6], ticks: [0, 0.2, 0.4, 0.6], fmt: (v) => v.toFixed(1), width: 520, labelW: 150,
      badgeW: 20, rowH: 50, zeroLine: 0,
      aria: "How well the groups match each client's main vendor and industry, filled dots the main vendor, hollow the industry" },
  ));
}

// ---- who-q3: who relies on a single vendor --------------------------------

function drawQ3(out, deep) {
  const q = deep.q3;
  const oneShare = q.single_vendor_clients / q.clients;
  out["who-q3-concentration"] = (stacked(
    [
      ["Clients", [oneShare, 1 - oneShare]],
      ["Placed filings", [q.single_vendor_filing_share, 1 - q.single_vendor_filing_share]],
    ],
    ["one firm", "two or more firms"], ["--ink", "--w4-band"],
    { aria: "Clients that use a single firm: their share of all clients and of all placed filings" },
  ));
  out["who-q3-topshare"] = (mini({
    domain: [0, 1], real: q.big_clients_median_top_vendor_share,
    realLabel: `median ${pct(q.big_clients_median_top_vendor_share)}`,
    ref: 0.9, refLabel: `${q.big_clients_over_90pct_one_vendor} of ${num(q.big_clients)} above 90%`,
    aria: "Share of a client's filings that come from its largest vendor, among clients with 20 or more filings",
  }));
}

// ---- who-q4: does it hold from year to year -------------------------------

function drawQ4(out, comm, deep) {
  out["who-q4-stability"] = (strip(
    comm.stability.map((s) => ({
      label: `${s.from} to ${s.to}`, sub: `${num(s.shared_clients)} shared clients`,
      real: s.unweighted_nmi, realLabel: s.unweighted_nmi.toFixed(2),
      ref: [s.unweighted_same_year_nmi, `same year ${s.unweighted_same_year_nmi.toFixed(2)}`],
    })),
    { domain: [0, 0.6], ticks: [0, 0.2, 0.4, 0.6], fmt: (v) => v.toFixed(1), width: 520, labelW: 155,
      badgeW: 20, rowH: 56, aria: "Agreement of consecutive years' groups, against two runs of the same year" },
  ));

  const j = deep.q4.jan_jun_change;
  out["who-q4-shift"] = (strip(
    [
      { label: "Certified filings", sub: "January-June change", real: j.certified_filings_percent.fy25_to_fy26,
        realLabel: `${j.certified_filings_percent.fy25_to_fy26.toFixed(1)}%`,
        ref: [j.certified_filings_percent.fy24_to_fy25, `a year earlier ${j.certified_filings_percent.fy24_to_fy25.toFixed(1)}%`] },
      { label: "Client-company filings", sub: "January-June change", real: j.client_company_filings_percent.fy25_to_fy26,
        realLabel: `${j.client_company_filings_percent.fy25_to_fy26.toFixed(1)}%`,
        ref: [j.client_company_filings_percent.fy24_to_fy25, `a year earlier ${j.client_company_filings_percent.fy24_to_fy25.toFixed(1)}%`] },
    ],
    { domain: [-20, 12], ticks: [-20, -10, 0, 10], fmt: (v) => `${v}%`, width: 520, labelW: 170, badgeW: 20,
      rowH: 56, zeroLine: 0, aria: "2026 January to June change against a year earlier, certified and client-company filings" },
  ));
  out["who-q4-vendor-changed"] = (mini({
    domain: [0.35, 0.55], real: j.main_vendor_changed_share.after, realLabel: pct(j.main_vendor_changed_share.after),
    ref: j.main_vendor_changed_share.before, refLabel: `a year earlier ${pct(j.main_vendor_changed_share.before)}`,
    aria: "Share of clients with 5 or more filings in both years that changed their main vendor",
  }));
}

// ---- who files the paperwork ----------------------------------------------

function drawLawyers(out, deep) {
  const o = deep.lawyers.outsourcing;
  out["staffing-lawyers-outsourcing"] = (strip(
    [
      { label: "No outside law firm", sub: "share of filings", real: o.placing.no_firm_share_pooled, color: "--w4-vis-client",
        realLabel: pct(o.placing.no_firm_share_pooled), realTip: "Outsourcing firms",
        ref: [o.direct.no_firm_share_pooled, `direct ${pct(o.direct.no_firm_share_pooled)}`] },
      { label: "To the five largest firms", sub: "share of filings", real: o.placing.top5_share_pooled, color: "--w4-vis-client",
        realLabel: pct(o.placing.top5_share_pooled), realTip: "Outsourcing firms",
        ref: [o.direct.top5_share_pooled, `direct ${pct(o.direct.top5_share_pooled)}`] },
    ],
    { domain: [0, 0.6], ticks: [0, 0.2, 0.4, 0.6], fmt: (v) => pct(v, 0), width: 520, labelW: 175, badgeW: 20,
      rowH: 56, aria: "Law-firm use: outsourcing firms against direct employers, 2025" },
  ));
  const pretty = {
    "Fragomen DEL REY Bernsen and Loewy": "Fragomen",
    "Berry Appleman and Leiden": "Berry Appleman & Leiden",
    "Ogletree Deakins Nash Smoak and Stewart PC": "Ogletree Deakins",
    "EY LAW": "EY Law",
    "Corporate Immigration Partners PC": "Corporate Immigration Partners",
  };
  const top = deep.lawyers.top_firms_by_filings;
  out["staffing-lawyers-top5"] = (hbars(
    top.map(([name, filings]) => ({
      label: pretty[name] ?? name, value: filings, valueLabel: num(filings), tip: `${num(filings)} certified filings, 2025`,
    })),
    { domain: [0, top[0][1] * 1.05], fmt: num, width: 520, labelW: 216, aria: "The five law firms that file the most, 2025" },
  ));
}

// ---- with filing counts or without (the only chart this part needs) ------

function drawCommunityStats(out, comm) {
  const m = comm.modularity;
  out["staffing-community-modularity"] = (strip(
    [
      modularityRow("Each link counted once", "against rewired", m.wiring_only, "rewired"),
      { ...modularityRow("Weighted by filings", "against rewired", m.weighted_vs_rewired, "rewired"), divider: true },
      modularityRow("Weighted by filings", "counts shuffled on real links", m.weights_only, "shuffled"),
    ],
    { domain: [0.4, 0.8], ticks: [0.4, 0.5, 0.6, 0.7, 0.8], fmt: (v) => v.toFixed(1), width: 520, labelW: 190,
      badgeW: 58, rowH: 56, aria: "Modularity of the firm-client network, real against rewired networks, with and without filing counts" },
  ));
}

// ---- strong ties, weak ties and pay ---------------------------------------

function drawTies(out, deep) {
  const t = deep.ties;
  out["staffing-ties-overlap"] = (strip(
    [
      { label: "Filings against overlap", sub: `Spearman, ${num(t.defined_links)} links`,
        real: t.spearman_weight_overlap_rho, realLabel: t.spearman_weight_overlap_rho.toFixed(2),
        base: [t.weight_shuffle_null.mean_rho, t.weight_shuffle_null.sd_rho], baseLabel: "counts shuffled" },
    ],
    { domain: [-0.06, 0.04], ticks: [-0.06, -0.04, -0.02, 0, 0.02, 0.04], fmt: (v) => v.toFixed(2), width: 520,
      labelW: 175, badgeW: 20, rowH: 60, zeroLine: 0,
      aria: "Correlation of a link's filings with its neighbourhood overlap, real against shuffled filing counts" },
  ));
  const wd = t.wage_distribution_placing_vs_direct_filings;
  out["staffing-ties-wage"] = (stacked(
    [
      ["Outsourcing firms", ["1", "2", "3", "4"].map((k) => wd.placing[k])],
      ["Direct employers", ["1", "2", "3", "4"].map((k) => wd.direct[k])],
    ],
    ["Level I", "Level II", "Level III", "Level IV"],
    // An ordered scale, so one ink ramp: the metro-group hues and the direct-
    // employer blue each mean something else on this page.
    ["--w4-level-1", "--w4-level-2", "--w4-level-3", "--w4-level-4"],
    { aria: "Share of each kind of employer's 2025 filings at each prevailing-wage level" },
  ));
}

// ---- do the firms that register the same workers staff the same clients -

function drawLottery(out, deep) {
  const l = deep.lottery;
  out["staffing-lottery-mates"] = (strip(
    [
      { label: "High firms' groups", sub: "share of high firms", real: l.high_mates_share,
        realLabel: pct(l.high_mates_share, 1), ref: [l.high_mates_share_shuffled, `shuffled ${pct(l.high_mates_share_shuffled, 1)}`] },
    ],
    { domain: [0.45, 0.6], ticks: [0.45, 0.5, 0.55, 0.6], fmt: (v) => pct(v, 0), width: 520, labelW: 175,
      badgeW: 20, rowH: 60, aria: "Share of high firms in a high firm's group, real against shuffled labels" },
  ));
  out["staffing-lottery-ami"] = (strip(
    [
      { label: "AMI with the groups", sub: "median of 100 runs", real: l.ami_median, realLabel: l.ami_median.toFixed(3),
        ci: [l.ami_min, l.ami_max] },
    ],
    { domain: [0, 0.1], ticks: [0, 0.025, 0.05, 0.075, 0.1], fmt: (v) => v.toFixed(3), width: 520, labelW: 175,
      badgeW: 20, rowH: 60, zeroLine: 0, aria: "AMI between high and low firms' registrations and the staffing groups" },
  ));
}

/** Every figure this file owns, by its data-strip id, as a spec the page's strip island draws. */
export function visStaffing(comm, deep, years) {
  const out = {};
  drawQ1(out, deep, years);
  drawQ2(out, comm);
  drawQ3(out, deep);
  drawQ4(out, comm, deep);
  drawLawyers(out, deep);
  drawCommunityStats(out, comm);
  drawTies(out, deep);
  drawLottery(out, deep);
  return out;
}
