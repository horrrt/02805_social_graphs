// Week 4 redesign · five years of filings, FY2022 to FY2026, in the deep
// dive's #cut-years box. Draws eight panels of plain SVG from
// docs/weeks/week04/data/years.json (written by analysis/week04_years.py),
// coloured from the page's own CSS tokens, and renders once the box is
// first opened (or immediately if it is already open, such as a deep link).
import { esc } from "./cabinet.js";

const box = document.querySelector("#cut-years");
const body = document.querySelector("#years-body");
const status = document.querySelector("#years-status");

const YEARS = ["2022", "2023", "2024", "2025", "2026"];
// Data keys read "FY2025"; the page writes the plain year.
const yr = (s) => String(s).replace(/^FY(\d{4})/, "$1");
const MONTHS = ["Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun"];
const FOUR_FIRMS = ["Tata Consultancy Services", "Cognizant", "Infosys", "HCL"];

const whole = new Intl.NumberFormat("en-US");
const num = (v) => whole.format(Math.round(v));
const pct = (v, d = 1) => `${(v * 100).toFixed(d)}%`;

function tok(name) {
  const v = getComputedStyle(document.body).getPropertyValue(name).trim();
  return v || "currentColor";
}

// Colours, read once per render so a theme switch (if the page ever adds
// one) is picked up.
function palette() {
  return {
    ink: tok("--ink"),
    inkSoft: tok("--ink-soft"),
    inkMute: tok("--ink-mute"),
    people: tok("--people"),
    access: tok("--access"),
    grid: tok("--w4-grid"),
    line: tok("--line"),
    card: tok("--card"),
  };
}

// ---------------------------------------------------------------- SVG marks

const svgOpen = (w, h, aria) =>
  `<svg aria-label="${esc(aria)}" role="img" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">`;
const lineEl = (x1, y1, x2, y2, stroke, sw = 1, opts = {}) =>
  `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${stroke}" ` +
  `stroke-width="${sw}"${opts.dash ? ` stroke-dasharray="${opts.dash}"` : ""}${opts.op != null ? ` stroke-opacity="${opts.op}"` : ""} ` +
  `stroke-linecap="${opts.cap || "butt"}"></line>`;
const rectEl = (x, y, w, h, fill, rx = 0, stroke, sw = 1, title = "") =>
  `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${Math.max(w, 0).toFixed(1)}" height="${Math.max(h, 0).toFixed(1)}" fill="${fill}" rx="${rx}"` +
  `${stroke ? ` stroke="${stroke}" stroke-width="${sw}"` : ""}>${title ? `<title>${esc(title)}</title>` : ""}</rect>`;
const circleEl = (cx, cy, r, fill, stroke, sw = 1.5, title = "") =>
  `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${r}" fill="${fill}"${stroke ? ` stroke="${stroke}" stroke-width="${sw}"` : ""}>` +
  `${title ? `<title>${esc(title)}</title>` : ""}</circle>`;
const textEl = (x, y, s, size = 11, fill = "", weight = 400, anchor = "start") =>
  `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" font-size="${size}" fill="${fill}" font-weight="${weight}" text-anchor="${anchor}" ` +
  `font-variant-numeric="tabular-nums">${esc(s)}</text>`;
const pathEl = (d, stroke, sw = 1, opts = {}) =>
  `<path d="${d}" fill="none" stroke="${stroke}" stroke-width="${sw}"${opts.dash ? ` stroke-dasharray="${opts.dash}"` : ""}` +
  `${opts.op != null ? ` stroke-opacity="${opts.op}"` : ""} stroke-linejoin="round" stroke-linecap="round"></path>`;

// A zero-based axis: the lowest round top tick that holds vmax in three to
// six steps. Ported from review/week04-redesign/generator/extra.py:nice_axis.
function niceAxis(vmax) {
  let best = null;
  const mag = 10 ** Math.floor(Math.log10(vmax / 4));
  for (const m of [1, 2, 2.5, 5, 10, 20]) {
    const step = m * mag;
    const top = step * Math.ceil(vmax / step);
    const n = top / step;
    if (n >= 3 && n <= 6 && (!best || top < best.top)) best = { step, top };
  }
  return best || { step: vmax / 4, top: vmax };
}

