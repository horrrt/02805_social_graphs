// Week 5 · section 2 · Catch Wikipedia copying itself. Owner: Gyula.
//
// Draws into this section's slots on docs/weeks/week05/index.html: the copying
// network (#chart-copying-network), the linked-share strip (#chart-copying-linked),
// the cluster table and the passages we checked.
// Data: docs/weeks/week05/data/copying.json, written by analysis/week05_copying.py.

import { loadData, networkView, passage, showFirst, stripChart, table, termify } from "./kit.js?v=2";

const pct = (v) => (v < 0.1 ? `${(v * 100).toFixed(1)}%` : `${Math.round(v * 100)}%`);
const count = (v) => v.toLocaleString("en-GB");
const short = (name) => name.replace(/ \((character|Marvel Comics|comics|characters)\)$/, "");

const data = await loadData(new URL("../../weeks/week05/data/copying.json", import.meta.url));
const name = Object.fromEntries(data.nodes.map((n) => [n.id, short(n.name)]));

// ---- the figure: the copying network, at the positions the script fixed, drawn
// with networkView(): dot size and line width by shared words, a dashed line for
// a pair that does not link, every page named beside its dot
const host = document.getElementById("chart-copying-network");
if (host) {
  const maxTokens = Math.max(...data.nodes.map((n) => n.copied_tokens));
  const maxLink = Math.max(...data.links.map((l) => l.tokens));
  const clusterSize = Object.fromEntries(data.clusters.map((c) => [c.id, c.pages.length]));
  const at = Object.fromEntries(data.nodes.map((n) => [n.id, n]));
  // A pair is named once, "A · B", to the left of its first page; every other
  // page is named beside its own dot.
  const label = {};
  const side = {};
  for (const n of data.nodes) label[n.id] = name[n.id];
  for (const l of data.links) {
    if (clusterSize[at[l.a].cluster] !== 2) continue;
    const [first, second] = at[l.a].x <= at[l.b].x ? [l.a, l.b] : [l.b, l.a];
    // "Ghost Rider · Ghost Rider (Johnny Blaze)" reads as "Ghost Rider · Johnny Blaze".
    const tail = name[second].startsWith(`${name[first]} (`) ? name[second].slice(name[first].length + 2, -1) : name[second];
    label[first] = `${name[first]} · ${tail}`;
    side[first] = "left";
    label[second] = "";
  }
  // The layout fills a frame 0.95 as tall as it is wide.
  const TALL = 0.95;
  networkView(host, {
    ratio: TALL,
    width: 520,
    tone: "accent",
    strongLinks: true,
    labels: "beside",
    nodes: data.nodes.map((n) => ({
      id: n.id, x: n.x, y: n.y * TALL, label: label[n.id], labelSide: side[n.id],
      r: 3 + 8 * Math.sqrt(n.copied_tokens / maxTokens),
      title: `${name[n.id]}: ${count(n.copied_tokens)} shared words, in a cluster of ${clusterSize[n.cluster]} pages`,
    })),
    links: data.links.map((l) => ({
      source: l.a, target: l.b, dashed: !l.linked, width: 1 + 5 * Math.sqrt(l.tokens / maxLink),
      title: `${name[l.a]} and ${name[l.b]}: ${count(l.tokens)} shared words, under ${l.section_a}` +
        `${l.linked ? "" : ". The two pages do not link to each other"}.\n“${l.quote.slice(0, 200)}${l.quote.length > 200 ? " …" : ""}”`,
    })),
    aria: `Copying network: ${data.nodes.length} pages in ${data.clusters.length} clusters`,
  });
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
  const groups = shown.map((s) => {
    const p = document.createElement("p");
    p.className = "fineprint";
    p.textContent = s.head;
    return [p, passage({ page: s.page, text: s.text })];
  });
  showFirst(box, groups, { label: `The other ${groups.length - 1} passages` });
}

// ---- glossary terms
const did = document.getElementById("copying-did");
termify(did, "8-gram", "A run of eight words in a row, in the order they appear on the page.", "w5-term-copying-ngram");
termify(did, "house style", "Wording Wikipedia editors repeat on page after page, such as the first sentence of almost every character's article.", "w5-term-copying-house");
