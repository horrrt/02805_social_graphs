// Week 4 deep dive, "More networks" (#cut-more): a figure for each of the
// five text-only boxes. Built from docs/weeks/week04/data/more.json
// (analysis/week04_more_page.py), which copies its numbers out of
// week04_perm.json, week04_countries.json, week04_oews.json, week04_ties.json
// and week04_lottery.json. Nothing here is computed in the browser. Plain
// SVG, colours read from CSS tokens, like week04-strip.js.

import { node, token, stripChart } from "./week04-strip.js";

const DATA = new URL("../../weeks/week04/data/more.json", import.meta.url);

async function load() {
  const r = await fetch(DATA);
  if (!r.ok) throw new Error(`${DATA.pathname} ${r.status}`);
  return r.json();
}

function titled(el, tip) {
  if (tip) el.append(node("title", {}, tip));
  return el;
}

function pct(v) {
  return `${Math.round(v * 100)}%`;
}

/** A label centred on x but kept inside [lo, hi], as in week04-strip.js. */
function smartText(x, y, text, lo, hi, { size = 11, fill, weight = 400, anchorOverride } = {}) {
  const half = (text.length * size * (weight >= 600 ? 0.56 : 0.52)) / 2;
  const anchor = anchorOverride ?? (x - half < lo ? "start" : x + half > hi ? "end" : "middle");
  const at = anchor === "start" ? lo : anchor === "end" ? hi : x;
  return node("text", { x: at, y, "font-size": size, fill: fill ?? token("--ink-soft"), "font-weight": weight, "text-anchor": anchor }, text);
}

/**
 * A horizontal bar per row on a shared axis, real values only (no baseline
 * band): the form the redesign canvas's deep.py uses for a plain ranking.
 * rows: { label, sub, value, valueLabel, tip, bold, outline }.
 */
function hbars(rows, { domain, ticks, fmt, width = 556, labelW = 150, valueW = 54, rowH = 32, ref, refLabel, aria, top = 8 }) {
  const [d0, d1] = domain;
  const x0 = labelW;
  const x1 = width - valueW;
  const X = (v) => x0 + ((Math.min(Math.max(v, d0), d1) - d0) * (x1 - x0)) / (d1 - d0);
  const ybot = top + rows.length * rowH;
  const h = ybot + 30 + (refLabel ? 14 : 0);
  const svg = node("svg", { viewBox: `0 0 ${width} ${h}`, width, height: h, role: "img", "aria-label": aria, class: "w4-strip" });
  for (const tv of ticks) {
    svg.append(node("line", { x1: X(tv), y1: top - 4, x2: X(tv), y2: ybot, stroke: token("--w4-grid"), "stroke-width": 1 }));
    svg.append(node("text", { x: X(tv), y: ybot + 16, "font-size": 11, fill: token("--ink-mute"), "text-anchor": "middle" }, fmt(tv)));
  }
  if (ref !== undefined) {
    svg.append(
      node("line", { x1: X(ref), y1: top - 4, x2: X(ref), y2: ybot, stroke: token("--ink-soft"), "stroke-width": 1.4, "stroke-dasharray": "3 2" }),
    );
    if (refLabel) svg.append(smartText(X(ref), ybot + 30, refLabel, x0, x1));
  }
  rows.forEach((r, i) => {
    const cy = top + i * rowH + rowH / 2;
    const bh = rowH - 12;
    svg.append(node("text", { x: 0, y: cy + 4, "font-size": 12, fill: token("--ink"), "font-weight": r.bold ? 700 : 500 }, r.label));
    svg.append(node("line", { x1: x0, y1: cy, x2: x1, y2: cy, stroke: token("--line"), "stroke-width": 1 }));
    const bw = Math.max(X(r.value) - x0, 1);
    if (r.outline) {
      svg.append(titled(node("rect", { x: x0, y: cy - bh / 2, width: bw, height: bh, rx: 3, fill: "none", stroke: token("--ink"), "stroke-width": 1.6 }), r.tip));
    } else {
      svg.append(titled(node("rect", { x: x0, y: cy - bh / 2, width: bw, height: bh, rx: 3, fill: r.bold ? token("--ink") : token("--ink-mute") }), r.tip));
    }
    svg.append(node("text", { x: X(r.value) + 6, y: cy + 4, "font-size": 11, fill: token("--ink-soft") }, r.valueLabel ?? fmt(r.value)));
  });
  return svg;
}

