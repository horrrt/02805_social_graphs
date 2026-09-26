"""Week 4, section 3 supplement: Does it hold from year to year?

An LCA (Labor Condition Application) is an employer's statement of intent to
file for a worker, not a petition and not a visa; a filing measured here can
still be denied, withdrawn from a later petition, or never followed by one.
This script measures change in the outsourcing firm -> client network across
three periods, not its cause: a US presidential proclamation of 19 September
2025 added a $100,000 payment to certain new H-1B petitions, and this script
takes no position on whether that, or anything else, explains what moved.

FY2022-FY2025 in week04_staffing.py are full fiscal years (Oct-Sep); FY2026
covers only October 2025 to June 2026. Comparing FY2025's full year against
FY2026's nine months would count a bigger denominator for FY2025 alone, so
this script instead holds the calendar window fixed, by DECISION_DATE, and
looks at two such windows for each of three periods (FY2024, FY2025, FY2026):

    oct_jun   October to June, the nine months FY2026's file already covers.
    jan_jun   January to June, after the shutdown below and its backlog.

jan_jun is the headline window for every comparison in this script; oct_jun
is kept alongside it, computed the same way, as the fuller-window view.
FY2024 -> FY2025 is the baseline for a normal year's change in both windows;
FY2025 -> FY2026 is the change in question.

Two data problems this script corrects for, rather than reads through:

- Coverage. The FY2026 worksites file leaves out about a fifth of its placed
  filings (their case number never appears there), while FY2022-FY2025 have
  every one. week04_staffing.placements() has been patched (not by this
  script) to fall back to the main LCA row's SECONDARY_ENTITY_BUSINESS_NAME
  for those cases, so a placed filing is not silently dropped from the
  client-company count. This script does not trust that fix blindly: it
  independently counts, per period, how many placed filings had no worksites
  row at all (main_row_only_placed_filings in "totals"), by checking case
  numbers against the worksites file itself, since an internal attribute set
  inside placements() does not reliably survive the merge that follows it.
- Shutdown. The federal government shutdown of 1 October to 12 November 2025
  halted DOL LCA processing: October 2025 carries only a few hundred placed
  filings against several thousand in October 2024, and the months right
  after may carry a backlog of cases decided late once processing resumed.
  Folding that dip and its backlog into an Oct-Jun FY2026 count understates
  the period's normal run rate, which is why jan_jun is the headline window;
  a monthly series of certified and placed filings (out["monthly"]) makes
  the dip visible directly rather than asserting it.

A raw substring probe (not reused here) showed Tata Consultancy Services
falling from 6,490 to 2,881 certified filings and Cognizant from 8,620 to
5,796 between FY2025 Oct-Jun and FY2026, with Amazon and Google flat; this
script replaces those raw counts with resolver-keyed ones (in both windows;
week04_staffing.resolver(), the same company identity as section 3).

Network: staffing.graph(rows), one edge per (employer, client) weighted by
filings, exactly as in week04_staffing.py's section 3.

Questions
- Do the section 3 totals (workers at a client, not their own employer) hold
  across the three periods, in the window least disturbed by the shutdown?
- Do employer kinds (placing vs direct, fixed by their FY2025 split within
  the same window) keep or lose filings at the same rate?
- Does the filing mix (new employment vs change of employer) or the wage
  level mix shift between placing and direct employers?
- Does the client-firm network's structure (Louvain communities, against
  degree-preserving rewiring) and its stability (NMI across periods, against
  two seeds of the same period) hold?
- Does client churn - who exits, who enters, who changes their main vendor -
  look different FY25->FY26 than it did FY24->FY25? And specifically: of the
  clients whose main vendor in FY2025 was Tata Consultancy Services, or
  separately Cognizant, how many are still filing in FY2026, and with whom?

Checks
- FY2026's file is verified, not assumed, to already run Oct-Jun by
  DECISION_DATE (and RECEIVED_DATE reported alongside); FY2024 and FY2025 are
  filtered down from their full fiscal years for both windows, and rows lost
  to unparseable dates are counted and reported.
- Modularity of 100 Louvain runs (FY2026 and FY2025 graphs, in each window)
  against 100 degree-preserving bipartite rewirings, each scored on its own
  giant component, exactly as week04_staffing.py's section 3 (staffing.rewire,
  staffing.louvain, staffing.giant_of; that file is not edited, only called).
- Stability exactly as staffing.main's year-to-year block: two seeds per
  period (weighted and unweighted), NMI between periods on shared clients set
  beside the same-period two-seed NMI, for FY24->FY25 and FY25->FY26.

Output: analysis/week04_shift.json
"""

