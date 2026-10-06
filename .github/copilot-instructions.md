# Log–Log Legends: how to work in this repository

DTU 02805 Social Graphs and Interactions, group Log-Log Legends (Àngela, Gyula, Niklas). `public/` is the
course website, published to GitHub Pages from `main`. `analysis/` holds the Python scripts behind every
number on it. `tests/` checks the site with Node's built-in test runner.

These rules apply to every request. The files in `.github/instructions/` add rules for analysis code,
site code and prose. `AGENTS.md` and `project/POST_GUIDE.md` hold the group's post-writing preferences.

## Work in this order

1. Read before you write. Open [project/POST_GUIDE.md](../project/POST_GUIDE.md) for any post, [project/WEEK04.md](../project/WEEK04.md)
   for week 4, every file you will change, and the script that produces the data a page shows.
2. Before you change an analysis script, rerun it and confirm it reproduces its committed JSON. A file that
   no longer reproduces is stale, and the page that quotes it may already be wrong.
3. For a change that touches more than one file, list the steps first and name the file each step changes.
4. Make the change. Keep the surrounding style: naming, comment density, formatting.
5. Run the checks below that match what you changed, and read their output. Fix failures before you report.
6. Report what changed, which checks you ran with their result, and what you did not check. Never say a
   check passed without running it in this session.

If the request is ambiguous or a rule below blocks it, stop and ask. Do not guess at data, sources or results.

## Checks

- Site or tests changed: `npm test` (it builds the site, then runs `node --test 'tests/*.test.mjs'`) must
  end with `fail 0`. It includes
  `tests/text-budget.test.mjs`, which holds every post from Week 4 on to Week 4's density; for text a page
  script draws, run the console check in project/POST_GUIDE.md, "Keep the card short".
- `analysis/week04_names.py`, `analysis/week04_client_aliases.csv` or `analysis/week04_name_merges.csv`
  changed: `python analysis/week04_names_check.py` must exit 0 and print `"failures": []`.
- Any page data changed: `python analysis/check_pages.py` must print `ok` for every file. It checks every
  week's page JSON against the fields and cross-references its page scripts read (Pydantic models in
  `analysis/week01_schemas.py` to `analysis/week04_schemas.py`).
- A page quotes a script's output: rerun that script and use its fresh JSON. For weeks 1 to 3,
  `python analysis/run_all.py` reruns every script in parallel (or `week02`, or one script) and lists each
  committed file that changed. For week 4, section 1 is `analysis/week04_where.py`, section 2
  `analysis/week04_jobs.py`, section 3 `analysis/week04_staffing.py` then
  `analysis/week04_staffing_figure.py`, and `python analysis/week04_run_all.py` reruns them all in parallel.
  The staffing script takes about 2 minutes and prints progress.
- A number on a page changed or was added: a test in `tests/` builds that sentence from the JSON and fails
  when the page disagrees. `tests/week04-prose.test.mjs` shows the pattern. Prove a new test bites by
  changing the number once and watching it fail.
- An analysis script changed: rerun it with `PYTHONHASHSEED=1` and again with `PYTHONHASHSEED=2`. Both
  outputs must be identical, and identical to the committed file apart from what you meant to change.
- Page changed: run `npm run dev`, open the page you changed (week 4 is
  http://localhost:8765/weeks/week04/), and confirm the browser console shows no errors.
  Desktop only.
- Use the project environment: `.venv-course/bin/python` (Windows: `.venv-course\Scripts\python`), built
  from `requirements-lock.txt` as project/DEVELOPMENT.md describes.

`/check` runs the matching checks for you; `/review` reviews a diff against these rules; `/ship` opens a
pull request.

## Commit messages and pull request titles

Use [Conventional Commits](https://www.conventionalcommits.org). `.github/workflows/commit-format.yml`
checks every pull request against `commitlint.config.mjs`.

```
fix(week04): replace the stale 818 with 817 in section 5B

Why the change was needed, in plain sentences, wrapped at 72 characters.
```

- Header: `type(scope): subject`, 72 characters at most, imperative ("add", not "added"), no full stop.
- Types: `feat` (new analysis, section or page feature), `fix` (a wrong number, broken page, bug),
  `docs`, `refactor` (same result, different structure), `perf`, `test`, `build`, `ci`, `chore`.
- Scopes: `week01` to `week08`, `site`, `analysis`, `names`, `data`, `tests`, `ci`, `deps`, `docs`.
- Body: what changed and why, in sentences. Name the number that moved when a rerun moves one.
- A pull request title follows the same format.
- `.githooks/commit-msg` rejects a header CI would fail, before the commit exists. `npm install`
  turns it on; in a checkout without one, run `git config core.hooksPath .githooks`. Never skip it
  with `--no-verify`: three pull requests (#94, #126, #166) needed a force-push for a long header.

## Never

- Commit anything under `build/`, a raw DOL or USCIS workbook, or the personal columns the loader refuses:
  contact and lawyer names, emails, phone numbers, addresses, citizenship.
- Type a number into a page by hand. Change the script, rerun it, and read the number from its JSON.
- Invent a result, a source, a group reaction or a completed submission.
- Load a script, font or stylesheet from a CDN at runtime. Use the copies in `public/assets/vendor/`.
- Remove the `noindex` meta tag from `src/app/(week04)/weeks/week04/page.tsx`, rename a route, element ID, storage key
  or data file that other code reads.
- Put an email address, password or token in code. Downloads that need a contact read `CONTACT_EMAIL`
  from the environment.
- Push straight to `main`. Work on a branch, open a pull request and merge it once its checks pass.
- Delete or rewrite another member's section without being asked. Week 4's section owners are listed in
  `project/WEEK04.md`. Weeks 1 to 3 have no owner table, so ask before rewriting their prose.
