// Week 5 · the Marvel map that sections 1 and 4 share: one layout and one
// colour per consensus community (section 4), from docs/weeks/week05/data/network.json,
// written by analysis/week05_network.py and drawn with networkView().
//
// Hovering any page names it and gives its group and links; the eight hubs, the
// quiz's options, also carry a name on the map.

import { asset } from "./site.js";
import { loadData, networkView } from "./kit.js";

let loading;

/** network.json, fetched once for both sections. */
export function loadNetwork() {
  loading ??= loadData(asset("weeks/week05/data/network.json"));
  return loading;
}

/**
 * Draw the map into host. `mark` names a relation from section 1 ("enemy",
 * "family", ...): its pairs draw in ink over the faded rest. Other options pass
 * through to networkView().
 */
const WORDS = { enemy: "fight words", family: "family words", ally: "ally words", teammate: "teammate words", killed: "killing words" };

export function marvelMap(host, net, { mark, ...opts } = {}) {
  const hub = new Map(net.hubs.map((h) => [String(h.node), h.label]));
  const describe = (n, { degree, marked, group }) => [
    n.name,
    `${group ? `${group} group` : "No group"} · ${degree} ${degree === 1 ? "link" : "links"}${mark ? `, ${marked} in ${WORDS[mark]}` : ""}`,
  ];
  const marked = new Set((mark ? net.relations[mark].pairs : []).map(([i, j]) => `${i}|${j}`));
  return networkView(host, {
    ratio: net.ratio,
    nodes: net.nodes.map((n, i) => ({ id: String(i), x: n.x, y: n.y, group: n.group, name: n.name, label: hub.get(String(i)) })),
    links: net.links.map(([i, j, weight, group]) => ({ source: String(i), target: String(j), weight, group, mark: marked.has(`${i}|${j}`) })),
    groups: net.groups.map((g) => g.label),
    hubs: net.hubs.map((h) => String(h.node)),
    unit: ["page", "pages"],
    fade: Boolean(mark),
    explore: true,
    ...opts,
    describe,
  });
}
