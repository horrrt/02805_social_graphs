"""Week 4, section 1 follow-up: two questions posed against week04_where.py.

Network: the same company x metro projection as analysis/week04_where.py
(FY2025, certified H-1B, the TOP = 40 metros by filings, project(pairs, top)),
and the same modal Louvain partition over 100 runs, reproduced here rather than
re-imported so this script stands alone; it is asserted against
analysis/week04_where.json and docs/assets/data/week04_place.json before
anything else runs.

Questions
- Q1: do metros group by who hires there (staffing share, sector mix) instead
  of by Census region or division?
- Q2: at which alpha does the disparity-filter backbone break, and whose
  filings carry the links that break it?

Method, Q1
- Four label sets on the 40 metros: Census region (4 values), Census division
  (9 values), a tercile of the metro's placed share (its share of filings with
  SECONDARY_ENTITY starting "Y"), a tercile of its NAICS 54 share (its share of
  filings whose own NAICS_CODE starts with "54"). A filing counts once per
  metro it names, the same rule as where.py's per_case.
- Each label set is scored against the modal partition with NMI and AMI
  (sklearn adjusted_mutual_info_score). AMI is what decides the answer,
  because it is corrected for chance agreement given the number of labels, so
  the 9-value division label is not handed an advantage over a 3-value
  tercile purely by having more categories to match against. A 1,000-shuffle
  test on AMI gives each score a p-value.
- The same four AMIs are also taken against every one of the 100 Louvain runs
  (median over the 100), because where.py found the partition unstable (two
  distinct partitions turn up over 100 seeds): the modal-partition number
  could be a one-seed accident, so the median across seeds is reported beside
  it, though the yes/no call is made on the modal partition alone, as asked.
- "Yes, by who hires" only if a who-hires label's AMI beats both Census
  labels' AMI on the modal partition, and that label's shuffle p < 0.05.

Method, Q2
- The disparity filter's p-values (Serrano, Boguna and Vespignani 2009) on the
  full 40-metro projection, exactly where.py's disparity(g). Distinct
  p-values are swept in decreasing order (least significant first); each step
  removes every edge at that p (a handful of ties are grouped and reported as
  one step) and records the giant component's size at alpha set to that p
  (the kept condition is p < alpha, so alpha = p excludes edges at exactly
  that p and keeps every smaller one).
- (a) the alpha where the giant component first drops below 40 metros.
- (b) the single step with the largest drop in giant component size (ties
  reported); this can be far smaller than the coarse ALPHAS sweep's 32 -> 19
  collapse between alpha 0.1 and 0.05, because that collapse can be a cascade
  of many single-metro peels rather than one snapping link, which is exactly
  what turns out to be the case here.
- (c) every link lost between alpha 0.1 and 0.05 that ties a metro still in
  the alpha-0.1 giant component to one that falls off by alpha 0.05, plus the
  link found in (b); each link's leading employer (largest share of the
  link's weight, where.py's longhaul method) and whether that employer is in
  SHORTLIST. A hypergeom test compares the share of breaking links led by a
  shortlist firm against the alpha-0.2 backbone's own share (70 of 180, from
  week04_where.json's longhaul: 22 of 83 long links, 48 of 97 short links).

Checks
- The reproduced modal partition must have 3 communities and Q rounding to
  0.049, and match analysis/week04_where.json's null_model exactly (Q,
  modal_runs, partitions_found); the per-metro community must also match
  docs/assets/data/week04_place.json's cities[].community. Any mismatch stops
  the script rather than silently reporting on a different partition.
- Almost every metro has NAICS 54 (professional/technical/scientific
  services) as its single most common 2-digit code (naics54_dominant_metros
  below), which is why a share/tercile is used instead of a plain "is 54
  dominant" label: the plain label would carry almost no variance to test.
- The 1,000-shuffle null for each label set: what would make Q1 "no" is every
  who-hires label failing to beat both Census AMIs, or having p >= 0.05.
- Q2's null: if the breaking links' share led by a shortlist firm is not
  below the alpha-0.2 backbone's own share (or the hypergeom p is not small),
  the break is not concentrated in a handful of staffing firms.

Outputs: analysis/week04_where_who.json (every number, with the checks) and
docs/weeks/week04/data/where_who.json (the page's numbers, name "where_who").
"""

