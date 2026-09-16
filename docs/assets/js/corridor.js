// Corridor Control — week 3.
//
// Draws two country networks over the same world: migration from the UN
// migrant stock, flights from OpenFlights. Everything here is a view of
// docs/assets/data/week03_corridors.json and week03_edges.json, both written
// by analysis/week03_corridor_control.py. No number is computed in this file
// that is not a ratio or a rank of something already in that data.

// Not constants: the palette dropdown rewrites these from CSS custom
// properties, so one definition in corridor.css drives the stylesheet, the SVG
// variants and the 2D canvas at once.
let PEOPLE = "#f2820c";
let ACCESS = "#1f8fd6";
let INK = "#0f2340";
let MUTE = "#7a8fac";
let GRID = "#e4ebf4";

export function rgb(hex) {
  const value = (hex || "").trim().replace("#", "");
  const full = value.length === 3 ? [...value].map((c) => c + c).join("") : value;
  const n = Number.parseInt(full, 16);
  return Number.isNaN(n) ? "128,128,128" : `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}`;
}

export function refreshPalette() {
  const styles = getComputedStyle(document.body);
  const read = (name, fallback) =>
    (styles.getPropertyValue(name) || "").trim() || fallback;
  PEOPLE = read("--people", "#f2820c");
  ACCESS = read("--access", "#1f8fd6");
  INK = read("--ink", "#0f2340");
  MUTE = read("--ink-mute", "#7a8fac");
  GRID = read("--line-soft", "#e4ebf4");
  if (typeof SERIES !== "undefined") {
    SERIES[0].colour = PEOPLE;
    SERIES[1].colour = INK;
    SERIES[2].colour = ACCESS;
  }
  if (api) {
    api.colours.PEOPLE = PEOPLE;
    api.colours.ACCESS = ACCESS;
    api.colours.INK = INK;
    api.colours.MUTE = MUTE;
    api.colours.GRID = GRID;
  }
  return { PEOPLE, ACCESS, INK, MUTE, GRID };
}

// How a corridor is drawn between two countries. Each renderer reads the same
// spec and expresses it in its own terms, so "tapered" means the same idea on
// a 2D canvas, an SVG path and a WebGL arc.
export const ARC_STYLES = {
  curve: { curvature: 0.16, altitude: 0.42, dashed: false, taper: false },
  straight: { curvature: 0, altitude: 0, dashed: false, taper: false },
  flow: { curvature: 0.16, altitude: 0.42, dashed: true, taper: false },
  taper: { curvature: 0.16, altitude: 0.42, dashed: false, taper: true },
};

export function arcSpec() {
  return ARC_STYLES[state.arcs] ?? ARC_STYLES.curve;
}

// How a link's weight becomes something you can see. Width is the honest
// default: a doubling of people is a doubling of ink. Colour frees the width
// for something else, at the cost of being read less accurately.
export const LINK_ENCODINGS = {
  width: { width: true, ramp: false },
  colour: { width: false, ramp: true },
  both: { width: true, ramp: true },
  uniform: { width: false, ramp: false },
};

export const THICKNESS = { thin: 0.55, normal: 1, thick: 1.9 };

export function linkSpec() {
  return LINK_ENCODINGS[state.links] ?? LINK_ENCODINGS.width;
}

// A red-to-green ramp over the weight share. Kept perceptually ordered rather
// than pretty: light green is the heaviest link, deep red the lightest.
export function rampColour(share) {
  const stops = [
    [0.0, [190, 60, 48]],
    [0.35, [214, 132, 52]],
    [0.65, [196, 188, 66]],
    [1.0, [70, 168, 92]],
  ];
  let lo = stops[0];
  let hi = stops.at(-1);
  for (let i = 0; i < stops.length - 1; i += 1) {
    if (share >= stops[i][0] && share <= stops[i + 1][0]) {
      lo = stops[i];
      hi = stops[i + 1];
      break;
    }
  }
  const t = hi[0] === lo[0] ? 0 : (share - lo[0]) / (hi[0] - lo[0]);
  return lo[1].map((c, i) => Math.round(c + (hi[1][i] - c) * t)).join(",");
}

// With a country selected, the other links can stay, fade, or go. Fading keeps
// the shape of the whole network as context; hiding makes one country's
// position unmistakable.
export function linkAlpha(edge) {
  if (state.focus === "all" || !state.selected) return 1;
  const a = state.edges.countries[edge.oi];
  const b = state.edges.countries[edge.di];
  if (a === state.selected || b === state.selected) return 1;
  return state.focus === "only" ? 0 : 0.12;
}

const $ = (id) => document.getElementById(id);
const fmt = new Intl.NumberFormat("en-GB");
const compact = new Intl.NumberFormat("en-GB", {
  notation: "compact",
  maximumFractionDigits: 1,
});

// The active renderer. Every drawing call on this page goes through it, so a
// variant module can replace one visual (say the globe) and leave the rest of
// the page exactly as it is. `installRenderer` merges, it does not swap.
export const R = {};

export function installRenderer(overrides) {
  Object.assign(R, overrides);
}

const state = {
  data: null,
  edges: null,
  world: null,
  year: 2020,
  selected: null,
  layer: "both",
  arcs: "curve",
  links: "width",
  thickness: "normal",
  focus: "all",
  dots: "on",
  basemap: "outline",
  hover: null,
  axisMode: { hist: "loglog", ccdf: "loglog" },
  dash: 0,
  rotation: -10,
  dragging: false,
};

/* ------------------------------------------------------------------ canvas */

// Canvases are sized in CSS and backed at device resolution, so text stays
// crisp without every call site knowing about devicePixelRatio.
function surface(canvas) {
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  const width = canvas.clientWidth || canvas.width;
  const height = Math.round(width * (canvas.height / canvas.width));
  canvas.style.height = `${height}px`;
  canvas.width = Math.round(width * ratio);
  canvas.height = Math.round(height * ratio);
  const ctx = canvas.getContext("2d");
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  ctx.clearRect(0, 0, width, height);
  return { ctx, width, height };
}

function axes(ctx, box, { xTicks, yTicks, xLabel, yLabel }) {
  ctx.strokeStyle = GRID;
  ctx.fillStyle = MUTE;
  ctx.font = "10px -apple-system, system-ui, sans-serif";
  ctx.lineWidth = 1;
  for (const tick of yTicks) {
    const y = Math.round(box.y(tick.value)) + 0.5;
    ctx.beginPath();
    ctx.moveTo(box.left, y);
    ctx.lineTo(box.right, y);
    ctx.stroke();
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    ctx.fillText(tick.label, box.left - 6, y);
  }
  for (const tick of xTicks) {
    const x = Math.round(box.x(tick.value)) + 0.5;
    ctx.beginPath();
    ctx.moveTo(x, box.top);
    ctx.lineTo(x, box.bottom);
    ctx.stroke();
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText(tick.label, x, box.bottom + 6);
  }
  ctx.fillStyle = MUTE;
  ctx.font = "10px -apple-system, system-ui, sans-serif";
  if (xLabel) {
    ctx.textAlign = "center";
    ctx.fillText(xLabel, (box.left + box.right) / 2, box.bottom + 22);
  }
  if (yLabel) {
    ctx.save();
    ctx.translate(12, (box.top + box.bottom) / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText(yLabel, 0, 0);
    ctx.restore();
  }
}

function logTicks(min, max) {
  const out = [];
  for (let e = Math.floor(Math.log10(Math.max(min, 1e-9))); e <= Math.ceil(Math.log10(max)); e += 1) {
    const value = 10 ** e;
    if (value < min * 0.9 || value > max * 1.1) continue;
    out.push({ value, label: e >= 0 && e <= 4 ? fmt.format(value) : `10${sup(e)}` });
  }
  return out.length > 1 ? out : [{ value: min, label: fmt.format(min) }, { value: max, label: fmt.format(max) }];
}

function sup(exponent) {
  const glyphs = { "-": "⁻", 0: "⁰", 1: "¹", 2: "²", 3: "³", 4: "⁴", 5: "⁵", 6: "⁶", 7: "⁷", 8: "⁸", 9: "⁹" };
  return String(exponent)
    .split("")
    .map((c) => glyphs[c] ?? c)
    .join("");
}

function frame(width, height, pad = { l: 46, r: 14, t: 12, b: 34 }) {
  return { left: pad.l, right: width - pad.r, top: pad.t, bottom: height - pad.b };
}

// The two heavy-tail charts can be read on three scales. Log-log is the one
// that makes a power law straight; linear is the one that shows how lopsided
// the distribution really is; log-linear sits between them.
function scaleFor(box, domain, axis, logged) {
  return logged ? logScale(box, domain, axis) : linearScale(box, [0, domain[1]], axis);
}

function axisMode(chart) {
  return state.axisMode[chart] ?? "loglog";
}

function modeFlags(chart) {
  const mode = axisMode(chart);
  return { x: mode === "loglog", y: mode !== "linear" };
}

function ticksFor(domain, logged, count = 5) {
  if (logged) return logTicks(domain[0], domain[1]);
  const out = [];
  for (let i = 0; i <= count; i += 1) {
    const value = (domain[1] / count) * i;
    out.push({ value, label: value >= 1000 ? compact.format(value) : String(Math.round(value * 100) / 100) });
  }
  return out;
}

function logScale(box, domain, axis) {
  const [lo, hi] = domain.map((v) => Math.log10(Math.max(v, 1e-9)));
  const [a, b] = axis === "x" ? [box.left, box.right] : [box.bottom, box.top];
  return (value) => a + ((Math.log10(Math.max(value, 1e-9)) - lo) / (hi - lo || 1)) * (b - a);
}

function linearScale(box, domain, axis) {
  const [lo, hi] = domain;
  const [a, b] = axis === "x" ? [box.left, box.right] : [box.bottom, box.top];
  return (value) => a + ((value - lo) / (hi - lo || 1)) * (b - a);
}

/* -------------------------------------------------------------------- data */

function year() {
  return String(state.year);
}

function metrics(iso3, y = year()) {
  return state.data.nodes[iso3]?.years?.[y] ?? null;
}

function node(iso3) {
  return state.data.nodes[iso3];
}

function withMetrics(y = year()) {
  return state.data.countries
    .map((iso3) => ({ iso3, n: node(iso3), m: metrics(iso3, y) }))
    .filter((row) => row.m);
}

function flag(iso2) {
  if (!iso2 || iso2.length !== 2) return "🌍";
  return String.fromCodePoint(
    ...[...iso2.toUpperCase()].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65),
  );
}

