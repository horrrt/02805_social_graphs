// Network views: one SVG drawing of nodes and links, in the styles the course's
// explorables use. Colours come from post.css (.gv, the --group-* tokens); this
// file only assigns classes, so a theme or a new palette needs no change here.
//
//   import { networkView } from "./kit.js?v=4";
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

import { fs } from "./type-scale.mjs";
import { fitted, node, textWidth } from "./week04-strip.js?v=2";

const HTML = (tag, cls, text) => {
  const el = document.createElement(tag);
  if (cls) el.className = cls;
  if (text !== undefined) el.textContent = text;
  return el;
};
const gclass = (g) => (g === null || g === undefined ? "" : `g${g}`);
const groupOf = (n) => (n.groups?.length === 1 ? n.groups[0] : n.group);

// d3 for zoom and pan, loaded once and only by a view that explores.
let d3Loading;
function loadD3() {
  if (window.d3) return Promise.resolve(window.d3);
  d3Loading ??= new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = new URL("../vendor/d3-7.9.0.min.js", import.meta.url).href;
    s.onload = () => resolve(window.d3);
    s.onerror = () => reject(new Error("could not load d3"));
    document.head.append(s);
  });
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
    for (let g = 0; g < k; g++) {
      const size = state.filter((n) => n.group === g || n.groups?.includes(g)).length;
      const item = HTML(opts.explore ? "button" : "span");
      const [one, many] = opts.unit ?? ["member", "members"];
      item.append(HTML("i", gclass(g)), document.createTextNode(`${opts.groups[g]} (${size} ${size === 1 ? one : many})`));
      if (opts.explore) {
        item.type = "button";
        item.className = "gv-key";
        item.addEventListener("click", () => live?.group(g, true));
      }
      legend.append(item);
    }
    const none = state.filter((n) => (n.group === null || n.group === undefined) && !n.groups?.length).length;
    if (none && opts.legendNone !== false) {
      const item = HTML("span");
      item.append(HTML("i", opts.hollow ? "gv-hollow-dot" : ""), document.createTextNode(`${opts.noneLabel ?? "No group"} (${none})`));
      legend.append(item);
    }
  };

  const build = (width) => {
    // One scale for both axes, so the layout keeps its shape: y runs from 0 to ratio.
    const pad = opts.labels === "inside" ? 22 : 16;
    const scale = width - 2 * pad;
    const height = Math.round(2 * pad + opts.ratio * scale);
    const X = (v) => pad + v * scale;
    const Y = (v) => pad + v * scale;
    const inside = opts.labels === "inside";
    const r = opts.radius ?? (inside ? 13 : state.length > 150 ? 3.6 : 7);
    const svg = node("svg", { viewBox: `0 0 ${width} ${height}`, width, height, role: "img", "aria-label": opts.aria ?? "Network" });
    const view = node("g");
    const lineOf = new Map();
    const dotOf = new Map();

    // Links: faded ones first, so the coloured and highlighted ones sit on top.
    const lines = node("g");
    const links = opts.links.map((l) => ({ ...l, key: `${l.source}|${l.target}`, a: byId.get(l.source), b: byId.get(l.target) }));
    const coloured = (l) => opts.colorLinks && l.group !== null && l.group !== undefined;
    const lifted = (l) => Number(coloured(l)) + 2 * Number(Boolean(l.mark));
    links.sort((p, q) => lifted(p) - lifted(q));
    const marking = links.some((l) => l.mark);
    const maxW = Math.max(1, ...links.map((l) => l.weight ?? 1));
    for (const l of links) {
      const faint = opts.fade && (marking ? !l.mark : opts.colorLinks && !coloured(l));
      const cls = ["gv-link", coloured(l) && !(marking && !l.mark) ? gclass(l.group) : "", l.mark ? "gv-mark" : "", faint ? "gv-faint" : "",
        l.key === focus ? "gv-on" : "", l.dashed ? "gv-dashed" : "", opts.strongLinks ? "gv-strong" : ""];
      const plain = opts.weights ? 0.8 + 3 * Math.sqrt((l.weight ?? 1) / maxW) : state.length > 150 ? 0.7 : 1.4;
      const w = l.key === focus ? 5 : (l.width ?? (l.mark ? 1.5 : plain));
      const at = { x1: X(l.a.x), y1: Y(l.a.y), x2: X(l.b.x), y2: Y(l.b.y) };
      const line = node("line", { ...at, class: cls.filter(Boolean).join(" "), "stroke-width": w });
      lineOf.set(l, line);
      if (l.title && opts.titles !== "none") line.append(node("title", {}, l.title));
      lines.append(line);
      if (opts.weights) {
        const hit = node("line", { ...at, class: "gv-hit" });
        hit.append(node("title", {}, `${l.a.label ?? l.a.id} and ${l.b.label ?? l.b.id}: weight ${l.weight}`));
        hit.addEventListener("pointerenter", () => { focus = l.key; redraw(); });
        lines.append(hit);
      }
    }
    view.append(lines);

    // Nodes.
    const dots = node("g");
    for (const n of state) {
      const cx = X(n.x);
      const cy = Y(n.y);
      const g = node("g", { "data-id": n.id });
      dotOf.set(n.id, g);
      const two = n.groups?.length === 2;
      const one = two ? null : n.groups?.length === 1 ? n.groups[0] : n.group;
      const empty = (one === null || one === undefined) && !two;
      if (two) {
        // Two halves, left in the first group, right in the second.
        g.append(node("path", { d: `M${cx},${cy - r} A${r},${r} 0 0 0 ${cx},${cy + r} Z`, class: `gv-node ${gclass(n.groups[0])}` }));
        g.append(node("path", { d: `M${cx},${cy - r} A${r},${r} 0 0 1 ${cx},${cy + r} Z`, class: `gv-node ${gclass(n.groups[1])}` }));
        g.append(node("circle", { cx, cy, r, class: "gv-outline" }));
      } else {
        const cls = ["gv-node", empty && opts.hollow ? "gv-hollow" : "", opts.colorNodes ? gclass(one) : "", empty && opts.tone === "accent" ? "gv-tone" : ""];
        g.append(node("circle", { cx, cy, r: n.r ?? (opts.hubs?.includes(n.id) && !inside ? r + 2.5 : r), class: cls.filter(Boolean).join(" ") }));
      }
      if (inside) {
        g.append(node("text", { x: cx, y: cy + fs("small") * 0.36, "font-size": fs("small"), "text-anchor": "middle",
          class: `gv-inside ${two ? "gv-split" : empty && opts.hollow ? "gv-on-hollow" : opts.colorNodes ? gclass(one) : ""}`.trim() }, n.label ?? n.id));
      }
      if (opts.badges && !empty) {
        const b = node("g", { class: "gv-badge" });
        const bx = cx + r * 0.78;
        const by = cy - r * 0.78;
        b.append(node("circle", { cx: bx, cy: by, r: 7.5 }));
        b.append(node("text", { x: bx, y: by + fs("caption") * 0.34, "font-size": fs("caption") - 1.5, "text-anchor": "middle" }, String((one ?? 0) + 1)));
        g.append(b);
      }
      const titled = opts.titles === "none" ? false : opts.titles === "hubs" ? opts.hubs?.includes(n.id) : true;
      if (!opts.explore && titled && n.title) g.append(node("title", {}, n.title));
      else if (!opts.explore && titled) g.append(node("title", {}, `${n.label ?? n.id}${two ? `: ${opts.groups?.[n.groups[0]]} and ${opts.groups?.[n.groups[1]]}` : !empty && opts.groups ? `: ${opts.groups[one]}` : ""}`));
      if (opts.movable && !two) {
        g.dataset.movable = "";
        g.setAttribute("tabindex", "0");
        g.setAttribute("role", "button");
        g.setAttribute("aria-label", `${n.label ?? n.id}, ${empty ? "no group" : opts.groups[one]}. Move to the next group.`);
        const move = () => {
          n.group = empty ? 0 : (one + 1) % k;
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

    // Side labels: a caption beside each labelled node, in the first free spot of
    // left, right, above-left and below-right; nodes with labelSide "left" first.
    if (opts.labels === "beside") {
      const placed = [];
      const clear = (b) => placed.every((q) => b.x1 < q.x0 || b.x0 > q.x1 || b.y1 < q.y0 || b.y0 > q.y1);
      const order = [...state].sort((a, b) => Number(b.labelSide === "left") - Number(a.labelSide === "left"));
      const names = node("g", { class: "gv-side" });
      for (const n of order) {
        if (!n.label) continue;
        const w = textWidth(n.label, "caption");
        const [cx, cy, nr] = [X(n.x), Y(n.y), n.r ?? r];
        const spot = (side, dy) => {
          const x = side === "end" ? cx - nr - 5 : cx + nr + 5;
          const y = cy + 4 + dy;
          return { x, y, anchor: side, x0: side === "end" ? x - w : x, x1: side === "end" ? x : x + w, y0: y - 10, y1: y + 3 };
        };
        const spots = n.labelSide === "left" ? [spot("end", 0)] : [spot("end", 0), spot("start", 0), spot("end", -12), spot("start", 12)];
        const at = spots.find(clear) ?? spots[0];
        placed.push(at);
        names.append(node("text", { x: at.x, y: at.y, "font-size": fs("caption"), "text-anchor": at.anchor }, n.label));
      }
      view.append(names);
    }

    // Hub rings and name pills, drawn last so no node covers them.
    const tags = node("g");
    const taken = []; // pill boxes placed so far, so close hubs stack instead of overlapping
    const clash = (x, y, w) => taken.some((t) => x < t.x + t.w && t.x < x + w && Math.abs(y - t.y) < 24);
    for (const id of opts.hubs ?? []) {
      const n = byId.get(id);
      if (!n) continue;
      const cx = X(n.x);
      const cy = Y(n.y);
      const one = groupOf(n);
      const hub = node("g", { class: "gv-hub", "data-hub": id });
      if (opts.explore) {
        hub.setAttribute("tabindex", "0");
        hub.setAttribute("role", "button");
        hub.setAttribute("aria-label", `${n.label ?? n.id}: light up its group`);
      }
      tags.append(hub);
      hub.append(node("circle", { cx, cy, r: r + 7, class: `gv-ring ${one === null || one === undefined ? "gnone" : gclass(one)}` }));
      const text = n.label ?? n.id;
      const tw = textWidth(text, "small", 700);
      const left = cx + r + 12 + tw + 12 > width;
      // The first free spot: beside the node, then a step up or down, then two.
      const right = cx + r + 10;
      const leftX = cx - r - 10 - tw - 12;
      const spots = [];
      for (const dy of [0, -24, 24, -48, 48, -72, 72]) for (const x of left ? [leftX, right] : [right, leftX]) spots.push([x, cy + dy]);
      const fits = ([x, y]) => x >= 0 && x + tw + 12 <= width && y - 11 >= 0 && y + 11 <= height && !clash(x, y, tw + 12);
      const [x0, ty] = spots.find(fits) ?? spots[0];
      taken.push({ x: x0, y: ty, w: tw + 12 });
      if (ty !== cy) hub.append(node("line", { x1: cx, y1: cy, x2: x0 < cx ? x0 + tw + 12 : x0, y2: ty, class: "gv-link gv-leader" }));
      hub.append(node("rect", { x: x0, y: ty - 11, width: tw + 12, height: 22, rx: 4, class: "gv-pill" }));
      hub.append(node("text", { x: x0 + 6, y: ty + fs("small") * 0.36, "font-size": fs("small"), class: "gv-name" }, text));
    }
    // A highlighted link's weight, on a pill at its middle.
    const on = links.find((l) => l.key === focus);
    if (on && opts.weights) {
      const text = String(on.weight);
      const tw = textWidth(text, "body", 800);
      const mx = (X(on.a.x) + X(on.b.x)) / 2;
      const my = (Y(on.a.y) + Y(on.b.y)) / 2;
      const w = node("g", { class: "gv-weight" });
      w.append(node("rect", { x: mx - tw / 2 - 10, y: my - 14, width: tw + 20, height: 28, rx: 7 }));
      w.append(node("text", { x: mx, y: my + fs("body") * 0.36, "font-size": fs("body"), "text-anchor": "middle" }, text));
      tags.append(w);
    }
    view.append(tags);
    svg.append(view);
    if (opts.explore) explore(svg, view, { width, height, links, lineOf, dotOf });
    return svg;
  };

  // Lighting, the tooltip and zoom for one drawn view.
  const explore = (svg, view, { width, height, links, lineOf, dotOf }) => {
    const near = new Map(state.map((n) => [n.id, { lines: [], ids: new Set(), marked: 0 }]));
    for (const l of links) {
      for (const [a, b] of [[l.source, l.target], [l.target, l.source]]) {
        const e = near.get(a);
        e.lines.push(lineOf.get(l));
        e.ids.add(b);
        if (l.mark) e.marked += 1;
      }
    }
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
      for (const line of e.lines) line.classList.add("gv-hi");
      for (const m of e.ids) dotOf.get(m).classList.add("gv-hi");
    };
    const describe = (id) => {
      const n = byId.get(id);
      const e = near.get(id);
      const g = groupOf(n);
      const info = { degree: e.ids.size, marked: e.marked, group: g === null || g === undefined ? null : opts.groups?.[g] };
      return opts.describe?.(n, info) ?? [n.label ?? info.group ?? "No group", `${info.degree} ${info.degree === 1 ? "link" : "links"}`];
    };
    const lightGroup = (g, pin) => {
      clear(true);
      pinned = pin;
      svg.classList.add("gv-lit");
      for (const n of state) if (groupOf(n) === g) dotOf.get(n.id).classList.add("gv-hi");
      for (const l of links) if (groupOf(l.a) === g && groupOf(l.b) === g) lineOf.get(l).classList.add("gv-hi");
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
