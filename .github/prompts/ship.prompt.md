---
name: ship
description: Bring the branch up to date with main, run the checks, commit and open a pull request.
agent: agent
argument-hint: what the change does, in one line
---

Ship the current work as a pull request. The person's one-line summary: ${input:summary:what the change does}

1. If the current branch is `main`, create a branch named after the change (`week04-<short-name>`) first.
2. `git fetch origin` and merge `origin/main` into the branch. If files conflict, stop and show the
   conflicts; do not resolve another member's section on your own.
3. Run the checks as `/check` describes. Stop and report if any fails.
4. Stage only the files this change needs. Never stage `build/`, raw workbooks or personal data.
5. Commit with a message in the house style (`.github/instructions/writing.instructions.md`): a short
   subject line, then what changed and why.
6. Push the branch and open a pull request into `main`: with `gh pr create` if the GitHub CLI is set up,
   otherwise give the link GitHub prints after the push. The description lists what changed and which
   checks ran.
7. Do not merge. Report the pull request link.
