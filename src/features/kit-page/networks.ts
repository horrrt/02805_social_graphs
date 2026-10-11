// The kit page's eight network demos, as src/scripts/pages/kit.js drew them
// from public/styleguide/data/graphs.json: real data laid out by
// analysis/styleguide_graphs.py, and one toy.
import type { NetLink, NetNode, NetworkSpec } from "@/kit";

type Graph = { ratio: number; nodes: NetNode[]; links: NetLink[]; groups: string[]; hubs?: string[]; highlight?: NetworkSpec["highlight"] };
export type Graphs = { marvel: Graph; pair: Graph; karate: Graph; overlap: Graph };

export const GRAPHS = "styleguide/data/graphs.json";

const dark = { theme: "dark" } as const;

const karate = (k: Graph): NetworkSpec => ({
  ratio: k.ratio, nodes: k.nodes, links: k.links, groups: k.groups, labels: "inside", badges: true, movable: true, legend: true,
  note: "Click any member to move them to the next group.", aria: "Zachary's karate club, 34 members, coloured by the club each joined",
});

export const NETWORKS = {
  "net-hubs": ({ marvel: m }: Graphs): NetworkSpec => ({ ...dark, ratio: m.ratio, nodes: m.nodes, links: m.links, groups: m.groups, hubs: m.hubs, legend: true,
    noneLabel: "Morituri and the isolates", aria: "The Marvel pages coloured by community, with each community's hub named" }),
  "net-links": ({ marvel: m }: Graphs): NetworkSpec => ({ ...dark, ratio: m.ratio, nodes: m.nodes, links: m.links, colorNodes: false, colorLinks: true, fade: true,
    aria: "The Marvel links, each in its community's colour, over the rest of the network" }),
  "net-both": ({ marvel: m }: Graphs): NetworkSpec => ({ ...dark, ratio: m.ratio, nodes: m.nodes, links: m.links, groups: m.groups, colorLinks: true, hubs: m.hubs,
    aria: "The Marvel pages and links coloured by community, with each community's hub named" }),
  "net-weight": ({ pair: p }: Graphs): NetworkSpec => ({ ...dark, ratio: p.ratio, nodes: p.nodes, links: p.links, groups: p.groups, colorNodes: false, weights: true,
    highlight: p.highlight, note: `${p.groups[0]} and ${p.groups[1]} groups. Weight: links from either page to the other.`,
    aria: "Two Marvel communities; the heaviest link between them is marked with its weight" }),
  "net-karate": ({ karate: k }: Graphs): NetworkSpec => ({ ...dark, ...karate(k) }),
  "net-overlap": ({ overlap: o }: Graphs): NetworkSpec => ({ ...dark, ratio: o.ratio, nodes: o.nodes, links: o.links, groups: o.groups, labels: "inside", hollow: true,
    colorLinks: true, legend: true, noneLabel: "In no group", note: "Toy example: E belongs to both groups, K to neither.",
    aria: "Toy network: two groups share node E; node K is in no group" }),
  "net-hubs-light": ({ marvel: m }: Graphs): NetworkSpec => ({ ratio: m.ratio, nodes: m.nodes, links: m.links, groups: m.groups, hubs: m.hubs, legend: true,
    noneLabel: "Morituri and the isolates", aria: "The Marvel pages coloured by community, light card" }),
  "net-karate-light": ({ karate: k }: Graphs): NetworkSpec => karate(k),
};

export type NetworkDemo = keyof typeof NETWORKS;
