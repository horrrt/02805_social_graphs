// Figures for the section intros that have no chart of their own, and the
// closing's visual recap. Each one is drawn from the same JSON the section's
// own cards already read, in the page's one chart grammar: dark ink the real
// network, the grey band a random baseline, orange a worker placed at a
// client, blue a direct employer. This module builds each figure's spec; the
// strip island (src/features/week04/strips/) draws them as plain SVG,
// coloured from CSS tokens.

const num = (n) => n.toLocaleString("en-US");
const pct = (x, digits = 0) => `${(x * 100).toFixed(digits)}%`;

const strip = (rows, opts) => ({ kind: "strip", rows, opts });
const mini = (spec) => ({ kind: "mini", spec });
// A stack of labelled rows: a small heading above a mini strip and a caption below.
const stack = (rows) => ({ kind: "miniStack", rows });
const row = (label, spec, note) => ({ label, spec, note });

/** The files each figure reads, by its data-strip id. */
export const INTRO_FILES = {
  "jobs-modularity": ["jobs"],
  "who-modularity": ["staffing_communities"],
  "beyond-summary": ["beyond"],
  "closing-recap": ["place", "jobs", "staffing_moves", "footprint", "beyond"],
  "closing-switches": ["staffing_moves"],
  "closing-backbone": ["where_who"],
};

// ---- section 2 · which jobs go together --------------------------------

function jobsIntro(jobs) {
  const q = jobs.quality.null;
  return strip(
    [
      {
        label: "Modularity",
        sub: `${num(jobs.meta.occupations)} occupations, ${num(jobs.quality.louvain.clusters)} clusters`,
        real: q.real,
        realLabel: q.real.toFixed(2),
        realTip: `The real network: ${q.real.toFixed(2)}`,
        base: [q.null, q.null_sd],
        baseLabel: `rewired ${q.null.toFixed(2)}`,
        baseTip: `Rewired networks: mean ${q.null.toFixed(2)}, sd ${q.null_sd.toFixed(4)}`,
        badge: `z = ${Math.round(q.z)}`,
      },
    ],
    {
      domain: [0, 0.35],
      ticks: [0, 0.1, 0.2, 0.3],
      fmt: (v) => v.toFixed(1),
      labelW: 132,
      badgeW: 66,
      aria: "Modularity of the occupation clusters against rewired networks",
    },
  );
}

// ---- section 3 · who staffs whom ---------------------------------------

function whoIntro(communities) {
  const wo = communities.modularity.wiring_only;
  const iv = communities.industry_or_vendor.unweighted;
  return strip(
    [
      {
        label: "Modularity",
        sub: "each link counted once",
        real: wo.real,
        realLabel: wo.real.toFixed(2),
        base: [wo.null, wo.null_sd],
        baseLabel: `rewired ${wo.null.toFixed(2)}`,
        badge: `z = ${Math.round(wo.z)}`,
      },
      {
        label: "Matches main vendor",
        sub: "AMI, clients with 2+ vendors",
        real: iv.ami_community_main_vendor_same_clients,
        realLabel: iv.ami_community_main_vendor_same_clients.toFixed(2),
        divider: true,
      },
      {
        label: "Matches industry",
        sub: "AMI, same clients",
        real: iv.ami_community_industry,
        realLabel: iv.ami_community_industry.toFixed(2),
      },
    ],
    {
      domain: [0, 0.8],
      ticks: [0, 0.2, 0.4, 0.6, 0.8],
      fmt: (v) => v.toFixed(1),
      labelW: 168,
      badgeW: 60,
      aria: "Modularity against rewired networks, and how well the groups match vendor and industry",
    },
  );
}

/** The name that best splits into two roughly even lines, for a label inside a circle. */
export function twoLines(name) {
  const words = name.split(" ");
  if (words.length < 2) return [name, ""];
  let best = 0;
  let bestDiff = Infinity;
  for (let i = 0; i < words.length - 1; i++) {
    const line1 = words.slice(0, i + 1).join(" ");
    const line2 = words.slice(i + 1).join(" ");
    const diff = Math.abs(line1.length - line2.length);
    if (diff < bestDiff) {
      bestDiff = diff;
      best = i;
    }
  }
  return [words.slice(0, best + 1).join(" "), words.slice(best + 1).join(" ")];
}

/** The client the board opened on, shown whenever the year has it. */
export const EGO_DEFAULT = "Bank of America";

