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
// reload when it changes; the rest repaint in place.

import { api } from "./corridor.js";
import { corridor } from "../features/week03/store.js";
import { installViews } from "./echarts-views.js";
import { loadVendor as loadSharedVendor } from "./runtime/vendor.js";

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

// Vendored, not fetched from a CDN: the site works offline and pulls no
// third-party JavaScript at runtime. See public/assets/vendor/README.md. One
// promise per file for the page's lifetime: like the failed <script> this page
// used to reuse, a library that did not load is not requested again.
const vendorLoads = new Map();
function loadVendor(file) {
  if (!vendorLoads.has(file)) vendorLoads.set(file, loadSharedVendor(file));
  return vendorLoads.get(file);
}

function kb(bytes) {
  return bytes ? `${Math.round(bytes / 1024)} KB` : "no library";
}

// The menu opens from the top bar, so the controls stay out of the reading
// flow until somebody wants them. Renderer and basemap are chips; the rest
// sit under "More options" so the common choices are one tap away.
const CHIP_KEYS = new Set(["variant", "basemap"]);

function optionsHTML(dimension, chosen) {
  return Object.entries(dimension.options)
    .map(
      ([value, meta]) =>
        `<option value="${value}"${value === chosen[dimension.key] ? " selected" : ""}>` +
        `${meta.label}${meta.bytes ? ` · ${kb(meta.bytes)}` : ""}</option>`,
    )
    .join("");
}

function wireMenu() {
  const trigger = document.getElementById("style-trigger");
  const bar = document.getElementById("style-bar");
  if (!trigger || !bar) return;

  const close = () => {
    bar.hidden = true;
    trigger.setAttribute("aria-expanded", "false");
  };
  trigger.addEventListener("click", (event) => {
    event.stopPropagation();
    const open = bar.hidden;
    bar.hidden = !open;
    trigger.setAttribute("aria-expanded", String(open));
  });
  bar.addEventListener("click", (event) => event.stopPropagation());
  document.addEventListener("click", close);
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") close();
  });
}

function renderBar(chosen, onChange) {
  const host = document.getElementById("style-bar");
  if (!host) return;

  const chipBlocks = DIMENSIONS.filter((d) => CHIP_KEYS.has(d.key))
    .map((dimension) => {
      const chips = Object.entries(dimension.options)
        .map(
          ([value, meta]) =>
            `<button type="button" class="style-chip" data-value="${value}"` +
            ` aria-pressed="${value === chosen[dimension.key]}">${meta.label}</button>`,
        )
        .join("");
      return (
        `<div class="style-group">` +
        `<span class="style-group-label">${dimension.label}</span>` +
        `<div class="style-chips" role="group" data-dimension="${dimension.key}"` +
        ` aria-label="${dimension.label}">${chips}</div>` +
        `<select id="style-${dimension.key}" data-dimension="${dimension.key}"` +
        ` class="style-select-proxy" tabindex="-1" aria-hidden="true">` +
        `${optionsHTML(dimension, chosen)}</select>` +
        `</div>`
      );
    })
    .join("");

  const moreFields = DIMENSIONS.filter((d) => !CHIP_KEYS.has(d.key))
    .map(
      (dimension) =>
        `<div class="style-field">` +
        `<label for="style-${dimension.key}">${dimension.label}</label>` +
        `<select id="style-${dimension.key}" data-dimension="${dimension.key}">` +
        `${optionsHTML(dimension, chosen)}</select>` +
        `</div>`,
    )
    .join("");

  host.innerHTML =
    chipBlocks +
    `<details class="style-more">` +
    `<summary>More options</summary>` +
    `<div class="style-more-grid">${moreFields}</div>` +
    `</details>`;

  host.querySelectorAll(".style-chips").forEach((group) => {
    group.addEventListener("click", (event) => {
      const button = event.target.closest("button[data-value]");
      if (!button) return;
      const key = group.dataset.dimension;
      const select = document.getElementById(`style-${key}`);
      if (select) select.value = button.dataset.value;
      group.querySelectorAll("button").forEach((other) => {
        other.setAttribute("aria-pressed", String(other === button));
      });
      onChange(key, button.dataset.value);
    });
  });

  host.querySelectorAll("select").forEach((select) => {
    select.addEventListener("change", () =>
      onChange(select.dataset.dimension, select.value),
    );
  });

  const label = document.getElementById("style-trigger-label");
  if (label) label.textContent = "Views";
}

// Until the style bar and the views are islands, the entry
// wires them here, once the islands have the data in and the renderer chosen.
function legacy() {
  let wired = false;
  const wire = (s) => {
    if (wired || s.status !== "ready" || !s.style) return;
    wired = true;
    const chosen = { ...s.style };
    wireMenu();
    renderBar(chosen, (key, value) => {
      chosen[key] = value;
      const url = styleURL(chosen);
      const dimension = DIMENSIONS.find((d) => d.key === key);
      if (dimension.reloads) {
        // Swapping the drawing library mid-flight would leave half the page in
        // the old renderer's DOM, so this one dimension reloads. Carry the scroll
        // position across, or the reader is thrown back to the top for a change
        // they made halfway down.
        try {
          sessionStorage.setItem("week03-scroll", String(window.scrollY));
        } catch {
          // Private mode: the reader lands at the top, which is the old behaviour.
        }
        window.location.assign(url.pathname + url.search);
        return;
      }
      window.history.replaceState(null, "", url.pathname + url.search);
      corridor.setState({ style: { ...chosen } });
    });
    installViews(api, loadVendor);
  };
  wire(corridor.getState());
  corridor.subscribe(wire);
}

legacy();
