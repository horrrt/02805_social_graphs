// The redesign's one chart form: the real network against its random
// baseline on a shared axis. Plain SVG, coloured from the page's CSS tokens.
// Every dot, band and interval carries a native tooltip (<title>), and the
// chart as a whole an aria-label; the notice beside each chart says what to
// read from it.

import { fs, family, font } from "./type-scale.mjs";

export { fs, family, font };

const SVG = "http://www.w3.org/2000/svg";

export function token(name) {
  return getComputedStyle(document.body).getPropertyValue(name).trim();
}

export function node(name, attrs = {}, text = null) {
  const el = document.createElementNS(SVG, name);
  for (const [key, value] of Object.entries(attrs)) el.setAttribute(key, value);
  if (text !== null) el.textContent = text;
  return el;
}

let measurer;

/** Rendered width in px of a line of text at a type role and weight. */
export function textWidth(text, role = "small", weight = 400) {
  measurer ??= document.createElement("canvas").getContext("2d");
  measurer.font = font(role, weight);
  return measurer.measureText(String(text)).width;
}

/** The width a chart may take inside its parent: the content box, in whole
 * px. 0 when the parent is hidden or lays its children out in a row, where
 * the parent's width is not the chart's. */
export function roomFor(el) {
  const parent = el?.parentElement;
  if (!parent) return 0;
  const cs = getComputedStyle(parent);
  if (cs.display.includes("flex") && cs.flexDirection.startsWith("row")) return 0;
  return Math.floor(parent.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight));
}

// Observers by parent. A chart drawn into the same host again (a damping
// click, a new client pick) retires the observers of charts no longer on the
// page; a host holding two live charts keeps both.
const observers = new WeakMap();

/**
 * Draw a chart at its parent's width so one SVG unit is one CSS pixel and the
 * type renders at the sizes the tokens set. build(width) returns the chart;
 * it is drawn at the fallback width first (the parent may still be hidden in
 * a closed drawer) and drawn again whenever the parent's width changes,
 * including when a closed <details> opens. A redraw only follows a change of
 * width, so the new chart's height cannot set off another.
 */
export function fitted(build, fallback) {
  let chart = build(fallback);
  let drawn = fallback;
  let queued = false;
  let observer = null;
  const redraw = () => {
    queued = false;
    if (!chart.isConnected) {
      observer?.disconnect();
      return;
    }
    const width = roomFor(chart);
    if (width <= 0 || width === drawn) return;
    drawn = width;
    const next = build(width);
    chart.replaceWith(next);
    chart = next;
  };
  const watch = (tries) => {
    const parent = chart.parentElement;
    if (!parent) {
      if (tries > 0) requestAnimationFrame(() => watch(tries - 1));
      return;
    }
    const live = (observers.get(parent) || []).filter(([seen, isLive]) => isLive() || void seen.disconnect());
    observer = new ResizeObserver(() => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(redraw);
    });
    observers.set(parent, [...live, [observer, () => chart.isConnected]]);
    observer.observe(parent);
  };
  queueMicrotask(() => watch(20));
  return chart;
}

// The geometry of both charts lives in stripLayout() and miniLayout(): pure
// arithmetic over the rows, a width and a text measure, so a component can
// draw the same chart. The builders below turn it into SVG nodes and add the
// colours, the type sizes and the tooltips.

/** A label centred on x but kept inside [lo, hi]: its x and anchor. */
function placeText(measure, x, y, text, lo, hi, role = "caption", weight = 400) {
  const half = measure(text, role, weight) / 2;
  const anchor = x - half < lo ? "start" : x + half > hi ? "end" : "middle";
  const at = anchor === "start" ? lo : anchor === "end" ? hi : x;
  return { x: at, y, anchor, text, role, weight };
}

/** A placed label's left and right edge. */
function extent(measure, p) {
  const w = measure(p.text, p.role, p.weight);
  const left = p.anchor === "start" ? p.x : p.anchor === "end" ? p.x - w : p.x - w / 2;
  return [left, left + w];
}

/**
 * Two placed labels on one line that overlap move apart: the left one ends and
 * the right one starts 4px either side of the middle of their centres, the pair
 * kept inside [lo, hi]. Labels that do not overlap stay where they are.
 */
function apart(measure, a, b, lo, hi) {
  if (!a || !b) return;
  const [al, ar] = extent(measure, a);
  const [bl, br] = extent(measure, b);
  if (ar + 4 <= bl || br + 4 <= al) return;
  const [left, right, lw, rw] = al + ar <= bl + br ? [a, b, ar - al, br - bl] : [b, a, br - bl, ar - al];
  let mid = (al + ar + bl + br) / 4;
  mid += Math.max(0, lo - (mid - 4 - lw)) - Math.max(0, mid + 4 + rw - hi);
  Object.assign(left, { x: mid - 4, anchor: "end" });
  Object.assign(right, { x: mid + 4, anchor: "start" });
}

