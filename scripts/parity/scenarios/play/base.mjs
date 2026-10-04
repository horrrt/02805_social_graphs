// P0b base scenario for the Baymax play page (signal.js): both missions (the
// wrong edit first, then the right one, the return link), every replay button
// and the restart.
export default [
  {
    name: "play-missions",
    url: "play/",
    steps: [
      { click: '[data-edit="out"]', label: "mission 1 wrong page" },
      { snap: true },
      { click: '[data-edit="in"]', label: "mission 1 right page" },
      { snap: true },
      { click: "#next-mission" },
      { snap: true, label: "mission 2" },
      { click: "#add-return" },
      { snap: true, label: "both missions complete" },
      { click: '[data-replay="snapshot"]' },
      { snap: true },
      { click: '[data-replay="out"]' },
      { snap: true },
      { click: '[data-replay="in"]' },
      { snap: true },
      { click: '[data-replay="both"]' },
      { snap: true },
      { click: "#restart-mission" },
      { snap: true, label: "restarted" },
    ],
  },
];
