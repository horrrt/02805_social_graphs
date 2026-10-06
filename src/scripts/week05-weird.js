// Week 5 · section 7 · Who has the weirdest Wikipedia page? Owner: Niklas.
//
// What this section's islands (src/features/week05/weird/) draw into its slots
// on src/app/(week05)/weeks/week05/_sections/Weird.tsx: the score against page
// length with the corpus band (#chart-weird-scatter, with a drawer of all pages
// under it), the table of the top and bottom five as read (#weird-table), and
// the sentences we quote (#weird-passages).
// Data: public/weeks/week05/data/weird.json, written by analysis/week05_weird.py.
// No DOM, no listeners, no fetch.

/** weird.json, which every part of the section waits for. */
export const WEIRD = "weeks/week05/data/weird.json";

/** The three hosts the islands draw into. */
export const IDS = { scatter: "chart-weird-scatter", pages: "weird-pages", table: "weird-table", passages: "weird-passages" };

const pct = (v) => `${(v * 100).toFixed(1)}%`;
const signed = (v) => `${v < 0 ? "−" : "+"}${Math.abs(v).toFixed(2)}`;
const count = (v) => v.toLocaleString("en-GB");

/** The colour tokens the scatter reads. */
export const SCATTER_TOKENS = ["--line-soft", "--ink-mute", "--ink-soft", "--line", "--access", "--people", "--card"];

// ---- the figure, left panel: MATTR against length, the corpus band behind

/**
 * The scatter's geometry at `width`: the grid and its labels, the band, its
 * mean, the length-neighbour line, every dot with its tooltip and the names of
 * the top and bottom five, each in the first free spot around its dot.
 * measure(text, role) is the text's width; colours are token names.
 */
export function scatterLayout(data, width, measure) {
  const top = new Set(data.top.map((r) => r.node));
  const bottom = new Set(data.bottom.map((r) => r.node));
  const W = data.meta.window;
  const K = data.meta.neighbours;
  const P = data.corpus.pages;
  const pts = data.points;
  const lo = Math.min(...pts.map((p) => p.mattr), ...data.band.map((b) => b.mean - 2 * b.sd));
  const hi = Math.max(...pts.map((p) => p.mattr), ...data.band.map((b) => b.mean + 2 * b.sd));
  const [x0, x1] = [Math.log10(data.corpus.min_tokens * 0.9), Math.log10(data.corpus.max_tokens * 1.1)];
  const height = Math.round(width * 0.72);
  const [left, right, top_, bottomPad] = [46, 14, 12, 38];
  const X = (t) => left + ((Math.log10(t) - x0) / (x1 - x0)) * (width - left - right);
  const Y = (v) => top_ + (1 - (v - (lo - 0.01)) / (hi - lo + 0.02)) * (height - top_ - bottomPad);
  // axes
  const xTicks = [200, 500, 1000, 2000, 5000, 10000].map((t) => ({ x: X(t), y1: top_, y2: height - bottomPad, labelY: height - bottomPad + 14, label: count(t) }));
  const yTicks = [];
  for (let v = Math.ceil(lo * 20) / 20; v <= hi + 1e-9; v += 0.05) {
    yTicks.push({ y: Y(v), x1: left, x2: width - right, labelX: left - 6, labelY: Y(v) + 4, label: v.toFixed(2) });
  }
  const midY = top_ + (height - top_ - bottomPad) / 2;
  // the band: random stretches of the corpus, mean ± 2 sd
  const upper = data.band.map((b) => `${X(b.tokens).toFixed(1)},${Y(b.mean + 2 * b.sd).toFixed(1)}`);
  const lower = data.band.map((b) => `${X(b.tokens).toFixed(1)},${Y(b.mean - 2 * b.sd).toFixed(1)}`).reverse();
  // what the ranking measures against: the mean of each page's length neighbours
  const byLength = [...pts].sort((a, b) => a.tokens - b.tokens || (a.node < b.node ? -1 : 1));
  // dots: every page, the top and bottom five on top
  const colour = (p) => {
    if (top.has(p.node)) return "--access";
    if (bottom.has(p.node)) return "--people";
    return "--ink-mute";
  };
  const marked = (p) => top.has(p.node) || bottom.has(p.node);
  const dots = [...pts.filter((q) => !marked(q)), ...pts.filter(marked)].map((p) => ({
    cx: X(p.tokens).toFixed(1),
    cy: Y(p.mattr).toFixed(1),
    r: marked(p) ? 5 : 3,
    colour: colour(p),
    opacity: marked(p) ? 1 : 0.5,
    stroke: marked(p) ? "--card" : null,
    tip: `${p.name}: ${count(p.tokens)} words, MATTR ${p.mattr.toFixed(3)}, z = ${signed(p.z)} against the ${K} pages nearest in length, rank ${p.rank} of ${P}`,
  }));
  // names of the top and bottom five, in the first free spot around each dot
  const placed = [];
  const clear = (b) => b.x0 > left && b.x1 < width - right && placed.every((q) => b.x1 < q.x0 || b.x0 > q.x1 || b.y1 < q.y0 || b.y0 > q.y1);
  const labels = [];
  for (const p of pts.filter(marked)) {
    const label = p.name;
    const w = measure(label, "caption");
    const [cx, cy] = [X(p.tokens), Y(p.mattr)];
    const spot = (side, dy) => {
      const x = side === "end" ? cx - 8 : cx + 8;
      const y = cy + 4 + dy;
      return { x, y, anchor: side, x0: side === "end" ? x - w : x, x1: side === "end" ? x : x + w, y0: y - 10, y1: y + 3 };
    };
    const spots = [spot("start", 0), spot("end", 0), spot("start", -13), spot("end", 13), spot("start", 13), spot("end", -13)];
    const s = spots.find(clear) ?? spots[0];
    placed.push(s);
    labels.push({ x: s.x, y: s.y, anchor: s.anchor, text: label });
  }
  return {
    width,
    height,
    aria: `MATTR against page length for ${P} pages, with the band of random corpus stretches`,
    xTicks,
    yTicks,
    xTitle: { x: (left + width - right) / 2, y: height - 6, text: "page length in words (log scale)" },
    yTitle: { x: 12, y: midY, text: `MATTR, ${W}-word window`, transform: `rotate(-90 12 ${midY})` },
    band: { points: [...upper, ...lower].join(" "), tip: `Random stretches of the whole corpus at each length: mean ± 2 sd of ${count(data.meta.draws)} draws` },
    bandMean: data.band.map((b) => `${X(b.tokens).toFixed(1)},${Y(b.mean).toFixed(1)}`).join(" "),
    near: {
      points: byLength.map((p) => `${X(p.tokens).toFixed(1)},${Y(p.near_mattr).toFixed(1)}`).join(" "),
      tip: `Mean MATTR of the ${K} pages nearest each page in length: the ranking's comparison`,
    },
    dots,
    labels,
  };
}

