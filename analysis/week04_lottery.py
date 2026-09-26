"""Week 4, section 3, one step back: from lottery ticket to client.  Owner: Gyula.

A new H-1B worker starts as a lottery registration. An employer registers the
worker in March; USCIS draws registrations at random; a drawn employer may file
a petition, which carries the case number of the labour condition application
(LCA) behind it; the LCA names the client, if any, where the worker will sit.
USCIS released every registration for the FY2021 to FY2024 lotteries to
Bloomberg News under FOIA, case numbers included, so the chain can be followed
from ticket to client.

Questions
- How many registrations does one approved petition take, for firms that place
  workers at clients against firms that hire directly?
- How often does a drawn registration go unused, and does it matter whether the
  worker was registered by more than one employer?
- Which clients receive lottery winners through outsourcing firms?
- Do the firms whose registrations are mostly for workers registered elsewhere
  too sit in the same staffing communities?

Years. A lottery is named by the fiscal year the visa starts: the FY2024
lottery ran in March 2023, and 90% of its petitions cite an LCA decided in
FY2023. So the FY2024 lottery is read against the FY2023 staffing network and
FY2023's placing and direct firms; the FY2023 lottery against FY2022. The FY2022
lottery is left out: its LCAs were mostly decided in FY2021, which we did not
download, and only 16% of its petitions match one.

Firm kinds, from the LCA year's certified H-1B filings as in week04_staffing:
"placing" (20 or more filings, half or more naming a client), "direct" (20 or
more, fewer than half), "small" (fewer than 20 certified filings that year,
including none).

Checks
- Employer keys: a lottery row has the full tax number, an FY2022 or FY2023 LCA
  none, so the resolver can key one firm two ways. align() gives each tax number
  the key its own petitions' LCAs carry; agreement on matched petitions goes
  from about 95% to over 99% (employer_keys in the JSON).
- Why a kind needs more registrations per approval: gap() splits the ratio to
  direct employers into the draw, the petition and the approval steps.
- The draw should not favour a kind: selection rates by kind are reported. The
  master's-degree round lifts employers who hire more US graduates, so small
  differences are expected.
- Community test: firms in the giant component of the staffing network with 20
  or more registrations, labelled by whether their share of multi-registered
  workers is above the median of those firms. NMI of the best of 100 Louvain
  runs against 1,000 shuffled labels, AMI over all 100 runs, and the share of a
  high firm's community mates that are also high, against shuffled labels.
  Unweighted (each firm-client link once) and weighted by filings.

Nothing about a worker is kept: the loader drops country, birth, gender and
education before the table reaches build/.

Output: analysis/week04_lottery.json
"""

import json
import random
import time
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.metrics import adjusted_mutual_info_score as ami

from week04_data import load
from week04_names import fein_of
from week04_staffing import (MIN_FILINGS, RUNS, SEED, certified, giant_of, graph, labels, louvain,
                             placements, resolver, shuffled_nmi, span, tracked, unweighted)

OUT = Path(__file__).with_suffix(".json")
LOTTERIES = {2024: 2023, 2023: 2022}  # lottery year -> the LCA year most of its petitions cite
LCA_YEARS = [2022, 2023, 2024]  # where the petitions' LCAs are looked up
REDACTED = r"\(b\)"  # rows USCIS withheld under FOIA exemptions (b)(3), (b)(6), (b)(7)(c)


def registrations(year):
    """One row per registration, without the withheld rows, keyed like the LCAs."""
    t = load(f"lottery_fy{year}")
    withheld = t["status_type"].str.contains(REDACTED)
    t = t[~withheld].copy()
    t.attrs["withheld"] = int(withheld.sum())
    t["employer"] = [resolver().employer(n, f) for n, f in zip(t["employer_name"], t["FEIN"])]
    t["selected"] = t["status_type"].eq("SELECTED")
    t["multi"] = t["ben_multi_reg_ind"].eq("1")
    # The release withholds receipt numbers ("(b)(6)"): they say a petition was
    # filed, not which one, so a petition is counted as its registration's row.
    t["petition"] = t["RECEIPT_NUMBER"].ne("")
    t["approved"] = t["FIRST_DECISION"].eq("Approved")
    t["denied"] = t["FIRST_DECISION"].eq("Denied")
    # USCIS writes case numbers without dashes; DOL with them.
    t["case"] = t["DOL_ETA_CASE_NUMBER"].str.replace("-", "").str.strip()
    return t


