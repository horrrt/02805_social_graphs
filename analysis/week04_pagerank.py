"""Week 4 deep dive: PageRank on the jobs network, step by step.

Network: the same companies x occupations projection as week04_jobs.py (FY2025,
certified H-1B, two occupations linked when the same companies file for both),
kept to its strongest ties: the disparity-filter backbone (week04_where.disparity)
at alpha = 0.05, the stricter end of the sweep section 1 already walks the reader
through. Section 2's own page keeps a looser alpha = 0.2 backbone for its cluster
check; a stricter cut here is a deliberate, separate choice, made so the ranking
has to lean on network position, not just how many partners an occupation has: at
alpha = 0.2 PageRank agrees with plain unweighted degree on 14 of its top 15 (a
probe kept in review/week04-redesign/ notes, not committed), which teaches
nothing a bar chart of degree would not.

Why this network and not the firm -> client staffing network from section 3: a
firm has no incoming edges and a client no outgoing ones, so every firm ends up
with the same score (there is nothing to distinguish them by) and the damping
factor only rescales every client's score by a constant, never reorders them.
Tried and confirmed by hand before this script was written; not reproduced
here because it would only be a network that provably cannot answer the
question the box asks.

Questions
- Does raising the damping factor (how much a step trusts the network instead
  of jumping to a random occupation) change which occupations rank highest?
- Does PageRank agree with simply counting how many other occupations an
  occupation is tied to (degree), or with how many companies drive those ties
  (strength, the projection's own edge weight)?
- Walked a few rounds at a time, how many steps does the ranking need before
  it looks like its converged order?

Method
- nx.pagerank at three damping factors (0.5, 0.85, 0.99), weighted by the
  projection's edge weight (shared companies).
- A from-scratch power iteration (equal start, alpha's damping, uniform
  teleport; no dangling correction needed, every backbone node has at least
  one tie) reproduces nx.pagerank's d = 0.85 result to 1e-6 and supplies the
  step-by-step ranking the reader steps through.
- "Movers": among the 40 occupations ranked highest at d = 0.85, the ones
  whose rank changes most between d = 0.5 and d = 0.99, alongside their
  unweighted degree rank, so the reveal can name a concrete case of the
  network-position effect instead of asserting it.

Output: docs/weeks/week04/data/pagerank.json (every number the box quotes).
"""

import json
import time
from pathlib import Path

import networkx as nx
import numpy as np

import week04_where as where
from week04_jobs import filtered, giant_of, projection, titles_of
from week04_schemas import check

ROOT = Path(__file__).resolve().parents[1]
PAGE = ROOT / "docs/weeks/week04/data/pagerank.json"
YEAR = 2025
ALPHA = 0.05  # stricter than section 2's own alpha = 0.2 backbone; see the docstring
DAMPING = (0.5, 0.85, 0.99)
DEFAULT_D = 0.85
STEPS = (0, 1, 2, 3, 5, 10, 60)
TOP_N = 20
MOVER_POOL = 40  # occupations ranked in the top N of this many, by d = 0.85
MOVERS_SHOWN = 8


def backbone():
    """The occupation projection's giant component, then its disparity-filter
    backbone at ALPHA, then that backbone's own giant component (a stricter
    filter can itself split the network into pieces)."""
    frame = filtered(YEAR)
    full, filings = projection(frame)
    giant = giant_of(full)
    p = where.disparity(giant)
    g = nx.Graph()
    g.add_nodes_from(giant.nodes())
    for (u, v), pv in p.items():
        if pv < ALPHA:
            g.add_edge(u, v, weight=giant[u][v]["weight"])
    g.remove_nodes_from(list(nx.isolates(g)))
    comp = max(nx.connected_components(g), key=len)
    return g.subgraph(comp).copy(), full, filings, titles_of(frame)


def power_iteration(g, alpha, steps):
    """Plain power iteration with uniform teleport, no dangling correction
    needed (every node here has at least one edge). Returns {step: {node: score}}."""
    nodes = list(g.nodes())
    n = len(nodes)
    index = {node: i for i, node in enumerate(nodes)}
    w = nx.to_scipy_sparse_array(g, nodelist=nodes, weight="weight", format="csr").astype(float)
    out = np.asarray(w.sum(axis=1)).ravel()
    score = np.full(n, 1.0 / n)
    rows = {0: dict(zip(nodes, score))}
    for step in range(1, max(steps) + 1):
        score = (1 - alpha) / n + alpha * (w.T @ (score / out))
        if step in steps:
            rows[step] = dict(zip(nodes, score))
    return rows, index


def ranked_rows(scores, titles, filings, degree, strength, degree_rank, limit):
    order = sorted(scores, key=lambda n: -scores[n])[:limit]
    return [
        {"code": n, "title": titles.get(n, n), "filings": int(filings.get(n, 0)),
         "degree": int(degree[n]), "strength": int(strength[n]), "degree_rank": int(degree_rank[n]),
         "pagerank": round(float(scores[n]), 5), "rank": i + 1}
        for i, n in enumerate(order)
    ]


