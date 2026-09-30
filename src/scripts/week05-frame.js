// Week 5 · the frame around the seven sections: the hero scatter and the
// findings strip under the hero.
//
// Draws into #chart-hero-fame (words against 1 + in-degree, both on log
// scales, with the fitted line) and into each [data-finding] host (the real
// pages against their baseline, Week 4's mini strip). Data: the section JSON
// files in public/weeks/week05/data/, written by analysis/week05_*.py.

import { asset } from "./site.js";
import { hoverTips, loadData } from "./kit.js";
import { fitted, fs, miniStrip, node, token } from "./week04-strip.js";

const data = (name) => loadData(asset(`weeks/week05/data/${name}.json`));
const pct = (x) => `${Math.round(x * 100)}%`;
const count = (n) => Math.round(n).toLocaleString("en-US");
// An axis around some values with a tenth of their range spare on each side.
const span = (values) => {
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  return [lo - (hi - lo) / 10, hi + (hi - lo) / 10];
};

// ---- the hero: page length against in-degree -------------------------------

const X_MAX = 200;
const Y_MIN = 100;
const Y_MAX = 30000;

function drawFame(fame, width) {
  const h = Math.round(Math.min(380, Math.max(260, width * 0.6)));
  const left = 58;
  const right = 12;
  const top = 12;
  const bottom = 44;
  const lx = (v) => Math.log(v);
  const X = (v) => left + ((lx(v) - lx(1)) / (lx(X_MAX) - lx(1))) * (width - left - right);
  const Y = (v) => top + ((lx(Y_MAX) - lx(v)) / (lx(Y_MAX) - lx(Y_MIN))) * (h - top - bottom);
  const ink = token("--w4-hero-ink");
  const label = token("--w4-hero-label");
  const body = token("--w4-hero-body");
  const caption = fs("caption");
  const svg = node("svg", { viewBox: `0 0 ${width} ${h}`, width, height: h, "aria-hidden": "true" });

  for (const v of [1, 10, 100]) {
    svg.append(node("line", { x1: X(v), y1: top, x2: X(v), y2: h - bottom, stroke: token("--w4-hero-state-edge"), "stroke-width": 1 }));
    svg.append(node("text", { x: X(v), y: h - bottom + 16, "font-size": caption, fill: label, "text-anchor": "middle" }, count(v)));
  }
  for (const v of [100, 1000, 10000]) {
    svg.append(node("line", { x1: left, y1: Y(v), x2: width - right, y2: Y(v), stroke: token("--w4-hero-state-edge"), "stroke-width": 1 }));
    svg.append(node("text", { x: left - 8, y: Y(v) + 4, "font-size": caption, fill: label, "text-anchor": "end" }, count(v)));
  }
  svg.append(node("text", { x: width - right, y: h - 6, "font-size": caption, fill: label, "text-anchor": "end" }, "1 + pages linking to it"));
  svg.append(node("text", { x: left, y: top - 2, "font-size": caption, fill: label }, "words on the page"));

  const dots = node("g");
  for (const p of fame.points) {
    const dot = node("circle", { cx: X(1 + p.in_degree), cy: Y(p.tokens), r: 3.2, fill: body, "fill-opacity": 0.55 });
    dot.append(node("title", {}, `${p.name}: ${count(p.tokens)} words, ${p.in_degree} incoming links`));
    dots.append(dot);
  }
  svg.append(dots);

  // The fitted line: ln(words) = intercept + slope · ln(1 + in-degree).
  const f = fame.fit;
  const fit = (x) => Math.exp(f.intercept + f.slope * Math.log(x));
  svg.append(node("line", { x1: X(1), y1: Y(fit(1)), x2: X(X_MAX), y2: Y(fit(X_MAX)), stroke: ink, "stroke-width": 1.6 }));

  // The two outliers the caption and section 6 name first.
  const above = fame.outliers.find((o) => o.side === "above" && o.place === 1);
  const below = fame.outliers.find((o) => o.side === "below" && o.place === 1);
  for (const [o, dy] of [[above, -10], [below, 18]]) {
    const cx = X(1 + o.in_degree);
    const cy = Y(o.tokens);
    svg.append(node("circle", { cx, cy, r: 4.5, fill: ink }));
    svg.append(node("text", { x: cx + 8, y: cy + dy, "font-size": fs("small"), fill: ink, "font-weight": 700 }, o.name.replace(/\s*\(.*\)$/, "")));
  }
  return svg;
}

