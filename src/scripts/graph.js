// Network views: one SVG drawing of nodes and links, in the styles the course's
// explorables use. Colours come from post.css (.gv, the --group-* tokens); this
// file only assigns classes, so a theme or a new palette needs no change here.
//
//   import { networkView } from "./kit.js";
//   networkView(host, { nodes, links, groups: ["Hulk", "Wolverine"], colorLinks: true, hubs: ["Hulk"] });
//
// A node is { id, x, y, label?, group?, groups? }: x and y run from 0 to 1 (lay
// them out in the analysis script with a seeded layout), group is 0 to 7 or
// null, and groups: [a, b] draws a node in two groups as two halves. A link is
// { source, target, weight?, group? }; group colours it when colorLinks is on.
// A node may also set r (its radius), title (its tooltip) and labelSide ("left":
// its side label only there); a link may set width, dashed and title.
//
// Options, each off unless set:
//   theme: "dark"            the dark surface of the course explorables
//   colorNodes: false        every node grey (links carry the groups)
//   colorLinks: true         a link in its group's colour; fade: true dims the rest
//   mark on a link           mark: true draws it in ink above the others; fade: true dims the rest
//   titles: "hubs"           a tooltip on the hubs only ("none": on no node); default: every node
//   hubs: [ids]              a ring and a name pill on these nodes
//   labels: "inside"         each node's label written inside it (small networks)
//   labels: "beside"         each node's label as a caption beside it, in the first free spot
//   tone: "accent"           nodes in no group in the accent colour instead of grey
//   strongLinks: true        links in dark ink, for when the links carry the result
//   badges: true             a numbered badge with the node's group
//   hollow: true             a node in no group drawn as an empty ring
//   weights: true            hover a link to see its weight; highlight: {source, target} starts one on
//   movable: true            click or press Enter on a node to move it to the next group
//   legend: true             a line above with each group's colour, name and size
//   unit: ["page", "pages"]  what the legend counts (default members)
//   note: "…"                a line above the legend (the toy-example label, say)
//   ratio: 0.75              the layout's height over its width: y runs from 0 to ratio
//   onChange(nodes)          called after a move
//   explore: true            hover or focus a node to light its links and neighbours; click a hub's
//                            name or a legend entry to light its group; zoom with the buttons,
//                            Ctrl or ⌘ with the wheel, or a pinch, and drag to pan
//   describe(n, info)        the tooltip's lines for a node under explore; info is { degree, marked,
//                            group }. Default: its label, or its group, and its number of links

import { loadVendor } from "./runtime/vendor.js";
import { fs } from "./type-scale.mjs";
import { fitted, node, textWidth } from "./week04-strip.js";

const HTML = (tag, cls, text) => {
  const el = document.createElement(tag);
  if (cls) el.className = cls;
  if (text !== undefined) el.textContent = text;
  return el;
};
export const gclass = (g) => (g === null || g === undefined ? "" : `g${g}`);
export const groupOf = (n) => (n.groups?.length === 1 ? n.groups[0] : n.group);

// The drawing as plain data, so networkView() below and the React
// NetworkView (src/kit/NetworkView.tsx) draw the same view: each takes these
// rows and turns them into elements. measure(text, role, weight) gives a
// label's width in px and size(role) a type role's size (textWidth and fs, or
// useTextMeasure and useTypeScale in a component).

/** The two half-discs of a node in two groups, left in the first group, right in the second. */
export function halfArcs(cx, cy, r) {
  return [`M${cx},${cy - r} A${r},${r} 0 0 0 ${cx},${cy + r} Z`, `M${cx},${cy - r} A${r},${r} 0 0 1 ${cx},${cy + r} Z`];
}

/** The legend: one row per group with its dot class and text, and the row of nodes in no group (or null). */
export function legendRows(opts, state) {
  const k = opts.groups?.length ?? 0;
  const [one, many] = opts.unit ?? ["member", "members"];
  const rows = [];
  for (let g = 0; g < k; g++) {
    const size = state.filter((n) => n.group === g || n.groups?.includes(g)).length;
    rows.push({ group: g, dot: gclass(g), text: `${opts.groups[g]} (${size} ${size === 1 ? one : many})` });
  }
  const none = state.filter((n) => (n.group === null || n.group === undefined) && !n.groups?.length).length;
  const rest = none && opts.legendNone !== false ? { dot: opts.hollow ? "gv-hollow-dot" : "", text: `${opts.noneLabel ?? "No group"} (${none})` } : null;
  return { rows, none: rest };
}

