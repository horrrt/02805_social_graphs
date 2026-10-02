---
name: review
description: Review the current branch's changes against the repository rules and the data.
agent: agent
---

Review the changes on this branch against `origin/main`. Do not edit files.

Read `git diff origin/main...HEAD` and any uncommitted changes, then check each item:

1. Numbers: every number added to a page appears in a JSON file written by a script in `analysis/`. Open the
   JSON and compare. Report any number you cannot trace, and any that no test in `tests/` pins.
2. Consistency: the page never gives one quantity twice with different values, and never tells one result
   in several places.
3. Claims: each claim states its baseline (a null model or shuffled labels) and does not go beyond what the
   number shows. A claim about "workers" should say "filings" or "requested positions" if that is the unit.
4. Data safety: no file under `build/`, no raw workbook, no personal columns, no email or token in code.
5. Site: no hex colour in a new JavaScript file, no CDN script, the week 4 `noindex` tag is still there,
   no element ID or route renamed.
6. Prose: the rules in `.github/instructions/writing.instructions.md`, including no em dashes.
7. Scope: the change stays inside the section its author owns (see `project/WEEK04.md` for week 4).
8. Reruns: a changed analysis script gives identical output under `PYTHONHASHSEED=1` and `2`.
9. Tests: `npm test` passes, and new calculations have a check.

Report findings ordered by severity, each with `file:line`, what is wrong, and a concrete fix. Say
"no findings" for a clean item instead of skipping it.
