// The components a section script needs, from one import. Week 5's section
// scripts start here:
//
//   import { slot, figure, echart, concordance, passage, loadData } from "./kit.js?v=1";
//
// The chart helpers, tables, drawers and glossary terms are Week 4's, re-exported
// at the same URLs Week 4 imports them from, so the browser loads one copy. The
// rest is new: a figure with its caption and table in one call, a themed
// ECharts wrapper, and the concordance and quoted passage a text claim needs.
// docs/assets/js/README.md lists every export with an example; a test keeps
// that list and this file in step. Style: docs/assets/css/post.css.

import { family, fs } from "./type-scale.mjs";
import { token } from "./week04-strip.js?v=2";
import { decorate, decorateAll } from "./week04-tables.js";
import { drawer, drawerRow, termify } from "./week04-ui.js?v=2";

export { family, font, fs } from "./type-scale.mjs";
export { fitted, miniStrip, node, roomFor, stripChart, textWidth, token } from "./week04-strip.js?v=2";
export { decorate, decorateAll, drawer, drawerRow, termify };
export { networkView } from "./graph.js";

// ---- data and page slots

/** Fetch a JSON file. Pass new URL("…", import.meta.url) so the path works locally and on Pages. */
export async function loadData(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url}: ${res.status}`);
  return res.json();
}

/**
 * The element to draw into for one part of a section: slot("heaps", "figure")
 * is the body of #heaps-figure. The body holds the slot's hint until a
 * component replaces it; the slot's heading stays.
 */
export function slot(section, part) {
  const el = document.getElementById(`${section}-${part}`);
  if (!el) throw new Error(`no #${section}-${part} on this page`);
  return el.querySelector("[data-body]") ?? el;
}

// ---- tables and figures

/** A plain table. columns: [{ key, label, num? }]; rows: objects keyed by column. */
export function table({ columns, rows, caption }) {
  const t = document.createElement("table");
  if (caption) t.createCaption().textContent = caption;
  const head = t.createTHead().insertRow();
  for (const c of columns) {
    const th = document.createElement("th");
    th.scope = "col";
    th.textContent = c.label;
    if (c.num) th.className = "num";
    head.append(th);
  }
  const body = t.createTBody();
  for (const r of rows) {
    const tr = body.insertRow();
    for (const c of columns) {
      const td = tr.insertCell();
      const v = r[c.key];
      td.textContent = v === null || v === undefined ? "" : typeof v === "number" ? v.toLocaleString("en-GB") : v;
      if (c.num) td.className = "num";
    }
  }
  decorate(t);
  return t;
}

/**
 * One figure: the chart, a caption that says how to read it, and the numbers
 * behind it as a table in a closed drawer. `chart` is a Node or a function that
 * draws into the element it is given (for echart). `data` is a table() spec.
 * Replaces whatever the host held.
 */
export function figure(host, { chart, caption, data, label = "Table: the numbers behind the figure" }) {
  const fig = document.createElement("figure");
  fig.className = "kit-figure";
  const stage = document.createElement("div");
  stage.className = "kit-stage";
  fig.append(stage);
  if (caption) {
    const cap = document.createElement("figcaption");
    cap.textContent = caption;
    fig.append(cap);
  }
  if (data) fig.append(drawerRow(drawer(label, table(data))));
  host.replaceChildren(fig);
  if (typeof chart === "function") chart(stage);
  else if (chart) stage.append(chart);
  return fig;
}

// ---- ECharts

let echartsLoading;

/** Load the vendored ECharts once; resolves to window.echarts. */
export function loadECharts() {
  if (window.echarts) return Promise.resolve(window.echarts);
  echartsLoading ??= new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = new URL("../vendor/echarts-5.5.1.min.js", import.meta.url).href;
    s.onload = () => resolve(window.echarts);
    s.onerror = () => reject(new Error("could not load ECharts"));
    document.head.append(s);
  });
  return echartsLoading;
}

/** The page's series colours, in order, from its CSS tokens. */
export function palette() {
  return ["--access", "--people", "--ink-soft", "--ink-mute", "--dtu"].map(token);
}

/**
 * Draw an ECharts option into host at the site's type scale and colours, with
 * an item tooltip and overlapping labels hidden. Resizes with its host.
 * Resolves to the chart instance.
 */
export async function echart(host, option, { height = 360 } = {}) {
  const echarts = await loadECharts();
  const el = document.createElement("div");
  el.className = "kit-echart";
  el.style.height = `${height}px`;
  host.append(el);
  const text = { fontFamily: family(), fontSize: fs("small"), color: token("--ink") };
  const axis = {
    axisLabel: { fontSize: fs("caption"), color: token("--ink-mute") },
    nameTextStyle: { fontSize: fs("caption"), color: token("--ink-soft") },
    axisLine: { lineStyle: { color: token("--line") } },
    splitLine: { lineStyle: { color: token("--line-soft") } },
  };
  const series = [option.series ?? []].flat().map((s) => ({ labelLayout: { hideOverlap: true }, ...s }));
  const withAxis = (a) => (a === undefined ? a : [a].flat().map((x) => ({ ...axis, ...x })));
  const chart = echarts.init(el, null, { renderer: "svg" });
  chart.setOption({
    color: palette(),
    textStyle: text,
    tooltip: { trigger: "item", textStyle: text, ...option.tooltip },
    ...option,
    xAxis: withAxis(option.xAxis),
    yAxis: withAxis(option.yAxis),
    series,
  });
  new ResizeObserver(() => chart.resize()).observe(el);
  return chart;
}

// ---- text evidence

/**
 * A concordance (key word in context): one row per hit, the hit centred.
 * rows: [{ page, left, hit, right }]; page is a node_id and links to Wikipedia.
 */
export function concordance(rows, { caption } = {}) {
  const t = document.createElement("table");
  t.className = "kit-kwic";
  if (caption) t.createCaption().textContent = caption;
  const body = t.createTBody();
  for (const r of rows) {
    const tr = body.insertRow();
    tr.insertCell().append(wikiLink(r.page));
    tr.insertCell().textContent = r.left;
    const mid = tr.insertCell();
    mid.append(Object.assign(document.createElement("mark"), { textContent: r.hit }));
    tr.insertCell().textContent = r.right;
    tr.cells[0].className = "kit-kwic-page";
    tr.cells[1].className = "kit-kwic-left";
    tr.cells[3].className = "kit-kwic-right";
  }
  return t;
}

/**
 * A quoted passage from one page, for "what we checked in the text".
 * { page, text, highlight }: highlight is a word or phrase to mark, every time it occurs.
 */
export function passage({ page, text, highlight }) {
  const q = document.createElement("blockquote");
  q.className = "kit-passage";
  const p = document.createElement("p");
  if (highlight) {
    const parts = text.split(new RegExp(`(${highlight.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi"));
    parts.forEach((part, i) => p.append(i % 2 ? Object.assign(document.createElement("mark"), { textContent: part }) : part));
  } else p.textContent = text;
  const cite = document.createElement("cite");
  cite.append(wikiLink(page));
  q.append(p, cite);
  return q;
}

/** A link to a node's English Wikipedia article, labelled with its title. */
export function wikiLink(page) {
  const a = document.createElement("a");
  a.href = `https://en.wikipedia.org/wiki/${encodeURIComponent(page)}`;
  a.textContent = page.replaceAll("_", " ");
  return a;
}

