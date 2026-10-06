// Second-round question cards: section 1's "who hires" and backbone-break
// figures, section 2's outsourcer/direct split and link-community table,
// section 3's switching/movers/overlap figures, and the "beyond" section's
// law-firm, green-card and wage-level figures. Four page JSON files, one
// fetch each, same conventions as week04-jobs.js.
import { asset } from "./site.js";
import { node, token, fitted, fs, family, textWidth } from "./week04-strip.js";

const WHERE_WHO_URL = asset("weeks/week04/data/where_who.json");
const JOBS_SPLIT_URL = asset("weeks/week04/data/jobs_split.json");
const STAFFING_MOVES_URL = asset("weeks/week04/data/staffing_moves.json");
const BEYOND_URL = asset("weeks/week04/data/beyond.json");
const FOOTPRINT_URL = asset("weeks/week04/data/footprint.json");
const FOOTPRINT_RANK_URL = asset("weeks/week04/data/footprint_rank.json");

const INK = "#0f2340";
const MUTE = "#7a8fac";
const LINE = "#e6edf5";
const ORANGE = "#f2820c";
const BLUE = "#1f8fd6";
const GREY = "#9eb1c7";
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
  textStyle: { fontFamily: family("sans"), fontSize: fs("caption") },
  tooltip: {
    confine: true,
    backgroundColor: "rgba(15,35,64,0.94)",
    borderWidth: 0,
    textStyle: { color: "#eaf2fb", fontSize: fs("small") },
  },
};
const axis = {
  axisLine: { lineStyle: { color: "#c6d4e6" } },
  axisLabel: { color: MUTE, fontSize: fs("caption") },
  splitLine: { lineStyle: { color: LINE, type: "dashed" } },
};
// Row labels on a category y-axis: the names a reader looks up.
const rowLabel = { color: INK, fontSize: fs("small"), fontWeight: 600 };
// The value printed at a bar's end.
const valueLabel = { color: INK, fontSize: fs("small"), fontWeight: 700 };

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
      el.innerHTML = `<p style="color:var(--ink-mute);font-size:${fs("small")}px;margin:0;padding:14px 2px;">${esc(message)}</p>`;
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

function renderJobsSplitNmi(data) {
  const host = $("chart-jobs-split-nmi");
  if (!host) return;
  const f = data.finding;
  const rows = NMI_ROWS.map((r) => ({
    ...r, label: r.lines.join(" "), value: f[r.mean], sd: r.sd ? f[r.sd] : null,
  }));
  // The axis runs to the next 0.2 past the longest whisker, never past 1.
  const steps = Math.min(5, Math.ceil(Math.max(...rows.map((r) => r.value + (r.sd ?? 0))) / 0.2 - 1e-9));
  const d1 = steps * 0.2;
  host.replaceChildren(fitted((W) => drawSplitNmi(rows, steps, d1, W), 560));
}