/** The ego board's years: { years, partial(y), yearLabel(y), largest(y), find(y, name), start }. */
export function egoYears(clients) {
  const years = Object.keys(clients.years).sort();
  const partial = (y) => clients.years[y].months < 12;
  const yearLabel = (y) => (partial(y) ? `${y} · Oct–Jun` : y);
  const largest = (y) => clients.years[y].shown.reduce((a, b) => (b.filings > a.filings ? b : a));
  const find = (y, name) => clients.years[y].shown.find((c) => c.name === name);
  const full = years.filter((y) => !partial(y));
  const start = full.length ? full[full.length - 1] : years[years.length - 1];
  return { years, partial, yearLabel, largest, find, start };
}

/** The figure's caption for one client and year. */
export function egoCaption(client, year, partial) {
  const when = partial ? `${year} (October to June only)` : year;
  return `${client.name}'s largest staffing firms by filings in ${when}, ${num(client.vendors)} firms in all; link width is filings placed there. Pick a year or type any client.`;
}

/** Up to six clients of the year whose names hold the query, names that start with it first. */
export function egoMatches(clients, year, query) {
  const q = query.trim().toLowerCase();
  if (!q) return null;
  return clients.years[year].shown
    .filter((c) => c.name.toLowerCase().includes(q))
    .sort((a, b) => b.name.toLowerCase().startsWith(q) - a.name.toLowerCase().startsWith(q) || b.filings - a.filings)
    .slice(0, 6);
}

/** The ego diagram's rows: the client's eight largest firms, then "N other firms". */
export function egoRows(client, firmNames) {
  const rows = client.top.slice(0, 8).map(([i, n]) => [firmNames[i], n]);
  const restFirms = client.vendors - rows.length;
  if (restFirms > 0) rows.push([`${num(restFirms)} other firms`, client.rest]);
  return { rows, restFirms };
}

// ---- section 5 · beyond the three networks -----------------------------

function beyondIntro(beyond) {
  const f = beyond.finding;
  return stack([
    row(
      "5A · Law firms",
      {
        domain: [0, 0.05],
        real: f.q1_ami,
        realLabel: f.q1_ami.toFixed(3),
        base: [f.q1_ami_rewired_mean, f.q1_ami_rewired_sd],
        baseLabel: `rewired ${f.q1_ami_rewired_mean.toFixed(3)}`,
        aria: "AMI of the law-firm groups with the section 3 groups, against rewired networks",
      },
      `AMI against rewired networks · z = ${Math.round(f.q1_ami_z_vs_rewired)}`,
    ),
    row(
      "5B · Green cards",
      {
        domain: [0, 0.25],
        real: f.q2_placing_pooled_ratio,
        realLabel: f.q2_placing_pooled_ratio.toFixed(2),
        ci: f.q2_direct_pooled_ci95,
        aria: "Green cards per H-1B filing for outsourcing firms, against direct employers' 95% interval",
      },
      `Per H-1B filing · bracket: direct employers' 95% interval, ${f.q2_direct_pooled_ratio.toFixed(2)}`,
    ),
    row(
      "5C · Wage levels",
      {
        domain: [0, 6],
        real: f.q3_odds_ratio,
        realLabel: `${f.q3_odds_ratio.toFixed(1)}×`,
        ref: 1,
        refLabel: "1 = same odds",
        ci: f.q3_odds_ratio_cluster_ci95,
        aria: "Odds of a low wage level, placed against direct filings for the same job",
      },
      "Odds of wage level I or II, same job · 95% interval",
    ),
  ]);
}

// ---- closing · what surprised us ----------------------------------------
// Two statements, each with its evidence: vendor switches against a random
// vendor, and the backbone losing metros one or two at a time as α tightens.

function closingSwitches(moves) {
  const f = moves.finding;
  return mini({
    domain: [0, 0.3],
    real: f.q1_pooled_observed_share,
    realLabel: pct(f.q1_pooled_observed_share, 1),
    base: [f.q1_pooled_null_mean, f.q1_pooled_null_sd],
    baseLabel: `random vendor ${pct(f.q1_pooled_null_mean, 1)}`,
    aria: "Vendor switches that stay in the client's group, against a random vendor",
    width: 440,
  });
}

