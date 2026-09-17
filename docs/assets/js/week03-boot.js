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

// GitHub Pages caches assets for about ten minutes, which is long enough that
// a reader on a just-updated post can run last version's code against this
// version's markup. The page carries a build stamp on this module's URL;
// passing it on to every module it loads means one deploy invalidates the lot.
const BUILD = new URL(import.meta.url).searchParams.get("v") ?? "";
const stamped = (path) => (BUILD ? `${path}?v=${BUILD}` : path);

const { api, installRenderer, restyle, start } = await import(stamped("./corridor.js"));
const { installQuestions } = await import(stamped("./questions.js"));
const { installViews } = await import(stamped("./echarts-views.js"));

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
    module: "./variants/d3.js",
  },
  echarts: {
    label: "ECharts",
    bytes: 1030855,
    script: "echarts-5.5.1.min.js",
    global: "echarts",
    module: "./variants/echarts.js",
  },
  globe: {
    label: "globe.gl",
    bytes: 1032643,
    script: "globe.gl-2.32.0.min.js",
    global: "Globe",
    module: "./variants/globe.js",
  },
  atlas: {
    label: "Atlas",
    bytes: 1526503,
    script: "globe.gl-2.32.0.min.js",
    global: "Globe",
    module: "./variants/atlas.js",
  },
  deck: {
    label: "deck.gl",
    bytes: 1246673,
    script: "deck.gl-9.0.30.min.js",
    global: "deck",
    module: "./variants/deck.js",
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

const DIMENSIONS = [
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
  body.dataset.skin = chosen.skin;
  api.state.arcs = chosen.arcs;
  api.state.links = chosen.links;
  api.state.thickness = chosen.thickness;
  api.state.focus = chosen.focus;
  api.state.dots = chosen.dots;
  api.state.basemap = chosen.basemap;
  api.state.earth = chosen.earth;
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

function wireMenu(chosen) {
  const trigger = document.getElementById("style-trigger");
  const bar = document.getElementById("style-bar");
  if (!trigger || !bar) return;
  const label = document.getElementById("style-trigger-label");
  if (label) label.textContent = "Views";

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

// The two heavy-tail charts can be read on three scales; the buttons live in
// the markup so they work before the data lands.
function wireAxisModes() {
  for (const group of document.querySelectorAll(".axis-modes")) {
    group.addEventListener("click", (event) => {
      const button = event.target.closest("button[data-mode]");
      if (!button) return;
      const chart = group.dataset.chart;
      api.state.axisMode[chart] = button.dataset.mode;
      for (const other of group.querySelectorAll("button")) {
        other.setAttribute("aria-pressed", String(other === button));
      }
      if (chart === "hist") api.R.hist();
      else api.R.ccdf();
    });
  }
}

// Exposed for scripts/audit_week03.js, which checks that every control on the
// page actually moves something in every renderer.
window.api = api;

async function boot() {
  const chosen = readStyle();
  apply(chosen);

  const renderer = RENDERERS[chosen.variant];
  if (renderer.script) {
    try {
      await loadVendor(renderer.script);
      const { install } = await import(stamped(renderer.module));
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

  wireMenu(chosen);
  wireAxisModes();
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
    apply(chosen);
    restyle();
  });

  await start();
  installQuestions(api);
  installViews(api, loadVendor);
  restoreScroll();
}

function restoreScroll() {
  let saved = null;
  try {
    saved = sessionStorage.getItem("week03-scroll");
    sessionStorage.removeItem("week03-scroll");
  } catch {
    return;
  }
  if (saved === null) return;
  // The charts size themselves after the data lands, so the page is only as
  // tall as it will be once a frame has passed.
  requestAnimationFrame(() =>
    requestAnimationFrame(() => window.scrollTo(0, Number(saved))),
  );
}

boot();