/** The group a movable node moves to: from no group to the first, else the next. */
export const nextGroup = (mark, k) => (mark.empty ? 0 : (mark.one + 1) % k);

/**
 * The view at `width`, as rows: the svg's size; the links in drawing order
 * (faded first), each with its class, stroke width, ends, title and, under
 * weights, its hover line's title; the nodes, each with its shapes, inside
 * label, badge, title and movable label; the side labels; the hub rings and
 * name pills; and the highlighted link's weight pill. focus is the
 * highlighted link's key, "source|target".
 */
export function networkLayout(opts, state, width, focus, measure = textWidth, size = fs) {
  const byId = new Map(state.map((n) => [n.id, n]));
  // One scale for both axes, so the layout keeps its shape: y runs from 0 to ratio.
  const inside = opts.labels === "inside";
  const pad = inside ? 22 : 16;
  const scale = width - 2 * pad;
  const height = Math.round(2 * pad + opts.ratio * scale);
  const X = (v) => pad + v * scale;
  const Y = (v) => pad + v * scale;
  const r = opts.radius ?? (inside ? 13 : state.length > 150 ? 3.6 : 7);

  // Links: faded ones first, so the coloured and highlighted ones sit on top.
  const links = opts.links.map((l) => ({ ...l, key: `${l.source}|${l.target}`, a: byId.get(l.source), b: byId.get(l.target) }));
  const coloured = (l) => opts.colorLinks && l.group !== null && l.group !== undefined;
  const lifted = (l) => Number(coloured(l)) + 2 * Number(Boolean(l.mark));
  links.sort((p, q) => lifted(p) - lifted(q));
  const marking = links.some((l) => l.mark);
  const maxW = Math.max(1, ...links.map((l) => l.weight ?? 1));
  const lines = links.map((l) => {
    const faint = opts.fade && (marking ? !l.mark : opts.colorLinks && !coloured(l));
    const cls = ["gv-link", coloured(l) && !(marking && !l.mark) ? gclass(l.group) : "", l.mark ? "gv-mark" : "", faint ? "gv-faint" : "",
      l.key === focus ? "gv-on" : "", l.dashed ? "gv-dashed" : "", opts.strongLinks ? "gv-strong" : ""];
    const plain = opts.weights ? 0.8 + 3 * Math.sqrt((l.weight ?? 1) / maxW) : state.length > 150 ? 0.7 : 1.4;
    return {
      link: l,
      cls: cls.filter(Boolean).join(" "),
      width: l.key === focus ? 5 : (l.width ?? (l.mark ? 1.5 : plain)),
      at: { x1: X(l.a.x), y1: Y(l.a.y), x2: X(l.b.x), y2: Y(l.b.y) },
      title: l.title && opts.titles !== "none" ? l.title : null,
      hit: opts.weights ? `${l.a.label ?? l.a.id} and ${l.b.label ?? l.b.id}: weight ${l.weight}` : null,
    };
  });

  // Nodes.
  const nodes = state.map((n) => {
    const cx = X(n.x);
    const cy = Y(n.y);
    const two = n.groups?.length === 2;
    const one = two ? null : n.groups?.length === 1 ? n.groups[0] : n.group;
    const empty = (one === null || one === undefined) && !two;
    const shapes = two
      ? [...halfArcs(cx, cy, r).map((d, i) => ({ d, cls: `gv-node ${gclass(n.groups[i])}` })), { cx, cy, r, cls: "gv-outline" }]
      : [{ cx, cy, r: n.r ?? (opts.hubs?.includes(n.id) && !inside ? r + 2.5 : r),
        cls: ["gv-node", empty && opts.hollow ? "gv-hollow" : "", opts.colorNodes ? gclass(one) : "", empty && opts.tone === "accent" ? "gv-tone" : ""].filter(Boolean).join(" ") }];
    const label = inside
      ? { x: cx, y: cy + size("small") * 0.36, role: "small", text: n.label ?? n.id,
        cls: `gv-inside ${two ? "gv-split" : empty && opts.hollow ? "gv-on-hollow" : opts.colorNodes ? gclass(one) : ""}`.trim() }
      : null;
    const bx = cx + r * 0.78;
    const by = cy - r * 0.78;
    const badge = opts.badges && !empty ? { cx: bx, cy: by, r: 7.5, x: bx, y: by + size("caption") * 0.34, text: String((one ?? 0) + 1) } : null;
    const titled = opts.titles === "none" ? false : opts.titles === "hubs" ? opts.hubs?.includes(n.id) : true;
    const title = opts.explore || !titled ? null
      : n.title || `${n.label ?? n.id}${two ? `: ${opts.groups?.[n.groups[0]]} and ${opts.groups?.[n.groups[1]]}` : !empty && opts.groups ? `: ${opts.groups[one]}` : ""}`;
    const movable = opts.movable && !two ? `${n.label ?? n.id}, ${empty ? "no group" : opts.groups[one]}. Move to the next group.` : null;
    return { id: n.id, one, empty, shapes, label, badge, title, movable };
  });

  // Side labels: a caption beside each labelled node, in the first free spot of
  // left, right, above-left and below-right; nodes with labelSide "left" first.
  let side = null;
  if (opts.labels === "beside") {
    side = [];
    const placed = [];
    const clear = (b) => placed.every((q) => b.x1 < q.x0 || b.x0 > q.x1 || b.y1 < q.y0 || b.y0 > q.y1);
    const order = [...state].sort((a, b) => Number(b.labelSide === "left") - Number(a.labelSide === "left"));
    for (const n of order) {
      if (!n.label) continue;
      const w = measure(n.label, "caption");
      const [cx, cy, nr] = [X(n.x), Y(n.y), n.r ?? r];
      const spot = (anchor, dy) => {
        const x = anchor === "end" ? cx - nr - 5 : cx + nr + 5;
        const y = cy + 4 + dy;
        return { x, y, anchor, x0: anchor === "end" ? x - w : x, x1: anchor === "end" ? x : x + w, y0: y - 10, y1: y + 3 };
      };
      const spots = n.labelSide === "left" ? [spot("end", 0)] : [spot("end", 0), spot("start", 0), spot("end", -12), spot("start", 12)];
      const at = spots.find(clear) ?? spots[0];
      placed.push(at);
      side.push({ x: at.x, y: at.y, anchor: at.anchor, text: n.label });
    }
  }

  // Hub rings and name pills, drawn last so no node covers them.
  const hubs = [];
  const taken = []; // pill boxes placed so far, so close hubs stack instead of overlapping
  const clash = (x, y, w) => taken.some((t) => x < t.x + t.w && t.x < x + w && Math.abs(y - t.y) < 24);
  for (const id of opts.hubs ?? []) {
    const n = byId.get(id);
    if (!n) continue;
    const cx = X(n.x);
    const cy = Y(n.y);
    const one = groupOf(n);
    const text = n.label ?? n.id;
    const tw = measure(text, "small", 700);
    const left = cx + r + 12 + tw + 12 > width;
    // The first free spot: beside the node, then a step up or down, then two.
    const right = cx + r + 10;
    const leftX = cx - r - 10 - tw - 12;
    const spots = [];
    for (const dy of [0, -24, 24, -48, 48, -72, 72]) for (const x of left ? [leftX, right] : [right, leftX]) spots.push([x, cy + dy]);
    const fits = ([x, y]) => x >= 0 && x + tw + 12 <= width && y - 11 >= 0 && y + 11 <= height && !clash(x, y, tw + 12);
    const [x0, ty] = spots.find(fits) ?? spots[0];
    taken.push({ x: x0, y: ty, w: tw + 12 });
    hubs.push({
      id,
      group: one,
      aria: `${n.label ?? n.id}: light up its group`,
      ring: { cx, cy, r: r + 7, cls: `gv-ring ${one === null || one === undefined ? "gnone" : gclass(one)}` },
      leader: ty !== cy ? { x1: cx, y1: cy, x2: x0 < cx ? x0 + tw + 12 : x0, y2: ty } : null,
      pill: { x: x0, y: ty - 11, width: tw + 12, height: 22, rx: 4 },
      name: { x: x0 + 6, y: ty + size("small") * 0.36, text },
    });
  }

  // A highlighted link's weight, on a pill at its middle.
  const on = links.find((l) => l.key === focus);
  let weight = null;
  if (on && opts.weights) {
    const text = String(on.weight);
    const tw = measure(text, "body", 800);
    const mx = (X(on.a.x) + X(on.b.x)) / 2;
    const my = (Y(on.a.y) + Y(on.b.y)) / 2;
    weight = { pill: { x: mx - tw / 2 - 10, y: my - 14, width: tw + 20, height: 28, rx: 7 }, text: { x: mx, y: my + size("body") * 0.36, text } };
  }
  return { width, height, lines, nodes, side, hubs, weight };
}

