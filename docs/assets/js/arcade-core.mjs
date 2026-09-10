// Pure graph operations shared by the terminal and every cabinet.
export function rng(seed = 7) {
  let state = Number(seed) >>> 0;
  const next = () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  next.state = () => state;
  return next;
}

export function graph(
  data,
  {
    directed = false,
    core = false,
    removed = [],
    added = [],
    links = data.links,
  } = {},
) {
  const omit = new Set(removed);
  const adj = new Map(
    data.nodes
      .filter((n) => (!core || n.component === "core") && !omit.has(n.id))
      .map((n) => [n.id, new Set()]),
  );
  for (const [a, b] of [...links, ...added]) {
    if (!adj.has(a) || !adj.has(b) || a === b) continue;
    adj.get(a).add(b);
    if (!directed) adj.get(b).add(a);
  }
  return adj;
}

export function bfs(adj, from, to) {
  if (!adj.has(from) || !adj.has(to)) return null;
  const queue = [from],
    parent = new Map([[from, null]]);
  for (let head = 0; head < queue.length; head++) {
    const n = queue[head];
    if (n === to) {
      const path = [];
      for (let p = to; p !== null; p = parent.get(p)) path.push(p);
      return path.reverse();
    }
    for (const next of adj.get(n))
      if (!parent.has(next)) {
        parent.set(next, n);
        queue.push(next);
      }
  }
  return null;
}

export function reachable(adj, from) {
  if (!adj.has(from)) return new Set();
  const seen = new Set([from]),
    queue = [from];
  for (let h = 0; h < queue.length; h++)
    for (const n of adj.get(queue[h]))
      if (!seen.has(n)) {
        seen.add(n);
        queue.push(n);
      }
  return seen;
}

export function components(adj) {
  const unseen = new Set(adj.keys()),
    groups = [];
  while (unseen.size) {
    const part = reachable(adj, unseen.values().next().value);
    for (const n of part) unseen.delete(n);
    groups.push([...part].sort());
  }
  return groups.sort((a, b) => b.length - a.length || a[0].localeCompare(b[0]));
}

export function outcome(data, removed, added = [], links = data.links) {
  const adj = graph(data, {
    core: true,
    removed: removed ? [removed] : [],
    added,
    links,
  });
  const groups = components(adj),
    largest = groups[0] || [];
  return {
    adj,
    groups,
    largest,
    stranded: groups.slice(1).flat(),
    remaining: adj.size,
    health: adj.size ? largest.length / adj.size : 0,
  };
}

export function undirectedEdges(adj) {
  return [...adj].flatMap(([a, neighbours]) =>
    [...neighbours].filter((b) => a < b).map((b) => [a, b]),
  );
}

export function rewire(adj, requested = 20, seed = 7) {
  if (!Number.isInteger(requested) || requested < 0 || requested > 2000)
    throw new Error("Choose 0–2,000 successful swaps.");
  if (!Number.isInteger(seed) || seed < 0 || seed > 4294967295)
    throw new Error("Seed must be an integer from 0 to 4,294,967,295.");
  if (components(adj).length !== 1)
    throw new Error("Rewiring starts from a connected graph.");
  const copy = new Map(
    [...adj].map(([n, neighbours]) => [n, new Set(neighbours)]),
  );
  const edges = undirectedEdges(copy),
    random = rng(seed);
  let completed = 0,
    attempts = 0;
  const connected = () =>
    reachable(copy, copy.keys().next().value).size === copy.size;
  const drop = (a, b) => {
    copy.get(a).delete(b);
    copy.get(b).delete(a);
  };
  const add = (a, b) => {
    copy.get(a).add(b);
    copy.get(b).add(a);
  };
  while (
    edges.length >= 2 &&
    completed < requested &&
    attempts < requested * 100 + 100
  ) {
    attempts++;
    const i = Math.floor(random() * edges.length),
      j = Math.floor(random() * edges.length);
    if (i === j) continue;
    let [a, b] = edges[i],
      [c, d] = edges[j];
    if (random() < 0.5) [a, b] = [b, a];
    if (random() < 0.5) [c, d] = [d, c];
    if (
      new Set([a, b, c, d]).size !== 4 ||
      copy.get(a).has(d) ||
      copy.get(c).has(b)
    )
      continue;
    drop(a, b);
    drop(c, d);
    add(a, d);
    add(c, b);
    if (!connected()) {
      drop(a, d);
      drop(c, b);
      add(a, b);
      add(c, d);
      continue;
    }
    edges[i] = [a, d];
    edges[j] = [c, b];
    completed++;
  }
  return { adj: copy, edges, completed, requested, attempts, seed };
}

