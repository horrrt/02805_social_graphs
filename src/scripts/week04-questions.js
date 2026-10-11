// Second-round question cards: section 1's "who hires" and backbone-break
// figures, section 2's outsourcer/direct split and link-community table,
// section 3's switching/movers/overlap figures, the "beyond" section's
// law-firm, green-card and wage-level figures, and section 4's footprint
// charts. Six page JSON files, one fetch each. This module builds the ECharts
// options, table rows and SVG layouts; src/features/week04/questions/ draws
// them. `T` is { fs, family }: the page's type scale.

export const INK = "#0f2340";
export const MUTE = "#7a8fac";
export const MUTE_TEXT = "#59708f";
const LINE = "#e6edf5";
export const ORANGE = "#f2820c";
export const BLUE = "#1f8fd6";
export const GREY = "#9eb1c7";
const whole = new Intl.NumberFormat("en-US");
export const num = (value) => whole.format(value);
export const pct = (value, digits = 1) => `${(value * 100).toFixed(digits)}%`;
export const short = (title) => title.replace(/\s+\([^)]*\)$/, "").replace(/\s+/g, " ");
const esc = (value) => String(value).replace(/[&<>"']/g, (character) => ({
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
}[character]));

const styles = (T) => {
  const base = {
    animationDuration: 360,
    textStyle: { fontFamily: T.family("sans"), fontSize: T.fs("caption") },
    tooltip: {
      confine: true,
      backgroundColor: "rgba(15,35,64,0.94)",
      borderWidth: 0,
      textStyle: { color: "#eaf2fb", fontSize: T.fs("small") },
    },
  };
  const axis = {
    axisLine: { lineStyle: { color: "#c6d4e6" } },
    axisLabel: { color: MUTE_TEXT, fontSize: T.fs("caption") },
    splitLine: { lineStyle: { color: LINE, type: "dashed" } },
  };
  // Row labels on a category y-axis: the names a reader looks up.
  const rowLabel = { color: INK, fontSize: T.fs("small"), fontWeight: 600 };
  // The value printed at a bar's end.
  const valueLabel = { color: INK, fontSize: T.fs("small"), fontWeight: 700 };
  return { base, axis, rowLabel, valueLabel };
};

// A ±sd or CI whisker on a category axis, drawn as a custom series next to a
// plain bar series on the same categories. data is [categoryIndex, lo, hi].
function whiskerSeries(data, color = INK) {
  return {
    type: "custom",
    silent: true,
    tooltip: { show: false },
    renderItem(_params, api) {
      const x = api.value(0);
      const lo = api.coord([x, api.value(1)]);
      const hi = api.coord([x, api.value(2)]);
      const half = 6;
      const style = { stroke: color, fill: undefined, lineWidth: 1.5 };
      return {
        type: "group",
        children: [
          { type: "line", shape: { x1: hi[0] - half, y1: hi[1], x2: hi[0] + half, y2: hi[1] }, style },
          { type: "line", shape: { x1: lo[0], y1: lo[1], x2: hi[0], y2: hi[1] }, style },
          { type: "line", shape: { x1: lo[0] - half, y1: lo[1], x2: lo[0] + half, y2: lo[1] }, style },
        ],
      };
    },
    data,
    z: 5,
  };
}

// The files, and the hosts each fills; a failed file writes
// "<name> data failed to load: <message>" into its hosts.
export const SECTIONS = {
  whereWho: { file: "where_who", name: "Where/who" },
  jobsSplit: { file: "jobs_split", name: "Jobs-split" },
  moves: { file: "staffing_moves", name: "Staffing-moves" },
  beyond: { file: "beyond", name: "Beyond" },
  footprint: { file: "footprint", name: "Footprint" },
  footprintRank: { file: "footprint_rank", name: "Footprint-rank" },
};

// Section 1 · A — cities group by who hires, not by region -----------------

