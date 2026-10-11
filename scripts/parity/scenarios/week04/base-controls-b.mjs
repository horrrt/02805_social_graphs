// P0b base scenario for Week 4's controls, part b (part a is
// base-controls.mjs): the methods tabs and their controls, the roles and
// years cards, and the first .w4-term button (click, second click, outside
// click, Escape).
const TERM = ".w4-term > button >> nth=0";

export default [
  {
    name: "w4-controls-b",
    url: "weeks/week04/",
    steps: [
      { hash: "#cut-methods" },
      { click: '#w4m-panel-gn [data-act="step"]', label: "GN step" },
      { snap: true },
      // "Shuffle the labels" draws from Math.random, whose seeded sequence
      // other modules consume a timing-dependent number of times on main; its
      // result is nondeterministic there, so the scenario presses the two
      // deterministic modularity controls instead.
      { click: "#w4m-tab-mod" },
      { click: '#w4m-panel-mod [data-act="one"]', label: "modularity everyone in one group" },
      { snap: true },
      { click: '#w4m-panel-mod [data-act="reset"]', label: "modularity Louvain's groups" },
      { snap: true },
      { click: "#w4m-tab-louvain" },
      { click: '#w4m-panel-louvain [data-act="step"]', label: "Louvain step" },
      { snap: true },
      { click: "#w4m-tab-overlap" },
      { click: '#w4m-overlap-modes [data-mode="k4"]', label: "overlap k = 4" },
      { snap: true },
      { hash: "#cut-roles" },
      { click: '[data-roles-split="groups"]' },
      { click: '[data-roles-scale="percent"]' },
      { click: '[data-roles-window="oct_jun"]', label: "roles groups, 100%, Oct to Jun" },
      { snap: true },
      { hash: "#cut-years" },
      { click: TERM, label: "first term click" },
      { snap: true },
      { click: TERM, label: "first term second click" },
      { snap: true },
      { click: TERM, label: "first term again" },
      { click: "#opening h2 >> nth=0", label: "outside click" },
      { snap: true },
      { click: TERM, label: "first term once more" },
      { press: [null, "Escape"] },
      { snap: true, label: "after Escape" },
    ],
  },
];