function drawSplitNmi(rows, steps, d1, W) {
  const small = fs("small");
  const caption = fs("caption");
  const x0 = Math.ceil(Math.max(...rows.flatMap((r) => r.lines.map((line) => textWidth(line, "small", r.bold ? 700 : 600))))) + 14;
  const x1 = W - 40;
  const T = 8;
  const rowH = 46;
  const ybot = T + rows.length * rowH;
  const H = ybot + 34;
  const X = (v) => x0 + (Math.min(Math.max(v, 0), d1) / d1) * (x1 - x0);
  const ink = token("--ink");
  const mute = token("--ink-mute");
  const svg = node("svg", {
    viewBox: `0 0 ${W} ${H}`, width: W, height: H, role: "img",
    "aria-label": "How much the outsourcing and direct-employer job clusters agree, against three random baselines",
  });
  for (let i = 0; i <= steps; i += 1) {
    const v = i * 0.2;
    svg.append(node("line", { x1: X(v), x2: X(v), y1: T - 2, y2: ybot, stroke: token("--w4-grid") }));
    svg.append(node("text", { x: X(v), y: ybot + 14, "font-size": caption, fill: mute, "text-anchor": "middle" }, v.toFixed(1)));
  }
  const axisName = "Agreement of the two groups' job clusters (NMI: 0 unrelated, 1 identical)";
  const half = textWidth(axisName, "caption") / 2;
  svg.append(node("text", { x: Math.max(half, Math.min((x0 + x1) / 2, W - half)), y: ybot + 31, "font-size": caption, fill: mute, "text-anchor": "middle" },
    axisName));
  rows.forEach((r, i) => {
    const cy = T + i * rowH + rowH / 2;
    const weight = r.bold ? 700 : 600;
    svg.append(node("text", { x: 0, y: cy - 3, "font-size": small, "font-weight": weight, fill: ink }, r.lines[0]));
    svg.append(node("text", { x: 0, y: cy + 12.5, "font-size": small, "font-weight": weight, fill: ink }, r.lines[1]));
    const tip = r.sd === null
      ? `${r.label}: NMI ${r.value.toFixed(3)}`
      : `${r.label}: NMI ${r.value.toFixed(3)} ± ${r.sd.toFixed(3)} (mean ± sd over the random splits)`;
    const g = node("g");
    g.append(node("title", {}, tip));
    g.append(node("rect", { x: x0, y: cy - 9, width: Math.max(X(r.value) - x0, 1), height: 18, rx: 3, fill: token(r.fill) }));
    let end = X(r.value);
    if (r.sd !== null) {
      const lo = X(r.value - r.sd);
      const hi = X(r.value + r.sd);
      const whisker = { stroke: ink, "stroke-width": 1.5 };
      g.append(node("line", { x1: lo, x2: hi, y1: cy, y2: cy, ...whisker }));
      g.append(node("line", { x1: lo, x2: lo, y1: cy - 6, y2: cy + 6, ...whisker }));
      g.append(node("line", { x1: hi, x2: hi, y1: cy - 6, y2: cy + 6, ...whisker }));
      end = Math.max(end, hi);
    }
    svg.append(g);
    svg.append(node("text", { x: end + 7, y: cy + 4.5, "font-size": small, "font-weight": 700, fill: ink }, r.value.toFixed(2)));
  });
  return svg;
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
    grid: { left: 244, right: 24, top: 34, bottom: 40 },
    legend: { top: 0, right: 0, textStyle: { color: MUTE, fontSize: fs("caption") } },
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

// One bar: the links in the largest link community against the rest.
function renderLinkShare(data) {
  const host = $("chart-jobs-linkcom-share");
  if (!host) return;
  host.replaceChildren(fitted((W) => drawLinkShare(data, W), 520));
}

function drawLinkShare(data, W) {
  const q = data.q2;
  const largest = q.largest_link_community_links;
  const rest = q.links - largest;
  const smaller = q.link_clusters - 1;
  const share = largest / q.links;
  const caption = fs("caption");
  const smallSize = fs("small");
  const H = 146;
  const by = 46;
  const bh = 34;
  const split = W * share;
  const ink = token("--ink");
  const soft = token("--ink-soft");
  const svg = node("svg", {
    viewBox: `0 0 ${W} ${H}`, width: W, height: H, role: "img",
    "aria-label": `Share of the ${num(q.links)} links in the largest link community`,
  });
  svg.append(node("text", { x: 0, y: 24, "font-size": caption, fill: soft },
    `All ${num(q.links)} links between occupations, split by link community`));
  const big = node("g");
  big.append(node("title", {}, `Largest link community: ${num(largest)} of ${num(q.links)} links (${pct(share)})`));
  big.append(node("rect", { x: 0, y: by, width: split - 2, height: bh, rx: 5, fill: ink }));
  big.append(node("text", { x: 10, y: by + 21.5, "font-size": smallSize, "font-weight": 700, fill: token("--card") },
    `One community: ${pct(share, 0)} of links`));
  svg.append(big);
  const small = node("g");
  small.append(node("title", {}, `The other ${num(smaller)} link communities: ${num(rest)} links (${pct(rest / q.links)})`));
  small.append(node("rect", { x: split, y: by, width: W - split, height: bh, rx: 5, fill: token("--w4-meter") }));
  small.append(node("text", { x: split + (W - split) / 2, y: by + 21.5, "font-size": smallSize, "font-weight": 700, fill: ink, "text-anchor": "middle" },
    pct(rest / q.links, 0)));
  svg.append(small);
  svg.append(node("text", { x: 0, y: by + bh + 18, "font-size": caption, fill: soft }, `${num(largest)} links`));
  svg.append(node("text", { x: W, y: by + bh + 18, "font-size": caption, fill: soft, "text-anchor": "end" }, `${num(rest)} links`));
  svg.append(node("text", { x: W, y: by + bh + 40, "font-size": caption, fill: soft, "text-anchor": "end" },
    `${num(smaller)} smaller communities share the rest;`));
  svg.append(node("text", { x: W, y: by + bh + 56, "font-size": caption, fill: soft, "text-anchor": "end" },
    `${num(data.finding.q2_link_clusters_of_3_or_more)} of all ${num(q.link_clusters)} hold three links or more`));
  return svg;
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

function renderLinkScatter(data) {
  const host = $("chart-jobs-linkcom-scatter");
  if (!host) return;
  const top = data.q2.top15_by_communities_per_link;
  const bridges = new Set(data.q2.bridges.in_top15);
  host.replaceChildren(fitted((W) => drawLinkScatter(data, top, bridges, W), 520));
}

function drawLinkScatter(data, top, bridges, W) {
  const name = (o) => LINK_SHORT[o.id] ?? short(o.title);
  const caption = fs("caption");
  const small = fs("small");
  const H = 336;
  const L = 40;
  const R = 150;
  const T = 24;
  const B = 40;
  const xmax = Math.ceil(Math.max(...top.map((o) => o.links)) / 10) * 10;
  const ymax = Math.ceil(Math.max(...top.map((o) => o.communities)) / 5) * 5;
  const X = (v) => L + ((W - L - R) * v) / xmax;
  const Y = (v) => T + (H - T - B) * (1 - v / ymax);
  const ink = token("--ink");
  const soft = token("--ink-soft");
  const mute = token("--ink-mute");
  const halo = { "paint-order": "stroke", stroke: token("--w4-inset"), "stroke-width": 3 };
  const svg = node("svg", {
    viewBox: `0 0 ${W} ${H}`, width: W, height: H, role: "img",
    "aria-label": `Links against link communities for the ${top.length} jobs with the most communities per link`,
  });
  for (let v = 0; v <= ymax; v += 5) {
    svg.append(node("line", { x1: L, x2: W - R, y1: Y(v), y2: Y(v), stroke: token("--w4-grid") }));
    svg.append(node("text", { x: L - 8, y: Y(v) + 4, "font-size": caption, fill: mute, "text-anchor": "end" }, String(v)));
  }
  for (let v = 0; v <= xmax; v += 10) {
    svg.append(node("text", { x: X(v), y: H - B + 18, "font-size": caption, fill: mute, "text-anchor": "middle" }, String(v)));
  }
  svg.append(node("text", { x: (L + W - R) / 2, y: H - 6, "font-size": caption, fill: soft, "text-anchor": "middle" },
    "links (other occupations it shares employers with)"));
  svg.append(node("text", { x: L - 30, y: T - 12, "font-size": caption, fill: soft }, "communities"));
  RATE_GUIDES.forEach(([rate, label], i) => {
    const xe = Math.min(xmax, ymax / rate);
    svg.append(node("line", {
      x1: X(0), y1: Y(0), x2: X(xe), y2: Y(rate * xe),
      stroke: mute, "stroke-opacity": 0.55, "stroke-dasharray": "3 3",
    }));
    svg.append(node("text", {
      x: i === 0 ? X(xe) - 6 : X(xe) + 4, y: Y(rate * xe) + 4, "font-size": caption, fill: mute,
      "text-anchor": i === 0 ? "end" : "start",
    }, label));
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
    .sort((a, b) => b.communities - a.communities || a.links - b.links);
  const leaderLines = node("g");
  const dots = node("g");
  const labels = node("g");
  leaders.forEach((o, i) => {
    const lx = X(LEADER.x);
    const ly = Y(Math.max(LEADER.y - i * LEADER.step, 0.4));
    leaderLines.append(node("line", {
      x1: X(o.links) + 6, y1: Y(o.communities), x2: lx - 4, y2: ly - 4, stroke: mute, "stroke-width": 1,
    }));
    labels.append(node("text", { x: lx, y: ly, "font-size": small, "font-weight": 700, fill: ink, ...halo },
      `${name(o)} (bridge)`));
  });
  groups.forEach((members) => {
    const [first] = members;
    const flagged = members.some((o) => bridges.has(o.id));
    const who = members.map((o) => `${o.title}${bridges.has(o.id) ? " (flagged bridge)" : ""}`).join("\n");
    const g = node("g");
    g.append(node("title", {},
      `${who}\n${first.communities} communities over ${first.links} links (${first.communities_per_link.toFixed(2)} per link)`));
    g.append(node("circle", {
      cx: X(first.links), cy: Y(first.communities), r: 5.5,
      fill: flagged ? token("--card") : ink, stroke: ink, "stroke-width": flagged ? 2.2 : 1,
    }));
    dots.append(g);
  });
  top.filter((o) => LINK_LABELLED.includes(o.id)).forEach((o) => {
    labels.append(node("text", {
      x: X(o.links) + 8, y: Y(o.communities) + 4, "font-size": small,
      "font-weight": bridges.has(o.id) ? 700 : 600, fill: ink, ...halo,
    }, `${name(o)}${bridges.has(o.id) ? " (bridge)" : ""}`));
  });
  svg.append(leaderLines, dots, labels);
  return svg;
}

// Section 3 · A — does a switch stay in the client's group ------------------

function renderWhoSwitch(data) {
  const c = chart("chart-who-switch");
  charts.push(c);
  if (!c) return;
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
  c.setOption({
    ...base,
    grid: { left: 50, right: 18, top: 18, bottom: 50 },
    xAxis: {
      ...axis, type: "category", data: cats,
      // The year range repeats on both ticks of a pair; showing it only on
      // the "observed" tick keeps the pair readable without the two labels
      // bleeding into each other. The full name still reaches the tooltip.
      axisLabel: {
        ...axis.axisLabel, interval: 0, fontSize: fs("caption"), lineHeight: 14,
        formatter: (value, index) => (index % 2 === 1 ? value.split("\n")[1] : value),
      },
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
        label: { show: true, position: "top", ...valueLabel, formatter: (p) => num(Math.round(p.value)) },
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
        label: { show: true, position: "top", ...valueLabel, formatter: (p) => p.value.toFixed(3) },
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
  data.q2_top6_communities.forEach((g) => {
    groups.push({ label: `${short(g.top_firms[0])}'s\ngroup`, value: g.pooled_ratio, ci: null, color: GREY });
  });
  const whiskers = groups.map((g, i) => (g.ci ? [i, g.ci[0], g.ci[1]] : null)).filter(Boolean);
  c.setOption({
    ...base,
    grid: { left: 54, right: 18, top: 18, bottom: 62 },
    xAxis: {
      ...axis, type: "category", data: groups.map((g) => g.label),
      // A long company name is wider than its bar's slot, so it bleeds into
      // its neighbours; truncate it to fit and leave the full name to the
      // tooltip.
      axisLabel: { ...axis.axisLabel, fontSize: fs("caption"), lineHeight: 14, interval: 0, width: 54, overflow: "truncate" },
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
    // The rotated occupation labels reach well below the axis; a legend
    // sitting at the bottom collides with them, so it moves to the top like
    // the section's other charts.
    grid: { left: 54, right: 18, top: 34, bottom: 76 },
    legend: { top: 0, right: 0, textStyle: { color: MUTE, fontSize: fs("caption") } },
    xAxis: {
      ...axis, type: "category", data: rows.map((r) => short(r.title)),
      // At 24°, a truncated 120px label is wider than its own category slot
      // and its rotated box lands on the neighbour's; a steeper angle and a
      // shorter truncation width keep each label inside its own slot.
      axisLabel: { ...axis.axisLabel, rotate: 32, fontSize: fs("caption"), width: 95, overflow: "truncate", interval: 0 },
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
  renderLinkShare(data);
  renderLinkScatter(data);
}).catch((error) => {
  errorInto(["chart-jobs-split-nmi", "chart-jobs-split-mix", "jobs-linkcom-table",
    "chart-jobs-linkcom-share", "chart-jobs-linkcom-scatter"],
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
        label: { show: true, position: "top", ...valueLabel, formatter: (p) => p.value.toFixed(2) },
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
    xAxis: { ...axis, type: "category", data: cats, axisLabel: { ...axis.axisLabel, interval: 0, lineHeight: 14, fontSize: fs("caption"), formatter: shortOf } },
    yAxis: { ...axis, type: "value", min: 0, max: 1.1, interval: 0.2, name: "NMI with the full network's groups", nameTextStyle: { color: MUTE, align: "left" }, axisLabel: { ...axis.axisLabel, formatter: (v) => (v <= 1 ? v.toFixed(1) : "") } },
    tooltip: { ...base.tooltip, formatter: (p) => `${p.dataIndex < 4 ? "Metros" : "Jobs"} · ${esc(labelOf(p.name).replace("\n", " "))}<br>NMI ${p.value.toFixed(2)}` },
    series: [
      {
        type: "bar", data: [...metros.bars, ...jobs.bars], barMaxWidth: 34,
        label: { show: true, position: "top", ...valueLabel, formatter: (p) => p.value.toFixed(2) },
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

// Section 4 follow-up — which firms drive it, and does it hold in FY2024 ----
// (footprint_rank.json; the FY2024 table has its own markup elsewhere, this
// file only draws the two charts.)

function renderFootprintSingle(data) {
  const c = chart("chart-footprint-single");
  charts.push(c);
  if (!c) return;
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
  c.setOption({
    ...base,
    grid: { left: 46, right: 18, top: 40, bottom: 40 },
    legend: { top: 0, right: 0, textStyle: { color: MUTE, fontSize: fs("caption") }, data: ["One firm out", "Random cut, same volume"] },
    xAxis: {
      ...axis, type: "category", data: rows.map((r) => label(r.firm)),
      axisLabel: { ...axis.axisLabel, interval: 0, fontSize: fs("caption"), rotate: 30 },
    },
    yAxis: { ...axis, type: "value", name: "AMI with Census regions", nameTextStyle: { color: MUTE, align: "left" } },
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
          label: { color: MUTE, formatter: `full network ${data.finding.full_ami_region.toFixed(2)}`, position: "insideEndTop" },
          data: [{ yAxis: data.finding.full_ami_region }],
        },
      },
      { name: "Random cut, same volume", type: "bar", barWidth: BAR, data: rows.map((r) => r.control_ami_mean), itemStyle: { color: GREY } },
      whisker,
    ],
  });
}

function renderFootprintRank(data) {
  const c = chart("chart-footprint-rank");
  charts.push(c);
  if (!c) return;
  const rows = [...data.sweep].sort((a, b) => a.k - b.k);
  const ks = rows.map((r) => r.k);
  // The control band as two stacked "line" series (the standard ECharts
  // range-band trick): the first, invisible, carries the lower bound; the
  // second, shaded, carries the (mean+sd) - (mean-sd) gap on top of it.
  // stackStrategy "all" (not the default "samesign") is required because the
  // lower bound is often negative -- the controls sit near AMI 0.
  const lo = rows.map((r) => r.control_ami_mean - r.control_ami_sd);
  const gap = rows.map((r) => 2 * r.control_ami_sd);
  c.setOption({
    ...base,
    grid: { left: 46, right: 18, top: 24, bottom: 46 },
    xAxis: {
      ...axis, type: "category", data: ks, name: "largest filers removed →", nameLocation: "middle", nameGap: 28,
    },
    yAxis: { ...axis, type: "value", name: "AMI with Census regions", nameTextStyle: { color: MUTE, align: "left" } },
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
  });
}

fetch(FOOTPRINT_RANK_URL).then((response) => {
  if (!response.ok) throw new Error(`footprint_rank data ${response.status}`);
  return response.json();
}).then((data) => {
  renderFootprintSingle(data);
  renderFootprintRank(data);
}).catch((error) => {
  errorInto(["chart-footprint-single", "chart-footprint-rank"], `Footprint-rank data failed to load: ${error.message}`);
});

window.addEventListener("resize", () => charts.forEach((item) => item && item.resize()));