/** Under explore: per node id, the indices of its lines, its neighbours' ids and how many of its links are marked. */
export function neighbours(state, lines) {
  const near = new Map(state.map((n) => [n.id, { lines: [], ids: new Set(), marked: 0 }]));
  lines.forEach(({ link: l }, i) => {
    for (const [a, b] of [[l.source, l.target], [l.target, l.source]]) {
      const e = near.get(a);
      e.lines.push(i);
      e.ids.add(b);
      if (l.mark) e.marked += 1;
    }
  });
  return near;
}

/** A node's tooltip lines under explore: opts.describe's, or its label (or group) and its number of links. */
export function describeNode(opts, n, e) {
  const g = groupOf(n);
  const info = { degree: e.ids.size, marked: e.marked, group: g === null || g === undefined ? null : opts.groups?.[g] };
  return opts.describe?.(n, info) ?? [n.label ?? info.group ?? "No group", `${info.degree} ${info.degree === 1 ? "link" : "links"}`];
}

// d3 for zoom and pan, loaded once and only by a view that explores.
let d3Loading;
function loadD3() {
  if (window.d3) return Promise.resolve(window.d3);
  d3Loading ??= loadVendor("d3-7.9.0.min.js").then(
    () => window.d3,
    () => {
      throw new Error("could not load d3");
    },
  );
  return d3Loading;
}

