---
name: Analysis scripts
description: Rules for the Python analysis behind the site's numbers.
applyTo: "analysis/**"
---

# Analysis scripts

- Run scripts from the repository root with the project environment (`.venv-course`).
- Read week 4 data with `load("lca_fy2025")` from `analysis/week04_data.py`. Never read `build/raw/` directly.
- Keep to certified H-1B filings unless the section says otherwise: `CASE_STATUS` is exactly "Certified" (not "Certified - Withdrawn") and
  `VISA_CLASS` is "H-1B".
- Identify companies only through `resolver()` in `analysis/week04_staffing.py`: `employer(name, fein)`,
  `client(name)` and `label(key)`. Do not write your own name cleaning.
- To merge two company names, add a row to `analysis/week04_client_aliases.csv` that follows the rule at its
  top, then run `python analysis/week04_names_check.py`. Separately branded subsidiaries (LinkedIn, Optum)
  stay separate companies.
- Weight links by filings, not requested positions: one firm asks for 40 positions on every filing.
- Every claim needs a baseline. Report modularity against the degree-preserving rewiring (`rewire()`), and
  NMI against shuffled labels (`shuffled_nmi()`), with the p-value.
- Run Louvain through `louvain(graph, seed)` in `analysis/week04_staffing.py` (igraph, about 25 times faster
  than networkx), many times with fixed seeds (`SEED + i`), not once, and report the spread.
- Write every number the page quotes to the script's JSON in `analysis/` or `docs/`. The page reads it
  from there.
- When a page script reads a new field, add it to its model in `analysis/week04_schemas.py`, and call
  `check(path, data)` before writing the page file.
- Wrap a loop that runs longer than a minute in `tracked()` from `analysis/week04_staffing.py`, so it prints
  progress and time left.
- Use a tested library (networkx, igraph, scikit-learn, rapidfuzz) for any method with a name in the literature.
- Add a dependency to both `requirements.txt` and `requirements-lock.txt` with an exact version.
