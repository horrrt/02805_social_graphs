# Social Graphs post work

The rules every coding assistant follows here (Copilot, Claude Code, Codex) are in
[.github/copilot-instructions.md](.github/copilot-instructions.md), with rules for analysis code, site code
and prose in [.github/instructions/](.github/instructions/). Read them before changing anything.

Before creating or editing a weekly post, read [project/POST_GUIDE.md](project/POST_GUIDE.md). It records the user's design, writing, review and scope preferences and the required post-review workflow. Read the official brief for that week and retain existing data, routes, anchors and saved progress.

## Checks

- Site or tests changed: `npm test` must end with `fail 0`; `npm run typecheck` must pass.
- Page data changed: `python analysis/check_pages.py` prints `ok` for every file.
- An analysis script changed: rerun it under `PYTHONHASHSEED=1` and `2`; both match the committed output.
- A number on a page changed: a test in `tests/` builds that sentence from the JSON and fails on a mismatch.
- Commits: Conventional Commits, header 72 characters at most; `.githooks/commit-msg` checks it.

The full list, with the Week 4 scripts and environment, is in the Copilot instructions above.

## Never

- Commit anything under `build/`, a raw DOL or USCIS workbook, or the personal columns the loader refuses:
  contact and lawyer names, emails, phone numbers, addresses, citizenship.
- Type a number into a page by hand. Change the script, rerun it, and read the number from its JSON.
- Invent a result, a source, a group reaction or a completed submission.
- Load a script, font or stylesheet from a CDN at runtime. Use the copies in `public/assets/vendor/`.
- Remove the `robots: "noindex"` metadata from `src/app/(week04)/layout.tsx`, or rename a route, element
  ID, storage key or data file that other code reads.
- Put an email address, password or token in code. Downloads that need a contact read `CONTACT_EMAIL`
  from the environment.
- Push straight to `main`. Work on a branch, open a pull request and merge it once its checks pass.
- Delete or rewrite another member's section without being asked. Week 4's section owners are listed in
  `project/WEEK04.md`. Weeks 1 to 3 have no owner table, so ask before rewriting their prose.

## Assistant notes

Claude Code only: use the frontend-design and writing-clearly-and-concisely skills when applicable. Prefer codebase-memory-mcp for code discovery; fall back to file searches when graph results are insufficient.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
