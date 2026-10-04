// P0b base scenario for Week 2 (transit.js, ride.mjs, cabinet.js): every line
// chip hovered and clicked, the route planner, the closure challenge and the
// restore button. Controls inside closed <details> are reached by opening each
// summary first.
const evidence = 'summary:has-text("Explore the explanations & evidence")';
const LINES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 0];

export default [
  {
    name: "w2-lines",
    url: "weeks/week02/",
    steps: [
      { click: evidence },
      { click: 'summary:has-text("Explore the 16-station interchange map")' },
      // Hover first (mouseenter draws the hover line), then click with the
      // pointer still on the chip, so each snapshot holds both states.
      ...LINES.flatMap((n) => [
        { hover: [`#line-chips button[data-line="${n}"]`, 0.5, 0.5] },
        { click: `#line-chips button[data-line="${n}"]`, label: `line ${n}` },
        { snap: true },
      ]),
    ],
  },
  {
    name: "w2-closure",
    url: "weeks/week02/",
    steps: [
      { click: evidence },
      { click: 'summary:has-text("Plan a route through all 303 articles")' },
      { click: "#route-form button", label: "route submit" },
      { snap: true },
      { click: "#route-isolate" },
      { snap: true },
      { click: "#route-island" },
      { snap: true },
      { select: ["#closure-select", "Hulk"], label: "closure Hulk" },
      { snap: true },
      { click: 'summary:has-text("Predict the total disruption instead")' },
      { click: ".skip-prediction", label: "Just show me" },
      { snap: true },
      { click: "#restore-service" },
      { snap: true },
      { click: "#compare-station" },
      { snap: true },
      { reload: true },
    ],
  },
];