import json
import random
import time
from collections import Counter
from pathlib import Path

import networkx as nx
import numpy as np
import pandas as pd
from sklearn.metrics import normalized_mutual_info_score as nmi

import week04_staffing as staffing
from week04_data import load

OUT = Path(__file__).with_suffix(".json")
FYS = (2024, 2025, 2026)
PAIRS = ((2024, 2025), (2025, 2026))
WINDOWS = ("oct_jun", "jan_jun")
HEADLINE = "jan_jun"
SEED = 2805
RUNS = 100
MIN_FILINGS = 20  # employers this large or larger in a period's FY2025 get a kind
MIN_CHURN_FILINGS = 5  # clients this large or larger in both periods get a vendor-change check


def bounds(fy, kind):
    """The (start, end) of one period's window, by DECISION_DATE."""
    if kind == "oct_jun":
        return pd.Timestamp(fy - 1, 10, 1), pd.Timestamp(fy, 6, 30)
    return pd.Timestamp(fy, 1, 1), pd.Timestamp(fy, 6, 30)  # jan_jun: no year wrap


def change(a, b):
    """Absolute and percent change from a to b; percent is null when a is zero."""
    return {"absolute": b - a, "percent": round((b - a) / a * 100, 1) if a else None}


def check_change():
    """change() on toy numbers, so a slip in the formula is caught here, not in the output."""
    assert change(100, 150) == {"absolute": 50, "percent": 50.0}
    assert change(100, 50) == {"absolute": -50, "percent": -50.0}
    assert change(0, 10)["percent"] is None


def pp_change(a, b):
    """Change in a share, in percentage points."""
    return round((b - a) * 100, 2)


def client_summary(rows):
    """Per client: total filings, and its heaviest employer (main vendor)."""
    per = rows.groupby(["client", "employer"]).size().rename("filings").reset_index()
    totals = per.groupby("client")["filings"].sum()
    main_vendor = per.sort_values("filings").groupby("client").tail(1).set_index("client")["employer"]
    return totals, main_vendor


def compare(real, null):
    """Real Louvain runs against a null's, as in week04_staffing.py's main()."""
    return {"real": round(float(real.mean()), 4), "real_sd": round(float(real.std()), 4),
            "null": round(float(null.mean()), 4), "null_sd": round(float(null.std()), 4),
            "z": round(float((real.mean() - null.mean()) / null.std()), 2),
            "null_runs_at_or_above_real": int((null >= real.mean()).sum())}


def modularity_vs_rewiring(giant, rng, label):
    """100 Louvain runs against 100 degree-preserving rewirings, each scored on
    its own giant component, as in week04_staffing.py's section 3."""
    runs = [staffing.louvain(giant, SEED + i) for i in staffing.tracked(f"Louvain, {label}", RUNS)]
    qs = np.array([q for _, q in runs])
    null_qs, pieces = [], []
    for i in staffing.tracked(f"Rewiring nulls, {label}", RUNS):
        h = staffing.rewire(giant, rng)
        if i == 0:
            staffing.check_rewire(giant, h)
        pieces.append(nx.number_connected_components(h))
        null_qs.append(staffing.louvain(staffing.giant_of(h), SEED + i)[1])
    null_qs = np.array(null_qs)
    return {"communities_median": int(np.median([len(p) for p, _ in runs])),
            "giant_nodes": giant.number_of_nodes(), "giant_edges": giant.number_of_edges(),
            "rewired_components_median": int(np.median(pieces)),
            **compare(qs, null_qs)}


