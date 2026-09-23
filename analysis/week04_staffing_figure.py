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
        }
        print(f"FY{year}: {len(clients)} clients with {MIN_FILINGS}+ filings", flush=True)
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(out, separators=(",", ":")) + "\n")
    print(f"{OUT.stat().st_size / 1024:.0f} KB -> {OUT}")


if __name__ == "__main__":
    main()