/** The "Table" drawer of the card: its label and the table of every page. */
export function allPages(data) {
  return {
    label: `Table: all ${data.corpus.pages} pages`,
    table: {
      columns: [
        { key: "rank", label: "Rank" },
        { key: "name", label: "Page" },
        { key: "tokens", label: "Words", num: true },
        { key: "mattr", label: "MATTR" },
        { key: "z", label: "z vs similar length" },
      ],
      rows: data.points.map((p) => ({ rank: String(p.rank), name: p.name, tokens: p.tokens, mattr: p.mattr.toFixed(3), z: signed(p.z) })),
    },
  };
}

// ---- the figure, right panel: the top and bottom five, with what reading found

/** The top and bottom five's table spec. */
export function readTable(data) {
  return {
    columns: [
      { key: "rank", label: "Rank" },
      { key: "name", label: "Page" },
      { key: "tokens", label: "Words", num: true },
      { key: "z", label: "z" },
      { key: "rare", label: "Rare words" },
      { key: "house", label: "House phrasing" },
      { key: "read", label: "What reading found" },
    ],
    rows: [...data.top, ...data.bottom].map((r) => ({
      rank: String(r.rank),
      name: r.name,
      tokens: r.tokens,
      z: signed(r.z),
      rare: `${pct(r.rare_share)} (${pct(r.rare_near)})`,
      house: `${pct(r.boilerplate_share)} (${pct(r.boilerplate_near)})`,
      read: r.read,
    })),
  };
}

// ---- what we checked: a sentence past the lead of each top-three page, and the bottom page

/** Each quote with the line above it: [{ head, page, text }]. */
export function passages(data) {
  const P = data.corpus.pages;
  return data.quotes.map((q) => {
    const row = [...data.top, ...data.bottom].find((r) => r.node === q.node);
    return { head: `Rank ${q.rank} of ${P} · ${q.name} · ${row.read}`, page: q.node, text: q.text };
  });
}

// ---- glossary terms. Main built the MATTR definition from weird.json's
// meta.window, 100; the server renders the terms, so the window is written
// out. "z-score" (w5-term-weird-z) and "House phrasing" (w5-term-weird-house)
// matched no text in #weird-did, so only MATTR is placed.
export const TERMS = [
  { phrase: "MATTR", definition: "Moving-average type-token ratio: the share of different words in each 100-word window of a page, averaged over every window.", id: "w5-term-weird-mattr" },
];
