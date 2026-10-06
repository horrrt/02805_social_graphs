// Section 3 deep dive: one figure per part owned here -- the first round
// (who-q1 to who-q4), who files the paperwork, the community-stats
// modularity chart, strong/weak ties and the lottery. Plain SVG, drawn once
// the page's own JSON loads; every chart carries a hover <title> and sits
// beside a caption that says how to read it. Colours come from CSS custom
// properties (post.css, week04-vis-staffing.css) through token(), never
// as hex literals here.
import { asset } from "./site.js";
import { node, token, stripChart, miniStrip, fitted, fs, textWidth } from "./week04-strip.js";

const COMMUNITIES_URL = asset("weeks/week04/data/staffing_communities.json");
const DEEP_URL = asset("weeks/week04/data/staffing_deep.json");
const YEARS_URL = asset("weeks/week04/data/years.json");

const whole = new Intl.NumberFormat("en-US");
const num = (v) => whole.format(v);
const pct = (v, digits = 0) => `${(v * 100).toFixed(digits)}%`;
const host = (id) => document.querySelector(`[data-strip="${id}"]`);

function fetchJSON(url) {
  return fetch(url).then((r) => {
    if (!r.ok) throw new Error(`${url} ${r.status}`);
    return r.json();
  });
}

/** Horizontal bars, one value per row, no shared baseline. Rows: {label, sub,
 * value, valueLabel, color, tip}. Drawn at the host's width (see fitted). */
function hbars(rows, opts) {
  return fitted((width) => drawHbars(rows, { ...opts, width }), opts.width ?? 520);
}

function drawHbars(rows, { domain, width = 520, rowH = 34, fmt, aria }) {
  const [d0, d1] = domain;
  const small = fs("small");
  const caption = fs("caption");
  const labelNeed = Math.ceil(Math.max(0, ...rows.map((r) => Math.max(textWidth(r.label, "small", 600), r.sub ? textWidth(r.sub, "caption") : 0)))) + 14;
  // Too narrow for a label column: each label goes on a line above its bar.
  const above = width - labelNeed - 12 < 160;
  const lift = above ? 18 : 0;
  const x0 = above ? 0 : labelNeed;
  const x1 = width - 12;
  const X = (v) => x0 + ((Math.min(Math.max(v, d0), d1) - d0) * (x1 - x0)) / (d1 - d0);
  const top = 8;
  const step = rowH + lift;
  const h = top + rows.length * step + 4;
  const svg = node("svg", { viewBox: `0 0 ${width} ${h}`, width, height: h, role: "img", "aria-label": aria });
  rows.forEach((r, i) => {
    const cy = top + i * step + lift + rowH / 2;
    if (above) {
      svg.append(node("text", { x: 0, y: cy - 13, "font-size": small, fill: token("--ink"), "font-weight": 600 }, r.label));
    } else {
      svg.append(node("text", { x: 0, y: cy - (r.sub ? 3 : -4), "font-size": small, fill: token("--ink"), "font-weight": 600 }, r.label));
      if (r.sub) svg.append(node("text", { x: 0, y: cy + 12, "font-size": caption, fill: token("--ink-mute-text") }, r.sub));
    }
    svg.append(node("line", { x1: x0, y1: cy, x2: x1, y2: cy, stroke: token("--line"), "stroke-width": 1 }));
    const bx = X(r.value);
    const bar = node("rect", {
      x: x0, y: cy - 7, width: Math.max(2, bx - x0), height: 14, rx: 4,
      fill: r.color ? token(r.color) : token("--ink"),
    });
    if (r.tip) bar.append(node("title", {}, r.tip));
    svg.append(bar);
    const label = r.valueLabel ?? fmt(r.value);
    const inside = bx - x0 > textWidth(label, "small", 700) + 12;
    svg.append(node("text", {
      x: inside ? bx - 6 : bx + 6, y: cy + 4.5, "font-size": small, "font-weight": 700,
      fill: inside ? token("--card") : token("--ink"), "text-anchor": inside ? "end" : "start",
    }, label));
  });
  return svg;
}

/** Stacked proportion rows. Groups: [label, shares[]] with a shared list of
 * segment names and tints (CSS token names, ink-first). Drawn at the host's width. */
function stackedRows(groups, names, tints, opts) {
  return fitted((width) => drawStacked(groups, names, tints, { ...opts, width }), opts.width ?? 520);
}

