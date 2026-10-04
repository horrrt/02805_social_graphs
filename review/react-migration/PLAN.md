# React rewrite plan

The full rewrite Gyula chose on 1 Oct 2026. `plan.json` holds the architecture, test strategy, known bugs and every batch spec; `map.json` maps the 58 scripts as they were on main 435d21c. Implementer agents read their batch from `plan.json` by id.

## Batches

| id | size | name | depends on |
| --- | --- | --- | --- |
| P0a | L | Parity tools in the repo |  |
| P0b | L | Parity scenarios, base known files and fixtures | P0a |
| P1 | M | Test ledger: walker and widened scans, green on main | P0b |
| P2a | M | Runtime modules, loader delegation and the React spike | P1 |
| P2b | M | Hooks, island() and ChartTip | P2a |
| P2c | M | Terms, segmented control, termify tree and the rules file | P2b |
| P3 | M | Shared server markup components (surveyed on every page, applied to template and kit) | P2c |
| K1a | S | Kit pure layer: decorationFor, stripLayout, miniLayout | P3 |
| K1b | L | React kit components and the kit page demos | K1a |
| K2 | L | NetworkView in React; kit page closed | K1b |
| K3 | M | Template page in React | K2 |
| W5-0 | M | Week 5 prep: section files, components, hover-tip and term records | K3 |
| W5-1 | M | Week 5 frame: hero scatter, findings, hover-tip compat | W5-0 |
| W5-2 | L | Week 5 relations, copying, autocomplete and the shared Marvel map | W5-0 |
| W5-3 | L | Week 5 search, heaps, fame, weird | W5-0 |
| W6-0 | M | Week 6 (conditional): map and prep | W5-0 |
| W5-Z | S | Week 5 close | W5-1, W5-2, W5-3, W6-0 |
| A0 | M | Arcade shared: logbook store, chrome, prediction, hash reveal; home markup | P3 |
| A1 | M | Week 1 packs page | A0 |
| A2 | L | Week 2 transit page | A0 |
| A-Z | S | Arcade close | A1, A2 |
| W4-0a | M | Week 4: split the page into section files | K3 |
| W4-0b1 | M | Week 4 components and slots (hero files) | W4-0a |
| W4-0b2 | M | Week 4 components and slots (body files) | W4-0a |
| W4-0b3 | M | Week 4 components and slots (cut files) | W4-0a |
| W4-0c | S | Week 4 slot coverage gate | W4-0b1, W4-0b2, W4-0b3 |
| W4-C1 | L | Week 4 deep-dive router, topics, panels, contents, top nav | W4-0c |
| W4-C2 | M | Week 4 frame: rail, terms, segments, tables, findings, opener | W4-0c |
| W4-F1a | L | Week 4 place: data, store and the five maps | W4-C1, W4-C2 |
| W4-F1b | M | Week 4 place: inspector panels, tables, alpha, groups | W4-F1a |
| W4-F2 | L | Week 4 questions | W4-C1, W4-C2 |
| W4-F3 | L | Week 4 methods | W4-C1, W4-C2 |
| W4-F4 | L | Week 4 entities | W4-C1, W4-C2 |
| W4-F5 | M | Week 4 staffing | W4-C1, W4-C2 |
| W4-F6 | M | Week 4 jobs | W4-C1, W4-C2 |
| W4-F7 | M | Week 4 years and roles | W4-C1, W4-C2 |
| W4-F8 | M | Week 4 skills and radar | W4-C1, W4-C2 |
| W4-F9 | M | Week 4 PageRank | W4-C1, W4-C2 |
| W4-F10 | M | Week 4 vis intros and more | W4-C1, W4-C2 |
| W4-Z | M | Week 4 close: compat and the legacy entry removed | W4-F1b, W4-F2, W4-F3, W4-F4, W4-F5, W4-F6, W4-F7, W4-F8, W4-F9, W4-F10 |
| W3-P1 | L | Week 3 purify, part 1: painters and RENDER_KEYS (lands on main) | P1 |
| W3-P2 | L | Week 3 purify, part 2: models, PAINT_TRIGGERS, exports (lands on main) | W3-P1 |
| W3-0 | M | Week 3 prep: section files, components, slots and coverage | K3, W3-P2 |
| W3-1 | L | Week 3 engine: stores, engine, api facade, driver, bridges | W3-0 |
| W3-1b | M | Week 3 style menu | W3-1 |
| W3-1c | L | Week 3 data canvases, picking, tables, slider, status | W3-1 |
| W3-1d | M | Week 3 globe, twin map, flow, layers, net note | W3-1 |
| W3-2 | L | Week 3 variants on React-rendered hosts | W3-1c, W3-1d |
| W3-3 | L | Week 3 panels in JSX | W3-1 |
| W3-4a | M | Week 3 questions drawer | W3-1 |
| W3-4b | M | Week 3 views drawer | W3-1 |
| W3-5 | S | Styleguide page | W3-0 |
| W3-Z | M | Week 3 and styleguide close | W3-1b, W3-2, W3-3, W3-4a, W3-4b, W3-5 |
| L1 | M | Play page: the signal game | P3 |
| L2 | M | Mockups gallery | P3 |
| L3 | L | Screen-test prototype | P3 |
| L-Z | S | Leaves close | L1, L2, L3 |
| Z | M | Cleanup: PageScripts, entries and legacy DOM builders removed; final docs | W5-Z, A-Z, W4-Z, W3-Z, L-Z, K3 |

