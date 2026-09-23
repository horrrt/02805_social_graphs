---
name: review
description: Review the current branch's changes against the repository rules and the data.
agent: agent
---

Review the changes on this branch against `origin/main`. Do not edit files.

Read `git diff origin/main...HEAD` and any uncommitted changes, then check each item:

1. Numbers: every number added to a page appears in a JSON file written by a script in `analysis/`. Open the
   JSON and compare. Report any number you cannot trace.
2. Claims: each claim states its baseline (a null model or shuffled labels) and does not go beyond what the
   number shows. A claim about "workers" should say "filings" or "requested positions" if that is the unit.
3. Data safety: no file under `build/`, no raw workbook, no personal columns, no email or token in code.
4. Site: no hex colour in a new JavaScript file, no CDN script, the week 4 `noindex` tag is still there,
   no element ID or route renamed.
5. Prose: the rules in `.github/instructions/writing.instructions.md`, including no em dashes.
6. Scope: the change stays inside the section its author owns (see `WEEK04.md`).
7. Tests: `node --test 'tests/*.test.mjs'` passes, and new calculations have a check.

Report findings ordered by severity, each with `file:line`, what is wrong, and a concrete fix. Say
"no findings" for a clean item instead of skipping it.
