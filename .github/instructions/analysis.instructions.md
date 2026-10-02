---
name: Analysis scripts
description: Rules for the Python analysis behind the site's numbers.
applyTo: "analysis/**"
---

# Analysis scripts

- Run scripts from the repository root with the project environment (`.venv-course`).
- Before you change a script, rerun it and confirm it reproduces its committed JSON.
- Every claim needs a baseline that keeps what the claim does not test. Report modularity against the
  degree-preserving rewiring (`rewire()` in `analysis/week04_staffing.py`), and NMI against shuffled labels
  (`shuffled_nmi()`), with the p-value. When a claim fails its baseline, change the claim.
- Run Louvain through `louvain(graph, seed)` in `analysis/week04_staffing.py` (igraph, about 25 times faster
  than networkx), many times with fixed seeds (`SEED + i`), not once. Report the partition found most often
  and how often it recurs, and compare a gap between two methods with the gap between two seeds of one.
- Keep reruns identical: seed every random step, sort a set before drawing from it, and break ties on a
  stable key. After a change, rerun under `PYTHONHASHSEED=1` and `PYTHONHASHSEED=2` and compare the files.
- Repeat a headline on a second year or sample when the data has one. Compare two statistics only when both
  cover the same items.
- Check what a file covers before you name it (its dates, its reporting units), report the share of rows a
  fuzzy join matched, and write each trap into the week's notes (`project/WEEK04.md` keeps a list).
- Write every number the page quotes to the script's JSON in `analysis/` or `public/`. The page reads it
  from there, and a test in `tests/` builds each sentence from that JSON (`tests/week04-prose.test.mjs`).
  Pin the names and the words a sentence attaches to a number too, such as "about twice".
- When a page script reads a new field, add it to that week's model (`analysis/week01_schemas.py` to
  `analysis/week04_schemas.py`), and run `python analysis/check_pages.py`. Call `check(path, data)` from
  `analysis/check_pages.py` right before writing a page file.
- Wrap a loop that runs longer than a minute in `tracked()` from `analysis/week04_staffing.py`, so it prints
  progress and time left. Run independent scripts in parallel, as `analysis/week04_run_all.py` does.
- Use a tested library (networkx, igraph, scikit-learn, rapidfuzz) for any method with a name in the literature.
- Add a dependency to both `requirements.txt` and `requirements-lock.txt` with an exact version.

## Week 4 data

- Read the filings with `load("lca_fy2025")` from `analysis/week04_data.py`. Never read `build/raw/` directly.
- Keep to certified H-1B filings unless the section says otherwise: `CASE_STATUS` is exactly "Certified" (not
  "Certified - Withdrawn") and `VISA_CLASS` is "H-1B".
- Identify companies only through `resolver()` in `analysis/week04_staffing.py`: `employer(name, fein)`,
  `client(name)` and `label(key)`. Do not write your own name cleaning.
- To merge two company names, add a row to `analysis/week04_client_aliases.csv` that follows the rule at its
  top, then run `python analysis/week04_names_check.py`. Separately branded subsidiaries (LinkedIn, Optum)
  stay separate companies.
- Weight links by filings, not requested positions: one firm asks for 40 positions on every filing.
- Week 4 scripts validate with `week04_schemas.check`, which does the same as `check_pages.check`.
