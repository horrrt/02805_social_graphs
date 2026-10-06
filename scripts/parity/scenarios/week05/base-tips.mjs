// P0b base scenario for Week 5's hover tips (tips.js hoverTips on every
// [id^="chart-"] host): the first [data-tip] of each host that has one,
// hovered in turn, then a window resize. chart-relations-map,
// chart-autocomplete-map, chart-heaps-curve and chart-fame-scatter carry no
// [data-tip] on main. The modularity chart sits in a closed drawer.
const HOSTS = [
  "chart-hero-fame",
  "chart-relations-crossing",
  "chart-copying-linked",
  "chart-copying-network",
  "chart-autocomplete-modularity",
  "chart-heaps-gap",
  "chart-weird-scatter",
];

export default [
  {
    name: "w5-tips",
    url: "weeks/week05/",
    steps: [
      { click: "details.rx-drawer:has(#chart-autocomplete-modularity) > summary", label: "open the modularity drawer" },
      ...HOSTS.flatMap((id) => [{ hover: [`#${id} [data-tip]`, 0.5, 0.5], label: `hover ${id}` }, { snap: true }]),
      { resize: [1280, 800] },
      { snap: true, label: "after resize" },
    ],
  },
];
