# Rules that applied only during the React rewrite

The site moved to React page by page in October 2026 (#183, #185, #186, #190). While a page was being
converted, every batch followed `src/lib/README.md` and the rules below. They are kept here, with their ids,
because the batch records in this folder cite them. They no longer bind new work: every page has closed, and
`src/lib/README.md` holds the rules that still apply (R2-R22, W3, W4, W6, F1-F7, G1, G3, G6).

## Rule

- **R1 Zero static diff.** The built HTML of every page equals main's after `normalise()` in
  `tests/built-page.mjs`. `scripts/parity/static.mjs` checks it on every batch, locally and in CI.

## Working rules

- **W1 Setup.** `cp -Rc "$LL_NODE_MODULES" node_modules`, then `npm ls --depth=0` exits 0. Never
  `npm install` or `npm ci`, and never a symlink.
- **W2 Read first:** `src/lib/README.md`, this file, `scripts/parity/README.md`, your entries in
  `review/react-migration/map.json`, every source you convert and your page's fixtures under
  `scripts/parity/fixtures/`.
- **W5 Edit only the files your batch owns.** Gap protocol: write `review/react-migration/requests/<batch>.md`
  with the exact patch and the reason. If you must proceed, add a shim in your own folder whose first line is
  `// shim: <batch>` and list it in your final message.
- **W7 Parity files.** Your scenario is `scripts/parity/scenarios/<page>/<batch>.mjs`; your known files are
  `known/<page>/<batch>.json` and `known/<page>/faults-<batch>.json`. Never edit another batch's.

## Recipe F

- **F8** Your scenario drives every control (`{type}` keystrokes), opens your panels and hovers each chart.
  Known entries carry reasons and KB or FP ids.

## Recipe Z: close batches

- **Z1** Rebase onto the latest main and rebuild `$BASE` from it.
- **Z2** Delete every bridge and shim of the page with their mounts. The entry loader
  (`src/scripts/entries/` and `src/components/PageScripts.tsx`) is already gone.
- **Z3** Grep that no module of the page has top-level DOM, listeners, fetch or await.
- **Z4** Run `runtime.mjs --check-known <page>` and delete superseded known files.
- **Z5** Run all gates over every scenario file, and faults for every island (shards in the background).
- **Z6** Check that `pageScripts('<page>')` still lists every module the tests read.

## Gates

`$BASE` is `$(node scripts/parity/build-ref.mjs --ref <stage base sha> --print-out)`, prebuilt by the
orchestrator.

- **G2** `GITHUB_SHA=parity00000 npm run build` (in the background, polled), then
  `node scripts/parity/static.mjs $BASE out` exits 0.
- **G4** `node scripts/parity/runtime.mjs --base $BASE --head out --pages <p> --scenario <file>` for every
  scenario file of the page (the base files and every batch file present), each command under 90 s by
  `--estimate` (split with `--steps`): every step ok.
- **G5** `node scripts/parity/faults.mjs` with `--data` (`--files` your data and vendor files) and
  `--islands <your prefix> --modes render,effect` (`--shard`): every assertion holds, and the only expected
  diffs come from `faults-base.json` and your `faults-<batch>.json`.