function drawStacked(groups, names, tints, { width = 520, rowH = 42, aria, digits = 0 }) {
  const x0 = 0;
  const x1 = width;
  const top = 12;
  const small = fs("small");
  const caption = fs("caption");
  const h = top + groups.length * rowH + 22;
  const svg = node("svg", { viewBox: `0 0 ${width} ${h}`, width, height: h, role: "img", "aria-label": aria });
  groups.forEach(([label, shares], i) => {
    const cy = top + i * rowH;
    svg.append(node("text", { x: 0, y: cy - 4, "font-size": small, fill: token("--ink"), "font-weight": 600 }, label));
    let x = x0;
    shares.forEach((share, j) => {
      const w = share * (x1 - x0);
      const bar = node("rect", { x, y: cy, width: Math.max(0, w), height: 18, fill: token(tints[j]) });
      bar.append(node("title", {}, `${names[j]}: ${pct(share, 1)}`));
      svg.append(bar);
      const text = pct(share, digits);
      if (w > textWidth(text, "small", 700) + 10) {
        svg.append(node("text", {
          x: x + w / 2, y: cy + 13.5, "font-size": small, "font-weight": 700, "text-anchor": "middle",
          fill: j === 0 ? token("--card") : token("--ink"),
        }, text));
      }
      x += w;
    });
  });
  const ly = top + groups.length * rowH + 6;
  let lx = 0;
  names.forEach((name, j) => {
    svg.append(node("circle", { cx: lx + 5, cy: ly, r: 5, fill: token(tints[j]) }));
    svg.append(node("text", { x: lx + 14, y: ly + 4, "font-size": caption, fill: token("--ink-mute-text") }, name));
    lx += 14 + textWidth(name, "caption") + 16;
  });
  return svg;
}

// One modularity row: the real network against its null, the z-score as a badge.
function modularityRow(label, sub, part, nullWord) {
  return {
    label, sub, real: part.real, realLabel: part.real.toFixed(2), base: [part.null, part.null_sd],
    baseLabel: `${nullWord} ${part.null.toFixed(2)}`, badge: `z = ${Math.round(part.z)}`,
  };
}

function draw(id, svg) {
  const el = host(id);
  if (!el) return;
  el.replaceChildren(svg);
}

// ---- who-q1: how many workers sit at a client -----------------------------

