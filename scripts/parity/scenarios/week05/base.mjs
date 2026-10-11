// P0b base scenario for Week 5 (week05-*.js, tips.js, kit.js): every runtime
// glossary term hovered, the relations map switch, the search box ('storm'
// typed, then a second query), and the autocomplete quiz: pick, lock and
// reveal, next, an empty lock, previous (the locked select is disabled; the
// snapshot compares select.disabled). faults.mjs --data runs this file.
const TERMS = [
  "w5-term-relations-communities",
  "w5-term-copying-house",
  "w5-term-search-bow",
  "w5-term-search-cosine",
  "w5-term-search-stop",
  "w5-term-autocomplete-trigram",
  "w5-term-heaps-random",
  "w5-term-heaps-tokens",
  "w5-term-heaps-types",
  "w5-term-fame-indegree",
  "w5-term-weird-mattr",
];

export default [
  {
    name: "w5-base",
    url: "weeks/week05/",
    steps: [
      ...TERMS.flatMap((id) => [{ hover: [`[aria-describedby="${id}"]`, 0.5, 0.5], label: `term ${id}` }, { snap: true }]),
      { click: '#relations-map-kind [data-kind="family"]', label: "map family" },
      { snap: true },
      { click: '#relations-map-kind [data-kind="enemy"]', label: "map enemy" },
      { snap: true },
      { press: ["#search-input", "ControlOrMeta+a"] },
      { press: ["#search-input", "Backspace"] },
      { type: ["#search-input", "storm"] },
      { press: ["#search-input", "Enter"], label: "search storm" },
      { snap: true },
      { press: ["#search-input", "ControlOrMeta+a"] },
      { type: ["#search-input", "god of thunder"] },
      { click: "#search-run", label: "search second query" },
      { snap: true },
      { select: ["#ac-select", "2"], label: "autocomplete pick" },
      { snap: true },
      { click: "#ac-submit", label: "lock and reveal" },
      { snap: true },
      { click: "#ac-next" },
      { snap: true },
      { click: "#ac-submit", label: "lock with no pick" },
      { snap: true },
      { click: "#ac-prev", label: "back to the locked fake" },
      { snap: true },
    ],
  },
];
