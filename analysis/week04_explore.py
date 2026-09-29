"""Week 4, section 1 explorables: the data behind the four interactive steppers
modelled on the course page (Girvan-Newman, move-a-node modularity, Louvain,
k-clique/link communities). Owner: Àngela's network, new widgets.

Network: the same 40-metro projection as week04_where.py (section 1), rebuilt
here because the page JSON only ships the disparity-filter backbone, not the
full weighted graph the steppers need.

Questions
- Girvan-Newman: which single link, removed one betweenness-recompute at a
  time, first splits the map, and does the best split found this way agree
  with Louvain?
- Louvain stepper: which node moves first, and how many sweeps and
  aggregation levels does it take to reach the page's partition?
- k-clique / link communities: does a looser, overlap-tolerant notion of
  community agree with the page's hard partition, and which metros sit in
  more than one k-clique community?

Method
- The full network is rebuilt by importing week04_where and calling its own
  metros(), worksite_metros() and metro_graph(): the four lines that build
  per_case/pairs/filings/top in week04_where.main() are copied verbatim below
  (see build_full()) rather than re-derived, so the node set and its order
  match docs/assets/data/week04_place.json exactly. That is checked directly:
  the rebuilt top-40 list must equal the page's city order, and the rebuilt
  graph's disparity-filter backbone at alpha 0.2 must equal the page's
  backbone edges (same pairs, same weights).
- Girvan-Newman runs on that backbone, UNWEIGHTED (no "weight" attribute on
  the graph passed to betweenness or modularity, since
  networkx.community.modularity defaults to weight="weight" and would
  silently weight Q if the attribute were present). Edge betweenness
  (unnormalized) is recomputed after every removal; ties break on the sorted
  endpoint tuple by comparing (-betweenness rounded to 9 places, sorted edge).
- The Louvain stepper hand-implements phase 1 (move single nodes to the
  neighbouring community with the largest modularity gain, sweeping until no
  move helps) and phase 2 (aggregate communities into weighted super-nodes,
  self-loops carrying summed internal weight) on the FULL weighted network,
  because week04_staffing.louvain() (igraph) does not expose individual
  moves. Node order within a sweep is random.Random(seed) over the sorted
  node list of whatever graph is current (original metros at level 0, super-
  nodes at level >=1). Every recorded running Q is computed twice: once from
  the incremental gain formula (Blondel et al. 2008, dQ = k_i,in/m -
  Sigma_tot*k_i/(2m^2) compared across candidate communities after removing
  the node from its own), and once by mapping the current partition back to
  the original 40 metros and calling networkx.community.modularity on the
  original full graph; the two must agree within 1e-9, and that check runs
  on every move. Seeds 0..199 are tried; the first whose final partition
  equals the page's 3 communities (frozenset-of-frozensets equality, not a
  float NMI check) is kept and gets the full move-by-move recording. If none
  matches, the highest-Q seed is kept instead and the report says so.
- k-clique communities: networkx.community.k_clique_communities on the
  unweighted backbone, k = 3..6.
- Link communities: week04_jobs_split.link_similarities and
  partition_density_cut, unchanged, called the same way section 2's q2() does,
  on the unweighted backbone.

Checks
- 40 metros; the full network has one link per metro pair that shares an
  employer (printed; expected 780 = C(40, 2)).
- The rebuilt full network's disparity-filter backbone at alpha 0.2 matches
  week04_place.json's backbone edges exactly (same pairs and weights).
- Q of the page's 3-community partition on the full weighted network, rounded
  to 3 decimals, equals week04_place.json's null_model.Q (0.049).
- The backbone graph from the JSON has the page's links and nodes.
- Every recorded Louvain move's incremental gain matches a fresh
  Q_after - Q_before to within 1e-9 (asserted for every move of the kept
  seed); the final Q matches networkx.community.modularity within 1e-9.
- k-clique community counts match a direct call to networkx's own function
  (trivially true since we call it directly; the assert guards against a
  transcription bug when reshaping its output).

Outputs: docs/weeks/week04/data/explore.json (checked against the Explore
model in week04_schemas.py before writing).
"""

import json
import random
import sys
import time
from collections import Counter
from pathlib import Path

import networkx as nx
from sklearn.metrics import normalized_mutual_info_score as nmi

