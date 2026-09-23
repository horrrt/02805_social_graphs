"""Does week04_names put the right filings together? Tested against tax numbers.

Employers since FY2024 carry a tax number (FEIN), which names a legal entity
without any guessing. That makes them the test set for every rule that has to
work without one:

(a) The FY2022 and FY2023 bridge. Built from FY2024 and FY2026 only, applied
    blind to FY2025 names, scored against their real FEINs.
(b) The name rules. week04_names turns FY2025 employer names into companies by
    name alone, exactly as it must for clients; scored against the companies
    the FEINs give (a FEIN, or its family in the alias table). Pairwise
    precision: of the filing pairs the rules put together, the share that
    belong together. Recall: of the pairs that belong together, the share the
    rules found. Both weighted by filings.
(c) A regression list of names that must, and must not, end up together.

    python analysis/week04_names_check.py                 # run the checks
    python analysis/week04_names_check.py --build-merges  # rebuild the misspelling list first

--build-merges writes week04_name_merges.csv: a client name that is a near
copy (rapidfuzz ratio 95 or more) of a name at least five times as common,
both at least 12 characters, the same digits in both, and never two names that
bridge to different tax numbers. Every row is a merge anyone can read and undo.

Output: analysis/week04_names_check.json. Exits non-zero if (c) fails.
"""

import argparse
import csv
import json
import re
import sys
from collections import Counter
from pathlib import Path

import pandas as pd
from rapidfuzz import fuzz, process

import week04_names as names
from week04_data import load

OUT = Path(__file__).with_suffix(".json")
YEARS = [2022, 2023, 2024, 2025, 2026]

# Employer name, FEIN pairs for the regression list come from the filings; these
# are names only.
MUST_MERGE = [
    ("client", "Citibank, N.A.", "CITIBANK NA"),
    ("client", "WELLSFARGO", "Wells Fargo"),
    ("client", "Fidelity Technology Group LLC d/b/a Fidelity Investments", "Fidelity Investments"),
    ("client", "TALENTSOURCE LLC/FIDELITY INVESTMENTS", "Fidelity Investments"),
    ("client", "A D P", "ADP"),
    ("client", "Capital One Services, LLC", "Capital One"),
    ("client", "Verizon Data Services LLC", "Verizon"),
    ("employer", "TATA CONSULTANCY SERVIES LIMITED", "Tata Consultancy Services Limited"),
    ("employer", "LARSEN & TOUBRO INFOTECH LIMITED", "LTIMindtree Limited"),
    ("employer", "Amazon Web Services, Inc.", "Amazon.com Services LLC"),
    ("client", "IBM", "INTERNATIONAL BUSINESS MACHINES CORP"),
]
MUST_NOT_MERGE = [
    ("employer", "A.P.P.L.E. Consulting", "Apple Inc."),
    ("employer", "META IT SYSTEMS LLC", "Meta Platforms, Inc."),
    ("employer", "LinkedIn Corporation", "Microsoft Corporation"),
    ("client", "Capital Group Companies", "Capital One"),
    ("client", "Citizens Bank", "First Citizens Bank and Trust"),
    ("client", "First Data", "Global Payments"),
    ("client", "GE HealthCare", "General Electric"),
    ("client", "Hewlett Packard Enterprise", "HP Inc."),
    ("employer", "GAP Solutions, Inc.", "The Gap, Inc."),
    ("client", "Optum", "UnitedHealth Group"),
    ("employer", "Lucid Motors USA, Inc.", "Lucid Software, Inc."),
]


def filings():
    """Certified H-1B filings of every year: employer name, FEIN, and year."""
    frames = []
    for year in YEARS:
        lca = load(f"lca_fy{year}")
        lca = lca[(lca["CASE_STATUS"] == "Certified") & (lca["VISA_CLASS"] == "H-1B")]
        fein = lca["EMPLOYER_FEIN"] if "EMPLOYER_FEIN" in lca else ""
        frames.append(pd.DataFrame({"name": lca["EMPLOYER_NAME"], "fein": fein, "year": year,
                                    "case": lca["CASE_NUMBER"]}))
    return pd.concat(frames, ignore_index=True)


def client_names():
    rows = []
    for year in YEARS:
        lca = load(f"lca_fy{year}")
        ok = lca[(lca["CASE_STATUS"] == "Certified") & (lca["VISA_CLASS"] == "H-1B")]["CASE_NUMBER"]
        sites = load(f"worksites_fy{year}")
        sites = sites[sites["SECONDARY_ENTITY"].str.upper().str.startswith("Y") & sites["CASE_NUMBER"].isin(ok)]
        rows.append(sites.drop_duplicates(["CASE_NUMBER", "SECONDARY_ENTITY_BUSINESS_NAME"])
                    ["SECONDARY_ENTITY_BUSINESS_NAME"])
    return pd.concat(rows)


