// P0b base scenario for Week 1 (packs.js, cabinet.js): the pack machine, the
// prediction, the collection browser, the charts and the sketch.
// Controls inside closed <details> are reached by opening each summary first.
const evidence = 'summary:has-text("Explore the explanations & evidence")';

export default [
  {
    name: "w1-packs",
    url: "weeks/week01/",
    steps: [
      { click: "#open-pack", label: "open pack 1" },
      { snap: true },
      { click: "#open-pack", label: "open pack 2" },
      { snap: true },
      { click: "#open-pack", label: "open pack 3" },
      { snap: true },
      { reload: true },
      { snap: true, label: "after reload" },
      { click: "#compare-packs" },
      { select: ["#compare-packs", "100"] },
      { snap: true },
      { click: 'summary:has-text("Change or restart the draw")' },
      { press: ["#pack-seed", "ControlOrMeta+a"] },
      { type: ["#pack-seed", "42"] },
      { press: ["#pack-seed", "Tab"], label: "seed change" },
      { snap: true },
      { click: "#open-pack", label: "open pack with seed 42" },
      { snap: true },
    ],
  },
  {
    name: "w1-evidence",
    url: "weeks/week01/",
    steps: [
      { click: evidence },
      { click: 'summary:has-text("Try estimating the number of packs")' },
      { press: ["#guess-w1-packs", "ControlOrMeta+a"] },
      { type: ["#guess-w1-packs", "1500"] },
      { snap: true, label: "prediction typed" },
      { click: '.guess-form:has(#guess-w1-packs) button[type=submit]', label: "prediction submitted" },
      { snap: true },
      { click: 'summary:has-text("Browse all 303 cards")' },
      { select: ["#collection-filter", "missing"] },
      { snap: true, label: "filter missing" },
      { type: ["#collection-search", "man"] },
      { snap: true, label: "search man" },
      { click: "#more-cards" },
      { snap: true, label: "more cards" },
      { click: 'summary:has-text("How uneven are the links?")' },
      { select: ["#degree-scale", "log"] },
      { snap: true, label: "degree scale log" },
      { click: 'summary:has-text("Sketch your own distribution")' },
      { drag: ["#sketch-chart", [0.2, 0.3], [0.8, 0.8]] },
      { snap: true, label: "sketch drawn" },
      { click: "#compare-sketch" },
      { snap: true, label: "sketch compared" },
    ],
  },
];
