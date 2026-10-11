// P0b base scenario for Week 3's style bar (week03-boot.js). w3-style: the URL
// style parameters, #style-trigger, a click inside the open #style-bar (it
// stays open), a select that repaints in place (replaceState), Escape, and a
// renderer chip that reloads the page with the scroll position carried in
// sessionStorage. w3-style-abort: ?variant=d3 with the vendored d3 aborted, so
// boot() writes the fallback sentence into #status and falls back to canvas
// (body data-variant), then a non-reload style change rewrites the URL and the
// body attributes.
export default [
  {
    name: "w3-style",
    url: "weeks/week03/?palette=okabe&arcs=flow&basemap=outline&tables=zebra",
    steps: [
      { snap: true, label: "loaded with params" },
      { click: "#style-trigger" },
      { snap: true, label: "bar open" },
      { click: '#style-bar summary:has-text("More options")', label: "click inside the bar" },
      { snap: true, label: "bar stays open" },
      { select: ["#style-palette", "iris"], label: "palette iris (no reload)" },
      { snap: true },
      { press: [null, "Escape"] },
      { snap: true, label: "after Escape" },
      { scrollTo: "#hist", label: "scroll down to the histogram" },
      { click: "#style-trigger" },
      { click: '#style-bar .style-chip[data-value="d3"]', label: "renderer d3 (reloads)" },
      { wait: 4000 },
      { snap: true, label: "reloaded as d3, scroll restored" },
    ],
  },
  {
    name: "w3-style-abort",
    url: "weeks/week03/?variant=d3",
    steps: [
      { route: ["**/assets/vendor/d3-7.9.0.min.js*", "abort"], label: "abort the vendored d3" },
      { reload: true },
      { snap: true, label: "fallback to canvas" },
      { click: "#style-trigger" },
      { click: '#style-bar summary:has-text("More options")' },
      { select: ["#style-palette", "ember"], label: "palette ember (no reload)" },
      { snap: true, label: "style change after the fallback" },
    ],
  },
];