export function whereWhoOption(data, T) {
  const { base, axis, rowLabel, valueLabel } = styles(T);
  const labels = [
    { key: "naics54_share_tercile", label: "IT-services share\n(thirds)", who: true },
    { key: "placed_share_tercile", label: "Placed share\n(thirds)", who: true },
    { key: "census_division", label: "Census division", who: false },
    { key: "census_region", label: "Census region", who: false },
  ];
  const rows = labels.map((l) => ({ ...l, score: data.finding.q1_scores[l.key] }));
  return {
    ...base,
    // The card's right column is narrow: leave the bar labels room to finish.
    grid: { left: 132, right: 140, top: 12, bottom: 30 },
    xAxis: { ...axis, type: "value", min: 0, name: "AMI →", nameLocation: "middle", nameGap: 26 },
    yAxis: {
      ...axis, type: "category", inverse: true, data: rows.map((r) => r.label),
      axisLabel: { ...axis.axisLabel, ...rowLabel, lineHeight: 15 },
    },
    tooltip: {
      ...base.tooltip, trigger: "item",
      formatter: (p) => {
        const r = rows[p.dataIndex];
        return `<b>${esc(r.label.replace("\n", " "))}</b><br>AMI ${r.score.ami.toFixed(3)} · NMI ${r.score.nmi.toFixed(3)}<br>p = ${r.score.p_shuffle.toFixed(3)}`;
      },
    },
    series: [{
      type: "bar", barMaxWidth: 26,
      data: rows.map((r) => ({ value: r.score.ami, itemStyle: { color: r.who ? ORANGE : GREY } })),
      label: {
        show: true, position: "right", ...valueLabel,
        formatter: (p) => `AMI ${rows[p.dataIndex].score.ami.toFixed(2)} · p = ${rows[p.dataIndex].score.p_shuffle.toFixed(3)}`,
      },
    }],
  };
}

// Section 1 · B — where the backbone breaks ---------------------------------

export function whereBreakOption(data, T) {
  const { base, axis } = styles(T);
  const points = [...data.backbone_sweep].sort((a, b) => a.alpha - b.alpha);
  return {
    ...base,
    grid: { left: 48, right: 18, top: 18, bottom: 40 },
    xAxis: {
      ...axis, type: "log", name: "α (disparity filter) →", nameLocation: "middle", nameGap: 28,
      axisLabel: { ...axis.axisLabel, formatter: (v) => (v < 0.01 ? v.toFixed(3) : v.toFixed(2)) },
    },
    yAxis: { ...axis, type: "value", min: 0, max: 40, name: "metros in largest piece", nameTextStyle: { color: MUTE_TEXT } },
    tooltip: {
      ...base.tooltip, trigger: "axis",
      formatter: (p) => `α = ${Number(p[0].axisValueLabel).toFixed(3)}<br>${p[0].data[1]} metros in the largest piece`,
    },
    series: [{
      type: "line", step: "end", showSymbol: false,
      data: points.map((p) => [p.alpha, p.gc_size]),
      lineStyle: { color: BLUE, width: 2 },
      areaStyle: undefined,
      markArea: {
        itemStyle: { color: "rgba(242,130,12,0.12)" },
        data: [[{ xAxis: 0.05 }, { xAxis: 0.1 }]],
      },
    }],
  };
}

/** #where-break-links: [link, α, weight, top employer, its share], with `tag` for a placing firm. */
export function whereBreakRows(data) {
  return [...data.breaking_links].sort((a, b) => b.alpha - a.alpha).map((l) => ({
    link: `${l.a_name}–${l.b_name}`,
    alpha: l.alpha.toFixed(3),
    weight: num(l.weight),
    employer: l.top_employer,
    tag: l.shortlist ? "placing firm" : null,
    share: pct(l.top_share, 0),
  }));
}

// Section 2 · A — do outsourcers and direct employers bundle jobs alike -----

// Plain SVG, coloured from the page's tokens: the observed split in the placed
// colour, the two half-matched baselines in grey, the fair baseline in the
// direct colour. Each baseline bar carries a ±1 sd whisker over its random
// splits; the observed split has none.
const NMI_ROWS = [
  { lines: ["Outsourcing firms against", "direct employers (actual)"], mean: "q1_observed_nmi", fill: "--people", bold: true },
  { lines: ["Random firms, same number", "of companies"], mean: "q1_null_count_matched_nmi_mean", sd: "q1_null_count_matched_nmi_sd", fill: "--ink-mute" },
  { lines: ["Random firms, same share", "of filings"], mean: "q1_null_filings_matched_nmi_mean", sd: "q1_null_filings_matched_nmi_sd", fill: "--w4-band" },
  { lines: ["Random firms, same number", "and size (fair baseline)"], mean: "q1_null_matched_nmi_mean", sd: "q1_null_matched_nmi_sd", fill: "--access" },
];

/** #chart-jobs-split-nmi's rows and axis: { rows, steps, d1 }. */
export function splitNmi(data) {
  const f = data.finding;
  const rows = NMI_ROWS.map((r) => ({
    ...r, label: r.lines.join(" "), value: f[r.mean], sd: r.sd ? f[r.sd] : null,
  }));
  // The axis runs to the next 0.2 past the longest whisker, never past 1.
  const steps = Math.min(5, Math.ceil(Math.max(...rows.map((r) => r.value + (r.sd ?? 0))) / 0.2 - 1e-9));
  return { rows, steps, d1: steps * 0.2 };
}

