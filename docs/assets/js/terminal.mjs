import {
  graph,
  bfs,
  outcome,
  rewire,
  triangles,
  randomWalk,
  resolveNode,
  tfidfIndex,
  tokenizeCommand,
} from "./arcade-core.mjs";
export function createTerminal(data) {
  const original = graph(data, { core: true }),
    byId = new Map(data.nodes.map((n) => [n.id, n])),
    index = tfidfIndex(data.nodes);
  let alternate = null;
  const name = (id) => byId.get(id)?.name || id;
  const label = () =>
    alternate
      ? `rewired core, seed ${alternate.seed}, ${alternate.completed} swaps`
      : "original undirected core";
  const fullAlternate = () =>
    alternate
      ? [
          ...alternate.edges,
          ...data.links.filter(([a]) => byId.get(a).component !== "core"),
        ]
      : data.links;
  const number = (raw, fallback, min, max, what) => {
    const n = raw === undefined ? fallback : Number(raw);
    if (!Number.isInteger(n) || n < min || n > max)
      throw new Error(`${what} must be an integer from ${min} to ${max}.`);
    return n;
  };
  function options(args, allowed) {
    const out = {},
      pos = [];
    for (let i = 0; i < args.length; i++) {
      const arg = args[i];
      if (arg.startsWith("--")) {
        if (!allowed.includes(arg)) throw new Error("Unknown option " + arg);
        if (arg === "--undirected" || arg === "--directed") out[arg] = true;
        else {
          if (args[i + 1] === undefined || args[i + 1].startsWith("--"))
            throw new Error("Missing value after " + arg);
          out[arg] = args[++i];
        }
      } else pos.push(arg);
    }
    return { out, pos };
  }
  const HELP = `MARVEL-OS graph commands\n\nstats                              Snapshot and scenario\nbfs <from> <to> [--undirected]      Shortest path (default: directed original)\ntop --in 10                        Highest incoming degree\ntop --out 10                       Highest outgoing degree\ntop --degree 10                    Undirected neighbours\ntop --betweenness 10               Exact normalized betweenness\ntop --clustering 10                Local clustering\nstrand <article>                   Remove from current undirected core\nrewire --swaps 20 --seed 7          New connected, degree-preserving core\ntriangles                          Count triangles in current core\nrestore                            Reset to original snapshot\nwalk <start> --steps 32 --seed 7    Undirected seeded random walk\nsearch <words>                     TF-IDF over roster descriptions\nopen <app>                         degrees, nullmodel, importance, communities, notepad, search\nclear                              Clear terminal output\n\nQuote multi-word names: bfs "Doctor Strange" hulk\nRewiring is a single demonstration, not the recorded 1,000-draw benchmark.\nNo shell, network commands, or access to your files.`;
  function execute(line) {
    const [command, ...args] = tokenizeCommand(line.trim());
    if (!command) return { text: "" };
    switch (command.toLowerCase()) {
      case "help":
        return { text: HELP };
      case "clear":
        return { text: "", clear: true };
      case "stats":
        return {
          text: `Snapshot: ${data.snapshot}\n303 roster articles · 1,784 directed links · 1,434 undirected links\n277-node core · 9-node island · 17 isolates\nCore: 1,421 undirected edges\nCurrent scenario: ${label()}\nDirected paths always use the original snapshot.`,
        };
      case "bfs": {
        const { out, pos } = options(args, ["--undirected"]);
        if (pos.length !== 2)
          throw new Error(
            "Usage: bfs <from> <to> [--undirected]. Quote names with spaces.",
          );
        const a = resolveNode(data, pos[0]),
          b = resolveNode(data, pos[1]),
          directed = !out["--undirected"];
        const path = bfs(
          graph(data, {
            directed,
            links: directed ? data.links : fullAlternate(),
          }),
          a.id,
          b.id,
        );
        return {
          text: `${directed ? "Original directed snapshot" : "303-node undirected view; " + label()}\n${path ? `${path.length - 1} hops\n${path.map(name).join(" → ")}` : `No route: ${a.name} → ${b.name}.`}${!path && (a.degree === 0 || b.degree === 0) ? "\nAn endpoint is an isolate in the frozen roster." : ""}`,
        };
      }
      case "top": {
        const keys = {
            "--in": "kin",
            "--out": "kout",
            "--degree": "degree",
            "--betweenness": "betweenness",
            "--clustering": "clustering",
          },
          found = Object.keys(keys).filter((k) => args.includes(k));
        if (found.length !== 1 || args.length !== 2 || args[0] !== found[0])
          throw new Error(
            "Usage: top --in 10 (or --out, --degree, --betweenness, --clustering).",
          );
        const count = number(args[1], 10, 1, 303, "Count"),
          key = keys[found[0]],
          rows = [...data.nodes]
            .sort((a, b) => b[key] - a[key] || a.id.localeCompare(b.id))
            .slice(0, count);
        return {
          text:
            `Original snapshot · ${key}${["betweenness", "clustering"].includes(key) ? " (fraction, 0–1)" : ""}\n` +
            rows
              .map(
                (n, i) =>
                  `${String(i + 1).padStart(3)}  ${String(n[key]).padEnd(14)} ${n.name}`,
              )
              .join("\n"),
        };
      }
      case "strand": {
        if (!args.length) throw new Error("Usage: strand <article>");
        const node = resolveNode(data, args.join(" "));
        if (node.component !== "core")
          throw new Error(
            "Removal experiments use the original 277-node core. This article is outside it.",
          );
        const result = outcome(
          data,
          node.id,
          [],
          alternate?.edges || data.links,
        );
        return {
          text: `Remove ${node.name} from ${label()}\n${result.largest.length}/${result.remaining} in the largest remaining component\n${result.stranded.length} stranded in ${result.groups.length - 1} separate groups\n${
            result.groups
              .slice(1)
              .map(
                (group, i) => `Group ${i + 1}: ${group.map(name).join(", ")}`,
              )
              .join("\n") || "Every remaining article stays connected."
          }\nThis is a query; the node is not permanently deleted.`,
        };
      }
      case "rewire": {
        const { out, pos } = options(args, ["--swaps", "--seed"]);
        if (pos.length) throw new Error("Usage: rewire --swaps 20 --seed 7");
        const swaps = number(out["--swaps"], 20, 0, 2000, "Swaps"),
          seed = number(out["--seed"], 7, 0, 4294967295, "Seed");
        alternate = rewire(original, swaps, seed);
        return {
          text: `Built from the original 277-node core.\nSeed ${seed} · ${alternate.completed}/${swaps} successful swaps · ${alternate.attempts} proposals\n277 nodes · 1,421 edges · connected · every degree preserved\n${triangles(alternate.adj)} triangles now; ${data.coreTriangles} in the original.\nUndirected BFS, walks and strand now use this core.\nOne demonstration, not a uniform random graph sample or the recorded ensemble. Type restore to reset.`,
        };
      }
      case "triangles":
        return {
          text: `${triangles(alternate?.adj || original)} triangles · ${label()}`,
        };
      case "restore":
        alternate = null;
        return {
          text: "Restored the original snapshot. Undirected core experiments now use its observed links.",
        };
      case "walk": {
        const { out, pos } = options(args, ["--steps", "--seed"]);
        if (!pos.length)
          throw new Error("Usage: walk <start> --steps 32 --seed 7");
        const start = resolveNode(data, pos.join(" "));
        const length = number(out["--steps"], 32, 1, 128, "Steps"),
          seed = number(out["--seed"], 7, 0, 4294967295, "Seed");
        const path = randomWalk(
          graph(data, { links: fullAlternate() }),
          start.id,
          length,
          seed,
        );
        return {
          text: `Undirected · ${label()} · seed ${seed}\n${path.map(name).join(" → ")}\n${path.length} visits, ${new Set(path).size} distinct articles.${path.length < length ? " Stopped: no neighbour to follow." : ""}`,
        };
      }
      case "search": {
        const query = args.join(" ");
        if (!query) throw new Error("Usage: search <words>");
        const rows = index.search(query);
        return {
          text:
            `TF-IDF / 303 short roster descriptions, not full articles\n${rows.length} matches\n` +
            (rows
              .slice(0, 10)
              .map(
                (r) =>
                  `${r.score.toFixed(4)}  ${r.node.name}\n        ${r.node.text}`,
              )
              .join("\n") || "No matching terms in this corpus."),
        };
      }
      case "open": {
        const valid = [
          "degrees",
          "nullmodel",
          "importance",
          "communities",
          "notepad",
          "search",
        ];
        if (args.length !== 1 || !valid.includes(args[0]))
          throw new Error("Choose: " + valid.join(", "));
        return { text: "Opening " + args[0] + "…", open: args[0] };
      }
      default:
        throw new Error(
          `Unknown command “${command}”. Type help to see available graph commands.`,
        );
    }
  }
  return {
    execute,
    get scenario() {
      return alternate;
    },
  };
}