def main():
    start = time.time()
    g, full, filings, titles = backbone()
    degree = dict(g.degree())
    strength = dict(g.degree(weight="weight"))
    # Plain unweighted degree rank over every node of the backbone, not just
    # the top N exported per damping factor: the badge must not move with d.
    degree_rank = {n: i + 1 for i, n in enumerate(sorted(g.nodes(), key=lambda n: -degree[n]))}

    # A tight tolerance so nx.pagerank settles at the same fixed point our own
    # power iteration below is checked against, not at nx's default early stop.
    pageranks = {d: nx.pagerank(g, alpha=d, weight="weight", tol=1e-14, max_iter=2000) for d in DAMPING}
    rankings = {str(d): ranked_rows(pageranks[d], titles, filings, degree, strength, degree_rank, TOP_N)
                for d in DAMPING}

    iter_rows, index = power_iteration(g, DEFAULT_D, STEPS)
    final_check = max(abs(iter_rows[max(STEPS)][n] - pageranks[DEFAULT_D][n]) for n in g.nodes())
    if final_check > 1e-6:
        raise SystemExit(f"power_iteration disagrees with nx.pagerank by {final_check}, expected <= 1e-6")
    # Each step's own top 10 by that step's score, in that order: at an early
    # step the leading occupations need not be the ones that lead once the
    # walk has converged, so a fixed list (the final top 10) would mislabel them.
    iteration = {
        "alpha": DEFAULT_D,
        "steps": [
            {"step": step,
             "rows": [{"code": n, "title": titles.get(n, n), "pagerank": round(float(iter_rows[step][n]), 5)}
                      for n in sorted(iter_rows[step], key=lambda n: -iter_rows[step][n])[:10]]}
            for step in STEPS
        ],
        "max_error_vs_nx_pagerank": round(final_check, 8),
    }

    # "Movers": among the MOVER_POOL occupations ranked highest at d = 0.85,
    # the ones whose rank shifts most between d = 0.5 and d = 0.99 -- but the
    # rank itself is each occupation's true rank over every node in the
    # backbone, not just within that pool, so "rank 5 -> 45" means the network
    # rank, not a rank inside an arbitrary 40-occupation shortlist.
    pool = sorted(pageranks[DEFAULT_D], key=lambda n: -pageranks[DEFAULT_D][n])[:MOVER_POOL]
    rank_lo = {n: i + 1 for i, n in enumerate(sorted(g.nodes(), key=lambda n: -pageranks[0.5][n]))}
    rank_hi = {n: i + 1 for i, n in enumerate(sorted(g.nodes(), key=lambda n: -pageranks[0.99][n]))}
    movers = sorted(pool, key=lambda n: -abs(rank_lo[n] - rank_hi[n]))[:MOVERS_SHOWN]
    mover_rows = [
        {"code": n, "title": titles.get(n, n),
         "rank_d0_5": rank_lo[n], "rank_d0_99": rank_hi[n], "rank_shift": rank_lo[n] - rank_hi[n],
         "degree_rank": degree_rank[n], "degree": int(degree[n]), "strength": int(strength[n]),
         "pagerank_d0_5": round(float(pageranks[0.5][n]), 5), "pagerank_d0_99": round(float(pageranks[0.99][n]), 5)}
        for n in movers
    ]

    top85 = rankings[str(DEFAULT_D)]
    pr_top15 = {row["code"] for row in top85[:15]}
    degree_top15 = {n for n in sorted(g.nodes(), key=lambda n: -degree[n])[:15]}
    strength_top15 = {n for n in sorted(g.nodes(), key=lambda n: -strength[n])[:15]}
    top15_0_5 = {row["code"] for row in rankings["0.5"][:15]}
    top15_0_99 = {row["code"] for row in rankings["0.99"][:15]}

    seconds = round(time.time() - start, 1)
    page = {
        "meta": {
            "generated_by": "analysis/week04_pagerank.py", "year": YEAR, "seconds": seconds,
            "network": "Companies x occupations projection (week04_jobs.py), disparity-filter "
                       "backbone at alpha = 0.05, giant component",
            "alpha_filter": ALPHA, "section2_alpha_filter": where.DEFAULT_ALPHA,
            "nodes": g.number_of_nodes(), "edges": g.number_of_edges(),
            "nodes_before_backbone": full.number_of_nodes(), "edges_before_backbone": full.number_of_edges(),
        },
        "damping": list(DAMPING),
        "rankings": rankings,
        "iteration": iteration,
        "movers": mover_rows,
        "finding": {
            "top15_overlap_d0_5_vs_d0_99": len(top15_0_5 & top15_0_99),
            "pagerank_vs_degree_top15_overlap": len(pr_top15 & degree_top15),
            "pagerank_vs_strength_top15_overlap": len(pr_top15 & strength_top15),
            "top_occupation": top85[0]["code"], "top_occupation_title": top85[0]["title"],
        },
    }
    check(PAGE, page)
    PAGE.write_text(json.dumps(page, indent=1, ensure_ascii=False) + "\n")

    print(f"seconds: {seconds}")
    print("network:", page["meta"])
    print("finding:", page["finding"])
    print("movers:", json.dumps(mover_rows, indent=1))


if __name__ == "__main__":
    main()
