// Corridor Control, render variants.
//
// The page, the data and every number are identical across variants. What
// changes is which library draws them, so the four can be compared on the same
// content rather than on four different posts.
//
//   ?variant=canvas   hand-rolled 2D canvas, no library at all   (default)
//   ?variant=d3       D3 v7: SVG charts and a d3-geo globe
//   ?variant=echarts  Apache ECharts for every chart
//   ?variant=globe    globe.gl (three.js) for the hero globe
//   ?variant=deck     deck.gl GlobeView and ArcLayer
//
// A variant overrides only the visuals it improves on and inherits the canvas
// renderer for the rest, so "the ECharts variant" means the charts changed and
// the globe did not. Each card in the switcher says what it swaps and what it
// costs to download.

import { api, installRenderer, start } from "./corridor.js";

export const VARIANTS = {
  canvas: {
    label: "Canvas",
    swaps: "Everything. Hand-rolled 2D canvas.",
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
    swaps: "The hero globe, in WebGL with animated arcs. The twin map and the charts stay on canvas.",
    library: "globe.gl 2.32.0, bundling three.js",
    bytes: 1032643,
    script: "globe.gl-2.32.0.min.js",
    global: "Globe",
    module: "./variants/globe.js",
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

const DEFAULT = "canvas";

export function chosenVariant(search = window.location.search) {
  const asked = new URLSearchParams(search).get("variant");
  return asked && Object.hasOwn(VARIANTS, asked) ? asked : DEFAULT;
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

function renderSwitcher(active) {
  const host = document.getElementById("variant-switcher");
  if (!host) return;
  const url = (name) => {
    const next = new URL(window.location.href);
    if (name === DEFAULT) next.searchParams.delete("variant");
    else next.searchParams.set("variant", name);
    next.hash = "";
    return next.pathname + next.search;
  };
  host.innerHTML = Object.entries(VARIANTS)
    .map(
      ([name, v]) =>
        `<a class="variant${name === active ? " on" : ""}" href="${url(name)}"` +
        ` aria-current="${name === active}"` +
        ` title="${v.swaps} Download: ${kb(v.bytes)}.">` +
        `<b>${v.label}</b><span>${kb(v.bytes)}</span></a>`,
    )
    .join("");

  const note = document.getElementById("variant-note");
  if (note) {
    const v = VARIANTS[active];
    note.innerHTML =
      `<b>${v.label} variant.</b> ${v.swaps} ` +
      (v.bytes
        ? `Library: ${v.library}, ${kb(v.bytes)}, vendored in the repo rather than loaded from a CDN.`
        : "No charting library is loaded at all; every mark is drawn by hand.") +
      " The data, the numbers and the copy are the same in every variant.";
  }
}

async function boot() {
  const name = chosenVariant();
  renderSwitcher(name);
  document.body.dataset.variant = name;

  const variant = VARIANTS[name];
  if (variant.script) {
    try {
      await loadVendor(variant.script);
      const { install } = await import(variant.module);
      installRenderer({ name, ...install(api, window[variant.global]) });
    } catch (error) {
      // A broken variant must not take the post down with it.
      const status = document.getElementById("status");
      if (status) {
        status.textContent =
          `The ${variant.label} variant failed to load (${error.message}); ` +
          "showing the canvas version instead.";
      }
      document.body.dataset.variant = "canvas";
      renderSwitcher("canvas");
      console.error(error);
    }
  }
  await start();
}

boot();
