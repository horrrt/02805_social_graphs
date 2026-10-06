// Week 5 · the frame around the seven sections: the hero scatter and the
// findings strip under the hero, as data.
//
// The islands in src/features/week05/frame/ draw #chart-hero-fame (words
// against 1 + in-degree, both on log scales, with the fitted line) from
// fameLayout() and each [data-finding] host (the real pages against their
// baseline, Week 4's mini strip) from strips(). Data: the section JSON files in
// public/weeks/week05/data/, written by analysis/week05_*.py. No DOM, no
// listeners, no fetch.

/** The section files the frame reads, under weeks/week05/data/. */
export const FILES = ["relations", "copying", "search", "heaps", "fame", "weird"];

/** The file each finding's mini strip reads; finding 4 has none. */
export const FINDING_FILES = { 1: "relations", 2: "copying", 3: "search", 5: "heaps", 6: "fame", 7: "weird" };

/** Finding 4's line, in place of a strip. */
export const NO_GUESSES = "No guesses collected yet, so no baseline to draw.";

const pct = (x) => `${Math.round(x * 100)}%`;
const count = (n) => Math.round(n).toLocaleString("en-US");
// An axis around some values with a tenth of their range spare on each side.
const span = (values) => {
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  return [lo - (hi - lo) / 10, hi + (hi - lo) / 10];
};

// ---- the hero: page length against in-degree -------------------------------

export const X_MAX = 200;
export const Y_MIN = 100;
export const Y_MAX = 30000;

/** The hero scatter's geometry at `width`: axes, dots, the fitted line and the two named outliers. */
export function fameLayout(fame, width) {
  const h = Math.round(Math.min(380, Math.max(260, width * 0.6)));
  const left = 58;
  const right = 12;
  const top = 12;
  const bottom = 44;
  const lx = (v) => Math.log(v);
  const X = (v) => left + ((lx(v) - lx(1)) / (lx(X_MAX) - lx(1))) * (width - left - right);
  const Y = (v) => top + ((lx(Y_MAX) - lx(v)) / (lx(Y_MAX) - lx(Y_MIN))) * (h - top - bottom);

  const xTicks = [1, 10, 100].map((v) => ({ x: X(v), y1: top, y2: h - bottom, labelY: h - bottom + 16, label: count(v) }));
  const yTicks = [100, 1000, 10000].map((v) => ({ y: Y(v), x1: left, x2: width - right, labelX: left - 8, labelY: Y(v) + 4, label: count(v) }));
  const xTitle = { x: width - right, y: h - 6, text: "1 + pages linking to it" };
  const yTitle = { x: left, y: top - 2, text: "words on the page" };

  const dots = fame.points.map((p) => ({
    cx: X(1 + p.in_degree),
    cy: Y(p.tokens),
    tip: `${p.name}: ${count(p.tokens)} words, ${p.in_degree} incoming links`,
  }));

  // The fitted line: ln(words) = intercept + slope · ln(1 + in-degree).
  const f = fame.fit;
  const fit = (x) => Math.exp(f.intercept + f.slope * Math.log(x));
  const line = { x1: X(1), y1: Y(fit(1)), x2: X(X_MAX), y2: Y(fit(X_MAX)) };

  // The two outliers the caption and section 6 name first.
  const above = fame.outliers.find((o) => o.side === "above" && o.place === 1);
  const below = fame.outliers.find((o) => o.side === "below" && o.place === 1);
  const outliers = [[above, -10], [below, 18]].map(([o, dy]) => {
    const cx = X(1 + o.in_degree);
    const cy = Y(o.tokens);
    return { cx, cy, labelX: cx + 8, labelY: cy + dy, name: o.name.replace(/\s*\(.*\)$/, "") };
  });

  return { width, height: h, xTicks, yTicks, xTitle, yTitle, dots, line, outliers };
}

// ---- the findings strip --------------------------------------------------------

