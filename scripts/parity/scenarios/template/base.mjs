// P0b base scenario for the week template (week-template.js, kit.js,
// graph.js): the glossary term, the movable karate nodes (click and Enter),
// Ctrl + wheel and a drag over a network, Escape and a legend click. The
// template's networks are not explore views, so main draws no hub buttons,
// zoom buttons or legend buttons there; those steps are absent.
const MOVABLE = "#chart-second-left [data-movable]";

export default [
  {
    name: "tpl-base",
    url: "weeks/_template/",
    steps: [
      { hover: [".w4-term button", 0.5, 0.5], label: "term hover" },
      { snap: true },
      { click: `${MOVABLE}[data-id="0"]`, label: "move node 0" },
      { snap: true },
      { evaluate: "focus", args: [`${MOVABLE}[data-id="9"]`] },
      { press: [null, "Enter"], label: "Enter on node 9" },
      { snap: true },
      { evaluate: "ctrlWheel", args: ["#chart-hero svg", -240], label: "ctrl wheel on hero" },
      { snap: true },
      { drag: ["#chart-hero svg", [0.5, 0.5], [0.3, 0.4]], label: "drag hero" },
      { snap: true },
      { press: [null, "Escape"] },
      { snap: true },
      { click: "#chart-hero .gv-legend > span", label: "legend click" },
      { snap: true },
    ],
  },
];
