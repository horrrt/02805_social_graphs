// Corridor Control, style dimensions.
//
// Four independent choices, each a dropdown and each a URL parameter, so any
// combination is a link somebody can send:
//
//   ?variant=  which library draws it   canvas · d3 · echarts · globe · atlas · deck
//   ?palette=  which two colours        signal · ember · iris · okabe · slate
//   ?arcs=     how a corridor is drawn  curve · straight · flow · taper
//   ?tables=   how the panels read      rules · zebra · cards · compact
//
// The data, the numbers and the copy never change. Only the renderer needs a
// reload when it changes; the other three repaint in place.

import { api, installRenderer, restyle, start } from "./corridor.js";

export const RENDERERS = {
  canvas: {
    label: "Canvas",
    swaps: "Everything, hand-rolled on a 2D canvas.",
    library: "none",
    bytes: 0,
  },
  d3: {
    label: "D3",
    swaps: "All charts to SVG, and the globe to a d3-geo orthographic.",
    library: "d3 7.9.0",
    bytes: 279706,
    script: "d3-7.9.0.min.js",
    global: "d3",
    module: "./variants/d3.js",
  },
  echarts: {
    label: "ECharts",
    swaps: "Every chart. The globe and the twin map stay on canvas.",
    library: "echarts 5.5.1",
    bytes: 1030855,
    script: "echarts-5.5.1.min.js",
    global: "echarts",
    module: "./variants/echarts.js",
  },
  globe: {
    label: "globe.gl",
    swaps: "The hero globe, in WebGL. The twin map and the charts stay on canvas.",
    library: "globe.gl 2.32.0, bundling three.js",
    bytes: 1032643,
    script: "globe.gl-2.32.0.min.js",
    global: "Globe",
    module: "./variants/globe.js",
  },
  atlas: {
    label: "Atlas",
    swaps: "The hero globe and the twin map, as a photographic Earth.",
    library: "globe.gl plus 482 KB of NASA Blue Marble imagery",
    bytes: 1526503,
    script: "globe.gl-2.32.0.min.js",
    global: "Globe",
    module: "./variants/atlas.js",
  },
  deck: {
    label: "deck.gl",
    swaps: "The hero globe and the twin map, as a GlobeView with arc layers.",
    library: "deck.gl 9.0.30",
    bytes: 1246673,
    script: "deck.gl-9.0.30.min.js",
    global: "deck",
    module: "./variants/deck.js",
  },
};

export const PALETTES = {
  signal: { label: "Signal", note: "Orange for people, blue for access." },
  ember: { label: "Ember", note: "Hotter orange against teal." },
  iris: { label: "Iris", note: "Violet against sky blue." },
  okabe: { label: "Okabe-Ito", note: "The standard colourblind-safe pair." },
  slate: { label: "Slate", note: "One hue, separated by value. Prints well." },
};

export const ARCS = {
  curve: { label: "Curved", note: "A corridor bows away from the straight line." },
  straight: { label: "Straight", note: "Shortest path on the page, flat on the globe." },
  flow: { label: "Flowing", note: "Dashes travel from origin to destination." },
  taper: { label: "Tapered", note: "Heavy where people leave, thin where they land." },
};

export const TABLES = {
  rules: { label: "Rules", note: "A hairline between rows." },
  zebra: { label: "Zebra", note: "Alternating row tint." },
  cards: { label: "Cards", note: "Every row in its own box." },
  compact: { label: "Compact", note: "Denser, for comparing more at once." },
};

