# Handoff, 4 Oct 2026

Where the React rewrite stands, for the next session. The plan is [PLAN.md](PLAN.md); batch specs are in
[plan.json](plan.json).

## Stage 1: PR #149 (draft, CI green), waiting on the owner's merge

- **P0a** parity tools: done.
- **P0b** scenarios, known files, fixtures: verified in a cloud container on 4 Oct, except the parts listed below.
  - 28 of 30 scenario files pass main-vs-main against `7978c8a`.
  - `week03/base-globe-b` and `base-atlas-b` time out on `scrollIntoViewIfNeeded` on both sides there (no GPU,
    software WebGL). Re-run those two on the Mac.
  - Fixtures cover every termify call (week04 10, week05 21, template 1) and all 11 week05 chart hosts. Every
    known entry has a reason.
  - **Not run:** `faults.mjs --data` main-vs-main for week04 and week05 (stopped). Run it on the Mac:
    `node scripts/parity/faults.mjs --base $BASE --head $BASE --pages week05 --data --shard i/6` (week04: `/3`).
- **P1** test ledger: done. 335 tests pass, and the static parity check finds no difference. The two departures
  from its spec are in [requests/P1.md](requests/P1.md).

## Next: Stage 2, starting with P2a

Don't merge Stage 2 between 5 and 7 Oct (Week 6 is due 7 Oct).

- **Spike:** done. Results are in [spike.md](spike.md). Points that change later batches:
  - Without a boundary, one effect error blanks the whole page. Every island needs `catchError`.
  - A throw during hydration still client-renders the whole root unless a `<Suspense>` wraps the boundary.
  - React's `stopPropagation()` doesn't stop other listeners on `document`.
  - The App Router runs Next's bundled React canary, not `node_modules/react`.
  - `ErrorInfo.error` is typed `unknown`.
- **Runtime modules** (`src/scripts/runtime/`): drafted but not committed, so the next session rewrites them from
  the spec. The design was:
  - `loadVendor` keeps one promise per URL and evicts it on error, but keeps the failed `<script>`. A retry then
    rejects without a new request, as the old week03 and entities loaders did.
  - Each legacy loader becomes a thin wrapper that keeps its own error text and resolved value:
    - kit: `"could not load ECharts"`
    - graph: `"could not load d3"`
    - week04-place and week04-methods: reject with an `Event`, so the status still reads `…: undefined`
    - the week04 entry: `could not load assets/vendor/…`
- **Running parity tools in a Linux container:** set `PARITY_CHROMIUM=/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell`
  and point `PARITY_DIR` at a writable directory.