def monthly_series(lca):
    """Certified and placed filings per calendar month, Oct..Jun, from an
    Oct-Jun-windowed period: where the shutdown dip and any backlog show up."""
    decided = pd.to_datetime(lca["DECISION_DATE"], errors="coerce")
    placed = lca["SECONDARY_ENTITY"].str.upper().str.startswith("Y")
    month = decided.dt.to_period("M").astype(str)
    total, placed_counts = month.value_counts(), month[placed].value_counts()
    return [{"month": m, "certified_filings": int(total.get(m, 0)), "placed_filings": int(placed_counts.get(m, 0))}
            for m in sorted(month.dropna().unique())]


def build_period(fy, kind, lca_all, placed_cases_with_worksite_row):
    """One (period, window) slice: certified filings kept, and the diagnostics
    that go with narrowing to the window and to real client companies."""
    decided = pd.to_datetime(lca_all["DECISION_DATE"], errors="coerce")
    bad = int(decided.isna().sum())
    start, end = bounds(fy, kind)
    kept = lca_all[decided.between(start, end)].copy()
    diag = {"rows_before": len(lca_all), "bad_dates": bad,
            "outside_window": len(lca_all) - bad - len(kept), "rows_after": len(kept)}
    rows, placeholder, site_rows = staffing.placements(fy, kept)
    placed = kept[kept["SECONDARY_ENTITY"].str.upper().str.startswith("Y")]
    main_row_only = int((~placed["CASE_NUMBER"].isin(placed_cases_with_worksite_row)).sum())
    return {"lca": kept, "rows": rows, "diag": diag, "placeholder": placeholder,
            "site_rows": site_rows, "main_row_only": main_row_only}