import week04_where as where
from week04_jobs_split import link_similarities, partition_density_cut
from week04_schemas import check

ROOT = Path(__file__).resolve().parents[1]
PAGE = ROOT / "docs/weeks/week04/data/explore.json"
PLACE = ROOT / "docs/assets/data/week04_place.json"
YEAR = 2025
LOUVAIN_SEED_TRIES = 200
K_CLIQUES = (3, 4, 5, 6)
GAIN_EPS = 1e-12


def build_full():
    """The full weighted metro x metro projection, and the top-40 metro list,
    rebuilt by calling week04_where's own functions. These four lines copy
    week04_where.main()'s "A - rankings" step verbatim (lookup/town_lookup/
    gaz, sites, per_case, pairs, filings, top) rather than re-deriving the
    logic, so the node set and order match the page exactly."""
    lookup, town_lookup, gaz = where.metros()
    sites, lca, stats = where.worksite_metros(lookup, town_lookup, YEAR)
    per_case = sites.drop_duplicates(["CASE_NUMBER", "metro"])
    pairs = per_case.groupby(["employer", "metro"]).size().rename("filings").reset_index()
    filings = per_case.groupby("metro").size().sort_values(ascending=False)
    top = list(filings.head(where.TOP).index)
    g_full = where.metro_graph(pairs, top)
    return top, g_full


def girvan_newman(backbone):
    """Every edge removal (highest unnormalized betweenness first, ties on the
    sorted endpoint tuple), and a level whenever the removal splits a
    component, with that level's modularity on the ORIGINAL unweighted
    backbone."""
    g = backbone.copy()
    cuts, levels = [], []
    components = nx.number_connected_components(g)
    step = 0
    while g.number_of_edges() > 0:
        bc = nx.edge_betweenness_centrality(g, normalized=False)
        edge = max(bc, key=lambda e: (round(bc[e], 9), tuple(sorted(e))))
        step += 1
        g.remove_edge(*edge)
        new_components = nx.number_connected_components(g)
        split = new_components > components
        cuts.append({"step": step, "edge": list(edge), "betweenness": round(bc[edge], 4),
                     "components": new_components, "split": split})
        if split:
            comps = sorted(nx.connected_components(g), key=lambda c: (-len(c), min(c)))
            partition = {m: i for i, c in enumerate(comps) for m in sorted(c)}
            q = nx.community.modularity(backbone, comps, weight=None)
            levels.append({"step": step, "components": new_components,
                            "partition": partition, "Q": round(q, 4)})
        components = new_components
    best = max(levels, key=lambda lv: lv["Q"])
    return {"cuts": cuts, "levels": levels,
            "best": {"step": best["step"], "components": best["components"], "Q": best["Q"]}}


def neighbour_weights(graph, node, comm):
    """{community -> summed edge weight from node to that community}, excluding
    node's own self-loop (which never affects which OTHER community it should
    join)."""
    out = {}
    for nb, data in graph[node].items():
        if nb == node:
            continue
        w = data.get("weight", 1)
        c = comm[nb]
        out[c] = out.get(c, 0) + w
    return out


def phase1(graph, seed, m, start_label):
    """Louvain phase 1 on `graph` (nodes may be original metros or level>=1
    super-nodes), starting every node in its own community (start_label gives
    each node's starting label, so a fresh level's numbering can start where
    the previous level's numbering left off). Returns (comm, sweeps, moves):
    moves is [(node, from_label, to_label, gain), ...] in chronological order;
    Q is not computed here, only the incremental modularity gain (Blondel et
    al. 2008), so phase1 stays agnostic of the original 40-metro network."""
    nodes = sorted(graph.nodes())
    comm = dict(start_label)
    degree = dict(graph.degree(weight="weight"))
    sigma_tot = {}
    for n in nodes:
        sigma_tot[comm[n]] = sigma_tot.get(comm[n], 0) + degree[n]
    rng = random.Random(seed)
    order = nodes[:]
    moves = []
    sweeps = 0
    improved = True
    while improved:
        improved = False
        sweeps += 1
        rng.shuffle(order)
        for node in order:
            home = comm[node]
            k_i = degree[node]
            nbw = neighbour_weights(graph, node, comm)
            sigma_tot[home] -= k_i
            stay_val = nbw.get(home, 0) - sigma_tot.get(home, 0) * k_i / (2 * m)
            best_c, best_val = home, stay_val
            for c, w_in in nbw.items():
                val = w_in - sigma_tot.get(c, 0) * k_i / (2 * m)
                if val > best_val + GAIN_EPS:
                    best_val, best_c = val, c
            sigma_tot[best_c] = sigma_tot.get(best_c, 0) + k_i
            if best_c != home:
                comm[node] = best_c
                improved = True
                gain = (best_val - stay_val) / m
                moves.append((node, home, best_c, gain))
    return comm, sweeps, moves


