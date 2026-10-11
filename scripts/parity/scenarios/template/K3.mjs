// K3: the template's charts, now islands (src/features/template/). Hovers
// both findings minis and every mark of the section 1 strip chart (both dots
// and both baseline bands); opens section 1's drawer with the passage and
// section 2's two drawers; hovers and clicks the term; moves two members of
// the section 2 network, then narrows the window so every chart redraws at
// its parent's new width (the network from its moved groups, KB21), moves a
// member again and restores the width.
export { focus } from "../shared.mjs";
const STRIP = "#chart-first svg";
const MOVABLE = "#chart-second-left [data-movable]";

export default [
  {
    name: "tpl-K3",
    url: "weeks/_template/",
    steps: [
      { hover: ['[data-finding="1"] svg circle', 0.5, 0.5], label: "hover the first mini's dot" },
      { snap: true },
      { hover: ['[data-finding="1"] svg rect', 0.5, 0.5], label: "hover the first mini's band" },
      { snap: true },
      { hover: ['[data-finding="2"] svg circle', 0.5, 0.5], label: "hover the second mini's dot" },
      { snap: true },
      { hover: [`${STRIP} > circle:nth-of-type(1)`, 0.5, 0.5], label: "hover the first dot" },
      { snap: true },
      { hover: [`${STRIP} > g:nth-of-type(1) > rect`, 0.5, 0.5], label: "hover the first band" },
      { snap: true },
      { hover: [`${STRIP} > circle:nth-of-type(2)`, 0.5, 0.5], label: "hover the second dot" },
      { snap: true },
      { hover: [`${STRIP} > g:nth-of-type(2) > rect`, 0.5, 0.5], label: "hover the second band" },
      { snap: true },
      { click: "#first details:has(#first-checked) > summary", label: "open the passage's drawer" },
      { snap: true },
      { click: "#second details:nth-of-type(1) > summary", label: "open section 2's Method" },
      { click: "#second details:has(#second-checked) > summary", label: "open section 2's reading" },
      { snap: true },
      { hover: ["#second-did .w4-term button", 0.5, 0.5], label: "hover the term" },
      { snap: true },
      { click: "#second-did .w4-term button", label: "click the term" },
      { snap: true },
      { hover: ["#chart-second-right table", 0.5, 0.5], label: "hover the table" },
      { snap: true },
      { click: `${MOVABLE}[data-id="0"]`, label: "move member 0" },
      { snap: true },
      { evaluate: "focus", args: [`${MOVABLE}[data-id="33"]`] },
      { press: [null, "Space"], label: "Space on member 33" },
      { snap: true },
      { resize: [1100, 900], label: "narrower window" },
      { snap: true },
      { click: `${MOVABLE}[data-id="5"]`, label: "move member 5" },
      { snap: true },
      { resize: [1440, 900], label: "window back" },
      { snap: true },
    ],
  },
];
