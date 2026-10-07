// The page-wide state of Corridor Control, which week03-boot.js and
// corridor.js kept in module variables and in the DOM on main. corridor.js
// keeps its own `state` for the painters and mirrors every change a reader
// makes into this store, so the islands re-render and repaint from one place.
// The initial state is what the server rendered. Memory only.
import { createStore } from "../../scripts/runtime/store.js";

export const corridor = createStore({
  // "loading" until the three core files and the renderer are in, then
  // "ready", or "error" with the message the status line shows.
  status: "loading",
  message: null,
  // The year slider: its index into the payload's years, and the year itself.
  yearIndex: null,
  year: null,
  // The one selection the whole page follows.
  selected: null,
  // The country under the pointer on a chart, and on the flat map.
  hover: null,
  mapHover: null,
  // Section 4-5's map layer and section 2's two axis switches.
  layer: "both",
  axisMode: { hist: "loglog", ccdf: "loglog" },
  // The style dimensions read from the URL once hydrated (week03-boot.js
  // readStyle), and the renderer that actually drew: a library that failed to
  // load falls back to canvas.
  style: null,
  renderer: "canvas",
  // Bumped whenever every visual has to repaint: a resize, a restyle, a
  // texture that finished loading.
  paint: 0,
  // The chart tables the canvas painters publish, by chart id.
  tables: {},
  // Section 6's drawer: the role it lists, or null when closed.
  drawer: null,
  // Section 7's two pickers.
  edge: null,
});