export function splitMixOption(data, T) {
  const { base, axis, rowLabel } = styles(T);
  const placing = new Map(data.q1.placing_top_occupations.map((o) => [o.id, o]));
  const direct = new Map(data.q1.direct_top_occupations.map((o) => [o.id, o]));
  const ids = new Set([...placing.keys(), ...direct.keys()]);
  const rows = [...ids].map((id) => {
    const p = placing.get(id);
    const d = direct.get(id);
    return {
      title: short((p || d).title),
      combined: (p ? p.filings : 0) + (d ? d.filings : 0),
      placingShare: p ? p.share : 0,
      directShare: d ? d.share : 0,
    };
  }).sort((a, b) => b.combined - a.combined).slice(0, 8).reverse();
  return {
    ...base,
    grid: { left: 244, right: 24, top: 34, bottom: 40 },
    legend: { top: 0, right: 0, textStyle: { color: MUTE_TEXT, fontSize: T.fs("caption") } },
    xAxis: {
      ...axis, type: "value", name: "share of group's filings →", nameLocation: "middle", nameGap: 26, splitNumber: 4,
      axisLabel: { ...axis.axisLabel, formatter: (v) => `${Math.round(v * 100)}%` },
    },
    yAxis: {
      ...axis, type: "category", data: rows.map((r) => r.title),
      axisLabel: { ...axis.axisLabel, ...rowLabel, width: 230, overflow: "truncate" },
    },
    tooltip: {
      ...base.tooltip, trigger: "axis",
      formatter: (p) => `<b>${esc(p[0].name)}</b><br>${p.map((s) => `${esc(s.seriesName)}: ${(s.value * 100).toFixed(1)}%`).join("<br>")}`,
    },
    series: [
      { name: "Outsourcing firms", type: "bar", data: rows.map((r) => r.placingShare), itemStyle: { color: ORANGE }, barMaxWidth: 12 },
      { name: "Direct employers", type: "bar", data: rows.map((r) => r.directShare), itemStyle: { color: BLUE }, barMaxWidth: 12 },
    ],
  };
}

// Section 2 · B — link communities table ------------------------------------

/** #jobs-linkcom-table: { title, tag, links, communities, perLink }. */
export function linkcomRows(data) {
  const flagged = new Set(data.q2.bridges.in_top15);
  return data.q2.top15_by_communities_per_link.map((o) => ({
    title: short(o.title),
    tag: flagged.has(o.id) ? "flagged bridge" : null,
    links: num(o.links),
    communities: num(o.communities),
    perLink: o.communities_per_link.toFixed(2),
  }));
}

// Display names for the scatter, keyed by SOC code; the full title stays in
// each dot's tooltip. A job missing here falls back to its full title.
const LINK_SHORT = {
  "11-9032": "School administrators",
  "11-9031": "Preschool administrators",
  "43-2099": "Communications operators",
  "49-9051": "Power-line installers",
  "25-2057": "Special ed., middle school",
  "29-2061": "Practical nurses",
  "43-4111": "Interviewers",
  "25-2023": "Career teachers, middle school",
  "25-2058": "Special ed., secondary",
  "25-2012": "Kindergarten teachers",
  "25-2021": "Elementary teachers",
  "21-1013": "Family therapists",
};
// The three largest jobs get a label beside the dot; flagged bridges get one
// on a leader line into the empty lower right, stacked from LEADER.y down.
const LINK_LABELLED = ["25-2021", "25-2058", "11-9032"];
const LEADER = { x: 28, y: 5.2, step: 1.8 };
const RATE_GUIDES = [[0.4, "1 community per 2.5 links"], [1 / 3, "1 per 3"], [0.25, "1 per 4"]];

/**
 * #chart-jobs-linkcom-scatter at width W: links against link communities for
 * the jobs with the most communities per link. Pure geometry: grid lines,
 * ticks, rate guides, dots (one per shared position), leader lines and labels.
 */
