// Week 5 · the Marvel map that sections 1 and 4 share: one layout and one
// colour per consensus community (section 4), from docs/weeks/week05/data/network.json,
// written by analysis/week05_network.py and drawn with networkView().
//
// Section 4 is still collecting other groups' guesses about the communities, so
// only the eight hubs, the quiz's options, are named; no other node has a tooltip.

import { loadData, networkView } from "./kit.js?v=1";

let loading;

/** network.json, fetched once for both sections. */
export function loadNetwork() {
  loading ??= loadData(new URL("../../weeks/week05/data/network.json?v=1", import.meta.url));
  return loading;
}

/**
 * Draw the map into host. `mark` names a relation from section 1 ("enemy",
 * "family", ...): its pairs draw in ink over the faded rest. Other options pass
 * through to networkView().
 */
export function marvelMap(host, net, { mark, ...opts } = {}) {
  const hub = new Map(net.hubs.map((h) => [String(h.node), h.label]));
  const marked = new Set((mark ? net.relations[mark].pairs : []).map(([i, j]) => `${i}|${j}`));
  return networkView(host, {
    ratio: net.ratio,
    nodes: net.nodes.map((n, i) => ({ id: String(i), x: n.x, y: n.y, group: n.group, label: hub.get(String(i)) })),
    links: net.links.map(([i, j, weight, group]) => ({ source: String(i), target: String(j), weight, group, mark: marked.has(`${i}|${j}`) })),
    groups: net.groups.map((g) => g.label),
    hubs: net.hubs.map((h) => String(h.node)),
    unit: ["page", "pages"],
    fade: Boolean(mark),
    ...opts,
    // Last, so no caller can name the other nodes while section 4 collects guesses.
    titles: "hubs",
  });
}
