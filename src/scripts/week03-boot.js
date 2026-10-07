// Corridor Control, style dimensions.
//
// Independent choices, each a dropdown and each a URL parameter, so any
// combination is a link somebody can send:
//
//   ?variant=  which library draws it   canvas · d3 · echarts · globe · atlas · deck
//   ?palette=  which two colours        signal · ember · iris · okabe · slate
//   ?arcs=     how a corridor is drawn  curve · straight · flow · taper
//   ?basemap=  what the world looks like outline · photo · none
//   ?earth=    how much panel it fills  small · medium · large · huge
//   ?skin=     type and surface         clean · editorial · terminal · poster
//   ?tables=   how the panels read      rules · zebra · cards · compact
//
// The data, the numbers and the copy never change. Only the renderer needs a
// reload when it changes; the rest repaint in place. The registries live here;
// the style menu island draws them, and the boot island reads the URL with
// readStyle() and installs the renderer the variant names.

export const RENDERERS = {
  canvas: {
    label: "Canvas",
    bytes: 0,
  },
  d3: {
    label: "D3",
    bytes: 279706,
    script: "d3-7.9.0.min.js",
    global: "d3",
    module: () => import("./variants/d3.js"),
  },
  echarts: {
    label: "ECharts",
    bytes: 1030855,
    script: "echarts-5.5.1.min.js",
    global: "echarts",
    module: () => import("./variants/echarts.js"),
  },
  globe: {
    label: "globe.gl",
    bytes: 1032643,
    script: "globe.gl-2.32.0.min.js",
    global: "Globe",
    module: () => import("./variants/globe.js"),
  },
  atlas: {
    label: "Atlas",
    bytes: 1526503,
    script: "globe.gl-2.32.0.min.js",
    global: "Globe",
    module: () => import("./variants/atlas.js"),
  },
  deck: {
    label: "deck.gl",
    bytes: 1246673,
    script: "deck.gl-9.0.30.min.js",
    global: "deck",
    module: () => import("./variants/deck.js"),
  },
};

export const PALETTES = {
  signal: { label: "Signal" },
  ember: { label: "Ember" },
  iris: { label: "Iris" },
  okabe: { label: "Okabe-Ito" },
  slate: { label: "Slate" },
};

export const ARCS = {
  curve: { label: "Curved" },
  straight: { label: "Straight" },
  flow: { label: "Flowing" },
  taper: { label: "Tapered" },
};

export const LINKS = {
  width: { label: "Width by size" },
  colour: { label: "Colour by size" },
  both: { label: "Width and colour" },
  uniform: { label: "Uniform" },
};

export const THICKNESS = {
  thin: { label: "Thin" },
  normal: { label: "Normal" },
  thick: { label: "Thick" },
};

export const FOCUS = {
  all: { label: "Keep all" },
  dim: { label: "Fade the rest" },
  only: { label: "Only the selection" },
};

export const DOTS = {
  on: { label: "Show dots" },
  off: { label: "Hide dots" },
};

export const BASEMAP = {
  outline: { label: "Country outlines" },
  photo: { label: "Photographic Earth" },
  none: { label: "No basemap" },
};

// How much of its panel the globe fills. corridor.js turns each of these into
// a number; every renderer reads that same number in its own units.
export const EARTH = {
  small: { label: "Small" },
  medium: { label: "Medium" },
  large: { label: "Large" },
  huge: { label: "Fills the panel" },
};

export const SKINS = {
  clean: { label: "Clean" },
  editorial: { label: "Editorial" },
  terminal: { label: "Terminal" },
  poster: { label: "Poster" },
};

export const TABLES = {
  rules: { label: "Rules" },
  zebra: { label: "Zebra" },
  cards: { label: "Cards" },
  compact: { label: "Compact" },
};

export const DIMENSIONS = [
  { key: "variant", label: "Renderer", options: RENDERERS, fallback: "canvas", reloads: true },
  { key: "palette", label: "Colours", options: PALETTES, fallback: "signal" },
  { key: "arcs", label: "Link shape", options: ARCS, fallback: "curve" },
  { key: "links", label: "Link encoding", options: LINKS, fallback: "width" },
  { key: "thickness", label: "Link thickness", options: THICKNESS, fallback: "normal" },
  { key: "focus", label: "On selection", options: FOCUS, fallback: "dim" },
  { key: "basemap", label: "The world", options: BASEMAP, fallback: "photo" },
  { key: "earth", label: "Earth size", options: EARTH, fallback: "large" },
  { key: "dots", label: "Country dots", options: DOTS, fallback: "off" },
  { key: "skin", label: "Skin", options: SKINS, fallback: "clean" },
  { key: "tables", label: "Tables", options: TABLES, fallback: "rules" },
];

export function readStyle(search = window.location.search) {
  const params = new URLSearchParams(search);
  const chosen = {};
  for (const dimension of DIMENSIONS) {
    const asked = params.get(dimension.key);
    chosen[dimension.key] = Object.hasOwn(dimension.options, asked ?? "")
      ? asked
      : dimension.fallback;
  }
  return chosen;
}

export function styleURL(chosen) {
  const next = new URL(window.location.href);
  for (const dimension of DIMENSIONS) {
    const value = chosen[dimension.key];
    if (value === dimension.fallback) next.searchParams.delete(dimension.key);
    else next.searchParams.set(dimension.key, value);
  }
  return next;
}

// The size each library renderer downloads, on its option in the menu.
export function kb(bytes) {
  return bytes ? `${Math.round(bytes / 1024)} KB` : "no library";
}

// The menu opens from the top bar, so the controls stay out of the reading
// flow until somebody wants them. Renderer and basemap are chips; the rest
// sit under "More options" so the common choices are one tap away.
export const CHIP_KEYS = new Set(["variant", "basemap"]);
