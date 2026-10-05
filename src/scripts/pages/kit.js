// Page script for /styleguide/kit/ (from styleguide/kit.html), moved out of the page's inline <script type="module">.
// The figure, strip, table, concordance, passage and term demos are islands in src/features/kit-page/.
import { loadData, networkView } from "../kit.js";
import { asset } from "../site.js";

const at = (name) => document.querySelector(`[data-demo="${name}"]`);

// Network views, from public/styleguide/data/graphs.json.
const g = await loadData(asset("styleguide/data/graphs.json"));
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