export function triangles(adj) {
  let count = 0;
  for (const [a, neighbours] of adj)
    for (const b of neighbours)
      if (a < b)
        for (const c of adj.get(b)) if (b < c && neighbours.has(c)) count++;
  return count;
}

export function coverage(adj, selected) {
  const covered = new Set();
  for (const id of selected)
    if (adj.has(id)) {
      covered.add(id);
      for (const n of adj.get(id)) covered.add(n);
    }
  return covered;
}

export function randomWalk(adj, start, length = 32, seed = 7) {
  if (!adj.has(start)) throw new Error("Choose an article in this graph.");
  const random = rng(seed),
    path = [start];
  while (path.length < length) {
    const options = [...adj.get(path.at(-1))].sort();
    if (!options.length) break;
    path.push(options[Math.floor(random() * options.length)]);
  }
  return path;
}

export function resolveNode(data, text) {
  const norm = (s) =>
    String(s)
      .normalize("NFKD")
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");
  const query = norm(text);
  if (!query) throw new Error("Enter an article name.");
  let matches = data.nodes.filter(
    (n) => norm(n.id) === query || norm(n.name) === query,
  );
  if (!matches.length)
    matches = data.nodes.filter(
      (n) => norm(n.name.replace(/\s*\(.*\)/, "")) === query,
    );
  if (!matches.length)
    matches = data.nodes.filter((n) => norm(n.name).startsWith(query));
  if (matches.length === 1) return matches[0];
  if (matches.length > 1)
    throw new Error(
      "Be more specific: " +
        matches
          .slice(0, 5)
          .map((n) => n.name)
          .join(", "),
    );
  throw new Error(
    `No article matches “${text}”. Try a full name from the article list.`,
  );
}

const STOP = new Set(
  "the a an of to in on and or is are was were be been with for from by as at that this it its his her their who which has have had also character characters appearing american comic comics books published marvel fictional known first".split(
    " ",
  ),
);
export function tokens(text) {
  return (
    String(text)
      .toLowerCase()
      .match(/[\p{L}\p{N}]+/gu) || []
  ).filter((t) => t.length > 2 && !STOP.has(t));
}
export function tfidfIndex(nodes) {
  const counts = nodes.map((n) => {
    const c = new Map();
    for (const t of tokens(n.text)) c.set(t, (c.get(t) || 0) + 1);
    return c;
  });
  const df = new Map();
  for (const c of counts)
    for (const t of c.keys()) df.set(t, (df.get(t) || 0) + 1);
  const idf = new Map(
    [...df].map(([t, n]) => [t, Math.log((1 + nodes.length) / (1 + n)) + 1]),
  );
  const vector = (counts) => {
    const entries = [...counts]
      .filter(([t]) => idf.has(t))
      .map(([t, c]) => [t, (1 + Math.log(c)) * idf.get(t)]);
    const norm = Math.hypot(...entries.map(([, v]) => v)) || 1;
    return new Map(entries.map(([t, v]) => [t, v / norm]));
  };
  const vectors = counts.map(vector);
  return {
    terms: idf.size,
    search(query) {
      const c = new Map();
      for (const t of tokens(query)) c.set(t, (c.get(t) || 0) + 1);
      const q = vector(c);
      return nodes
        .map((node, i) => ({
          node,
          score: [...q].reduce(
            (s, [t, v]) => s + v * (vectors[i].get(t) || 0),
            0,
          ),
          matches: [...q.keys()].filter((t) => vectors[i].has(t)),
        }))
        .filter((r) => r.score > 0)
        .sort(
          (a, b) => b.score - a.score || a.node.id.localeCompare(b.node.id),
        );
    },
  };
}

export function predictionScore(guess, answer, min, max) {
  if (
    ![guess, answer, min, max].every(Number.isFinite) ||
    max <= min ||
    guess < min ||
    guess > max
  )
    throw new Error("Enter a guess inside the displayed range.");
  return Math.max(
    0,
    Math.round(100 * (1 - Math.abs(guess - answer) / (max - min))),
  );
}

export function tokenizeCommand(line) {
  const result = String(line).match(/"[^"]*"|'[^']*'|\S+/g) || [];
  return result.map((s) => s.replace(/^(["'])(.*)\1$/, "$2"));
}