/**
 * Two columns joined by one line per series: the redesign canvas's slope
 * chart, for "before against after" comparisons. series: { label, values:
 * [a, b], colorToken, tip }.
 */
function slope(series, { domain, labels, fmt, width = 556, height = 210, aria }) {
  const [d0, d1] = domain;
  const top = 14;
  const bottom = height - 30;
  const xl = 120;
  const xr = width - 130;
  const Y = (v) => top + ((d1 - Math.min(Math.max(v, d0), d1)) * (bottom - top)) / (d1 - d0);
  const svg = node("svg", { viewBox: `0 0 ${width} ${height}`, width, height, role: "img", "aria-label": aria });
  for (const x of [xl, xr]) svg.append(node("line", { x1: x, y1: top - 6, x2: x, y2: bottom, stroke: token("--w4-grid"), "stroke-width": 1 }));
  svg.append(node("text", { x: xl, y: bottom + 20, "font-size": 12, fill: token("--ink-soft"), "font-weight": 600, "text-anchor": "middle" }, labels[0]));
  svg.append(node("text", { x: xr, y: bottom + 20, "font-size": 12, fill: token("--ink-soft"), "font-weight": 600, "text-anchor": "middle" }, labels[1]));
  series.forEach((s) => {
    const [a, b] = s.values;
    const color = token(s.colorToken);
    const g = titled(node("g"), s.tip);
    g.append(node("line", { x1: xl, y1: Y(a), x2: xr, y2: Y(b), stroke: color, "stroke-width": 2.4 }));
    g.append(node("circle", { cx: xl, cy: Y(a), r: 4.5, fill: color }));
    g.append(node("circle", { cx: xr, cy: Y(b), r: 4.5, fill: color }));
    svg.append(g);
    svg.append(smartText(xl - 10, Y(a) + 4, fmt(a), 0, width, { size: 12, fill: color, weight: 700, anchorOverride: "end" }));
    svg.append(smartText(xr + 10, Y(b) - 6, `${fmt(b)} ${s.label}`, 0, width, { size: 12, fill: color, weight: 700, anchorOverride: "start" }));
  });
  return svg;
}

function drawPerm(data, host) {
  const rows = data.rows.map((e) => ({
    label: e.label,
    sub: `${e.lca_filings.toLocaleString("en-US")} H-1B filings`,
    real: e.ratio,
    realLabel: e.ratio.toFixed(0),
    divider: e.label === "Amazon",
  }));
  host.replaceChildren(
    stripChart(rows, {
      domain: [0, 100],
      ticks: [0, 25, 50, 75, 100],
      fmt: (v) => v.toFixed(0),
      labelW: 150,
      badgeW: 20,
      rowH: 44,
      top: 20,
      ref: [data.median_ratio, `median employer ${data.median_ratio.toFixed(1)}`],
      aria: "Green cards per 100 H-1B filings for six employers named in the text",
    }),
  );
}

function drawCountriesTop(data, host) {
  const rows = data.top.map((c) => ({
    label: c.country,
    value: c.share * 100,
    valueLabel: pct(c.share),
    tip: `${c.country}: ${pct(c.share)} of the counted green-card filings`,
  }));
  host.replaceChildren(
    hbars(rows, {
      domain: [0, 55],
      ticks: [0, 10, 20, 30, 40, 50],
      fmt: (v) => `${v.toFixed(0)}%`,
      labelW: 110,
      valueW: 50,
      rowH: 26,
      aria: "Shares of FY2023 certified green-card filings by citizenship, in the counted cells",
    }),
  );
}