import json
import random
import time
from collections import Counter
from pathlib import Path

import networkx as nx
import numpy as np
import pandas as pd
from scipy.stats import hypergeom
from sklearn.metrics import adjusted_mutual_info_score as ami
from sklearn.metrics import normalized_mutual_info_score as nmi

import week04_where as where
from week04_schemas import check

ROOT = Path(__file__).resolve().parents[1]
OUT = Path(__file__).with_suffix(".json")
PAGE = ROOT / "docs/weeks/week04/data/where_who.json"
WHERE_JSON = Path(__file__).with_name("week04_where.json")
PLACE_JSON = ROOT / "docs/assets/data/week04_place.json"
SEED = where.SEED
RUNS = where.RUNS
SHUFFLES = 1000
BREAK_LO, BREAK_HI = 0.05, 0.1  # the coarse window Q2c inspects, as the brief names it
MAX_SWEEP_POINTS = 200


def shuffled_ami(a, b, rng, times=SHUFFLES):
    """Observed AMI, and the share of label shuffles that match or beat it."""
    observed = ami(a, b)
    b = list(b)
    beats = 0
    for _ in range(times):
        rng.shuffle(b)
        beats += ami(a, b) >= observed
    return float(observed), (beats + 1) / (times + 1)


def rebuild_network():
    """Exactly where.py's main() up to project(pairs, top): same metros, same
    filings, same top-40 list, same weighted projection."""
    lookup, town_lookup, gaz = where.metros()
    sites, lca, stats = where.worksite_metros(lookup, town_lookup)
    per_case = sites.drop_duplicates(["CASE_NUMBER", "metro"])
    pairs = per_case.groupby(["employer", "metro"]).size().rename("filings").reset_index()
    filings = per_case.groupby("metro").size().sort_values(ascending=False)
    top = list(filings.head(where.TOP).index)
    g = where.project(pairs, top)
    return dict(gaz=gaz, lca=lca, per_case=per_case, pairs=pairs, filings=filings, top=top, g=g)


def modal_partition(g, top, filings):
    """where.py's modal-partition recipe: 100 Louvain runs, the partition found
    most often (ties broken by modularity), renumbered biggest-filings-first."""
    runs = [where.louvain(g, SEED + r)[0] for r in range(RUNS)]
    found = Counter(frozenset(frozenset(c) for c in part) for part in runs)
    q_of = {k: nx.community.modularity(g, [set(c) for c in k], weight="weight") for k in found}
    modal = max(found, key=lambda k: (found[k], q_of[k]))
    best = [set(c) for c in sorted(modal, key=lambda c: (-len(c), min(c)))]
    member = {m: i for i, part in enumerate(best) for m in part}
    order = sorted(range(len(best)), key=lambda k: -sum(filings[m] for m in best[k]))
    renumber = {old: new for new, old in enumerate(order)}
    community_of = {m: renumber[member[m]] for m in top}
    run_labels = [{m: i for i, part in enumerate(c) for m in part} for c in runs]
    return {
        "community_of": community_of, "q_modal": float(q_of[modal]),
        "modal_runs": found[modal], "partitions_found": len(found),
        "communities": len(best), "run_labels": run_labels,
    }