// Nudge label y positions apart so no two sit closer than gap, keeping their
// order. Ported from extra.py:spread.
function spread(ys, gap = 13) {
  const order = [...ys.keys()].sort((a, b) => ys[a] - ys[b]);
  const pos = order.map((i) => ys[i]);
  for (let pass = 0; pass < 60; pass++) {
    let moved = false;
    for (let k = 1; k < pos.length; k++) {
      const d = pos[k] - pos[k - 1];
      if (d < gap - 0.01) {
        pos[k - 1] -= (gap - d) / 2;
        pos[k] += (gap - d) / 2;
        moved = true;
      }
    }
    if (!moved) break;
  }
  const out = new Array(ys.length);
  order.forEach((i, k) => (out[i] = pos[k]));
  return out;
}

// ---------------------------------------------------------------- panels

// One series over FY2022 to FY2026, or fewer years for a firm without a
// full run: the last point is hollow and joined with a dashed segment when
// the series is the full five years (this fiscal year is still in progress).
function yearLine(series, width, height, fmt, aria, pal, color, full = true) {
  const L = 56, R = 24, T = 18, Bm = 30;
  const vals = series.map((s) => s.v);
  const range = Math.max(...vals) - Math.min(...vals) || Math.max(...vals) * 0.2 || 1;
  const yMax = Math.max(...vals) + range * 0.6;
  const yMin = Math.max(0, Math.min(...vals) - range * 0.6);
  const x = (i) => L + (i * (width - L - R)) / (series.length - 1);
  const y = (v) => T + ((yMax - v) * (height - T - Bm)) / (yMax - yMin);
  const out = [svgOpen(width, height, aria)];
  for (let k = 0; k < 4; k++) {
    const v = yMin + ((yMax - yMin) * k) / 3;
    out.push(lineEl(L, y(v), width - R, y(v), pal.grid, 1));
    out.push(textEl(L - 8, y(v) + 4, fmt(v), 11, pal.inkMute, 400, "end"));
  }
  const pts = series.map((s, i) => [x(i), y(s.v)]);
  const solid = full ? pts.slice(0, -1) : pts;
  out.push(pathEl("M" + solid.map(([px, py]) => `${px.toFixed(1)} ${py.toFixed(1)}`).join(" L"), color, 2.4));
  if (full) out.push(lineEl(pts.at(-2)[0], pts.at(-2)[1], pts.at(-1)[0], pts.at(-1)[1], color, 2, { dash: "4 4" }));
  series.forEach((s, i) => {
    const [px, py] = pts[i];
    const last = full && i === series.length - 1;
    out.push(circleEl(px, py, 5, last ? pal.card : color, color, 2, `${s.label}: ${fmt(s.v)}`));
    out.push(textEl(px, py - 11, fmt(s.v), 11.5, pal.ink, 700, "middle"));
    out.push(textEl(px, height - 10, s.label, 11, pal.inkMute, last ? 400 : 600, "middle"));
  });
  out.push("</svg>");
  return out.join("\n");
}

// Two series over the five fiscal years, labelled at their ends. Ported
// from extra.py:two_lines.
function twoLines(a, b, width, height, fmt, aria, pal, names, colors) {
  const L = 56, R = 110, T = 18, Bm = 30;
  const { step, top } = niceAxis(Math.max(...a, ...b));
  const yMax = top;
  const x = (i) => L + (i * (width - L - R)) / 4;
  const y = (v) => T + ((yMax - v) * (height - T - Bm)) / yMax;
  const out = [svgOpen(width, height, aria)];
  for (let k = 0; k <= Math.round(top / step); k++) {
    const v = k * step;
    out.push(lineEl(L, y(v), width - R, y(v), v === 0 ? pal.line : pal.grid, 1));
    out.push(textEl(L - 8, y(v) + 4, fmt(v), 11, pal.inkMute, 400, "end"));
  }
  [[a, colors[0], names[0]], [b, colors[1], names[1]]].forEach(([series, col, name]) => {
    const pts = series.map((v, i) => [x(i), y(v)]);
    out.push(pathEl("M" + pts.slice(0, -1).map(([px, py]) => `${px.toFixed(1)} ${py.toFixed(1)}`).join(" L"), col, 2.4));
    out.push(lineEl(pts.at(-2)[0], pts.at(-2)[1], pts.at(-1)[0], pts.at(-1)[1], col, 2, { dash: "4 4" }));
    pts.forEach(([px, py], i) => {
      const last = i === 4;
      out.push(circleEl(px, py, 4.5, last ? pal.card : col, col, 2, `${YEARS[i]} ${name}: ${fmt(series[i])}`));
      // The first point sits on the y-axis, so its centred label would land
      // on top of the axis's own tick labels whenever the two are close in
      // height; start-anchor it just to the right of the point instead.
      const first = i === 0;
      out.push(textEl(first ? px + 6 : px, py - 10, fmt(series[i]), 11, pal.ink, 700, first ? "start" : "middle"));
    });
    out.push(textEl(pts.at(-1)[0] + 12, pts.at(-1)[1] + 4, name, 12, pal.ink, 700, "start"));
  });
  YEARS.forEach((y_, i) => out.push(textEl(x(i), height - 10, y_, 11, pal.inkMute, 600, "middle")));
  out.push("</svg>");
  return out.join("\n");
}

