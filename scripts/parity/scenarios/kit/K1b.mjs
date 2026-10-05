// K1b: the kit page's demos that became islands (src/features/kit-page/).
// Opens the figure's table drawer; hovers the ECharts bar chart and every
// strip mark (both dots and both baseline bands); opens the term demo's two
// drawers before the term's pop-up can cover them, then hovers and clicks the
// term; resizes the window so the strip chart redraws at its parent's new
// width, then restores it.
const STRIP = '[data-demo="strip"] svg';

export default [
  {
    name: "kit-K1b",
    url: "styleguide/kit/",
    steps: [
      { click: '[data-demo="figure"] summary', label: "open the figure's table" },
      { snap: true },
      { hover: ['[data-demo="figure"] .kit-echart', 0.5, 0.7], label: "hover the bar chart" },
      { snap: true },
      { hover: [`${STRIP} > circle:nth-of-type(1)`, 0.5, 0.5], label: "hover the first dot" },
      { snap: true },
      { hover: [`${STRIP} > g:nth-of-type(1) > rect`, 0.5, 0.5], label: "hover the first band" },
      { snap: true },
      { hover: [`${STRIP} > circle:nth-of-type(2)`, 0.5, 0.5], label: "hover the second dot" },
      { snap: true },
      { hover: [`${STRIP} > g:nth-of-type(2) > rect`, 0.5, 0.5], label: "hover the second band" },
      { snap: true },
      { click: '[data-demo="term"] details:nth-of-type(1) summary', label: "open Method" },
      { click: '[data-demo="term"] details:nth-of-type(2) summary', label: "open More numbers" },
      { snap: true },
      { hover: ['[data-demo="term"] .w4-term button', 0.5, 0.5], label: "hover the term" },
      { snap: true },
      { click: '[data-demo="term"] .w4-term button', label: "click the term" },
      { snap: true },
      { resize: [1100, 900], label: "narrower window" },
      { snap: true },
      { resize: [1440, 900], label: "window back" },
      { snap: true },
    ],
  },
];
