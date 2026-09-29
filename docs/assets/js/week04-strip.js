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
    observer = new ResizeObserver(() => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(redraw);
    });
    observer.observe(parent);
  };
  queueMicrotask(() => watch(20));
  return chart;
}

function titled(el, tip) {
  if (tip) el.append(node("title", {}, tip));
  return el;
}

/** A label centred on x but kept inside [lo, hi]. */
function smartText(x, y, text, lo, hi, { role = "caption", fill, weight = 400 } = {}) {
  const size = fs(role);
  const half = textWidth(text, role, weight) / 2;
  const anchor = x - half < lo ? "start" : x + half > hi ? "end" : "middle";
  const at = anchor === "start" ? lo : anchor === "end" ? hi : x;
  return node(
    "text",
    { x: at, y, "font-size": size, fill: fill ?? token("--ink-soft"), "font-weight": weight, "text-anchor": anchor },
    text,
  );
}

function band(X, cy, mean, sd, tip) {
  let lo = X(mean - sd);
  let hi = X(mean + sd);
  if (hi - lo < 4) {
    const mid = (lo + hi) / 2;
    lo = mid - 2;
    hi = mid + 2;
  }
  const g = node("g");
  g.append(titled(node("rect", { x: lo, y: cy - 6, width: hi - lo, height: 12, rx: 6, fill: token("--w4-band") }), tip));
  g.append(node("line", { x1: X(mean), y1: cy - 9, x2: X(mean), y2: cy + 9, stroke: token("--ink-mute"), "stroke-width": 2 }));
  return g;
}

function interval(X, cy, lo, hi, tip) {
  const ink = { stroke: token("--ink"), "stroke-width": 2 };
  const g = titled(node("g"), tip);
  g.append(node("line", { x1: X(lo), y1: cy, x2: X(hi), y2: cy, ...ink }));
  g.append(node("line", { x1: X(lo), y1: cy - 5, x2: X(lo), y2: cy + 5, ...ink }));
  g.append(node("line", { x1: X(hi), y1: cy - 5, x2: X(hi), y2: cy + 5, ...ink }));
  return g;
}

