# Version 2 · Apple theme Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Publish every arcade page a second time under `/v2/`, restyled after design-archive mockup 21 ("Connections, Reconsidered", modelled on apple.com) and Apple's Human Interface Guidelines, while the scripts, data and numbers stay shared with version 1.

**Architecture:** One new stylesheet, `docs/assets/css/apple.css`, expresses every selector that `arcade.css` and `os.css` style today in Apple's idiom. Seven HTML pages under `docs/v2/` reuse the scripts in `docs/assets/js/` unchanged; a `<meta name="site-root">` tag tells the shared chrome where the v2 root is, and canvas colours come from `--cv-*` CSS tokens so the same drawing code paints both themes. Tests pin v2 to the same schedule manifest as v1 and forbid any JavaScript under `docs/v2/`.

**Tech Stack:** Static HTML, CSS custom properties, native ES modules (no bundler), `node --test`, matplotlib for the light figure variants.

---

## Design decisions (from mockup 21 and the HIG)

- **Clarity.** One typeface stack (`-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "Helvetica Neue", Helvetica, Arial, sans-serif`), a strict scale (hero 80/1.05, section 48/1.08, lead 21/1.38, body 17/1.47, caption 12/1.33), text `#1d1d1f`, secondary `#6e6e73`, one accent `#0071e3`, system red `#ff3b30` for stranded or closed, sentence-case headlines that end with a period.
- **Deference.** White pages with `#f5f5f7` bands, hairlines `rgba(0,0,0,.1)`, no ornament, content-first hero (the lobby hero shows the network itself, as in the mockup, instead of the drawn arcade room).
- **Depth.** Translucent sticky nav (`backdrop-filter: saturate(180%) blur(20px)`), rounded 18 px tiles that lift on hover, a macOS-style desktop for MARVEL-OS (traffic-light window buttons, translucent dock).
- **Controls.** Pill buttons (`border-radius: 980px`), 44 px minimum targets, chevron links ("Learn more ›"), accordion rows for evidence, `accent-color` on native inputs, visible focus rings, reduced motion respected, light and dark appearance via `prefers-color-scheme`.
- **Copy.** Numbers and post content stay verbatim; eyebrows and headlines move to Apple's voice ("Connections, reconsidered." / "Pull one hero. See who gets stranded.").

## v2 page conventions

| Page | v2 path | `<up>` to `docs/` | `site-root` |
| --- | --- | --- | --- |
| lobby | `docs/v2/index.html` | `../` | `./` |
| os, trumps, sound, creature | `docs/v2/<name>/index.html` | `../../` | `../` |
| week01, week02 | `docs/v2/weeks/<week>/index.html` | `../../../` | `../../` |

Every v2 page: `<link rel="stylesheet" href="<up>assets/css/apple.css">`, `<link rel="icon" href="<up>assets/favicon.svg">`, `<meta name="site-root" content="<site-root>">`, `<script type="module" src="<up>assets/js/<same script>.js">`, `<body class="theme-apple page-<name>">`, alternating `<section class="section band">`, a footer link back to version 1. The lobby canvas is `<canvas id="lobby-canvas" data-scene="network">`. Week-2 figures point at the `_light.svg` variants.

---

### Task 1: Tokenise canvas colours and split site root from asset root (delegated subagent, in progress)

**Files:** `docs/assets/js/cabinet.js`, `lobby.js`, `creature.js`, `packs.js`, `transit.js`, `sonify.js`, `trumps.js`, `marvel-os.js`; token definitions with today's literal values in `docs/assets/css/arcade.css` and `docs/assets/css/os.css`; `tests/theme.test.mjs` (ROOT/ASSETS parity in node, `tone` fallback, token parity, `drawNetwork` `hollow` option).

**Acceptance:** `node --test 'tests/*.test.mjs'` green; no hex literal outside a `tone(` call in the arcade scripts; v1 pages pixel-identical.

### Task 2: Tests for v2 (RED first)

**Files:** Modify `tests/site.test.mjs`.

1. `V2` twin test: for each page in `ARCADE_PAGES`, `v2/<page>` exists, contains `assets/css/apple.css`, `<meta name="site-root"`, `rel="icon"`; every `<script src>`, `<link href>` and `<img src>` in it resolves to a file; no `.js` file exists under `docs/v2/`.
2. Lobby card test runs for both `index.html` and `v2/index.html`; hrefs resolve under each root.
3. Live week pages under v2 also name their course title.
4. Token parity with `apple.css`: every `tone("--cv-…")` name in the scripts is defined in `docs/assets/css/apple.css`.
5. v1 lobby links to `v2/` and the v2 lobby links to `../`.

Run: `node --test tests/site.test.mjs` → the new tests fail because `docs/v2` and `apple.css` do not exist.

### Task 3: `docs/assets/css/apple.css`

Cover every selector in `arcade.css` and `os.css` (list them with `grep -o '^[^{@ ][^{]*{'`). Keep layout facts that scripts rely on: `.stage` heights, `.desktop` height and positioning, `.window-layer`, `.os-window` sizing and the 680 px stacking rules, `.js [data-gated]` gating, `[hidden]`, `.sr-only`, `.skip`. Add `.band`, `.tile`, `.chevron`, `.members` pills, `.post` figures. Define light and dark token sets, including every `--cv-*` token reported by Task 1.

Check: `grep -c '' docs/assets/css/apple.css`; open each v2 page in the pane.

### Task 4: Light figure variants

**Files:** `analysis/week02_figures.py` (loop over a dark and a light palette; light writes `removal_results_light.svg` and `null_comparison_light.svg` next to the dark files).

Run: `~/.venvs/socialgraphs/bin/python analysis/week02_figures.py` → four SVGs; `git diff --stat docs/weeks/week02/figures` shows the dark files unchanged or regenerated from the same data.

### Task 5: Seven v2 pages

Create `docs/v2/index.html`, `docs/v2/weeks/week01/index.html`, `docs/v2/weeks/week02/index.html`, `docs/v2/os/index.html`, `docs/v2/trumps/index.html`, `docs/v2/sound/index.html`, `docs/v2/creature/index.html` from their v1 twins following the conventions above. Keep every id the scripts query (`grep -oh '\$("#[a-z-]*")' docs/assets/js/*.js`).

Run: `node --test 'tests/*.test.mjs'` → green.

### Task 6: Browser verification

Sync `docs/` to the scratch copy and load `http://localhost:8771/v2/`: nav, hero network with 17 hollow isolates, eight tiles, free-play shelf, about, accordion; week02 post block and light SVGs; OS desktop with traffic lights and dock; trumps, sound, creature; console clean; phone width; dark scheme.

### Task 7: Docs and links

`README.md` route table gets the `/v2/` twins; `PRESENTATION.md` gets a "Version 2 · Apple edition" section with the decisions above; v1 lobby footer links to v2.

### Task 8: Commit

One commit for Task 1 (already isolated), one for Tasks 2–7.
