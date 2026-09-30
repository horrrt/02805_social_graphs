// Week 5 · section 7 · Who has the weirdest Wikipedia page? Owner: Niklas.
//
// Draws into this section's slots on docs/weeks/week05/index.html: the score
// against page length with the corpus band (#chart-weird-scatter), the table of
// the top and bottom five as read (#weird-table), and the sentences we quote.
// Data: docs/weeks/week05/data/weird.json, written by analysis/week05_weird.py.

import { drawer, drawerRow, fitted, fs, loadData, node, passage, table, termify, textWidth, token } from "./kit.js?v=1";

const data = await loadData(new URL("../../weeks/week05/data/weird.json", import.meta.url));
const pct = (v) => `${(v * 100).toFixed(1)}%`;
const signed = (v) => `${v < 0 ? "−" : "+"}${Math.abs(v).toFixed(2)}`;
const count = (v) => v.toLocaleString("en-GB");
const top = new Set(data.top.map((r) => r.node));
const bottom = new Set(data.bottom.map((r) => r.node));
const W = data.meta.window;
const K = data.meta.neighbours;
const P = data.corpus.pages;

// ---- the figure, left panel: MATTR against length, the corpus band behind
const host = document.getElementById("chart-weird-scatter");
if (host) {
  const pts = data.points;
  const lo = Math.min(...pts.map((p) => p.mattr), ...data.band.map((b) => b.mean - 2 * b.sd));
  const hi = Math.max(...pts.map((p) => p.mattr), ...data.band.map((b) => b.mean + 2 * b.sd));
  const [x0, x1] = [Math.log10(data.corpus.min_tokens * 0.9), Math.log10(data.corpus.max_tokens * 1.1)];
  const titled = (el, text) => (el.append(node("title", {}, text)), el);
  const draw = (width) => {
    const height = Math.round(width * 0.72);
    const [left, right, top_, bottomPad] = [46, 14, 12, 38];
    const X = (t) => left + ((Math.log10(t) - x0) / (x1 - x0)) * (width - left - right);
    const Y = (v) => top_ + (1 - (v - (lo - 0.01)) / (hi - lo + 0.02)) * (height - top_ - bottomPad);
    const svg = node("svg", { viewBox: `0 0 ${width} ${height}`, width, height, role: "img",
      "aria-label": `MATTR against page length for ${P} pages, with the band of random corpus stretches` });
    const text = (x, y, label, attrs = {}) => node("text", { x, y, "font-size": fs("caption"), fill: token("--ink-mute"), ...attrs }, label);
    // axes
    for (const t of [200, 500, 1000, 2000, 5000, 10000]) {
      svg.append(node("line", { x1: X(t), x2: X(t), y1: top_, y2: height - bottomPad, stroke: token("--line-soft") }),
        text(X(t), height - bottomPad + 14, count(t), { "text-anchor": "middle" }));
    }
    for (let v = Math.ceil(lo * 20) / 20; v <= hi + 1e-9; v += 0.05) {
      svg.append(node("line", { x1: left, x2: width - right, y1: Y(v), y2: Y(v), stroke: token("--line-soft") }),
        text(left - 6, Y(v) + 4, v.toFixed(2), { "text-anchor": "end" }));
    }
    svg.append(text((left + width - right) / 2, height - 6, "page length in words (log scale)", { "text-anchor": "middle", fill: token("--ink-soft") }),
      text(12, top_ + (height - top_ - bottomPad) / 2, `MATTR, ${W}-word window`,
        { "text-anchor": "middle", fill: token("--ink-soft"), transform: `rotate(-90 12 ${top_ + (height - top_ - bottomPad) / 2})` }));
    // the band: random stretches of the corpus, mean ± 2 sd
    const upper = data.band.map((b) => `${X(b.tokens).toFixed(1)},${Y(b.mean + 2 * b.sd).toFixed(1)}`);
    const lower = data.band.map((b) => `${X(b.tokens).toFixed(1)},${Y(b.mean - 2 * b.sd).toFixed(1)}`).reverse();
    svg.append(titled(node("polygon", { points: [...upper, ...lower].join(" "), fill: token("--line"), opacity: 0.55 }),
      `Random stretches of the whole corpus at each length: mean ± 2 sd of ${count(data.meta.draws)} draws`));
    svg.append(node("polyline", { points: data.band.map((b) => `${X(b.tokens).toFixed(1)},${Y(b.mean).toFixed(1)}`).join(" "),
      fill: "none", stroke: token("--ink-mute"), "stroke-dasharray": "4 3" }));
    // what the ranking measures against: the mean of each page's length neighbours
    const byLength = [...pts].sort((a, b) => a.tokens - b.tokens || (a.node < b.node ? -1 : 1));
    svg.append(titled(node("polyline", { points: byLength.map((p) => `${X(p.tokens).toFixed(1)},${Y(p.near_mattr).toFixed(1)}`).join(" "),
      fill: "none", stroke: token("--ink-soft"), "stroke-width": 1.5, opacity: 0.8 }),
      `Mean MATTR of the ${K} pages nearest each page in length: the ranking's comparison`));
    // dots: every page, the top and bottom five on top
    const colour = (p) => (top.has(p.node) ? token("--access") : bottom.has(p.node) ? token("--people") : token("--ink-mute"));
    const marked = (p) => top.has(p.node) || bottom.has(p.node);
    for (const p of [...pts.filter((q) => !marked(q)), ...pts.filter(marked)]) {
      svg.append(titled(node("circle", { cx: X(p.tokens).toFixed(1), cy: Y(p.mattr).toFixed(1), r: marked(p) ? 5 : 3,
        fill: colour(p), opacity: marked(p) ? 1 : 0.5, stroke: marked(p) ? token("--card") : "none", "stroke-width": 1.5 }),
        `${p.name}: ${count(p.tokens)} words, MATTR ${p.mattr.toFixed(3)}, z = ${signed(p.z)} against the ${K} pages nearest in length, rank ${p.rank} of ${P}`));
    }
    // names of the top and bottom five, in the first free spot around each dot
    const placed = [];
    const clear = (b) => b.x0 > left && b.x1 < width - right && placed.every((q) => b.x1 < q.x0 || b.x0 > q.x1 || b.y1 < q.y0 || b.y0 > q.y1);
    for (const p of pts.filter(marked)) {
      const label = p.name;
      const w = textWidth(label, "caption");
      const [cx, cy] = [X(p.tokens), Y(p.mattr)];
      const spot = (side, dy) => {
        const x = side === "end" ? cx - 8 : cx + 8;
        const y = cy + 4 + dy;
        return { x, y, anchor: side, x0: side === "end" ? x - w : x, x1: side === "end" ? x : x + w, y0: y - 10, y1: y + 3 };
      };
      const spots = [spot("start", 0), spot("end", 0), spot("start", -13), spot("end", 13), spot("start", 13), spot("end", -13)];
      const s = spots.find(clear) ?? spots[0];
      placed.push(s);
      svg.append(node("text", { x: s.x, y: s.y, "font-size": fs("caption"), fill: token("--ink-soft"), "text-anchor": s.anchor }, label));
    }
    return svg;
  };
  host.append(fitted(draw, 560));
  host.append(drawerRow(drawer(`Table: all ${P} pages`, table({
    columns: [
      { key: "rank", label: "Rank" },
      { key: "name", label: "Page" },
      { key: "tokens", label: "Words", num: true },
      { key: "mattr", label: "MATTR" },
      { key: "z", label: "z vs similar length" },
    ],
    rows: data.points.map((p) => ({ rank: String(p.rank), name: p.name, tokens: p.tokens, mattr: p.mattr.toFixed(3), z: signed(p.z) })),
  }))));
}

// ---- the figure, right panel: the top and bottom five, with what reading found
document.getElementById("weird-table")?.append(
  table({
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
  }),
);

// ---- what we checked: a sentence past the lead of each top-three page, and the bottom page
const box = document.getElementById("weird-passages");
if (box) {
  for (const q of data.quotes) {
    const p = document.createElement("p");
    p.className = "fineprint";
    const row = [...data.top, ...data.bottom].find((r) => r.node === q.node);
    p.textContent = `Rank ${q.rank} of ${P} · ${q.name} · ${row.read}`;
    box.append(p, passage({ page: q.node, text: q.text }));
  }
}

// ---- glossary terms
const did = document.getElementById("weird-did");
termify(did, "MATTR", `Moving-average type-token ratio: the share of different words in each ${W}-word window of a page, averaged over every window.`, "w5-term-weird-mattr");
termify(did, "z-score", "How many standard deviations a value sits above (+) or below (−) the mean of the group it is compared with.", "w5-term-weird-z");
termify(did, "House phrasing","Wording Wikipedia editors repeat on page after page, such as the first sentence of almost every character's article.", "w5-term-weird-house");