def analyze(periods, resolver, rng, tag):
    """Every comparison (totals through client churn) for one window's three periods."""
    result = {}

    # 1 · totals.
    def totals_for(fy):
        lca, rows = periods[fy]["lca"], periods[fy]["rows"]
        placed = lca[lca["SECONDARY_ENTITY"].str.upper().str.startswith("Y")]
        return {
            "certified_filings": int(len(lca)),
            "placed_filings": int(len(placed)), "placed_share": round(len(placed) / len(lca), 4),
            "main_row_only_placed_filings": periods[fy]["main_row_only"],
            "client_company_filings": rows.attrs["client_company_filings"],
            "client_company_share": round(rows.attrs["client_company_filings"] / len(lca), 4),
            "firms": int(rows["employer"].nunique()), "clients": int(rows["client"].nunique()),
        }

    totals = {f"FY{fy}": totals_for(fy) for fy in FYS}
    count_fields = ("certified_filings", "placed_filings", "client_company_filings", "firms", "clients")
    share_fields = ("placed_share", "client_company_share")
    totals_change = {}
    for a, b in PAIRS:
        key = f"fy{a % 100}_to_fy{b % 100}"
        A, B = totals[f"FY{a}"], totals[f"FY{b}"]
        entry = {f: change(A[f], B[f]) for f in count_fields}
        entry.update({f"{f}_pp": pp_change(A[f], B[f]) for f in share_fields})
        totals_change[key] = entry
    result["totals"], result["totals_change"] = totals, totals_change
    print(f"[{tag}] totals:", json.dumps(totals), flush=True)

    # 2 · employer kinds, fixed by this window's FY2025.
    lca25 = periods[2025]["lca"].assign(
        placed=lambda d: d["SECONDARY_ENTITY"].str.upper().str.startswith("Y"))
    firms25 = lca25.groupby("employer").agg(filings=("placed", "size"), placed=("placed", "sum"))
    qualifying = firms25[firms25["filings"] >= MIN_FILINGS].copy()
    qualifying["kind"] = np.where(qualifying["placed"] / qualifying["filings"] >= 0.5, "placing", "direct")
    kind_of = qualifying["kind"].to_dict()
    keys_of = {k: qualifying[qualifying["kind"] == k].index for k in ("placing", "direct")}
    counts = {fy: periods[fy]["lca"]["employer"].value_counts() for fy in FYS}

    def group_filings(fy, kind):
        return int(counts[fy].reindex(keys_of[kind], fill_value=0).sum())

    group_totals = {kind: {f"FY{fy}": group_filings(fy, kind) for fy in FYS} for kind in ("placing", "direct")}
    group_change = {
        kind: {f"fy{a % 100}_to_fy{b % 100}": change(group_totals[kind][f"FY{a}"], group_totals[kind][f"FY{b}"])
               for a, b in PAIRS}
        for kind in ("placing", "direct")
    }

    def top_table(kind, n=15):
        top_keys = qualifying[qualifying["kind"] == kind].sort_values("filings", ascending=False).head(n).index
        table = []
        for k in top_keys:
            f = {fy: int(counts[fy].get(k, 0)) for fy in FYS}
            table.append({"firm": resolver.label(k), **{f"FY{fy}": f[fy] for fy in FYS},
                          "change_fy24_fy25_pct": change(f[2024], f[2025])["percent"],
                          "change_fy25_fy26_pct": change(f[2025], f[2026])["percent"]})
        return table

    result["employer_kinds"] = {
        "min_filings_fy2025": MIN_FILINGS,
        "qualifying_employers": int(len(kind_of)),
        "placing_employers": int((qualifying["kind"] == "placing").sum()),
        "direct_employers": int((qualifying["kind"] == "direct").sum()),
        "group_filings": group_totals, "group_change": group_change,
        "top_15_placing": top_table("placing"), "top_15_direct": top_table("direct"),
    }
    print(f"[{tag}] employer kinds:", json.dumps({k: v for k, v in result["employer_kinds"].items()
                                                  if k.startswith(("qualifying", "placing_", "direct_", "group_"))}),
          flush=True)

    # 3 · filing type: new employment vs change of employer, placing vs direct.
    def numeric_flag_share(frame, col):
        return round(float((pd.to_numeric(frame[col], errors="coerce").fillna(0) > 0).mean()), 4)

    def filing_type_for(fy):
        lca = periods[fy]["lca"]
        out_ft = {}
        for kind in ("placing", "direct"):
            sub = lca[lca["employer"].isin(keys_of[kind])]
            out_ft[kind] = None if not len(sub) else {
                "filings": int(len(sub)),
                "new_employment_share": numeric_flag_share(sub, "NEW_EMPLOYMENT"),
                "change_employer_share": numeric_flag_share(sub, "CHANGE_EMPLOYER"),
            }
        return out_ft

    result["filing_type"] = {f"FY{fy}": filing_type_for(fy) for fy in FYS}

    # 4 · wage level shares, overall and placing vs direct.
    def wage_shares(frame):
        levels = frame["PW_WAGE_LEVEL"].replace("", "missing")
        return {k: round(float(v), 4) for k, v in levels.value_counts(normalize=True).items()}

    def wage_level_for(fy):
        lca = periods[fy]["lca"]
        out_wl = {"overall": wage_shares(lca)}
        for kind in ("placing", "direct"):
            sub = lca[lca["employer"].isin(keys_of[kind])]
            out_wl[kind] = wage_shares(sub) if len(sub) else None
        return out_wl

    result["wage_level"] = {f"FY{fy}": wage_level_for(fy) for fy in FYS}

    # 5 · network: the firm-client graph each period, giant component, and its stability.
    graphs = {fy: staffing.graph(periods[fy]["rows"]) for fy in FYS}
    giants = {fy: staffing.giant_of(graphs[fy]) for fy in FYS}
    result["network"] = {
        f"FY{fy}": {
            "nodes": graphs[fy].number_of_nodes(), "edges": graphs[fy].number_of_edges(),
            "giant_nodes": giants[fy].number_of_nodes(), "giant_edges": giants[fy].number_of_edges(),
            "giant_filing_share": round(giants[fy].size("weight") / graphs[fy].size("weight"), 4),
        } for fy in FYS
    }

    result["modularity"] = {
        "FY2026": modularity_vs_rewiring(giants[2026], rng, f"FY2026 ({tag})"),
        "FY2025": modularity_vs_rewiring(giants[2025], rng, f"FY2025 ({tag})"),
    }
    print(f"[{tag}] modularity:", json.dumps(result["modularity"]), flush=True)

    # Stability, exactly as staffing.main's year-to-year block: two seeds per
    # period, weighted and unweighted.
    yearly = {}
    for fy in FYS:
        yearly[fy] = {kind: [staffing.labels(staffing.louvain(h, SEED + k)[0]) for k in (0, 1)]
                      for kind, h in (("weighted", giants[fy]), ("unweighted", staffing.unweighted(giants[fy])))}
    on = lambda a, b, shared: round(nmi([a[n] for n in shared], [b[n] for n in shared]), 3)
    stability = []
    for a, b in PAIRS:
        A0, B0 = yearly[a]["weighted"], yearly[b]["weighted"]
        shared = [n for n in A0[0] if n in B0[0] and n[0] == "C"]
        entry = {"from": f"FY{a}", "to": f"FY{b}", "shared_clients": len(shared)}
        for kind in ("weighted", "unweighted"):
            A, B = yearly[a][kind], yearly[b][kind]
            key = "" if kind == "weighted" else "unweighted_"
            entry[f"{key}nmi"] = on(A[0], B[0], shared)
            entry[f"{key}same_period_nmi"] = on(B[0], B[1], shared)  # two seeds of the later period
        stability.append(entry)
    result["stability"] = stability
    print(f"[{tag}] stability:", json.dumps(stability), flush=True)

    # 6 · client churn.
    client_data = {fy: client_summary(periods[fy]["rows"]) for fy in FYS}
    churn = []
    for a, b in PAIRS:
        totals_a, vendor_a = client_data[a]
        totals_b, vendor_b = client_data[b]
        set_a, set_b = set(totals_a.index), set(totals_b.index)
        shared = set_a & set_b
        exits, entries = set_a - set_b, set_b - set_a
        big_both = [c for c in shared if totals_a[c] >= MIN_CHURN_FILINGS and totals_b[c] >= MIN_CHURN_FILINGS]
        switched = [c for c in big_both if vendor_a[c] != vendor_b[c]]
        churn.append({
            "from": f"FY{a}", "to": f"FY{b}",
            "clients_a": int(len(set_a)), "clients_b": int(len(set_b)), "shared": int(len(shared)),
            "exits": int(len(exits)),
            "exit_filing_share_of_a": round(float(totals_a.loc[list(exits)].sum() / totals_a.sum()), 4) if exits else 0.0,
            "entries": int(len(entries)),
            "entry_filing_share_of_b": round(float(totals_b.loc[list(entries)].sum() / totals_b.sum()), 4) if entries else 0.0,
            f"clients_with_{MIN_CHURN_FILINGS}plus_filings_both_periods": int(len(big_both)),
            "main_vendor_changed_share": round(len(switched) / len(big_both), 4) if big_both else None,
        })
    result["client_churn"] = {"pairs": churn}
    print(f"[{tag}] client churn:", json.dumps(churn), flush=True)

    # TCS and Cognizant specifically: who kept them as main vendor into FY2026.
    firm_names_25 = {k: resolver.label(k) for k in periods[2025]["rows"]["employer"].unique()}

    def find_key(substr):
        matches = [k for k, v in firm_names_25.items() if substr.lower() in v.lower()]
        return matches[0] if matches else None

    totals_25, vendor_25 = client_data[2025]
    totals_26, vendor_26 = client_data[2026]

    def vendor_switch(vendor_label, key):
        if key is None:
            return {"vendor": vendor_label, "found": False}
        clients_with = [c for c in vendor_25.index if vendor_25[c] == key]
        still_present = [c for c in clients_with if c in totals_26.index]
        kept = [c for c in still_present if vendor_26[c] == key]
        switched = [c for c in still_present if vendor_26[c] != key]
        top5 = Counter(vendor_26[c] for c in switched).most_common(5)
        return {
            "vendor": vendor_label, "found": True, "fy2025_main_vendor_clients": int(len(clients_with)),
            "still_filing_fy2026": int(len(still_present)), "kept_as_main_vendor": int(len(kept)),
            "switched_main_vendor": int(len(switched)),
            "top_5_new_main_vendors": [[resolver.label(k), int(n)] for k, n in top5],
        }

    result["client_churn"]["tata_consultancy_services"] = vendor_switch(
        "Tata Consultancy Services", find_key("tata consultancy"))
    result["client_churn"]["cognizant"] = vendor_switch("Cognizant", find_key("cognizant"))
    print(f"[{tag}] vendor switch:", json.dumps({k: result["client_churn"][k] for k in
                                                 ("tata_consultancy_services", "cognizant")}), flush=True)
    return result


