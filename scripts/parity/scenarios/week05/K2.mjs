// K2 on Week 5: main's only explore networks, the copying network
// (week05-copying.js) and the autocomplete map (week05-map.js), both drawn by
// networkView(). Hovers and pins a node, hovers another while pinned, focuses
// a hub, pins its group with Enter and clears with Escape, clicks a legend
// button and the three zoom buttons, zooms with Ctrl + wheel, pans by drag,
// and clears the pin with a click on the empty svg. Then zooms the map, resizes
// the window so the map draws a new view, and zooms again: the new view's zoom
// starts at 1x, as main's new svg does.
export { ctrlWheel, focus } from "../shared.mjs";
const COPY = "#chart-copying-network";
const MAP = "#chart-autocomplete-map";

export default [
  {
    name: "w5-K2-explore",
    url: "weeks/week05/",
    steps: [
      { hover: [`${COPY} [data-id]`, 0.5, 0.5], label: "copying: hover a node" },
      { snap: true },
      { click: `${COPY} [data-id]:nth-child(3)`, label: "copying: pin a node" },
      { snap: true },
      { hover: [`${COPY} [data-id]:nth-child(5)`, 0.5, 0.5], label: "copying: hover another node while pinned" },
      { snap: true },
      { evaluate: "focus", args: [`${MAP} .gv-hub`], label: "map: focus a hub" },
      { snap: true },
      { press: [null, "Enter"], label: "map: Enter pins the hub's group" },
      { snap: true },
      { press: [null, "Escape"], label: "map: Escape clears" },
      { snap: true },
      { click: `${MAP} .gv-legend button.gv-key`, label: "map: legend button" },
      { snap: true },
      { click: `${MAP} button[aria-label="Zoom in"]`, label: "map: zoom in" },
      { wait: 400 },
      { snap: true },
      { click: `${MAP} button[aria-label="Zoom out"]`, label: "map: zoom out" },
      { wait: 400 },
      { snap: true },
      { evaluate: "ctrlWheel", args: [`${MAP} svg`, -480], label: "map: ctrl wheel" },
      { snap: true },
      { drag: [`${MAP} svg`, [0.5, 0.5], [0.3, 0.4]], label: "map: drag pan" },
      { snap: true },
      { click: `${MAP} button[aria-label="Reset the zoom"]`, label: "map: reset" },
      { wait: 400 },
      { snap: true },
      { click: `${COPY} svg`, label: "copying: click the svg clears the pin" },
      { snap: true },
    ],
  },
  {
    name: "w5-K2-zoom-resize",
    url: "weeks/week05/",
    steps: [
      { scrollTo: MAP },
      { click: `${MAP} button[aria-label="Zoom in"]`, label: "map: zoom in" },
      { wait: 400 },
      { snap: true },
      { resize: [1100, 900], label: "map: a narrower window draws a new view" },
      { wait: 400 },
      { snap: true },
      { click: `${MAP} button[aria-label="Zoom in"]`, label: "map: zoom in starts from 1x" },
      { wait: 400 },
      { snap: true },
    ],
  },
];
