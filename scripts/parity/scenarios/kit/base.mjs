// P0b base scenario for the kit page (pages/kit.js, kit.js, graph.js): the
// glossary term, a hub ring, the movable karate nodes (click and Enter),
// Ctrl + wheel and a drag over a network, Escape and a legend click. The kit's
// networks are not explore views, so main draws no zoom or legend buttons;
// those steps are absent.
const KARATE = '[data-demo="net-karate"] [data-movable]';

export default [
  {
    name: "kit-base",
    url: "styleguide/kit/",
    steps: [
      { hover: [".w4-term button", 0.5, 0.5], label: "term hover" },
      { snap: true },
      { click: '[data-demo="net-hubs"] .gv-hub', label: "hub click" },
      { snap: true },
      { click: `${KARATE}[data-id="0"]`, label: "move node 0" },
      { snap: true },
      { evaluate: "focus", args: [`${KARATE}[data-id="9"]`] },
      { press: [null, "Enter"], label: "Enter on node 9" },
      { snap: true },
      { evaluate: "ctrlWheel", args: ['[data-demo="net-hubs"] svg', -240], label: "ctrl wheel on hubs" },
      { snap: true },
      { drag: ['[data-demo="net-hubs"] svg', [0.5, 0.5], [0.3, 0.4]], label: "drag hubs" },
      { snap: true },
      { press: [null, "Escape"] },
      { snap: true },
      { click: '[data-demo="net-hubs"] .gv-legend > span', label: "legend click" },
      { snap: true },
    ],
  },
];
