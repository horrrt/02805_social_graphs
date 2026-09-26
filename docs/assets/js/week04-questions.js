// Second-round question cards: section 1's "who hires" and backbone-break
// figures, section 2's outsourcer/direct split and link-community table,
// section 3's switching/movers/overlap figures, and the "beyond" section's
// law-firm, green-card and wage-level figures. Four page JSON files, one
// fetch each, same conventions as week04-jobs.js.
const WHERE_WHO_URL = new URL("../../weeks/week04/data/where_who.json", import.meta.url);
const JOBS_SPLIT_URL = new URL("../../weeks/week04/data/jobs_split.json", import.meta.url);
const STAFFING_MOVES_URL = new URL("../../weeks/week04/data/staffing_moves.json", import.meta.url);
const BEYOND_URL = new URL("../../weeks/week04/data/beyond.json", import.meta.url);
const FOOTPRINT_URL = new URL("../../weeks/week04/data/footprint.json", import.meta.url);

const INK = "#0f2340";
const MUTE = "#7a8fac";
const LINE = "#e6edf5";
const ORANGE = "#f2820c";
const BLUE = "#1f8fd6";
const GREY = "#9eb1c7";
const LIGHT_GREY = "#c6d2df";
const whole = new Intl.NumberFormat("en-US");
const num = (value) => whole.format(value);
const pct = (value, digits = 1) => `${(value * 100).toFixed(digits)}%`;
const short = (title) => title.replace(/\s+\([^)]*\)$/, "").replace(/\s+/g, " ");
const $ = (id) => document.getElementById(id);
const esc = (value) => String(value).replace(/[&<>"']/g, (character) => ({
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
}[character]));

const base = {
  animationDuration: 360,
  textStyle: { fontFamily: "-apple-system, BlinkMacSystemFont, system-ui, sans-serif" },
  tooltip: {
    confine: true,
    backgroundColor: "rgba(15,35,64,0.94)",
    borderWidth: 0,
    textStyle: { color: "#eaf2fb", fontSize: 12 },
  },
};
const axis = {
  axisLine: { lineStyle: { color: "#c6d4e6" } },
  axisLabel: { color: MUTE, fontSize: 11 },
  splitLine: { lineStyle: { color: LINE, type: "dashed" } },
};

function chart(id) {
  const host = $(id);
  return host ? window.echarts.init(host, null, { renderer: "canvas" }) : null;
}

const charts = [];

// A short message in place of a chart or table when its data file failed to
// load, rather than leaving an empty host or throwing past this section.
function errorInto(ids, message) {
  ids.forEach((id) => {
    const el = $(id);
    if (!el) return;
    if (el.tagName === "TBODY") {
      el.innerHTML = `<tr><td colspan="8" style="color:var(--ink-mute)">${esc(message)}</td></tr>`;
    } else {
      el.innerHTML = `<p style="color:var(--ink-mute);font-size:13px;margin:0;padding:14px 2px;">${esc(message)}</p>`;
    }
  });
}

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

// Section 1 · A — cities group by who hires, not by region -----------------

function renderWhereWho(data) {
  const c = chart("chart-where-who");
  charts.push(c);
  if (!c) return;
  const labels = [
    { key: "naics54_share_tercile", label: "IT-services share\n(thirds)", who: true },
    { key: "placed_share_tercile", label: "Placed share\n(thirds)", who: true },
    { key: "census_division", label: "Census division", who: false },
    { key: "census_region", label: "Census region", who: false },
  ];
  const rows = labels.map((l) => ({ ...l, score: data.finding.q1_scores[l.key] }));
  c.setOption({
    ...base,
    grid: { left: 132, right: 74, top: 12, bottom: 30 },
    xAxis: { ...axis, type: "value", min: 0, name: "AMI →", nameLocation: "middle", nameGap: 26 },
    yAxis: {
      ...axis, type: "category", inverse: true, data: rows.map((r) => r.label),
      axisLabel: { ...axis.axisLabel, lineHeight: 13 },
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
        show: true, position: "right", color: INK, fontSize: 11,
        formatter: (p) => `AMI ${rows[p.dataIndex].score.ami.toFixed(2)} · p = ${rows[p.dataIndex].score.p_shuffle.toFixed(3)}`,
      },
    }],
  });
}