export function networkView(host, spec) {
  const opts = { colorNodes: true, ratio: 0.75, ...spec };
  const state = opts.nodes.map((n) => ({ ...n }));
  const byId = new Map(state.map((n) => [n.id, n]));
  const k = opts.groups?.length ?? 0;
  let focus = opts.highlight ? `${opts.highlight.source}|${opts.highlight.target}` : null;

  host.replaceChildren();
  const wrap = HTML("div", `gv${opts.theme === "dark" ? " gv-dark" : ""}${opts.explore ? " gv-explore" : ""}`);
  if (opts.note) wrap.append(HTML("p", "gv-note", opts.note));
  const legend = opts.legend ? HTML("p", "gv-legend") : null;
  if (legend) wrap.append(legend);
  const stage = HTML("div", "gv-stage");
  wrap.append(stage);
  host.append(wrap);
  // Under explore: the tooltip, the zoom buttons, and the lighting of the view now drawn.
  const tip = opts.explore ? HTML("div", "gv-tip") : null;
  let live = null;
  if (tip) {
    tip.hidden = true;
    const tools = HTML("div", "gv-tools");
    for (const [label, name] of [["+", "Zoom in"], ["−", "Zoom out"], ["Reset", "Reset the zoom"]]) {
      const b = HTML("button", "", label);
      b.type = "button";
      b.setAttribute("aria-label", name);
      b.addEventListener("click", () => live?.zoom(label));
      tools.append(b);
    }
    stage.append(tip, tools);
    wrap.addEventListener("keydown", (e) => { if (e.key === "Escape") live?.clear(true); });
  }

  const drawLegend = () => {
    if (!legend) return;
    legend.replaceChildren();
    const { rows, none } = legendRows(opts, state);
    for (const row of rows) {
      const item = HTML(opts.explore ? "button" : "span");
      item.append(HTML("i", row.dot), document.createTextNode(row.text));
      if (opts.explore) {
        item.type = "button";
        item.className = "gv-key";
        item.addEventListener("click", () => live?.group(row.group, true));
      }
      legend.append(item);
    }
    if (none) {
      const item = HTML("span");
      item.append(HTML("i", none.dot), document.createTextNode(none.text));
      legend.append(item);
    }
  };

  const build = (width) => {
    const L = networkLayout(opts, state, width, focus);
    const svg = node("svg", { viewBox: `0 0 ${width} ${L.height}`, width, height: L.height, role: "img", "aria-label": opts.aria ?? "Network" });
    const view = node("g");
    const lineEls = [];
    const dotOf = new Map();

    const lines = node("g");
    for (const row of L.lines) {
      const line = node("line", { ...row.at, class: row.cls, "stroke-width": row.width });
      lineEls.push(line);
      if (row.title) line.append(node("title", {}, row.title));
      lines.append(line);
      if (row.hit) {
        const hit = node("line", { ...row.at, class: "gv-hit" });
        hit.append(node("title", {}, row.hit));
        hit.addEventListener("pointerenter", () => { focus = row.link.key; redraw(); });
        lines.append(hit);
      }
    }
    view.append(lines);

    const dots = node("g");
    for (const mark of L.nodes) {
      const n = byId.get(mark.id);
      const g = node("g", { "data-id": mark.id });
      dotOf.set(mark.id, g);
      for (const s of mark.shapes) g.append(s.d ? node("path", { d: s.d, class: s.cls }) : node("circle", { cx: s.cx, cy: s.cy, r: s.r, class: s.cls }));
      if (mark.label) {
        const t = mark.label;
        g.append(node("text", { x: t.x, y: t.y, "font-size": fs(t.role), "text-anchor": "middle", class: t.cls }, t.text));
      }
      if (mark.badge) {
        const b = node("g", { class: "gv-badge" });
        const at = mark.badge;
        b.append(node("circle", { cx: at.cx, cy: at.cy, r: at.r }));
        b.append(node("text", { x: at.x, y: at.y, "font-size": fs("caption") - 1.5, "text-anchor": "middle" }, at.text));
        g.append(b);
      }
      if (mark.title !== null) g.append(node("title", {}, mark.title));
      if (mark.movable !== null) {
        g.dataset.movable = "";
        g.setAttribute("tabindex", "0");
        g.setAttribute("role", "button");
        g.setAttribute("aria-label", mark.movable);
        const move = () => {
          n.group = nextGroup(mark, k);
          drawLegend();
          redraw(n.id);
          opts.onChange?.(state);
        };
        g.addEventListener("click", move);
        g.addEventListener("keydown", (e) => {
          if (e.key === "Enter" || e.key === " ") { e.preventDefault(); move(); }
        });
      }
      dots.append(g);
    }
    view.append(dots);

    if (L.side) {
      const names = node("g", { class: "gv-side" });
      for (const t of L.side) names.append(node("text", { x: t.x, y: t.y, "font-size": fs("caption"), "text-anchor": t.anchor }, t.text));
      view.append(names);
    }

    const tags = node("g");
    for (const h of L.hubs) {
      const hub = node("g", { class: "gv-hub", "data-hub": h.id });
      if (opts.explore) {
        hub.setAttribute("tabindex", "0");
        hub.setAttribute("role", "button");
        hub.setAttribute("aria-label", h.aria);
      }
      tags.append(hub);
      hub.append(node("circle", { cx: h.ring.cx, cy: h.ring.cy, r: h.ring.r, class: h.ring.cls }));
      if (h.leader) hub.append(node("line", { ...h.leader, class: "gv-link gv-leader" }));
      hub.append(node("rect", { ...h.pill, class: "gv-pill" }));
      hub.append(node("text", { x: h.name.x, y: h.name.y, "font-size": fs("small"), class: "gv-name" }, h.name.text));
    }
    if (L.weight) {
      const w = node("g", { class: "gv-weight" });
      w.append(node("rect", L.weight.pill));
      w.append(node("text", { x: L.weight.text.x, y: L.weight.text.y, "font-size": fs("body"), "text-anchor": "middle" }, L.weight.text.text));
      tags.append(w);
    }
    view.append(tags);
    svg.append(view);
    if (opts.explore) explore(svg, view, { width, height: L.height, L, lineEls, dotOf });
    return svg;
  };

  // Lighting, the tooltip and zoom for one drawn view.
  const explore = (svg, view, { width, height, L, lineEls, dotOf }) => {
    const near = neighbours(state, L.lines);
    let pinned = false;
    const clear = (unpin) => {
      if (pinned && !unpin) return;
      pinned = false;
      svg.classList.remove("gv-lit");
      for (const el of svg.querySelectorAll(".gv-hi")) el.classList.remove("gv-hi");
      tip.hidden = true;
    };
    const say = (lines, x, y) => {
      tip.replaceChildren(...lines.map((t, i) => HTML(i ? "span" : "b", "", t)));
      const box = stage.getBoundingClientRect();
      tip.style.left = `${Math.min(x - box.left + 14, box.width - 240)}px`;
      tip.style.top = `${y - box.top + 14}px`;
      tip.hidden = false;
    };
    const lightNode = (id) => {
      clear(true);
      svg.classList.add("gv-lit");
      const e = near.get(id);
      dotOf.get(id).classList.add("gv-hi");
      for (const i of e.lines) lineEls[i].classList.add("gv-hi");
      for (const m of e.ids) dotOf.get(m).classList.add("gv-hi");
    };
    const describe = (id) => describeNode(opts, byId.get(id), near.get(id));
    const lightGroup = (g, pin) => {
      clear(true);
      pinned = pin;
      svg.classList.add("gv-lit");
      for (const n of state) if (groupOf(n) === g) dotOf.get(n.id).classList.add("gv-hi");
      L.lines.forEach(({ link: l }, i) => { if (groupOf(l.a) === g && groupOf(l.b) === g) lineEls[i].classList.add("gv-hi"); });
      for (const hub of svg.querySelectorAll(".gv-hub")) if (groupOf(byId.get(hub.dataset.hub)) === g) hub.classList.add("gv-hi");
    };
    const dots = [...dotOf.values()];
    for (const dot of dots) {
      const id = dot.dataset.id;
      dot.addEventListener("pointerenter", (ev) => { if (!pinned) { lightNode(id); say(describe(id), ev.clientX, ev.clientY); } });
      dot.addEventListener("pointermove", (ev) => { if (!pinned) say(describe(id), ev.clientX, ev.clientY); });
      dot.addEventListener("pointerleave", () => clear());
      dot.addEventListener("click", (ev) => {
        ev.stopPropagation();
        lightNode(id);
        pinned = true;
        say(describe(id), ev.clientX, ev.clientY);
      });
    }
    for (const hub of svg.querySelectorAll(".gv-hub")) {
      const id = hub.dataset.hub;
      const g = groupOf(byId.get(id));
      const show = (pin) => {
        lightGroup(g, pin);
        const r = hub.getBoundingClientRect();
        say(describe(id), r.left, r.bottom - 8);
      };
      hub.addEventListener("click", (ev) => { ev.stopPropagation(); show(true); });
      hub.addEventListener("keydown", (ev) => { if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); show(true); } });
      hub.addEventListener("focus", () => show(false));
      hub.addEventListener("blur", () => clear());
    }
    svg.addEventListener("click", () => clear(true));

    let zoom = () => {};
    loadD3().then((d3) => {
      const z = d3.zoom()
        .scaleExtent([1, 8])
        .translateExtent([[0, 0], [width, height]])
        .filter((ev) => (ev.type === "wheel" ? ev.ctrlKey || ev.metaKey : !ev.button))
        .on("zoom", (ev) => view.setAttribute("transform", ev.transform));
      const sel = d3.select(svg).call(z).on("dblclick.zoom", null);
      zoom = (label) => {
        const t = sel.transition().duration(250);
        if (label === "+") t.call(z.scaleBy, 1.6);
        else if (label === "−") t.call(z.scaleBy, 1 / 1.6);
        else t.call(z.transform, d3.zoomIdentity);
      };
    }).catch((err) => console.error(err));
    live = { clear, group: lightGroup, zoom: (label) => zoom(label) };
  };

  let chart;
  const redraw = (keep) => {
    const width = Number(chart?.getAttribute("width")) || opts.width || 640;
    const next = fitted(build, width);
    if (chart) chart.replaceWith(next);
    else stage.append(next);
    chart = next;
    if (keep) chart.querySelector(`[data-id="${CSS.escape(keep)}"]`)?.focus();
  };
  drawLegend();
  redraw();
  return { nodes: state, redraw };
}
