"""Week 4, section 3: Who really employs them?  Owner: Gyula.

Network: outsourcing firm -> client company, weight = worker positions.
Built from filings that name a secondary entity (SECONDARY_ENTITY = Yes),
plus the extra clients in the worksites file.
Week 4 methods: communities on the bipartite graph against a bipartite shuffle,
weights (strength against degree, single-vendor dependence).

Questions
- How many workers sit at a client instead of their own employer?
- Do clients group by industry or by the firm that staffs them?
- Who relies on a single vendor?
- Does it hold from year to year?

Inputs: load("lca_fy2025"), load("worksites_fy2025"), load("lca_fy2024").
Clients have no tax number, so their names need cleaning: drop placeholders
("Home Address", "Beneficiary's Residence", "Remote", "TBD Open", "Client
Location"), strip "- Client Location", merge corporate families.

Checks the post needs
- Modularity against a bipartite configuration model (every firm and client
  keeps its number of links); NMI with NAICS against shuffled labels.
- 100 Louvain seeds; FY2024 against FY2025.

Output: analysis/week04_staffing.json (every number the section quotes).
"""

from week04_data import load


def main():
    lca = load("lca_fy2025")
    lca = lca[lca["CASE_STATUS"].str.startswith("Certified") & (lca["VISA_CLASS"] == "H-1B")]
    placed = lca[lca["SECONDARY_ENTITY"].str.upper().str.startswith("Y")]
    print(f"{len(placed):,} of {len(lca):,} filings place workers at a client")
    # TODO: clean client names; firm -> client weights; bipartite Louvain and
    # null; vendor concentration per client; write the json.


if __name__ == "__main__":
    main()
