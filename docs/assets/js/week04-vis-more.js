// Week 4 deep dive, the deeper-* boxes spread over the topics: a figure for
// each of the five text-only ones. Built from docs/weeks/week04/data/more.json
// (analysis/week04_more_page.py), which copies its numbers out of
// week04_perm.json, week04_countries.json, week04_oews.json, week04_ties.json
// and week04_lottery.json, plus USCIS's per-draw totals. The browser computes
// only the two ratios of the draws chart from those totals. Plain SVG,
// colours read from CSS tokens, like week04-strip.js.

import { node, token, stripChart, fitted, fs, textWidth } from "./week04-strip.js?v=2";

const DATA = new URL("../../weeks/week04/data/more.json?v=2", import.meta.url);

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
function smartText(x, y, text, lo, hi, { role = "caption", fill, weight = 400, anchorOverride } = {}) {
  const size = fs(role);
  const half = textWidth(text, role, weight) / 2;
  const anchor = anchorOverride ?? (x - half < lo ? "start" : x + half > hi ? "end" : "middle");
  const at = anchor === "start" ? lo : anchor === "end" ? hi : x;
  return node("text", { x: at, y, "font-size": size, fill: fill ?? token("--ink-soft"), "font-weight": weight, "text-anchor": anchor }, text);
}

/**
 * A horizontal bar per row on a shared axis, real values only (no baseline
 * band): the form the redesign canvas's deep.py uses for a plain ranking.
 * rows: { label, sub, value, valueLabel, tip, bold, outline }. Drawn at the
 * host's width (see fitted in week04-strip.js).
 */
function hbars(rows, opts) {
  return fitted((width) => drawHbars(rows, { ...opts, width }), opts.width ?? 556);
}

function drawHbars(rows, { domain, ticks, fmt, width = 556, valueW = 54, rowH = 32, ref, refLabel, aria, top = 8 }) {
  const [d0, d1] = domain;
  const small = fs("small");
  const caption = fs("caption");
  const x0 = Math.ceil(Math.max(...rows.map((r) => textWidth(r.label, "small", r.bold ? 700 : 600)))) + 12;
  const x1 = width - Math.max(valueW, Math.ceil(Math.max(...rows.map((r) => textWidth(r.valueLabel ?? fmt(r.value), "small", 700)))) + 12);
  const X = (v) => x0 + ((Math.min(Math.max(v, d0), d1) - d0) * (x1 - x0)) / (d1 - d0);
  const ybot = top + rows.length * rowH;
  const h = ybot + 30 + (refLabel ? 14 : 0);
  const svg = node("svg", { viewBox: `0 0 ${width} ${h}`, width, height: h, role: "img", "aria-label": aria, class: "w4-strip" });
  for (const tv of ticks) {
    svg.append(node("line", { x1: X(tv), y1: top - 4, x2: X(tv), y2: ybot, stroke: token("--w4-grid"), "stroke-width": 1 }));
    svg.append(node("text", { x: X(tv), y: ybot + 16, "font-size": caption, fill: token("--ink-mute"), "text-anchor": "middle" }, fmt(tv)));
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
    svg.append(node("text", { x: 0, y: cy + 4.5, "font-size": small, fill: token("--ink"), "font-weight": r.bold ? 700 : 600 }, r.label));
    svg.append(node("line", { x1: x0, y1: cy, x2: x1, y2: cy, stroke: token("--line"), "stroke-width": 1 }));
    const bw = Math.max(X(r.value) - x0, 1);
    if (r.outline) {
      svg.append(titled(node("rect", { x: x0, y: cy - bh / 2, width: bw, height: bh, rx: 3, fill: "none", stroke: token("--ink"), "stroke-width": 1.6 }), r.tip));
    } else {
      svg.append(titled(node("rect", { x: x0, y: cy - bh / 2, width: bw, height: bh, rx: 3, fill: r.bold ? token("--ink") : token("--ink-mute") }), r.tip));
    }
    svg.append(node("text", { x: X(r.value) + 6, y: cy + 4.5, "font-size": small, "font-weight": 700, fill: token("--ink") }, r.valueLabel ?? fmt(r.value)));
  });
  return svg;
}

/**
 * Spread label baselines so no two sit closer than gap, keeping their order;
 * returns the adjusted y for each input y.
 */
function dodge(ys, gap) {
  const order = ys.map((y, i) => [y, i]).sort((p, q) => p[0] - q[0]);
  const out = [];
  let prev = -Infinity;
  for (const [y, i] of order) {
    prev = Math.max(y, prev + gap);
    out[i] = prev;
  }
  return out;
}

