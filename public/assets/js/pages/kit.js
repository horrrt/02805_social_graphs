// Page script for /styleguide/, moved out of the page's inline <script type="module">.
import { concordance, drawer, drawerRow, echart, figure, loadData, networkView, passage, stripChart, table, termify } from "../kit.js?v=5";

const at = (name) => document.querySelector(`[data-demo="${name}"]`);
const toy = [
  { word: "the", count: 900 },
  { word: "of", count: 520 },
  { word: "marvel", count: 310 },
  { word: "comics", count: 280 },
  { word: "power", count: 90 },
];

figure(at("figure"), {
  chart: (el) =>
    echart(el, {
      xAxis: { type: "category", data: toy.map((r) => r.word), name: "word" },
      yAxis: { type: "value", name: "count (toy)" },
      series: [{ type: "bar", data: toy.map((r) => r.count), label: { show: true, position: "top" } }],
    }, { height: 280 }),
  caption: "Toy counts. Each bar is one word; taller bars are more frequent.",
  data: { columns: [{ key: "word", label: "Word" }, { key: "count", label: "Count", num: true }], rows: toy },
});

at("strip").append(
  stripChart(
    [
      { label: "Toy result", real: 0.62, realLabel: "0.62", base: [0.41, 0.03], baseLabel: "toy baseline 0.41 ± 0.03" },
      { label: "Second toy row", real: 0.2, realLabel: "0.20", base: [0.22, 0.05], baseLabel: "0.22 ± 0.05" },
    ],
    { domain: [0, 1], ticks: [0, 0.5, 1], fmt: (v) => v.toFixed(1), aria: "Toy strip chart: two results against their baselines" },
  ),
);

at("table").append(
  table({
    caption: "Toy table",
    columns: [{ key: "word", label: "Word" }, { key: "count", label: "Count", num: true }],
    rows: toy,
  }),
);

at("kwic").append(
  concordance(
    [
      { page: "Thor_(Marvel_Comics)", left: "toy text before the word ", hit: "power", right: " toy text after the word" },
      { page: "Storm_(Marvel_Comics)", left: "another made-up left context ", hit: "power", right: " and a right context" },
    ],
    { caption: "Toy concordance for power" },
  ),
);

at("passage").append(
  passage({ page: "Thor_(Marvel_Comics)", text: "Toy passage: a made-up sentence that mentions power twice, power.", highlight: "power" }),
);

const term = at("term");
termify(term.querySelector("p"), "hapax", "A type observed exactly once in the corpus.", "kit-term-hapax");
term.append(drawerRow(drawer("Method", "<p>Toy drawer body.</p>"), drawer("More numbers", "<p>Another toy drawer.</p>")));

// Network views, from docs/styleguide/data/graphs.json.
const g = await loadData(new URL("../data/graphs.json?v=1", location.href));
const m = g.marvel;
const dark = { theme: "dark" };
networkView(at("net-hubs"), { ...dark, ratio: m.ratio, nodes: m.nodes, links: m.links, groups: m.groups, hubs: m.hubs, legend: true,
  noneLabel: "Morituri and the isolates", aria: "The Marvel pages coloured by community, with each community's hub named" });
networkView(at("net-links"), { ...dark, ratio: m.ratio, nodes: m.nodes, links: m.links, colorNodes: false, colorLinks: true, fade: true,
  aria: "The Marvel links, each in its community's colour, over the rest of the network" });
networkView(at("net-both"), { ...dark, ratio: m.ratio, nodes: m.nodes, links: m.links, groups: m.groups, colorLinks: true, hubs: m.hubs,
  aria: "The Marvel pages and links coloured by community, with each community's hub named" });
const p = g.pair;
networkView(at("net-weight"), { ...dark, ratio: p.ratio, nodes: p.nodes, links: p.links, groups: p.groups, colorNodes: false, weights: true,
  highlight: p.highlight, note: `${p.groups[0]} and ${p.groups[1]} groups. Weight: links from either page to the other.`,
  aria: "Two Marvel communities; the heaviest link between them is marked with its weight" });
const k = g.karate;
const karate = { ratio: k.ratio, nodes: k.nodes, links: k.links, groups: k.groups, labels: "inside", badges: true, movable: true, legend: true,
  note: "Click any member to move them to the next group.", aria: "Zachary's karate club, 34 members, coloured by the club each joined" };
networkView(at("net-karate"), { ...dark, ...karate });
const o = g.overlap;
networkView(at("net-overlap"), { ...dark, ratio: o.ratio, nodes: o.nodes, links: o.links, groups: o.groups, labels: "inside", hollow: true,
  colorLinks: true, legend: true, noneLabel: "In no group", note: "Toy example: E belongs to both groups, K to neither.",
  aria: "Toy network: two groups share node E; node K is in no group" });
networkView(at("net-hubs-light"), { ratio: m.ratio, nodes: m.nodes, links: m.links, groups: m.groups, hubs: m.hubs, legend: true,
  noneLabel: "Morituri and the isolates", aria: "The Marvel pages coloured by community, light card" });
networkView(at("net-karate-light"), karate);