function dot(X, cy, value, { color, hollow, tip }) {
  if (color?.startsWith("--")) color = token(color);
  const fill = hollow ? token("--card") : color ?? token("--ink");
  const stroke = hollow ? color ?? token("--ink") : token("--card");
  return titled(node("circle", { cx: X(value), cy, r: hollow ? 6 : 6.5, fill, stroke, "stroke-width": 2 }), tip);
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

function drawStrip(rows, { domain, ticks, fmt, width = 556, labelW = 170, rowH = 60, badgeW = 70, axisTitle, aria, zeroLine, ref, top = 10 }) {
  const [d0, d1] = domain;
  // The label column fits the longest label at the rendered size. When that
  // leaves the plot too little room, each label moves onto a line above its row.
  const labelNeed = Math.ceil(
    Math.max(0, ...rows.map((r) => Math.max(textWidth(r.label, "small", r.bold ? 700 : 600), r.sub ? textWidth(r.sub, "caption") : 0))),
  ) + 16;
  const badgeNeed = Math.max(0, ...rows.map((r) => (r.badge ? textWidth(r.badge, "small", 700) + 16 : 0)));
  const badgeRoom = badgeNeed ? Math.max(badgeW, badgeNeed + 12) : badgeW;
  const above = width - Math.max(labelW, labelNeed) - badgeRoom < 180;
  const lift = above ? 20 : 0;
  // The end ticks' labels are centred on them: keep half of each inside.
  const tickHalf = (tv) => textWidth(fmt(tv), "caption") / 2 + 1;
  const x0 = above ? Math.max(4, tickHalf(ticks[0])) : Math.max(labelW, labelNeed);
  const x1 = width - Math.max(badgeRoom, tickHalf(ticks.at(-1)));
  const X = (v) => x0 + ((Math.min(Math.max(v, d0), d1) - d0) * (x1 - x0)) / (d1 - d0);
  const step = rowH + lift;
  const ybot = top + rows.length * step;
  const h = ybot + 34 + (axisTitle ? 16 : 0);
  const caption = fs("caption");
  const small = fs("small");
  const svg = node("svg", { viewBox: `0 0 ${width} ${h}`, width, height: h, role: "img", "aria-label": aria, class: "w4-strip" });
  for (const tv of ticks) {
    svg.append(node("line", { x1: X(tv), y1: top - 4, x2: X(tv), y2: ybot, stroke: token("--w4-grid"), "stroke-width": 1 }));
    svg.append(node("text", { x: X(tv), y: ybot + 16, "font-size": caption, fill: token("--ink-mute"), "text-anchor": "middle" }, fmt(tv)));
  }
  if (zeroLine !== undefined) {
    svg.append(node("line", { x1: X(zeroLine), y1: top - 4, x2: X(zeroLine), y2: ybot, stroke: token("--ink-mute"), "stroke-width": 1 }));
  }
  if (axisTitle) {
    svg.append(node("text", { x: x1, y: ybot + 33, "font-size": caption, fill: token("--ink-mute"), "text-anchor": "end" }, axisTitle));
  }
  // A reference across every row, [value, label]: the label sits above the first row.
  if (ref) {
    const [v, lab] = ref;
    svg.append(
      titled(
        node("line", { x1: X(v), y1: top - 4, x2: X(v), y2: ybot, stroke: token("--ink-soft"), "stroke-width": 1.4, "stroke-dasharray": "3 2" }),
        lab,
      ),
    );
    if (lab) svg.append(smartText(X(v), Math.max(10, top - 8), lab, x0, x1, { fill: token("--ink-soft") }));
  }
  rows.forEach((r, i) => {
    const rowTop = top + i * step;
    const cy = rowTop + lift + rowH / 2 - 2;
    if (r.divider) {
      svg.append(
        node("line", {
          x1: 0,
          y1: rowTop + 2,
          x2: width,
          y2: rowTop + 2,
          stroke: token("--line"),
          "stroke-width": 1,
          "stroke-dasharray": "2 3",
        }),
      );
    }
    const weight = r.bold ? 700 : 600;
    if (above) {
      svg.append(node("text", { x: 0, y: rowTop + 14, "font-size": small, fill: token("--ink"), "font-weight": weight }, r.label));
      if (r.sub) {
        const sx = textWidth(r.label, "small", weight) + 8;
        svg.append(node("text", { x: sx, y: rowTop + 14, "font-size": caption, fill: token("--ink-mute") }, r.sub));
      }
    } else {
      svg.append(node("text", { x: 0, y: cy - (r.sub ? 3 : -4), "font-size": small, fill: token("--ink"), "font-weight": weight }, r.label));
      if (r.sub) svg.append(node("text", { x: 0, y: cy + 13, "font-size": caption, fill: token("--ink-mute") }, r.sub));
    }
    svg.append(node("line", { x1: x0, y1: cy, x2: x1, y2: cy, stroke: token("--line"), "stroke-width": 1 }));
    if (r.base) {
      svg.append(band(X, cy, r.base[0], r.base[1], r.baseTip));
      if (r.baseLabel) svg.append(smartText(X(r.base[0]), cy + 25, r.baseLabel, x0, x1));
    }
    if (r.ref) {
      const [v, lab] = r.ref;
      svg.append(
        node("line", {
          x1: X(v),
          y1: cy - 10,
          x2: X(v),
          y2: cy + 10,
          stroke: token("--ink-soft"),
          "stroke-width": 1.4,
          "stroke-dasharray": "3 2",
        }),
      );
      if (lab) svg.append(smartText(X(v), cy + 25, lab, x0, x1));
    }
    if (r.ci) svg.append(interval(X, cy, r.ci[0], r.ci[1], r.ciTip));
    if (r.real !== undefined && r.real !== null) {
      svg.append(dot(X, cy, r.real, { color: r.color, hollow: r.hollow, tip: r.realTip }));
      if (r.realLabel) {
        svg.append(smartText(X(r.real), cy - 13, r.realLabel, x0, x1, { role: "small", fill: token("--ink"), weight: 700 }));
      }
    }
    if (r.badge) {
      const bw = Math.max(textWidth(r.badge, "small", 700) + 16, 44);
      const bx = Math.min(x1 + 12, width - bw);
      svg.append(node("rect", { x: bx, y: cy - 11, width: bw, height: 22, rx: 11, fill: token("--ground") }));
      svg.append(
        node(
          "text",
          { x: bx + bw / 2, y: cy + 4.5, "font-size": small, fill: token("--ink"), "font-weight": 700, "text-anchor": "middle" },
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

function drawMini({ domain, real, realLabel, base, baseLabel, ref, refLabel, ci, aria, width = 300 }) {
  const w = width;
  const h = 58;
  const x0 = 6;
  const x1 = w - 6;
  const cy = 28;
  const [d0, d1] = domain;
  const X = (v) => x0 + ((Math.min(Math.max(v, d0), d1) - d0) * (x1 - x0)) / (d1 - d0);
  const svg = node("svg", { viewBox: `0 0 ${w} ${h}`, width: w, height: h, role: "img", "aria-label": aria });
  svg.append(node("line", { x1: x0, y1: cy, x2: x1, y2: cy, stroke: token("--line"), "stroke-width": 1 }));
  if (base) {
    svg.append(band(X, cy, base[0], base[1], baseLabel));
    if (baseLabel) svg.append(smartText(X(base[0]), cy + 24, baseLabel, 0, w));
  }
  if (ref !== undefined) {
    svg.append(
      node("line", {
        x1: X(ref),
        y1: cy - 11,
        x2: X(ref),
        y2: cy + 11,
        stroke: token("--ink-soft"),
        "stroke-width": 1.3,
        "stroke-dasharray": "3 2",
      }),
    );
    if (refLabel) svg.append(smartText(X(ref), cy + 24, refLabel, 0, w));
  }
  if (ci) svg.append(interval(X, cy, ci[0], ci[1], `95% interval: ${ci[0].toFixed(2)} to ${ci[1].toFixed(2)}`));
  svg.append(dot(X, cy, real, { tip: realLabel }));
  svg.append(smartText(X(real), cy - 13, realLabel, 0, w, { role: "small", fill: token("--ink"), weight: 700 }));
  return svg;
}