def main():
    started = time.time()
    check_change()
    rng = random.Random(SEED)
    resolver = staffing.resolver()

    # Loaded once per fiscal year, then windowed two ways below.
    raw = {fy: staffing.certified(fy) for fy in FYS}
    worksite_placed_cases = {}
    for fy in FYS:
        sites = load(f"worksites_fy{fy}")
        placed_sites = sites[sites["SECONDARY_ENTITY"].str.upper().str.startswith("Y")]
        worksite_placed_cases[fy] = set(placed_sites["CASE_NUMBER"])

    windows = {}
    for kind in WINDOWS:
        periods = {}
        for fy in FYS:
            periods[fy] = build_period(fy, kind, raw[fy], worksite_placed_cases[fy])
            diag = periods[fy]["diag"]
            print(f"{kind} FY{fy}: {diag['rows_after']:,} certified filings "
                  f"({diag['bad_dates']} bad dates, {diag['outside_window']} outside window, "
                  f"{periods[fy]['main_row_only']:,} placed filings from the main-row fallback); "
                  f"{periods[fy]['rows']['client'].nunique():,} clients", flush=True)
        windows[kind] = periods

    # Verify FY2026's file is already Oct-Jun, rather than assume it.
    decided26 = pd.to_datetime(raw[2026]["DECISION_DATE"], errors="coerce")
    received26 = pd.to_datetime(raw[2026]["RECEIVED_DATE"], errors="coerce")
    fy2026_check = {
        "decision_date_min": str(decided26.min().date()), "decision_date_max": str(decided26.max().date()),
        "received_date_min": str(received26.min().date()), "received_date_max": str(received26.max().date()),
        "bad_decision_dates": int(decided26.isna().sum()), "bad_received_dates": int(received26.isna().sum()),
    }
    print("FY2026 window check:", fy2026_check, flush=True)

    # Monthly series (Oct..Jun) from the oct_jun window, so the shutdown dip is visible.
    monthly = {f"FY{fy}": monthly_series(windows["oct_jun"][fy]["lca"]) for fy in FYS}
    print("monthly series:", json.dumps(monthly), flush=True)

    out = {
        "generated_by": "analysis/week04_shift.py", "weight": "filings", "runs": RUNS,
        "windows": {"oct_jun": "October to June", "jan_jun": "January to June (after the shutdown and its backlog)"},
        "headline_window": HEADLINE,
        "periods": {"FY2024": "of the FY2024 fiscal year, filtered down",
                    "FY2025": "of the FY2025 fiscal year, filtered down",
                    "FY2026": "the whole file (verified below to already run Oct-Jun)"},
        "date_parsing": {kind: {f"FY{fy}": windows[kind][fy]["diag"] for fy in FYS} for kind in WINDOWS},
        "fy2026_window_check": fy2026_check,
        "monthly": monthly,
    }

    for kind in WINDOWS:
        out[kind] = analyze(windows[kind], resolver, rng, kind)

    out["seconds"] = round(time.time() - started)
    OUT.write_text(json.dumps(out, indent=1, default=str) + "\n")
    print(f"done in {staffing.span(out['seconds'])} -> analysis/{OUT.name}", flush=True)


if __name__ == "__main__":
    main()
