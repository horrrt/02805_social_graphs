// Week 5 · section 2 · Catch Wikipedia copying itself. Owner: Gyula.
//
// What this section's islands (src/features/week05/copying/) draw into its slots
// on src/app/(week05)/weeks/week05/_sections/Copying.tsx: the copying network
// (#chart-copying-network), the linked-share strip (#chart-copying-linked), the
// cluster table and the passages we checked.
// Data: public/weeks/week05/data/copying.json, written by analysis/week05_copying.py.

/** copying.json, which every part of the section waits for. */
export const COPYING = "weeks/week05/data/copying.json";

const pct = (v) => (v < 0.1 ? `${(v * 100).toFixed(1)}%` : `${Math.round(v * 100)}%`);
const count = (v) => v.toLocaleString("en-GB");
const short = (name) => name.replace(/ \((character|Marvel Comics|comics|characters)\)$/, "");
const names = (data) => Object.fromEntries(data.nodes.map((n) => [n.id, short(n.name)]));

// ---- the figure: the copying network, at the positions the script fixed, drawn
// with NetworkView: dot size and line width by shared words, a dashed line for
// a pair that does not link, every page named beside its dot

/** The copying network's NetworkView spec. */
export function network(data) {
  const name = names(data);
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
  return {
    ratio: TALL,
    width: 520,
    tone: "accent",
    strongLinks: true,
    labels: "beside",
    nodes: data.nodes.map((n) => ({
      id: n.id, x: n.x, y: n.y * TALL, label: label[n.id], labelSide: side[n.id],
      r: 3 + 8 * Math.sqrt(n.copied_tokens / maxTokens),
      page: name[n.id], copied: n.copied_tokens, cluster: clusterSize[n.cluster],
    })),
    links: data.links.map((l) => ({
      source: l.a, target: l.b, dashed: !l.linked, width: 1 + 5 * Math.sqrt(l.tokens / maxLink),
      title: `${name[l.a]} and ${name[l.b]}: ${count(l.tokens)} shared words, under ${l.section_a}` +
        `${l.linked ? "" : ". The two pages do not link to each other"}.\n“${l.quote.slice(0, 200)}${l.quote.length > 200 ? " …" : ""}”`,
    })),
    aria: `Copying network: ${data.nodes.length} pages in ${data.clusters.length} clusters`,
    explore: true,
    describe: (n, { degree }) => [n.page, `${count(n.copied)} shared words · copies with ${degree} ${degree === 1 ? "page" : "pages"} · a cluster of ${n.cluster}`],
  };
}

// ---- beside the finding: how often copying pairs link, against two baselines

/** The linked-share strip chart's rows and options. */
export function linked(data) {
  const h = data.headline;
  const rows = [
    { label: "Pairs that copy", sub: `${h.pairs} pairs`, real: h.linked_share, realLabel: pct(h.linked_share), bold: true,
      realTip: `${h.copy_linked} of ${h.pairs} copying pairs link to each other` },
    { label: "Share a phrase only", sub: `${count(h.phrase_pairs)} pairs`, real: h.phrase_linked_share,
      realLabel: pct(h.phrase_linked_share), hollow: true, realTip: "Pairs sharing a run of 8 words, shorter than 30" },
    { label: "All pairs of pages", sub: `${count(h.all_pairs)} pairs`, real: h.all_linked_share,
      realLabel: pct(h.all_linked_share), hollow: true, realTip: `${count(h.all_linked)} of ${count(h.all_pairs)} pairs are linked` },
  ];
  const opts = { domain: [0, 1], ticks: [0, 0.25, 0.5, 0.75, 1], fmt: (v) => `${Math.round(v * 100)}%`, rowH: 44, badgeW: 12,
    axisTitle: "share of pairs linked to each other", aria: "Share of page pairs that link to each other" };
  return { rows, opts };
}

// ---- the clusters, in a drawer

/** The cluster table's spec. */
export function clusters(data) {
  return {
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
  };
}

// ---- what we checked: the three largest pairs' passages and the templated lead

/** Each passage with the line above it: [{ head, page, text }]. */
export function passages(data) {
  const name = names(data);
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
  return shown;
}

// ---- glossary terms. Main's first call, "8-gram" (w5-term-copying-ngram),
// matched no text in #copying-did, so only "house style" is placed.
export const TERMS = [
  { phrase: "house style", definition: "Wording Wikipedia editors repeat on page after page, such as the first sentence of almost every character's article.", id: "w5-term-copying-house" },
];