def kinds(lca_year):
    """employer -> placing / direct, from the year's certified H-1B filings."""
    lca = certified(lca_year)
    lca["placed"] = lca["SECONDARY_ENTITY"].str.upper().str.startswith("Y")
    firms = lca.groupby("employer").agg(filings=("placed", "size"), placed=("placed", "sum"))
    firms = firms[firms["filings"] >= MIN_FILINGS]
    return pd.Series(np.where(firms["placed"] / firms["filings"] >= 0.5, "placing", "direct"), index=firms.index)


def lca_cases():
    """Every LCA case number (any status) -> its fiscal year and its employer key,
    and the client companies certified H-1B cases name, all keyed without dashes."""
    years, keys, clients = {}, {}, []
    for y in LCA_YEARS:
        lca = load(f"lca_fy{y}")
        cases = lca["CASE_NUMBER"].str.replace("-", "")
        years.update(dict.fromkeys(cases, y))
        fein = lca["EMPLOYER_FEIN"] if "EMPLOYER_FEIN" in lca else pd.Series("", index=lca.index)
        keys.update(zip(cases, (resolver().employer(n, f) for n, f in zip(lca["EMPLOYER_NAME"], fein))))
        rows, *_ = placements(y, certified(y))
        clients.append(rows.assign(case=rows["CASE_NUMBER"].str.replace("-", "")))
    clients = pd.concat(clients).drop_duplicates(["case", "client"])
    return pd.Series(years), pd.Series(keys), clients


def align(t, keys):
    """Key each tax number the way its own petitions' LCAs are keyed.

    FY2022 and FY2023 LCAs carry no tax number, so the resolver keys some of
    their firms by name ("PERSISTENT SYSTEMS") while the lottery row, which has
    the full tax number, gets "FEIN 770584954". A firm keyed two ways would count
    as "small" and drop out of the community test. A tax number with matched
    petitions takes the key most of their LCAs have; the rest keep the resolver's.
    Returns the agreement on matched petitions before and after."""
    m = t[t["petition"] & t["case"].isin(keys.index)]
    lca_key = m["case"].map(keys)
    before = float((lca_key == m["employer"]).mean())
    fein = t["FEIN"].map(fein_of)
    pairs = pd.DataFrame({"fein": fein[m.index], "key": lca_key})
    pairs = pairs[pairs["fein"] != ""]
    mode = pairs.groupby("fein")["key"].agg(lambda s: s.value_counts().index[0])
    t["employer"] = [mode.get(f, e) if f else e for f, e in zip(fein, t["employer"])]
    after = float((lca_key == t.loc[m.index, "employer"]).mean())
    return {"petitions_compared": len(m), "agreement_before": round(before, 4), "agreement_after": round(after, 4)}


def rate(a, b):
    return round(float(a / b), 4) if b else None


def funnel(t, case_year, clients):
    petitions = t[t["petition"]]
    with_case = petitions[petitions["case"].ne("") & ~petitions["case"].str.contains(REDACTED)]
    matched = with_case[with_case["case"].isin(case_year.index)]
    placed = matched[matched["case"].isin(clients["case"])]
    selected = t[t["selected"]]
    return {
        "registrations": len(t),
        "withheld_rows": t.attrs["withheld"],
        "employers": int(t["employer"].nunique()),
        "multi_registration_share": rate(t["multi"].sum(), len(t)),
        "selected": int(t["selected"].sum()),
        "selection_rate": rate(t["selected"].sum(), len(t)),
        "petitions": len(petitions),
        "selected_that_became_petitions": rate(selected["petition"].sum(), len(selected)),
        "selected_became_petitions_multi": rate(selected.loc[selected["multi"], "petition"].sum(),
                                                selected["multi"].sum()),
        "selected_became_petitions_single": rate(selected.loc[~selected["multi"], "petition"].sum(),
                                                 (~selected["multi"]).sum()),
        "approved": int(t["approved"].sum()),
        "denied": int(t["denied"].sum()),
        "registrations_per_approval": round(len(t) / t["approved"].sum(), 2),
        "petitions_with_lca_case": len(with_case),
        "matched_to_an_lca": len(matched),
        "matched_share": rate(len(matched), len(with_case)),
        "matched_by_lca_year": {int(k): int(v) for k, v in matched["case"].map(case_year).value_counts().items()},
        "lca_names_a_client_company": len(placed),
        "lca_names_a_client_company_share": rate(len(placed), len(matched)),
        # The petition's own answer: the worker will be assigned off-site.
        "petition_says_off_site_share": rate(petitions["S4Q1"].eq("Y").sum(), petitions["S4Q1"].isin(["Y", "N"]).sum()),
    }