def check_reproduction(recon):
    """Stops the script if this reproduction disagrees with week04_where.json
    or week04_place.json, per the task's stop-and-report rule."""
    published = json.loads(WHERE_JSON.read_text())["null_model"]
    place = json.loads(PLACE_JSON.read_text())
    page_comm = {c["id"]: c["community"] for c in place["cities"]}
    problems = []
    if recon["communities"] != 3:
        problems.append(f"communities: got {recon['communities']}, expected 3")
    if round(recon["q_modal"], 3) != 0.049:
        problems.append(f"Q: got {round(recon['q_modal'], 3)}, expected 0.049")
    if recon["modal_runs"] != published["modal_runs"]:
        problems.append(f"modal_runs: got {recon['modal_runs']}, expected {published['modal_runs']}")
    if recon["partitions_found"] != published["partitions_found"]:
        problems.append(f"partitions_found: got {recon['partitions_found']}, expected {published['partitions_found']}")
    mismatches = [m for m, c in recon["community_of"].items() if c != page_comm.get(m)]
    if mismatches:
        problems.append(f"{len(mismatches)} metros disagree with week04_place.json's community ids: {mismatches}")
    if problems:
        raise SystemExit("Modal partition does not match week04_where.json / week04_place.json:\n"
                          + "\n".join(f"  - {p}" for p in problems))


def q1_who_hires(net, community_of, run_labels, rng):
    per_case, top, gaz, lca = net["per_case"], net["top"], net["gaz"], net["lca"]
    pc = (per_case[per_case["metro"].isin(top)][["CASE_NUMBER", "metro"]]
          .merge(lca[["CASE_NUMBER", "SECONDARY_ENTITY", "NAICS_CODE"]], on="CASE_NUMBER", how="left"))
    pc["placed"] = pc["SECONDARY_ENTITY"].astype(str).str.upper().str.startswith("Y")
    naics = pc["NAICS_CODE"].astype(str).str.strip()
    blank_naics = int(((naics == "") | naics.isna() | (naics == "nan")).sum())
    pc["naics2"] = naics.str[:2]
    pc["n54"] = pc["naics2"] == "54"

    placed_share = pc.groupby("metro")["placed"].mean().loc[top]
    naics54_share = pc.groupby("metro")["n54"].mean().loc[top]
    dominant = pc.groupby("metro")["naics2"].agg(lambda s: s.value_counts().index[0]).loc[top]
    naics54_dominant_metros = int((dominant == "54").sum())

    placed_tercile = pd.qcut(placed_share.rank(method="first"), 3, labels=["low", "mid", "high"])
    naics54_tercile = pd.qcut(naics54_share.rank(method="first"), 3, labels=["low", "mid", "high"])

    region_of = {m: where.REGION[where.first_state(gaz.loc[m, "NAME"])] for m in top}
    division_of = {m: where.DIVISION[where.first_state(gaz.loc[m, "NAME"])] for m in top}

    comm = [community_of[m] for m in top]
    label_sets = {
        "census_region": [region_of[m] for m in top],
        "census_division": [division_of[m] for m in top],
        "placed_share_tercile": [placed_tercile[m] for m in top],
        "naics54_share_tercile": [naics54_tercile[m] for m in top],
    }
    scores = {}
    for name, labs in label_sets.items():
        nmi_val = float(nmi(comm, labs))
        ami_val, p_val = shuffled_ami(comm, labs, rng)
        median_ami_runs = float(np.median([ami([run[m] for m in top], labs) for run in run_labels]))
        scores[name] = {"nmi": round(nmi_val, 3), "ami": round(ami_val, 3),
                        "p_shuffle": round(p_val, 4), "median_ami_over_100_runs": round(median_ami_runs, 3)}

    who_hires = ["placed_share_tercile", "naics54_share_tercile"]
    census = ["census_region", "census_division"]
    census_best_ami = max(scores[c]["ami"] for c in census)
    winners = [w for w in who_hires if scores[w]["ami"] > census_best_ami and scores[w]["p_shuffle"] < 0.05]
    answer = "yes, by who hires" if winners else "no"

    rows = []
    for m in top:
        rows.append({
            "id": m, "name": None,  # filled by caller, which has the metro-name lookup
            "community": community_of[m], "region": region_of[m], "division": division_of[m],
            "placed_share": round(float(placed_share[m]), 4),
            "naics54_share": round(float(naics54_share[m]), 4),
            "placed_share_tercile": str(placed_tercile[m]),
            "naics54_share_tercile": str(naics54_tercile[m]),
        })

    return {
        "coverage": {"filings_scored": int(len(pc)), "blank_naics_code": blank_naics,
                     "metros": len(top), "naics54_dominant_metros": naics54_dominant_metros},
        "scores": scores, "answer": answer, "who_hires_labels": who_hires,
        "census_labels": census, "winners": winners, "shuffles": SHUFFLES,
        "rows": rows,
    }


