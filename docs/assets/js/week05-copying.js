// Week 5 · section 2 · Catch Wikipedia copying itself. Owner: Gyula.
//
// Draws into this section's slots on docs/weeks/week05/index.html: the copying
// network (#chart-copying-network), the linked-share strip (#chart-copying-linked),
// the cluster table and the passages we checked.
// Data: docs/weeks/week05/data/copying.json, written by analysis/week05_copying.py.

import { fitted, fs, loadData, node, passage, stripChart, table, termify, textWidth, token } from "./kit.js?v=1";

const pct = (v) => (v < 0.1 ? `${(v * 100).toFixed(1)}%` : `${Math.round(v * 100)}%`);
const count = (v) => v.toLocaleString("en-GB");
const short = (name) => name.replace(/ \((character|Marvel Comics|comics|characters)\)$/, "");

const data = await loadData(new URL("../../weeks/week05/data/copying.json", import.meta.url));
const name = Object.fromEntries(data.nodes.map((n) => [n.id, short(n.name)]));

// ---- the figure: the copying network, at the positions the script fixed, in
// plain SVG so every dot and line sits exactly where the layout puts it
const host = document.getElementById("chart-copying-network");
if (host) {
  const maxTokens = Math.max(...data.nodes.map((n) => n.copied_tokens));
  const maxLink = Math.max(...data.links.map((l) => l.tokens));
  const clusterSize = Object.fromEntries(data.clusters.map((c) => [c.id, c.pages.length]));
  const at = Object.fromEntries(data.nodes.map((n) => [n.id, n]));
  // A pair is named once, "A · B", to the left of its first page; every other
  // page is named to its left.
  const label = {};
  for (const n of data.nodes) label[n.id] = name[n.id];
  for (const l of data.links) {
    if (clusterSize[at[l.a].cluster] !== 2) continue;
    const [first, second] = at[l.a].x <= at[l.b].x ? [l.a, l.b] : [l.b, l.a];
    // "Ghost Rider · Ghost Rider (Johnny Blaze)" reads as "Ghost Rider · Johnny Blaze".
    const tail = name[second].startsWith(`${name[first]} (`) ? name[second].slice(name[first].length + 2, -1) : name[second];
    label[first] = `${name[first]} · ${tail}`;
    label[second] = "";
  }
  const titled = (el, text) => (el.append(node("title", {}, text)), el);
  const draw = (width) => {
    const height = Math.round(width * 0.95);
    const [left, right, top, bottom] = [8, 12, 10, 10];
    const X = (x) => left + x * (width - left - right);
    const Y = (y) => top + y * (height - top - bottom);
    const svg = node("svg", { viewBox: `0 0 ${width} ${height}`, width, height, role: "img",
      "aria-label": `Copying network: ${data.nodes.length} pages in ${data.clusters.length} clusters` });
    for (const l of data.links) {
      const [a, b] = [at[l.a], at[l.b]];
      const line = node("line", { x1: X(a.x), y1: Y(a.y), x2: X(b.x), y2: Y(b.y), stroke: token("--ink-mute"),
        "stroke-width": (1 + 5 * Math.sqrt(l.tokens / maxLink)).toFixed(2), "stroke-linecap": "round",
        "stroke-dasharray": l.linked ? "none" : "5 4", opacity: 0.85 });
      svg.append(titled(line, `${name[l.a]} and ${name[l.b]}: ${count(l.tokens)} shared words, under ${l.section_a}` +
        `${l.linked ? "" : ". The two pages do not link to each other"}.\n“${l.quote.slice(0, 200)}${l.quote.length > 200 ? " …" : ""}”`));
    }
    const radius = (n) => 3 + 8 * Math.sqrt(n.copied_tokens / maxTokens);
    for (const n of data.nodes) {
      svg.append(titled(node("circle", { cx: X(n.x), cy: Y(n.y), r: radius(n).toFixed(2), fill: token("--access"),
        stroke: token("--card"), "stroke-width": 1.5 }),
        `${name[n.id]}: ${count(n.copied_tokens)} shared words, in a cluster of ${clusterSize[n.cluster]} pages`));
    }
    // Names: the pairs' first, then each cluster page's in the first free spot of
    // left, right, above-left and below-right of its dot.
    const placed = [];
    const clear = (b) => placed.every((p) => b.x1 < p.x0 || b.x0 > p.x1 || b.y1 < p.y0 || b.y0 > p.y1);
    const order = [...data.nodes].sort((a, b) => (clusterSize[a.cluster] === 2 ? 0 : 1) - (clusterSize[b.cluster] === 2 ? 0 : 1));
    for (const n of order) {
      if (!label[n.id]) continue;
      const w = textWidth(label[n.id], "caption");
      const [cx, cy, r] = [X(n.x), Y(n.y), radius(n)];
      const spot = (side, dy) => {
        const x = side === "end" ? cx - r - 5 : cx + r + 5;
        const y = cy + 4 + dy;
        return { x, y, anchor: side, x0: side === "end" ? x - w : x, x1: side === "end" ? x : x + w, y0: y - 10, y1: y + 3 };
      };
      const spots = clusterSize[n.cluster] === 2 ? [spot("end", 0)] : [spot("end", 0), spot("start", 0), spot("end", -12), spot("start", 12)];
      const s = spots.find(clear) ?? spots[0];
      placed.push(s);
      svg.append(node("text", { x: s.x, y: s.y, "font-size": fs("caption"), fill: token("--ink-soft"),
        "text-anchor": s.anchor }, label[n.id]));
    }
    return svg;
  };
  host.append(fitted(draw, 520));
}