def aggregate(graph, comm, members, level):
    """Super-node graph for the next Louvain level: super-node ids are
    "L{level}:{old_label}" strings so they never collide with metro ids or
    other levels' ids; edges (including self-loops, which carry the summed
    internal weight) are built by folding every edge of `graph` into its
    endpoints' communities. Also returns the new members map (super-node id
    -> set of original metro ids)."""
    new_id = {c: f"L{level}:{c}" for c in set(comm.values())}
    g2 = nx.Graph()
    g2.add_nodes_from(new_id.values())
    for u, v, w in graph.edges(data="weight", default=1):
        a, b = new_id[comm[u]], new_id[comm[v]]
        if g2.has_edge(a, b):
            g2[a][b]["weight"] += w
        else:
            g2.add_edge(a, b, weight=w)
    new_members = {new_id[c]: set() for c in new_id}
    for old_node, c in comm.items():
        new_members[new_id[c]].update(members[old_node])
    return g2, new_members


def run_louvain(g_full, seed, m, record=False):
    """Full multi-level Louvain on g_full. When record is truthy, returns the
    per-level move log too (with every running Q recomputed exactly, via a
    fresh modularity call on g_full mapping the current partition back to the
    original 40 metros); otherwise just the final partition and Q, for the
    cheap seed search."""
    graph = g_full
    members = {n: {n} for n in g_full.nodes()}
    levels = []
    level = 0
    comm = None
    while True:
        nodes = sorted(graph.nodes())
        start_label = {n: i for i, n in enumerate(nodes)}
        comm, sweeps, moves_raw = phase1(graph, seed, m, start_label)
        n_communities = len(set(comm.values()))
        if record:
            partition_start = {mm: start_label[n] for n in nodes for mm in sorted(members[n])}
            level_members = {n: sorted(members[n]) for n in nodes}
            # Replay the moves in order to get the exact Q after each one,
            # mapping the running per-node comm back to the original metros.
            comm_replay = dict(start_label)
            # The previous level's exact Q, not its rounded copy in `levels`.
            running_q = nx.community.modularity(
                g_full, [{mm} for mm in g_full.nodes()], weight="weight") if level == 0 else q_level
            q_start = running_q
            moves = []
            for node, home, to, gain in moves_raw:
                comm_replay[node] = to
                parts = {}
                for n, c in comm_replay.items():
                    parts.setdefault(c, set()).update(members[n])
                q_after = nx.community.modularity(g_full, list(parts.values()), weight="weight")
                assert abs((q_after - running_q) - gain) < 1e-9, \
                    f"level {level}, node {node}: recorded gain does not match Q_after - Q_before"
                running_q = q_after
                moves.append({"node": node, "from": home, "to": to,
                              "gain": round(gain, 6), "Q": round(q_after, 6)})
            parts = {}
            for n, c in comm.items():
                parts.setdefault(c, set()).update(members[n])
            q_level = nx.community.modularity(g_full, list(parts.values()), weight="weight")
            levels.append({"level": level, "moves": moves, "sweeps": sweeps,
                            "communities": n_communities, "Q_start": round(q_start, 6), "Q": round(q_level, 6),
                            "members": level_members, "partition_start": partition_start})
        if n_communities == graph.number_of_nodes():
            break
        graph, members = aggregate(graph, comm, members, level)
        level += 1
    final_parts = {}
    for n, c in comm.items():
        final_parts.setdefault(c, set()).update(members[n])
    renumber = {old: new for new, old in enumerate(
        sorted(final_parts, key=lambda c: (-len(final_parts[c]), min(final_parts[c]))))}
    final_partition = {mm: renumber[c] for c, mms in sorted(final_parts.items(), key=lambda kv: renumber[kv[0]])
                       for mm in sorted(mms)}
    final_q = nx.community.modularity(g_full, list(final_parts.values()), weight="weight")
    return final_partition, final_q, levels


