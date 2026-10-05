// K2: the kit page's eight network demos, now NetworkView islands. Hovers a
// hub ring and a node; hovers two weight links (main redraws the chart only
// until its parent is measured, so the hover shows once the width changes);
// moves light-card karate members by click, Enter and Space, and the same
// member twice; clicks a hub and a legend entry, zooms with Ctrl + wheel,
// drags and presses Escape; then narrows the window so every network redraws
// from its moved groups and hovered link, moves a member again and restores
// the width. The kit's networks are not explore views, so main draws no zoom
// buttons and no legend buttons; those steps are absent.
const LIGHT = '[data-demo="net-karate-light"] [data-movable]';
const HITS = '[data-demo="net-weight"] svg > g > g:first-child > line';

export default [
  {
    name: "kit-K2",
    url: "styleguide/kit/",
    steps: [
      { hover: ['[data-demo="net-both"] .gv-hub', 0.5, 0.5], label: "hover a hub ring" },
      { snap: true },
      { hover: ['[data-demo="net-overlap"] [data-id="E"]', 0.5, 0.5], label: "hover a split node" },
      { snap: true },
      { hover: [`${HITS}:nth-of-type(2)`, 0.5, 0.5], label: "hover the first weight link" },
      { snap: true },
      { hover: [`${HITS}:nth-of-type(20)`, 0.5, 0.5], label: "hover the tenth weight link" },
      { snap: true },
      { click: `${LIGHT}[data-id="0"]`, label: "move member 0" },
      { snap: true },
      { click: `${LIGHT}[data-id="0"]`, label: "move member 0 again" },
      { snap: true },
      { evaluate: "focus", args: [`${LIGHT}[data-id="33"]`] },
      { press: [null, "Enter"], label: "Enter on member 33" },
      { snap: true },
      { evaluate: "focus", args: [`${LIGHT}[data-id="16"]`] },
      { press: [null, "Space"], label: "Space on member 16" },
      { snap: true },
      { click: '[data-demo="net-hubs-light"] .gv-hub', label: "hub click" },
      { snap: true },
      { click: '[data-demo="net-karate-light"] .gv-legend > span', label: "legend click" },
      { snap: true },
      { evaluate: "ctrlWheel", args: ['[data-demo="net-overlap"] svg', -240], label: "ctrl wheel on overlap" },
      { snap: true },
      { drag: ['[data-demo="net-weight"] svg', [0.5, 0.5], [0.3, 0.4]], label: "drag weight" },
      { snap: true },
      { press: [null, "Escape"] },
      { snap: true },
      { resize: [1100, 900], label: "narrower window" },
      { snap: true },
      { click: `${LIGHT}[data-id="5"]`, label: "move member 5" },
      { snap: true },
      { resize: [1440, 900], label: "window back" },
      { snap: true },
    ],
  },
];