// Section 1 · B — where the backbone breaks ---------------------------------

function renderWhereBreak(data) {
  const c = chart("chart-where-break");
  charts.push(c);
  if (!c) return;
  const points = [...data.backbone_sweep].sort((a, b) => a.alpha - b.alpha);
  c.setOption({
    ...base,
    grid: { left: 48, right: 18, top: 18, bottom: 40 },
    xAxis: {
      ...axis, type: "log", name: "α (disparity filter) →", nameLocation: "middle", nameGap: 28,
      axisLabel: { ...axis.axisLabel, formatter: (v) => (v < 0.01 ? v.toFixed(3) : v.toFixed(2)) },
    },
    yAxis: { ...axis, type: "value", min: 0, max: 40, name: "metros in largest piece", nameTextStyle: { color: MUTE } },
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
  });
}

function renderWhereBreakLinks(data) {
  const tbody = $("where-break-links");
  if (!tbody) return;
  const rows = [...data.breaking_links].sort((a, b) => b.alpha - a.alpha);
  tbody.innerHTML = rows.map((l) => `<tr>
    <td>${esc(l.a_name)}–${esc(l.b_name)}</td>
    <td style="text-align:right">${l.alpha.toFixed(3)}</td>
    <td style="text-align:right">${num(l.weight)}</td>
    <td>${esc(l.top_employer)}${l.shortlist ? ' <span class="tag">placing firm</span>' : ""}</td>
    <td style="text-align:right">${pct(l.top_share, 0)}</td>
  </tr>`).join("");
}

// Section 2 · A — do outsourcers and direct employers bundle jobs alike -----

function renderJobsSplitNmi(data) {
  const c = chart("chart-jobs-split-nmi");
  charts.push(c);
  if (!c) return;
  const f = data.finding;
  const cats = ["Observed", "Count-matched\nnull mean", "Filing-matched\nnull mean"];
  const bars = [
    { value: f.q1_observed_nmi, itemStyle: { color: ORANGE } },
    { value: f.q1_null_count_matched_nmi_mean, itemStyle: { color: GREY } },
    { value: f.q1_null_filings_matched_nmi_mean, itemStyle: { color: LIGHT_GREY } },
  ];
  const whiskers = [
    [1, f.q1_null_count_matched_nmi_mean - f.q1_null_count_matched_nmi_sd,
      f.q1_null_count_matched_nmi_mean + f.q1_null_count_matched_nmi_sd],
    [2, f.q1_null_filings_matched_nmi_mean - f.q1_null_filings_matched_nmi_sd,
      f.q1_null_filings_matched_nmi_mean + f.q1_null_filings_matched_nmi_sd],
  ];
  c.setOption({
    ...base,
    grid: { left: 46, right: 18, top: 24, bottom: 46 },
    xAxis: { ...axis, type: "category", data: cats, axisLabel: { ...axis.axisLabel, lineHeight: 13 } },
    yAxis: { ...axis, type: "value", min: 0, name: "NMI", nameTextStyle: { color: MUTE } },
    tooltip: { ...base.tooltip, formatter: (p) => `${esc(p.name.replace("\n", " "))}<br>NMI ${p.value.toFixed(3)}` },
    series: [
      {
        type: "bar", data: bars, barMaxWidth: 42,
        label: { show: true, position: "top", color: INK, formatter: (p) => p.value.toFixed(2) },
      },
      whiskerSeries(whiskers),
    ],
  });
}