// Each finding's [mini strip spec, line under it], from its one file.
const FINDINGS = {
  1: (relations) => {
    const enemy = relations.crossing.find((c) => c.label === "enemy");
    return [
      {
        domain: [0.2, 0.7],
        real: enemy.crossing,
        realLabel: pct(enemy.crossing),
        base: [enemy.null_mean, enemy.null_sd],
        baseLabel: `shuffled ${pct(enemy.null_mean)}`,
        aria: "Share of enemy links that join two communities, against shuffled labels",
      },
      `Enemy links that join two communities · z = ${enemy.z.toFixed(1)}`,
    ];
  },
  2: (copying) => {
    const c = copying.headline;
    return [
      {
        domain: [0, 1],
        real: c.linked_share,
        realLabel: `${c.copy_linked} of ${c.pairs}`,
        ref: c.all_linked_share,
        refLabel: `all pairs ${(100 * c.all_linked_share).toFixed(1)}%`,
        aria: "Share of copying pairs that link to each other, against all pairs",
      },
      "Copying pairs that already link · dashed: all pairs of pages",
    ];
  },
  3: (search) => {
    const s = search.summary;
    return [
      {
        domain: [0, 1],
        real: s.hits_at_5 / s.n_scored,
        realLabel: `${s.hits_at_5} of ${s.n_scored}`,
        ref: s.chance_at_5,
        refLabel: `random ${(100 * s.chance_at_5).toFixed(1)}%`,
        aria: "Share of queries with the right page in the top five, against a random ranking",
      },
      "Right page in the top five, raw counts · dashed: a random ranking",
    ];
  },
  5: (heaps) => {
    const at100k = heaps.checkpoints.find((p) => p.tokens === 100000);
    return [
      {
        domain: span([at100k.least_linked, at100k.random_mean - 2 * at100k.random_sd, at100k.random_mean + 2 * at100k.random_sd]),
        real: at100k.least_linked,
        realLabel: count(at100k.least_linked),
        base: [at100k.random_mean, at100k.random_sd],
        baseLabel: `random ${count(at100k.random_mean)}`,
        aria: "Different words in the first 100,000, least-linked pages first, against random orders",
      },
      `Different words in the first ${count(at100k.tokens)}, least-linked first · z = ${at100k.z_least_linked.toFixed(1)}`,
    ];
  },
  6: (fame) => {
    const f = fame.fit;
    return [
      {
        domain: [-0.2, 1],
        real: f.pearson,
        realLabel: f.pearson.toFixed(2),
        base: [f.null_mean, f.null_sd],
        baseLabel: `shuffled ${Math.abs(f.null_mean).toFixed(2)}`,
        aria: "Correlation of log length with log in-degree, against shuffled in-degree",
      },
      "Pearson r of log length and log in-degree · band: in-degree shuffled",
    ];
  },
  7: (weird) => {
    const w = weird.several;
    return [
      {
        domain: [0, w.bottom_decile / 2],
        real: w.in_bottom_decile,
        realLabel: `${w.in_bottom_decile} of ${w.bottom_decile}`,
        ref: w.expected,
        refLabel: `expected ${w.expected.toFixed(1)}`,
        aria: "Pages about several characters among the 30 most repetitive, against the number expected",
      },
      `Several-name pages among the ${w.bottom_decile} most repetitive · p = ${w.p.toFixed(4)}`,
    ];
  },
};

/**
 * strips({ relations, copying, … }) -> { 1: [spec, line], 2: …, 7: … }: the
 * mini strip spec and the line under it for every finding whose file is in
 * `loaded` (FINDING_FILES), so each mini can draw from its own file alone.
 */
export function strips(loaded) {
  const out = {};
  for (const [finding, build] of Object.entries(FINDINGS)) {
    const data = loaded[FINDING_FILES[finding]];
    if (data) out[finding] = build(data);
  }
  return out;
}
