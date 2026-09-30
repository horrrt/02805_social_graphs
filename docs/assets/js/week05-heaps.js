// Week 5 · section 5 · Heaps' law of the Marvel universe. Owner: Niklas.
//
// Draws into this section's slots on docs/weeks/week05/index.html: types seen
// against tokens read on log-log axes (#chart-heaps-curve), each order's gap to
// the random orders at two token counts (#chart-heaps-gap), the numbers behind
// both (#heaps-table), and the new words of the late pages (#heaps-samples,
// #heaps-passages).
// Data: docs/weeks/week05/data/heaps.json, written by analysis/week05_heaps.py.

import { drawer, drawerRow, fitted, fs, loadData, node, passage, showFirst, stripChart, table, termify, token } from "./kit.js?v=2";

const count = (v) => Math.round(v).toLocaleString("en-GB");
const short = (v) => (v >= 1000 ? `${v / 1000}k` : `${v}`);
const signed = (v) => `${v < 0 ? "−" : "+"}${count(Math.abs(v))}`;
const zText = (z) => `z ${z < 0 ? "−" : "+"}${Math.abs(z).toFixed(1)}`;

const data = await loadData(new URL("../../weeks/week05/data/heaps.json", import.meta.url));
const { grid, heaps: fit } = data;
const ORDER = {
  most: { label: "Most-linked first", key: "most_linked", colour: "--access" },
  least: { label: "Least-linked first", key: "least_linked", colour: "--people" },
};

// ---- the figure: types against tokens, log-log, with the random band and the fit
const curve = document.getElementById("chart-heaps-curve");
if (curve) {
  const titled = (el, text) => (el.append(node("title", {}, text)), el);
  const [n0, n1] = [grid[0].tokens, grid.at(-1).tokens];
  const [v0, v1] = [Math.min(...grid.map((p) => Math.min(p.random_p5, p.most_linked, p.least_linked))), grid.at(-1).random_mean];
  const xTicks = [1e3, 1e4, 1e5].filter((t) => t >= n0 && t <= n1);
  const yTicks = [500, 1e3, 2e3, 5e3, 1e4, 2e4].filter((t) => t >= v0 && t <= v1);
  const draw = (width) => {
    const height = Math.round(Math.min(380, width * 0.72));
    const [left, right, top, bottom] = [46, 16, 12, 40];
    const lx = (v) => Math.log10(v);
    const X = (n) => left + ((lx(n) - lx(n0)) / (lx(n1) - lx(n0))) * (width - left - right);
    const Y = (v) => top + (1 - (lx(v) - lx(v0 * 0.95)) / (lx(v1 * 1.05) - lx(v0 * 0.95))) * (height - top - bottom);
    const svg = node("svg", { viewBox: `0 0 ${width} ${height}`, width, height, role: "img",
      "aria-label": `Types seen against tokens read, log-log: most-linked first, least-linked first and ${data.meta.runs} random orders` });
    const caption = fs("caption");
    for (const t of xTicks) {
      svg.append(node("line", { x1: X(t), y1: top, x2: X(t), y2: height - bottom, stroke: token("--line-soft") }));
      svg.append(node("text", { x: X(t), y: height - bottom + 16, "font-size": caption, fill: token("--ink-mute"), "text-anchor": "middle" }, short(t)));
    }
    for (const t of yTicks) {
      svg.append(node("line", { x1: left, y1: Y(t), x2: width - right, y2: Y(t), stroke: token("--line-soft") }));
      svg.append(node("text", { x: left - 6, y: Y(t) + 4, "font-size": caption, fill: token("--ink-mute"), "text-anchor": "end" }, short(t)));
    }
    svg.append(node("text", { x: width - right, y: height - 6, "font-size": caption, fill: token("--ink-soft"), "text-anchor": "end" }, "tokens read"));
    svg.append(node("text", { x: left, y: top - 2, "font-size": caption, fill: token("--ink-soft") }, "types seen"));
    const path = (pts) => pts.map(([n, v], i) => `${i ? "L" : "M"}${X(n).toFixed(1)},${Y(v).toFixed(1)}`).join("");
    // The random band, 5th to 95th percentile, and its mean.
    const band = [...grid.map((p) => [p.tokens, p.random_p95]), ...[...grid].reverse().map((p) => [p.tokens, p.random_p5])];
    svg.append(titled(node("path", { d: `${path(band)}Z`, fill: token("--w4-band"), stroke: "none" }),
      `Middle 90% of ${data.meta.runs} random page orders`));
    svg.append(titled(node("path", { d: path(grid.map((p) => [p.tokens, p.random_mean])), fill: "none", stroke: token("--ink-mute"), "stroke-width": 1.5 }),
      `Mean of ${data.meta.runs} random page orders`));
    // Heaps' law fitted to the random mean, over the fit range.
    const fitLine = grid.filter((p) => p.tokens >= fit.fit_from).map((p) => [p.tokens, fit.k * p.tokens ** fit.beta]);
    svg.append(titled(node("path", { d: path(fitLine), fill: "none", stroke: token("--ink"), "stroke-width": 1.5, "stroke-dasharray": "5 4" }),
      `Heaps' law fitted to the random mean: V = ${fit.k.toFixed(1)} n^${fit.beta.toFixed(2)}, from ${count(fit.fit_from)} tokens`));
    for (const o of Object.values(ORDER)) {
      svg.append(titled(node("path", { d: path(grid.map((p) => [p.tokens, p[o.key]])), fill: "none", stroke: token(o.colour), "stroke-width": 2 }), o.label));
    }
    // Hover points: every grid point's numbers.
    for (const p of grid) {
      const tip = `${count(p.tokens)} tokens read\nMost-linked first: ${count(p.most_linked)} types\nLeast-linked first: ${count(p.least_linked)} types\n` +
        `Random: ${count(p.random_mean)} ± ${count(p.random_sd)}`;
      svg.append(titled(node("circle", { cx: X(p.tokens), cy: Y(p.random_mean), r: 6, fill: "transparent", stroke: "none" }), tip));
    }
    // A legend in the empty top-left corner.
    const legend = [["Most-linked first", "--access"], ["Least-linked first", "--people"], ["Random orders", "--ink-mute"], ["Heaps' law fit", "--ink"]];
    legend.forEach(([label, colour], i) => {
      const y = top + 14 + i * 16;
      svg.append(node("line", { x1: left + 12, y1: y - 4, x2: left + 32, y2: y - 4, stroke: token(colour), "stroke-width": 2,
        "stroke-dasharray": label.startsWith("Heaps") ? "5 4" : "none" }));
      svg.append(node("text", { x: left + 38, y, "font-size": caption, fill: token("--ink-soft") }, label));
    });
    return svg;
  };
  curve.append(fitted(draw, 520));
}