function renderJobsSplitMix(data) {
  const c = chart("chart-jobs-split-mix");
  charts.push(c);
  if (!c) return;
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
  c.setOption({
    ...base,
    grid: { left: 210, right: 24, top: 34, bottom: 40 },
    legend: { top: 0, right: 0, textStyle: { color: MUTE, fontSize: 11 } },
    xAxis: {
      ...axis, type: "value", name: "share of group's filings →", nameLocation: "middle", nameGap: 26, splitNumber: 4,
      axisLabel: { ...axis.axisLabel, formatter: (v) => `${Math.round(v * 100)}%` },
    },
    yAxis: {
      ...axis, type: "category", data: rows.map((r) => r.title),
      axisLabel: { ...axis.axisLabel, width: 196, overflow: "truncate" },
    },
    tooltip: {
      ...base.tooltip, trigger: "axis",
      formatter: (p) => `<b>${esc(p[0].name)}</b><br>${p.map((s) => `${esc(s.seriesName)}: ${(s.value * 100).toFixed(1)}%`).join("<br>")}`,
    },
    series: [
      { name: "Outsourcing firms", type: "bar", data: rows.map((r) => r.placingShare), itemStyle: { color: ORANGE }, barMaxWidth: 12 },
      { name: "Direct employers", type: "bar", data: rows.map((r) => r.directShare), itemStyle: { color: BLUE }, barMaxWidth: 12 },
    ],
  });
}

// Section 2 · B — link communities table ------------------------------------

function renderJobsLinkcomTable(data) {
  const tbody = $("jobs-linkcom-table");
  if (!tbody) return;
  const flagged = new Set(data.q2.bridges.in_top15);
  tbody.innerHTML = data.q2.top15_by_communities_per_link.map((o) => `<tr>
    <td>${esc(short(o.title))}${flagged.has(o.id) ? ' <span class="tag">flagged bridge</span>' : ""}</td>
    <td style="text-align:right">${num(o.links)}</td>
    <td style="text-align:right">${num(o.communities)}</td>
    <td style="text-align:right">${o.communities_per_link.toFixed(2)}</td>
  </tr>`).join("");
}

// Section 3 · A — does a switch stay in the client's group ------------------