// ---- the findings strip --------------------------------------------------------

function strips({ relations, copying, search, heaps, fame, weird }) {
  const enemy = relations.crossing.find((c) => c.label === "enemy");
  const c = copying.headline;
  const s = search.summary;
  const at100k = heaps.checkpoints.find((p) => p.tokens === 100000);
  const f = fame.fit;
  const w = weird.several;
  return {
    1: [
      {
        domain: [0.2, 0.7],
        real: enemy.crossing,
        realLabel: pct(enemy.crossing),
        base: [enemy.null_mean, enemy.null_sd],
        baseLabel: `shuffled ${pct(enemy.null_mean)}`,
        aria: "Share of enemy links that join two communities, against shuffled labels",
      },
      `Enemy links that join two communities · z = ${enemy.z.toFixed(1)}`,
    ],
    2: [
      {
        domain: [0, 1],
        real: c.linked_share,
        realLabel: `${c.copy_linked} of ${c.pairs}`,
        ref: c.all_linked_share,
        refLabel: `all pairs ${(100 * c.all_linked_share).toFixed(1)}%`,
        aria: "Share of copying pairs that link to each other, against all pairs",
      },
      "Copying pairs that already link · dashed: all pairs of pages",
    ],
    3: [
      {
        domain: [0, 1],
        real: s.hits_at_5 / s.n_scored,
        realLabel: `${s.hits_at_5} of ${s.n_scored}`,
        ref: s.chance_at_5,
        refLabel: `random ${(100 * s.chance_at_5).toFixed(1)}%`,
        aria: "Share of queries with the right page in the top five, against a random ranking",
      },
      "Right page in the top five, raw counts · dashed: a random ranking",
    ],
    5: [
      {
        domain: span([at100k.least_linked, at100k.random_mean - 2 * at100k.random_sd, at100k.random_mean + 2 * at100k.random_sd]),
        real: at100k.least_linked,
        realLabel: count(at100k.least_linked),
        base: [at100k.random_mean, at100k.random_sd],
        baseLabel: `random ${count(at100k.random_mean)}`,
        aria: "Different words in the first 100,000, least-linked pages first, against random orders",
      },
      `Different words in the first ${count(at100k.tokens)}, least-linked first · z = ${at100k.z_least_linked.toFixed(1)}`,
    ],
    6: [
      {
        domain: [-0.2, 1],
        real: f.pearson,
        realLabel: f.pearson.toFixed(2),
        base: [f.null_mean, f.null_sd],
        baseLabel: `shuffled ${Math.abs(f.null_mean).toFixed(2)}`,
        aria: "Correlation of log length with log in-degree, against shuffled in-degree",
      },
      "Pearson r of log length and log in-degree · band: in-degree shuffled",
    ],
    7: [
      {
        domain: [0, w.bottom_decile / 2],
        real: w.in_bottom_decile,
        realLabel: `${w.in_bottom_decile} of ${w.bottom_decile}`,
        ref: w.expected,
        refLabel: `expected ${w.expected.toFixed(1)}`,
        aria: "Pages about several characters among the 30 most repetitive, against the number expected",
      },
      `Several-name pages among the ${w.bottom_decile} most repetitive · p = ${w.p.toFixed(4)}`,
    ],
  };
}

async function boot() {
  const names = ["relations", "copying", "search", "heaps", "fame", "weird"];
  const loaded = Object.fromEntries(await Promise.all(names.map(async (n) => [n, await data(n)])));

  const hero = document.getElementById("chart-hero-fame");
  if (hero) hero.replaceChildren(fitted((width) => drawFame(loaded.fame, width), 560));

  const specs = strips(loaded);
  for (const host of document.querySelectorAll("#findings [data-finding]")) {
    const small = document.createElement("small");
    const spec = specs[host.dataset.finding];
    if (!spec) {
      small.textContent = "No guesses collected yet, so no baseline to draw.";
      host.replaceChildren(small);
      continue;
    }
    small.textContent = spec[1];
    host.replaceChildren(miniStrip(spec[0]), small);
  }
}

boot().catch((err) => console.error("week05 frame failed", err));

// ---- every chart's marks show their numbers at once on hover (tips.js); the
// maps and the ECharts scatter carry their own tooltips
for (const host of document.querySelectorAll('[id^="chart-"]')) hoverTips(host);
