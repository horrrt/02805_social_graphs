// P0b base scenario for Week 4's place charts (week04-place.js,
// week04-frame.js segments): two clicks on the hero map's data items, the
// metric and region switches, the backbone's α segmented control by click and
// by ArrowRight, Home and End, and the long-haul employer select.
export default [
  {
    name: "w4-place",
    url: "weeks/week04/",
    steps: [
      { evaluate: "echartsClick", args: ["chart-hero-map", 0, 0], label: "hero map item 0" },
      { snap: true },
      { evaluate: "echartsClick", args: ["chart-hero-map", 0, 5], label: "hero map item 5" },
      { snap: true },
      { click: '[data-place-metric="employers"]' },
      { snap: true },
      { click: '[data-place-metric="positions"]' },
      { snap: true },
      { click: 'summary:has-text("Maps: groups and Census regions")' },
      { click: '[data-place-region="census"]' },
      { snap: true },
      { click: '[data-place-region="communities"]' },
      { snap: true },
      { click: 'a.rx-tcard-head[href="#topic-where"]', label: "open topic-where (backbone panel)" },
      { click: '#place-alpha button[data-alpha="0.1"]', label: "alpha 0.1" },
      { snap: true },
      { press: ['#place-alpha button[data-alpha="0.1"]', "ArrowRight"], label: "alpha ArrowRight" },
      { snap: true },
      { press: [null, "Home"], label: "alpha Home" },
      { snap: true },
      { press: [null, "End"], label: "alpha End" },
      { snap: true },
      { click: '#topic-where nav.rx-toc a[href="#place-longhaul"]', label: "open the employers panel" },
      { select: ["#place-employer", "Amazon"], label: "employer Amazon" },
      { snap: true },
    ],
  },
];
