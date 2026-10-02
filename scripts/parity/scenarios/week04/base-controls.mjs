// P0b base scenario for Week 4's controls. w4-radar-race: skills.json delayed
// 6 s before #cut-skills opens, so the radar's 5 s fallback mounts it and
// skills' replaceChildren then wipes it (KB08; on main the radar is gone).
// w4-controls, at normal timing: the catalogue and toc links, the radar search
// and chips, PageRank's damping buttons and the entity explorer (entity
// buttons, colour select, a legend button, reset). The methods, roles, years
// and term steps are in base-controls-b.mjs and the scrollTo over each .topnav
// target in base-hash.mjs, so each file runs well inside the time limit.

export default [
  {
    name: "w4-radar-race",
    url: "weeks/week04/",
    steps: [
      { route: ["**/weeks/week04/data/skills.json*", { delay: 6000 }], label: "delay skills.json 6 s" },
      { click: 'a[data-target="cut-skills-radar"]', label: "open #cut-skills" },
      { wait: 7000, label: "past the delay" },
      { snap: true, label: "after the radar race" },
    ],
  },
  {
    name: "w4-controls",
    url: "weeks/week04/",
    steps: [
      { click: 'a[data-target="cut-skills-radar"]', label: "catalogue link to the radar" },
      { snap: true },
      { type: ["#w4-radar-search", "Data Scientists"] },
      { press: ["#w4-radar-search", "Enter"], label: "radar search" },
      { snap: true },
      { click: "#w4-radar-group-knowledge", label: "radar chip knowledge" },
      { snap: true },
      { click: '#topic-jobs nav.rx-toc a[href="#cut-pagerank"]', label: "toc link to PageRank" },
      { snap: true },
      { click: '#cut-pagerank [data-d="0.5"]', label: "damping 0.5" },
      { snap: true },
      { hash: "#entity-communities" },
      // touched.mjs and capture.mjs run steps without the snapshot's settle.
      { evaluate: "waitFor", args: ["#entity-communities li > button"], label: "wait for the explorer's legend" },
      { click: '#entity-communities [data-entity="companies"]', label: "entity companies" },
      // Laying out the companies can hold the main thread for seconds when
      // the machine is busy; wait until show() has pressed the button.
      { evaluate: "waitFor", args: ['#entity-communities [data-entity="companies"][aria-pressed="true"]'] },
      { select: [".w4-entities-colour select", "sector"], label: "colour by sector" },
      { snap: true },
      { click: "#entity-communities li > button >> nth=0", label: "first legend button" },
      { snap: true },
      { click: ".w4-entities-reset", label: "entities reset" },
    ],
  },
];