def main():
    started = time.time()
    place = json.loads(PLACE.read_text())
    metros_page = [{"id": c["id"], "name": c["name"], "community": c["community"]} for c in place["cities"]]
    page_ids_order = [c["id"] for c in place["cities"]]
    page_partition = {c["id"]: c["community"] for c in place["cities"]}

    top, g_full = build_full()
    assert top == page_ids_order, "the rebuilt top-40 metro list and order must match week04_place.json"
    assert len(top) == 40, f"expected 40 metros, got {len(top)}"
    full_edges = [(u, v, round(float(w), 6)) for u, v, w in g_full.edges(data="weight")]
    print(f"full network: {len(full_edges)} links on {g_full.number_of_nodes()} metros (expect 780 = C(40,2))")
    assert len(full_edges) == 780, f"expected 780 links (every pair shares an employer), got {len(full_edges)}"

    # The full network's own disparity-filter backbone at alpha 0.2 must equal
    # the page's committed backbone: same graph, rebuilt correctly.
    p = where.disparity(g_full)
    rebuilt_backbone = sorted(
        (tuple(sorted((u, v))), round(float(g_full[u][v]["weight"]), 3))
        for (u, v), pv in p.items() if pv < where.DEFAULT_ALPHA)
    page_backbone_edges = sorted(
        (tuple(sorted((u, v))), w) for u, v, w in place["backbone"]["graphs"]["0.2"]["edges"])
    assert rebuilt_backbone == page_backbone_edges, \
        "the rebuilt alpha-0.2 backbone does not match week04_place.json's backbone"

    page_communities = []
    for c in place["communities"]:
        page_communities.append({m for m in page_ids_order if page_partition[m] == c["id"]})
    q_page = nx.community.modularity(g_full, page_communities, weight="weight")
    print(f"Q of the page partition on the full weighted network: {q_page:.4f} "
          f"(week04_place.json null_model.Q = {place['null_model']['Q']})")
    assert round(q_page, 3) == place["null_model"]["Q"], \
        "the page partition's Q on the full network must match null_model.Q"

    backbone_nodes = place["backbone"]["graphs"]["0.2"]["nodes"]
    backbone = nx.Graph()
    backbone.add_nodes_from(backbone_nodes)
    backbone.add_edges_from((u, v) for u, v, _ in place["backbone"]["graphs"]["0.2"]["edges"])
    assert backbone.number_of_nodes() == len(backbone_nodes) and \
        backbone.number_of_edges() == len(place["backbone"]["graphs"]["0.2"]["edges"]), \
        "the alpha-0.2 backbone must have the page's nodes and links"

    gn = girvan_newman(backbone)
    print(f"Girvan-Newman best level: step {gn['best']['step']}, "
          f"{gn['best']['components']} components, Q = {gn['best']['Q']}")

    # Louvain: search seeds cheaply (no recording) for one matching the page's
    # 3 communities; fall back to the highest-Q seed.
    m_total = g_full.size(weight="weight")
    page_frozen = frozenset(frozenset(c) for c in page_communities)
    best_seed, best_q, chosen_seed, chosen_reason = None, -1, None, None
    for s in range(LOUVAIN_SEED_TRIES):
        partition, q, _ = run_louvain(g_full, s, m_total, record=False)
        parts_by_label = {}
        for node, c in partition.items():
            parts_by_label.setdefault(c, set()).add(node)
        frozen = frozenset(frozenset(v) for v in parts_by_label.values())
        if frozen == page_frozen:
            chosen_seed, chosen_reason = s, f"matches the page's {len(page_communities)} communities exactly"
            break
        if q > best_q:
            best_q, best_seed = q, s
    if chosen_seed is None:
        chosen_seed = best_seed
        chosen_reason = f"no seed among 0..{LOUVAIN_SEED_TRIES - 1} matched the page partition; " \
                        f"kept the highest-Q seed instead (Q = {round(best_q, 4)})"
    print(f"Louvain seed kept: {chosen_seed} ({chosen_reason})")

    # run_louvain() already asserts, for every recorded move of this seed,
    # that the gain matches a fresh Q_after - Q_before within 1e-9; only the
    # final Q needs a second, independent check here.
    final_partition, final_q, levels = run_louvain(g_full, chosen_seed, m_total, record=True)
    fresh_final_parts = {}
    for node, c in final_partition.items():
        fresh_final_parts.setdefault(c, set()).add(node)
    fresh_final_q = nx.community.modularity(g_full, list(fresh_final_parts.values()), weight="weight")
    assert abs(fresh_final_q - final_q) < 1e-9, "final Q does not match a fresh modularity computation"
    nmi_with_page = nmi([page_partition[n] for n in page_ids_order],
                         [final_partition[n] for n in page_ids_order])
    print(f"Louvain final: {len(fresh_final_parts)} communities, Q = {round(final_q, 4)}, "
          f"NMI with the page partition = {round(nmi_with_page, 4)}")

    # k-clique communities on the unweighted backbone.
    by_k = {}
    for k in K_CLIQUES:
        comms = [sorted(c) for c in nx.community.k_clique_communities(backbone, k)]
        comms.sort()
        # networkx's own count, recomputed independently, as the check the
        # brief asks for against a transcription bug in the reshape above.
        assert len(comms) == len(list(nx.community.k_clique_communities(backbone, k))), \
            f"k={k}: community count changed between the two calls"
        counts = {}
        for c in comms:
            for m2 in c:
                counts[m2] = counts.get(m2, 0) + 1
        in_two_or_more = sorted(m2 for m2, n in counts.items() if n >= 2)
        in_none = sorted(m2 for m2 in backbone.nodes() if m2 not in counts)
        by_k[str(k)] = {"communities": comms, "in_two_or_more": in_two_or_more, "in_none": in_none}
        print(f"k={k}: {len(comms)} k-clique communities, {len(in_two_or_more)} metros in 2+, "
              f"{len(in_none)} in none")

    # Link communities on the unweighted backbone, same call as
    # week04_jobs_split.q2().
    nodes, idx, edges, pairs_i, pairs_j, sims = link_similarities(backbone)
    cut = partition_density_cut(idx, edges, pairs_i, pairs_j, sims, time.time())
    assert cut is not None, "link-community cut did not finish"
    link_cluster = cut["link_cluster"]
    sizes = Counter(link_cluster)
    kept_clusters = sorted(c for c, n in sizes.items() if n >= 2)
    cluster_index = {c: i for i, c in enumerate(kept_clusters)}
    communities_out = [[] for _ in kept_clusters]
    by_metro = {n: [] for n in nodes}
    for ei, (u, v) in enumerate(edges):
        c = link_cluster[ei]
        if c in cluster_index:
            i = cluster_index[c]
            communities_out[i].append([u, v])
            for m2 in (u, v):
                if i not in by_metro[m2]:
                    by_metro[m2].append(i)
    communities_out = [sorted(tuple(sorted(e)) for e in comm) for comm in communities_out]
    print(f"link communities: D = {round(cut['D'], 4)} at similarity {round(cut['cut_similarity'], 4)}, "
          f"{len(communities_out)} communities of 2+ links")

    explore = {
        "generated_by": "analysis/week04_explore.py",
        "year": YEAR,
        "metros": metros_page,
        "full": {"edges": [[u, v, w] for u, v, w in full_edges],
                 "total_weight": float(m_total), "Q_page_partition": round(float(q_page), 4)},
        "girvan_newman": gn,
        "louvain": {
            "seed": chosen_seed,
            "levels": levels,
            "final": {"partition": final_partition, "Q": round(float(final_q), 4),
                      "nmi_with_page": round(float(nmi_with_page), 4)},
        },
        "k_cliques": {"graph": "backbone alpha 0.2", "by_k": by_k},
        "link_communities": {"graph": "backbone alpha 0.2", "D": round(float(cut["D"]), 4),
                              "communities": communities_out, "by_metro": by_metro},
    }
    check(PAGE, explore)
    PAGE.parent.mkdir(parents=True, exist_ok=True)
    PAGE.write_text(json.dumps(explore, indent=1, ensure_ascii=False) + "\n")
    seconds = round(time.time() - started)
    print(f"{seconds}s total -> {PAGE.relative_to(ROOT)}")


if __name__ == "__main__":
    sys.exit(main())