export function linkScatterLayout(data, W) {
  const top = data.q2.top15_by_communities_per_link;
  const bridges = new Set(data.q2.bridges.in_top15);
  const name = (o) => LINK_SHORT[o.id] ?? short(o.title);
  const H = 336;
  const L = 40;
  const R = 150;
  const Tp = 24;
  const B = 40;
  const xmax = Math.ceil(Math.max(...top.map((o) => o.links)) / 10) * 10;
  const ymax = Math.ceil(Math.max(...top.map((o) => o.communities)) / 5) * 5;
  const X = (v) => L + ((W - L - R) * v) / xmax;
  const Y = (v) => Tp + (H - Tp - B) * (1 - v / ymax);
  const yTicks = [];
  for (let v = 0; v <= ymax; v += 5) yTicks.push({ v, y: Y(v) });
  const xTicks = [];
  for (let v = 0; v <= xmax; v += 10) xTicks.push({ v, x: X(v) });
  const guides = RATE_GUIDES.map(([rate, label], i) => {
    const xe = Math.min(xmax, ymax / rate);
    return {
      x1: X(0), y1: Y(0), x2: X(xe), y2: Y(rate * xe), label,
      lx: i === 0 ? X(xe) - 6 : X(xe) + 4, ly: Y(rate * xe) + 4, anchor: i === 0 ? "end" : "start",
    };
  });
  // Jobs on the same (links, communities) share one dot and one tooltip.
  const groups = new Map();
  top.forEach((o) => {
    const key = `${o.links}|${o.communities}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(o);
  });
  const leaders = top
    .filter((o) => bridges.has(o.id) && !LINK_LABELLED.includes(o.id))
    .sort((a, b) => b.communities - a.communities || a.links - b.links)
    .map((o, i) => {
      const lx = X(LEADER.x);
      const ly = Y(Math.max(LEADER.y - i * LEADER.step, 0.4));
      return { x1: X(o.links) + 6, y1: Y(o.communities), x2: lx - 4, y2: ly - 4, lx, ly, text: `${name(o)} (bridge)` };
    });
  const dots = [...groups.values()].map((members) => {
    const [first] = members;
    const flagged = members.some((o) => bridges.has(o.id));
    const who = members.map((o) => `${o.title}${bridges.has(o.id) ? " (flagged bridge)" : ""}`).join("\n");
    return {
      cx: X(first.links), cy: Y(first.communities), flagged,
      tip: `${who}\n${first.communities} communities over ${first.links} links (${first.communities_per_link.toFixed(2)} per link)`,
    };
  });
  const labels = top.filter((o) => LINK_LABELLED.includes(o.id)).map((o) => ({
    x: X(o.links) + 8, y: Y(o.communities) + 4, bold: bridges.has(o.id),
    text: `${name(o)}${bridges.has(o.id) ? " (bridge)" : ""}`,
  }));
  return { W, H, L, R, Tp, B, count: top.length, yTicks, xTicks, guides, leaders, dots, labels };
}

// Section 3 · A — does a switch stay in the client's group ------------------

export function whoSwitchOption(data, T) {
  const { base, axis } = styles(T);
  const f = data.finding;
  const groups = [
    ...data.q1_pairs.map((p) => ({
      label: `${p.from}→${p.to}`, observed: p.observed_share_same_community, mean: p.null.mean, sd: p.null.sd,
    })),
    { label: "Pooled", observed: f.q1_pooled_observed_share, mean: f.q1_pooled_null_mean, sd: f.q1_pooled_null_sd },
  ];
  const cats = [];
  const values = [];
  const whiskers = [];
  groups.forEach((g) => {
    const i0 = cats.length;
    cats.push(`${g.label}\nobserved`, `${g.label}\nrandom`);
    values.push(
      { value: g.observed, itemStyle: { color: ORANGE } },
      { value: g.mean, itemStyle: { color: GREY } },
    );
    whiskers.push([i0 + 1, g.mean - g.sd, g.mean + g.sd]);
  });
  return {
    ...base,
    grid: { left: 50, right: 18, top: 18, bottom: 50 },
    xAxis: {
      ...axis, type: "category", data: cats,
      // The year range repeats on both ticks of a pair; showing it only on
      // the "observed" tick keeps the pair readable without the two labels
      // bleeding into each other. The full name still reaches the tooltip.
      axisLabel: {
        ...axis.axisLabel, interval: 0, fontSize: T.fs("caption"), lineHeight: 14,
        formatter: (value, index) => (index % 2 === 1 ? value.split("\n")[1] : value),
      },
    },
    yAxis: { ...axis, type: "value", min: 0, axisLabel: { ...axis.axisLabel, formatter: (v) => `${Math.round(v * 100)}%` } },
    tooltip: { ...base.tooltip, formatter: (p) => `${esc(p.name.replace("\n", " "))}<br>${(p.value * 100).toFixed(1)}%` },
    series: [
      { type: "bar", data: values, barMaxWidth: 20 },
      whiskerSeries(whiskers),
    ],
  };
}

// Section 3 · B — which clients change group ---------------------------------

export function whoMoversOption(data, T) {
  const { base, axis, valueLabel } = styles(T);
  const f = data.finding;
  const bars = [
    { label: "Two weighted\nseeds", value: f.q2_noise_floor_weighted, color: GREY },
    { label: "Two unweighted\nseeds", value: f.q2_noise_floor_unweighted, color: GREY },
    { label: "Weighted vs\nunweighted", value: f.q2_share_move, color: ORANGE },
  ];
  return {
    ...base,
    grid: { left: 50, right: 18, top: 18, bottom: 42 },
    xAxis: { ...axis, type: "category", data: bars.map((b) => b.label), axisLabel: { ...axis.axisLabel, lineHeight: 13 } },
    yAxis: { ...axis, type: "value", min: 0, axisLabel: { ...axis.axisLabel, formatter: (v) => `${Math.round(v * 100)}%` } },
    tooltip: { ...base.tooltip, formatter: (p) => `${esc(p.name.replace("\n", " "))}<br>${(p.value * 100).toFixed(1)}%` },
    series: [
      {
        type: "bar", barMaxWidth: 42,
        data: bars.map((b) => ({ value: b.value, itemStyle: { color: b.color } })),
        label: { show: true, position: "top", ...valueLabel, formatter: (p) => pct(p.value, 1) },
      },
      // Medians over 10 disjoint seed pairs; the whisker is that range's min/max, not a sd.
      whiskerSeries([
        [0, f.q2_noise_floor_weighted_min, f.q2_noise_floor_weighted_max],
        [1, f.q2_noise_floor_unweighted_min, f.q2_noise_floor_unweighted_max],
      ]),
    ],
  };
}

/** #who-movers-table: [client, filings, vendors, weighted group, unweighted group]. */
export function whoMoversRows(data) {
  return data.q2_top_movers.map((m) => [m.client, num(m.filings), num(m.vendors), m.weighted_community_top_firm, m.unweighted_community_top_firm]);
}

// Section 3 · C — which clients sit in two groups at once -------------------

export function whoOverlapOption(data, T) {
  const { base, axis, valueLabel } = styles(T);
  const f = data.finding;
  const cats = ["Real network", "Rewired,\nmean"];
  return {
    ...base,
    grid: { left: 60, right: 18, top: 18, bottom: 34 },
    xAxis: { ...axis, type: "category", data: cats, axisLabel: { ...axis.axisLabel, lineHeight: 13 } },
    yAxis: { ...axis, type: "value", name: "split clients", nameTextStyle: { color: MUTE_TEXT } },
    tooltip: { ...base.tooltip, formatter: (p) => `${esc(p.name.replace("\n", " "))}<br>${num(Math.round(p.value))} clients` },
    series: [
      {
        type: "bar", barMaxWidth: 42,
        data: [
          { value: f.q3_two_community_clients, itemStyle: { color: ORANGE } },
          { value: f.q3_null_mean, itemStyle: { color: GREY } },
        ],
        label: { show: true, position: "top", ...valueLabel, formatter: (p) => num(Math.round(p.value)) },
      },
      whiskerSeries([[1, f.q3_null_mean - f.q3_null_sd, f.q3_null_mean + f.q3_null_sd]]),
    ],
  };
}

/** #who-overlap-table: [client, filings, first group, second group, main vendor]. */
export function whoOverlapRows(data) {
  return data.q3_top_clients.map((c) => [
    c.client,
    num(c.filings),
    `${c.communities[0]} (${pct(c.shares[0], 0)})`,
    `${c.communities[1]} (${pct(c.shares[1], 0)})`,
    c.main_vendor || "—",
  ]);
}

// Beyond · A — do law firms split companies the way vendors do -------------

export function beyondLawOption(data, T) {
  const { base, axis, valueLabel } = styles(T);
  const f = data.finding;
  const cats = ["Observed", "Rewired,\nmean"];
  return {
    ...base,
    grid: { left: 54, right: 18, top: 18, bottom: 34 },
    xAxis: { ...axis, type: "category", data: cats, axisLabel: { ...axis.axisLabel, lineHeight: 13 } },
    yAxis: { ...axis, type: "value", name: "AMI", nameTextStyle: { color: MUTE_TEXT } },
    tooltip: { ...base.tooltip, formatter: (p) => `${esc(p.name.replace("\n", " "))}<br>AMI ${p.value.toFixed(3)}` },
    series: [
      {
        type: "bar", barMaxWidth: 42,
        data: [
          { value: f.q1_ami, itemStyle: { color: ORANGE } },
          { value: f.q1_ami_rewired_mean, itemStyle: { color: GREY } },
        ],
        label: { show: true, position: "top", ...valueLabel, formatter: (p) => p.value.toFixed(3) },
      },
      whiskerSeries([[1, f.q1_ami_rewired_mean - f.q1_ami_rewired_sd, f.q1_ami_rewired_mean + f.q1_ami_rewired_sd]]),
    ],
  };
}

// Beyond · B — do outsourcing firms sponsor fewer green cards ---------------

export function beyondPermOption(data, T) {
  const { base, axis } = styles(T);
  const q2 = data.q2;
  const groups = [
    {
      label: "Outsourcing\nfirms", value: q2.placing_firms_20plus_placed.pooled_ratio,
      ci: q2.placing_firms_20plus_placed.pooled_ci95, color: ORANGE,
    },
    {
      label: "Direct\nemployers", value: q2.direct_firms_20plus_h1b.pooled_ratio,
      ci: q2.direct_firms_20plus_h1b.pooled_ci95, color: BLUE,
    },
  ];
  data.q2_top6_communities.forEach((g) => {
    groups.push({ label: `${short(g.top_firms[0])}'s\ngroup`, value: g.pooled_ratio, ci: null, color: GREY });
  });
  const whiskers = groups.map((g, i) => (g.ci ? [i, g.ci[0], g.ci[1]] : null)).filter(Boolean);
  return {
    ...base,
    grid: { left: 54, right: 18, top: 18, bottom: 62 },
    xAxis: {
      ...axis, type: "category", data: groups.map((g) => g.label),
      // A long company name is wider than its bar's slot, so it bleeds into
      // its neighbours; truncate it to fit and leave the full name to the
      // tooltip.
      axisLabel: { ...axis.axisLabel, fontSize: T.fs("caption"), lineHeight: 14, interval: 0, width: 54, overflow: "truncate" },
    },
    yAxis: { ...axis, type: "value", min: 0, name: "PERM per H-1B filing", nameTextStyle: { color: MUTE_TEXT } },
    tooltip: { ...base.tooltip, formatter: (p) => `${esc(p.name.replace("\n", " "))}<br>${p.value.toFixed(3)}` },
    series: [
      { type: "bar", barMaxWidth: 30, data: groups.map((g) => ({ value: g.value, itemStyle: { color: g.color } })) },
      whiskerSeries(whiskers),
    ],
  };
}

