"""An explicitly schematic transit view; never inferred communities."""
import json
from arcade_data import load, OUT, write


def build():
    rows, directed, _ = load()
    graph = directed.to_undirected()
    byid = {r["node_id"]: r for r in rows}
    # The core map intentionally shows only 16 interchanges. Every segment is
    # a real edge in that induced subgraph. Route strips use the full graph.
    hubs = sorted(graph, key=lambda n: (-graph.degree(n), n))[:16]
    edges = {tuple(sorted((a, b))) for a, b in graph.subgraph(hubs).edges()}
    remaining = set(edges)
    lines = []
    while remaining:
        start = min({n for edge in remaining for n in edge}, key=lambda n: (-sum(n in e for e in remaining), n))
        path = [start]
        while True:
            options = {b if a == path[-1] else a for a, b in remaining if path[-1] in (a, b)} - set(path)
            if not options:
                break
            nxt = min(options, key=lambda n: (-graph.degree(n), n))
            remaining.remove(tuple(sorted((path[-1], nxt))))
            path.append(nxt)
        assert len(path) > 1
        lines.append(path)
    assert {tuple(sorted((a, b))) for line in lines for a, b in zip(line, line[1:])} == edges
    positions = [(140,130),(390,130),(640,130),(890,130), (140,300),(390,300),(640,300),(890,300),
                 (140,470),(390,470),(640,470),(890,470), (140,640),(390,640),(640,640),(890,640)]
    resilience = json.loads((OUT / "week02_resilience.json").read_text())
    payload = {"snapshot": resilience["snapshot"], "mapScope": "16 highest-degree interchanges; not the entire graph. All drawn station-to-station segments are real undirected links. Positions and line colours are schematic.",
               "lineRule": "Greedy edge-disjoint path decomposition of the 16-hub induced undirected subgraph. Start at the station with most unused incident edges; extend to the unvisited neighbour of greatest full-graph degree; break ties by node ID. Repeat until every edge is used. These are drawing lines, not detected communities.",
               "stations": [{"id": n, "name": byid[n]["name"], "degree": graph.degree(n), "x": xy[0], "y": xy[1]} for n, xy in zip(hubs, positions)],
               "lines": [{"id": i+1,"stations": line} for i,line in enumerate(lines)],
               "interchanges": [{"id": n, "name": byid[n]["name"], "degree": graph.degree(n)} for n in hubs],
               "closures": resilience["cases"], "coreNodes": resilience["population"]["nodes"],
               "shortestPaths": "BFS on the full 303-article snapshot: directed article links or the explicitly selected undirected collapse. Closed articles are excluded. Only the 277-article core is used for closure/null-model comparisons."}
    write("week02_transit.json", payload)
    print(f"Transit: {len(hubs)} interchange stations, {len(edges)} real segments across {len(lines)} schematic lines.")


if __name__ == "__main__":
    build()