def kept_graph(g, p, top, alpha):
    kept = [(u, v, g[u][v]["weight"]) for (u, v), pv in p.items() if pv < alpha]
    h = nx.Graph()
    h.add_nodes_from(top)
    h.add_weighted_edges_from(kept)
    giant = max(nx.connected_components(h), key=len) if h.number_of_edges() else set()
    return h, giant


def leader_of(u, v, per_employer, weight):
    """where.py's longhaul rule: the employer with the largest share of a
    link's weight (min of its filings at each end), and that share."""
    share = {e: min(f[u], f[v]) for e, f in per_employer.items() if u in f and v in f}
    who = max(share, key=share.get)
    return who, share[who] / weight


def q2_backbone_break(net, by_name):
    g, top = net["g"], net["top"]
    p = where.disparity(g)
    n_edges = len(p)
    n_distinct = len(set(p.values()))

    lca = net["lca"]
    placed = lca[lca["SECONDARY_ENTITY"].str.upper().str.startswith("Y")]
    shortlist = list(placed["employer"].value_counts().head(where.SHORTLIST).index)
    grouped = net["pairs"][net["pairs"]["metro"].isin(top)].set_index(["employer", "metro"])["filings"]
    per_employer = {e: grp.droplevel(0).to_dict() for e, grp in grouped.groupby(level=0)}

    # Sweep every distinct p, decreasing (least significant edges first).
    distinct_desc = sorted(set(p.values()), reverse=True)
    h = g.copy()
    sweep = [{"alpha": 1.0, "gc_size": len(max(nx.connected_components(h), key=len))}]
    steps = []
    for val in distinct_desc:
        edges_here = [(u, v) for (u, v), pv in p.items() if pv == val]
        before = sweep[-1]["gc_size"]
        h.remove_edges_from(edges_here)
        comps = list(nx.connected_components(h))
        giant = max(comps, key=len) if comps else set()
        after = len(giant)
        sweep.append({"alpha": val, "gc_size": after})
        steps.append({"alpha": val, "edges": edges_here, "before": before, "after": after, "drop": before - after})

    ties_grouped = sum(1 for s in steps if len(s["edges"]) > 1)

    # (a) first drop below 40.
    first_below = next(s for s in steps if s["after"] < 40)
    prev_alpha = next((s["alpha"] for s in reversed(steps) if s["alpha"] > first_below["alpha"] and s["after"] == 40), 1.0)
    part_a = {
        "alpha_still_40": prev_alpha, "alpha_drops_below_40": first_below["alpha"],
        "edges_removed": first_below["edges"], "gc_after": first_below["after"],
    }

    # (b) the single step with the largest drop.
    max_drop = max(s["drop"] for s in steps)
    top_steps = [s for s in steps if s["drop"] == max_drop]
    part_b = {
        "drop": max_drop, "tied_steps": len(top_steps),
        "steps": [{
            "alpha": s["alpha"], "edges": [[u, v] for u, v in s["edges"]],
            "weight": [int(g[u][v]["weight"]) for u, v in s["edges"]],
            "gc_before": s["before"], "gc_after": s["after"],
        } for s in top_steps],
        "note": ("This is the largest single-link drop found anywhere in the sweep; it does not "
                 "fall in the coarse 0.1-0.05 window that shows the 32 -> 19 collapse, because that "
                 "collapse turns out to be a cascade of many one-metro peels rather than one break."),
    }

    # (c) the coarse 0.1 / 0.05 window: which links tie a surviving metro to one that falls off.
    h01, gc01 = kept_graph(g, p, top, BREAK_HI)
    h005, gc005 = kept_graph(g, p, top, BREAK_LO)
    fallen = gc01 - gc005
    lost = [(u, v) for (u, v), pv in p.items() if BREAK_LO <= pv < BREAK_HI]
    breaking = [(u, v) for u, v in lost
                if (u in gc005 and v in fallen) or (v in gc005 and u in fallen)]
    redundant = len(lost) - len(breaking)

    def link_row(u, v):
        who, share = leader_of(u, v, per_employer, g[u][v]["weight"])
        return {
            "a": u, "b": v, "a_name": by_name[u], "b_name": by_name[v],
            "alpha": p.get((u, v), p.get((v, u))),
            "weight": int(g[u][v]["weight"]),
            "top_employer": where.label(who), "top_share": round(share, 3),
            "shortlist": who in shortlist,
        }

    breaking_rows = [link_row(u, v) for u, v in breaking]
    b_link_rows = [link_row(u, v) for step in top_steps for u, v in step["edges"]]
    all_flagged = breaking_rows + [r for r in b_link_rows if r not in breaking_rows]
    led_by_shortlist = sum(r["shortlist"] for r in all_flagged)

    backbone_02 = json.loads(WHERE_JSON.read_text())["longhaul"]
    backbone_total = backbone_02["backbone_links"]
    backbone_shortlist = backbone_02["long_led_by_shortlist"] + backbone_02["short_led_by_shortlist"]
    # Two-tailed-in-spirit: which side of the alpha-0.2 backbone's own rate the
    # observed count falls on decides whether cdf or sf is the informative tail.
    expected = len(all_flagged) * backbone_shortlist / backbone_total if all_flagged else None
    if all_flagged:
        dist = hypergeom(backbone_total, backbone_shortlist, len(all_flagged))
        p_hyper = float(dist.cdf(led_by_shortlist)) if led_by_shortlist <= expected else float(dist.sf(led_by_shortlist - 1))
    else:
        p_hyper = None

    part_c = {
        "window": [BREAK_LO, BREAK_HI], "gc_at_0.1": len(gc01), "gc_at_0.05": len(gc005),
        "fallen_metros": sorted(by_name[m] for m in fallen),
        "links_lost_in_window": len(lost), "links_lost_redundant": redundant,
        "breaking_links": breaking_rows, "breaking_links_count": len(breaking_rows),
        "b_links_included": [r for r in b_link_rows if r not in breaking_rows],
        "led_by_shortlist": led_by_shortlist, "flagged_links": len(all_flagged),
        "backbone_alpha02_total": backbone_total, "backbone_alpha02_shortlist": backbone_shortlist,
        "backbone_alpha02_shortlist_share": round(backbone_shortlist / backbone_total, 3),
        "flagged_shortlist_share": round(led_by_shortlist / len(all_flagged), 3) if all_flagged else None,
        "hypergeom_expected_shortlist": round(expected, 2) if expected is not None else None,
        "hypergeom_p": round(p_hyper, 4) if p_hyper is not None else None,
    }

    # Thin the sweep for the page: keep every point where gc changes, plus the point before it.
    keep_idx = {0}
    for i in range(1, len(sweep)):
        if sweep[i]["gc_size"] != sweep[i - 1]["gc_size"]:
            keep_idx.add(i - 1)
            keep_idx.add(i)
    keep_idx.add(len(sweep) - 1)
    changed = sorted(keep_idx)
    if len(changed) > MAX_SWEEP_POINTS:
        # Keep every changed point (there are only ~40) plus an even spacing of the rest.
        extra_budget = MAX_SWEEP_POINTS - len(changed)
        rest = [i for i in range(len(sweep)) if i not in keep_idx]
        step = max(1, len(rest) // max(1, extra_budget))
        changed = sorted(set(changed) | set(rest[::step]))
    thinned = [{"alpha": float(f'{sweep[i]["alpha"]:.4g}'), "gc_size": sweep[i]["gc_size"]} for i in changed]

    return {
        "coverage": {"edges": n_edges, "distinct_p": n_distinct, "tie_steps_grouped": ties_grouped},
        "part_a": part_a, "part_b": part_b, "part_c": part_c,
        "sweep_thinned": thinned, "sweep_points": len(thinned),
    }


def main():
    start = time.time()
    rng = random.Random(SEED)
    net = rebuild_network()
    g, top, filings, gaz = net["g"], net["top"], net["filings"], net["gaz"]
    by_name = {m: gaz.loc[m, "NAME"].split(",")[0].split("-")[0] for m in top}

    recon = modal_partition(g, top, filings)
    check_reproduction(recon)

    q1 = q1_who_hires(net, recon["community_of"], recon["run_labels"], rng)
    for row in q1["rows"]:
        row["name"] = by_name[row["id"]]

    q2 = q2_backbone_break(net, by_name)

    seconds = round(time.time() - start, 1)
    summary = {
        "generated_by": "analysis/week04_where_who.py", "year": where.YEAR, "seconds": seconds,
        "reproduction": {
            "communities": recon["communities"], "Q": round(recon["q_modal"], 3),
            "modal_runs": recon["modal_runs"], "partitions_found": recon["partitions_found"],
            "matches_week04_where": True,
        },
        "q1_who_hires": q1,
        "q2_backbone_break": q2,
    }
    OUT.write_text(json.dumps(summary, indent=1, ensure_ascii=False) + "\n")

    page = {
        "meta": {
            "name": "where_who", "year": where.YEAR,
            "note": "Section 1 follow-up: do the 40 metros group by who hires there, and where "
                    "does the disparity-filter backbone actually break?",
        },
        "rows": q1["rows"],
        "finding": {
            "q1_answer": q1["answer"],
            "q1_best_who_hires_ami": max((q1["scores"][w]["ami"] for w in q1["who_hires_labels"]), default=None),
            "q1_best_census_ami": max(q1["scores"][c]["ami"] for c in q1["census_labels"]),
            "q1_scores": q1["scores"],
            "naics54_dominant_metros": q1["coverage"]["naics54_dominant_metros"],
            "q2_alpha_drops_below_40": q2["part_a"]["alpha_drops_below_40"],
            "q2_max_single_drop": q2["part_b"]["drop"],
            "q2_breaking_links_led_by_shortlist": q2["part_c"]["led_by_shortlist"],
            "q2_breaking_links_flagged": q2["part_c"]["flagged_links"],
            "q2_backbone_shortlist_share": q2["part_c"]["backbone_alpha02_shortlist_share"],
            "q2_flagged_shortlist_share": q2["part_c"]["flagged_shortlist_share"],
            "q2_hypergeom_p": q2["part_c"]["hypergeom_p"],
        },
        "backbone_sweep": q2["sweep_thinned"],
        "break": q2["part_b"],
        "breaking_links": q2["part_c"]["breaking_links"],
    }
    check(PAGE, page)
    PAGE.write_text(json.dumps(page, indent=1, ensure_ascii=False) + "\n")

    print(f"seconds: {seconds}")
    print("reproduction:", summary["reproduction"])
    print("q1 scores:", json.dumps(q1["scores"], indent=1))
    print("q1 answer:", q1["answer"], "winners:", q1["winners"])
    print("q2 part_a:", q2["part_a"])
    print("q2 part_b:", {k: v for k, v in q2["part_b"].items() if k != "steps"})
    print("q2 part_c summary:", {k: v for k, v in q2["part_c"].items()
                                  if k not in ("breaking_links", "b_links_included")})


if __name__ == "__main__":
    main()
