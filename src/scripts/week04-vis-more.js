// Week 4 deep dive, the deeper-* boxes spread over the topics: a figure for
// each of the five text-only ones. Built from public/weeks/week04/data/more.json
// (analysis/week04_more_page.py), which copies its numbers out of
// week04_perm.json, week04_countries.json, week04_oews.json, week04_ties.json
// and week04_lottery.json, plus USCIS's per-draw totals. The browser computes
// only the two ratios of the draws chart from those totals. This module builds
// each figure's spec; the strip island (src/features/week04/strips/) draws
// them as plain SVG, colours read from CSS tokens.

function pct(v) {
  return `${Math.round(v * 100)}%`;
}

function perm(data) {
  const rows = data.rows.map((e) => ({
    label: e.label,
    sub: `${e.lca_filings.toLocaleString("en-US")} H-1B filings`,
    real: e.ratio,
    realLabel: e.ratio.toFixed(0),
    divider: e.label === "Amazon",
  }));
  return {
    kind: "strip",
    rows,
    opts: {
      domain: [0, 100],
      ticks: [0, 25, 50, 75, 100],
      fmt: (v) => v.toFixed(0),
      labelW: 150,
      badgeW: 20,
      rowH: 44,
      top: 20,
      ref: [data.median_ratio, `median employer ${data.median_ratio.toFixed(1)}`],
      aria: "Green cards per 100 H-1B filings for six employers named in the text",
    },
  };
}

function countriesTop(data) {
  return {
    kind: "rankbars",
    rows: data.top.map((c) => ({
      label: c.country,
      value: c.share * 100,
      valueLabel: pct(c.share),
      tip: `${c.country}: ${pct(c.share)} of the counted green-card filings`,
    })),
    opts: {
      domain: [0, 55],
      ticks: [0, 10, 20, 30, 40, 50],
      fmt: (v) => `${v.toFixed(0)}%`,
      valueW: 50,
      rowH: 26,
      aria: "Shares of 2023 certified green-card filings by citizenship, in the counted cells",
    },
  };
}

function countriesModularity(data) {
  const sign = (z) => (z >= 0 ? `z = ${z.toFixed(1)}` : `z = −${Math.abs(z).toFixed(1)}`);
  const row = (label, m) => ({
    label,
    sub: "against rewired",
    real: m.real,
    realLabel: m.real.toFixed(2),
    base: [m.null, m.null_sd],
    baseLabel: `rewired ${m.null.toFixed(2)}`,
    badge: sign(m.z),
  });
  return {
    kind: "strip",
    rows: [row("Links counted once", data.modularity.unweighted), row("Weighted by green cards", data.modularity.weighted)],
    opts: {
      domain: [0, 0.5],
      ticks: [0, 0.1, 0.2, 0.3, 0.4, 0.5],
      fmt: (v) => v.toFixed(1),
      labelW: 170,
      badgeW: 76,
      aria: "Modularity of the country network against rewired copies",
    },
  };
}

function density(data) {
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
  return {
    kind: "rankbars",
    rows,
    opts: {
      domain: [0, 45],
      ticks: [0, 10, 20, 30, 40],
      fmt: (v) => v.toFixed(0),
      valueW: 50,
      rowH: 28,
      refValue: data.national_rate,
      refLabel: `national ${data.national_rate.toFixed(1)}`,
      aria: "Certified H-1B filings per 1,000 jobs by metro",
    },
  };
}

function strength(data) {
  return {
    kind: "rankbars",
    rows: data.rows.map((c) => ({
      label: c.label,
      value: c.strength,
      valueLabel: c.strength.toLocaleString("en-US"),
      bold: c.health_care,
      tip: `${c.label}: ${c.strength} filings from a single firm${c.health_care ? " (health care)" : ""}`,
    })),
    opts: {
      domain: [0, 140],
      ticks: [0, 35, 70, 105, 140],
      fmt: (v) => v.toFixed(0),
      valueW: 50,
      rowH: 30,
      aria: "The clients with the most filings from a single firm; dark bars are health care",
    },
  };
}

function lottery(data) {
  const colorFor = { "All employers": "--ink", "Placing firms": "--w4-more-client", "Direct employers": "--w4-more-employer" };
  return {
    kind: "slope",
    series: data.series.map((s) => ({
      label: s.label,
      values: s.values,
      colorToken: colorFor[s.label] ?? "--ink",
      tip: `${s.label}: ${s.values[0].toFixed(1)} registrations per approval in ${data.draws[0]}, ${s.values[1].toFixed(1)} in ${data.draws[1]}`,
    })),
    opts: {
      domain: [3.5, 10],
      labels: data.draws,
      fmt: (v) => v.toFixed(1),
      aria: "Registrations per approved petition, by kind of employer, March 2022 against March 2023",
    },
  };
}