/* --------------------------------------------------------------- inspector */

// What each measure means, in a sentence, on hover. A panel full of numbers
// is only readable if the labels explain themselves.
export const GLOSSARY = {
  "Incoming migrants (stock)":
    "People living here who were born somewhere else, counted as a stock. It is who is here now, not who arrived this year.",
  "Outgoing migrants (stock)":
    "People born here who live somewhere else. The mirror of incoming, counted the same way.",
  "Origins represented":
    "How many different countries send people here, counted as partners rather than people. In-degree. Beware: a country whose statistics office reports a coarse 'other' category will look like it has fewer origins than it really does.",
  "Destinations sent to":
    "How many different countries people from here have moved to. Out-degree.",
  Betweenness:
    "How often this country sits on the shortest path between two others. A heavy corridor counts as a short step, so it measures brokerage in a weighted sense. High betweenness means traffic between other countries passes through here.",
  "Betweenness z-score":
    "How surprising that betweenness is once the country's number of partners is held fixed, measured against 100 degree-preserving shuffles. Zero means 'exactly what its partner count predicts'. Above +2 is a broker the degree sequence cannot explain.",
  "Flight partners":
    "How many countries have at least one direct air route to here. Access, not people.",
  "Flight routes":
    "How many distinct airport-to-airport routes connect here to somewhere abroad. A route existing says nothing about seats or frequency.",
  Typology:
    "Which of five roles this country plays, assigned on ranks rather than raw values so the label means the same thing in any year.",
  "k (in)": "In-degree: the number of countries that send people here.",
  Rank: "Position among all countries on this measure, 1 being the highest.",
  "z-score":
    "Distance from the degree-preserving null, in standard deviations. Above +2 is more of a bridge than its partner count explains.",
  "Migration links": "Country pairs with at least one person on them, in this year.",
  "People counted": "Everyone on every link, added up. People with two migrations appear once, at their current residence.",
  "Flight links": "Country pairs with at least one direct air route.",
  "Countries with flights": "How many countries appear anywhere in the route data.",
  "People on this link (stock)": "People born in the origin who live in the destination.",
  "Share of the origin's emigrants": "What fraction of everyone who left the origin is on this one link.",
  "Share of the destination's immigrants": "What fraction of everyone who arrived in the destination came along this link.",
  "Rank among all links": "Where this corridor sits among every corridor in the world, by size.",
  "Flight routes ": "Direct airport-to-airport routes between these two countries.",
};

function row(term, value) {
  const note = GLOSSARY[term];
  const attr = note ? ` class="explains" data-explain="${note.replace(/"/g, "&quot;")}"` : "";
  return `<div><dt${attr}>${term}</dt><dd>${value}</dd></div>`;
}

let glossaryWired = false;
function wireGlossary() {
  if (glossaryWired) return;
  glossaryWired = true;
  document.addEventListener("pointermove", (event) => {
    const target = event.target.closest?.("[data-explain]");
    if (target) showTip(event, `<b>${target.textContent.trim()}</b><span>${target.dataset.explain}</span>`);
    else if (!event.target.closest?.("canvas")) hideTip();
  });
}

function renderInspector() {
  const iso3 = state.selected;
  if (!iso3) return;
  const n = node(iso3);
  const m = metrics(iso3);
  $("sel-flag").textContent = flag(n.iso2);
  $("sel-name").textContent = n.name;
  $("sel-codes").textContent = `${iso3} · ${state.year}`;

  const z = m?.z;
  $("sel-stats").innerHTML = m
    ? [
        row("Incoming migrants (stock)", fmt.format(m.in_strength)),
        row("Outgoing migrants (stock)", fmt.format(m.out_strength)),
        row("Origins represented", `${m.in_degree} <span style="color:#7a8fac">(#${m.in_degree_rank})</span>`),
        row("Destinations sent to", `${m.out_degree} <span style="color:#7a8fac">(#${m.out_degree_rank})</span>`),
        row("Betweenness", `${m.betweenness.toFixed(5)} <span style="color:#7a8fac">(#${m.betweenness_rank})</span>`),
        row("Betweenness z-score", z === undefined ? "— (2020 only)" : z.toFixed(2)),
        row("Flight partners", fmt.format(n.flight_degree)),
        row("Flight routes", fmt.format(n.flight_strength)),
        row("Typology", `<span class="chip">${label(m.typology)}</span>`),
      ].join("")
    : `<div><dt>No migration data for ${state.year}</dt><dd>—</dd></div>`;

  const list = (items, dir) =>
    items.length
      ? items
          .map(
            (c, i) =>
              `<li><span>${i + 1}. ${dir === "in" ? `${node(c.other)?.name ?? c.other} → ${n.name}` : `${n.name} → ${node(c.other)?.name ?? c.other}`}</span><b>${compact.format(c.weight)}</b></li>`,
          )
          .join("")
      : "<li><span>None recorded</span><b>—</b></li>";
  $("sel-in").innerHTML = list(n.top_in ?? [], "in");
  $("sel-out").innerHTML = list(n.top_out ?? [], "out");

  // Section 4's small panel tracks the same selection.
  $("sc-flag").textContent = flag(n.iso2);
  $("sc-name").textContent = n.name;
  $("sc-codes").textContent = `${iso3} · ${state.data.null_year}`;
  const nm = metrics(iso3, String(state.data.null_year));
  $("sc-stats").innerHTML = nm
    ? [
        row("k (in)", nm.in_degree),
        row("Betweenness", nm.betweenness.toFixed(5)),
        row("Rank", `#${nm.betweenness_rank}`),
        row("z-score", nm.z === undefined ? "—" : nm.z.toFixed(2)),
      ].join("")
    : "";
  // Every chart carries a marker for the selected country, so all of them
  // redraw together and the selection reads the same everywhere on the page.
  R.hist();
  R.ccdf();
  R.scatters();
  renderDenmarkPanels();
  R.denmark();
}

function select(iso3) {
  if (!iso3 || !node(iso3)) return;
  state.selected = iso3;
  renderInspector();
  R.globe();
  R.map();
}

/* ------------------------------------------------------------- picking

   Every chart records the country behind each mark it draws, in CSS pixels
   relative to its own canvas. One shared handler then turns a click anywhere
   on any chart into a selection, and the whole page follows. Selecting never
   scrolls: the reader stays where they were looking. */

const pickable = new Map();

// Every chart carries the same tooltip: what the mark is and what it is worth
// on that chart's own axes.
let tipEl = null;
function tip() {
  if (!tipEl) {
    tipEl = document.createElement("div");
    tipEl.className = "chart-tip";
    tipEl.hidden = true;
    document.body.appendChild(tipEl);
  }
  return tipEl;
}

function showTip(event, html) {
  const el = tip();
  el.innerHTML = html;
  el.hidden = false;
  const pad = 14;
  const width = el.offsetWidth;
  const left = Math.min(event.clientX + pad, window.innerWidth - width - 8);
  const top = Math.max(event.clientY - el.offsetHeight - pad, 8);
  el.style.left = `${left}px`;
  el.style.top = `${top}px`;
}

function hideTip() {
  if (tipEl) tipEl.hidden = true;
}

function collect(id) {
  const marks = [];
  pickable.set(id, marks);
  return marks;
}

function nearestMark(canvas, event, radius = 16) {
  const marks = pickable.get(canvas.id) ?? [];
  const rect = canvas.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  let best = null;
  for (const mark of marks) {
    const d = Math.hypot(mark.x - x, mark.y - y);
    if (d <= radius && (!best || d < best.d)) best = { mark, d };
  }
  return best?.mark ?? null;
}

function enablePicking(id) {
  const canvas = $(id);
  if (!canvas || canvas.dataset.picking) return;
  canvas.dataset.picking = "on";
  canvas.title = "Click a point to select that country";
  canvas.addEventListener("pointermove", (event) => {
    const mark = nearestMark(canvas, event);
    canvas.style.cursor = mark ? "pointer" : "default";
    if (mark?.label) showTip(event, mark.label);
    else hideTip();
    // The mark under the cursor grows, which makes a 2px dot a real target.
    const iso3 = mark?.iso3 ?? null;
    if (state.hover !== iso3) {
      state.hover = iso3;
      R.scatters();
      R.denmark();
      R.hist();
      R.ccdf();
    }
  });
  canvas.addEventListener("pointerleave", () => {
    hideTip();
    if (state.hover) {
      state.hover = null;
      R.scatters();
      R.denmark();
      R.hist();
      R.ccdf();
    }
  });
  canvas.addEventListener("click", (event) => {
    const mark = nearestMark(canvas, event);
    if (mark?.iso3) select(mark.iso3);
  });
}

const TYPES = {
  "destination-hub": {
    title: "Destination hub",
    icon: "✦",
    tint: "#fde8cf",
    fg: "#9a5205",
    what: "Many incoming migrants, from many origins. A place people arrive.",
  },
  "human-bridge": {
    title: "Human bridge",
    icon: "⇄",
    tint: "#e7dcfb",
    fg: "#5b3a9e",
    what: "Sits on many shortest paths, more than its partner count explains. A broker.",
  },
  "system-airport": {
    title: "System airport",
    icon: "✈",
    tint: "#d9ecf9",
    fg: "#14618f",
    what: "Many flight partners, few incoming migrants. A travel hub, a weak human link.",
  },
  both: {
    title: "Both",
    icon: "◎",
    tint: "#e7f6ee",
    fg: "#0d6b3a",
    what: "Many incoming migrants and many flight partners at once. People and access.",
  },
  leaf: {
    title: "Leaf",
    icon: "❦",
    tint: "#eef3f9",
    fg: "#46618a",
    what: "Few partners, few people, rarely on a path. The edge of both networks.",
  },
  mixed: {
    title: "Mixed",
    icon: "◌",
    tint: "#eef3f9",
    fg: "#46618a",
    what: "No role dominates.",
  },
};

function label(key) {
  return TYPES[key]?.title ?? key ?? "—";
}

/* ------------------------------------------------------------------- globe */

function project(lat, lon, radius, cx, cy, rotation) {
  const phi = (lat * Math.PI) / 180;
  const lambda = ((lon + rotation) * Math.PI) / 180;
  const cosPhi = Math.cos(phi);
  const x = cosPhi * Math.sin(lambda);
  const y = Math.sin(phi);
  const z = cosPhi * Math.cos(lambda);
  return { x: cx + x * radius, y: cy - y * radius, visible: z > 0, z };
}

