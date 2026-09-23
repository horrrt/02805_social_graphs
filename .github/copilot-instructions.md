# Log–Log Legends: how to work in this repository

DTU 02805 Social Graphs and Interactions, group Log-Log Legends (Àngela, Gyula, Niklas). `docs/` is the
course website, published to GitHub Pages from `main`. `analysis/` holds the Python scripts behind every
number on it. `tests/` checks the site with Node's built-in test runner.

These rules apply to every request. The files in `.github/instructions/` add rules for analysis code,
site code and prose. `AGENTS.md` and `POST_GUIDE.md` hold the group's post-writing preferences.

## Work in this order

1. Read before you write. Open [POST_GUIDE.md](../POST_GUIDE.md) for any post, [WEEK04.md](../WEEK04.md)
   for week 4, every file you will change, and the script that produces the data a page shows.
2. For a change that touches more than one file, list the steps first and name the file each step changes.
3. Make the change. Keep the surrounding style: naming, comment density, formatting.
4. Run the checks below that match what you changed, and read their output. Fix failures before you report.
5. Report what changed, which checks you ran with their result, and what you did not check. Never say a
   check passed without running it in this session.

If the request is ambiguous or a rule below blocks it, stop and ask. Do not guess at data, sources or results.

## Checks

- Site or tests changed: `node --test 'tests/*.test.mjs'` must end with `fail 0`.
- `analysis/week04_names.py`, `analysis/week04_client_aliases.csv` or `analysis/week04_name_merges.csv`
  changed: `python analysis/week04_names_check.py` must exit 0 and print `"failures": []`.
- Any page data changed: `python analysis/week04_schemas.py` must print `ok` for every file. It checks that
  each JSON has the fields and cross-references its page script reads; every script also runs it before
  writing.
- A page quotes a script's output: rerun that script and use its fresh JSON. Section 1 is
  `analysis/week04_where.py`, section 2 `analysis/week04_jobs.py`, section 3 `analysis/week04_staffing.py`
  then `analysis/week04_staffing_figure.py`. The staffing script takes about 2 minutes and prints progress.
- Page changed: serve it with `python -m http.server 8765 --directory docs`, open
  http://localhost:8765/weeks/week04/, and confirm the browser console shows no errors. Desktop only.
- Use the project environment: `.venv-course/bin/python` (Windows: `.venv-course\Scripts\python`), built
  from `requirements-lock.txt` as the README describes.

`/check` runs the matching checks for you; `/review` reviews a diff against these rules; `/ship` opens a
pull request.

## Never

- Commit anything under `build/`, a raw DOL or USCIS workbook, or the personal columns the loader refuses:
  contact and lawyer names, emails, phone numbers, addresses, citizenship.
- Type a number into a page by hand. Change the script, rerun it, and read the number from its JSON.
- Invent a result, a source, a group reaction or a completed submission.
- Load a script, font or stylesheet from a CDN at runtime. Use the copies in `docs/assets/vendor/`.
- Remove the `noindex` meta tag from `docs/weeks/week04/index.html`, rename a route, element ID, storage key
  or data file that other code reads.
- Put an email address, password or token in code. Downloads that need a contact read `CONTACT_EMAIL`
  from the environment.
- Push to `main` or merge a pull request unless the person asks you to. Work on a branch and open a PR.
- Delete or rewrite another member's section without being asked. Section owners are listed in `WEEK04.md`.