function renderWhoSwitch(data) {
  const c = chart("chart-who-switch");
  charts.push(c);
  if (!c) return;
  const f = data.finding;
  const groups = [
    ...data.q1_pairs.map((p) => ({
      label: `FY${p.from}→FY${p.to}`, observed: p.observed_share_same_community, mean: p.null.mean, sd: p.null.sd,
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
  c.setOption({
    ...base,
    grid: { left: 50, right: 18, top: 18, bottom: 50 },
    xAxis: {
      ...axis, type: "category", data: cats,
      axisLabel: { ...axis.axisLabel, interval: 0, fontSize: 10, lineHeight: 12 },
    },
    yAxis: { ...axis, type: "value", min: 0, axisLabel: { ...axis.axisLabel, formatter: (v) => `${Math.round(v * 100)}%` } },
    tooltip: { ...base.tooltip, formatter: (p) => `${esc(p.name.replace("\n", " "))}<br>${(p.value * 100).toFixed(1)}%` },
    series: [
      { type: "bar", data: values, barMaxWidth: 20 },
      whiskerSeries(whiskers),
    ],
  });
}

// Section 3 · B — which clients change group ---------------------------------

function renderWhoMovers(data) {
  const c = chart("chart-who-movers");
  charts.push(c);
  if (!c) return;
  const f = data.finding;
  const bars = [
    { label: "Two weighted\nseeds", value: f.q2_noise_floor_weighted, color: GREY },
    { label: "Two unweighted\nseeds", value: f.q2_noise_floor_unweighted, color: GREY },
    { label: "Weighted vs\nunweighted", value: f.q2_share_move, color: ORANGE },
  ];
  c.setOption({
    ...base,
    grid: { left: 50, right: 18, top: 18, bottom: 42 },
    xAxis: { ...axis, type: "category", data: bars.map((b) => b.label), axisLabel: { ...axis.axisLabel, lineHeight: 13 } },
    yAxis: { ...axis, type: "value", min: 0, axisLabel: { ...axis.axisLabel, formatter: (v) => `${Math.round(v * 100)}%` } },
    tooltip: { ...base.tooltip, formatter: (p) => `${esc(p.name.replace("\n", " "))}<br>${(p.value * 100).toFixed(1)}%` },
    series: [{
      type: "bar", barMaxWidth: 42,
      data: bars.map((b) => ({ value: b.value, itemStyle: { color: b.color } })),
      label: { show: true, position: "top", color: INK, formatter: (p) => pct(p.value, 1) },
    }],
  });
}

function renderWhoMoversTable(data) {
  const tbody = $("who-movers-table");
  if (!tbody) return;
  tbody.innerHTML = data.q2_top_movers.map((m) => `<tr>
    <td>${esc(m.client)}</td>
    <td style="text-align:right">${num(m.filings)}</td>
    <td style="text-align:right">${num(m.vendors)}</td>
    <td>${esc(m.weighted_community_top_firm)}</td>
    <td>${esc(m.unweighted_community_top_firm)}</td>
  </tr>`).join("");
}

// Section 3 · C — which clients sit in two groups at once -------------------

function renderWhoOverlap(data) {
  const c = chart("chart-who-overlap");
  charts.push(c);
  if (!c) return;
  const f = data.finding;
  const cats = ["Real network", "Rewired,\nmean"];
  c.setOption({
    ...base,
    grid: { left: 60, right: 18, top: 18, bottom: 34 },
    xAxis: { ...axis, type: "category", data: cats, axisLabel: { ...axis.axisLabel, lineHeight: 13 } },
    yAxis: { ...axis, type: "value", name: "split clients", nameTextStyle: { color: MUTE } },
    tooltip: { ...base.tooltip, formatter: (p) => `${esc(p.name.replace("\n", " "))}<br>${num(Math.round(p.value))} clients` },
    series: [
      {
        type: "bar", barMaxWidth: 42,
        data: [
          { value: f.q3_two_community_clients, itemStyle: { color: ORANGE } },
          { value: f.q3_null_mean, itemStyle: { color: GREY } },
        ],
        label: { show: true, position: "top", color: INK, formatter: (p) => num(Math.round(p.value)) },
      },
      whiskerSeries([[1, f.q3_null_mean - f.q3_null_sd, f.q3_null_mean + f.q3_null_sd]]),
    ],
  });
}

function renderWhoOverlapTable(data) {
  const tbody = $("who-overlap-table");
  if (!tbody) return;
  tbody.innerHTML = data.q3_top_clients.map((c) => `<tr>
    <td>${esc(c.client)}</td>
    <td style="text-align:right">${num(c.filings)}</td>
    <td>${esc(c.communities[0])} (${pct(c.shares[0], 0)})</td>
    <td>${esc(c.communities[1])} (${pct(c.shares[1], 0)})</td>
    <td>${esc(c.main_vendor || "—")}</td>
  </tr>`).join("");
}

// Beyond · A — do law firms split companies the way vendors do -------------

function renderBeyondLaw(data) {
  const c = chart("chart-beyond-law");
  charts.push(c);
  if (!c) return;
  const f = data.finding;
  const cats = ["Observed", "Rewired,\nmean"];
  c.setOption({
    ...base,
    grid: { left: 54, right: 18, top: 18, bottom: 34 },
    xAxis: { ...axis, type: "category", data: cats, axisLabel: { ...axis.axisLabel, lineHeight: 13 } },
    yAxis: { ...axis, type: "value", name: "AMI", nameTextStyle: { color: MUTE } },
    tooltip: { ...base.tooltip, formatter: (p) => `${esc(p.name.replace("\n", " "))}<br>AMI ${p.value.toFixed(3)}` },
    series: [
      {
        type: "bar", barMaxWidth: 42,
        data: [
          { value: f.q1_ami, itemStyle: { color: ORANGE } },
          { value: f.q1_ami_rewired_mean, itemStyle: { color: GREY } },
        ],
        label: { show: true, position: "top", color: INK, formatter: (p) => p.value.toFixed(3) },
      },
      whiskerSeries([[1, f.q1_ami_rewired_mean - f.q1_ami_rewired_sd, f.q1_ami_rewired_mean + f.q1_ami_rewired_sd]]),
    ],
  });
}

// Beyond · B — do outsourcing firms sponsor fewer green cards ---------------

function renderBeyondPerm(data) {
  const c = chart("chart-beyond-perm");
  charts.push(c);
  if (!c) return;
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
  Object.values(data.q2_top6_communities).forEach((g) => {
    groups.push({ label: `${short(g.top_firms[0])}'s\ngroup`, value: g.pooled_ratio, ci: null, color: GREY });
  });
  const whiskers = groups.map((g, i) => (g.ci ? [i, g.ci[0], g.ci[1]] : null)).filter(Boolean);
  c.setOption({
    ...base,
    grid: { left: 54, right: 18, top: 18, bottom: 62 },
    xAxis: {
      ...axis, type: "category", data: groups.map((g) => g.label),
      axisLabel: { ...axis.axisLabel, fontSize: 10, lineHeight: 12, interval: 0 },
    },
    yAxis: { ...axis, type: "value", min: 0, name: "PERM per H-1B filing", nameTextStyle: { color: MUTE } },
    tooltip: { ...base.tooltip, formatter: (p) => `${esc(p.name.replace("\n", " "))}<br>${p.value.toFixed(3)}` },
    series: [
      { type: "bar", barMaxWidth: 30, data: groups.map((g) => ({ value: g.value, itemStyle: { color: g.color } })) },
      whiskerSeries(whiskers),
    ],
  });
}

// Beyond · C — do outsourcing firms file at lower wage levels ----------------

function renderBeyondWage(data) {
  const c = chart("chart-beyond-wage");
  charts.push(c);
  if (!c) return;
  const rows = data.q3_top5_soc;
  c.setOption({
    ...base,
    grid: { left: 54, right: 18, top: 18, bottom: 76 },
    legend: { bottom: 0, textStyle: { color: MUTE, fontSize: 11 } },
    xAxis: {
      ...axis, type: "category", data: rows.map((r) => short(r.title)),
      axisLabel: { ...axis.axisLabel, rotate: 24, fontSize: 10, width: 120, overflow: "truncate", interval: 0 },
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
  });
}

// Four independent fetches: a failure in one leaves the others working. -----

fetch(WHERE_WHO_URL).then((response) => {
  if (!response.ok) throw new Error(`where_who data ${response.status}`);
  return response.json();
}).then((data) => {
  renderWhereWho(data);
  renderWhereBreak(data);
  renderWhereBreakLinks(data);
}).catch((error) => {
  errorInto(["chart-where-who", "chart-where-break", "where-break-links"],
    `Where/who data failed to load: ${error.message}`);
});

fetch(JOBS_SPLIT_URL).then((response) => {
  if (!response.ok) throw new Error(`jobs_split data ${response.status}`);
  return response.json();
}).then((data) => {
  renderJobsSplitNmi(data);
  renderJobsSplitMix(data);
  renderJobsLinkcomTable(data);
}).catch((error) => {
  errorInto(["chart-jobs-split-nmi", "chart-jobs-split-mix", "jobs-linkcom-table"],
    `Jobs-split data failed to load: ${error.message}`);
});

fetch(STAFFING_MOVES_URL).then((response) => {
  if (!response.ok) throw new Error(`staffing_moves data ${response.status}`);
  return response.json();
}).then((data) => {
  renderWhoSwitch(data);
  renderWhoMovers(data);
  renderWhoMoversTable(data);
  renderWhoOverlap(data);
  renderWhoOverlapTable(data);
}).catch((error) => {
  errorInto(["chart-who-switch", "chart-who-movers", "who-movers-table", "chart-who-overlap", "who-overlap-table"],
    `Staffing-moves data failed to load: ${error.message}`);
});

fetch(BEYOND_URL).then((response) => {
  if (!response.ok) throw new Error(`beyond data ${response.status}`);
  return response.json();
}).then((data) => {
  renderBeyondLaw(data);
  renderBeyondPerm(data);
  renderBeyondWage(data);
}).catch((error) => {
  errorInto(["chart-beyond-law", "chart-beyond-perm", "chart-beyond-wage"],
    `Beyond data failed to load: ${error.message}`);
});

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

function renderFootprintRegion(data) {
  const c = chart("chart-footprint-region");
  charts.push(c);
  if (!c) return;
  const full = variant(data.metros, "full");
  const { bars, whiskers } = dropBars(data.metros, "ami_region");
  c.setOption({
    ...base,
    grid: { left: 46, right: 18, top: 28, bottom: 46 },
    xAxis: { ...axis, type: "category", data: DROPS.map(([, label]) => label), axisLabel: { ...axis.axisLabel, lineHeight: 13 } },
    yAxis: { ...axis, type: "value", name: "AMI with Census regions", nameTextStyle: { color: MUTE, align: "left" } },
    tooltip: { ...base.tooltip, formatter: (p) => `${esc(p.name.replace("\n", " "))}<br>AMI ${p.value.toFixed(3)}` },
    series: [
      {
        type: "bar", data: bars, barMaxWidth: 42,
        label: { show: true, position: "top", color: INK, formatter: (p) => p.value.toFixed(2) },
        markLine: {
          silent: true, symbol: "none", lineStyle: { color: MUTE, type: "dashed" },
          label: { color: MUTE, formatter: `all firms ${full.ami_region.toFixed(2)}`, position: "insideEndTop" },
          data: [{ yAxis: full.ami_region }],
        },
      },
      whiskerSeries(whiskers),
    ],
  });
}

function renderFootprintNmi(data) {
  const c = chart("chart-footprint-nmi");
  charts.push(c);
  if (!c) return;
  const metros = dropBars(data.metros, "nmi_vs_full");
  const jobs = dropBars(data.jobs, "nmi_vs_full");
  // Unique keys per half, so the axis labels every bar and the shading finds its range.
  const cats = ["metros", "jobs"].flatMap((part) => DROPS.map(([id]) => `${part}:${id}`));
  const labelOf = (key) => DROPS.find(([id]) => id === key.split(":")[1])[1];
  // Eight bars share half the width, so the axis gets short labels; the tooltip keeps the long ones.
  const SHORT = { drop_shortlist: "5 placing\nout", control_shortlist: "random", drop_top10_filings: "10 largest\nout", control_top10_filings: "random" };
  const shortOf = (key) => SHORT[key.split(":")[1]];
  const shift = (w, n) => w.map(([i, lo, hi]) => [i + n, lo, hi]);
  c.setOption({
    ...base,
    grid: { left: 46, right: 18, top: 28, bottom: 46 },
    xAxis: { ...axis, type: "category", data: cats, axisLabel: { ...axis.axisLabel, interval: 0, lineHeight: 12, fontSize: 10, formatter: shortOf } },
    yAxis: { ...axis, type: "value", min: 0, max: 1.1, interval: 0.2, name: "NMI with the full network's groups", nameTextStyle: { color: MUTE, align: "left" }, axisLabel: { ...axis.axisLabel, formatter: (v) => (v <= 1 ? v.toFixed(1) : "") } },
    tooltip: { ...base.tooltip, formatter: (p) => `${p.dataIndex < 4 ? "Metros" : "Jobs"} · ${esc(labelOf(p.name).replace("\n", " "))}<br>NMI ${p.value.toFixed(2)}` },
    series: [
      {
        type: "bar", data: [...metros.bars, ...jobs.bars], barMaxWidth: 34,
        label: { show: true, position: "top", color: INK, formatter: (p) => p.value.toFixed(2) },
        markArea: {
          silent: true, itemStyle: { color: "rgba(31,143,214,0.05)" },
          label: { color: MUTE, position: "insideTop" },
          data: [[{ name: "Metros", xAxis: cats[0] }, { xAxis: cats[3] }], [{ name: "Jobs", xAxis: cats[4] }, { xAxis: cats[7] }]],
        },
      },
      whiskerSeries([...metros.whiskers, ...shift(jobs.whiskers, 4)]),
    ],
  });
}

fetch(FOOTPRINT_URL).then((response) => {
  if (!response.ok) throw new Error(`footprint data ${response.status}`);
  return response.json();
}).then((data) => {
  renderFootprintRegion(data);
  renderFootprintNmi(data);
}).catch((error) => {
  errorInto(["chart-footprint-region", "chart-footprint-nmi"], `Footprint data failed to load: ${error.message}`);
});

window.addEventListener("resize", () => charts.forEach((item) => item && item.resize()));