// Ported from extra.py:year_bars.
function yearBars(series, width, height, fmt, aria, pal, { partialLast = true, sub = null } = {}) {
  const L = 12, R = 12, T = 26, Bm = 44;
  const n = series.length;
  const cw = (width - L - R) / n;
  const vmax = Math.max(...series.map((s) => s.v)) * 1.12;
  const out = [svgOpen(width, height, aria)];
  const base = height - Bm;
  series.forEach((s, i) => {
    const x = L + i * cw + cw * 0.18;
    const w = cw * 0.64;
    const h = ((base - T) * s.v) / vmax;
    const last = partialLast && i === n - 1;
    out.push(rectEl(x, base - h, w, h, last ? pal.card : pal.ink, 3, last ? pal.ink : null, 1.6, `${s.label}: ${fmt(s.v)}`));
    out.push(textEl(x + w / 2, base - h - 7, fmt(s.v), 11.5, pal.ink, 700, "middle"));
    out.push(textEl(x + w / 2, base + 16, s.label, 11, pal.inkSoft, 600, "middle"));
    if (sub && sub[i]) out.push(textEl(x + w / 2, base + 30, sub[i], 10.5, pal.inkMute, 400, "middle"));
  });
  out.push(lineEl(L, base, width - R, base, pal.line, 1));
  out.push("</svg>");
  return out.join("\n");
}

// October to June on one axis, one line per fiscal year, each labelled at
// its June end and every month marked with a hoverable point. Ported from
// extra.py:season_chart; older years fade by opacity instead of a second
// hue, since the tokens available are --ink and --people, not a ramp.
function seasonChart(rows, key, aria, pal, color, note) {
  const width = 552, height = 280;
  const L = 56, R = 62, T = 16, Bm = 30;
  const years = Object.keys(rows);
  const { step, top } = niceAxis(Math.max(...years.flatMap((y) => rows[y].map((m) => m[key]))));
  const x = (i) => L + (i * (width - L - R)) / 8;
  const y = (v) => T + ((top - v) * (height - T - Bm)) / top;
  const out = [svgOpen(width, height, aria)];
  for (let k = 0; k <= Math.round(top / step); k++) {
    const v = k * step;
    out.push(lineEl(L, y(v), width - R, y(v), v === 0 ? pal.line : pal.grid, 1));
    out.push(textEl(L - 8, y(v) + 4, num(v), 11, pal.inkMute, 400, "end"));
  }
  MONTHS.forEach((mo, i) => out.push(textEl(x(i), height - 10, mo, 11, pal.inkMute, 400, "middle")));
  const ends = [];
  years.forEach((yy, yi) => {
    const newest = yi === years.length - 1;
    const opacity = years.length === 1 ? 1 : 0.35 + (0.65 * yi) / (years.length - 1);
    const pts = rows[yy].map((m, i) => [x(i), y(m[key])]);
    out.push(pathEl("M" + pts.map(([px, py]) => `${px.toFixed(1)} ${py.toFixed(1)}`).join(" L"), color, newest ? 2.6 : 2, { op: opacity }));
    rows[yy].forEach((m, i) => {
      const [px, py] = pts[i];
      out.push(circleEl(px, py, newest ? 3 : 2.2, color, pal.card, 1.2, `${yr(yy)}, ${MONTHS[i]}: ${num(m[key])}`) .replace("<circle", `<circle opacity="${opacity}"`));
    });
    ends.push(pts.at(-1)[1]);
  });
  spread(ends).forEach((ly, i) => {
    const yy = years[i];
    const newest = i === years.length - 1;
    out.push(textEl(width - R + 8, ly + 4, yr(yy), 11.5, newest ? pal.ink : pal.inkMute, newest ? 700 : 600, "start"));
  });
  if (note) {
    const [i, label] = note;
    const yy = years.at(-1);
    const m = rows[yy][i];
    out.push(circleEl(x(i), y(m[key]), 4.5, pal.card, color, 2, label));
    out.push(textEl(x(i) + 12, y(m[key]) - 6, label, 11.5, pal.ink, 700, "start"));
  }
  out.push("</svg>");
  return out.join("\n");
}