// ---- beside the finding: how often copying pairs link, against two baselines
const h = data.headline;
document.getElementById("chart-copying-linked")?.append(
  stripChart(
    [
      { label: "Pairs that copy", sub: `${h.pairs} pairs`, real: h.linked_share, realLabel: pct(h.linked_share), bold: true,
        realTip: `${h.copy_linked} of ${h.pairs} copying pairs link to each other` },
      { label: "Share a phrase only", sub: `${count(h.phrase_pairs)} pairs`, real: h.phrase_linked_share,
        realLabel: pct(h.phrase_linked_share), hollow: true, realTip: "Pairs sharing a run of 8 words, shorter than 30" },
      { label: "All pairs of pages", sub: `${count(h.all_pairs)} pairs`, real: h.all_linked_share,
        realLabel: pct(h.all_linked_share), hollow: true, realTip: `${count(h.all_linked)} of ${count(h.all_pairs)} pairs are linked` },
    ],
    { domain: [0, 1], ticks: [0, 0.25, 0.5, 0.75, 1], fmt: (v) => `${Math.round(v * 100)}%`, rowH: 44, badgeW: 12,
      axisTitle: "share of pairs linked to each other", aria: "Share of page pairs that link to each other" },
  ),
);

// ---- the clusters, in a drawer
document.getElementById("copying-clusters")?.append(
  table({
    columns: [
      { key: "pages", label: "Pages" },
      { key: "pairs", label: "Pairs", num: true },
      { key: "tokens", label: "Shared words", num: true },
      { key: "section", label: "Largest pair's section" },
    ],
    rows: data.clusters.map((c) => ({
      pages: c.names.map(short).join(", "),
      pairs: c.pairs,
      tokens: c.tokens,
      section: c.top_section,
    })),
  }),
);

// ---- what we checked: the three largest pairs' passages and the templated lead
const box = document.getElementById("copying-passages");
if (box) {
  const shown = data.links.slice(0, 3).map((l) => ({
    head: `${name[l.a]} and ${name[l.b]} · ${count(l.tokens)} shared words · ${l.section_a}`,
    page: l.a,
    text: l.quote,
  }));
  const extra = data.alt_extra;
  if (extra.groups.length) {
    const pages = extra.groups.reduce((sum, g) => sum + g.pages.length, 0);
    const g = extra.groups[0];
    shown.push({
      head: `A templated lead · ${pages} Strikeforce: Morituri pages, ${extra.pairs} pairs, found only by runs of ${extra.n} words`,
      page: g.example[0],
      text: g.quote,
    });
  }
  for (const s of shown) {
    const p = document.createElement("p");
    p.className = "fineprint";
    p.textContent = s.head;
    box.append(p, passage({ page: s.page, text: s.text }));
  }
}

// ---- glossary terms
const did = document.getElementById("copying-did");
termify(did, "8-gram", "A run of eight words in a row, in the order they appear on the page.", "w5-term-copying-ngram");
termify(did, "house style", "Wording Wikipedia editors repeat on page after page, such as the first sentence of almost every character's article.", "w5-term-copying-house");