// The baseline's band, at least 4px wide, with its mean as a tick.
function bandAt(X, cy, mean, sd) {
  let lo = X(mean - sd);
  let hi = X(mean + sd);
  if (hi - lo < 4) {
    const mid = (lo + hi) / 2;
    lo = mid - 2;
    hi = mid + 2;
  }
  return { x: lo, y: cy - 6, width: hi - lo, mean: X(mean), y1: cy - 9, y2: cy + 9 };
}

const intervalAt = (X, cy, lo, hi) => ({ lo: X(lo), hi: X(hi), y: cy, y1: cy - 5, y2: cy + 5 });

const dotAt = (X, cy, value, hollow) => ({ cx: X(value), cy, r: hollow ? 6 : 6.5 });

const clamp = (d0, d1, x0, x1) => (v) => x0 + ((Math.min(Math.max(v, d0), d1) - d0) * (x1 - x0)) / (d1 - d0);

function titled(el, tip) {
  if (tip) el.append(node("title", {}, tip));
  return el;
}

function smartText({ x, y, anchor, text, role, weight }, fill) {
  return node(
    "text",
    { x, y, "font-size": fs(role), fill: fill ?? token("--ink-soft"), "font-weight": weight, "text-anchor": anchor },
    text,
  );
}

function band({ x, y, width, mean, y1, y2 }, tip) {
  const g = node("g");
  g.append(titled(node("rect", { x, y, width, height: 12, rx: 6, fill: token("--w4-band") }), tip));
  g.append(node("line", { x1: mean, y1, x2: mean, y2, stroke: token("--ink-mute"), "stroke-width": 2 }));
  return g;
}

function interval({ lo, hi, y, y1, y2 }, tip) {
  const ink = { stroke: token("--ink"), "stroke-width": 2 };
  const g = titled(node("g"), tip);
  g.append(node("line", { x1: lo, y1: y, x2: hi, y2: y, ...ink }));
  g.append(node("line", { x1: lo, y1, x2: lo, y2, ...ink }));
  g.append(node("line", { x1: hi, y1, x2: hi, y2, ...ink }));
  return g;
}

function dot({ cx, cy, r }, { color, hollow, tip }) {
  if (color?.startsWith("--")) color = token(color);
  const fill = hollow ? token("--card") : color ?? token("--ink");
  const stroke = hollow ? color ?? token("--ink") : token("--card");
  return titled(node("circle", { cx, cy, r, fill, stroke, "stroke-width": 2 }), tip);
}

/**
 * Rows of "real network against its random baseline" on one shared axis.
 * Each row: { label, sub, real, realLabel, realTip, hollow, color, base: [mean, sd],
 * baseLabel, baseTip, ci: [lo, hi], ciTip, ref: [value, label], badge, divider, bold }.
 * Drawn at its parent's width (see fitted); `width` is the width while hidden.
 */
export function stripChart(rows, opts) {
  return fitted((width) => drawStrip(rows, { ...opts, width }), opts.width ?? 556);
}

/**
 * stripChart's geometry at `width`: the plot's span [x0, x1] and its scale X,
 * the height, the ticks, and per row its top, centre line and the place of
 * each label, band, interval, dot and badge. Labels carry their type role,
 * weight and anchor; measure(text, role, weight) gives a label's width in px
 * (textWidth, or useTextMeasure's function in a component).
 */
