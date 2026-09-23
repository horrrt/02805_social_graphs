---
name: check
description: Run the checks that match what changed, and report each result.
agent: agent
---

Run the repository checks for the current changes and report the results. Do not edit files.

1. List what changed: `git status --short` and `git diff --name-only origin/main...HEAD`.
2. Pick the checks from the "Checks" section of `.github/copilot-instructions.md` that match those files.
   Always run `node --test 'tests/*.test.mjs'` and `python analysis/check_pages.py`.
3. Run each one in the terminal with the project environment and wait for it to finish. The staffing script
   takes about 2 minutes; say so before starting it.
4. Look for staged files that must never be committed: anything under `build/`, `.xlsx` or `.csv.gz`
   workbooks, or columns with contact names, emails or phone numbers.
5. Report a table: check, command, result (pass or fail with the first error line). Then list what you
   did not check, such as the page in a browser.

If a check fails, explain the cause from its output and propose a fix. Do not apply it unless asked.