// Beyond · C — do outsourcing firms file at lower wage levels ----------------

export function beyondWageOption(data, T) {
  const { base, axis } = styles(T);
  const rows = data.q3_top5_soc;
  return {
    ...base,
    // The rotated occupation labels reach well below the axis; a legend
    // sitting at the bottom collides with them, so it moves to the top like
    // the section's other charts.
    grid: { left: 54, right: 18, top: 34, bottom: 76 },
    legend: { top: 0, right: 0, textStyle: { color: MUTE_TEXT, fontSize: T.fs("caption") } },
    xAxis: {
      ...axis, type: "category", data: rows.map((r) => short(r.title)),
      // At 24°, a truncated 120px label is wider than its own category slot
      // and its rotated box lands on the neighbour's; a steeper angle and a
      // shorter truncation width keep each label inside its own slot.
      axisLabel: { ...axis.axisLabel, rotate: 32, fontSize: T.fs("caption"), width: 95, overflow: "truncate", interval: 0 },
    },
    yAxis: { ...axis, type: "value", min: 0, max: 1, axisLabel: { ...axis.axisLabel, formatter: (v) => `${Math.round(v * 100)}%` } },
    tooltip: {
      ...base.tooltip, trigger: "axis",
      formatter: (p) => `<b>${esc(p[0].name)}</b><br>${p.map((s) => `${esc(s.seriesName)}: ${(s.value * 100).toFixed(1)}%`).join("<br>")}`,
    },
    series: [
      { name: "Placed at a client", type: "bar", data: rows.map((r) => r.placed_low_share), itemStyle: { color: ORANGE }, barMaxWidth: 20 },
      { name: "Employer's own site", type: "bar", data: rows.map((r) => r.direct_low_share), itemStyle: { color: BLUE }, barMaxWidth: 20 },
    ],
  };
}