def by_kind(t):
    out = {}
    for kind, g in t.groupby("kind"):
        sel = g[g["selected"]]
        out[kind] = {
            "employers": int(g["employer"].nunique()),
            "registrations": len(g),
            "registration_share": rate(len(g), len(t)),
            "multi_registration_share": rate(g["multi"].sum(), len(g)),
            "selection_rate": rate(len(sel), len(g)),
            "selected_that_became_petitions": rate(sel["petition"].sum(), len(sel)),
            "approved": int(g["approved"].sum()),
            "approved_per_petition": rate(g["approved"].sum(), g["petition"].sum()),
            "registrations_per_approval": round(len(g) / g["approved"].sum(), 2),
            "denial_rate": rate(g["denied"].sum(), g["approved"].sum() + g["denied"].sum()),
        }
    return out


def gap(t, kind, base="direct"):
    """Why a kind needs more registrations per approval than the base kind.

    Registrations per approval = (registrations / selected) x (selected /
    petitions) x (petitions / approved), exactly. The log of the ratio between
    two kinds splits into the three steps; each step's share of the log gap."""
    def steps(g):
        n, s, p, a = len(g), g["selected"].sum(), g["petition"].sum(), g["approved"].sum()
        return {"draw": np.log(n / s), "petition": np.log(s / p), "approval": np.log(p / a)}
    k, b = steps(t[t["kind"] == kind]), steps(t[t["kind"] == base])
    diff = {step: k[step] - b[step] for step in k}
    total = sum(diff.values())
    return {"ratio": round(float(np.exp(total)), 3),
            **{f"{step}_share": round(float(d / total), 3) for step, d in diff.items()}}


def to_clients(t, clients, top=12):
    """Lottery petitions whose LCA names a client company, and the clients that receive most."""
    rows = (t[t["petition"]].rename_axis("row").reset_index()
            .merge(clients[["case", "employer", "client"]], on="case", suffixes=("_lottery", "")))
    per = rows.groupby("client").agg(petitions=("row", "nunique"), vendors=("employer", "nunique"))
    lead = rows.groupby(["client", "employer"]).size().rename("n").reset_index()
    lead = lead.sort_values(["n", "employer"], ascending=[False, True]).groupby("client").head(1).set_index("client")
    via_placing = rows.assign(p=rows["kind"].eq("placing")).groupby("client")["p"].mean()
    per = per.sort_values(["petitions", "vendors"], ascending=False)
    return {
        "petitions_to_client_companies": int(rows["row"].nunique()),
        "clients": int(len(per)),
        "via_placing_firms_share": rate(rows["kind"].eq("placing").sum(), len(rows)),
        "via_small_firms_share": rate(rows["kind"].eq("small").sum(), len(rows)),
        "top_clients": [
            {"client": resolver().label(c), "petitions": int(r["petitions"]), "vendors": int(r["vendors"]),
             "top_vendor": resolver().label(lead.at[c, "employer"]),
             "top_vendor_share": round(float(lead.at[c, "n"] / r["petitions"]), 3),
             "via_placing_firms_share": round(float(via_placing[c]), 3)}
            for c, r in per.head(top).iterrows()],
    }


