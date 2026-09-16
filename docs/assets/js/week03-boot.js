// Corridor Control, style dimensions.
//
// Four independent choices, each a dropdown and each a URL parameter, so any
// combination is a link somebody can send:
//
//   ?variant=  which library draws it   canvas · d3 · echarts · globe · atlas · deck
//   ?palette=  which two colours        signal · ember · iris · okabe · slate
//   ?arcs=     how a corridor is drawn  curve · straight · flow · taper
//   ?basemap=  what the world looks like outline · photo · none
//   ?skin=     type and surface         clean · editorial · terminal · poster
//   ?tables=   how the panels read      rules · zebra · cards · compact
//
// The data, the numbers and the copy never change. Only the renderer needs a
// reload when it changes; the other three repaint in place.

// GitHub Pages caches assets for about ten minutes, which is long enough that
// a reader on a just-updated post can run last version's code against this
// version's markup. The page carries a build stamp on this module's URL;
// passing it on to every module it loads means one deploy invalidates the lot.
const BUILD = new URL(import.meta.url).searchParams.get("v") ?? "";
const stamped = (path) => (BUILD ? `${path}?v=${BUILD}` : path);

const { api, installRenderer, restyle, start } = await import(stamped("./corridor.js"));
const { installQuestions } = await import(stamped("./questions.js"));

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

export const LINKS = {
  width: { label: "Width by size", note: "A doubling of people is a doubling of ink." },
  colour: { label: "Colour by size", note: "Red for the lightest links, green for the heaviest." },
  both: { label: "Width and colour", note: "Both channels carry the same number, which is redundant on purpose." },
  uniform: { label: "Uniform", note: "Every link the same, so only the shape of the network shows." },
};

export const THICKNESS = {
  thin: { label: "Thin", note: "" },
  normal: { label: "Normal", note: "" },
  thick: { label: "Thick", note: "" },
};

export const FOCUS = {
  all: { label: "Keep all", note: "Every link stays drawn when a country is selected." },
  dim: { label: "Fade the rest", note: "The rest of the network fades to context." },
  only: { label: "Only the selection", note: "Only the selected country's links are drawn." },
};

export const DOTS = {
  on: { label: "Show dots", note: "" },
  off: { label: "Hide dots", note: "Territories carry the selection instead." },
};

export const BASEMAP = {
  outline: { label: "Country outlines", note: "Borders, so a corridor lands somewhere you recognise." },
  photo: { label: "Photographic Earth", note: "NASA Blue Marble, in whichever renderer is loaded." },
  none: { label: "No basemap", note: "Corridors alone, with nothing under them." },
};

export const SKINS = {
  clean: { label: "Clean", note: "System type, soft cards. The default." },
  editorial: { label: "Editorial", note: "A serif face, a narrower column, section numbers on a rail." },
  terminal: { label: "Terminal", note: "Monospace on a dark ground, nothing rounded." },
  poster: { label: "Poster", note: "Oversized type, hard borders, a printed feel." },
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
  { key: "arcs", label: "Link shape", options: ARCS, fallback: "curve" },
  { key: "links", label: "Link encoding", options: LINKS, fallback: "width" },
  { key: "thickness", label: "Link thickness", options: THICKNESS, fallback: "normal" },
  { key: "focus", label: "On selection", options: FOCUS, fallback: "all" },
  { key: "basemap", label: "The world", options: BASEMAP, fallback: "outline" },
  { key: "dots", label: "Country dots", options: DOTS, fallback: "on" },
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
}

function describe(chosen) {
  const renderer = RENDERERS[chosen.variant];
  return (
    `<b>${renderer.label}.</b> ${renderer.swaps} ` +
    `${PALETTES[chosen.palette].note} ${ARCS[chosen.arcs].note} ` +
    `${LINKS[chosen.links].note} ${FOCUS[chosen.focus].note} ` +
    `${BASEMAP[chosen.basemap].note} ${DOTS[chosen.dots].note} ` +
    `${SKINS[chosen.skin].note} ` +
    `${TABLES[chosen.tables].note} ` +
    (renderer.bytes
      ? `Library: ${renderer.library}, ${kb(renderer.bytes)}, vendored in the repo.`
      : "No charting library is loaded; every mark is drawn by hand.") +
    " The data and the numbers are the same in every combination."
  );
}

// The menu opens from the top bar, so the controls stay out of the reading
// flow until somebody wants them.
function wireMenu(chosen) {
  const trigger = document.getElementById("style-trigger");
  const bar = document.getElementById("style-bar");
  if (!trigger || !bar) return;
  const label = document.getElementById("style-trigger-label");
  if (label) label.textContent = RENDERERS[chosen.variant].label;

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
  const label = document.getElementById("style-trigger-label");
  if (label) label.textContent = RENDERERS[chosen.variant].label;
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
    const note = document.getElementById("style-note");
    if (note) note.innerHTML = describe(chosen);
    restyle();
  });

  await start();
  installQuestions(api);
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