export function stripLayout(
  rows,
  { domain, ticks, fmt, labelW = 170, rowH = 60, badgeW = 70, axisTitle, zeroLine, ref, top = 10 },
  width = 556,
  measure = textWidth,
) {
  const [d0, d1] = domain;
  // The label column fits the longest label at the rendered size. When that
  // leaves the plot too little room, each label moves onto a line above its row.
  const labelNeed = Math.ceil(
    Math.max(0, ...rows.map((r) => Math.max(measure(r.label, "small", r.bold ? 700 : 600), r.sub ? measure(r.sub, "caption") : 0))),
  ) + 16;
  const badgeNeed = Math.max(0, ...rows.map((r) => (r.badge ? measure(r.badge, "small", 700) + 16 : 0)));
  const badgeRoom = badgeNeed ? Math.max(badgeW, badgeNeed + 12) : badgeW;
  const above = width - Math.max(labelW, labelNeed) - badgeRoom < 180;
  const lift = above ? 20 : 0;
  // The end ticks' labels are centred on them: keep half of each inside.
  const tickHalf = (tv) => measure(fmt(tv), "caption") / 2 + 1;
  const x0 = above ? Math.max(4, tickHalf(ticks[0])) : Math.max(labelW, labelNeed);
  const x1 = width - Math.max(badgeRoom, tickHalf(ticks.at(-1)));
  const X = clamp(d0, d1, x0, x1);
  const step = rowH + lift;
  const ybot = top + rows.length * step;
  const height = ybot + 34 + (axisTitle ? 16 : 0);
  // A reference across every row, [value, label]: the label sits above the first row.
  const across = ref && {
    x: X(ref[0]),
    tip: ref[1],
    label: ref[1] ? placeText(measure, X(ref[0]), Math.max(10, top - 8), ref[1], x0, x1) : null,
  };
  return {
    width,
    height,
    above,
    x0,
    x1,
    X,
    gridTop: top - 4,
    ybot,
    ticks: ticks.map((tv) => ({ x: X(tv), y: ybot + 16, label: fmt(tv) })),
    zero: zeroLine !== undefined ? X(zeroLine) : undefined,
    axisTitle: axisTitle ? { x: x1, y: ybot + 33, text: axisTitle } : null,
    ref: across || null,
    rows: rows.map((r, i) => {
      const rowTop = top + i * step;
      const cy = rowTop + lift + rowH / 2 - 2;
      const weight = r.bold ? 700 : 600;
      let badge = null;
      if (r.badge) {
        const bw = Math.max(measure(r.badge, "small", 700) + 16, 44);
        const bx = Math.min(x1 + 12, width - bw);
        badge = { x: bx, y: cy - 11, width: bw, textX: bx + bw / 2, textY: cy + 4.5 };
      }
      // The baseline's and the reference's labels share the line under the row.
      const baseLabel = r.base && r.baseLabel ? placeText(measure, X(r.base[0]), cy + 25, r.baseLabel, x0, x1) : null;
      const refLabel = r.ref && r.ref[1] ? placeText(measure, X(r.ref[0]), cy + 25, r.ref[1], x0, x1) : null;
      apart(measure, baseLabel, refLabel, x0, x1);
      return {
        rowTop,
        cy,
        weight,
        divider: r.divider ? rowTop + 2 : null,
        label: above ? { x: 0, y: rowTop + 14 } : { x: 0, y: cy - (r.sub ? 3 : -4) },
        sub: !r.sub ? null : above ? { x: measure(r.label, "small", weight) + 8, y: rowTop + 14 } : { x: 0, y: cy + 13 },
        base: r.base
          ? {
              band: bandAt(X, cy, r.base[0], r.base[1]),
              label: baseLabel,
            }
          : null,
        ref: r.ref
          ? {
              x: X(r.ref[0]),
              y1: cy - 10,
              y2: cy + 10,
              label: refLabel,
            }
          : null,
        ci: r.ci ? intervalAt(X, cy, r.ci[0], r.ci[1]) : null,
        real:
          r.real !== undefined && r.real !== null
            ? {
                dot: dotAt(X, cy, r.real, r.hollow),
                label: r.realLabel ? placeText(measure, X(r.real), cy - 13, r.realLabel, x0, x1, "small", 700) : null,
              }
            : null,
        badge,
      };
    }),
  };
}