/**
 * Every H-1B registration draw since 2020 from USCIS's published totals:
 * eligible registrations per selected registration as a line, with the share
 * of registrations for a worker registered more than once under each date.
 * "selected" counts every selection round of a cap year, not the March round
 * alone. The two draws the slopegraph splits by employer sit in a band.
 * Geometry from the redesign's lot.py.
 */
function draws(data) {
  // A browser that cached more.json before the per-draw totals existed has no
  // all_draws; leave the figure empty rather than throw.
  if (!Array.isArray(data.all_draws) || data.all_draws.length < 2) return null;
  const rows = data.all_draws.map((d) => ({ ...d, per: d.eligible / d.selected, multi: d.multiple / d.eligible }));
  return { kind: "draws", rows, hl: new Set(data.draws) };
}

/** The draws chart's geometry at width W; `measure(text, role, weight)` is the text width. */
export function drawsLayout(rows, hl, W, measure) {
  const H = 250;
  // The end columns' labels are centred on their points: keep them inside.
  const edge = Math.max(...rows.map((r) => measure(`${r.label.split(" ")[0].slice(0, 3)} ${r.label.split(" ")[1]}`, "caption", 700))) / 2 + 2;
  const [L, R, T, B] = [Math.max(44, edge), Math.max(20, edge), 30, 56];
  const X = (i) => L + (i * (W - L - R)) / (rows.length - 1);
  const ymax = Math.max(4.5, Math.ceil(Math.max(...rows.map((r) => r.per)) + 0.5));
  const Y = (v) => T + (H - T - B) * (1 - v / ymax);
  const idx = rows.map((r, i) => (hl.has(r.label) ? i : -1)).filter((i) => i >= 0);
  const band = idx.length ? { x0: X(Math.min(...idx)) - 26, x1: X(Math.max(...idx)) + 26 } : null;
  const grid = [];
  for (let v = 0; v < ymax; v += 1) grid.push({ v, y: Y(v) });
  // USCIS drew by worker, not by registration, from the March 2024 draw.
  const byWorker = rows.findIndex((r) => r.label === "March 2024");
  let split = null;
  if (byWorker > 0) {
    const xm = (X(byWorker - 1) + X(byWorker)) / 2;
    const note = "one entry per worker from here";
    const fits = xm + 6 + measure(note, "caption") <= W;
    split = { xm, note, x: fits ? xm + 6 : xm - 6, anchor: fits ? "start" : "end" };
  }
  const fmtN = (n) => n.toLocaleString("en-US");
  const points = rows.map((r, i) => {
    const [mon, yr] = r.label.split(" ");
    return {
      x: X(i),
      y: Y(r.per),
      on: hl.has(r.label),
      first: i === 0,
      value: r.per.toFixed(1),
      date: `${mon.slice(0, 3)} ${yr}`,
      multi: `${pct(r.multi)} multi`,
      tip:
        `${r.label}: ${fmtN(r.eligible)} eligible registrations, ${fmtN(r.selected)} selected over all of that year's selection rounds, ` +
        `${r.per.toFixed(1)} per selected registration; ${pct(r.multi)} for workers registered more than once`,
    };
  });
  return {
    W,
    H,
    L,
    R,
    T,
    B,
    band,
    grid,
    split,
    line: rows.map((r, i) => `${X(i)},${Y(r.per)}`).join(" "),
    points,
    aria: `Eligible registrations per selected registration, every draw from ${rows[0].label} to ${rows.at(-1).label}`,
  };
}

// The more.json section each figure reads.
function sectionOf(key) {
  if (key.startsWith("countries")) return "countries";
  if (key === "draws") return "lottery";
  return key;
}

const DRAWERS = {
  perm,
  "countries-top": countriesTop,
  "countries-modularity": countriesModularity,
  density,
  strength,
  lottery,
  draws,
};

/** The spec of the [data-more] figure `key`, from more.json. */
export function moreSpec(key, data) {
  const draw = DRAWERS[key];
  return draw ? draw(data[sectionOf(key)]) : null;
}

/** Every [data-more] key. */
export const MORE_KEYS = Object.keys(DRAWERS);