// Country outlines, so a corridor lands somewhere recognisable instead of on a
// blank sphere. `project` returns visibility, so the globe hides the far side
// by breaking each ring into runs of visible points.
// Clicking a country means clicking its territory, not the dot at its
// centroid. Both maps turn a click into a longitude and latitude and then ask
// which polygon contains it, so Russia is as easy to hit as Luxembourg.
function pointInRing(lon, lat, ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i, i += 1) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if (yi > lat !== yj > lat && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

function countryAt(lon, lat) {
  if (!state.world) return null;
  for (const feature of state.world.features) {
    const iso3 = feature.properties.iso3;
    if (!iso3 || !metrics(iso3)) continue;
    const geometry = feature.geometry;
    const polygons =
      geometry.type === "Polygon" ? [geometry.coordinates] : geometry.coordinates;
    for (const polygon of polygons) {
      // First ring is the outline, the rest are holes.
      if (!pointInRing(lon, lat, polygon[0])) continue;
      const inHole = polygon.slice(1).some((ring) => pointInRing(lon, lat, ring));
      if (!inHole) return iso3;
    }
  }
  return null;
}

// Screen point back to a longitude and latitude, one per projection.
function unprojectMap(x, y, width, height) {
  return [(x / width) * 360 - 180, 90 - (y / height) * 180];
}

function unprojectGlobe(x, y, radius, cx, cy, rotation) {
  const dx = (x - cx) / radius;
  const dy = (cy - y) / radius;
  const rho = Math.hypot(dx, dy);
  if (rho > 1) return null;
  const c = Math.asin(rho);
  const lat = rho === 0 ? 0 : Math.asin((dy * Math.sin(c)) / rho);
  const lon = Math.atan2(dx * Math.sin(c), rho * Math.cos(c));
  return [((lon * 180) / Math.PI) - rotation, (lat * 180) / Math.PI];
}

function eachRing(feature, visit) {
  const geometry = feature.geometry;
  const polygons =
    geometry.type === "Polygon" ? [geometry.coordinates] : geometry.coordinates;
  for (const polygon of polygons) for (const ring of polygon) visit(ring);
}

// The selected country is filled in the migration colour and outlined in
// white; whatever the cursor is over gets a lighter fill.
/* ------------------------------------------------------------- the basemap

   How the world itself is drawn, independently of which library draws the
   corridors. Outlines are the default because a boundary is what makes a
   corridor placeable; the photograph is what the planet actually looks like.
   Any canvas renderer calls these, and the WebGL ones map the same choice onto
   their own texture settings. */

const TEXTURE_URL = new URL("../textures/earth-day-2048.jpg", import.meta.url).href;
let texture = null;
let texturePending = false;

export function earthTexture(onReady) {
  if (texture || texturePending) return texture;
  texturePending = true;
  const image = new Image();
  image.onload = () => {
    texture = image;
    texturePending = false;
    onReady?.();
  };
  image.onerror = () => {
    texturePending = false;
  };
  image.src = TEXTURE_URL;
  return null;
}

export function textureURL() {
  return TEXTURE_URL;
}

// An equirectangular photograph sampled through the orthographic projection.
// Done at half resolution into an offscreen canvas and scaled up, because the
// globe redraws on every drag frame and nobody can see the difference.
const sphereCache = { key: "", canvas: null };

// The texture is decoded once. Re-reading a 2048x1024 image on every rotation
// cost 74ms a frame, which is thirteen frames a second while dragging.
const decoded = { image: null, pixels: null, width: 0, height: 0 };

function texturePixels(image) {
  if (decoded.image === image) return decoded;
  const source = document.createElement("canvas");
  source.width = image.width;
  source.height = image.height;
  const sctx = source.getContext("2d", { willReadFrequently: true });
  sctx.drawImage(image, 0, 0);
  decoded.image = image;
  decoded.pixels = sctx.getImageData(0, 0, image.width, image.height).data;
  decoded.width = image.width;
  decoded.height = image.height;
  return decoded;
}

export function paintPhotoGlobe(ctx, radius, cx, cy) {
  const image = earthTexture(() => {
    R.globe();
  });
  if (!image) return false;

  // Sampled at roughly two thirds of the drawn size and scaled up. The globe
  // is a few hundred pixels across and the softening is invisible next to the
  // frame rate it buys.
  const size = Math.max(48, Math.round(radius * 0.62));
  // Two degrees of rotation is under a pixel of movement at this size, so the
  // key is snapped: a drag reuses one sphere for several frames.
  const key = `${size}:${Math.round(state.rotation / 2)}`;
  if (sphereCache.key !== key) {
    const off = document.createElement("canvas");
    off.width = size * 2;
    off.height = size * 2;
    off.getContext("2d").imageSmoothingQuality = "high";
    const octx = off.getContext("2d");

    const { pixels, width: tw, height: th } = texturePixels(image);
    const out = octx.createImageData(off.width, off.height);
    for (let y = 0; y < off.height; y += 1) {
      for (let x = 0; x < off.width; x += 1) {
        const dx = (x - size) / size;
        const dy = (size - y) / size;
        const rho = Math.hypot(dx, dy);
        const target = (y * off.width + x) * 4;
        if (rho > 1) continue;
        const c = Math.asin(rho);
        const lat = rho === 0 ? 0 : Math.asin((dy * Math.sin(c)) / rho);
        const lon = Math.atan2(dx * Math.sin(c), rho * Math.cos(c));
        const lonDeg = ((lon * 180) / Math.PI) - state.rotation;
        const sx = Math.floor((((lonDeg + 180) % 360 + 360) % 360) / 360 * tw);
        const sy = Math.floor(((90 - (lat * 180) / Math.PI) / 180) * th);
        const from = (sy * tw + sx) * 4;
        out.data[target] = pixels[from];
        out.data[target + 1] = pixels[from + 1];
        out.data[target + 2] = pixels[from + 2];
        out.data[target + 3] = 255;
      }
    }
    octx.putImageData(out, 0, 0);
    sphereCache.key = key;
    sphereCache.canvas = off;
  }
  ctx.drawImage(sphereCache.canvas, cx - radius, cy - radius, radius * 2, radius * 2);
  return true;
}

function landFill(iso3, base) {
  if (iso3 && iso3 === state.selected) return PEOPLE;
  if (iso3 && iso3 === state.hover) return "#3f86c4";
  return base;
}

function drawLandGlobe(ctx, radius, cx, cy) {
  if (!state.world) return;
  ctx.lineWidth = 0.6;
  for (const feature of state.world.features) {
    const iso3 = feature.properties.iso3;
    ctx.fillStyle = landFill(iso3, "#245f92");
    ctx.strokeStyle =
      iso3 === state.selected ? "#ffffff" : "rgba(178,215,248,0.55)";
    eachRing(feature, (ring) => {
      let open = false;
      ctx.beginPath();
      for (const [lon, lat] of ring) {
        const p = project(lat, lon, radius, cx, cy, state.rotation);
        if (!p.visible) {
          open = false;
          continue;
        }
        if (open) ctx.lineTo(p.x, p.y);
        else {
          ctx.moveTo(p.x, p.y);
          open = true;
        }
      }
      ctx.fill();
      ctx.stroke();
    });
  }
}

function drawLandMap(ctx, width, height) {
  if (!state.world) return;
  ctx.lineWidth = 0.6;
  for (const feature of state.world.features) {
    const iso3 = feature.properties.iso3;
    ctx.fillStyle = landFill(iso3, "#16416c");
    ctx.strokeStyle =
      iso3 === state.selected ? "#ffffff" : "rgba(150,196,240,0.45)";
    eachRing(feature, (ring) => {
      ctx.beginPath();
      ring.forEach(([lon, lat], i) => {
        const p = mapPoint([lat, lon], width, height);
        if (i) ctx.lineTo(p.x, p.y);
        else ctx.moveTo(p.x, p.y);
      });
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    });
  }
}

function controlPoint(a, b, lift) {
  const mx = (a.x + b.x) / 2;
  const my = (a.y + b.y) / 2;
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  return { x: mx - (dy / len) * len * lift, y: my + (dx / len) * len * lift };
}

function bezier(a, c, b, t) {
  const u = 1 - t;
  return {
    x: u * u * a.x + 2 * u * t * c.x + t * t * b.x,
    y: u * u * a.y + 2 * u * t * c.y + t * t * b.y,
  };
}

// The photograph has no borders, so the selection still needs an outline.
function outlineSelected(ctx, radius, cx, cy) {
  const feature = state.world?.features.find(
    (f) => f.properties.iso3 === state.selected,
  );
  if (!feature) return;
  ctx.strokeStyle = "#ffffff";
  ctx.fillStyle = `${PEOPLE}66`;
  ctx.lineWidth = 1.4;
  eachRing(feature, (ring) => {
    let open = false;
    ctx.beginPath();
    for (const [lon, lat] of ring) {
      const p = project(lat, lon, radius, cx, cy, state.rotation);
      if (!p.visible) {
        open = false;
        continue;
      }
      if (open) ctx.lineTo(p.x, p.y);
      else {
        ctx.moveTo(p.x, p.y);
        open = true;
      }
    }
    ctx.fill();
    ctx.stroke();
  });
}

function outlineSelectedMap(ctx, width, height) {
  const feature = state.world?.features.find(
    (f) => f.properties.iso3 === state.selected,
  );
  if (!feature) return;
  ctx.strokeStyle = "#ffffff";
  ctx.fillStyle = `${PEOPLE}66`;
  ctx.lineWidth = 1.4;
  eachRing(feature, (ring) => {
    ctx.beginPath();
    ring.forEach(([lon, lat], i) => {
      const p = mapPoint([lat, lon], width, height);
      if (i) ctx.lineTo(p.x, p.y);
      else ctx.moveTo(p.x, p.y);
    });
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  });
}

function arc(ctx, a, b, lift) {
  const spec = arcSpec();
  const bend = spec.curvature === 0 ? 0 : lift;
  const c = controlPoint(a, b, bend);

  if (spec.taper) {
    // Width carries direction: heavy where people leave, thin where they land.
    const width = ctx.lineWidth;
    const steps = 14;
    let previous = a;
    for (let i = 1; i <= steps; i += 1) {
      const point = bezier(a, c, b, i / steps);
      ctx.lineWidth = width * (1.25 - (i / steps) * 1.05);
      ctx.beginPath();
      ctx.moveTo(previous.x, previous.y);
      ctx.lineTo(point.x, point.y);
      ctx.stroke();
      previous = point;
    }
    ctx.lineWidth = width;
    return;
  }

  if (spec.dashed) {
    ctx.save();
    ctx.setLineDash([6, 7]);
    ctx.lineDashOffset = -state.dash;
  }
  ctx.beginPath();
  ctx.moveTo(a.x, a.y);
  if (bend === 0) ctx.lineTo(b.x, b.y);
  else ctx.quadraticCurveTo(c.x, c.y, b.x, b.y);
  ctx.stroke();
  if (spec.dashed) ctx.restore();
}

// Only the flowing style animates, and only when the reader has not asked for
// less motion. Twenty frames a second is plenty for a dash offset.
let flowTimer = null;
function syncFlow() {
  const wants =
    arcSpec().dashed &&
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (wants && !flowTimer) {
    flowTimer = setInterval(() => {
      state.dash = (state.dash + 1.6) % 13;
      R.globe();
      R.map();
    }, 50);
  } else if (!wants && flowTimer) {
    clearInterval(flowTimer);
    flowTimer = null;
    state.dash = 0;
  }
}

// The globe and the flat map share one edge budget: the heaviest corridors
// only. Drawing all 9,095 would be a solid orange disc.
function topEdges(limit) {
  const y = state.data.years.indexOf(state.year);
  const list = [];
  for (const [oi, di, series, routes] of state.edges.edges) {
    const weight = series[y] ?? 0;
    if (weight > 0) list.push({ oi, di, weight, routes });
  }
  list.sort((a, b) => b.weight - a.weight);
  return list.slice(0, limit);
}

function flightEdges(limit) {
  const list = state.edges.edges
    .filter((e) => e[3] > 0)
    .map(([oi, di, , routes]) => ({ oi, di, routes }));
  list.sort((a, b) => b.routes - a.routes);
  return list.slice(0, limit);
}

function drawGlobe() {
  refreshPalette();
  const canvas = $("globe-canvas");
  if (!canvas || !state.data) return;
  const { ctx, width, height } = surface(canvas);
  const radius = Math.min(width, height) * 0.42;
  const cx = width / 2;
  const cy = height / 2;

  const sphere = ctx.createRadialGradient(
    cx - radius * 0.3,
    cy - radius * 0.35,
    radius * 0.1,
    cx,
    cy,
    radius,
  );
  sphere.addColorStop(0, "#14406e");
  sphere.addColorStop(0.7, "#0d2b4c");
  sphere.addColorStop(1, "#071d36");
  ctx.fillStyle = sphere;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fill();
  if (state.basemap === "photo") {
    if (!paintPhotoGlobe(ctx, radius, cx, cy)) drawLandGlobe(ctx, radius, cx, cy);
    if (state.selected) outlineSelected(ctx, radius, cx, cy);
  } else if (state.basemap !== "none") {
    drawLandGlobe(ctx, radius, cx, cy);
  }

  ctx.strokeStyle = "rgba(160,200,240,0.18)";
  ctx.lineWidth = 1;
  for (let lat = -60; lat <= 60; lat += 30) {
    ctx.beginPath();
    for (let lon = -180; lon <= 180; lon += 3) {
      const p = project(lat, lon, radius, cx, cy, state.rotation);
      if (!p.visible) continue;
      ctx.lineTo(p.x, p.y);
    }
    ctx.stroke();
  }
  for (let lon = -180; lon < 180; lon += 30) {
    ctx.beginPath();
    for (let lat = -90; lat <= 90; lat += 3) {
      const p = project(lat, lon, radius, cx, cy, state.rotation);
      if (!p.visible) continue;
      ctx.lineTo(p.x, p.y);
    }
    ctx.stroke();
  }

  const points = new Map();
  state.edges.countries.forEach((iso3, i) => {
    const coord = node(iso3)?.coord;
    if (coord) points.set(i, project(coord[0], coord[1], radius, cx, cy, state.rotation));
  });

  const edges = topEdges(500);
  const heaviest = edges[0]?.weight ?? 1;
  const link = linkSpec();
  const scale = THICKNESS[state.thickness] ?? 1;
  const base = rgb(PEOPLE);
  ctx.lineCap = "round";
  for (const edge of edges) {
    const a = points.get(edge.oi);
    const b = points.get(edge.di);
    if (!a || !b || !a.visible || !b.visible) continue;
    const alpha = linkAlpha(edge);
    if (alpha === 0) continue;
    const share = Math.sqrt(edge.weight / heaviest);
    const tint = link.ramp ? rampColour(share) : base;
    ctx.strokeStyle = `rgba(${tint},${(0.24 + share * 0.66) * alpha})`;
    ctx.lineWidth = (link.width ? 0.6 + share * 3.4 : 1.5) * scale;
    arc(ctx, a, b, 0.16);
  }

  // With the territories filled and highlighted, the dots are often redundant,
  // so they can be turned off entirely.
  ctx.fillStyle = "rgba(196,222,248,0.62)";
  for (const [i, p] of state.dots === "off" ? [] : points) {
    if (!p.visible) continue;
    const iso3 = state.edges.countries[i];
    const m = metrics(iso3);
    if (!m) continue;
    const size = 0.6 + Math.sqrt(m.in_degree) * 0.14;
    ctx.beginPath();
    ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
    ctx.fill();
  }

  if (state.selected) {
    const i = state.edges.countries.indexOf(state.selected);
    const p = points.get(i);
    if (p && p.visible) {
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 6, 0, Math.PI * 2);
      ctx.stroke();
      const name = node(state.selected).name;
      ctx.font = "600 12px -apple-system, system-ui, sans-serif";
      const w = ctx.measureText(name).width;
      ctx.fillStyle = "rgba(255,255,255,0.94)";
      ctx.fillRect(p.x - w / 2 - 8, p.y - 30, w + 16, 20);
      ctx.fillStyle = INK;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(name, p.x, p.y - 20);
    }
  }
}

