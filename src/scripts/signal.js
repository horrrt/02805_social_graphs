// The Baymax experiment's model for the /play/ page (src/features/play/Lab.tsx
// draws it). Hypothetical additions never mutate the source graph. Reach is
// computed locally. Pure: no DOM, no fetch.

/** The imagined links each state adds to the frozen graph. */
export const edits = { snapshot: [], out: [["Baymax", "Spider-Man"]], in: [["Spider-Man", "Baymax"]], both: [["Baymax", "Spider-Man"], ["Spider-Man", "Baymax"]] };
/** Dot and arrow colours: can reach Baymax, reachable from him, both ways, neither. */
export const palette = { to: "#e7fa52", from: "#c0b0f2", both: "#f4f5ef", none: "#53594c" };
/** The muted background connections and the rings around Baymax and Spider-Man. */
export const EDGE = "#5a624f";
export const RING = "#f4f5ef";
/** The two labels the server-rendered map shows before the graph loads. */
export const PLACEHOLDER = { baymax: "#f4f5ef", group: "#b2b7ad" };
/** The scene status under Baymax, per state. */
export const STATUS = { snapshot: "NO WAY IN. NO WAY OUT.", out: "A WAY OUT. NOBODY CAN ENTER.", in: "A WAY IN. NO WAY BACK.", both: "CONNECTED IN BOTH DIRECTIONS." };
/* The map is laid out in a 1000-wide viewBox and scaled to its box, which
   scales its text too. Each label takes its size from the type scale in
   type.css, divided by that scale, so it renders at the token's px. */
export const sceneType = { "scene-label": ["caption", "mono"], "baymax-label": ["h3", "display"], "spider-label": ["small", "sans"] };

/** The articles reachable from Baymax along `adjacency`, Baymax excluded. */
export function reachable(adjacency) {
  const seen = new Set(["Baymax"]), queue = ["Baymax"];
  for (let index = 0; index < queue.length; index++) {
    for (const id of adjacency.get(queue[index])) if (!seen.has(id)) { seen.add(id); queue.push(id); }
  }
  seen.delete("Baymax");
  return seen;
}

/** Throw unless the graph is the frozen 303-article snapshot with Baymax isolated. */
export function checkSnapshot(graph) {
  const nodes = graph.nodes;
  if (nodes.length !== 303 || graph.links.length !== 1784 || !nodes.some((n) => n.id === "Baymax" && n.kin === 0 && n.kout === 0)) throw new Error("Unexpected snapshot");
}

/** Reach to and from Baymax in every state, checked against the exporter's counts in graph.signal. */
export function buildScenarios(graph) {
  const nodes = graph.nodes;
  const result = {};
  for (const [key, additions] of Object.entries(edits)) {
    const forward = new Map(nodes.map((n) => [n.id, new Set()]));
    const reverse = new Map(nodes.map((n) => [n.id, new Set()]));
    for (const [source, target] of [...graph.links.map((e) => [e.s, e.t]), ...additions]) {
      forward.get(source).add(target); reverse.get(target).add(source);
    }
    const to = reachable(reverse), from = reachable(forward);
    const roundTrip = [...to].filter((id) => from.has(id)).length;
    const expected = graph.signal?.[key];
    if (!expected || expected.to !== to.size || expected.from !== from.size || expected.roundTrip !== roundTrip || expected.added !== additions.length) throw new Error("Scenario verification failed: " + key);
    result[key] = { to, from, roundTrip };
  }
  return result;
}

/** Each article's point in the 1000 x 630 viewBox: Baymax on the left, the giant group, the island ring and the isolates' grid. */
export function layout(nodes) {
  const positions = new Map();
  let islandIndex = 0, isolateIndex = 0;
  for (const node of nodes) {
    let point;
    if (node.id === "Baymax") point = [150, 260];
    else if (node.grp === "giant") point = [360 + (node.x - 55) / 605 * 575, 70 + (node.y - 60) / 520 * 370];
    else if (node.grp === "island") { const angle = islandIndex++ * Math.PI * 2 / 9; point = [828 + 43 * Math.cos(angle), 548 + 43 * Math.sin(angle)]; }
    else { point = [370 + isolateIndex % 8 * 30, 530 + Math.floor(isolateIndex / 8) * 28]; isolateIndex++; }
    positions.set(node.id, point);
  }
  return positions;
}

/** The background connections, one per unordered pair, as [x1, y1, x2, y2]. */
export function backgroundLines(graph, positions) {
  const seen = new Set();
  const lines = [];
  for (const edge of graph.links) {
    const key = [edge.s, edge.t].sort().join("|"); if (seen.has(key)) continue; seen.add(key);
    const a = positions.get(edge.s), b = positions.get(edge.t);
    lines.push([a[0], a[1], b[0], b[1]]);
  }
  return lines;
}

/** A dot's radius: Baymax and Spider-Man large, the rest by in-degree. */
export function dotRadius(node) {
  return node.id === "Baymax" ? 22 : node.id === "Spider-Man" ? 11 : 2.6 + Math.sqrt(node.kin) * .45;
}

/** A dot's fill in a state. */
export function dotFill(node, state) {
  const to = state.to.has(node.id), from = state.from.has(node.id);
  if (node.id === "Baymax" || (to && from)) return palette.both;
  if (to) return palette.to;
  if (from) return palette.from;
  return palette.none;
}

/** The dashed arrows a state adds: { d, kind } per imagined link. */
export function addedLinks(mode, positions) {
  return edits[mode].map(([source, target]) => {
    const a = positions.get(source), b = positions.get(target);
    const dx = b[0] - a[0], dy = b[1] - a[1], length = Math.hypot(dx, dy);
    const startGap = source === "Baymax" ? 44 : 20, endGap = target === "Baymax" ? 45 : 21;
    const start = [a[0] + dx / length * startGap, a[1] + dy / length * startGap];
    const end = [b[0] - dx / length * endGap, b[1] - dy / length * endGap];
    const bend = mode === "both" ? 50 : 0;
    const control = [(a[0] + b[0]) / 2 - dy / length * bend, (a[1] + b[1]) / 2 + dx / length * bend];
    const kind = source === "Baymax" ? "from" : "to";
    return { d: `M${start} Q${control} ${end}`, kind };
  });
}