/** The backbone's step chart: metros connected as α tightens, at width W. */
export function backboneLayout(sweep, { lo, hi }, W) {
  const H = 150;
  const L = 34;
  const R = 10;
  const T = 14;
  const B = 30;
  const lx0 = Math.log10(0.004);
  const lx1 = Math.log10(1);
  const X = (a) => L + ((Math.log10(Math.max(a, 0.004)) - lx0) * (W - L - R)) / (lx1 - lx0);
  const Y = (v) => T + ((40 - v) * (H - T - B)) / 40;
  const pts = sweep.map((p) => [Math.max(p.alpha, 0.004), p.gc_size]).sort((a, b) => b[0] - a[0]);
  let d = `M${X(pts[0][0]).toFixed(1)} ${Y(pts[0][1]).toFixed(1)}`;
  let prev = pts[0][1];
  for (const [a, size] of pts.slice(1)) {
    d += ` L${X(a).toFixed(1)} ${Y(prev).toFixed(1)} L${X(a).toFixed(1)} ${Y(size).toFixed(1)}`;
    prev = size;
  }
  return { W, H, L, R, T, B, X, Y, d, lo, hi };
}

// ---- closing · a compact recap of the five sections --------------------

function closingRecap(place, jobs, moves, footprint, beyond) {
  const q = place.null_model;
  const jq = jobs.quality;
  const f = moves.finding;
  const variant = Object.fromEntries(footprint.metros.variants.map((v) => [v.id, v]));
  const drop = variant.drop_top10_filings;
  const control = variant.control_top10_filings;
  const full = variant.full;
  const odds = beyond.q3;
  return stack([
    row(
      "1 · Where the hiring is",
      {
        domain: [0, 0.06],
        real: q.Q,
        realLabel: q.Q.toFixed(3),
        base: [q.Q_null_mean, q.Q_null_std],
        baseLabel: `rewired ${q.Q_null_mean.toFixed(3)}`,
        aria: "Modularity of the metro network against rewired networks",
      },
      `Modularity against rewired networks · z = ${Math.round(q.z)}`,
    ),
    row(
      "2 · Which jobs go together",
      {
        domain: [0, 0.35],
        real: jq.louvain.modularity_mean,
        realLabel: jq.louvain.modularity_mean.toFixed(2),
        base: [jq.null.null, jq.null.null_sd],
        baseLabel: `rewired ${jq.null.null.toFixed(2)}`,
        aria: "Modularity of the occupation network against rewired networks",
      },
      `Modularity against rewired networks · z = ${Math.round(jq.null.z)}`,
    ),
    row(
      "3 · Who staffs whom",
      {
        domain: [0, 0.3],
        real: f.q1_pooled_observed_share,
        realLabel: pct(f.q1_pooled_observed_share),
        base: [f.q1_pooled_null_mean, f.q1_pooled_null_sd],
        baseLabel: `random vendor ${pct(f.q1_pooled_null_mean)}`,
        aria: "Share of vendor switches that stay inside the client's group",
      },
      `Vendor switches that stay in the group · z = ${Math.round(f.q1_pooled_z)}`,
    ),
    row(
      "4 · Where the footprint sits",
      {
        domain: [-0.03, 0.2],
        real: drop.ami_region,
        realLabel: drop.ami_region.toFixed(2),
        base: [control.ami_region, control.ami_region_sd],
        baseLabel: "random cuts",
        ref: full.ami_region,
        refLabel: "all firms",
        aria: "Match with Census regions without the ten largest filers",
      },
      `Match with Census regions, ten largest filers dropped · dashed: all firms, ${full.ami_region.toFixed(2)}`,
    ),
    row(
      "5 · Beyond the three networks",
      {
        domain: [0, 6],
        real: odds.mantel_haenszel_odds_ratio,
        realLabel: `${odds.mantel_haenszel_odds_ratio.toFixed(1)}×`,
        ref: 1,
        refLabel: "1 = same odds",
        ci: odds.odds_ratio_cluster_ci95,
        aria: "Odds of a low wage level, placed against direct filings",
      },
      "Odds of wage level I or II, placed against direct, same job · 95% interval",
    ),
  ]);
}

/** One intro or closing figure's spec, by its data-strip id, from the data of INTRO_FILES[id] in order. */
export function introSpec(id, data) {
  switch (id) {
    case "jobs-modularity":
      return jobsIntro(data[0]);
    case "who-modularity":
      return whoIntro(data[0]);
    case "beyond-summary":
      return beyondIntro(data[0]);
    case "closing-recap":
      return closingRecap(...data);
    case "closing-switches":
      return closingSwitches(data[0]);
    case "closing-backbone":
      return { kind: "backbone", sweep: data[0].backbone_sweep, range: { lo: 0.05, hi: 0.1 } };
    default:
      return null;
  }
}