def build_merges(emp):
    resolver = names.Resolver(emp["name"], emp["fein"])
    old = names.MERGES.with_suffix(".bak")
    if names.MERGES.exists():
        names.MERGES.rename(old)
    names.merges.cache_clear()
    names.client.cache_clear()
    counts = client_names().map(names.client).dropna().value_counts()
    keys = list(counts.index)
    digits = lambda s: re.findall(r"\d+", s)
    rows, taken = [], set()
    for target in counts[counts >= 20].index:
        for variant, score, _ in process.extract(target, keys, scorer=fuzz.ratio, limit=10, score_cutoff=95):
            if variant == target or variant in taken or variant in names.canonicals():
                continue
            if min(len(variant), len(target)) < 12 or counts[target] < 5 * counts[variant]:
                continue
            if digits(variant) != digits(target):
                continue
            fa, fb = resolver.bridge.get(names.compact(variant)), resolver.bridge.get(names.compact(target))
            if fa and fb and fa != fb:
                continue
            taken.add(variant)
            rows.append({"variant": variant, "target": target, "variant_filings": int(counts[variant]),
                         "target_filings": int(counts[target]), "score": round(score, 1)})
    rows.sort(key=lambda r: (-r["target_filings"], -r["variant_filings"]))
    with open(names.MERGES, "w", newline="", encoding="utf-8") as fh:
        fh.write("# Client names that misspell a much more common one; built by "
                 "week04_names_check.py --build-merges. Delete a row to undo a merge.\n")
        writer = csv.DictWriter(fh, ["variant", "target", "variant_filings", "target_filings", "score"])
        writer.writeheader()
        writer.writerows(rows)
    old.unlink(missing_ok=True)
    names.merges.cache_clear()
    names.client.cache_clear()
    print(f"{len(rows)} misspellings -> {names.MERGES.name}")


def pairs(counter):
    return sum(n * (n - 1) / 2 for n in counter.values())


def pairwise(pred, truth):
    """Filing-pair precision and recall of a grouping against the true one."""
    both = Counter(zip(pred, truth))
    together = pairs(both)
    return together / pairs(Counter(pred)), together / pairs(Counter(truth))


def main():
    parser = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    parser.add_argument("--build-merges", action="store_true")
    args = parser.parse_args()
    emp = filings()
    emp["fein"] = emp["fein"].map(names.fein_of)
    if args.build_merges:
        build_merges(emp)

    out = {"generated_by": "analysis/week04_names_check.py"}
    known = emp[emp["fein"] != ""]
    full = names.Resolver(known["name"], known["fein"])
    truth_family = lambda f: full.family_of.get(f, f)

    # (a) the bridge, built without FY2025 and scored on it
    train = known[known["year"] != 2025]
    test = known[known["year"] == 2025]
    blind = names.Resolver(train["name"], train["fein"])
    guess = test["name"].map(lambda n: blind.bridge.get(names.compact(names.legal_name(n)), ""))
    bridged = guess != ""
    out["bridge"] = {
        "fy2025_filings": len(test),
        "bridged_share": round(float(bridged.mean()), 4),
        "correct_fein_share_of_bridged": round(float((guess[bridged] == test["fein"][bridged]).mean()), 4),
        "correct_company_share_of_bridged": round(float(
            (guess[bridged].map(truth_family) == test["fein"][bridged].map(truth_family)).mean()), 4),
    }

    # (b) name rules alone against FEIN companies, FY2025 employers
    pred = test["name"].map(lambda n: names.family(names.legal_name(n)))
    truth = test["fein"].map(truth_family)
    precision, recall = pairwise(list(pred), list(truth))
    by_pred = pd.DataFrame({"pred": pred, "truth": truth})
    merged = by_pred.groupby("pred")["truth"].nunique()
    split = by_pred.groupby("truth")["pred"].nunique()
    out["name_rules"] = {
        "pairwise_precision": round(precision, 4),
        "pairwise_recall": round(recall, 4),
        "filings_under_a_name_key_spanning_companies": round(float(
            by_pred["pred"].isin(merged[merged > 1].index).mean()), 4),
        "filings_of_a_company_split_across_name_keys": round(float(
            by_pred["truth"].isin(split[split > 1].index).mean()), 4),
        "largest_false_merges": [
            {"key": k, "companies": sorted(by_pred[by_pred["pred"] == k]["truth"].unique())[:4]}
            for k in by_pred[by_pred["pred"].isin(merged[merged > 1].index)]["pred"].value_counts().head(8).index],
    }

    # (c) regression list
    def key(side, name):
        if side == "client":
            return full.client(name)
        f = known[known["name"] == name]["fein"]
        return full.employer(name, f.iloc[0] if len(f) else "")

    failures = []
    for side, a, b in MUST_MERGE:
        if key(side, a) != key(side, b):
            failures.append(f"should merge: {a!r} ({key(side, a)}) and {b!r} ({key(side, b)})")
    for side, a, b in MUST_NOT_MERGE:
        if key(side, a) == key(side, b):
            failures.append(f"should stay apart: {a!r} and {b!r} are both {key(side, a)}")
    out["regressions"] = {"must_merge": len(MUST_MERGE), "must_not_merge": len(MUST_NOT_MERGE),
                          "failures": failures}
    merges = pd.read_csv(names.MERGES, comment="#") if names.MERGES.exists() else pd.DataFrame()
    out["merges"] = {"rows": len(merges), "sample": merges.sample(min(15, len(merges)), random_state=1)
                     .to_dict("records") if len(merges) else []}
    OUT.write_text(json.dumps(out, indent=1) + "\n")
    print(json.dumps({k: v for k, v in out.items() if k != "merges"}, indent=1))
    if failures:
        sys.exit("regressions failed")


if __name__ == "__main__":
    main()