const DIMENSIONS = [
  { key: "variant", label: "Renderer", options: RENDERERS, fallback: "canvas", reloads: true },
  { key: "palette", label: "Colours", options: PALETTES, fallback: "signal" },
  { key: "arcs", label: "Corridor lines", options: ARCS, fallback: "curve" },
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

function styleURL(chosen) {
  const next = new URL(window.location.href);
  for (const dimension of DIMENSIONS) {
    const value = chosen[dimension.key];
    if (value === dimension.fallback) next.searchParams.delete(dimension.key);
    else next.searchParams.set(dimension.key, value);
  }
  return next;
}

// Vendored, not fetched from a CDN: the site works offline and pulls no
// third-party JavaScript at runtime. See docs/assets/vendor/README.md.
function loadVendor(file) {
  const src = new URL(`../vendor/${file}`, import.meta.url).href;
  const existing = document.querySelector(`script[src="${src}"]`);
  if (existing) return existing.__ready;
  const script = document.createElement("script");
  script.src = src;
  script.__ready = new Promise((resolve, reject) => {
    script.onload = resolve;
    script.onerror = () => reject(new Error(`could not load ${file}`));
  });
  document.head.appendChild(script);
  return script.__ready;
}

function kb(bytes) {
  return bytes ? `${Math.round(bytes / 1024)} KB` : "no library";
}

function apply(chosen) {
  const body = document.body;
  body.dataset.variant = chosen.variant;
  body.dataset.palette = chosen.palette;
  body.dataset.tables = chosen.tables;
  api.state.arcs = chosen.arcs;
}

function describe(chosen) {
  const renderer = RENDERERS[chosen.variant];
  return (
    `<b>${renderer.label}.</b> ${renderer.swaps} ` +
    `${PALETTES[chosen.palette].note} ${ARCS[chosen.arcs].note} ` +
    `${TABLES[chosen.tables].note} ` +
    (renderer.bytes
      ? `Library: ${renderer.library}, ${kb(renderer.bytes)}, vendored in the repo.`
      : "No charting library is loaded; every mark is drawn by hand.") +
    " The data and the numbers are the same in every combination."
  );
}

function renderBar(chosen, onChange) {
  const host = document.getElementById("style-bar");
  if (!host) return;
  host.innerHTML =
    DIMENSIONS.map((dimension) => {
      const options = Object.entries(dimension.options)
        .map(
          ([value, meta]) =>
            `<option value="${value}"${value === chosen[dimension.key] ? " selected" : ""}>` +
            `${meta.label}${meta.bytes ? ` · ${kb(meta.bytes)}` : ""}</option>`,
        )
        .join("");
      return (
        `<div class="style-field">` +
        `<label for="style-${dimension.key}">${dimension.label}</label>` +
        `<select id="style-${dimension.key}" data-dimension="${dimension.key}">${options}</select>` +
        `</div>`
      );
    }).join("") +
    `<p class="style-note" id="style-note">${describe(chosen)}</p>`;

  host.querySelectorAll("select").forEach((select) => {
    select.addEventListener("change", () =>
      onChange(select.dataset.dimension, select.value),
    );
  });
}

async function boot() {
  const chosen = readStyle();
  apply(chosen);

  const renderer = RENDERERS[chosen.variant];
  if (renderer.script) {
    try {
      await loadVendor(renderer.script);
      const { install } = await import(renderer.module);
      installRenderer({ name: chosen.variant, ...install(api, window[renderer.global]) });
    } catch (error) {
      // A broken renderer must not take the post down with it.
      const status = document.getElementById("status");
      if (status) {
        status.textContent =
          `The ${renderer.label} renderer failed to load (${error.message}); ` +
          "showing the canvas version instead.";
      }
      chosen.variant = "canvas";
      apply(chosen);
      console.error(error);
    }
  }

  renderBar(chosen, (key, value) => {
    chosen[key] = value;
    const url = styleURL(chosen);
    const dimension = DIMENSIONS.find((d) => d.key === key);
    if (dimension.reloads) {
      // Swapping the drawing library mid-flight would leave half the page in
      // the old renderer's DOM, so this one dimension reloads.
      window.location.assign(url.pathname + url.search);
      return;
    }
    window.history.replaceState(null, "", url.pathname + url.search);
    apply(chosen);
    document.getElementById("style-note").innerHTML = describe(chosen);
    restyle();
  });

  await start();
}

boot();
