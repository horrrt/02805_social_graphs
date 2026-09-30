// Week 5 · section 6 · Does network fame buy you more words?. Owner: Niklas.
//
// Draws into this section's slots on docs/weeks/week05/index.html: the log-log
// scatter of page length against in-degree with the fitted line
// (#chart-fame-scatter), the table of the ten outliers (#fame-outliers) and the
// passage behind each outlier's reason (#fame-passages).
// Data: docs/weeks/week05/data/fame.json, written by analysis/week05_fame.py.

import { echart, loadData, passage, table, termify, token } from "./kit.js?v=3";

const count = (v) => v.toLocaleString("en-GB");
const times = (r) => `×${r >= 1 ? r.toFixed(1) : r.toFixed(2)}`;
const short = (name) => name.replace(/ \((character|Marvel Comics|comics)\)$/, "");

const data = await loadData(new URL("../../weeks/week05/data/fame.json", import.meta.url));
const outlier = Object.fromEntries(data.outliers.map((o) => [o.id, o]));

// ---- the figure: words against 1 + in-degree, both on log axes
const host = document.getElementById("chart-fame-scatter");
if (host) {
  const [above, below, plain] = [token("--access"), token("--people"), token("--ink-mute")];
  // A fixed sideways spread, the same on every load, so the 58 pages at zero
  // in-degree do not print on top of each other. Tooltips give the true values.
  const spread = (i) => 2 ** ((((i * 37) % 9) - 4) * 0.025);
  const dot = (p, i) => ({
    value: [(p.in_degree + 1) * spread(i), p.tokens],
    point: p,
    symbol: p.isolate ? "emptyCircle" : "circle",
  });
  const series = (name, color, points, labelled) => ({
    name,
    type: "scatter",
    symbolSize: labelled ? 9 : 6,
    itemStyle: { color, opacity: labelled ? 1 : 0.6 },
    data: points,
    label: labelled
      ? { show: true, position: "right", color: token("--ink-soft"), formatter: (d) => `${short(d.data.point.name)} ${times(d.data.point.ratio)}` }
      : { show: false },
  });
  const all = data.points.map(dot);
  const ofSide = (side) => all.filter((d) => outlier[d.point.id]?.side === side);
  const maxX = Math.max(...data.points.map((p) => p.in_degree + 1));
  const f = data.fit;
  const line = [1, maxX].map((x) => [x, Math.exp(f.intercept) * x ** f.slope]);
  echart(
    host,
    {
      grid: { left: 64, right: 120, top: 40, bottom: 48 },
      legend: { top: 0, data: ["Longer than predicted", "Shorter than predicted", "Other pages"], selectedMode: false },
      tooltip: {
        formatter: (d) => {
          if (!d.data?.point) return `The fit: ${count(Math.round(f.base_tokens))} words at zero in-degree, ×${f.per_doubling.toFixed(2)} per doubling of 1 + in-degree`;
          const p = d.data.point;
          return [
            `<b>${p.name}</b>`,
            `${p.in_degree} incoming ${p.in_degree === 1 ? "link" : "links"}, ${p.out_degree} outgoing${p.isolate ? " (an isolate)" : ""}`,
            `${count(p.tokens)} words; the line predicts ${count(p.predicted)} (${times(p.ratio)})`,
          ].join("<br>");
        },
      },
      xAxis: { type: "log", name: "1 + in-degree", nameLocation: "middle", nameGap: 28, min: 0.8, max: 200 },
      yAxis: { type: "log", name: "words on the page", nameLocation: "middle", nameGap: 48, min: 100, max: 100000 },
      series: [
        series("Other pages", plain, all.filter((d) => !outlier[d.point.id]), false),
        series("Longer than predicted", above, ofSide("above"), true),
        series("Shorter than predicted", below, ofSide("below"), true),
        { name: "Fit", type: "line", data: line, showSymbol: false, silent: false, lineStyle: { color: token("--ink-soft"), width: 1.5 }, z: 1 },
      ],
    },
    { height: 440 },
  );
}

// ---- the ten outliers, in a drawer
document.getElementById("fame-outliers")?.append(
  table({
    columns: [
      { key: "page", label: "Page" },
      { key: "in", label: "In-degree", num: true },
      { key: "words", label: "Words", num: true },
      { key: "predicted", label: "Predicted", num: true },
      { key: "ratio", label: "× predicted" },
      { key: "named", label: "Named on", num: true },
      { key: "headings", label: "Headings", num: true },
    ],
    rows: data.outliers.map((o) => ({
      page: short(o.name),
      in: o.in_degree,
      words: o.tokens,
      predicted: o.predicted,
      ratio: times(o.ratio),
      named: o.mentions,
      headings: o.headings,
    })),
    caption: `Named on: other pages that name the character. Headings: the page's section headings; the median page has ${data.corpus.median_headings}.`,
  }),
);

// ---- what we checked: one reason and one passage per outlier
const box = document.getElementById("fame-passages");
if (box) {
  const groups = data.outliers.map((o) => {
    const head = document.createElement("p");
    head.className = "fineprint";
    const from = o.quote.links === false ? ` The passage is from ${o.quote.page.replaceAll("_", " ")}, which names ${short(o.name)} without linking to the page.` : "";
    head.append(Object.assign(document.createElement("b"), { textContent: `${short(o.name)}, ${times(o.ratio)} predicted. ` }), o.reason + from);
    return [head, passage({ page: o.quote.page, text: o.quote.text, highlight: o.quote.highlight })];
  });
  for (const g of groups) box.append(...g);
}

// ---- glossary terms
const did = document.getElementById("fame-did");
termify(did, "in-degree", "The number of pages that link to a page. Here only links among the 303 Marvel pages count.", "w5-term-fame-indegree");
termify(did, "isolates", "Pages with no links in or out: no page links to them and they link to none.", "w5-term-fame-isolates");
termify(did, "residual", "How far a page sits from the fitted line. Above zero, the page is longer than its links predict; below zero, shorter.", "w5-term-fame-residual");