// A small multiple per firm: filings per fiscal year, dashed and hollow at
// the end when the firm ran the full five years. Ported from
// extra.py:mini_years.
function miniYears(series, ymax, pal) {
  const width = 262, height = 150;
  const L = 8, R = 8, T = 20, Bm = 24;
  const full = series.length === 5;
  const x = (i) => L + (i * (width - L - R)) / 4;
  const y = (v) => T + ((ymax - v) * (height - T - Bm)) / ymax;
  const out = [svgOpen(width, height, "Filings per fiscal year")];
  out.push(lineEl(L, y(0), width - R, y(0), pal.line, 1));
  const pts = series.map((s, i) => [x(i), y(s.v)]);
  const solid = full ? pts.slice(0, -1) : pts;
  out.push(pathEl("M" + solid.map(([px, py]) => `${px.toFixed(1)} ${py.toFixed(1)}`).join(" L"), pal.ink, 2.2));
  if (full) out.push(lineEl(pts.at(-2)[0], pts.at(-2)[1], pts.at(-1)[0], pts.at(-1)[1], pal.ink, 1.8, { dash: "4 4" }));
  series.forEach((s, i) => {
    const [px, py] = pts[i];
    const last = full && i === series.length - 1;
    out.push(circleEl(px, py, 4, last ? pal.card : pal.ink, pal.ink, 1.6, `${s.label}: ${num(s.v)}`));
    out.push(textEl(px, py - 8, num(s.v), 10.5, pal.ink, 700, "middle"));
    out.push(textEl(px, height - 6, s.label, 10.5, pal.inkMute, 400, "middle"));
  });
  out.push("</svg>");
  return out.join("\n");
}

function panel(title, caption, svg, span = 1) {
  return `<div class="years-panel"${span > 1 ? ' data-span="2"' : ""}><h3>${esc(title)}</h3><p>${esc(caption)}</p>${svg}</div>`;
}

// ---------------------------------------------------------------- the box