## Merge stages

- Stage 1 (PR to main, invisible): P0a, then P0b, then P1. After P0a merges the orchestrator refreshes LL_NODE_MODULES with its devDependencies.
- Stage 2 (PR to main, invisible to readers): P2a, P2b, P2c, P3 in order. Merge outside 5-7 Oct (P3 changes the template source; Week 6 is due 7 Oct).
- Stage 3 (integration branch react/kit, one PR, outside 5-7 Oct): K1a, K1b, K2, K3. After it merges, new posts start from the React template, and react/week05, react/week04 and react/week03 are cut from main.
- Stage 4 (react/week05, one PR): W5-0, then W5-1 ∥ W5-2 ∥ W5-3 (∥ W6-0 and its follow-ups if Week 6 exists), then W5-Z.
- Stage 5 (react/arcade, one PR, may start after Stage 2): A0, then A1 ∥ A2, then A-Z. Includes the home page markup.
- Stage 6 (PRs to main, zero runtime diff, may start after Stage 1): W3-P1, then W3-P2. Runs beside Stages 2-5.
- Stage 7 (react/week04, one PR): W4-0a, then W4-0b1 ∥ W4-0b2 ∥ W4-0b3, then W4-0c, then W4-C1 ∥ W4-C2, then W4-F1a ∥ W4-F2 … W4-F10 (W4-F1b after W4-F1a), then W4-Z. Runs beside Stage 8.
- Stage 8 (react/week03, one PR, after Stages 3 and 6): W3-0, W3-1, then W3-1b ∥ W3-1c ∥ W3-1d ∥ W3-3 ∥ W3-4a ∥ W3-4b ∥ W3-5, W3-2 after W3-1c and W3-1d, then W3-Z. Includes the styleguide.
- Stage 9 (react/leaves, one PR, may start after Stage 2): L1 ∥ L2 ∥ L3, then L-Z.
- Stage 10 (PR to main): Z, after every page stage has merged.
- Orchestrator rules: at most three implementers at once; $BASE prebuilt per stage before a wave (build-ref locks); close batches (K2, K3, W5-Z, A-Z, W4-Z, W3-Z, L-Z, Z) edit src/components/PageScripts.tsx and run one at a time, each rebased onto the latest main with $BASE rebuilt, and each page PR merges before the next close batch starts; gap requests applied on the integration branch between waves; content freeze per page while its branch is open; every PR carries the zero-diff label; the owner approves every merge to main.