function drawCountriesModularity(data, host) {
  const u = data.modularity.unweighted;
  const w = data.modularity.weighted;
  const sign = (z) => (z >= 0 ? `z = ${z.toFixed(1)}` : `z = −${Math.abs(z).toFixed(1)}`);
  host.replaceChildren(
    stripChart(
      [
        {
          label: "Links counted once",
          sub: "against rewired",
          real: u.real,
          realLabel: u.real.toFixed(2),
          base: [u.null, u.null_sd],
          baseLabel: `rewired ${u.null.toFixed(2)}`,
          badge: sign(u.z),
        },
        {
          label: "Weighted by green cards",
          sub: "against rewired",
          real: w.real,
          realLabel: w.real.toFixed(2),
          base: [w.null, w.null_sd],
          baseLabel: `rewired ${w.null.toFixed(2)}`,
          badge: sign(w.z),
        },
      ],
      {
        domain: [0, 0.5],
        ticks: [0, 0.1, 0.2, 0.3, 0.4, 0.5],
        fmt: (v) => v.toFixed(1),
        labelW: 170,
        badgeW: 76,
        aria: "Modularity of the country network against rewired copies",
      },
    ),
  );
}

function drawDensity(data, host) {
  const rows = data.rows.map((m) => ({
    label: m.name.split(",")[0],
    value: m.rate,
    valueLabel: m.rate.toFixed(1),
    bold: m.metro === "41940",
    tip: `${m.name}: ${m.rate.toFixed(1)} certified filings per 1,000 jobs`,
  }));
  rows.push({
    label: data.new_york.name.split(",")[0],
    value: data.new_york.rate,
    valueLabel: data.new_york.rate.toFixed(1),
    outline: true,
    tip: `${data.new_york.name}: ${data.new_york.rate.toFixed(1)} certified filings per 1,000 jobs, files the most in the count`,
  });
  host.replaceChildren(
    hbars(rows, {
      domain: [0, 45],
      ticks: [0, 10, 20, 30, 40],
      fmt: (v) => v.toFixed(0),
      labelW: 130,
      valueW: 50,
      rowH: 28,
      ref: data.national_rate,
      refLabel: `national ${data.national_rate.toFixed(1)}`,
      aria: "Certified H-1B filings per 1,000 jobs by metro",
    }),
  );
}

function drawStrength(data, host) {
  const rows = data.rows.map((c) => ({
    label: c.label,
    value: c.strength,
    valueLabel: c.strength.toLocaleString("en-US"),
    bold: c.health_care,
    tip: `${c.label}: ${c.strength} filings from a single firm${c.health_care ? " (health care)" : ""}`,
  }));
  host.replaceChildren(
    hbars(rows, {
      domain: [0, 140],
      ticks: [0, 35, 70, 105, 140],
      fmt: (v) => v.toFixed(0),
      labelW: 190,
      valueW: 50,
      rowH: 30,
      aria: "The clients with the most filings from a single firm; dark bars are health care",
    }),
  );
}

function drawLottery(data, host) {
  const colorFor = { "All employers": "--ink", "Placing firms": "--w4-more-client", "Direct employers": "--w4-more-employer" };
  const series = data.series.map((s) => ({
    label: s.label,
    values: s.values,
    colorToken: colorFor[s.label] ?? "--ink",
    tip: `${s.label}: ${s.values[0].toFixed(1)} registrations per approval in ${data.draws[0]}, ${s.values[1].toFixed(1)} in ${data.draws[1]}`,
  }));
  host.replaceChildren(
    slope(series, {
      domain: [3, 10],
      labels: data.draws,
      fmt: (v) => v.toFixed(1),
      aria: "Registrations per approved petition, by kind of employer, March 2022 against March 2023",
    }),
  );
}

const DRAWERS = {
  perm: drawPerm,
  "countries-top": drawCountriesTop,
  "countries-modularity": drawCountriesModularity,
  density: drawDensity,
  strength: drawStrength,
  lottery: drawLottery,
};

async function render() {
  const hosts = [...document.querySelectorAll("[data-more]")];
  if (!hosts.length) return;
  try {
    const data = await load();
    for (const host of hosts) {
      const key = host.dataset.more;
      const section = key.startsWith("countries") ? "countries" : key;
      const draw = DRAWERS[key];
      if (draw) draw(data[section], host);
    }
  } catch (err) {
    console.error("week04-vis-more", err);
  }
}

render();
