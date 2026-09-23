"""Data for the section 3 figure: every client with 20 or more placed filings.

For each fiscal year: the client's filings, how many firms placed workers
there, its sector (from the reviewed alias table, blank if unknown) and its
largest vendors (as positions in the shared "firms" list). Reuses the cleaning in week04_staffing, so the figure and the
section's numbers come from the same rows.

Output: docs/weeks/week04/data/staffing_clients.json
"""

import json
from pathlib import Path

import week04_names as names
from week04_staffing import MIN_FILINGS, certified, employer_labels, placements, resolver

OUT = Path(__file__).resolve().parents[1] / "docs/weeks/week04/data/staffing_clients.json"
YEARS = [2022, 2023, 2024, 2025, 2026]
TOP_VENDORS = 8
FLOW_VENDORS = 8   # the flow chart: the largest placing firms ...
FLOW_CLIENTS = 20  # ... and the largest clients, with every filing between them


def flows(pairs, totals, firm):
    """The flow chart: the FLOW_VENDORS firms that place the most filings, the
    FLOW_CLIENTS clients that receive the most, and the filings between them,
    plus one "all other firms" source for the rest of each client's filings, so
    a client's node shows all it receives. Clients are ordered by their main
    vendor among those firms, then by size, so a vendor's clients sit together."""
    by_vendor = pairs.groupby("employer")["filings"].sum().sort_values(ascending=False)
    vendors = list(by_vendor.head(FLOW_VENDORS).index)
    top_clients = list(totals.sort_values(ascending=False).head(FLOW_CLIENTS).index)
    links = pairs[pairs["employer"].isin(vendors) & pairs["client"].isin(top_clients)]
    rank = {v: i for i, v in enumerate(vendors)}
    main = links.sort_values("filings", ascending=False).drop_duplicates("client").set_index("client")["employer"]
    clients = sorted(top_clients, key=lambda c: (rank.get(main.get(c), len(vendors)), -totals[c]))
    from_top = links.groupby("client")["filings"].sum()
    rest = {c: int(totals[c] - from_top.get(c, 0)) for c in clients}
    other = len(vendors)  # the "all other firms" source comes last
    return {
        "vendors": [{"name": firm.get(v, resolver().label(v)), "placed": int(by_vendor[v])} for v in vendors]
        + [{"name": "All other firms", "placed": sum(rest.values()), "other": True}],
        "clients": [{"name": resolver().label(c), "placed": int(totals[c])} for c in clients],
        "links": [[vendors.index(v), clients.index(c), int(n)]
                  for v, c, n in links[["employer", "client", "filings"]].itertuples(index=False)]
        + [[other, clients.index(c), n] for c, n in rest.items() if n],
        "from_top_vendors": int(links["filings"].sum()),
        "client_filings": int(sum(totals[c] for c in clients)),
        "placed_filings": int(totals.sum()),
    }


def main():
    out = {"generated_by": "analysis/week04_staffing_figure.py", "min_filings": MIN_FILINGS,
           "firms": [], "years": {}}
    index = {}

    def ref(name):
        """Each firm name is stored once, in out["firms"]; vendors refer to it by position."""
        if name not in index:
            index[name] = len(out["firms"])
            out["firms"].append(name)
        return index[name]

    for year in YEARS:
        lca = certified(year)
        firm = {k: " ".join(v.split()) for k, v in employer_labels(lca).items()}
        rows, _, _ = placements(year, lca)
        pairs = rows.groupby(["client", "employer"]).size().rename("filings").reset_index()
        totals = pairs.groupby("client")["filings"].sum()
        clients = []
        for client in totals[totals >= MIN_FILINGS].sort_values(ascending=False).index:
            vendors = pairs[pairs["client"] == client].sort_values("filings", ascending=False)
            top = vendors.head(TOP_VENDORS)
            clients.append({
                "name": resolver().label(client),
                "sector": names.naics2(client),
                "filings": int(totals[client]),
                "vendors": int(len(vendors)),
                "top": [[ref(firm.get(e, e)), int(n)] for e, n in zip(top["employer"], top["filings"])],
                "rest": int(vendors["filings"].iloc[TOP_VENDORS:].sum()),
            })
        out["years"][year] = {
            "months": 9 if year == 2026 else 12,
            "placed_filings": int(totals.sum()),
            "clients": int(len(totals)),
            "shown": clients,
            "flows": flows(pairs, totals, firm),
        }
        print(f"FY{year}: {len(clients)} clients with {MIN_FILINGS}+ filings", flush=True)
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(out, separators=(",", ":")) + "\n")
    print(f"{OUT.stat().st_size / 1024:.0f} KB -> {OUT}")


if __name__ == "__main__":
    main()
