# Social Graphs post work

The rules every coding assistant follows here (Copilot, Claude Code, Codex) are in
[.github/copilot-instructions.md](.github/copilot-instructions.md), with rules for analysis code, site code
and prose in [.github/instructions/](.github/instructions/). Read them before changing anything.

Before creating or editing a weekly post, read [POST_GUIDE.md](POST_GUIDE.md). It records the user's design, writing, review and scope preferences and the required post-review workflow. Read the official brief for that week and retain existing data, routes, anchors and saved progress.

Claude Code only: use the frontend-design and writing-clearly-and-concisely skills when applicable. Prefer codebase-memory-mcp for code discovery; fall back to file searches when graph results are insufficient.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
