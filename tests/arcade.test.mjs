import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  rng,
  graph,
  bfs,
  components,
  undirectedEdges,
  rewire,
  triangles,
  outcome,
  coverage,
  randomWalk,
  resolveNode,
  tfidfIndex,
  predictionScore,
  tokenizeCommand,
} from "../docs/assets/js/arcade-core.mjs";
import { createTerminal } from "../docs/assets/js/terminal.mjs";
import {
  pitch,
  frequency,
  voiceNames,
  wav,
  scheduleNotes,
} from "../docs/assets/js/audio.mjs";
const read = (name) =>
  JSON.parse(
    readFileSync(new URL("../docs/assets/data/" + name, import.meta.url)),
  );
const data = read("arcade_graph.json"),
  core = graph(data, { core: true });

test("saved pack random state resumes the sequence instead of repeating the first pack", () => {
  const a = rng(7);
  for (let i = 0; i < 20; i++) a();
  const resumed = rng(a.state());
  for (let i = 0; i < 20; i++) assert.equal(resumed(), a());
});

test("roster-first graph preserves isolates, directions and the independent component census", () => {
  const full = graph(data),
    directed = graph(data, { directed: true });
  assert.equal(full.size, 303);
  assert.equal(
    [...directed.values()].reduce((s, v) => s + v.size, 0),
    1784,
  );
  assert.equal(undirectedEdges(full).length, 1434);
  assert.equal(undirectedEdges(core).length, 1421);
  assert.equal(core.size, 277);
  assert.deepEqual(
    components(full).map((g) => g.length),
    data.facts.wcc_sizes,
  );
  assert.equal(full.get("Baymax").size, 0);
});
test("browser BFS agrees with independent Python distances and only follows real arcs", () => {
  for (const f of data.fixtures) {
    const adj = graph(data, { directed: f.directed }),
      path = bfs(adj, f.from, f.to);
    assert.equal(path ? path.length - 1 : null, f.distance, JSON.stringify(f));
    if (path)
      for (let i = 1; i < path.length; i++)
        assert(adj.get(path[i - 1]).has(path[i]));
  }
  assert.equal(bfs(core, "Baymax", "Hulk"), null);
  assert.deepEqual(bfs(core, "Hulk", "Hulk"), ["Hulk"]);
});
test("all 277 browser removal counts agree with the independently recorded CSV", () => {
  const lines = readFileSync(
    new URL("../docs/assets/data/week02_all_removals.csv", import.meta.url),
    "utf8",
  )
    .trim()
    .split("\n")
    .slice(1);
  assert.equal(lines.length, 277);
  for (const line of lines) {
    const row = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
    const id = row[0].replace(/^"|"$/g, ""),
      expectedStranded = Number(row.at(-2)),
      expectedLargest = Number(row.at(-1)),
      result = outcome(data, id);
    assert.equal(result.stranded.length, expectedStranded, id);
    assert.equal(result.largest.length, expectedLargest, id);
    assert.equal(result.remaining, 276);
  }
});
test("every named transit closure preserves the exact groups and names", () => {
  for (const entry of read("week02_transit.json").closures) {
    const actual = outcome(data, entry.id);
    assert.deepEqual(
      [...actual.stranded].sort(),
      [...entry.real.stranded].sort(),
    );
    assert.deepEqual(
      actual.groups
        .slice(1)
        .map((g) => g.join("|"))
        .sort(),
      entry.real.groups.map((g) => [...g].sort().join("|")).sort(),
    );
  }
});
test("rewiring is deterministic, connected, simple, degree preserving and does not mutate the original", () => {
  const before = JSON.stringify(undirectedEdges(core));
  for (const count of [0, 20, 200]) {
    const a = rewire(core, count, 7),
      b = rewire(core, count, 7);
    assert.equal(a.completed, count);
    assert.deepEqual(a.edges, b.edges);
    assert.equal(a.edges.length, 1421);
    assert.equal(
      new Set(a.edges.map((edge) => [...edge].sort().join("|"))).size,
      1421,
    );
    assert.equal(components(a.adj).length, 1);
    for (const [id, neighbors] of a.adj) {
      assert.equal(neighbors.size, core.get(id).size);
      assert(!neighbors.has(id));
    }
    assert.equal(JSON.stringify(undirectedEdges(core)), before);
  }
  assert.throws(() => rewire(core, -1, 7));
  assert.throws(() => rewire(core, 2001, 7));
  assert.throws(() => rewire(core, 20, 1.5));
  assert.throws(() => rewire(graph(data), 20, 7));
  assert.equal(rewire(new Map([["one", new Set()]]), 20, 7).completed, 0);
});
test("triangle count and five-card coverage agree with Python reference values", () => {
  assert.equal(triangles(core), data.coreTriangles);
  assert.equal(
    coverage(graph(data), data.greedyDraft.cards).size,
    data.greedyDraft.covered,
  );
  assert.deepEqual([...coverage(graph(data), ["Baymax"])], ["Baymax"]);
  assert(!coverage(graph(data), data.greedyDraft.cards).has("Baymax"));
});
test("a single repair can bring a multi-article stranded component back", () => {
  const bw = "Black_Widow_(Natasha_Romanova)";
  assert.equal(outcome(data, bw).stranded.length, 3);
  const repaired = outcome(data, bw, [["Rockman_(character)", "Hulk"]]);
  assert.equal(repaired.stranded.length, 1);
  assert.deepEqual(repaired.stranded, ["Blue_Eagle_(character)"]);
  assert.equal(outcome(data, "Spider-Man").groups.length - 1, 5);
});
test("random walks are repeatable, follow edges and stop honestly at isolates", () => {
  const adj = graph(data),
    path = randomWalk(adj, "Spider-Man", 64, 7);
  assert.deepEqual(path, randomWalk(adj, "Spider-Man", 64, 7));
  assert.equal(path.length, 64);
  for (let i = 1; i < path.length; i++)
    assert(adj.get(path[i - 1]).has(path[i]));
  assert.deepEqual(randomWalk(adj, "Baymax", 64, 7), ["Baymax"]);
});
test("TF-IDF search handles an independent tiny corpus, empty queries and unknown terms", () => {
  const idx = tfidfIndex([
    { id: "a", text: "gamma gamma delta" },
    { id: "b", text: "epsilon delta" },
    { id: "c", text: "zeta" },
  ]);
  assert.equal(idx.search("gamma")[0].node.id, "a");
  assert.deepEqual(idx.search("unknown"), []);
  assert.deepEqual(idx.search(""), []);
  assert.equal(idx.search("delta").length, 2);
  assert.equal(idx.search("zeta")[0].score, 1);
  const actual = tfidfIndex(data.nodes);
  assert.equal(actual.search("radiation").length, 0);
  assert.equal(actual.search("spider").length, 12);
  assert(actual.search("mutant")[0].node.text.toLowerCase().includes("mutant"));
});
test("command parsing never evaluates input and resolves actual article names", () => {
  assert.deepEqual(tokenizeCommand('bfs "Doctor Strange" hulk'), [
    "bfs",
    "Doctor Strange",
    "hulk",
  ]);
  assert.equal(resolveNode(data, "spider-man").id, "Spider-Man");
  assert.throws(() => resolveNode(data, "Spider"));
  assert.throws(() => resolveNode(data, "not-in-roster"));
  const term = createTerminal(data);
  assert.match(term.execute("bfs baymax spider-man").text, /No route/);
  assert.match(term.execute("top --in 10").text, /106\s+Spider-Man/);
  assert.match(term.execute("strand hulk").text, /0 stranded/);
  assert.match(term.execute('bfs "Doctor Strange" hulk').text, /hops/);
  assert.match(
    term.execute("rewire --swaps 20 --seed 7").text,
    /20\/20 successful swaps/,
  );
  assert.equal(term.scenario.completed, 20);
  assert.match(term.execute("strand hulk").text, /rewired core, seed 7/);
  assert.match(
    term.execute("bfs hulk spider-man").text,
    /Original directed snapshot/,
  );
  term.execute("restore");
  assert.equal(term.scenario, null);
  assert.throws(() => term.execute("rewire --swaps"));
  assert.throws(() => term.execute("rewire --unknown 1"));
  assert.throws(() => term.execute("eval alert(1)"));
  assert.throws(() => term.execute("strand baymax"));
  assert.equal(term.execute("open search").open, "search");
  assert.match(
    term.execute("search radiation").text,
    /303 short roster descriptions/,
  );
});
test("prediction scores enforce finite bounds and exact guesses score 100", () => {
  assert.equal(predictionScore(5, 5, 0, 20), 100);
  assert.equal(predictionScore(0, 20, 0, 20), 0);
  assert.equal(predictionScore(10, 5, 0, 20), 75);
  for (const v of [NaN, Infinity, -1, 21])
    assert.throws(() => predictionScore(v, 5, 0, 20));
});
test("every article maps to a valid bounded pitch and voice, including community zero", () => {
  for (const node of data.nodes) {
    assert(pitch(node) >= 48 && pitch(node) <= 84);
    assert(voiceNames[node.community % 4]);
    assert(Number.isFinite(frequency(pitch(node))));
  }
  const scheduled = [];
  const mock = {
    createOscillator() {
      return {
        set type(value) {
          assert(["sine", "triangle", "sawtooth", "square"].includes(value));
        },
        frequency: { value: 0 },
        connect(target) {
          return target;
        },
        start(time) {
          scheduled.push(time);
        },
        stop() {},
      };
    },
    createGain() {
      return {
        gain: {
          setValueAtTime() {},
          linearRampToValueAtTime() {},
          exponentialRampToValueAtTime() {},
        },
        connect(target) {
          return target;
        },
      };
    },
    createBiquadFilter() {
      return {
        frequency: { value: 0 },
        connect(target) {
          return target;
        },
      };
    },
  };
  scheduleNotes(mock, {}, data.nodes.slice(0, 5), 120, 0);
  assert.deepEqual(scheduled, [0, 0.5, 1, 1.5, 2]);
});
test("WAV export has correct PCM headers, duration and clipped sample encoding", () => {
  const bytes = wav({
      sampleRate: 44100,
      getChannelData: () => new Float32Array([-2, 0, 0.5, 2]),
    }),
    v = new DataView(bytes);
  assert.equal(bytes.byteLength, 52);
  assert.equal(v.getUint32(24, true), 44100);
  assert.equal(v.getUint32(40, true), 8);
  assert.equal(v.getInt16(44, true), -32768);
  assert.equal(v.getInt16(50, true), 32767);
});
test("the transit schematic uses each real hub link once and never invents a track", () => {
  const transit = read("week02_transit.json"),
    hubs = new Set(transit.stations.map((n) => n.id)),
    adj = graph(data),
    edges = [];
  for (const line of transit.lines)
    for (let i = 1; i < line.stations.length; i++) {
      const a = line.stations[i - 1],
        b = line.stations[i];
      assert(hubs.has(a) && hubs.has(b));
      assert(adj.get(a).has(b));
      edges.push([a, b].sort().join("|"));
    }
  assert.equal(edges.length, 60);
  assert.equal(new Set(edges).size, 60);
});