// Section 4 — without the biggest firms ------------------------------------
// Each named drop sits beside its volume-matched random drop (mean ± sd of 20).
const DROPS = [
  ["drop_shortlist", "Five placing\nfirms out"],
  ["control_shortlist", "Random cut,\nsame volume"],
  ["drop_top10_filings", "Ten largest\nfilers out"],
  ["control_top10_filings", "Random cut,\nsame volume"],
];
const variant = (part, id) => part.variants.find((v) => v.id === id);

function dropBars(part, field) {
  const bars = DROPS.map(([id]) => {
    const v = variant(part, id);
    return { value: v[field], itemStyle: { color: v.control ? GREY : ORANGE } };
  });
  const whiskers = DROPS.flatMap(([id], i) => {
    const v = variant(part, id);
    const sd = v[`${field}_sd`];
    return v.control && sd != null ? [[i, v[field] - sd, v[field] + sd]] : [];
  });
  return { bars, whiskers };
}

export function footprintRegionOption(data, T) {
  const { base, axis, valueLabel } = styles(T);
  const full = variant(data.metros, "full");
  const { bars, whiskers } = dropBars(data.metros, "ami_region");
  return {
    ...base,
    grid: { left: 46, right: 18, top: 28, bottom: 46 },
    xAxis: { ...axis, type: "category", data: DROPS.map(([, label]) => label), axisLabel: { ...axis.axisLabel, lineHeight: 13 } },
    yAxis: { ...axis, type: "value", name: "AMI with Census regions", nameTextStyle: { color: MUTE_TEXT, align: "left" } },
    tooltip: { ...base.tooltip, formatter: (p) => `${esc(p.name.replace("\n", " "))}<br>AMI ${p.value.toFixed(3)}` },
    series: [
      {
        type: "bar", data: bars, barMaxWidth: 42,
        label: { show: true, position: "top", ...valueLabel, formatter: (p) => p.value.toFixed(2) },
        markLine: {
          silent: true, symbol: "none", lineStyle: { color: MUTE, type: "dashed" },
          label: { color: MUTE_TEXT, formatter: `all firms ${full.ami_region.toFixed(2)}`, position: "insideEndTop" },
          data: [{ yAxis: full.ami_region }],
        },
      },
      whiskerSeries(whiskers),
    ],
  };
}

