// P0b base scenario for the mockups review page (mockups.js): every filter, a
// favourite (localStorage), a reload, the ?collection= parameter, the viewer
// opened by #mockup-5, ArrowRight and Escape inside it, and the clipboard copy.
const FILTERS = ["all", "data-stories", "disney", "netflix", "marvel", "comedy", "ux", "reference", "original", "saved"];

export default [
  {
    name: "mk-filters",
    url: "mockups/",
    steps: [
      ...FILTERS.flatMap((f) => [{ click: `[data-filter="${f}"]`, label: `filter ${f}` }, { snap: true }]),
      { click: '[data-filter="all"]' },
      { click: '[data-favourite="5"]', label: "favourite 5" },
      { snap: true },
      { reload: true },
      { snap: true, label: "after reload" },
    ],
  },
  {
    name: "mk-viewer",
    url: "mockups/?collection=marvel",
    steps: [
      { snap: true, label: "collection marvel" },
      { hash: "#mockup-5" },
      { press: [null, "ArrowRight"] },
      { snap: true, label: "ArrowRight" },
      { press: [null, "Escape"] },
      { snap: true, label: "Escape" },
      { click: "[data-favourite]:visible", label: "favourite the marvel mockup" },
      { click: "#copy-shortlist" },
      { snap: true, label: "copied" },
    ],
  },
];