function drawStrip(rows, opts) {
  const L = stripLayout(rows, opts, opts.width);
  const { width, height: h, x0, x1, ybot } = L;
  const caption = fs("caption");
  const small = fs("small");
  const svg = node("svg", { viewBox: `0 0 ${width} ${h}`, width, height: h, role: "img", "aria-label": opts.aria, class: "w4-strip" });
  for (const t of L.ticks) {
    svg.append(node("line", { x1: t.x, y1: L.gridTop, x2: t.x, y2: ybot, stroke: token("--w4-grid"), "stroke-width": 1 }));
    svg.append(node("text", { x: t.x, y: t.y, "font-size": caption, fill: token("--ink-mute-text"), "text-anchor": "middle" }, t.label));
  }
  if (L.zero !== undefined) {
    svg.append(node("line", { x1: L.zero, y1: L.gridTop, x2: L.zero, y2: ybot, stroke: token("--ink-mute"), "stroke-width": 1 }));
  }
  if (L.axisTitle) {
    const { x, y, text } = L.axisTitle;
    svg.append(node("text", { x, y, "font-size": caption, fill: token("--ink-mute-text"), "text-anchor": "end" }, text));
  }
  if (L.ref) {
    svg.append(
      titled(
        node("line", { x1: L.ref.x, y1: L.gridTop, x2: L.ref.x, y2: ybot, stroke: token("--ink-soft"), "stroke-width": 1.4, "stroke-dasharray": "3 2" }),
        L.ref.tip,
      ),
    );
    if (L.ref.label) svg.append(smartText(L.ref.label, token("--ink-soft")));
  }
  L.rows.forEach((g, i) => {
    const r = rows[i];
    const { cy } = g;
    if (g.divider !== null) {
      svg.append(
        node("line", {
          x1: 0,
          y1: g.divider,
          x2: width,
          y2: g.divider,
          stroke: token("--line"),
          "stroke-width": 1,
          "stroke-dasharray": "2 3",
        }),
      );
    }
    svg.append(node("text", { x: g.label.x, y: g.label.y, "font-size": small, fill: token("--ink"), "font-weight": g.weight }, r.label));
    if (g.sub) svg.append(node("text", { x: g.sub.x, y: g.sub.y, "font-size": caption, fill: token("--ink-mute-text") }, r.sub));
    svg.append(node("line", { x1: x0, y1: cy, x2: x1, y2: cy, stroke: token("--line"), "stroke-width": 1 }));
    if (g.base) {
      svg.append(band(g.base.band, r.baseTip));
      if (g.base.label) svg.append(smartText(g.base.label));
    }
    if (g.ref) {
      svg.append(
        node("line", {
          x1: g.ref.x,
          y1: g.ref.y1,
          x2: g.ref.x,
          y2: g.ref.y2,
          stroke: token("--ink-soft"),
          "stroke-width": 1.4,
          "stroke-dasharray": "3 2",
        }),
      );
      if (g.ref.label) svg.append(smartText(g.ref.label));
    }
    if (g.ci) svg.append(interval(g.ci, r.ciTip));
    if (g.real) {
      svg.append(dot(g.real.dot, { color: r.color, hollow: r.hollow, tip: r.realTip }));
      if (g.real.label) svg.append(smartText(g.real.label, token("--ink")));
    }
    if (g.badge) {
      const b = g.badge;
      svg.append(node("rect", { x: b.x, y: b.y, width: b.width, height: 22, rx: 11, fill: token("--ground") }));
      svg.append(
        node(
          "text",
          { x: b.textX, y: b.textY, "font-size": small, fill: token("--ink"), "font-weight": 700, "text-anchor": "middle" },
          r.badge,
        ),
      );
    }
  });
  return svg;
}

/** One row without an axis, for summaries: the real value as a dot, the baseline
 * as a band. Drawn at its parent's width, or at `width` inside a row of items. */
export function miniStrip(spec) {
  return fitted((width) => drawMini({ ...spec, width }), spec.width ?? 300);
}

/** miniStrip's geometry at `width`, as stripLayout gives stripChart's. */
export function miniLayout({ domain, real, realLabel, base, baseLabel, ref, refLabel, ci }, width = 300, measure = textWidth) {
  const w = width;
  const h = 58;
  const x0 = 6;
  const x1 = w - 6;
  const cy = 28;
  const [d0, d1] = domain;
  const X = clamp(d0, d1, x0, x1);
  const baseText = base && baseLabel ? placeText(measure, X(base[0]), cy + 24, baseLabel, 0, w) : null;
  const refText = ref !== undefined && refLabel ? placeText(measure, X(ref), cy + 24, refLabel, 0, w) : null;
  apart(measure, baseText, refText, 0, w);
  return {
    width: w,
    height: h,
    x0,
    x1,
    cy,
    X,
    base: base
      ? { band: bandAt(X, cy, base[0], base[1]), label: baseText }
      : null,
    ref:
      ref !== undefined
        ? { x: X(ref), y1: cy - 11, y2: cy + 11, label: refText }
        : null,
    ci: ci ? { ...intervalAt(X, cy, ci[0], ci[1]), tip: `95% interval: ${ci[0].toFixed(2)} to ${ci[1].toFixed(2)}` } : null,
    real: { dot: dotAt(X, cy, real), label: placeText(measure, X(real), cy - 13, realLabel, 0, w, "small", 700) },
  };
}

function drawMini(spec) {
  const L = miniLayout(spec, spec.width);
  const { width: w, height: h, x0, x1, cy } = L;
  const svg = node("svg", { viewBox: `0 0 ${w} ${h}`, width: w, height: h, role: "img", "aria-label": spec.aria });
  svg.append(node("line", { x1: x0, y1: cy, x2: x1, y2: cy, stroke: token("--line"), "stroke-width": 1 }));
  if (L.base) {
    svg.append(band(L.base.band, spec.baseLabel));
    if (L.base.label) svg.append(smartText(L.base.label));
  }
  if (L.ref) {
    svg.append(
      node("line", {
        x1: L.ref.x,
        y1: L.ref.y1,
        x2: L.ref.x,
        y2: L.ref.y2,
        stroke: token("--ink-soft"),
        "stroke-width": 1.3,
        "stroke-dasharray": "3 2",
      }),
    );
    if (L.ref.label) svg.append(smartText(L.ref.label));
  }
  if (L.ci) svg.append(interval(L.ci, L.ci.tip));
  svg.append(dot(L.real.dot, { tip: spec.realLabel }));
  svg.append(smartText(L.real.label, token("--ink")));
  return svg;
}