export function footprintNmiOption(data, T) {
  const { base, axis, valueLabel } = styles(T);
  const metros = dropBars(data.metros, "nmi_vs_full");
  const jobs = dropBars(data.jobs, "nmi_vs_full");
  // Unique keys per half, so the axis labels every bar and the shading finds its range.
  const cats = ["metros", "jobs"].flatMap((part) => DROPS.map(([id]) => `${part}:${id}`));
  const labelOf = (key) => DROPS.find(([id]) => id === key.split(":")[1])[1];
  // Eight bars share half the width, so the axis gets short labels; the tooltip keeps the long ones.
  const SHORT = { drop_shortlist: "5 placing\nout", control_shortlist: "random", drop_top10_filings: "10 largest\nout", control_top10_filings: "random" };
  const shortOf = (key) => SHORT[key.split(":")[1]];
  const shift = (w, n) => w.map(([i, lo, hi]) => [i + n, lo, hi]);
  return {
    ...base,
    grid: { left: 46, right: 18, top: 28, bottom: 46 },
    xAxis: { ...axis, type: "category", data: cats, axisLabel: { ...axis.axisLabel, interval: 0, lineHeight: 14, fontSize: T.fs("caption"), formatter: shortOf } },
    yAxis: { ...axis, type: "value", min: 0, max: 1.1, interval: 0.2, name: "NMI with the full network's groups", nameTextStyle: { color: MUTE_TEXT, align: "left" }, axisLabel: { ...axis.axisLabel, formatter: (v) => (v <= 1 ? v.toFixed(1) : "") } },
    tooltip: { ...base.tooltip, formatter: (p) => `${p.dataIndex < 4 ? "Metros" : "Jobs"} · ${esc(labelOf(p.name).replace("\n", " "))}<br>NMI ${p.value.toFixed(2)}` },
    series: [
      {
        type: "bar", data: [...metros.bars, ...jobs.bars], barMaxWidth: 34,
        label: { show: true, position: "top", ...valueLabel, formatter: (p) => p.value.toFixed(2) },
        markArea: {
          silent: true, itemStyle: { color: "rgba(31,143,214,0.05)" },
          label: { color: MUTE_TEXT, position: "insideTop" },
          data: [[{ name: "Metros", xAxis: cats[0] }, { xAxis: cats[3] }], [{ name: "Jobs", xAxis: cats[4] }, { xAxis: cats[7] }]],
        },
      },
      whiskerSeries([...metros.whiskers, ...shift(jobs.whiskers, 4)]),
    ],
  };
}

// Section 4 follow-up — which firms drive it, and does it hold in FY2024 ----
// (footprint_rank.json; the FY2024 table has its own markup elsewhere, this
// file only draws the two charts.)