// ---- beside it: each order's gap to the random mean at the two token counts
const gap = document.getElementById("chart-heaps-gap");
if (gap) {
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
  gap.append(
    stripChart(rows, {
      domain: [-reach, reach],
      ticks,
      fmt: (v) => (v === 0 ? "0" : signed(v)),
      zeroLine: 0,
      axisTitle: "types above or below the random mean",
      aria: "Each order's number of types against the random orders' mean, after the same number of tokens",
    }),
  );
}

// ---- the numbers behind the figure
document.getElementById("heaps-table")?.append(
  drawerRow(
    drawer(
      "Table: the numbers behind the figure",
      table({
        columns: [
          { key: "tokens", label: "Tokens read", num: true },
          { key: "most", label: "Most-linked first", num: true },
          { key: "zMost", label: "z", num: true },
          { key: "least", label: "Least-linked first", num: true },
          { key: "zLeast", label: "z", num: true },
          { key: "random", label: `Random mean ± sd (${data.meta.runs} orders)` },
        ],
        rows: grid.map((p) => ({
          tokens: p.tokens,
          most: p.most_linked,
          zMost: p.z_most_linked === null ? "" : p.z_most_linked.toFixed(1),
          least: p.least_linked,
          zLeast: p.z_least_linked === null ? "" : p.z_least_linked.toFixed(1),
          random: `${count(p.random_mean)} ± ${count(p.random_sd)}`,
        })),
      }),
    ),
  ),
);

// ---- what we checked: the late pages' most frequent new words, and two sentences
const late = data.late;
const samples = document.getElementById("heaps-samples");
if (samples) {
  for (const [head, list] of [["Most frequent new likely names", late.names_sample], ["Most frequent new other words", late.others_sample]]) {
    const p = document.createElement("p");
    p.className = "fineprint";
    p.textContent = `${head}: ${list.join(", ")}.`;
    samples.append(p);
  }
}
const box = document.getElementById("heaps-passages");
if (box) {
  const groups = data.passages.map((s) => {
    const p = document.createElement("p");
    p.className = "fineprint";
    p.textContent = `A new ${s.kind === "name" ? "likely name" : "other word"}, “${s.surface}”, on a page linked from ${s.in_degree} ${s.in_degree === 1 ? "page" : "pages"}, which adds ${s.page_new_types} new types`;
    return [p, passage({ page: s.page, text: s.sentence, highlight: s.surface })];
  });
  showFirst(box, groups, { label: groups.length === 2 ? "The other passage" : `The other ${groups.length - 1} passages` });
}

// ---- glossary terms
const did = document.getElementById("heaps-did");
termify(did, "Heaps' law", "An empirical rule for text: the number of distinct words grows with the number of words read as a power below 1, so it keeps rising but ever more slowly.", "w5-term-heaps-law");
termify(did, "tokens", "Words as they occur on the page: \"the Hulk smashes the tank\" has 5 tokens.", "w5-term-heaps-tokens");
termify(document.getElementById("heaps-surprise"), "types", "Distinct words: \"the Hulk smashes the tank\" has 4 types, since \"the\" comes twice.", "w5-term-heaps-types");
termify(did, "random orders", "The same 303 pages shuffled into a random order, 500 times with fixed seeds. Their spread shows how much the count moves by chance.", "w5-term-heaps-random");
