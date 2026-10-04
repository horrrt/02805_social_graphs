// P0b base scenario for the screen-test prototype (pages/screen-test.js): the
// three candidate (cast) buttons, every CCDF key, the shuffle rig run to the
// end (it animates by requestAnimationFrame; 3 s covers it) and its reset, the
// paradox draw buttons and the stats toggle.
export default [
  {
    name: "st-base",
    url: "prototypes/screen-test/",
    steps: [
      { click: "#cast button:nth-child(1)", label: "cast er" },
      { snap: true },
      { click: "#cast button:nth-child(2)", label: "cast ws" },
      { snap: true },
      { click: "#cast button:nth-child(3)", label: "cast ba" },
      { snap: true },
      { click: "#ccdf-keys button:nth-child(1)", label: "ccdf marvel" },
      { click: "#ccdf-keys button:nth-child(2)", label: "ccdf er" },
      { snap: true },
      { click: "#ccdf-keys button:nth-child(3)", label: "ccdf ws" },
      { click: "#ccdf-keys button:nth-child(4)", label: "ccdf ba" },
      { snap: true },
      { click: "#ccdf-keys button:nth-child(2)", label: "ccdf er back" },
      { snap: true },
      { click: "#rig-run" },
      { wait: 3000 },
      { snap: true, label: "rig run done" },
      { click: "#rig-reset" },
      { snap: true },
      { click: "#draw-one" },
      { snap: true },
      { click: "#draw-many" },
      { snap: true },
      { click: "#draw-reset" },
      { snap: true },
      { click: '#stats-toggle button[data-mode="plain"]' },
      { snap: true },
      { click: '#stats-toggle button[data-mode="full"]' },
      { snap: true },
    ],
  },
];