/**
 * Two columns joined by one line per series: the redesign canvas's slope
 * chart, for "before against after" comparisons. The series name and first
 * value sit left of the left column, the second value right of the right
 * one, so no label crosses a line; dodge() keeps each side's labels apart.
 * series: { label, values: [a, b], colorToken, tip }. Drawn at the host's
 * width; the columns sit just clear of the widest labels on each side.
 */
function slope(series, opts) {
  return fitted((width) => drawSlope(series, { ...opts, width }), opts.width ?? 556);
}

function drawSlope(series, { domain, labels, fmt, width = 556, height = 210, aria }) {
  const [d0, d1] = domain;
  const small = fs("small");
  const leftNeed = Math.max(...series.map((s) => textWidth(`${s.label} ${fmt(s.values[0])}`, "small", 700)));
  const rightNeed = Math.max(...series.map((s) => textWidth(fmt(s.values[1]), "small", 700)));
  const xl = Math.ceil(leftNeed) + 16;
  const xr = Math.min(width - Math.ceil(rightNeed) - 16, xl + 240);
  const top = 16;
  const bottom = height - 34;
  const Y = (v) => top + ((d1 - Math.min(Math.max(v, d0), d1)) * (bottom - top)) / (d1 - d0);
  const svg = node("svg", { viewBox: `0 0 ${width} ${height}`, width, height, role: "img", "aria-label": aria });
  for (const x of [xl, xr]) svg.append(node("line", { x1: x, y1: top - 8, x2: x, y2: bottom + 4, stroke: token("--w4-grid"), "stroke-width": 1 }));
  svg.append(node("text", { x: xl, y: height - 10, "font-size": small, fill: token("--ink-soft"), "font-weight": 600, "text-anchor": "middle" }, labels[0]));
  svg.append(node("text", { x: xr, y: height - 10, "font-size": small, fill: token("--ink-soft"), "font-weight": 600, "text-anchor": "middle" }, labels[1]));
  const leftY = dodge(series.map((s) => Y(s.values[0]) + 4), 15);
  const rightY = dodge(series.map((s) => Y(s.values[1]) + 4), 15);
  series.forEach((s, i) => {
    const [a, b] = s.values;
    const color = token(s.colorToken);
    const g = titled(node("g"), s.tip);
    g.append(node("line", { x1: xl, y1: Y(a), x2: xr, y2: Y(b), stroke: color, "stroke-width": 2.4 }));
    g.append(node("circle", { cx: xl, cy: Y(a), r: 4.5, fill: color }));
    g.append(node("circle", { cx: xr, cy: Y(b), r: 4.5, fill: color }));
    svg.append(g);
    svg.append(node("text", { x: xl - 10, y: leftY[i], "font-size": small, fill: color, "font-weight": 700, "text-anchor": "end" }, `${s.label} ${fmt(a)}`));
    svg.append(node("text", { x: xr + 10, y: rightY[i], "font-size": small, fill: color, "font-weight": 700, "text-anchor": "start" }, fmt(b)));
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
      aria: "Shares of 2023 certified green-card filings by citizenship, in the counted cells",
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
      domain: [3.5, 10],
      labels: data.draws,
      fmt: (v) => v.toFixed(1),
      aria: "Registrations per approved petition, by kind of employer, March 2022 against March 2023",
    }),
  );
}

/**
 * Every H-1B registration draw since 2020 from USCIS's published totals:
 * eligible registrations per selected registration as a line, with the share
 * of registrations for a worker registered more than once under each date.
 * "selected" counts every selection round of a cap year, not the March round
 * alone. The two draws the slopegraph splits by employer sit in a band.
 * Geometry from the redesign's lot.py.
 */
function drawDraws(data, host) {
  // A browser that cached more.json before the per-draw totals existed has no
  // all_draws; leave the figure empty rather than throw.
  if (!Array.isArray(data.all_draws) || data.all_draws.length < 2) return;
  const rows = data.all_draws.map((d) => ({ ...d, per: d.eligible / d.selected, multi: d.multiple / d.eligible }));
  const hl = new Set(data.draws);
  host.replaceChildren(fitted((W) => drawsChart(rows, hl, W), 556));
}