export function footprintSingleOption(data, T) {
  const { base, axis } = styles(T);
  const rows = data.single;
  const label = (firm) => (firm === "Tata Consultancy Services" ? "TCS" : short(firm));
  // One category per firm, two bars in it; the whisker sits on the grey bar,
  // half a bar plus half the gap right of the category centre.
  const BAR = 12;
  const GAP = 0.2;
  const offset = (BAR * (1 + GAP)) / 2;
  const whisker = {
    type: "custom", silent: true, tooltip: { show: false }, z: 5,
    data: rows.map((r, i) => [i, r.control_ami_mean - r.control_ami_sd, r.control_ami_mean + r.control_ami_sd]),
    renderItem(_params, api) {
      const lo = api.coord([api.value(0), api.value(1)]);
      const hi = api.coord([api.value(0), api.value(2)]);
      const x = hi[0] + offset;
      const style = { stroke: INK, lineWidth: 1.5 };
      return {
        type: "group",
        children: [
          { type: "line", shape: { x1: x - 5, y1: hi[1], x2: x + 5, y2: hi[1] }, style },
          { type: "line", shape: { x1: x, y1: lo[1], x2: x, y2: hi[1] }, style },
          { type: "line", shape: { x1: x - 5, y1: lo[1], x2: x + 5, y2: lo[1] }, style },
        ],
      };
    },
  };
  return {
    ...base,
    grid: { left: 46, right: 18, top: 40, bottom: 40 },
    legend: { top: 0, right: 0, textStyle: { color: MUTE_TEXT, fontSize: T.fs("caption") }, data: ["One firm out", "Random cut, same volume"] },
    xAxis: {
      ...axis, type: "category", data: rows.map((r) => label(r.firm)),
      axisLabel: { ...axis.axisLabel, interval: 0, fontSize: T.fs("caption"), rotate: 30 },
    },
    yAxis: { ...axis, type: "value", name: "AMI with Census regions", nameTextStyle: { color: MUTE_TEXT, align: "left" } },
    tooltip: {
      ...base.tooltip, trigger: "axis", axisPointer: { type: "shadow" },
      formatter: (items) => {
        const r = rows[items[0].dataIndex];
        return `<b>${esc(r.firm)}</b> out: AMI ${r.ami_region.toFixed(3)}, ${pct(r.filings_removed_share, 1)} of filings`
          + `<br>Random cut, same volume: ${r.control_ami_mean.toFixed(3)} ± ${r.control_ami_sd.toFixed(3)}`
          + (r.ami_vs_control_sd == null ? "" : `<br>${r.ami_vs_control_sd.toFixed(1)} sd from the random cuts`);
      },
    },
    series: [
      {
        name: "One firm out", type: "bar", barWidth: BAR, barGap: `${GAP * 100}%`,
        data: rows.map((r) => r.ami_region), itemStyle: { color: ORANGE },
        markLine: {
          silent: true, symbol: "none", lineStyle: { color: MUTE, type: "dashed" },
          label: { color: MUTE_TEXT, formatter: `full network ${data.finding.full_ami_region.toFixed(2)}`, position: "insideEndTop" },
          data: [{ yAxis: data.finding.full_ami_region }],
        },
      },
      { name: "Random cut, same volume", type: "bar", barWidth: BAR, data: rows.map((r) => r.control_ami_mean), itemStyle: { color: GREY } },
      whisker,
    ],
  };
}

export function footprintRankOption(data, T) {
  const { base, axis } = styles(T);
  const rows = [...data.sweep].sort((a, b) => a.k - b.k);
  const ks = rows.map((r) => r.k);
  // The control band as two stacked "line" series (the standard ECharts
  // range-band trick): the first, invisible, carries the lower bound; the
  // second, shaded, carries the (mean+sd) - (mean-sd) gap on top of it.
  // stackStrategy "all" (not the default "samesign") is required because the
  // lower bound is often negative -- the controls sit near AMI 0.
  const lo = rows.map((r) => r.control_ami_mean - r.control_ami_sd);
  const gap = rows.map((r) => 2 * r.control_ami_sd);
  return {
    ...base,
    grid: { left: 46, right: 18, top: 24, bottom: 46 },
    xAxis: {
      ...axis, type: "category", data: ks, name: "largest filers removed →", nameLocation: "middle", nameGap: 28,
    },
    yAxis: { ...axis, type: "value", name: "AMI with Census regions", nameTextStyle: { color: MUTE_TEXT, align: "left" } },
    tooltip: {
      ...base.tooltip, trigger: "axis",
      formatter: (p) => {
        const r = rows[p[0].dataIndex];
        const added = r.added.length ? esc(r.added.join(", ")) : "none";
        return `<b>k = ${r.k}</b> (added: ${added})<br>AMI ${r.ami_region.toFixed(3)} · random ${r.control_ami_mean.toFixed(3)} ± ${r.control_ami_sd.toFixed(3)}<br>${pct(r.filings_removed_share, 1)} of filings removed`;
      },
    },
    series: [
      {
        name: "control lo", type: "line", stack: "band", stackStrategy: "all",
        symbol: "none", lineStyle: { opacity: 0 }, areaStyle: { opacity: 0 }, data: lo,
      },
      {
        name: "control band", type: "line", stack: "band", stackStrategy: "all",
        symbol: "none", lineStyle: { opacity: 0 }, areaStyle: { color: "rgba(158,177,199,0.3)" }, data: gap,
      },
      {
        name: "Region AMI", type: "line", showSymbol: true, symbol: "circle", symbolSize: 6,
        lineStyle: { color: ORANGE, width: 2 }, itemStyle: { color: ORANGE },
        data: rows.map((r) => r.ami_region),
      },
    ],
  };
}