function globeHit(event) {
  const canvas = $("globe-canvas");
  const rect = canvas.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  const radius = Math.min(rect.width, rect.height) * 0.42;
  const cx = rect.width / 2;
  const cy = rect.height / 2;
  const geo = unprojectGlobe(x, y, radius, cx, cy, state.rotation);
  if (geo) {
    const territory = countryAt(geo[0], geo[1]);
    if (territory) return territory;
  }
  let best = null;
  for (const iso3 of state.data.countries) {
    const coord = node(iso3)?.coord;
    if (!coord || !metrics(iso3)) continue;
    const p = project(coord[0], coord[1], radius, cx, cy, state.rotation);
    if (!p.visible) continue;
    const d = Math.hypot(p.x - x, p.y - y);
    if (d < 12 && (!best || d < best.d)) best = { iso3, d };
  }
  return best?.iso3 ?? null;
}

/* --------------------------------------------------------------- flat map */

function mapPoint(coord, width, height) {
  return {
    x: ((coord[1] + 180) / 360) * width,
    y: ((90 - coord[0]) / 180) * height,
  };
}

function drawMap() {
  refreshPalette();
  const canvas = $("map-canvas");
  if (!canvas || !state.data) return;
  const { ctx, width, height } = surface(canvas);
  ctx.fillStyle = "#081a31";
  ctx.fillRect(0, 0, width, height);
  if (state.basemap === "photo") {
    const image = earthTexture(() => R.map());
    if (image) {
      ctx.globalAlpha = 0.88;
      ctx.drawImage(image, 0, 0, width, height);
      ctx.globalAlpha = 1;
      ctx.fillStyle = "rgba(6,20,38,0.4)";
      ctx.fillRect(0, 0, width, height);
      if (state.selected) outlineSelectedMap(ctx, width, height);
    } else {
      drawLandMap(ctx, width, height);
    }
  } else if (state.basemap !== "none") {
    drawLandMap(ctx, width, height);
  }
  ctx.strokeStyle = "rgba(160,200,240,0.09)";
  for (let lon = -180; lon <= 180; lon += 30) {
    const x = ((lon + 180) / 360) * width;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  for (let lat = -60; lat <= 60; lat += 30) {
    const y = ((90 - lat) / 180) * height;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  const points = new Map();
  state.edges.countries.forEach((iso3, i) => {
    const coord = node(iso3)?.coord;
    if (coord) points.set(i, mapPoint(coord, width, height));
  });

  ctx.lineCap = "round";
  const link = linkSpec();
  const scale = THICKNESS[state.thickness] ?? 1;
  if (state.layer !== "flights") {
    const edges = topEdges(420);
    const heaviest = edges[0]?.weight ?? 1;
    const base = rgb(PEOPLE);
    for (const edge of edges) {
      const a = points.get(edge.oi);
      const b = points.get(edge.di);
      if (!a || !b || Math.abs(a.x - b.x) > width * 0.6) continue;
      const alpha = linkAlpha(edge);
      if (alpha === 0) continue;
      const share = Math.sqrt(edge.weight / heaviest);
      const tint = link.ramp ? rampColour(share) : base;
      ctx.strokeStyle = `rgba(${tint},${(0.1 + share * 0.5) * alpha})`;
      ctx.lineWidth = (link.width ? 0.3 + share * 2.4 : 1.2) * scale;
      arc(ctx, a, b, 0.13);
    }
  }
  if (state.layer !== "migration") {
    const edges = flightEdges(420);
    const heaviest = edges[0]?.routes ?? 1;
    const base = rgb(ACCESS);
    for (const edge of edges) {
      const a = points.get(edge.oi);
      const b = points.get(edge.di);
      if (!a || !b || Math.abs(a.x - b.x) > width * 0.6) continue;
      const alpha = linkAlpha(edge);
      if (alpha === 0) continue;
      const share = Math.sqrt(edge.routes / heaviest);
      const tint = link.ramp ? rampColour(share) : base;
      ctx.strokeStyle = `rgba(${tint},${(0.08 + share * 0.45) * alpha})`;
      ctx.lineWidth = (link.width ? 0.3 + share * 2 : 1) * scale;
      arc(ctx, a, b, -0.13);
    }
  }

  ctx.fillStyle = "rgba(214,234,252,0.8)";
  for (const [i, p] of state.dots === "off" ? [] : points) {
    const iso3 = state.edges.countries[i];
    if (!metrics(iso3)) continue;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 1.5, 0, Math.PI * 2);
    ctx.fill();
  }
  if (state.selected) {
    const coord = node(state.selected)?.coord;
    if (coord) {
      const p = mapPoint(coord, width, height);
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 6, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
}

/* ---------------------------------------------------------------- section 3 */

// Each bucket carries the countries in it, so a click on a bar can land on a
// real country rather than on an anonymous count. The representative is the
// largest by in-strength, which is the one a reader is most likely to mean.
function degreeCounts(pick) {
  const buckets = new Map();
  for (const row of withMetrics()) {
    const value = pick(row.n, row.m);
    if (value > 0) {
      if (!buckets.has(value)) buckets.set(value, []);
      buckets.get(value).push(row);
    }
  }
  return [...buckets.entries()]
    .map(([k, rows]) => ({
      k,
      c: rows.length,
      iso3: rows.slice().sort((a, b) => b.m.in_strength - a.m.in_strength)[0].iso3,
    }))
    .sort((a, b) => a.k - b.k);
}

function ccdf(entries) {
  const sorted = entries.filter((e) => e.k > 0).sort((a, b) => a.k - b.k);
  const n = sorted.length;
  const out = [];
  for (let i = 0; i < n; i += 1) {
    if (i && sorted[i].k === sorted[i - 1].k) continue;
    out.push({ k: sorted[i].k, p: (n - i) / n, iso3: sorted[i].iso3 });
  }
  return out;
}

const SERIES = [
  { key: "in", colour: PEOPLE, pick: (n, m) => m.in_degree },
  { key: "out", colour: INK, pick: (n, m) => m.out_degree },
  { key: "flight", colour: ACCESS, pick: (n) => n.flight_degree },
];

function drawHistogram() {
  refreshPalette();
  const canvas = $("hist");
  if (!canvas) return;
  const { ctx, width, height } = surface(canvas);
  const box = frame(width, height);
  const all = SERIES.map((s) => degreeCounts(s.pick));
  const maxK = Math.max(...all.flat().map((d) => d.k), 10);
  const maxC = Math.max(...all.flat().map((d) => d.c), 10);
  const mode = modeFlags("hist");
  box.x = scaleFor(box, [1, maxK], "x", mode.x);
  box.y = scaleFor(box, [1, maxC], "y", mode.y);
  axes(ctx, box, {
    xTicks: ticksFor([1, maxK], mode.x),
    yTicks: ticksFor([1, maxC], mode.y),
    xLabel: "Partners",
    yLabel: "Count of countries",
  });
  const marks = collect("hist");
  all.forEach((points, i) => {
    ctx.fillStyle = SERIES[i].colour + "cc";
    for (const d of points) {
      const x = box.x(d.k);
      const y = box.y(d.c);
      ctx.fillRect(x - 1.5 + i * 1.6, y, 2, box.bottom - y);
      marks.push({
        x, y, iso3: d.iso3,
        label: `<b>${d.k} ${SERIES[i].key === "flight" ? "flight partners" : "partners"}</b>` +
          `<span>${d.c} ${d.c === 1 ? "country" : "countries"}</span>` +
          `<span>largest: ${node(d.iso3).name}</span>`,
      });
    }
  });
  markSelected(ctx, box, (n, m) => [m.in_degree, degreeCounts(SERIES[0].pick).find((d) => d.k === m.in_degree)?.c ?? 1]);
}

function drawCcdf() {
  refreshPalette();
  const canvas = $("ccdf");
  if (!canvas) return;
  const { ctx, width, height } = surface(canvas);
  const box = frame(width, height);
  const rows = withMetrics();
  const series = SERIES.map((s) =>
    ccdf(rows.map(({ iso3, n, m }) => ({ k: s.pick(n, m), iso3 }))),
  );
  const maxK = Math.max(...series.flat().map((d) => d.k), 10);
  const minP = Math.min(...series.flat().map((d) => d.p), 0.001);
  const mode = modeFlags("ccdf");
  box.x = scaleFor(box, [1, maxK], "x", mode.x);
  box.y = mode.y ? logScale(box, [minP, 1], "y") : linearScale(box, [0, 1], "y");
  axes(ctx, box, {
    xTicks: ticksFor([1, maxK], mode.x),
    yTicks: mode.y
      ? [1, 0.1, 0.01, 0.001]
          .filter((v) => v >= minP * 0.9)
          .map((v) => ({ value: v, label: `10${sup(Math.log10(v))}` }))
      : [0, 0.25, 0.5, 0.75, 1].map((v) => ({ value: v, label: `${v * 100}%` })),
    xLabel: "Partners",
    yLabel: "P(K ≥ k)",
  });
  const marks = collect("ccdf");
  series.forEach((points, i) => {
    ctx.fillStyle = SERIES[i].colour;
    for (const d of points) {
      const x = box.x(d.k);
      const y = box.y(d.p);
      ctx.beginPath();
      ctx.arc(x, y, 2, 0, Math.PI * 2);
      ctx.fill();
      marks.push({
        x, y, iso3: d.iso3,
        label: `<b>at least ${d.k} partners</b>` +
          `<span>${(d.p * 100).toFixed(1)}% of countries</span>` +
          `<span>e.g. ${node(d.iso3).name}</span>`,
      });
    }
  });
  markSelected(ctx, box, (n, m) => {
    const point = series[0].find((d) => d.k === m.in_degree);
    return [m.in_degree, point?.p ?? 1];
  });
}

function markSelected(ctx, box, pick) {
  if (!state.selected) return;
  const n = node(state.selected);
  const m = metrics(state.selected);
  if (!m) return;
  const [vx, vy] = pick(n, m);
  const x = box.x(vx);
  const y = box.y(vy);
  ctx.strokeStyle = INK;
  ctx.setLineDash([3, 3]);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x, box.top);
  ctx.lineTo(x, box.bottom);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = INK;
  ctx.font = "600 10px -apple-system, system-ui, sans-serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "bottom";
  ctx.fillText(`${n.name} (k: ${m.in_degree})`, Math.min(x + 5, box.right - 90), Math.max(y - 5, box.top + 12));
}

/* ---------------------------------------------------------- sections 4 & 5 */

function drawScatters() {
  R.scatterBetween();
  R.scatterZ();
}

function drawBetweenness() {
  refreshPalette();
  const canvas = $("scatter-between");
  if (!canvas) return;
  const { ctx, width, height } = surface(canvas);
  const box = frame(width, height, { l: 56, r: 16, t: 14, b: 38 });
  const y = String(state.data.null_year);
  const rows = withMetrics(y).filter((r) => r.m.in_degree > 0 && r.m.betweenness > 0);
  // Both series carry the same two quantities, computed the same way on their
  // own network: in-degree, and betweenness with distance = 1 / weight.
  const flights = state.data.countries
    .map((iso3) => ({ iso3, n: node(iso3) }))
    .filter((r) => r.n.flight_in_degree > 0 && r.n.flight_betweenness > 0);
  const maxK = Math.max(
    ...rows.map((r) => r.m.in_degree),
    ...flights.map((r) => r.n.flight_in_degree),
  );
  const minB = Math.min(
    ...rows.map((r) => r.m.betweenness),
    ...flights.map((r) => r.n.flight_betweenness),
  );
  const maxB = Math.max(
    ...rows.map((r) => r.m.betweenness),
    ...flights.map((r) => r.n.flight_betweenness),
  );
  box.x = logScale(box, [1, maxK], "x");
  box.y = logScale(box, [minB, maxB], "y");
  axes(ctx, box, {
    xTicks: logTicks(1, maxK),
    yTicks: logTicks(minB, maxB),
    xLabel: "Origins (in-degree)",
    yLabel: "Betweenness",
  });
  const marks = collect("scatter-between");
  plotDots(ctx, marks, flights.map((r) => ({
    x: box.x(r.n.flight_in_degree),
    y: box.y(r.n.flight_betweenness),
    iso3: r.iso3,
    label: `<b>${r.n.name}</b><span>Flight network</span>` +
      `<span>${r.n.flight_in_degree} flight partners</span>` +
      `<span>betweenness ${r.n.flight_betweenness.toExponential(2)} · #${r.n.flight_betweenness_rank}</span>`,
  })), ACCESS + "88", 2);
  plotDots(ctx, marks, rows.map((r) => ({
    x: box.x(r.m.in_degree), y: box.y(r.m.betweenness), iso3: r.iso3,
    label: `<b>${r.n.name}</b><span>Migration network</span>` +
      `<span>${r.m.in_degree} origins · #${r.m.in_degree_rank}</span>` +
      `<span>betweenness ${r.m.betweenness.toExponential(2)} · #${r.m.betweenness_rank}</span>` +
      (r.m.z === undefined ? "" : `<span>z = ${r.m.z.toFixed(2)} against the null</span>`),
  })), PEOPLE + "cc", 2.4);
  // Label only the brokers a reader should look up, and only where the label
  // will not sit on top of one already placed.
  const notable = rows
    .filter((r) => (r.m.z ?? 0) >= 2 && r.m.in_degree >= 10)
    .sort((a, b) => (b.m.z ?? 0) - (a.m.z ?? 0))
    .slice(0, 6);
  ctx.font = "600 10px -apple-system, system-ui, sans-serif";
  ctx.fillStyle = INK;
  ctx.textAlign = "left";
  const placed = [];
  for (const r of notable) {
    // The selected country gets its own marker label; two would collide.
    if (r.iso3 === state.selected) continue;
    const x = Math.min(box.x(r.m.in_degree) + 6, box.right - 120);
    const py = box.y(r.m.betweenness) - 5;
    if (placed.some((p) => Math.abs(p.x - x) < 110 && Math.abs(p.y - py) < 12)) continue;
    placed.push({ x, y: py });
    ctx.fillText(`${r.n.name} (z = ${r.m.z.toFixed(1)})`, x, py);
  }
  markSelectedPoint(ctx, box, (m) => [m.in_degree, m.betweenness], y);
}

function drawZ() {
  refreshPalette();
  const canvas = $("scatter-z");
  if (!canvas) return;
  const { ctx, width, height } = surface(canvas);
  const box = frame(width, height, { l: 56, r: 16, t: 14, b: 38 });
  const y = String(state.data.null_year);
  const rows = withMetrics(y).filter((r) => r.m.z !== undefined && r.m.in_degree > 0);
  if (!rows.length) return;
  const maxK = Math.max(...rows.map((r) => r.m.in_degree));
  const zs = rows.map((r) => r.m.z);
  const lo = Math.min(-2, Math.floor(Math.min(...zs)));
  const hi = Math.max(2, Math.ceil(Math.max(...zs)));
  box.x = logScale(box, [1, maxK], "x");
  box.y = linearScale(box, [lo, hi], "y");
  const step = Math.max(1, Math.round((hi - lo) / 6));
  const yTicks = [];
  for (let v = lo; v <= hi; v += step) yTicks.push({ value: v, label: String(v) });
  axes(ctx, box, { xTicks: logTicks(1, maxK), yTicks, xLabel: "Origins (in-degree)", yLabel: "z-score" });
  ctx.strokeStyle = "#c2d0e2";
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(box.left, box.y(0));
  ctx.lineTo(box.right, box.y(0));
  ctx.stroke();
  ctx.setLineDash([]);
  const marks = collect("scatter-z");
  const zLabel = (r) =>
    `<b>${r.n.name}</b>` +
    `<span>z = ${r.m.z.toFixed(2)}${r.m.z >= 2 ? " · more of a bridge than its partners explain" : " · explained by its partner count"}</span>` +
    `<span>${r.m.in_degree} origins · betweenness #${r.m.betweenness_rank}</span>`;
  plotDots(ctx, marks, rows.filter((r) => r.m.z < 2).map((r) => ({
    x: box.x(r.m.in_degree), y: box.y(r.m.z), iso3: r.iso3, label: zLabel(r),
  })), ACCESS + "99", 2.4);
  plotDots(ctx, marks, rows.filter((r) => r.m.z >= 2).map((r) => ({
    x: box.x(r.m.in_degree), y: box.y(r.m.z), iso3: r.iso3, label: zLabel(r),
  })), PEOPLE, 2.4);
  markSelectedPoint(ctx, box, (m) => [m.in_degree, m.z ?? 0], y);
}

// Points are drawn here so hover and selection are handled once. The hovered
// country swells to three times its radius with a halo; the selected one keeps
// its ring.
function plotDots(ctx, marks, points, colour, radius) {
  // Points arrive with a label; the tooltip is the only place it is read.
  for (const point of points) {
    const hovered = point.iso3 === state.hover;
    if (hovered) {
      ctx.fillStyle = "rgba(15,35,64,0.16)";
      ctx.beginPath();
      ctx.arc(point.x, point.y, radius * 4.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = colour;
    ctx.beginPath();
    ctx.arc(point.x, point.y, hovered ? radius * 3 : radius, 0, Math.PI * 2);
    ctx.fill();
    marks.push({ x: point.x, y: point.y, iso3: point.iso3, label: point.label });
  }
}

function markSelectedPoint(ctx, box, pick, y) {
  if (!state.selected) return;
  const m = metrics(state.selected, y);
  if (!m) return;
  const [vx, vy] = pick(m);
  if (vy === undefined) return;
  const x = box.x(vx);
  const py = box.y(vy);
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(x, py, 5, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = INK;
  ctx.font = "600 10px -apple-system, system-ui, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText(node(state.selected).name, Math.min(x + 8, box.right - 70), py + 3);
}

/* ---------------------------------------------------------------- section 7 */

function renderTypology() {
  const buckets = new Map(Object.keys(TYPES).map((k) => [k, []]));
  const y = String(state.data.null_year);
  for (const { iso3, m } of withMetrics(y)) {
    if (m.typology && buckets.has(m.typology)) buckets.get(m.typology).push({ iso3, m });
  }
  const order = ["destination-hub", "human-bridge", "system-airport", "both", "leaf"];
  $("typology-cards").innerHTML = order
    .map((key) => {
      const meta = TYPES[key];
      const members = buckets.get(key) ?? [];
      // Each bucket shows the countries that define it, so the examples are
      // ranked by whatever put them in the bucket. A leaf's examples are the
      // smallest, not the largest.
      const sorter =
        key === "human-bridge"
          ? (a, b) => (b.m.z ?? 0) - (a.m.z ?? 0)
          : key === "system-airport"
            ? (a, b) => node(b.iso3).flight_degree - node(a.iso3).flight_degree
            : key === "leaf"
              ? (a, b) => a.m.in_strength - b.m.in_strength
              : (a, b) => b.m.in_strength - a.m.in_strength;
      const examples = members
        .slice()
        .sort(sorter)
        .slice(0, 3)
        .map((r) => r.iso3);
      const chips = examples
        .map(
          (iso3) =>
            `<button class="eg-chip" data-iso3="${iso3}" type="button">${iso3}</button>`,
        )
        .join("");
      return `<article class="type" data-type="${key}">
        <div class="badge" style="background:${meta.tint};color:${meta.fg}">${meta.icon}</div>
        <h3 style="color:${meta.fg}">${meta.title}</h3>
        <p>${meta.what}</p>
        <p class="eg">${members.length} ${members.length === 1 ? "country" : "countries"}<br />Examples: ${chips || "none"}</p>
        <button class="eg-all" data-type="${key}" type="button">See all ${members.length} →</button>
      </article>`;
    })
    .join("");

  const host = $("typology-cards");
  // Hovering an example says who it is; clicking selects it. The card's own
  // button opens the full membership in a drawer.
  host.addEventListener("pointermove", (event) => {
    const chip = event.target.closest(".eg-chip");
    if (!chip) {
      hideTip();
      return;
    }
    const iso3 = chip.dataset.iso3;
    const m = metrics(iso3, y);
    const n = node(iso3);
    if (!m) return;
    showTip(
      event,
      `<b>${n.name}</b><span>${label(m.typology)}</span>` +
        `<span>${fmt.format(m.in_strength)} incoming · ${m.in_degree} origins</span>` +
        `<span>${fmt.format(n.flight_degree)} flight partners</span>`,
    );
  });
  host.addEventListener("pointerleave", hideTip);
  host.addEventListener("click", (event) => {
    const chip = event.target.closest(".eg-chip");
    if (chip) {
      select(chip.dataset.iso3);
      return;
    }
    const all = event.target.closest(".eg-all");
    if (all) openTypologyDrawer(all.dataset.type, buckets.get(all.dataset.type) ?? []);
  });
}

// The full membership of one role, with the numbers that put each country in
// it, in a drawer rather than five expanding cards.
function openTypologyDrawer(key, members) {
  const meta = TYPES[key];
  const drawer = $("type-drawer");
  if (!drawer) return;
  const y = String(state.data.null_year);
  const rows = members
    .slice()
    .sort((a, b) => b.m.in_strength - a.m.in_strength)
    .map(({ iso3, m }) => {
      const n = node(iso3);
      return `<tr data-iso3="${iso3}">
        <td>${n.name}</td>
        <td>${fmt.format(m.in_strength)}</td>
        <td>${m.in_degree}</td>
        <td>${m.z === undefined ? "—" : m.z.toFixed(2)}</td>
        <td>${fmt.format(n.flight_degree)}</td>
      </tr>`;
    })
    .join("");
  drawer.innerHTML = `
    <div class="drawer-head">
      <div>
        <span class="badge" style="background:${meta.tint};color:${meta.fg}">${meta.icon}</span>
        <h3 style="color:${meta.fg}">${meta.title}</h3>
        <p>${meta.what}</p>
      </div>
      <button class="drawer-close" type="button" aria-label="Close">×</button>
    </div>
    <p class="drawer-note">${members.length} countries in ${y}. Click a row to select it.</p>
    <table class="drawer-table">
      <thead><tr>
        <th>Country</th><th>Incoming</th><th>Origins</th><th>z</th><th>Flights</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>`;
  drawer.hidden = false;
  drawer.querySelector(".drawer-close").addEventListener("click", () => {
    drawer.hidden = true;
  });
  drawer.querySelectorAll("tbody tr").forEach((tr) => {
    tr.addEventListener("click", () => select(tr.dataset.iso3));
  });
}

/* ---------------------------------------------------------------- section 8 */

function edgeLookup(origin, dest) {
  const oi = state.edges.countries.indexOf(origin);
  const di = state.edges.countries.indexOf(dest);
  return state.edges.edges.find((e) => e[0] === oi && e[1] === di) ?? null;
}

function renderEdge() {
  const origin = $("edge-origin").value;
  const dest = $("edge-dest").value;
  if (!origin || !dest || origin === dest) {
    $("edge-facts").innerHTML = "";
    $("edge-kind").textContent = "—";
    $("edge-note").querySelector("span:last-child").textContent =
      "Pick two different countries.";
    return;
  }
  const yi = state.data.years.indexOf(state.year);
  const edge = edgeLookup(origin, dest);
  const reverse = edgeLookup(dest, origin);
  const weight = edge ? edge[2][yi] : 0;
  const routes = edge ? edge[3] : 0;
  const om = metrics(origin);
  const dm = metrics(dest);

  const ranked = state.edges.edges
    .map((e) => e[2][yi] ?? 0)
    .filter((w) => w > 0)
    .sort((a, b) => b - a);
  const rank = weight > 0 ? ranked.findIndex((w) => w <= weight) + 1 : null;

  $("edge-kind").textContent =
    weight > 0 && routes > 0 ? "People + flights" : weight > 0 ? "People only" : routes > 0 ? "Flights only" : "No corridor";

  const facts = [
    ["People on this link (stock)", weight ? fmt.format(weight) : "—"],
    ["Share of the origin's emigrants", om?.out_strength ? `${((weight / om.out_strength) * 100).toFixed(1)}%` : "—"],
    ["Share of the destination's immigrants", dm?.in_strength ? `${((weight / dm.in_strength) * 100).toFixed(1)}%` : "—"],
    ["Rank among all links", rank ? `${fmt.format(rank)} / ${fmt.format(ranked.length)}` : "—"],
    [`Reciprocal (${node(dest).name} → ${node(origin).name})`, reverse?.[2][yi] ? fmt.format(reverse[2][yi]) : "—"],
    ["Flight routes", routes ? fmt.format(routes) : "0"],
  ];
  $("edge-facts").innerHTML = facts
    .map(([term, value]) => {
      const note = GLOSSARY[term];
      const attr = note ? ` class="explains" data-explain="${note.replace(/"/g, "&quot;")}"` : "";
      return `<div class="fact"${attr}><dt>${term}</dt><dd>${value}</dd></div>`;
    })
    .join("");
  $("edge-note").querySelector("span:last-child").innerHTML =
    weight > 0 && routes > 0
      ? "<b>People and access agree here.</b> A human corridor with a direct air link."
      : weight > 0
        ? "<b>People without a direct link.</b> The corridor exists in the population but not in the route map, so the journey connects somewhere else."
        : routes > 0
          ? "<b>Access without people.</b> You can fly it, but almost nobody has settled at the other end."
          : "<b>Neither network connects these two.</b>";
}

/* ---------------------------------------------------------------- section 9 */

function renderDenmarkPanels() {
  const focus = state.data.focus;
  const iso3 = focus.iso3;
  const y = String(state.data.null_year);
  const m = metrics(iso3, y);
  const n = node(iso3);
  if (!m) return;

  $("dk-head").innerHTML =
    `<div class="who"><span class="flag">${flag(n.iso2)}</span><span><strong>${n.name}</strong><br /><span class="codes">${iso3} · ${y}</span></span></div>` +
    [
      ["Incoming", fmt.format(m.in_strength)],
      ["Outgoing", fmt.format(m.out_strength)],
      ["Origins", `${m.in_degree} (#${m.in_degree_rank})`],
      ["Destinations", `${m.out_degree} (#${m.out_degree_rank})`],
      ["Betweenness", `#${m.betweenness_rank}`],
      ["z-score", m.z === undefined ? "—" : m.z.toFixed(2)],
      ["Flight partners", fmt.format(n.flight_degree)],
      ["Typology", label(m.typology)],
    ]
      .map(([k, v]) => {
        const note = GLOSSARY[{
          Incoming: "Incoming migrants (stock)",
          Outgoing: "Outgoing migrants (stock)",
          Origins: "Origins represented",
          Destinations: "Destinations sent to",
        }[k] ?? k];
        const attr = note ? ` class="explains" data-explain="${note.replace(/"/g, "&quot;")}"` : "";
        return `<div class="metric"${attr}><span>${k}</span><b>${v}</b></div>`;
      })
      .join("");


  const egoRow = (c) =>
    `<tr><td>${node(c.other)?.name ?? c.other}</td><td>${fmt.format(c.weight)}</td></tr>`;
  $("dk-in").innerHTML =
    `<caption>Top links into Denmark</caption><tr><th>Origin</th><th style="text-align:right">People</th></tr>` +
    (n.top_in ?? []).map(egoRow).join("");
  $("dk-out").innerHTML =
    `<caption>Top links out of Denmark</caption><tr><th>Destination</th><th style="text-align:right">People</th></tr>` +
    (n.top_out ?? []).map(egoRow).join("");


  const rank = m.betweenness_rank;
  const strengthRank = m.in_strength_rank;
  $("dk-verdict").querySelector("span:last-child").innerHTML =
    `<b>Denmark, in one line.</b> It ranks #${strengthRank} by the number of foreign-born residents and #${rank} as a bridge, ` +
    `with a z-score of ${m.z === undefined ? "—" : m.z.toFixed(2)} against the degree-preserving null. ` +
    `Its ${m.in_degree} recorded origins are unusually many for its size, and that is a register artefact ` +
    `as much as a fact about Denmark: a population register names every origin, while a survey-based ` +
    `country files most of them under "other".`;
}

function drawDenmark() {
  refreshPalette();
  const focus = state.data.focus;
  const iso3 = focus.iso3;
  const y = String(state.data.null_year);
  const m = metrics(iso3, y);
  const n = node(iso3);
  if (!m) return;

  const rows = withMetrics(y).filter((r) => r.m.in_degree > 0 && r.m.betweenness > 0);
  small($("dk-scatter"), (ctx, box) => {
    const maxK = Math.max(...rows.map((r) => r.m.in_degree));
    const minB = Math.min(...rows.map((r) => r.m.betweenness));
    const maxB = Math.max(...rows.map((r) => r.m.betweenness));
    box.x = logScale(box, [1, maxK], "x");
    box.y = logScale(box, [minB, maxB], "y");
    axes(ctx, box, {
      xTicks: logTicks(1, maxK),
      yTicks: logTicks(minB, maxB),
      xLabel: "Origins (in-degree)",
      yLabel: "Betweenness",
    });
    const marks = collect("dk-scatter");
    plotDots(ctx, marks, rows.map((r) => ({
      x: box.x(r.m.in_degree), y: box.y(r.m.betweenness), iso3: r.iso3,
      label: `<b>${r.n.name}</b><span>${r.m.in_degree} origins · #${r.m.in_degree_rank}</span>` +
        `<span>betweenness #${r.m.betweenness_rank}</span>`,
    })), "#c9d7e8", 1.8);
    dot(ctx, box.x(m.in_degree), box.y(m.betweenness), "#d0021b", n.name, 4, box.right);
    for (const other of focus.nordics) {
      if (other.iso3 === iso3) continue;
      const om = metrics(other.iso3, y);
      if (om) dot(ctx, box.x(om.in_degree), box.y(om.betweenness), PEOPLE, other.iso3, 2.6, box.right);
    }
  });

  const zRows = rows.filter((r) => r.m.z !== undefined);
  small($("dk-z"), (ctx, box) => {
    if (!zRows.length) return;
    const maxK = Math.max(...zRows.map((r) => r.m.in_degree));
    const lo = Math.min(-2, ...zRows.map((r) => r.m.z));
    const hi = Math.max(2, ...zRows.map((r) => r.m.z));
    box.x = logScale(box, [1, maxK], "x");
    box.y = linearScale(box, [lo, hi], "y");
    axes(ctx, box, {
      xTicks: logTicks(1, maxK),
      yTicks: [lo, 0, hi].map((v) => ({ value: v, label: v.toFixed(0) })),
      xLabel: "Origins (in-degree)",
      yLabel: "Betweenness z-score",
    });
    const marks = collect("dk-z");
    plotDots(ctx, marks, zRows.map((r) => ({
      x: box.x(r.m.in_degree), y: box.y(r.m.z), iso3: r.iso3,
      label: `<b>${r.n.name}</b><span>z = ${r.m.z.toFixed(2)}</span>` +
        `<span>${r.m.in_degree} origins</span>`,
    })), "#c9d7e8", 1.8);
    if (m.z !== undefined) dot(ctx, box.x(m.in_degree), box.y(m.z), "#d0021b", n.name, 4, box.right);
  });

  small($("dk-time"), (ctx, box) => {
    const years = focus.series.map((s) => s.year);
    const maxV = Math.max(...focus.series.map((s) => Math.max(s.in_strength, s.out_strength)));
    box.x = linearScale(box, [years[0], years.at(-1)], "x");
    box.y = linearScale(box, [0, maxV], "y");
    axes(ctx, box, {
      xTicks: [years[0], years[Math.floor(years.length / 2)], years.at(-1)].map((v) => ({ value: v, label: String(v) })),
      yTicks: [0, maxV / 2, maxV].map((v) => ({ value: v, label: compact.format(v) })),
      xLabel: "Year",
      yLabel: "People (stock)",
    });
    line(ctx, box, focus.series, (s) => s.year, (s) => s.in_strength, PEOPLE);
    line(ctx, box, focus.series, (s) => s.year, (s) => s.out_strength, ACCESS);
    const timeMarks = collect("dk-time");
    for (const point of focus.series) {
      timeMarks.push({
        x: box.x(point.year), y: box.y(point.in_strength), iso3: focus.iso3,
        label: `<b>Denmark, ${point.year}</b>` +
          `<span>${fmt.format(point.in_strength)} incoming</span>` +
          `<span>${fmt.format(point.out_strength)} outgoing</span>`,
      });
    }
  });

  small($("dk-rank"), (ctx, box) => {
    const years = focus.series.map((s) => s.year);
    const maxR = Math.max(...focus.series.map((s) => s.betweenness_rank));
    box.x = linearScale(box, [years[0], years.at(-1)], "x");
    box.y = linearScale(box, [maxR, 1], "y");
    axes(ctx, box, {
      xTicks: [years[0], years.at(-1)].map((v) => ({ value: v, label: String(v) })),
      yTicks: [1, Math.round(maxR / 2), maxR].map((v) => ({ value: v, label: `#${v}` })),
      xLabel: "Year",
      yLabel: "Bridge rank",
    });
    line(ctx, box, focus.series, (s) => s.year, (s) => s.betweenness_rank, INK);
    const rankMarks = collect("dk-rank");
    for (const point of focus.series) {
      rankMarks.push({
        x: box.x(point.year), y: box.y(point.betweenness_rank), iso3: focus.iso3,
        label: `<b>Denmark, ${point.year}</b>` +
          `<span>bridge rank #${point.betweenness_rank}</span>` +
          `<span>${point.in_degree} origins</span>`,
      });
    }
  });

  small($("dk-nordic"), (ctx, box) => {
    const items = focus.nordics;
    const maxDeg = Math.max(...items.map((i) => i.in_degree), 1);
    const maxFlight = Math.max(...items.map((i) => i.flight_degree), 1);
    const maxZ = Math.max(...items.map((i) => Math.abs(i.z ?? 0)), 1);
    box.x = linearScale(box, [0, items.length], "x");
    box.y = linearScale(box, [0, 1], "y");
    axes(ctx, box, {
      xTicks: items.map((i, idx) => ({ value: idx + 0.5, label: i.iso3 })),
      yTicks: [0, 0.5, 1].map((v) => ({ value: v, label: v === 1 ? "max" : v === 0 ? "0" : "" })),
      xLabel: "Nordic country",
      yLabel: "Share of the largest",
    });
    const bars = [
      { name: "Origins", read: (i) => i.in_degree, get: (i) => i.in_degree / maxDeg, colour: PEOPLE },
      { name: "z-score", read: (i) => (i.z ?? 0).toFixed(2), get: (i) => Math.abs(i.z ?? 0) / maxZ, colour: INK },
      { name: "Flight partners", read: (i) => i.flight_degree, get: (i) => i.flight_degree / maxFlight, colour: ACCESS },
    ];
    const marks = collect("dk-nordic");
    items.forEach((item, idx) => {
      bars.forEach((bar, bi) => {
        const w = (box.x(1) - box.x(0)) / 4;
        const x = box.x(idx) + w * (bi + 0.5);
        const yv = box.y(bar.get(item));
        ctx.fillStyle = bar.colour;
        ctx.fillRect(x, yv, w * 0.8, box.bottom - yv);
        marks.push({
          x: x + w * 0.4, y: (yv + box.bottom) / 2, iso3: item.iso3,
          label: `<b>${item.name}</b><span>${bar.name}: ${bar.read(item)}</span>` +
            `<span>betweenness rank #${item.betweenness_rank}</span>`,
        });
      });
    });
  });
}

function small(canvas, draw) {
  if (!canvas) return;
  const { ctx, width, height } = surface(canvas);
  // Room on the left for a rotated axis title and at the bottom for its pair.
  const box = frame(width, height, { l: 52, r: 16, t: 10, b: 38 });
  draw(ctx, box);
}

function dot(ctx, x, y, colour, name, r = 4, right = Infinity) {
  ctx.fillStyle = colour;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  if (!name) return;
  ctx.fillStyle = INK;
  ctx.font = "600 9px -apple-system, system-ui, sans-serif";
  // Denmark and its neighbours sit at the far right of these charts, where a
  // label to the right of the point runs off the plot. Flip it when it would.
  const width = ctx.measureText(name).width;
  const flip = x + 6 + width > right;
  ctx.textAlign = flip ? "right" : "left";
  ctx.fillText(name, flip ? x - 6 : x + 6, y - 4);
  ctx.textAlign = "left";
}

function line(ctx, box, rows, getX, getY, colour) {
  ctx.strokeStyle = colour;
  ctx.lineWidth = 2;
  ctx.beginPath();
  rows.forEach((r, i) => {
    const x = box.x(getX(r));
    const y = box.y(getY(r));
    if (i) ctx.lineTo(x, y);
    else ctx.moveTo(x, y);
  });
  ctx.stroke();
  ctx.fillStyle = colour;
  for (const r of rows) {
    ctx.beginPath();
    ctx.arc(box.x(getX(r)), box.y(getY(r)), 2.5, 0, Math.PI * 2);
    ctx.fill();
  }
}

/* -------------------------------------------------------------------- wire */

function setYear(value) {
  state.year = state.data.years[value];
  $("year-now").textContent = String(state.year);
  R.globe();
  R.map();
  R.hist();
  R.ccdf();
  renderInspector();
  renderEdge();
}

function setupEdgeInspector() {
  const options = state.data.countries
    .filter((iso3) => metrics(iso3, String(state.data.null_year)))
    .map((iso3) => ({ iso3, name: node(iso3).name }))
    .sort((a, b) => a.name.localeCompare(b.name));
  const html = options.map((o) => `<option value="${o.iso3}">${o.name}</option>`).join("");
  $("edge-origin").innerHTML = html;
  $("edge-dest").innerHTML = html;
  $("edge-origin").value = options.some((o) => o.iso3 === "ESP") ? "ESP" : options[0].iso3;
  $("edge-dest").value = options.some((o) => o.iso3 === "COL") ? "COL" : options[1].iso3;
  $("edge-origin").addEventListener("change", renderEdge);
  $("edge-dest").addEventListener("change", renderEdge);
  renderEdge();
}

function setupGlobe() {
  const canvas = $("globe-canvas");
  let moved = false;
  let lastX = 0;
  canvas.addEventListener("pointerdown", (event) => {
    state.dragging = true;
    moved = false;
    lastX = event.clientX;
    try {
      canvas.setPointerCapture(event.pointerId);
    } catch {
      // No active pointer: the drag still tracks through pointermove.
    }
  });
  canvas.addEventListener("pointermove", (event) => {
    if (!state.dragging) return;
    const dx = event.clientX - lastX;
    if (Math.abs(dx) > 2) moved = true;
    state.rotation += dx * 0.4;
    lastX = event.clientX;
    R.globe();
  });
  canvas.addEventListener("pointerup", (event) => {
    state.dragging = false;
    try {
      canvas.releasePointerCapture(event.pointerId);
    } catch {
      // Already released.
    }
    if (!moved) {
      const hit = globeHit(event);
      if (hit) select(hit);
    }
  });
}

function setupMap() {
  const toggle = $("map-toggle");
  toggle.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-layer]");
    if (!button) return;
    state.layer = button.dataset.layer;
    for (const b of toggle.querySelectorAll("button")) {
      b.setAttribute("aria-pressed", String(b === button));
    }
    R.map();
  });
  $("map-canvas").addEventListener("click", (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const [lon, lat] = unprojectMap(x, y, rect.width, rect.height);
    const territory = countryAt(lon, lat);
    if (territory) {
      select(territory);
      return;
    }
    let best = null;
    for (const iso3 of state.data.countries) {
      const coord = node(iso3)?.coord;
      if (!coord || !metrics(iso3)) continue;
      const p = mapPoint(coord, rect.width, rect.height);
      const d = Math.hypot(p.x - x, p.y - y);
      if (d < 14 && (!best || d < best.d)) best = { iso3, d };
    }
    // Selecting never scrolls. The reader chose where to look.
    if (best) select(best.iso3);
  });
  $("map-canvas").addEventListener("pointermove", (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const [lon, lat] = unprojectMap(x, y, rect.width, rect.height);
    const over =
      countryAt(lon, lat) ??
      state.data.countries.find((iso3) => {
        const coord = node(iso3)?.coord;
        if (!coord || !metrics(iso3)) return false;
        const p = mapPoint(coord, rect.width, rect.height);
        return Math.hypot(p.x - x, p.y - y) < 14;
      }) ??
      null;
    event.currentTarget.style.cursor = over ? "pointer" : "default";
    if (state.hover !== over) {
      state.hover = over;
      R.map();
    }
  });
}

function renderTwinStats() {
  const y = String(state.data.null_year);
  const totals = state.data.totals[y] ?? state.data.totals[state.data.null_year];
  const snap = state.data.flight_snapshot;
  $("twin-stats").innerHTML = [
    row("Migration links", fmt.format(totals.corridors)),
    row("People counted", compact.format(totals.people)),
    row("Flight links", fmt.format(snap.country_pairs)),
    row("Countries with flights", fmt.format(snap.countries)),
  ].join("");
  $("flight-caveat").textContent = snap.note;
  $("null-method").textContent =
    `Null: ${state.data.shuffles} degree-preserving shuffles of the ${state.data.null_year} network. ` +
    "Each shuffle keeps every country's in- and out-degree and deals the observed corridor weights back out at random.";
  $("null-tag").textContent = `(null model · ${state.data.null_year} · ${state.data.shuffles} shuffles)`;
  $("twin-tag").textContent = `(migration ${state.data.null_year} · flights undated)`;

  // A country with four corridors gets a tiny null spread and so a huge z for
  // very little reason. The list keeps countries with at least ten partners and
  // the caption says what was excluded, rather than quietly dropping them.
  const scored = withMetrics(y).filter((r) => r.m.z !== undefined);
  const solid = scored.filter((r) => r.m.in_degree >= 10);
  const excluded = scored.filter(
    (r) => r.m.in_degree < 10 && r.m.z >= Math.min(...solid.slice(0, 6).map((s) => s.m.z)),
  ).length;
  $("z-top").innerHTML = solid
    .sort((a, b) => b.m.z - a.m.z)
    .slice(0, 6)
    .map(
      (r) =>
        `<li><span>${r.n.name} <span style="color:#7a8fac">k=${r.m.in_degree}</span></span><b>z = ${r.m.z.toFixed(1)}</b></li>`,
    )
    .join("");
  $("z-floor").textContent = excluded
    ? `Countries with fewer than ten origins are held out of this list: ${excluded} of them score higher, on a null spread too small to trust.`
    : "";
}

// The canvas renderer, and the default for every visual. A variant module
// replaces the entries it wants and inherits the rest.
const CANVAS_RENDERER = {
  name: "canvas",
  globe: drawGlobe, map: drawMap, hist: drawHistogram, ccdf: drawCcdf,
  scatters: drawScatters, scatterBetween: drawBetweenness, scatterZ: drawZ,
  denmark: drawDenmark, setupGlobe, setupMap,
};

// What a variant module is handed: everything a renderer needs to read the
// data and report a click, and nothing that would let it change a number.
export const api = {
  state, R, node, metrics, withMetrics, select, topEdges, flightEdges,
  degreeCounts, ccdf, collect, enablePicking, label,
  refreshPalette, arcSpec, syncFlow, rgb, countryAt, unprojectMap,
  showTip, hideTip, axisMode, modeFlags, ticksFor,
  linkSpec, rampColour, linkAlpha, THICKNESS, earthTexture, textureURL,
  paintPhotoGlobe,
  // Chart furniture, so the questions section draws on the same axes as the
  // rest of the post instead of inventing its own.
  surface, frame, axes, logTicks, logScale, linearScale, flag,
  colours: { PEOPLE, ACCESS, INK, MUTE, GRID },
  format: { fmt, compact },
  $,
};

// Called by the style bar when a dropdown changes: re-read the palette, restart
// or stop the flow animation, and repaint everything.
export function restyle() {
  refreshPalette();
  syncFlow();
  R.globe();
  R.map();
  R.hist();
  R.ccdf();
  R.scatters();
  R.denmark();
  // The questions drawer draws on canvas in every renderer, so it repaints on
  // the same signal rather than being reached into from here.
  window.dispatchEvent(new CustomEvent("week03:restyle"));
}

export async function start() {
  // Canvas fills the gaps rather than overwriting, so a variant installed
  // before start() keeps whichever visuals it replaced.
  for (const [key, value] of Object.entries(CANVAS_RENDERER)) {
    if (!(key in R)) R[key] = value;
  }
  return main();
}

async function main() {
  try {
    // Resolved against this module, not the page, so the arcade edition and
    // the Apple edition load the same two files from different depths.
    const data = (name) => new URL(`../data/${name}`, import.meta.url);
    const [corridors, edges, world] = await Promise.all([
      fetch(data("week03_corridors.json")).then((r) => r.json()),
      fetch(data("week03_edges.json")).then((r) => r.json()),
      // Land is decoration for the argument but essential for reading a map,
      // so a failure to load it must not stop the post.
      fetch(data("world_outline.geo.json"))
        .then((r) => r.json())
        .catch(() => null),
    ]);
    state.data = corridors;
    state.edges = edges;
    state.world = world;
    state.year = corridors.null_year;
    $("year-slider").max = String(corridors.years.length - 1);
    $("year-slider").value = String(corridors.years.indexOf(corridors.null_year));
    $("year-now").textContent = String(state.year);
    $("status").textContent =
      `${fmt.format(corridors.countries.length)} countries · ` +
      `${fmt.format(corridors.corridor_count)} migration links · ` +
      `${fmt.format(corridors.flight_snapshot.country_pairs)} flight links · ` +
      `null model: ${corridors.shuffles} shuffles of ${corridors.null_year}`;

    R.setupGlobe();
    R.setupMap();
    for (const id of [
      "hist",
      "ccdf",
      "scatter-between",
      "scatter-z",
      "dk-scatter",
      "dk-z",
      "dk-time",
      "dk-rank",
      "dk-nordic",
    ])
      enablePicking(id);
    refreshPalette();
    syncFlow();
    wireGlossary();
    setupEdgeInspector();
    renderTwinStats();
    renderTypology();
    select("ESP");
    setYear(Number($("year-slider").value));
    $("year-slider").addEventListener("input", (event) => setYear(Number(event.target.value)));
    window.addEventListener("resize", () => {
      R.globe();
      R.map();
      R.hist();
      R.ccdf();
      R.scatters();
      R.denmark();
    });
  } catch (error) {
    $("status").textContent = `Could not load the corridor data: ${error.message}`;
    throw error;
  }
}

