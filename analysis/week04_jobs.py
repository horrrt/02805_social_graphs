"""Week 4, section 2: Which jobs go together?  Owner: Niklas.

Network: companies x occupations (SOC code), projected onto occupations. Two
jobs are linked when the same companies hire both; weight = positions.
Week 4 methods: backbone (disparity filter, several alpha), then overlapping
communities (link communities or k-cliques).

Questions
- Which jobs are hired together?
- Which jobs belong to two clusters at once?
- Do the clusters follow the official job groups?

Inputs: load("lca_fy2025") (SOC_CODE, EMPLOYER_NAME, TOTAL_WORKER_POSITIONS),
load("perm_fy2025") (PWD_SOC_CODE, EMP_FEIN) for green-card hiring,
load("lca_fy2024") for the stability check. The first two digits of a SOC
code are its major group; build/raw/week04/soc_structure_2018.xlsx has the
names (run python analysis/week04_data.py --refs with CONTACT_EMAIL set).
Identify companies with week04_names.employer(EMPLOYER_NAME).

Checks the post needs
- NMI between clusters and SOC major groups, against shuffled groups.
- 100 Louvain seeds, or the stability of the overlap across runs.
- FY2024 against FY2025.

Output: analysis/week04_jobs.json (every number the section quotes).
"""

from week04_data import load


def main():
    lca = load("lca_fy2025")
    lca = lca[lca["CASE_STATUS"].str.startswith("Certified") & (lca["VISA_CLASS"] == "H-1B")]
    print(f"{len(lca):,} certified H-1B filings, {lca['SOC_CODE'].nunique():,} occupations")
    # TODO: company (FEIN) x SOC weights; projection onto SOC; disparity
    # filter; overlapping communities; NMI against major groups; write the json.


if __name__ == "__main__":
    main()