function render(data) {
  const pal = palette();
  const ys = data.years;

  const cert = YEARS.map((y) => ({ label: y, v: ys[y].certified_filings }));
  const s1 = yearBars(cert, 540, 250, num, "Certified H-1B filings per fiscal year", pal,
    { sub: ["", "", "", "", "Oct–Jun only"] });

  const oj = data.oct_jun.totals;
  const like = ["FY2024", "FY2025", "FY2026"].map((fy) => ({ label: yr(fy), v: oj[fy].certified_filings }));
  const s1b = yearBars(like, 540, 220, num, "Certified filings from October to June, three years", pal, { partialLast: false });

  const rows = { FY2024: data.monthly.FY2024, FY2025: data.monthly.FY2025, FY2026: data.monthly.FY2026 };
  const oct25 = rows.FY2026[0];
  const monthlyHtml =
    '<div class="years-split">' +
    `<div><h4>Certified filings</h4>${seasonChart(rows, "certified_filings",
      "Certified H-1B filings per month, October to June, 2024 to 2026", pal, pal.ink,
      [0, `Shutdown, October 2025: ${num(oct25.certified_filings)}`])}</div>` +
    `<div><h4>Placed at a client</h4>${seasonChart(rows, "placed_filings",
      "Certified filings that place the worker at a client, per month, October to June, 2024 to 2026", pal, pal.people)}</div>` +
    "</div>";

  const share = YEARS.map((y) => ({ label: y, v: ys[y].placed_share }));
  const s3 = yearLine(share, 540, 230, (v) => pct(v), "Share of certified filings that place a worker at a client", pal, pal.people);

  const per = {};
  YEARS.forEach((y) => {
    per[y] = Object.fromEntries(ys[y].top_firms_by_filings);
  });
  const ymaxF = Math.max(...FOUR_FIRMS.flatMap((f) => YEARS.map((y) => per[y][f] || 0))) * 1.18;
  const firmsHtml = '<div class="years-firms">' + FOUR_FIRMS.map((f) => {
    const full = YEARS.map((y) => ({ label: y.replace("20", "’"), v: per[y][f] }));
    const have = full.filter((s) => s.v != null);
    const series = have.length < 5 ? have : full;
    return `<div class="years-firm"><span>${esc(f)}</span>${miniYears(series, ymaxF, pal)}</div>`;
  }).join("") + "</div>";

  const denialA = data.uscis_series.map((r) => r.placing_initial_denial_rate);
  const denialB = data.uscis_series.map((r) => r.direct_initial_denial_rate);
  const s5 = twoLines(denialA, denialB, 540, 240, (v) => pct(v),
    "USCIS denials of first-time petitions, placing firms against direct employers", pal,
    ["placing firms", "direct employers"], [pal.people, pal.access]);

  // Each draw is held the March before the cap year it fills.
  const capYears = Object.keys(data.lottery_draws).sort();
  const drawMonth = (capYear) => `March ${Number(capYear) - 1}`;
  const draws = capYears.map((y) => ({ label: drawMonth(y), v: data.lottery_draws[y].registrations }));
  const s6 = yearBars(draws, 540, 230, num, "H-1B lottery registrations per draw", pal,
    { partialLast: false, sub: capYears.map((y) => `${y} cap`) });
  const funnelYears = Object.keys(data.lottery_funnels).sort();
  const perApp = funnelYears.map((y) => data.lottery_funnels[y].registrations_per_approval);

  const clients = YEARS.map((y) => ys[y].clients);
  const firms = YEARS.map((y) => ys[y].firms);
  const s7 = twoLines(clients, firms, 540, 240, num, "Client companies and placing firms per year", pal,
    ["client companies", "firms that place"], [pal.ink, pal.people]);

  const f = data.finding;
  const lead =
    `Certified filings fell ${Math.abs(f.fy22_to_fy23_certified_change_percent)}% in 2023, rose to ` +
    `${num(f.fy2025_certified_filings)} in 2025, and fell ${Math.abs(f.fy25_to_fy26_certified_change_percent).toFixed(1)}% in ` +
    "2026 against the same months a year earlier. The share placed at a client fell every year from 2023: " +
    `${pct(ys["2023"].placed_share)}, ${pct(ys["2024"].placed_share)}, ${pct(ys["2025"].placed_share)}, and ` +
    `${pct(ys["2026"].placed_share)} from October 2025 to June 2026.`;
  const noticeText =
    "Each year runs October to September. 2026 covers October 2025 to June 2026 and is drawn hollow. October 2025, the month " +
    `of the federal shutdown, holds ${num(f.oct_2025_certified_filings)} certified filings against ` +
    `${num(f.oct_2024_certified_filings)} a year earlier, so compare 2026 with earlier years on matching months.`;

  const r = (cells) => `<tr>${cells.map((c, i) => `<td${i ? ' style="text-align:right"' : ""}>${c}</td>`).join("")}</tr>`;
  const thead = (cols) => `<thead><tr>${cols.map((c, i) => `<th${i ? ' style="text-align:right"' : ""}>${esc(c)}</th>`).join("")}</tr></thead>`;

  const perFyTable = `<table class="ego"><caption>Certified filings, placed share, clients, firms and USCIS denial rates, per fiscal year</caption>` +
    thead(["Year", "Certified filings", "Placed at a client", "Clients", "Firms", "Placing firms’ denials", "Direct employers’ denials"]) +
    "<tbody>" + YEARS.map((y, i) => r([
      `${y}${y === "2026" ? ", Oct–Jun" : ""}`, num(ys[y].certified_filings), pct(ys[y].placed_share),
      num(ys[y].clients), num(ys[y].firms), pct(data.uscis_series[i].placing_initial_denial_rate),
      pct(data.uscis_series[i].direct_initial_denial_rate),
    ])).join("") + "</tbody></table>";

  const octJunTable = `<table class="ego"><caption>Certified filings, October to June, three fiscal years</caption>` +
    thead(["Year", "Certified filings"]) + "<tbody>" +
    ["FY2024", "FY2025", "FY2026"].map((fy) => r([yr(fy), num(oj[fy].certified_filings)])).join("") +
    `</tbody></table><p>2026 against 2025: ${data.oct_jun.certified_filings_change_fy25_fy26_percent.toFixed(1)}%.</p>`;

  const monthlyTable = `<table class="ego"><caption>Certified and placed filings per month, October to June, 2024 to 2026</caption>` +
    thead(["Month", "2024 certified", "2025 certified", "2026 certified", "2024 placed", "2025 placed", "2026 placed"]) +
    "<tbody>" + MONTHS.map((mo, i) => r([mo,
      num(rows.FY2024[i].certified_filings), num(rows.FY2025[i].certified_filings), num(rows.FY2026[i].certified_filings),
      num(rows.FY2024[i].placed_filings), num(rows.FY2025[i].placed_filings), num(rows.FY2026[i].placed_filings),
    ])).join("") + "</tbody></table>";

  const firmsTable = `<table class="ego"><caption>Placed filings for the four largest placing firms, per fiscal year</caption>` +
    thead(["Firm", ...YEARS.map((y) => `${y}${y === "2026" ? " (Oct–Jun)" : ""}`)]) + "<tbody>" +
    FOUR_FIRMS.map((firm) => r([firm, ...YEARS.map((y) => (per[y][firm] != null ? num(per[y][firm]) : "–"))])).join("") +
    "</tbody></table>";

  const lotteryTable = `<table class="ego"><caption>H-1B lottery: registrations per draw and registrations per approval</caption>` +
    thead(["Draw", "Cap year", "Registrations", "Registrations per approval"]) + "<tbody>" +
    capYears.map((y) => r([drawMonth(y), y, num(data.lottery_draws[y].registrations),
      data.lottery_funnels[y] ? data.lottery_funnels[y].registrations_per_approval.toFixed(2) : "–"])).join("") +
    "</tbody></table>";

  const alt = '<details class="years-alt"><summary>The numbers behind these charts</summary>' +
    perFyTable + octJunTable + monthlyTable + firmsTable + lotteryTable + "</details>";

  body.innerHTML =
    `<header class="w4-opener"><span aria-hidden="true" class="w4-opener-num">↗</span>` +
    `<div><h2>Five years of filings</h2><p>${esc(lead)}</p></div></header>` +
    `<div class="notice"><span class="ico">!</span><span><b>How to read the years.</b> ${esc(noticeText)}</span></div>` +
    '<div class="years-grid">' +
    panel("Certified H-1B filings", "Each fiscal year. 2026 is outlined: nine months, not a year.", s1) +
    panel("The same months, compared", "October to June of each year: the fair way to set 2026 beside the two before it.", s1b) +
    panel("Month by month", "October to June of each fiscal year, the months 2026 covers.", monthlyHtml, 2) +
    panel("Placed at a client", "Share of certified filings that put the worker at another company.", s3) +
    panel("USCIS denials", `Share of first-time petitions denied, employers with ${data.uscis_min_filings} or more certified filings. 2026 runs October to June.`, s5) +
    panel("The four largest placing firms",
      `Placed filings each firm files per fiscal year, on one scale. Hollow: 2026, nine months. HCL leaves the top ` +
      `${ys["2026"].top_firms_by_filings.length} in 2026.`, firmsHtml, 2) +
    panel("The lottery",
      `Registrations per draw. One approved petition took ${perApp[0].toFixed(1)} registrations in the ${drawMonth(funnelYears[0])} ` +
      `draw and ${perApp[1].toFixed(1)} in ${drawMonth(funnelYears[1])}; USCIS’s data ends there.`, s6) +
    panel("Clients and firms", "Client companies named on a placed filing, and the firms that place workers, per fiscal year.", s7) +
    "</div>" + alt;
}

let rendered = false;
function load() {
  if (rendered) return;
  rendered = true;
  fetch(new URL("../../weeks/week04/data/years.json", import.meta.url))
    .then((r) => r.json())
    .then(render)
    .catch(() => {
      status.textContent = "The five years of filings did not load.";
      rendered = false;
    });
}

if (box.open) load();
box.addEventListener("toggle", () => {
  if (box.open) load();
});