def mates(comm, label):
    """Mean share of a high firm's community mates (other tested firms) that are high
    too. A high firm in a community of n tested firms, h of them high, has
    (h - 1) / (n - 1) high mates; firms alone in their community are skipped."""
    _, comm = np.unique(comm, return_inverse=True)
    n = np.bincount(comm)
    h = np.bincount(comm, weights=np.asarray(label, dtype=float))
    shared = n > 1
    if not h[shared].sum():
        return float("nan")
    return float((h[shared] * (h[shared] - 1) / (n[shared] - 1)).sum() / h[shared].sum())


def community_test(t, lca_year, rng):
    """Do the firms that register many multi-registered workers share staffing communities?"""
    lca = certified(lca_year)
    rows, *_ = placements(lca_year, lca)
    g = giant_of(graph(rows))
    per = t.groupby("employer")["multi"].agg(["size", "mean"])
    per = per[per["size"] >= MIN_FILINGS]
    firms = sorted(f for f in per.index if ("F", f) in g)
    cut = float(per.loc[firms, "mean"].median())
    label = [int(per.at[f, "mean"] > cut) for f in firms]
    out = {"lca_year": lca_year, "firms_tested": len(firms), "high_firms": int(sum(label)),
           "median_multi_share": round(cut, 4),
           "tested_firms_filing_share": round(float(
               rows["employer"].isin(firms).sum() / len(rows)), 4)}
    for kind, h in (("unweighted", unweighted(g)), ("weighted", g)):
        runs = [louvain(h, SEED + i) for i in tracked(f"Louvain FY{lca_year}, {kind}", RUNS)]
        amis = [ami([m[("F", f)] for f in firms], label) for m in (labels(p) for p, _ in runs)]
        member = labels(max(runs, key=lambda r: r[1])[0])
        comm = [member[("F", f)] for f in firms]
        observed, p = shuffled_nmi(comm, label, rng)
        seen = mates(comm, label)
        shuffled = list(label)
        null = []
        for _ in range(1000):
            rng.shuffle(shuffled)
            null.append(mates(comm, shuffled))
        null = np.array(null)
        out[kind] = {
            "communities_holding_tested_firms": len(set(comm)),
            "nmi": round(observed, 4), "p_nmi": round(p, 4),
            "ami_median": round(float(np.median(amis)), 4),
            "ami_min": round(float(np.min(amis)), 4), "ami_max": round(float(np.max(amis)), 4),
            "high_mates_share": round(seen, 4),
            "high_mates_share_shuffled": round(float(np.nanmean(null)), 4),
            "p_mates": round(float((np.sum(null >= seen) + 1) / (len(null) + 1)), 4),
        }
    return out


def main():
    started = time.time()
    rng = random.Random(SEED)
    case_year, keys, clients = lca_cases()
    out = {"generated_by": "analysis/week04_lottery.py",
           "source": "USCIS H-1B registrations and petitions, FY2021 to FY2024 lotteries, "
                     "obtained by Bloomberg News under FOIA",
           "lotteries": {}}
    for year, lca_year in LOTTERIES.items():
        t = registrations(year)
        entry = out["lotteries"][year] = {"lottery_held": f"March {year - 1}", "lca_year": lca_year}
        entry["employer_keys"] = align(t, keys)
        t["kind"] = t["employer"].map(kinds(lca_year)).fillna("small")
        entry["funnel"] = funnel(t, case_year, clients)
        entry["by_kind"] = by_kind(t)
        entry["gap_to_direct"] = {kind: gap(t, kind) for kind in ("placing", "small")}
        entry["clients"] = to_clients(t, clients)
        entry["community_test"] = community_test(t, lca_year, rng)
        print(f"FY{year} lottery:", json.dumps({k: entry[k] for k in ("funnel", "by_kind")}), flush=True)
    out["seconds"] = round(time.time() - started)
    OUT.write_text(json.dumps(out, indent=1) + "\n")
    print(json.dumps({y: e["community_test"] for y, e in out["lotteries"].items()}, indent=1))
    print(f"done in {span(out['seconds'])} -> {OUT.name}")


if __name__ == "__main__":
    main()
