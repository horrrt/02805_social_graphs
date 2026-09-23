"""Week 4, section 1: Where does the hiring happen?  Owner: Àngela.

Network: companies x metro areas, projected onto metros. Two metros are linked
when the same companies hire in both; weight = positions both hire.
Week 4 methods: backbone (disparity filter, several alpha), Louvain on the
backbone, NMI against Census regions.

Questions
- Which cities hire the most?
- Once the small links go, what is left of the map?
- Is it one national job market or several regional ones?
- Do the same employers tie distant cities together?

Inputs: load("lca_fy2025"), load("worksites_fy2025"), load("lca_fy2024") for
the stability check; build/raw/week04/cbsa_2023.xlsx (python
analysis/week04_data.py --refs; read with header=2) maps county + state to a
metro area. Identify companies by EMPLOYER_FEIN, not by name.

Checks the post needs
- NMI between communities and Census regions, against shuffled regions.
- 100 Louvain seeds; the share of runs that agree per metro.
- FY2024 against FY2025.

Output: analysis/week04_where.json (every number the section quotes).
"""

from week04_data import load


def main():
    lca = load("lca_fy2025")
    # Certified H-1B only, as in the other two sections.
    lca = lca[lca["CASE_STATUS"].str.startswith("Certified") & (lca["VISA_CLASS"] == "H-1B")]
    print(f"{len(lca):,} certified H-1B filings")
    # TODO: county + state -> CBSA; company (FEIN) x metro weights; projection;
    # disparity filter; Louvain; NMI against regions; write the json.


if __name__ == "__main__":
    main()