function drawQ1(deep, years) {
  const fy = years.years["2025"];
  draw("who-q1-split", stackedRows(
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
  draw("who-q1-denial", stripChart(
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
  draw("who-q1-funnel-registrations", hbars(
    kinds.map(([label, kind, color]) => ({
      label, value: kind.registrations_per_approval, color,
      tip: `${kind.registrations_per_approval.toFixed(1)} registrations per approved petition`,
    })),
    { domain: [0, 13], fmt: (v) => v.toFixed(1), width: 520, labelW: 160,
      aria: "Registrations per approved petition, March 2023 draw, by kind of employer" },
  ));
  draw("who-q1-funnel-petitions", hbars(
    kinds.map(([label, kind, color]) => ({
      label, value: kind.selected_that_became_petitions, color,
      valueLabel: pct(kind.selected_that_became_petitions), tip: "A drawn ticket became a petition",
    })),
    { domain: [0, 1], fmt: (v) => pct(v), width: 520, labelW: 160,
      aria: "Share of drawn registrations that became a petition, by kind of employer" },
  ));
}

// ---- who-q2: industry or vendor -------------------------------------------

function drawQ2(comm) {
  const m = comm.modularity;
  draw("who-q2-modularity", stripChart(
    [
      modularityRow("Each link counted once", "against rewired networks", m.wiring_only, "rewired"),
      modularityRow("Weighted by filings", "against rewired networks", m.weighted_vs_rewired, "rewired"),
    ],
    { domain: [0.4, 0.8], ticks: [0.4, 0.5, 0.6, 0.7, 0.8], fmt: (v) => v.toFixed(1), width: 520, labelW: 175,
      badgeW: 58, rowH: 56, aria: "Modularity of the firm-client network, real against rewired networks" },
  ));

  const iv = comm.industry_or_vendor;
  const un = iv.unweighted;
  draw("who-q2-ami", stripChart(
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

function drawQ3(deep) {
  const q = deep.q3;
  const oneShare = q.single_vendor_clients / q.clients;
  draw("who-q3-concentration", stackedRows(
    [
      ["Clients", [oneShare, 1 - oneShare]],
      ["Placed filings", [q.single_vendor_filing_share, 1 - q.single_vendor_filing_share]],
    ],
    ["one firm", "two or more firms"], ["--ink", "--w4-band"],
    { aria: "Clients that use a single firm: their share of all clients and of all placed filings" },
  ));
  draw("who-q3-topshare", miniStrip({
    domain: [0, 1], real: q.big_clients_median_top_vendor_share,
    realLabel: `median ${pct(q.big_clients_median_top_vendor_share)}`,
    ref: 0.9, refLabel: `${q.big_clients_over_90pct_one_vendor} of ${num(q.big_clients)} above 90%`,
    aria: "Share of a client's filings that come from its largest vendor, among clients with 20 or more filings",
  }));
}

// ---- who-q4: does it hold from year to year -------------------------------

function drawQ4(comm, deep) {
  draw("who-q4-stability", stripChart(
    comm.stability.map((s) => ({
      label: `${s.from} to ${s.to}`, sub: `${num(s.shared_clients)} shared clients`,
      real: s.unweighted_nmi, realLabel: s.unweighted_nmi.toFixed(2),
      ref: [s.unweighted_same_year_nmi, `same year ${s.unweighted_same_year_nmi.toFixed(2)}`],
    })),
    { domain: [0, 0.6], ticks: [0, 0.2, 0.4, 0.6], fmt: (v) => v.toFixed(1), width: 520, labelW: 155,
      badgeW: 20, rowH: 56, aria: "Agreement of consecutive years' groups, against two runs of the same year" },
  ));

  const j = deep.q4.jan_jun_change;
  draw("who-q4-shift", stripChart(
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
  draw("who-q4-vendor-changed", miniStrip({
    domain: [0.35, 0.55], real: j.main_vendor_changed_share.after, realLabel: pct(j.main_vendor_changed_share.after),
    ref: j.main_vendor_changed_share.before, refLabel: `a year earlier ${pct(j.main_vendor_changed_share.before)}`,
    aria: "Share of clients with 5 or more filings in both years that changed their main vendor",
  }));
}

// ---- who files the paperwork ----------------------------------------------

function drawLawyers(deep) {
  const o = deep.lawyers.outsourcing;
  draw("staffing-lawyers-outsourcing", stripChart(
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
  draw("staffing-lawyers-top5", hbars(
    top.map(([name, filings]) => ({
      label: pretty[name] ?? name, value: filings, valueLabel: num(filings), tip: `${num(filings)} certified filings, 2025`,
    })),
    { domain: [0, top[0][1] * 1.05], fmt: num, width: 520, labelW: 216, aria: "The five law firms that file the most, 2025" },
  ));
}

// ---- with filing counts or without (the only chart this part needs) ------

function drawCommunityStats(comm) {
  const m = comm.modularity;
  draw("staffing-community-modularity", stripChart(
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

function drawTies(deep) {
  const t = deep.ties;
  draw("staffing-ties-overlap", stripChart(
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
  draw("staffing-ties-wage", stackedRows(
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

function drawLottery(deep) {
  const l = deep.lottery;
  draw("staffing-lottery-mates", stripChart(
    [
      { label: "High firms' groups", sub: "share of high firms", real: l.high_mates_share,
        realLabel: pct(l.high_mates_share, 1), ref: [l.high_mates_share_shuffled, `shuffled ${pct(l.high_mates_share_shuffled, 1)}`] },
    ],
    { domain: [0.45, 0.6], ticks: [0.45, 0.5, 0.55, 0.6], fmt: (v) => pct(v, 0), width: 520, labelW: 175,
      badgeW: 20, rowH: 60, aria: "Share of high firms in a high firm's group, real against shuffled labels" },
  ));
  draw("staffing-lottery-ami", stripChart(
    [
      { label: "AMI with the groups", sub: "median of 100 runs", real: l.ami_median, realLabel: l.ami_median.toFixed(3),
        ci: [l.ami_min, l.ami_max] },
    ],
    { domain: [0, 0.1], ticks: [0, 0.025, 0.05, 0.075, 0.1], fmt: (v) => v.toFixed(3), width: 520, labelW: 175,
      badgeW: 20, rowH: 60, zeroLine: 0, aria: "AMI between high and low firms' registrations and the staffing groups" },
  ));
}

Promise.all([fetchJSON(COMMUNITIES_URL), fetchJSON(DEEP_URL), fetchJSON(YEARS_URL)])
  .then(([comm, deep, years]) => {
    drawQ1(deep, years);
    drawQ2(comm);
    drawQ3(deep);
    drawQ4(comm, deep);
    drawLawyers(deep);
    drawCommunityStats(comm);
    drawTies(deep);
    drawLottery(deep);
  })
  .catch((error) => {
    document.querySelectorAll(".w4-vis-error").forEach((el) => {
      el.textContent = `This figure failed to load: ${error.message}`;
      el.hidden = false;
    });
    console.error("week04-vis-staffing:", error);
  });
