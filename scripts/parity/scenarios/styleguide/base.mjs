// P0b base scenario for the styleguide (pages/styleguide.js): the URL style
// parameters, the style bar opened from #style-trigger, each select (written
// to the URL with replaceState), a click inside the bar (it stays open) and an
// outside click (it closes).
export default [
  {
    name: "sg-style",
    url: "styleguide/?skin=terminal&palette=iris&tables=cards",
    steps: [
      { snap: true, label: "loaded with params" },
      { click: "#style-trigger" },
      { snap: true, label: "bar open" },
      { click: '#style-bar summary:has-text("More options")', label: "click inside the bar" },
      { snap: true },
      { select: ["#style-skin", "poster"] },
      { snap: true },
      { select: ["#style-palette", "okabe"] },
      { snap: true },
      { select: ["#style-tables", "zebra"] },
      { snap: true },
      { click: "#hero", label: "outside click" },
      { snap: true },
    ],
  },
];
