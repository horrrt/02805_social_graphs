// Week 5 · section 5 · Heaps' law of the Marvel universe. Owner: Niklas.
//
// What this section's islands (src/features/week05/heaps/) draw into its slots
// on src/app/(week05)/weeks/week05/_sections/Heaps.tsx: types seen against
// tokens read on log-log axes (#chart-heaps-curve), each order's gap to the
// random orders at two token counts (#chart-heaps-gap), the numbers behind
// both (#heaps-table), and the new words of the late pages (#heaps-samples,
// #heaps-passages).
// Data: public/weeks/week05/data/heaps.json, written by analysis/week05_heaps.py.
// No DOM, no listeners, no fetch.

/** heaps.json, which every part of the section waits for. */
export const HEAPS = "weeks/week05/data/heaps.json";

const count = (v) => Math.round(v).toLocaleString("en-GB");
const short = (v) => (v >= 1000 ? `${v / 1000}k` : `${v}`);
const signed = (v) => `${v < 0 ? "−" : "+"}${count(Math.abs(v))}`;
const zText = (z) => `z ${z < 0 ? "−" : "+"}${Math.abs(z).toFixed(1)}`;

const ORDER = {
  most: { label: "Most-linked first", key: "most_linked", colour: "--access" },
  least: { label: "Least-linked first", key: "least_linked", colour: "--people" },
};

/** The colour tokens the curve reads. */
export const CURVE_TOKENS = ["--line-soft", "--ink-mute", "--ink-soft", "--ink", "--w4-band", "--access", "--people", "--card"];

// ---- the figure: types against tokens, log-log, with the random band and the fit

/**
 * The curve's geometry at `width`: ticks, the band, the mean, the fit, the two
 * orders, the hover guide's marks, the overlay and the legend. Colours are
 * token names. at(p) places the guide at grid point p; nearest(x) is the grid
 * point nearest x in the svg's units.
 */
export function curveLayout(data, width) {
  const { grid, heaps: fit } = data;
  const [n0, n1] = [grid[0].tokens, grid.at(-1).tokens];
  const [v0, v1] = [Math.min(...grid.map((p) => Math.min(p.random_p5, p.most_linked, p.least_linked))), grid.at(-1).random_mean];
  const xTicks = [1e3, 1e4, 1e5].filter((t) => t >= n0 && t <= n1);
  const yTicks = [500, 1e3, 2e3, 5e3, 1e4, 2e4].filter((t) => t >= v0 && t <= v1);
  const height = Math.round(Math.min(380, width * 0.72));
  const [left, right, top, bottom] = [46, 16, 12, 40];
  const lx = (v) => Math.log10(v);
  const X = (n) => left + ((lx(n) - lx(n0)) / (lx(n1) - lx(n0))) * (width - left - right);
  const Y = (v) => top + (1 - (lx(v) - lx(v0 * 0.95)) / (lx(v1 * 1.05) - lx(v0 * 0.95))) * (height - top - bottom);
  const path = (pts) => pts.map(([n, v], i) => `${i ? "L" : "M"}${X(n).toFixed(1)},${Y(v).toFixed(1)}`).join("");
  // The random band, 5th to 95th percentile, and its mean.
  const band = [...grid.map((p) => [p.tokens, p.random_p95]), ...[...grid].reverse().map((p) => [p.tokens, p.random_p5])];
  // Heaps' law fitted to the random mean, over the fit range.
  const fitLine = grid.filter((p) => p.tokens >= fit.fit_from).map((p) => [p.tokens, fit.k * p.tokens ** fit.beta]);
  const marks = [["random_mean", "--ink-mute"], ["most_linked", ORDER.most.colour], ["least_linked", ORDER.least.colour]];
  // A legend in the empty top-left corner.
  const legend = [["Most-linked first", "--access"], ["Least-linked first", "--people"], ["Random orders", "--ink-mute"], ["Heaps' law fit", "--ink"]];
  return {
    width,
    height,
    aria: `Types seen against tokens read, log-log: most-linked first, least-linked first and ${data.meta.runs} random orders`,
    xTicks: xTicks.map((t) => ({ x: X(t), y1: top, y2: height - bottom, labelY: height - bottom + 16, label: short(t) })),
    yTicks: yTicks.map((t) => ({ y: Y(t), x1: left, x2: width - right, labelX: left - 6, labelY: Y(t) + 4, label: short(t) })),
    xTitle: { x: width - right, y: height - 6, text: "tokens read" },
    yTitle: { x: left, y: top - 2, text: "types seen" },
    band: `${path(band)}Z`,
    mean: path(grid.map((p) => [p.tokens, p.random_mean])),
    fit: path(fitLine),
    lines: Object.values(ORDER).map((o) => ({ d: path(grid.map((p) => [p.tokens, p[o.key]])), colour: o.colour })),
    guide: { y1: top, y2: height - bottom },
    marks: marks.map(([, colour]) => colour),
    overlay: { x: left, y: top, width: width - left - right, height: height - top - bottom },
    legend: legend.map(([label, colour], i) => {
      const y = top + 14 + i * 16;
      return { label, colour, x1: left + 12, y1: y - 4, x2: left + 32, y2: y - 4, dash: label.startsWith("Heaps") ? "5 4" : "none", textX: left + 38, y };
    }),
    nearest: (at) => grid.reduce((a, b) => (Math.abs(X(b.tokens) - at) < Math.abs(X(a.tokens) - at) ? b : a)),
    at: (p) => ({ x: X(p.tokens), ys: marks.map(([key]) => Y(p[key])) }),
  };
}