function drawsChart(rows, hl, W) {
  const H = 250;
  const caption = fs("caption");
  const small = fs("small");
  // The end columns' labels are centred on their points: keep them inside.
  const edge = Math.max(...rows.map((r) => textWidth(`${r.label.split(" ")[0].slice(0, 3)} ${r.label.split(" ")[1]}`, "caption", 700))) / 2 + 2;
  const [L, R, T, B] = [Math.max(44, edge), Math.max(20, edge), 30, 56];
  const X = (i) => L + (i * (W - L - R)) / (rows.length - 1);
  const ymax = Math.max(4.5, Math.ceil(Math.max(...rows.map((r) => r.per)) + 0.5));
  const Y = (v) => T + (H - T - B) * (1 - v / ymax);
  const ink = token("--ink");
  const fmtN = (n) => n.toLocaleString("en-US");
  const svg = node("svg", {
    viewBox: `0 0 ${W} ${H}`,
    width: W,
    height: H,
    role: "img",
    "aria-label": `Eligible registrations per selected registration, every draw from ${rows[0].label} to ${rows.at(-1).label}`,
  });
  const idx = rows.map((r, i) => (hl.has(r.label) ? i : -1)).filter((i) => i >= 0);
  if (idx.length) {
    const x0 = X(Math.min(...idx)) - 26;
    const x1 = X(Math.max(...idx)) + 26;
    svg.append(node("rect", { x: x0, y: T - 18, width: x1 - x0, height: H - B - T + 18, rx: 8, fill: token("--w4-accent-soft"), "fill-opacity": 0.5 }));
    svg.append(
      node("text", { x: (x0 + x1) / 2, y: T - 6, "font-size": caption, fill: token("--w4-accent"), "text-anchor": "middle" }, "The draws this box splits by employer"),
    );
  }
  for (let v = 0; v < ymax; v += 1) {
    svg.append(node("line", { x1: L, y1: Y(v), x2: W - R, y2: Y(v), stroke: token("--w4-grid"), "stroke-width": 1 }));
    svg.append(node("text", { x: L - 8, y: Y(v) + 4, "font-size": caption, fill: token("--ink-mute"), "text-anchor": "end" }, String(v)));
  }
  // USCIS drew by worker, not by registration, from the March 2024 draw.
  const byWorker = rows.findIndex((r) => r.label === "March 2024");
  if (byWorker > 0) {
    const xm = (X(byWorker - 1) + X(byWorker)) / 2;
    svg.append(node("line", { x1: xm, y1: T, x2: xm, y2: H - B, stroke: token("--ink-mute"), "stroke-width": 1, "stroke-dasharray": "3 3" }));
    const note = "one entry per worker from here";
    const fits = xm + 6 + textWidth(note, "caption") <= W;
    svg.append(node("text", { x: fits ? xm + 6 : xm - 6, y: H - B - 8, "font-size": caption, fill: token("--ink-soft"), "text-anchor": fits ? "start" : "end" }, note));
  }
  svg.append(
    node("polyline", {
      points: rows.map((r, i) => `${X(i)},${Y(r.per)}`).join(" "),
      fill: "none",
      stroke: ink,
      "stroke-width": 2.4,
      "stroke-linejoin": "round",
    }),
  );
  rows.forEach((r, i) => {
    const on = hl.has(r.label);
    const tip =
      `${r.label}: ${fmtN(r.eligible)} eligible registrations, ${fmtN(r.selected)} selected over all of that year's selection rounds, ` +
      `${r.per.toFixed(1)} per selected registration; ${pct(r.multi)} for workers registered more than once`;
    const g = titled(node("g"), tip);
    g.append(node("circle", { cx: X(i), cy: Y(r.per), r: on ? 5 : 4, fill: on ? ink : token("--card"), stroke: ink, "stroke-width": 2 }));
    // The first value starts at its point so it clears the y-axis numbers.
    const first = i === 0;
    g.append(
      node("text", { x: first ? X(i) - 4 : X(i), y: Y(r.per) - 10, "font-size": small, "font-weight": 700, fill: ink, "text-anchor": first ? "start" : "middle" }, r.per.toFixed(1)),
    );
    const [mon, yr] = r.label.split(" ");
    g.append(
      node("text", { x: X(i), y: H - B + 18, "font-size": caption, "font-weight": on ? 700 : 400, fill: on ? ink : token("--ink-soft"), "text-anchor": "middle" }, `${mon.slice(0, 3)} ${yr}`),
    );
    g.append(node("text", { x: X(i), y: H - B + 34, "font-size": caption, fill: token("--ink-mute"), "text-anchor": "middle" }, `${pct(r.multi)} multi`));
    svg.append(g);
  });
  return svg;
}

const DRAWERS = {
  perm: drawPerm,
  "countries-top": drawCountriesTop,
  "countries-modularity": drawCountriesModularity,
  density: drawDensity,
  strength: drawStrength,
  lottery: drawLottery,
  draws: drawDraws,
};

async function render() {
  const hosts = [...document.querySelectorAll("[data-more]")];
  if (!hosts.length) return;
  try {
    const data = await load();
    for (const host of hosts) {
      const key = host.dataset.more;
      const section = key.startsWith("countries") ? "countries" : key === "draws" ? "lottery" : key;
      const draw = DRAWERS[key];
      if (draw) draw(data[section], host);
    }
  } catch (err) {
    console.error("week04-vis-more", err);
  }
}

render();