/** The curve's tip at grid point p. */
export function curveTip(p) {
  const gap = (key, z) => `${count(p[key])} types (${signed(p[key] - p.random_mean)}${z === null ? "" : `, ${zText(z)}`})`;
  return [
    `${count(p.tokens)} tokens read`,
    `Least-linked first: ${gap("least_linked", p.z_least_linked)}`,
    `Most-linked first: ${gap("most_linked", p.z_most_linked)}`,
    `Random orders: ${count(p.random_mean)} ± ${count(p.random_sd)}`,
  ];
}

// ---- beside it: each order's gap to the random mean at the two token counts

/** The gap strip chart's rows and options. */
export function gap(data) {
  const rows = [];
  for (const c of data.checkpoints) {
    for (const o of [ORDER.least, ORDER.most]) {
      const diff = c[o.key] - c.random_mean;
      const z = c[`z_${o.key}`];
      rows.push({
        label: o.label,
        sub: `after ${count(c.tokens)} tokens · ${c[`pages_${o.key}`]} pages`,
        real: diff,
        realLabel: signed(diff),
        realTip: `${o.label}, after ${count(c.tokens)} tokens and ${c[`pages_${o.key}`]} pages (the last linked from ${c[`in_degree_${o.key}`]}): ` +
          `${count(c[o.key])} types, against ${count(c.random_mean)} ± ${count(c.random_sd)} in random orders`,
        color: o.colour,
        base: [0, c.random_sd],
        baseTip: `Random orders: one standard deviation, ${count(c.random_sd)} types, either side of their mean`,
        badge: zText(z),
        bold: Math.abs(z) > 2,
        divider: rows.length === 2,
      });
    }
  }
  const reach = Math.ceil(Math.max(...rows.map((r) => Math.abs(r.real)), ...rows.map((r) => r.base[1])) / 200) * 200;
  const ticks = [];
  for (let t = -reach; t <= reach; t += reach / 2) ticks.push(t);
  const opts = {
    domain: [-reach, reach],
    ticks,
    fmt: (v) => (v === 0 ? "0" : signed(v)),
    zeroLine: 0,
    axisTitle: "types above or below the random mean",
    aria: "Each order's number of types against the random orders' mean, after the same number of tokens",
  };
  return { rows, opts };
}

// ---- the numbers behind the figure

/** The drawer's label over the table. */
export const TABLE_LABEL = "Table: the numbers behind the figure";

/** The table's spec. */
export function table(data) {
  return {
    columns: [
      { key: "tokens", label: "Tokens read", num: true },
      { key: "most", label: "Most-linked first", num: true },
      { key: "zMost", label: "z", num: true },
      { key: "least", label: "Least-linked first", num: true },
      { key: "zLeast", label: "z", num: true },
      { key: "random", label: `Random mean ± sd (${data.meta.runs} orders)` },
    ],
    rows: data.grid.map((p) => ({
      tokens: p.tokens,
      most: p.most_linked,
      zMost: p.z_most_linked === null ? "" : p.z_most_linked.toFixed(1),
      least: p.least_linked,
      zLeast: p.z_least_linked === null ? "" : p.z_least_linked.toFixed(1),
      random: `${count(p.random_mean)} ± ${count(p.random_sd)}`,
    })),
  };
}

// ---- what we checked: the late pages' most frequent new words, and two sentences

/** The two word lists, one line each. */
export function samples(data) {
  const late = data.late;
  return [["Most frequent new likely names", late.names_sample], ["Most frequent new other words", late.others_sample]].map(
    ([head, list]) => `${head}: ${list.join(", ")}.`,
  );
}

/** Each passage with the line above it: [{ head, page, text, highlight }]. */
export function passages(data) {
  return data.passages.map((s) => ({
    head: `A new ${s.kind === "name" ? "likely name" : "other word"}, “${s.surface}”, on a page linked from ${s.in_degree} ${s.in_degree === 1 ? "page" : "pages"}, which adds ${s.page_new_types} new types`,
    page: s.page,
    text: s.sentence,
    highlight: s.surface,
  }));
}

// ---- glossary terms, in main's call order. "Heaps' law" (w5-term-heaps-law)
// matched no text in #heaps-did, so it is not placed; "types" goes in the
// notice of #heaps-surprise.
export const TERMS = [
  { phrase: "tokens", definition: "Words as they occur on the page: \"the Hulk smashes the tank\" has 5 tokens.", id: "w5-term-heaps-tokens" },
  { phrase: "random orders", definition: "The same 303 pages shuffled into a random order, 500 times with fixed seeds. Their spread shows how much the count moves by chance.", id: "w5-term-heaps-random" },
];

export const SURPRISE_TERMS = [
  { phrase: "types", definition: "Distinct words: \"the Hulk smashes the tank\" has 4 types, since \"the\" comes twice.", id: "w5-term-heaps-types" },
];
