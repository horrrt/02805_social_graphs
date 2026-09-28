# Week 4 redesign: port plan in three pull requests

Plan written 28 September 2026 against branch `claude/week04-design-components` (HEAD b648a72, `main` after #84).
It ports the finished design in `design_final/` into `docs/weeks/week04/index.html` and its CSS and JS.
Implementer agents will not see the conversation that produced it, so every step names its files, selectors and IDs.

The PRs land in order and each one deploys on merge:

1. **PR1 "components"**: the rail, drawers, card anatomy, one segmented control, the deep dive as topics, numbered deep-dive cards and table styling. The page's words stay the same.
2. **PR2 "charts"**: the 18 items in `CHART_CHANGES.md`, plus the three data-driven blocks the boards add. The words stay the same, except the caption of each chart that changes.
3. **PR3 "text"**: the boards' wording goes into the page. The structure stays the same.

Keeping words and structure in separate PRs makes each one checkable by a machine: PR1 must not change the page's sentences and PR3 must not change its skeleton. Section 0 holds what every task needs. Read it before you take any task.

---

## 0. Before any task

### 0.1 Paths

| What | Where |
| --- | --- |
| Worktree | `/Users/gyula/Documents/Projects/code/02805-social-graphs/.claude/worktrees/week-4-design-6991bf` |
| Design folder (scratch, may be cleaned) | `/private/tmp/claude-501/-Users-gyula-Documents-Projects-code-02805-social-graphs--claude-worktrees-week-4-design-6991bf/bbf9671c-90ab-46d5-9979-7e3d84f3d8cd/scratchpad/design_final/` |
| Chart scripts the design used | the folder above `design_final/`: `rolestip.js`, `sect.js`, `radar.js`, `pr.py`, `lot.py`, `s2b.py`, `ego.py`, `tab.py`, `netsvg.py`, `jobgroups.py`, `jobs_crosstab.json` |
| Page | `docs/weeks/week04/index.html` (2,565 lines) |
| Page CSS | `docs/assets/css/week04.css` plus nine `week04-*.css` files, all linked in the page `<head>` |
| Page JS | `docs/assets/js/week04-*.js`, each with its own `<script type="module">` tag at lines 2548 to 2563, except the helpers `week04-strip.js` and `week04-map-reset.js` |
| Page data | `docs/weeks/week04/data/*.json` and `docs/assets/data/week04_place.json` |
| Tests | `node --test 'tests/*.test.mjs'` (233 pass today) |
| Python | `/Users/gyula/Documents/Projects/code/02805-social-graphs/.venv-course/bin/python` (has bs4 4.15; no lxml, use `html.parser`) |

**First step of PR1:** copy `design_final/` into the repository as `review/week04-final/`. Include the boards, `CHART_CHANGES.md`, this plan and the ten chart scripts listed above. From then on every task reads the boards from the repository, because the scratch folder can disappear. `review/` is not deployed.

### 0.2 How to read a board

`project/R*.dc.html` are canvas templates. The page markup sits inside `<div class="corridor rx">`: the topbar, then `nav.rx-rail`, then `<main>`.

**Take:**
- the element order inside each card;
- class names, including `rx-*`;
- drawer labels and the text of every slot (text only in PR3);
- the `rx-*` CSS in each board's `<style>`.

**Do not port these. JS renders them, or they belong to the canvas:**
- `style="user-select: none; …"` on chart hosts (ECharts adds it);
- `<img src="/_blob/…">` (static renders of the live charts);
- filled `<tbody>` rows, `<option>` lists and `<datalist>` contents;
- the `aria-pressed` states, the `w4-has-reset` class and the text inside any element whose ID a script writes (list in 0.6);
- `{{holes}}`, `onClick="{{…}}"`, `sc-for`, `sc-if`, `<helmet>`, `<x-dc>` and `<script type="text/x-dc">`;
- the absolutely positioned `nav.rx-rail`;
- the second copy of the topbar;
- `div.rx-hover-states` in the roles card, which documents the tooltip and is not page content.

The canvas pages have fixed heights (`height: 2037px; overflow: hidden`). Ignore them.

### 0.3 Rules that bind every task

These come from `.github/copilot-instructions.md`, `.github/instructions/*.md` and `POST_GUIDE.md`.

**Code:**
- Static HTML, CSS and ES modules, with no build step.
- Load data with `fetch(new URL("…", import.meta.url))`.
- Vendored libraries only: ECharts 5.5.1 and D3 7.9.0 in `docs/assets/vendor/`.
- **No hex colour in any JS file that `tests/theme.test.mjs` scans.** That is every `docs/assets/js/*.js` except `mockups.js`, `signal.js`, `corridor.js`, `week04-place.js`, `week04-jobs.js` and `week04-questions.js`. The check is line by line, so comments and strings count too. Read colours with `getComputedStyle`, as `token()` in `week04-strip.js` does.
- `site.test.mjs` scans every `.html`, `.js` and `.mjs` under `docs/`. It forbids `preview` and `previews` as words, `TODO`, `The finding goes here` and `Lorem ipsum`, and it requires every `href="#x"` to resolve to an `id="x"` on the same page.

**Data:**
- **Never type a number into the page or a JS file by hand.**
- A number comes from a page JSON that the script loads, or it sits in a sentence that a test in `tests/` builds from JSON. Structural constants such as α stops, years and the "7 boxes" count count as numbers too: render them from data or compute them.
- If a chart needs data that no page JSON holds, change the analysis script that owns the JSON, update `analysis/week04_schemas.py` and run `python analysis/check_pages.py`. Then rerun under `PYTHONHASHSEED=1` and `PYTHONHASHSEED=2` and expect identical output.

**Stability:**
- Keep every element ID, anchor, route, data file and storage key that other code or tests read. The week 4 scripts use no storage keys.
- Bump the `?v=` on every CSS or JS link you change. `week04-staffing.js` has none; give it `?v=1` in PR1.
- **Never import a module that has its own `<script>` tag.** Its `?v=` URL and a bare import are two different module instances, so every listener would bind twice. Scripts talk to each other through DOM `CustomEvent`s. Only helpers without a tag are imported: `week04-strip.js`, `week04-map-reset.js`, `cabinet.js`, and the new `week04-ui.js` and `week04-tables.js`.

**Scope and process:**
- Desktop only, with no phone layouts.
- Every disclosure, popover and control works from the keyboard, and Escape closes a popover.
- Every chart needs a hover tooltip, a caption that says how to read it, and a table or text alternative.
- Prose: no em dashes, years as 2025 rather than FY2025, no code names or file names.
- The user authorised changes to every section, including Àngela's (section 1) and Niklas's (opening, section 2, closing). Say so in each PR body.
- Commit messages and PR titles follow Conventional Commits with scope `week04`, for example `feat(week04): …`.
- Run the `reviewer` agent on each PR's diff before merging, as `POST_GUIDE.md` requires.

### 0.4 What we measured before writing this plan

**Tests against the boards.** The boards, concatenated in page order (RTop, ROpening, RS1 to RS5, RClosing, RDeep, the five topic boards, RData), were run through instrumented copies of `week04-prose.test.mjs` and `week04-questions.test.mjs`. The copies collect failures instead of stopping at the first one. The same copies pass with 0 failures on today's page.

On the boards, 83 assertions fail (76 in prose, 7 in questions):

- **61 are region failures.** The pinned sentence exists in the boards, but the test's region helper no longer finds it:
  - `box(id)`, `lotteryText` and the ties region stop at the first `</details>`, which is now the first drawer;
  - `who-first-round` is gone;
  - `id="place-rank"` now sits before the notices that hold its numbers.

  PR1 fixes these with a tag-balanced `block(id)` helper (step 1.3.1).
- **5 disappear once the flattening is term-aware.** Wrapping a word in `.w4-term` turns "(p = 0.10" into "( p = 0.10" after tags become spaces. PR1's helper unwraps `.w4-term` first.
- **16 are real wording changes or drops.** PR3 handles them; they are tabled in 3.6.
- **1 is structural:** `#cut-more` no longer exists (test `one deep dive…`). PR1 updates it.

**IDs.**
- 37 IDs in today's static HTML appear in no board. Section 1.4 tables each one with its fate.
- 9 board IDs are new: `place-start`, `years-card`, and seven that already exist at runtime because JS creates them (`cut-skills-direct`, `cut-skills-cluster`, `cut-skills-radar`, `cut-pagerank-explore`, `cut-pagerank-iteration`, `w4-radar-search`, `w4-radar-datalist`).

**Pop-ups.** Today's page has 54 `.w4-tip` pop-ups and 9 `.w4-term` definitions. The boards have 0 `.w4-tip`, 81 `.w4-term` and 82 drawers: 31 Method, 31 More numbers, 14 Background, 5 `Table:` and 1 `Maps:`, plus the catalogue's "Which ones". So every pop-up becomes a drawer, and short definitions stay as `.w4-term`.

**Text defects in the design.** These break the design's own rules. Today's page already carries the first three, so PR1 fixes them there (1.3.10, items 9 and 10). The boards still carry all four, so PR3 applies the fixes again after its transfer (3.7):
- "The slider is the disparity-filter α": the control is now segmented;
- "Colours are the communities of card C";
- three mentions of "S1" in the skills cards;
- "nx.pagerank" in the PageRank card.

### 0.5 Contracts every task codes against

Tasks run in parallel, so these names are fixed here. Do not rename them inside a task.

**C1 Stylesheet.**
- New file `docs/assets/css/week04-rx.css`, linked last in `<head>` as `?v=1`. It holds the union of the boards' `rx-*` rules.
- Rewrite `.rx X` as `.corridor X`, and `.rx main table` as `.corridor main table`.
- Drop `!important` by editing the base rule instead. For the segmented control, restyle `.axis-modes` and `.staffing-years` where week04.css defines them.
- Replace hex colours with the page tokens:

| Hex | Token |
| --- | --- |
| `#0f2340` | `var(--ink)` |
| `#46618a` | `var(--ink-soft)` |
| `#7a8fac` | `var(--ink-mute)` |
| `#eef3f9` | `var(--ground)` |
| `#fff` | `var(--card)` |
| `#dce5f0` | `var(--line)` |
| `#eaf0f7` | `var(--line-soft)` |
| `#14618f` | `var(--w4-accent)` |
| `#f7fafd` | `var(--w4-inset)` |
| `#f2820c` | `var(--people)` |
| `#1f8fd6` | `var(--access)` |

  Define four new tokens next to `--w4-accent` in week04.css (line 509): `--w4-accent-soft: #d9ecf9`, `--w4-rail-ring: #9fb4cf`, `--w4-rail-dot: #c9d6e6` and `--w4-meter: #7fa9cf`.
- Keep the `rx-` prefix, so a class on the site greps straight back to its board. Open the file with a comment that says `rx-` marks the 28 September redesign.

**C2 Drawer.**
```html
<div class="rx-drawers rx-foot">
  <details class="rx-drawer"><summary>Method</summary><div class="rx-drawer-body"><p>…</p></div></details>
</div>
```
- The drawer row is the last child of the card's text column, or of the card when the card has one column.
- Labels come in this order: `Background`, `Method`, `More numbers`, then `Table: …` or `Maps: …` named by content.
- Never put `open` in the markup. Several drawers may be open at once.
- JS builds drawers with `drawer(label, body)` and `drawerRow(...drawers)` from the new helper `docs/assets/js/week04-ui.js`. `body` is a Node or an HTML string; the helper has no hex and no script tag.

**C3 Segmented control.**
```html
<div class="rx-seg-row"><span class="rx-seg-label" id="X-label">Backbone α</span>
  <div class="rx-seg" role="group" aria-labelledby="X-label" id="X"><button type="button" aria-pressed="true">…</button>…</div></div>
```
- `.axis-modes` and `.staffing-years` keep their class names and get the same look from one rule: `.corridor :is(.rx-seg, .axis-modes, .staffing-years)`.
- The pressed option has a white background and the others are transparent. A label never uses capitals (drop `text-transform` on `.axis-modes-label`).
- Keyboard: Tab reaches the group, and the arrow keys, Home and End move between options and press them. `wireSegments()` in `week04-frame.js` does this once for the whole page.
- Five options at most; use a dropdown beyond that. The employer `<select>` stays, and so do the method explorer's tabs.

**C4 Rail.**
- Markup: `nav.w4-rail > ol > li[data-target] > a[href][aria-label] > span.w4-rail-label[aria-hidden="true"]`. A section's questions sit in a nested `ol`.
- An `a` holds no glyph, because the names carry the numbers.
- Labels read "1 Where the hiring is" and "1A Do cities group…?", with no " · ".
- The deep dive's sub-items are `topic-where`, `topic-jobs`, `topic-outsourcing`, `topic-paperwork`, `topic-years` and `evidence`.

**C5 Deep dive.**
- Each topic is `<details class="rx-topic" id="topic-…" name="w4-topic">`. Each box inside it is `<details class="rx-panel" name="w4-panel-<topic>" data-box="<card id>">`.
- Both have a `<summary>` hidden by CSS. The contents panel, which is a list of links, is the control.
- Details elements that already hold boxes become panels. They keep their IDs and their inner `qa-body cut-body` divs: `#cut-years`, `#cut-roles`, `#cut-methods`, `#cut-skills` and `#cut-pagerank`.
- Contents entries are `<a class="rx-toc-item" href="#<box id>">`. Section 1.3.6 gives the full mechanism.

**C6 Card numbers.**
- Deep-dive cards are numbered 1 to n in contents order, with no letter codes. Section cards keep `1A`, `2B` and so on.
- Numbers in JS-built cards: skills direct "3", cluster "4", radar "5", PageRank explore "6", iteration "7", roles "2", years card "1".
- The four method panels carry no number, as on the board.

**C7 Glossary term.** The markup stays as it is today:
```html
<span class="w4-term"><button aria-describedby="w4-term-<card>-<slug>" type="button">word</button><span class="w4-pop" id="w4-term-<card>-<slug>" role="tooltip">…</span></span>
```
- IDs are unique across the page. The boards reuse `w4-term-x-louvain` and others on several boards, so rename them to `w4-term-<card id>-<slug>`.
- A term's text runs to 60 words at most. Never put a term inside a heading, summary, button, legend or table.

**C8 Events.**
- `w4m:show` on `#w4m-root`, with `detail: { panel: "gn" | "mod" | "louvain" | "overlap" }`, selects a method tab. `week04-methods.js` listens for it.
- `toggle` is caught once in the capture phase, `document.addEventListener("toggle", f, true)`, so drawers that JS adds later also trigger chart resize and rail updates.

### 0.6 Nodes that JS owns

A text transfer must never write inside these. The list comes from reading every `week04-*.js`:

- **`week04-place.js`:**
  - `place-status`, `place-sel-*`, `place-null-stats`, `place-alpha-table`, `place-snap-note`, `place-alpha-choice`, `place-region-legend`, `place-employer` and `place-draft-banner`;
  - `hero-sel-name`, `hero-sel-codes`, `hero-sel-dot`, `hero-sel-group`, `hero-sel-stats` and `hero-sel-links`;
  - every `chart-*` host.
- **`week04-jobs.js`:** `jobs-status`, `jobs-inspector`, `jobs-node-inspector` and `jobs-bridge-list`.
- **`week04-questions.js`:** `where-break-links`, `jobs-linkcom-table`, `who-movers-table` and `who-overlap-table`.
- **`week04-staffing.js`:** `#staffing-figure` and everything inside it, and inside `#staffing-community-stats` the `tbody` and every element carrying one of its `.cross`, `.mod` and similar classes (staffing.js lines 286 to 323).
- **The lazy containers:** `years-*`, `roles-*`, `methods-status`, `w4m-*`, `skills-*` and `pagerank-*`.
- **Anything with `data-strip`, `data-more` or `data-finding`.**
- **Every `article` that skills.js, skills-radar.js or pagerank.js builds.**

---

## 1. PR1 "components"

Title: `feat(week04): port the redesign's rail, drawers, controls and topic deep dive`

### 1.1 Outcome and invariant

When PR1 merges, the page has the design's components and layout, with today's words:

- the dot rail;
- every pop-up turned into a closed drawer under one of the four names;
- cards in the two-column anatomy;
- one segmented control style;
- the deep dive as a catalogue of topics, each topic showing one box at a time, with numbered cards;
- restyled tables.

**Invariant:** the page's sentences do not change. Take the multiset of normalised sentences from the flattened page text, before and after. It must be equal, apart from the component labels listed below, which may appear or change:

- drawer summaries;
- rail labels;
- the topic catalogue (topic names, holds-lines, contents entries);
- topic bars ("← Deep dive");
- segmented-control labels;
- instruction sentences that name a control PR1 replaces (1.3.10, "sentences tied to controls");
- text removed with the containers PR1 retires:
  - the old index card `.w4-dd-index` (its headings, group labels and link texts, which the catalogue replaces);
  - the summaries and box intros of the four retired wrappers:

    | Wrapper | Summary | Box intro |
    | --- | --- | --- |
    | `#cut-place` (line 1441) | "Where the hiring is: two earlier questions" | line 1443, "Two more questions on section 1's metro network. A strips…" |
    | `#cut-jobs` (line 1600) | "Which jobs go together: two earlier questions" | line 1602, "Two more questions on section 2's occupation network. A asks…" |
    | `#cut-who` (line 1718) | "Who staffs whom: three earlier questions, the law firms and the lottery" | line 1720, "More on section 3's network… A to C are questions from our first round; D to G ask…" |
    | `#cut-more` (line 2048) | "More networks: green cards, countries, jobs per metro, strong ties, the lottery and USCIS denials" | line 2050, "Six side questions on the same filings…" |
- references to the old card codes, renamed together with the renumbering (1.3.3 and 1.3.10).

Check this with a script in the PR (1.6), not by eye. New words, Background drawers and shortened leads wait for PR3.

### 1.2 Files

| File | Change |
| --- | --- |
| `review/week04-final/**` | New: the reference copy (0.1) |
| `docs/assets/css/week04-rx.css` | New: every `rx-*` rule from the boards, rewritten per C1 |
| `docs/assets/css/week04.css` | Rail block, lines 886 to 995, rewritten for dots. `.axis-modes` and `.staffing-years`, lines 344 to 365, restyled as C3. New tokens after line 509. Dead `.w4-tip`, `.w4-reveals` and `.w4-pop`-for-tips rules removed once nothing uses them. |
| `docs/assets/css/week04-deep.css` | Remove the `.w4-dd-*` index rules. Keep `.w4-q-block`. |
| `docs/assets/css/week04-skills-radar.css` | Remove the radio-button styles when the radar switches to `.rx-seg` |
| `docs/assets/js/week04-ui.js` | New helper: `drawer(label, body)` returns `details.rx-drawer`; `drawerRow(...d)` returns `div.rx-drawers.rx-foot` |
| `docs/assets/js/week04-tables.js` | New helper: `decorate(table)` and `decorateAll(root)` (1.3.8) |
| `docs/assets/js/week04-frame.js` | `watchRail()`, `wireReveals()` (terms only), new `wireSegments()`, and `decorateAll(main)` |
| `docs/assets/js/week04-cut.js` | Becomes the deep-dive router (1.3.6). Keeps the topbar `mark()`. |
| `docs/assets/js/week04-methods.js` | Handles the `w4m:show` event (1.3.7) |
| `docs/assets/js/week04-skills.js`, `week04-skills-radar.js`, `week04-pagerank.js`, `week04-roles.js` | Local `reveal()` builders replaced by `week04-ui.js`. `S1`/`S2`/`S3`/`P1`/`P2`/`R` become numbers. Radar radios become `.rx-seg`. |
| `docs/assets/js/week04-place.js` | α range input becomes a segmented control built from `data.backbone.alphas` (lines 1114 to 1131) |
| `docs/weeks/week04/index.html` | Rail, card anatomy, drawers, controls, deep dive, stylesheet link, `?v=` bumps |
| `tests/week04-html.mjs` | New helper, not a test file: `block(html, id)` and `flatten(fragment)` |
| `tests/week04-prose.test.mjs`, `tests/week04-questions.test.mjs`, `tests/week04-roles.test.mjs` | Regions moved to `block()`; the rail and deep-dive assertions updated |
| `tests/week04-structure.test.mjs` | New (1.3.11) |
| `WEEK04.md` | "The deep dive" paragraph rewritten for topics |

### 1.3 Steps, in order

**1.3.0 Reference copy.** Copy `design_final/` to `review/week04-final/` (0.1). Add a two-line `review/week04-final/README.md` that points to this plan.

**1.3.1 Test helpers first, green on today's page.**

Create `tests/week04-html.mjs` with two functions:
- `block(html, id)` finds `id="…"`, walks back to that tag's `<`, reads the tag name, and scans forward counting nested opening and closing tags of that name until the element closes. It returns that slice. It asserts that the ID exists, so a missing card fails loudly.
- `flatten(fragment)`:
  - first replaces each glossary term with its word, using `/<span class="w4-term">\s*<button[^>]*>([^<]*)<\/button>\s*<span class="w4-pop"[^>]*>[^<]*<\/span>\s*<\/span>/g` → `$1`. That regex matches all 9 terms on today's page and all 81 on the boards, and with it the board run still shows exactly the 16 wording failures of 3.6;
  - then drops the remaining `span.w4-pop` elements;
  - then replaces tags with spaces and collapses whitespace.

Rewrite the regions in `week04-prose.test.mjs` so they read `flatten(block(html, id))`:

| Today | New region |
| --- | --- |
| `section3` | `block("who")`, `block("who-q2")`, `block("who-q3")` and `block("who-q4")` joined |
| `regions` | `block("place-regions")` |
| `closing` | `block("closing")` |
| `lotteryText` | `block("staffing-lottery")` |
| ties | `block("staffing-ties")` |
| lawyers | `block("staffing-lawyers")` |
| `box(id)` | `block(id)` |
| `rank` | `block("place-rank")` |
| `long` | `block("place-longhaul")` |
| `hero` | `block("top")` |
| jobs-together | `block("jobs-together")` |

In `week04-questions.test.mjs`, `card(id)` becomes `flatten(block(html, id))`. `lead` becomes `block("footprint")` and `part` becomes `block("footprint-which")`.

Run the suite: 233 must pass on today's markup. Then prove the helper bites: change one number inside a pop-up, for example 14,678 in `#who-q3`, watch the test fail, and revert.

**1.3.2 CSS (1.2 table; contract C1).** Build `week04-rx.css` from the boards' `<style>` blocks. The rules differ from board to board, so take the union. The topic boards add `.rx-toc*`, `.rx-tab*`, `.rx-uses*` and the table rules. RS1 adds `.rx-start-grid`, `.rx-groups` and `.rx-kicker`. RTop adds `.rx-legend*`. RS5 adds `.rx-answers`. RS3 adds `.rx-ego-*`.

Add these rules of the port's own:
- `.corridor details.rx-topic > summary, .corridor details.rx-panel > summary { display: none; }`
- `#cut:has(> details.rx-topic[open]) > .rx-catalogue { display: none; }`
- one `[data-show]` rule for each JS-built article, for example `#cut-skills[data-show="direct"] article.w4-card:not(#cut-skills-direct) { display: none; }`, and the same for `cluster`, `radar`, `explore` and `iteration`.
  - Scope the rule to the whole `details`, not to `#skills-body`: skills-radar.js appends the radar to the end of the box when it cannot find `#cut-skills-cluster` within 5 s.
  - When a panel opens without `data-show`, the router sets the first one (`direct` or `explore`).
- `.rx-bar.placing i { background: var(--people) }` and `.rx-bar.direct i { background: var(--access) }` for the USCIS table.

Rail CSS, to RailBehaviour:

| Element | Style |
| --- | --- |
| Section dot | 12 px, 2 px `--w4-rail-ring` ring, `--card` fill |
| Open section | 18 px, `--w4-accent` fill, 4 px halo `rgba(20, 97, 143, .18)` |
| Question dot | 8 px, `--w4-rail-dot` |
| Current question | `--ink` with a 3 px halo |
| Gaps | 16 px |

- The line sits behind the dots, as the board draws it.
- Hovering or focusing anywhere in the nav (`.w4-rail:hover .w4-rail-label, .w4-rail:focus-within .w4-rail-label { display: block }`) shows every label as a white chip. The item under the pointer or with focus is dark (`--ink` background, `--card` text).
- Keep the live `position: fixed` rule and the `@media (min-width: 1240px)` gate. Do not copy the board's absolute coordinates.

**1.3.3 Drawers in JS-built cards.**
- Write `week04-ui.js` to contract C2.
- In `week04-skills.js`, `week04-skills-radar.js`, `week04-pagerank.js` and `week04-roles.js`, delete each file's local `reveal(id, label, body)`. Replace `revealsRow.append(reveal(…))` with `drawerRow(drawer("Method", howBody), drawer("More numbers", moreBody))`, appended as the last child of the card's text column. In roles.js it goes into `#roles-reveals` (1.3.10, item 8).
- The labels "How we tested it" and "How we counted" become "Method".
- Rename the old codes in reader-facing strings: S1, S2 and S3 in skills.js become boxes 3, 4 and 5, and P1 in pagerank.js becomes box 6 (1.3.10, item 10).
- Change the `w4-num` values per C6: skills.js lines 65 and 167, skills-radar.js line 440, pagerank.js lines 106 and 248, and the roles "R" in index.html line 2301.

**1.3.4 `week04-frame.js`.**
- `watchRail()`:
  - skip a target that is a closed `<details>` or sits inside one (`target.closest("details:not([open])")`);
  - re-mark on `toggle`, in the capture phase, as well as on scroll and resize;
  - keep the 35% trigger line and the `is-current` and `aria-current` logic.
- `wireReveals()`: handle `.w4-term` only, and keep Escape.
- New `wireSegments()`:
  - on `keydown` of ArrowLeft, ArrowRight, Home or End inside `.rx-seg`, `.axis-modes` or `.staffing-years`, focus the neighbouring button and `.click()` it;
  - keep a roving `tabindex`: the pressed button gets 0 and the others -1;
  - re-sync it with one `MutationObserver` watching `aria-pressed` under `main`, because each script sets `aria-pressed` itself.
- Call `decorateAll(document.querySelector("main"))` from `week04-tables.js`.

**1.3.5 Controls owned by one script.**
- `week04-place.js` lines 1114 to 1131:
  - `#place-alpha` becomes the `div.rx-seg[role=group]` from C3;
  - build its buttons from `data.backbone.alphas`, press the one equal to `data.backbone.default_alpha`, and on click set `state.alpha` and run the existing `renderGcLine(); renderBackbone(); renderAlphaTable();`;
  - `#place-alpha-now` is retired, because the pressed button shows α (the guard at line 1130 already tolerates its absence).
- `week04-skills-radar.js` lines 195 to 210: replace the three radio inputs with a `.rx-seg` whose buttons call `this.setGroup(group)`. Take the group label from the RTopicJobs board.

**1.3.6 `week04-cut.js`, the deep-dive router.** Keep `mark()` for the topbar. Replace `reveal()` with `route()`, run on load and on `hashchange`.

1. Read `id` from the hash. Apply the tables below:

   `ALIAS`, which keeps old anchors working:

   | Old ID | New target |
   | --- | --- |
   | `cut-place` | `topic-where` |
   | `cut-jobs` | `topic-jobs` |
   | `cut-who` | `topic-outsourcing` |
   | `cut-more` | `cut` |
   | `who-first-round` | `who-q2` |
   | `place-inspector` | `place-start` |

   `SUB`, for boxes that JS builds:

   | ID | Panel and `data-show` |
   | --- | --- |
   | `cut-skills-direct` | `cut-skills`, `direct` |
   | `cut-skills-cluster` | `cut-skills`, `cluster` |
   | `cut-skills-radar` | `cut-skills`, `radar` |
   | `cut-pagerank-explore` | `cut-pagerank`, `explore` |
   | `cut-pagerank-iteration` | `cut-pagerank`, `iteration` |

   `METHOD`: `w4m-panel-gn` maps to `gn`, `w4m-panel-mod` to `mod`, `w4m-panel-louvain` to `louvain` and `w4m-panel-overlap` to `overlap`.
2. **`#cut` itself:** close the open `details.rx-topic`, then scroll `#cut` into view. The catalogue shows again.
3. **A `SUB` ID:** set `panel.dataset.show` and target the panel.
4. **A `METHOD` ID:**
   - target `#cut-methods`;
   - set `#w4m-root`'s `dataset.want`;
   - dispatch `w4m:show`.
5. **Open the target:** open it if it is a `<details>`, then open every ancestor `<details>`. This is today's loop, and it opens the topic and the panel.
6. **Scroll:**
   - if the navigation began with a click on `a.rx-toc-item` (a flag set by a delegated click listener), scroll the topic's `nav.rx-toc` to the top only when it sits above the viewport;
   - otherwise `target.scrollIntoView()` as today.

The `toggle` listener (capture phase) does four things:
- **Fallback exclusivity:** when a `details[name]` opens, close its open siblings of the same name. This covers browsers without native `name` groups.
- **Default panel:** when an `rx-topic` opens with no open panel, open its first panel.
- **Contents state:** set `aria-current="true"` on the `rx-toc-item` whose target sits in the open panel, and remove it from the others.
- **Resize:** dispatch `resize`, as today.

It also writes each topic's "N boxes" count from its number of `rx-toc-item` links, so no one types it.

**Contents and catalogue links:**
- **Markup.** Each link is `<a class="rx-toc-item" href="#<static id>" data-target="<exact id>">`.
  - `href` must name an ID that exists in the static HTML, because `site.test` checks every fragment.
  - The skills and PageRank boxes therefore link `href="#cut-skills"` or `href="#cut-pagerank"`, and carry the article ID in `data-target`, for example `data-target="cut-skills-radar"`.
- **Click.** A delegated click handler in `week04-cut.js`:
  - calls `preventDefault()`;
  - takes `id = link.dataset.target || href`;
  - calls `history.pushState(null, "", "#" + id)`;
  - calls `route(id, { fromToc: true })`.

  `pushState` fires no `hashchange`, so nothing runs twice. A shared URL such as `#cut-skills-radar` reaches the right box through `SUB`.
- **History.** Listen to `popstate` as well as `hashchange`. Back fires both, so `route()` must be idempotent; skip a second call for the same ID in the same frame.

**1.3.7 `week04-methods.js`.**
- At the end of `build()`, after the tab listeners exist (line 891 onwards), click `#w4m-tab-${root.dataset.want}` if `want` is set.
- Add a listener for `w4m:show` on `#w4m-root`. It sets `root.dataset.want` and clicks that tab if the build has finished.
- The toggle listener on `#cut-methods` (line 911) stays; the panel is still that `<details>`.

**1.3.8 `week04-tables.js`: table styling.**

Port the rules from `tab.py`:

| Part | Rule |
| --- | --- |
| Numeric columns | At least 80% of cells match `^[−-+]?[\d,]+(\.\d+)?(%|×)?$`; these get `th.num` and `td.num` |
| Bar column | The first numeric column whose header matches `/filings|links|weight|registrations|certified|clients|vendors|firms|edges/i`, is not a year and holds no `%`. Scale to the column's maximum. |
| Meter column | The first all-`%` column whose header matches `/share|placed/i`. Width is the value in %. |
| Other columns | Non-numeric columns after the first get `td.soft` |

- A cell becomes `<span class="rx-cell"><span class="rx-bar[ meter]"><i style="width:X%"></i></span><span>VALUE</span></span>`.
- A table may override the rules with `data-rx-bars`. `#deeper-uscis` uses `data-rx-bars="1:0.04:placing,2:0.04:direct"`, so both rate columns share a 0 to 4% scale, orange for placing firms and blue for direct employers (CHART_CHANGES item 12).
- Mark each decorated `tr` with `data-rx`, so the `MutationObserver` in `decorateAll` does not loop. That observer watches `childList` under `main` and batches its work with `requestAnimationFrame`.
- CSS item 18, `.rx-cell > span:last-child { min-width: 5.2ch; text-align: right }`, goes in `week04-rx.css`.
- The decoration adds no text, so the flattened rows the tests pin do not change.

**1.3.9 `index.html`, from the top to the closing (serial).** Follow Appendix A card by card.

The mechanical rules:
- **Pop-ups.** Each `span.w4-tip` becomes a `details.rx-drawer` with the same body text, inside one `div.rx-drawers.rx-foot` placed last in the card's text column. Labels map as follows; the order follows C2:

  | Pop-up label today | Drawer label |
  | --- | --- |
  | "How we tested it", "How we count", "How a link is weighed" | Method |
  | "More numbers", "The numbers" | More numbers |
  | "The idea", "Why these three", "Scope", "Its groups", "The law-firm network", "The findings in words" | Background |

- **Disclosures.** A `details.qa` inside a card becomes a drawer. A table drawer takes the board's `Table: …` label; "Compared to what?" in `#place-regions` becomes Background.
- **Figures.** A card's primary figure goes in the right column. Any other figure goes into a `div.rx-fig-row` after the `.w4-two`.

Special cases:
- **Section 1 start card.** Build `div.card.w4-card#place-start` from `#place-rank` and `#place-regions`.
  - Put the header with `span.w4-num` "Start" and the kicker from RS1 at the top.
  - Below it, a `div.rx-start-grid` with a left half `div#place-rank` (question header, lead, the `.axis-modes` metric toggle and the "Top cities" plot) and a right half `div#place-regions` (question header and lead).
  - Then `div.rx-start-notices` holding both notices.
  - The drawer row comes last. Its `Maps: groups and Census regions` drawer holds the region toggle, `#place-region-legend`, `#chart-citymap` and `#chart-regions`.
  - Delete `aside#place-inspector`; `renderInspector()` already returns early without it.
  - Keep `#place-status` and `#place-draft-banner` (still `hidden`) right after the section opener.
  - The `.rx-groups` list is data-driven and waits for PR2.
- **Section 3 intro and `who-q1`.** Move the lottery-funnel figure into the left column above the drawer row, as in RS3.
- **Section 4 intro.** `#chart-footprint-nmi`'s plot moves into the left column. In `#footprint-which`, `#chart-footprint-single` moves into `.rx-fig-row`.
- **`#jobs-linkcom`.** Its table `details` becomes the drawer "Table: 15 jobs in the most communities". The two new figures arrive in PR2.

**1.3.10 `index.html`, the deep dive (serial; lines 1370 to 2547).**

1. Replace `div.card.w4-dd-index` with `div.rx-catalogue#cut-catalogue`, built from RDeep:
   - `p.sub.rx-cut-intro#cut-intro`, keeping the ID and today's sentence in PR1;
   - `div.rx-tgrid` of six `div.rx-tcard`. Each card head links to `#topic-*`, and each list item links to its box ID. The Where card's "The course's community methods" entry carries the nested `ul.rx-uses` of four method links to `#w4m-panel-*`.
   - `p.rx-moved` and its "Which ones" drawer.
2. Add five `details.rx-topic` elements, in the order Where, Jobs, Outsourcing, Paperwork, Five years. Each holds:
   - `div.rx-topic-bar`, with `a.rx-back[href="#cut"]`, `h2.rx-topic-title`, `p.rx-topic-holds` and an empty `span.rx-topic-count` that JS fills;
   - `nav.rx-toc[aria-label="Boxes in this topic"]` of `a.rx-toc-item` links. Where has two `div.rx-toc-col` columns with `p.rx-toc-head` headings; the other topics have one.
   - one `details.rx-panel` per box, per Appendix B.
3. **Move boxes into panels:**
   - `#place-backbone` and `#place-longhaul` leave `#cut-place`;
   - `#jobs-bridges` and `#jobs-groups` leave `#cut-jobs`;
   - `#who-first-round` splits into three cards: `div.card.w4-card > div.w4-q-block#who-q2`, then `#who-q3` and `#who-q4`;
   - `figure#staffing-figure`, with its flows block and the 25-clients table, gets a card of its own. That table is today's `details`; it becomes the board's `div.rx-table-block`, titled, with the table always visible;
   - `#staffing-lawyers` keeps `div.staffing-prose.w4-card`;
   - `#staffing-community-stats`, `#staffing-ties` and `#staffing-lottery` change from `details.qa` to `div.card.w4-card`. Keep each ID and every inner class staffing.js reads (0.6);
   - `#deeper-perm`, `#deeper-countries`, `#deeper-density`, `#deeper-strength`, `#deeper-lottery` and `#deeper-uscis` change from `details.qa` to `div.card.w4-card`. Keep every `data-more` host;
   - `details#cut-years`, `#cut-roles`, `#cut-methods`, `#cut-skills` and `#cut-pagerank` become panels themselves: add class `rx-panel` and the `name`, and hide the summary.
4. **Delete the emptied wrappers** `#cut-place`, `#cut-jobs`, `#cut-who`, `#cut-more` and `#who-first-round`. The ALIAS table in 1.3.6 keeps their anchors working.
5. **Card numbers:** per C6, replacing A, B, A to G, M1 to M6 and R.
6. **Method drawers:** the boards give GN a Background drawer and Louvain and Overlap a Method drawer, each inside its `section.w4m-panel`. Today's page has no pop-ups there, so these drawers carry new text and arrive in PR3. PR1 adds nothing to the method panels.
7. **`#evidence`** becomes the sixth topic, `details.qa.cut.rx-topic#evidence[name="w4-topic"]`. It gets a topic bar ("← Deep dive", title "Data and methods" and the RDeep holds-line) and no contents. `id="evidence"` stays exactly once (prose test #20).
8. **`#roles-reveals`** becomes `div.rx-drawers.rx-foot#roles-reveals` and moves to be the roles card's last child.
9. **Sentences tied to controls.** All three sit in the deep dive, so they belong to task T5b. They and the code references in item 10 are the only word changes PR1 may make:
   - line 1454, "The slider is the…": the board still says "slider" (0.4), so write "The control sets the disparity-filter α from Week 4";
   - line 1527, "as you drag α": name the new control instead;
   - line 1443, the `#cut-place` box intro ("A strips the map link by link with a slider…"), which leaves with its wrapper.
10. **Old card codes in reader-facing text.** PR1 renumbers the cards and deploys on merge, so it must also fix every sentence that names an old code:
    - line 1480: "Colours are the communities of card C." becomes "Colours are section 1's three metro groups.";
    - the box intros at lines 1443, 1602 and 1720 ("A strips", "B asks", "A to C", "D to G") leave with their wrappers.

    The scripts get the same fix in task T4:
    - `week04-skills.js` lines 181, 201, 221, 271 and 272: "S1" becomes "box 3", "S2" "box 4" and "S3" "box 5";
    - `week04-pagerank.js` line 312: "Same bar chart as P1" becomes "Same bar chart as box 6".

    Code comments that name S1 to S3 (skills-radar.js lines 1, 4, 498 and 513) may stay.

    Confirm the result with the grep from 3.7 on `index.html` and every `week04-*.js`: `\bcard [A-G]\b`, `\b[A-G] (strips|asks|checks)\b`, `\b[A-G] to [A-G]\b` and `\b[SPM][1-6]\b` outside comments and `.w4-num`.

**1.3.11 Tests.**

Updates:
- `week04-prose.test.mjs`:
  - `rank` and `regions` become `block("place-start")`;
  - test #20's ID list becomes `topic-where`, `topic-jobs`, `topic-outsourcing`, `topic-paperwork`, `topic-years`, the six `deeper-*`, and `evidence`.
- `week04-roles.test.mjs` lines 144 to 154: require `data-target="topic-years"` in the rail, and require `id="cut-years"` to come before `id="cut-roles"` inside `block("topic-years")`. Keep the CSS and JS link checks.
- Test region strings that named a pop-up label change to the drawer label. For example, questions line 54's "The 14 links that peel metros off" becomes the board's "14 links that peel metros off".

New `tests/week04-structure.test.mjs`, reading the raw HTML and `week04-cut.js`. It checks that:
1. the page has no `class="w4-tip"` and no duplicate `id`;
2. inside every `.rx-drawers`, labels come from {Background, Method, More numbers, `Table: *`, `Maps: *`} in that order. The catalogue's "Which ones" is the one exception;
3. every `a.rx-toc-item` and `.rx-tcard` link targets an ID inside the right topic, or a key of the `SUB` or `METHOD` table (read from `week04-cut.js` by regex);
4. each old anchor in {`cut-place`, `cut-jobs`, `cut-who`, `cut-more`, `who-first-round`, `place-inspector`} is an `ALIAS` key, and each ALIAS value exists;
5. rail labels match `/^(\d[A-C]? |Closing$|Deep dive$)/` and name no " · ", every `data-target` exists, and every rail `a` has an `aria-label`;
6. every `.rx-seg`, `.axis-modes` and `.staffing-years` group has `role="group"`, an accessible name and at most five buttons;
7. every static `.w4-num` inside an `rx-topic` equals the position of its card in that topic's contents. The check cannot be "1, 2, 3 in order", because some cards are built by JS: in Five years, card 1 comes from years.js, so the static numbers are 2 and 3.

**1.3.12 Docs.** In `WEEK04.md` "The deep dive", describe the catalogue, the five topics plus Data, and the alias for old anchors, replacing `#who-first-round` and `#cut-more`.

**1.3.13 Versions.** Link `week04-rx.css?v=1`. Bump the `?v=` of every changed stylesheet and script. Add `?v=1` to `week04-staffing.js`.

### 1.4 IDs that the boards drop, and what PR1 does with each

| ID | Read by | PR1 |
| --- | --- | --- |
| `place-rank`, `place-regions` | links in the old index, prose tests, `cut.js` comment | kept on the two halves of `#place-start` |
| `place-status`, `jobs-status` | place.js, jobs.js | kept (status lines) |
| `place-draft-banner` | place.js, site.test (must carry `hidden`) | kept, hidden |
| `place-inspector`, `place-sel-name`, `place-sel-codes`, `place-sel-stats` | place.js (`renderInspector` returns early without them) | retired; `place-inspector` gets an alias |
| `place-alpha` | place.js | kept on the new `.rx-seg` group |
| `place-alpha-now` | place.js (guarded) | retired |
| `chart-job-pairs`, `jobs-inspector` | jobs.js | kept in PR1; PR2 replaces the chart and removes the inspector |
| `chart-jobs-split-nmi`, `chart-job-groups`, `chart-job-nmi` | questions.js, jobs.js | kept; PR2 changes their renderers |
| `cut-intro` | none | kept on the catalogue intro |
| `cut-place`, `cut-jobs`, `cut-who`, `cut-more`, `who-first-round` | in-page links, prose tests | retired, with an alias in `week04-cut.js` |
| `cut-years`, `years-body`, `years-status`, `cut-roles`, `roles-body`, `roles-reveals`, `cut-methods`, `methods-body`, `methods-status`, `cut-skills`, `skills-body`, `skills-status`, `cut-pagerank`, `pagerank-body`, `pagerank-status` | the lazy loaders | kept; the `details` become panels |

### 1.5 Parallel implementer tasks

Every task codes against section 0.5. Tasks on the same line share no file.

| Task | Files | Depends on |
| --- | --- | --- |
| T1 test helpers (1.3.1) | `tests/week04-html.mjs`, `tests/week04-prose.test.mjs`, `tests/week04-questions.test.mjs` | none; must end green on today's page |
| T2 CSS (1.3.2) | `week04-rx.css`, `week04.css`, `week04-deep.css`, `week04-skills-radar.css` | none |
| T3 router and frame (1.3.4, 1.3.6 to 1.3.8) | `week04-cut.js`, `week04-frame.js`, `week04-methods.js`, `week04-ui.js`, `week04-tables.js` | none |
| T4 JS-built cards and controls (1.3.3, 1.3.5) | `week04-skills.js`, `week04-skills-radar.js`, `week04-pagerank.js`, `week04-roles.js`, `week04-place.js` | imports `week04-ui.js`; if T3 has not landed, create the helper to C2 and let T3 keep it |
| T5a markup, top to closing (1.3.9, plus the rail and `<head>`) | `index.html` lines 1 to 1369 | none |
| T5b markup, deep dive (1.3.10) | `index.html` lines 1370 to 2547 | none |
| T6 tests and docs (1.3.11 to 1.3.13) | the three test files, the new structure test, `WEEK04.md`, the `?v=` values in `index.html` | all of the above |

- Run T5a and T5b in two git worktrees and merge them. Their hunks do not touch.
- Only T5a edits `<head>`, and neither of them edits the `<script>` tags at lines 2548 to 2563; T6 does.
- Do not split `index.html` any further. Every other edit to it is serial.
- A hook forbids writing into another worktree's files. T5a and T5b therefore each commit on their own branch, and the orchestrator merges the branches, or applies a patch, in its own worktree.

### 1.6 Checks

1. **Tests:** `node --test 'tests/*.test.mjs'` ends with `fail 0`.
2. **Sentence invariant.** Run a script that flattens today's `index.html` and the PR's, splits both into sentences and prints the multiset difference. The difference may hold only the component labels in 1.1. Paste the output into the PR body.
3. **Browser, desktop at 1440 wide:** serve with `python -m http.server 8765 --directory docs` and open http://localhost:8765/weeks/week04/ in a fresh context.
   - The console shows no errors.
   - The rail follows the scroll, shows all its labels on hover, and its deep-dive dots follow the open topic.
   - Every catalogue link and every contents link opens the right box, including the three skills boxes, the two PageRank boxes and the four method tabs.
   - Each old anchor opens its target: `#cut-place`, `#cut-jobs`, `#cut-who`, `#cut-more`, `#who-first-round`, `#place-rank`, `#place-regions`, `#deeper-uscis`, `#cut-roles`, `#w4m-panel-louvain`, `#evidence` and `#closing-ai`.
   - Back and Forward move between boxes.
   - Charts inside drawers and panels draw at full width when opened.
   - Tab and the arrow keys work every segmented control, Enter and Space open drawers, and Escape closes a term.
4. **Screenshots:** take one per board region and compare it with the board on the canvas. Gyula has the link.
5. **Review:** run the `reviewer` agent on the diff.

### 1.7 Risks

- **Test regions that silently widen.** `block()` asserts the ID exists, which avoids the `indexOf(-1)` failure mode of today's `text()`. After each markup step, rerun the bite check from 1.3.1.
- **ECharts in closed containers.** The maps drawer, the topic panels and the method tabs initialise at zero width. Today's page has the same case and relies on `toggle` → `resize`. The capture-phase listener in 1.3.6 must cover drawers that JS builds later.
- **Opening order.** The router opens ancestors from the inside out, and native `name` groups then close siblings. A browser without `name` support leans on the fallback, so test both paths by setting `name` to an empty string.
- **`:has()`** needs Chrome 105, Safari 15.4 or Firefox 121. That is fine for desktop in 2026. Without it, the catalogue stays visible above the open topic, which is harmless.
- **Text lost in moves.** Moving 54 pop-ups and 17 `details` by hand can drop a sentence. The sentence invariant in 1.6 catches it.
- **Theme test.** `week04-ui.js`, `week04-tables.js` and every changed non-legacy file must hold no hex, comments included.
- **`site.test` fragment check.** Every `href="#…"` in the new catalogue and contents must exist in the static HTML. The JS-built articles do not exist there, so the skills and PageRank links use `href="#cut-skills"` or `href="#cut-pagerank"` with the article ID in `data-target` (1.3.6). The router's `SUB` table resolves the article IDs.

### 1.8 What cannot be ported as-is

1. **RTopicWhere repeats `#w4m-root`, and its tab buttons, in four panels.** Keep one root inside `#cut-methods`, and let contents entries 4 to 7 pick the tab through `w4m:show`.
2. **The board rail is static and absolutely positioned.** The live rail is fixed, follows the scroll and opens topics.
3. **Topic tabs and the ego diagram use canvas state** (`{{dN}}`, `{{pickN}}`, `sc-for`). They become the router (1.3.6) and, in PR2, plain JS.
4. **Every board copies rendered DOM**, such as filled tables, the hero inspector's values, `#place-snap-note` and `#place-alpha-choice` text, and the radar datalist. Leave those to the scripts.
5. **Board term IDs collide across boards** (`w4-term-x-*`). Rename them per C7. This matters in PR3, where the terms arrive.
6. **Inline hex colours in board markup** move to classes and tokens:
   - the hero legend (`#b69cff`, `#4fd1a5`, `#7a8fac`) uses `var(--w4-group-*-dark)`;
   - the region legend comes from place.js.
7. **`div.rx-hover-states`** in the roles card only illustrates the new tooltip. Do not port it.

---

## 2. PR2 "charts"

Title: `feat(week04): port the redesign's chart changes`

### 2.1 Outcome and invariant

When PR2 merges, every chart matches its board, and every number it draws is read from page JSON.

**Invariant:** prose stays as PR1 left it, with one exception. The `h3` and `p.axis-note` above a chart that changes, or the chart's `figcaption`, take the board's wording in PR2, because a caption that describes the old chart would be wrong from the moment the new one ships. PR3's transfer then finds those slots already equal.

Four charts need data that no page JSON holds today. Their analysis tasks (2.2) land first in the same PR. If one of them cannot land, ship the other items and leave that chart as it is. **Never type the design script's numbers into JS.**

### 2.2 Data gaps: analysis tasks

**G1 `analysis/week04_jobs.py` → `docs/weeks/week04/data/jobs.json`, for items 5 and 6.**
- `nodes[].x` and `nodes[].y`, normalised to 0 to 1 and rounded to 4 decimals:
  - apply `networkx.kamada_kawai_layout` to the largest connected component, with edge weight `1 + log(weight)`, as `netsvg.py` lines 6 to 11 do;
  - lay out smaller components as `netsvg.py` does;
  - the layout is deterministic, so no seed is needed; confirm under `PYTHONHASHSEED=1` and `2`.
- `clusters[].majors`: `{ "<2-digit SOC major>": count }` over every occupation in the cluster, for the 438 occupations in clusters of two or more.
- `majors`: names for every code that appears (today it holds 10).
- **Check first:** the design's `jobs_crosstab.json` has no generator anywhere in the scratch folder. It also contains the codes `12`, `20` and `40`, which are not 2018 SOC major groups. Find out where they come from before emitting anything; the 50 legacy filings recoded through O*NET are one suspect. Map them to a real major or drop them, and write the rule into the script.
- Update `JobNode` (add `x` and `y`) and `Cluster` (add `majors`) in `analysis/week04_schemas.py`, plus a field for the full `majors` map.

**G2 `analysis/week04_jobs_split.py` → `docs/weeks/week04/data/jobs_split.json`, for item 10.**
- Emit `q2.links`, `q2.link_clusters` and `q2.largest_link_community_links`.
- `s2b.py` typed `share = 0.85` and `nl = 28155`, but the analysis JSON says 28,158 links. The chart must use the emitted values.
- Update the jobs-split model in `week04_schemas.py`.

**G3 USCIS per-draw totals, for item 9 ("Every draw since 2020").**
- `lot.py` types six rows from USCIS's "H-1B Electronic Registration Process" Historical Data table (March 2020 to March 2025: eligible registrations, eligible registrations for workers registered more than once, and selected registrations). This is a new source.
- Fetch it in `analysis/week04_data.py --refs` into `build/raw/week04/`. Parse it in `analysis/week04_more_page.py` into `more.json` → `lottery.draws[]` as `{label, eligible, multiple, selected}`. Add the model field.
- Add a row to WEEK04.md's Sources table, a footer credit on the page, and a line in `tests/credits.test.mjs`.
- **Decision D3 in section 4:** if Gyula does not want a new source, drop this chart and keep the slopegraph.

**Checks for every G task:**
- Rerun the script and confirm it reproduces its committed JSON before the change.
- Change it, rerun under `PYTHONHASHSEED=1` and `2`, and expect identical files.
- `python analysis/check_pages.py` prints `ok` for every file.
- `python analysis/week04_run_all.py` if names move. They should not.

### 2.3 Every item mapped to code

"Board" names the board and card that show the target. Line numbers are today's, before PR1.

| # | Change | File, function | Data | Notes |
| --- | --- | --- | --- | --- |
| 1 | Straight links | `week04-place.js`: `renderBackbone()` line 497, `curveness: 0.18` → `0`; `renderArcs()` line 724, `0.18 + (i % 3) * 0.06` → `0` | none | Delete the comment about separating parallel routes |
| 2 | Hero map: third group in slate, wider frame; legend as a key | `renderHeroMap()` (line 892): group 2 uses `token("--w4-group-2")` instead of `GROUP_DARK[2]` (line 80); `layoutSize` `"150%"` → `"135%"` (line 955). Legend: replace `div.w4-legend` (index.html lines 60 to 66) with RTop's `div.rx-legend` list, dots via `.w4-dot.g0/.g1/.g2` classes, no inline hex | `place.communities` | Update prose test #22 (lines 441 to 443): the legend now flattens to "New York–Dallas seven large hubs", so drop the " · " |
| 3 | Giant component against α as plain SVG | Rewrite `renderGcLine()` (line 363) to write an SVG into `#chart-gc`; change that host from `div.chart-host.short` to `div.w4-figure-body` in index.html. Draw a flat `--ink` line, `--card` dots with a `--ink` stroke, a light `--w4-grid` grid, the selected α filled, a dashed marker at `snap_alpha`, and the links kept labelled under each stop | `backbone.alphas`, `gc_size`, `edges_kept`, `snap_alpha`, `state.alpha`: all exist | Add a `<title>` tooltip per dot (the chart rule). The legacy file allows hex, but use tokens |
| 4, 17 | Roles: navy ramp, compact tooltip | CSS: in `week04-roles.css`, `--w4-area-1` to `--w4-area-14` become the ramp from `rolestip.js` line 31 (`#0f2340 #14618f #3d7fb0 #5b95c2 #739fc4 #86aecf #97badb #a7c5e0 #b3cde5 #bfd5e9 #c9dcec #d2e2ef #dbe7f2 #e3ecf5`) and `--w4-area-other` becomes `#d3d9e1`. JS, `week04-roles.js` `render()` (lines 109 to 150): `tooltip.axisPointer = { type: "line", lineStyle: { color: token("--ink-mute"), width: 1 } }`; `extraCssText` as in `rolestip.js`; `formatter` → a new `compactTip(points)` replacing `tooltipHtml()` (line 154); `blur: { areaStyle: { opacity: 0.35 } }` in `buildSeries()` next to `emphasis` (line 100). Track the hovered band with `chart.on("mouseover", p => hovered = p.seriesName)` and `mouseout`; do not use a `window.__hov` global | `roles.json` | roles.js is not legacy, so no hex. `rolestip.js` falls back to `'#0f2340'`; use `token("--ink")` |
| 5 | Occupation network: fixed layout, 51 of 60 labelled with leader lines | `week04-jobs.js` `renderNetwork()` (lines 105 to 150): replace the ECharts force graph with an SVG built from `nodes[].x/.y`. Port the label placement (greedy boxes, then leader lines) from `netsvg.py` lines 52 to 88. Keep the click that fills `#jobs-node-inspector`. The host `#chart-job-network` becomes `div.w4-figure-body` (RTopicJobs); drop `resetButton` for it | **G1** | Needs a `<title>` per node, and the cluster key under the chart |
| 6 | "Do the clusters follow official job groups?" as composition bars plus a 0 to 1 NMI scale | `week04-jobs.js` `renderGroups()` (line 185, `#chart-job-groups`) and the NMI part (line 207, `#chart-job-nmi`): two SVGs, ported from `jobgroups.py`. Both hosts become `div.w4-figure-body` | **G1** for the bars. The scale uses `quality.nmi` (0.2339), `quality.nmi_shuffled.mean` and `.max`, and `quality.infomap.nmi_with_soc`, which all exist | Major names come from `majors`, not from the `MAJ` dict typed into `jobgroups.py`. Colours: 3-step `--w4-accent` ramp and grey |
| 7 | PageRank rounds as a bump chart | `week04-pagerank.js` `buildIterationCard()` (line 237): an SVG bump chart of rank after each round for the final top 10. Axis "round 1 … final", full names, no ellipsis | `pagerank.json` `iteration.steps[].rows[]`: rank is the row order. Exists | Port from `pr.py`. Not legacy, so tokens only |
| 8 | PageRank top 15: wider label column | `week04-pagerank.js` `hbars()` (line 51), used by `buildDampingCard()`: bars start at x 300 of 556 | exists | none |
| 9 | Lottery: new "Every draw since 2020" chart and a slopegraph label fix | `week04-vis-more.js`: fix the label sides in `slope()` (line 79) and `drawLottery()` (line 236); a new `drawDraws()` registered as `DRAWERS.draws`, with a `data-more="draws"` host in `#deeper-lottery` | Slopegraph: `more.json` `lottery`, exists. Draws: **G3** | Port the geometry from `lot.py`. Its "What to notice" sentence rests on G3's numbers, so PR3 holds that notice until G3 lands |
| 10 | 2B: "Where the links go" and "The 15 jobs with the most communities per link" | `week04-questions.js`: new `renderLinkShare()` and `renderLinkScatter()`, called next to `renderJobsLinkcomTable()` (line 262). Add hosts `div.w4-figure-body#chart-jobs-linkcom-share` and `#chart-jobs-linkcom-scatter` in `#jobs-linkcom` (a new `.w4-two`, per RS2) | Share: **G2**. Scatter: `jobs_split.json` `q2.top15_by_communities_per_link[]` (title, links, communities, communities_per_link) and `q2.bridges.in_top15`, which exist | The `SH` short names and label offsets in `s2b.py` are display choices; keep them as a JS constant with the full title in each `<title>` |
| 11 | Ego diagram: year control and client search | `week04-vis-intros.js` `drawWhoIntro()` (line 165) and `egoDiagram()` (line 106): add an `.rx-seg` of years built from `Object.keys(clients.years)`, labelled "2026 · Oct–Jun" for 2026, plus a search input over `years[y].shown` names with a match list. Default to the year's largest client (Citigroup in 2025). Show "No client with N or more placed filings matches" using `clients.min_filings` | `staffing_clients.json` `firms`, `years[y].shown[]` (name, sector, filings, vendors, top, rest), `min_filings`. Exists | Port the layout from `ego.py`. Not legacy, so no hex. Figure title and caption from RS3 |
| 12, 18 | Tables | Done in PR1 (1.3.8) | none | PR2 only checks the USCIS table's bars |
| 13 | Client scatter: three sector colours, grey rest, labels above dots, NAICS names in tables | `week04-staffing.js`: `SECTORS` (lines 15 to 20), series (lines 65 to 72: `symbolSize` 8 for the three colours and 6 for grey, `z` so grey sits beneath), the names series (`z: 10`), `grid.bottom` 72. Table and meta sector names (lines 49 and 246) from a new `SECTOR_NAMES` map of NAICS 2-digit codes to the board's short names ("Information and telecoms", …) | `staffing_clients.json` `shown[].sector`, exists | **Decision D1:** the design paints health care in `--people` orange and finance in `--access` blue, which the page's colour rule reserves for placed and direct. Implement the design through the `--w4-sector-*` tokens in `week04.css`, so the answer to D1 is a one-line change. The patch `sect.js` types hex, which fails the theme test, so do not copy its colour literals |
| 14 | Radar labels wrap at a word | `week04-skills-radar.js` line 18: `shorten()` splits names longer than `LABEL_CHARS` (26) into two lines at a space, as `radar.js` does. Line 330: font 10.5 px, `lineHeight: 12` | none | none |
| 15 | Section 2 start card: "The 12 most common job pairs" | `week04-jobs.js` `renderPairs()` (line 49): an SVG of horizontal bars for the top 12 `pairs` by weight. Bars that include the most-filed occupation are dark and the others grey, with counts at the bar ends. The key "Pair includes Software Developers (N of 12)" is computed. Find that occupation as the node with the most `filings`, not by typing `15-1252`. Remove `aside#jobs-inspector` (index.html line 671) and the `inspector()` code path (lines 65 and 72); `renderPairs` no longer needs it. Host `#chart-job-pairs` becomes `div.w4-figure-body` | `jobs.json` `pairs[]`, `nodes[]`, exist | Prose test #23 already pins "Software Developers sit in N of the 12 pairs" |
| 16 | 2A: bars with whiskers | `week04-questions.js` `renderJobsSplitNmi()` (line 184): an SVG of observed NMI against the count-matched, filings-matched and matched baselines, each mean ± sd, with plain row labels. `#chart-jobs-split-nmi` becomes `div.w4-figure-body` | `jobs_split.json` `finding.q1_observed_nmi`, `q1_null_count_matched_nmi_mean/sd`, `q1_null_filings_matched_nmi_mean/sd`, `q1_null_matched_nmi_mean/sd`. Exist | Reuse `stripChart()` from `week04-strip.js` if it fits. The site rule wants every real-against-random result in the same chart |
| Y | Five years: findings on their charts, tables in a drawer, a card header (Guide change 5) | `week04-years.js` `render()` (lines 268 to 395): wrap the output in `div.card.w4-card#years-card`, with a header (`w4-num` "1", h2 "Five years of filings", and an answer computed from `years.json`: the 2023 change, the 2025 total and the October-to-June change for 2026). Put each panel's finding on its chart as an annotation. Replace `details.years-alt` (line 372) with `drawerRow(drawer("Background", …), drawer("Table: the numbers behind the charts", tables))` | `years.json`, exists | Not legacy, so no hex. The board says "fell 14% in 2023" and "fell 9.7% in 2026": compute both |
| G | Section 1 start card: the three groups listed | `week04-place.js`: new `renderGroupList()` fills `div.rx-groups#place-groups`. Each group lists its metros by filings, with "and N more" past 12. Keep the group heads ("Eight tech hubs", "led by San Jose and San Francisco") static in index.html with `data-community`, the same way the hero legend works | `place.cities[].community`, `.filings`, `.name`; `place.communities[]` | Add a prose test that builds each head from `WORDS[size]` and the two largest metros. The RS1 order is tech hubs, then large hubs, then the other 25 |

### 2.4 Steps

1. **G1, G2 and G3 analysis tasks**, each with its schema, its `check_pages` run and its determinism check.
2. **JS items, one task per file** (2.5).
3. **`index.html`** (serial, one task):
   - the host element changes (items 3, 5, 6, 10, 15, 16);
   - the hero legend (item 2);
   - remove `#jobs-inspector`;
   - `data-more="draws"` if G3 landed;
   - the new captions for changed charts (2.1);
   - `?v=` bumps.
4. **Tests:**
   - prose #22 (the legend);
   - a new prose test for the group heads (item G);
   - a new test pinning the years card answer, built from `years.json`;
   - if G3 landed, a test for its footer credit.
5. **Browser check** of every changed chart (2.6).

### 2.5 Parallel implementer tasks

| Task | Files | Waits for |
| --- | --- | --- |
| A1 | `analysis/week04_jobs.py`, `jobs.json`, `week04_schemas.py` (job models only) | none |
| A2 | `analysis/week04_jobs_split.py`, `jobs_split.json`, `week04_schemas.py` (jobs-split model only) | none. If A1 runs at the same time, merge the schema file by hand, since both touch it |
| A3 | `analysis/week04_data.py`, `analysis/week04_more_page.py`, `more.json`, `week04_schemas.py` (more model), `WEEK04.md`, `tests/credits.test.mjs` | D3 |
| J1 | `week04-place.js` (items 1, 2, 3, G) | none |
| J2 | `week04-jobs.js` (items 5, 6, 15) | A1 for items 5 and 6 |
| J3 | `week04-questions.js` (items 10 and 16) | A2 for item 10 |
| J4 | `week04-pagerank.js` (items 7 and 8) | none |
| J5 | `week04-roles.js`, `week04-roles.css` (items 4 and 17) | none |
| J6 | `week04-staffing.js`, sector tokens in `week04.css` (item 13) | D1 |
| J7 | `week04-skills-radar.js` (item 14) | none |
| J8 | `week04-vis-intros.js` (item 11) | none |
| J9 | `week04-vis-more.js` (item 9) | A3 for the draws chart |
| J10 | `week04-years.js` (item Y) | none |
| H | `index.html`, `tests/week04-prose.test.mjs`, the new tests | all J tasks, for host IDs and captions |

The three A tasks all touch `week04_schemas.py`. Run them one after another, or merge that file by hand.

- **Long reruns belong in the main session.** An agent that shows no progress for 180 seconds is killed. Implementer agents edit the A scripts; the main session runs the reruns (`week04_jobs.py`, `week04_jobs_split.py`, `week04_more_page.py`, the two `PYTHONHASHSEED` reruns and, if needed, `python analysis/week04_run_all.py`) and prints progress.
- **The same hook applies here:** no task writes into another worktree. Merge task branches in the orchestrator's worktree.

### 2.6 Checks

- `node --test 'tests/*.test.mjs'` ends with `fail 0`.
- `python analysis/check_pages.py` prints `ok` for every file, and the `PYTHONHASHSEED=1` and `2` reruns match (A tasks).
- **Browser, desktop at 1440 wide:**
  - every changed chart has a hover tooltip;
  - no label is cut with "…";
  - the ego control works from the keyboard;
  - the roles tooltip shows one band on a band and the year's total plus its three largest roles off a band;
  - switching the α control redraws `#chart-gc`, the backbone and the table together.
- Put each chart side by side with its board's static image in the PR body.
- `theme.test.mjs` passes, so no hex slipped into a non-legacy file.

### 2.7 Risks

- **Hosts that change from ECharts to SVG** (`chart-gc`, `chart-job-network`, `chart-job-groups`, `chart-job-nmi`, `chart-job-pairs`, `chart-jobs-split-nmi`). Any code that still calls `echarts.init` on them, or registers them for resize or reset (`MAPS_WITH_RESET` in place.js line 1053, `resetButton` in jobs.js line 138), must go. Otherwise ECharts draws over the SVG.
- **`week04_schemas.py` is shared by three tasks.** Serialise A1 to A3.
- **Regenerating `jobs.json` can move numbers that the page quotes elsewhere.** Section 2's prose tests will name any that did. Adding fields should move none.
- **Item 13 can break the page's colour legend** if D1 changes the palette. The legend reads `SECTORS`, so keep it in one place.

---

## 3. PR3 "text"

Title: `feat(week04): shorten the page's text to the redesign's wording`

### 3.1 Outcome and invariant

When PR3 merges, every reader-facing sentence matches its board:

- shortened leads and answers;
- What to notice texts;
- drawer contents, including the new Background drawers and the method-tab drawers;
- the 81 hover definitions;
- figure titles and axis notes not already done in PR2;
- the catalogue intro;
- topic holds-lines;
- the Section 5 answer list (`ol.rx-answers`);
- the closing.

**Invariant:** the page's skeleton does not change. Take the multiset of non-text elements (tag, `id`, `data-*`, class set), before and after. It must be equal, except for:

- elements that only carry text: `span.w4-term` and its `button` and `span.w4-pop`, `b`, `em`, `mark`, `a` inside prose, `p` and `span` inside a text slot;
- drawers: `div.rx-drawers`, `details.rx-drawer`, `summary`, `div.rx-drawer-body`;
- `ol.rx-answers` and its `li` items.

### 3.2 How the board text gets into `index.html`

**Method:** one script, `review/week04-final/tools/port_text.py`, run with the project Python. It does a per-card splice of text slots, and never re-serialises the whole file, so the diff contains only the lines that change.

1. **Tokenise `index.html` with offsets.** Subclass `html.parser.HTMLParser` and record `getpos()` for every start and end tag. Build a light tree of `(tag, attrs, start, end, inner_start, inner_end)`, treating void elements as void. Parse the board the same way, from `boards_concat.html` (built as in 0.4) or from each board.
2. **Pair cards.**
   - By `id` first.
   - A board card without an ID pairs through the anchor Appendix A gives it: `.w4-intro` in `#<section>`, the card around `.w4-q-block#who-q2`, the card holding `#staffing-figure`, the `#cut-methods` panel and the method panels by `data-panel`.
   - A card that pairs with nothing stops the run.
3. **Pair slots inside each card,** in document order and by selector. A slot is:

   | Slot | Selector |
   | --- | --- |
   | Question header | `header.w4-q h2`, `header.w4-q .w4-answer` |
   | Kicker | `.rx-kicker` |
   | Paragraph | `p.sub`, `p.w4-box-intro`, `p.fineprint`, `p.w4-scope-note`, `.w4-example p` |
   | Notice | the last `span` of `div.notice` |
   | Plot caption | `.plot > h3`, `.plot > p.axis-note` |
   | Figure caption | `figure > figcaption` |
   | Heading | `h3` or `h4` directly in a card |
   | Topic text | `p.rx-topic-holds`, `.rx-tcard-head em`, `p.rx-moved` |
   | Answers list | `ol.rx-answers` |
   | Drawer row | `div.rx-drawers`, as one unit, so PR3 can add Background drawers |

   A slot the board has but the page lacks, other than a drawer row or `ol.rx-answers`, stops the run. PR1 missed some structure; fix PR1's work, not the text.
4. **Clean the board slot's inner HTML.**
   - Rename `w4-term-x-*` to `w4-term-<card id>-<slug>`, keeping a page-wide registry so every ID is unique (C7).
   - Turn `&#x27;` into `'`. Keep `&amp;`, which prose test 16 pins as `AT&amp;T`.
   - Drop `style` attributes.
   - **Keep what the scripts write.** For every descendant that 0.6 lists, or that matches `[data-strip]`, `[data-more]`, `.chart-host`, `.w4-figure-body`, `tbody[id]` or `[id^="w4m-"]`, put the page's own element back verbatim. Log the board's rendered text for it; 3.3 handles it.
5. **Splice.** Replace the page slot's inner range with the cleaned HTML. Keep the page's indentation on the slot's own tags.
6. **Apply the fix-ups in 3.7 after the splice.** The boards still carry those defects, and a fresh transfer would bring them back.
7. **Guard each card after splicing:**
   - the skeleton invariant (3.1);
   - balanced tags;
   - unique IDs;
   - no `.w4-term` inside `h2`, `h3`, `summary`, `button` or a table;
   - no term definition over 60 words.

   A failed guard prints the card and stops.

**Output:** the patched `index.html` and `review/week04-final/audit/port_text.md`. The report lists each card's changed slots, the drawers added or removed, the terms added, and the JS-owned text that differs from the board.

**Run order:** one board at a time, in page order. Review and commit each section separately, so a reviewer reads one section's diff at a time.

### 3.3 Text that JS writes

Some board text sits in nodes a script writes. Edit the script's string literals by hand and keep every `${…}` expression. Find the differences by rendering the page (3.5) and diffing each card's text against its board card with the flattening from 1.3.1.

| Where | Script | What changes |
| --- | --- | --- |
| Skills cards 3 and 4, radar card 5 | `week04-skills.js`, `week04-skills-radar.js` | Leads, notices, drawer bodies, two terms. Replace "S1" with "box 3" (3.7) |
| PageRank cards 6 and 7 | `week04-pagerank.js` | Leads, notices, drawers, three terms. Drop "nx.pagerank" (3.7) |
| Roles card 2 | `week04-roles.js` (`renderText()` at line 203, and the drawers from PR1) | Answer, summary and notice texts, the new Background drawer, two terms |
| Years card 1 | `week04-years.js` (PR2 built the card) | Notice, panel captions, the Background drawer, one term |
| Method leads | `week04-methods.js` lines 230, 397, 571 and 673 set `textContent` | New wording. The GN and Overlap leads gain a term, so switch those two to the `termify` helper below |
| `#place-snap-note` | its text is `backbone.snap_note` from `analysis/week04_where.py` | Only a term on "giant component". Wrap it with `termify` after place.js writes the note; do not change the JSON |
| Findings strips | `week04-frame.js` `drawFindings()` notes | Compare with RTop's `#findings`. Change only if it differs |

**Add `termify(el, phrase, definition, id)` to `week04-ui.js`.** It wraps the first occurrence of `phrase` in `el`'s text nodes in the C7 markup. Every JS-built term uses it, so the markup lives in one place.

### 3.4 Terms

- The boards carry 81 `.w4-term` definitions; the page has 9 today.
- Each board defines its terms "on first use per board". On the page, a board is a section or a topic, so a term such as Louvain gets one definition per section or topic. That repetition is intended.
- The IDs must still be unique (C7).
- Check each definition against the 60-word pop-up limit (RecDrawer). A longer one belongs in a drawer.

### 3.5 Checking that no number was lost or invented

**Tool:** `review/week04-final/tools/number_audit.mjs`, a Node script driving Playwright. The canvas scripts used the `playwright-core` from the local npx cache and the installed Chromium headless shell. Run it twice: on `main` after PR2 (before), and on the PR3 branch (after).

1. **Render.** Serve `docs/` on port 8765 and open the page at 1440 × 1000.
2. **Make everything visible:**
   - remove every `details` `name` attribute, then open every `<details>`;
   - wait for the lazy loaders (poll until `#years-status`, `#methods-status`, `#skills-status` and `#pagerank-status` are gone);
   - unhide all four `.w4m-panel` sections;
   - delete `data-show`.
3. **Extract each card's text.** Take cards as `.w4-card`, `.w4-intro`, the `section.step` openers, `#findings` and the catalogue. Use `innerText`, including drawer bodies and the `.w4-pop` term text. Exclude `svg`, `canvas`, `table`, `select` and `.chart-host`.
4. **Extract the numbers:**
   - numerals with a regex: `/[−-]?\d{1,3}(?:,\d{3})+(?:\.\d+)?%?|[−-]?\d+(?:\.\d+)?(?:%|×)?/g`, with the Unicode minus normalised;
   - number words "zero" to "twenty", "twice", "half", "a third", "a quarter" and "one in N".

   Keep a multiset per card and one for the page.
5. **Compare the before and after multisets:**
   - **Removed numbers.** Each must also be missing from the board card. Put every one in a PR-body table so Gyula can accept the drop (decision D2). A removed number that the board still has is a transfer bug.
   - **Added numbers.** Each must appear in the board card, and it must be one of three things:
     - inside a JS-owned node, since a script computed it;
     - a number moved from another card, because it exists page-wide in "before";
     - pinned by a test.
   - **A number in "after" that exists nowhere in "before"** and sits outside JS-owned nodes has been invented. Stop.
   - **Numbers inside `.w4-pop` term definitions** go in a separate list for review, outside the "invented" rule. The new definitions carry scale numbers that exist nowhere in "before" ("0 means…, 1 means…", "beyond about 2"). Check each by hand: it must be a definition's scale, not a result.
6. **Find the "pinned by a test" set.** Run instrumented copies of the prose and questions tests, as in 0.4, that log every string they assert with `includes`. A number counts as pinned in card X when an asserted string that contains it matches inside `block(X)`.

   **Every added and unpinned number needs a new test** that builds its sentence from JSON, and the test must bite. Examples:
   - "3.6 times the odds" in `ol.rx-answers`;
   - "about twice the share it denied direct employers: 3.20% against 1.56% in 2025" in the `#deeper-uscis` notice;
   - "Louvain finds it in 65 of 100 runs" in the `#place-start` notice;
   - "fell 14% in 2023" in the years card, pinned in PR2.

Commit both audit outputs under `review/week04-final/audit/`, and paste the removed, added and unpinned tables into the PR body.

### 3.6 Test updates PR3 must make

These are the 16 real wording changes the board run found (0.4). Each template still builds its numbers from the same JSON fields.

| Test | Today it pins | The board says | Action |
| --- | --- | --- | --- |
| prose 10 (line 253) | "finds it in 65 of 100 runs; the other 35 find one other split" | "Louvain finds the split shown in 65 of 100 runs; the other 35 find one other split" | New template |
| prose 10 (line 251) | "modularity is 0.049 against 0.013" | "Modularity is 0.049 against 0.013 for rewired networks…" | Capital M |
| prose 1 (line 60) | "2.7% against 1.2% for direct employers in 2022" | "USCIS denied 2.7% of placing firms' first-time petitions against 1.2% for direct employers in 2022, and 3.4% against 2.0% from October 2025 to June 2026" | New template; line 61 still matches the new sentence |
| prose 1 (line 59) | "every year from 2022 on, it denied about twice the share" | "Every year from 2022 on, USCIS denied placing firms about twice the share of first-time petitions" | New phrase; keep the threshold assertion behind "about twice" |
| prose 4 (line 114) | "slightly more by the firm that staffs them than by industry" | only the answer "By both, weakly, and slightly more by vendor." remains | Drop line 114. Line 115 already pins the answer; keep the threshold check that holds up "slightly more" |
| prose 14 (line 335) | "New York files the most, 65,935, but that is 6.9 per 1,000 jobs" | "while New York, the largest filer, sits at 6.9" and "New York files the most, 65,935;" | Two templates |
| prose 14 (line 338) | "San Jose files 42.9, Trenton 17.2 and Seattle 16.8" | "San Jose files 42.9, nearly ten times that" and "Trenton files 17.2 and Seattle 16.8 per 1,000 jobs" | Two templates; "nearly ten times" needs a threshold assertion on `42.9 / 4.5` |
| prose 22 (lines 441 to 443) | "New York–Dallas · seven large hubs" ×3 | "New York–Dallas seven large hubs" | Done in PR2 (item 2) |
| questions 2 (line 52) | "Cognizant four, HCL one" | dropped; the table's "placing firm" tags still show it | **D2**: restore it to More numbers, or delete the assertion |
| questions 2 (line 54) | "The 14 links that peel metros off" | "Table: 14 links that peel metros off" | Done in PR1 |
| questions 8 (line 157) | "file 5.6% of the filings in the 40 metros, and the ten largest filers of any kind 19.1%" | "The ten largest filers file 19.1% of the filings in the 40 metros, and the five largest placing firms 5.6%" | New template, order swapped |
| questions 8 (line 158) | "match Census regions at AMI 0.13 (p = 0.013), against 0.06 for the full network and 0.01 ± 0.03" | "match Census regions at AMI 0.13, against 0.06 for the full network" and "the regional match has p = 0.013, against 0.01 ± 0.03 for random cuts, 4.6 standard deviations away" | Two templates; line 159 ("4.6 standard deviations away") still matches |
| questions 8 (line 166) | "hold at NMI 0.90 and 0.82" | "The job clusters hold (NMI 0.90 and 0.82)" | New template |
| questions 9 (line 181) | "at AMI 0.14 (3.5 standard deviations above its random cuts), more than the 0.13 without all ten" | "match Census regions at AMI 0.14, more than the 0.13 without all ten" and "Amazon's 0.14 sits 3.5 standard deviations above its random cuts" | Two templates |

Add the new pins from 3.5, and prove each new or changed test bites by changing its number once.

### 3.7 Fix-ups: design text that breaks the design's own rules

PR1 already fixed the first three on today's text (1.3.10). The boards still carry them, so the transfer tool applies every row after each splice (3.2, step 6), or it would bring them back:

| Where | Board text | Replace with |
| --- | --- | --- |
| `#place-backbone` lead | "The slider is the disparity-filter α from Week 4." | "The control sets the disparity-filter α from Week 4." (PR1 wording) |
| `#place-backbone`, "Backbone at this α" axis note | "Colours are the communities of card C." | "Colours are section 1's three metro groups." |
| `#cut-skills-cluster` lead, Method drawer and axis note (skills.js) | "the pairs S1 already counts", "the direct ties S1 already counts", "Same row grouping as S1's chart" | "box 3" in place of "S1", for example "Same row grouping as box 3's chart" |
| `#cut-pagerank-iteration` More numbers (pagerank.js) | "matches nx.pagerank's own fixed point within 2e-8" | "matches the standard PageRank routine's fixed point within 2e-8" (the 2e-8 comes from `pagerank.json`'s `max_error_vs_nx_pagerank`) |
| `#deeper-lottery` notice | Built on G3's USCIS totals | Hold it until G3 lands (D3). Until then keep the notice PR1 left |

After the transfer, run a lint for the house style: no em dashes, no `FY20xx`, no `.py`, no `nx.`, no box codes (`\b[SPMRE][1-9]\b`, `card [A-G]`), no "preview", no "TODO". Report every hit.

### 3.8 Steps

1. **Before:** after PR2 merges, run `number_audit.mjs` on `main`.
2. **Tool:** write `port_text.py` and run it on RTop and ROpening only. Review that diff by hand to validate the tool.
3. **Sections:** run the tool on RS1 to RS5 and RClosing, one commit per board.
4. **Deep dive:** run it on RDeep and the five topic boards, then RData, one commit per board.
5. **JS strings** (3.3), including `termify`.
6. **Fix-ups and style lint** (3.7).
7. **Tests** (3.6), then new pins from the audit.
8. **After:** run `number_audit.mjs` on the branch, fill in the PR-body tables and resolve every "invented" number to zero.
9. **Browser check:**
   - every term opens on hover and on focus, and closes on Escape;
   - drawers carry the right labels;
   - no text overflows at 1440 wide;
   - no console errors.
10. **Review:** run the `reviewer` agent, then merge.

### 3.9 Parallel implementer tasks

- **`index.html` is serial:** steps 2 to 4 and the index part of 6 run in one worktree.
- **JS string edits run in parallel, one task per file:** `week04-skills.js`, `week04-skills-radar.js`, `week04-pagerank.js`, `week04-roles.js`, `week04-years.js`, `week04-methods.js` and `week04-place.js` (snap-note term).
- **`termify`:** one task adds it to `week04-ui.js` first. The others import it.
- **Test updates** start once the text lands. Prose and questions can be two parallel tasks.

### 3.10 Risks

- **The transfer writes over JS-owned text.** The mask in 3.2 step 4 and the skeleton guard stop this. `#place-snap-note`, `#place-alpha-choice` and the hero inspector are the known traps: their board text is a render of JSON.
- **Term wrapping splits a pinned sentence.** Keep the term-aware `flatten()` from 1.3.1 in every test helper.
- **A number moves between cards.** A test that pins it by card region then fails. That failure is the intended signal: move the template to the new region.
- **Qualitative words** ("about twice", "nearly ten times", "slightly more", "Barely"). Each needs a threshold assertion in the tests (writing rule). Grep the new text for them and add any that is missing.
- **Section owners.** Àngela (section 1) and Niklas (opening, section 2, closing) lose their wording. Gyula has authorised it. Name them in the PR body so they can review.

---

## 4. Decisions for Gyula

These block nothing else. Each has a default the implementers follow unless Gyula says otherwise.

**D1 Sector colours on the client scatter (CHART_CHANGES item 13).**
- The design paints finance in blue (`#1f8fd6`, the page's `--access`), manufacturing in navy and health care in orange (`#f2820c`, `--people`).
- The site rule, and RSystem's own colour panel, give orange and blue one meaning each on this page: placed at a client, and direct employer.
- **Default: implement the design,** because CHART_CHANGES is the specification. Define three tokens, `--w4-sector-finance: var(--access)`, `--w4-sector-manufacturing: var(--ink)` and `--w4-sector-health: var(--people)`, plus `--w4-sector-other` (`#c3cfdd`) and `--w4-sector-unknown` (`#e3e9f1`).
- **The question for Gyula:** should the scatter follow the one-meaning rule instead? That would mean the navy ramp: `--w4-accent`, `#5b95c2` and `#a7c5e0`. With the tokens in place, either answer is a one-line change in `week04.css`.

**D2 Facts the design's text pass dropped.**
- The board run found one so far: "Cognizant four, HCL one" (card 1B, the leaders of the links that cut metros loose).
- The PR3 audit will list the rest.
- **Default:** restore each dropped fact into its card's More numbers drawer, word for word from today's page, unless the board shows it elsewhere on the same card. Here it does: the table marks each placing firm, so the default for this one is to drop the assertion.

**D3 A new source for "Every draw since 2020" (item 9).**
- It needs USCIS's published per-draw totals, which the repository does not hold. That means a fetch, a footer credit and a credits-test line.
- **Default:** add the source (task A3). If Gyula declines, ship the slopegraph fix alone and keep the deep-lottery notice as it is today.

**D4 The occupation crosstab's stray codes.**
- `12`, `20` and `40` are not 2018 SOC major groups.
- **Default:** trace them in `week04_jobs.py` and map them to the right major. Emit nothing until they resolve.

---


## 4b. Gyula's answers (28 September 2026)

1. Sector colours: neutral hues. Highlight finance, manufacturing and health care in the navy ramp and slate tokens; never orange or blue, which keep their placed/direct meaning.
2. "Every draw since 2020": add the USCIS source (analysis fetch, page JSON, page credit, credits-test line).
3. Dropped facts: accept the drops; list them in the PR3 description.
4. Stray SOC codes 12, 20, 40: trace and fix in the analysis before the job-group composition bars ship.

## Appendix A: card anatomy, board by board

Generated from the boards with `outline.py` and `anatomy.py` (the two scripts sit in the `portplan/` folder next to `design_final/`; copy them to `review/week04-final/tools/`).

**How to read the table:**
- "Left column" and "Right column" are the two children of the card's `.w4-two`. "Figure row" is `.rx-fig-row`. "Single column" means the card has no `.w4-two`.
- `fig«…»` gives the figure's title, then its host as `#id`, `strip:` (`data-strip`) or `more:` (`data-more`).
- `drawers[…]` gives the labels in order.
- The labels show where each block goes. PR1 moves the blocks; PR3 supplies their final text.

| Board | Card | No. | Left column, in order | Right column | Figure row | Single column (no .w4-two) |
|---|---|---|---|---|---|---|
| ROpening | intro card of #opening |  | lead, lead, notice, scope-note, drawers[Background] | div.w4-anatomy, div.w4-howto |  |  |
| RS1 | (intro) place |  | lead, div.w4-example, drawers[Background / Method] | fig«Weak but real»#strip:place-modularity |  |  |
| RS1 | place-start | Start |  |  |  | div.rx-start-grid, div.rx-start-notices, drawers[Background / Method / More numbers / Maps: groups and Census regions] |
| RS1 | place-who | 1A | lead, notice, drawers[Method / More numbers] | fig«How well each labelling matches the Louv»#chart-where-who |  |  |
| RS1 | place-break | 1B | lead, notice, drawers[Method / More numbers / Table: 14 links that peel metros off] | fig«Metros in the largest piece as the filte»#chart-where-break |  |  |
| RS2 | intro card of #jobs |  | lead, drawers[Background] | fig«Real, not noise»#strip:jobs-modularity |  |  |
| RS2 | jobs-together | Start |  |  |  | lead, fig«The 12 most common job pairs» |
| RS2 | jobs-split | 2A | lead, notice, drawers[Method / More numbers] | fig«Do outsourcers cluster jobs like random » |  |  |
| RS2 | jobs-linkcom | 2B | fig«Where the links go» | fig«The 15 jobs with the most communities pe» |  |  |
| RS3 | intro card of #who |  | lead, div.w4-anatomy, drawers[Method] | fig«Weak groups, beyond chance»#strip:who-modularity, fig«One client, many vendors» |  |  |
| RS3 | who-q1 | Start | lead, fig«The lottery funnel»#strip:who-q1-funnel-registrations, drawers[Method / More numbers] | fig«A filing, a client, a denial»#strip:who-q1-split |  |  |
| RS3 | who-switch | 3A | lead, lead, notice, drawers[Method / More numbers] | fig«Switches that stay inside the client's g»#chart-who-switch |  |  |
| RS3 | who-movers | 3B | lead, notice, drawers[Method / More numbers / Table: 15 largest movers] | fig«Share of clients that change group»#chart-who-movers |  |  |
| RS3 | who-overlap | 3C | lead, notice, drawers[Method / More numbers / Table: 15 largest split clients] | fig«Clients split between two groups»#chart-who-overlap |  |  |
| RS4 | (intro) footprint |  | lead, notice, fig«How much do the groups change?»#chart-footprint-nmi, drawers[Background / Method / More numbers] | fig«Do the metro groups follow Census region»#chart-footprint-region |  |  |
| RS4 | footprint-which | 4A | lead, notice, drawers[Method / More numbers] | fig«The largest filers removed in turn»#chart-footprint-rank | fig«One firm out at a time»#chart-footprint-single |  |
| RS5 | intro card of #beyond |  | lead, ol.rx-answers | fig«Three small answers»#strip:beyond-summary |  |  |
| RS5 | beyond-law | 5A | notice, drawers[Method / More numbers] | fig«Agreement with the section 3 groups»#chart-beyond-law |  |  |
| RS5 | beyond-perm | 5B | lead, notice, drawers[Method / More numbers] | fig«Green-card filings per H-1B filing»#chart-beyond-perm |  |  |
| RS5 | beyond-wage | 5C | lead, notice, drawers[Method / More numbers] | fig«Share of filings at level I or II»#chart-beyond-wage |  |  |
| RClosing | intro card of #closing |  | fig«Five weak groups, none of them noise»#strip:closing-recap | div.w4-surprises |  |  |
| RTopicWhere | place-backbone | 1 |  |  |  | lead, seg, fig«Backbone at this α»#chart-backbone, fig«Giant component vs α»#chart-gc, notice, drawers[Method] |
| RTopicWhere | place-longhaul | 2 |  |  |  | lead, stack[fig«Distance vs weight»#chart-longhaul, fig«One employer’s map»#chart-arcs], notice, drawers[Background / More numbers] |
| RTopicWhere | deeper-density | 3 | lead, notice, drawers[Method / More numbers] | fig«Filings per 1,000 jobs»#more:density |  |  |
| RTopicWhere | #cut-methods panel (w4m tab) |  |  |  |  | intro, div.w4m#w4m-root, drawers[Background] |
| RTopicWhere | #cut-methods panel (w4m tab) |  |  |  |  | div.w4m#w4m-root |
| RTopicWhere | #cut-methods panel (w4m tab) |  |  |  |  | div.w4m#w4m-root, drawers[Method] |
| RTopicWhere | #cut-methods panel (w4m tab) |  |  |  |  | div.w4m#w4m-root, drawers[Method] |
| RTopicJobs | jobs-bridges | 1 |  |  |  | lead, fig«Occupations passing each rule»#chart-job-bridge-rule, div.jobs-grid |
| RTopicJobs | jobs-groups | 2 |  |  |  | lead, div.jobs-grid, notice, drawers[Method] |
| RTopicJobs | cut-skills-direct | 3 | lead, notice, drawers[Method / More numbers] | fig«Skill similarity by hiring tie» |  |  |
| RTopicJobs | cut-skills-cluster | 4 | lead, notice, drawers[Method / More numbers] | fig«Skill similarity by cluster membership» |  |  |
| RTopicJobs | cut-skills-radar | 5 | lead, drawers[Method] | fig«Compare occupations' O*NET profiles» |  |  |
| RTopicJobs | cut-pagerank-explore | 6 | lead, seg, w4-legend, notice, drawers[Method / More numbers] | fig«Top 15 occupations by PageRank» |  |  |
| RTopicJobs | cut-pagerank-iteration | 7 | lead, notice, drawers[Method / More numbers] | fig«First place settles in two rounds, the r» |  |  |
| RTopicOutsourcing | who-q2 | 1 | fig«Groups against rewired networks»#strip:who-q2-modularity | fig«Match with vendor and industry»#strip:who-q2-ami |  |  |
| RTopicOutsourcing | who-q3 | 2 | lead, drawers[More numbers] | fig«One firm, many clients, few filings»#strip:who-q3-concentration | fig«How concentrated the big clients are»#strip:who-q3-topshare |  |
| RTopicOutsourcing | intro card of #cut | 3 |  |  |  | fig«Citigroup»#staffing-figure, drawers[Background] |
| RTopicOutsourcing | staffing-community-stats | 4 | lead, lead, table, lead, drawers[Method / More numbers] | fig«Modularity with and without filing count»#strip:staffing-community-modularity |  |  |
| RTopicOutsourcing | staffing-ties | 5 | lead, drawers[Background / More numbers] | fig«Heavy links, looser neighbourhoods»#strip:staffing-ties-overlap | fig«Wage levels as filed»#strip:staffing-ties-wage |  |
| RTopicOutsourcing | deeper-strength | 6 | lead, notice, drawers[More numbers] | fig«The heaviest one-to-one ties»#more:strength |  |  |
| RTopicPaperwork | staffing-lawyers | 1 | drawers[Background / More numbers] | fig«Who uses an outside law firm»#strip:staffing-lawyers-outsourcing, fig«The five largest law firms»#strip:staffing-lawyers-top5 |  |  |
| RTopicPaperwork | staffing-lottery | 2 | lead, drawers[More numbers] | fig«Do high firms cluster?»#strip:staffing-lottery-mates | fig«Agreement with the groups»#strip:staffing-lottery-ami |  |
| RTopicPaperwork | deeper-lottery | 3 | lead, notice, drawers[Method / More numbers] | fig«Every draw since 2020» | fig«Registrations per approved petition»#more:lottery |  |
| RTopicPaperwork | deeper-uscis | 4 |  |  |  | lead, table, notice |
| RTopicPaperwork | deeper-perm | 5 | lead, notice, drawers[More numbers] | fig«Green cards per 100 H-1B filings»#more:perm |  |  |
| RTopicPaperwork | deeper-countries | 6 | lead, notice, drawers[Method / More numbers] | fig«Citizenship of 2023's green cards»#more:countries-top | fig«Do countries group?»#more:countries-modularity |  |
| RTopicYears | years-card | 1 |  |  |  | notice, div.years-grid, drawers[Background / Table: the numbers behind the charts] |
| RTopicYears | roles-card | 2 |  |  |  | intro, div.roles-toolbar, note, div.roles-chart-wrap, div.rx-hover-states, roles-summary, notice, drawers[Background / Method] |
| RTopicYears | who-q4 | 3 | lead, drawers[Background / More numbers] | fig«Consecutive years against the same year»#strip:who-q4-stability | fig«2026 so far, against a year earlier»#strip:who-q4-shift |  |

**Notes on rows the table cannot show:**
- `#place-start` holds `div.rx-start-grid`. Its left half is `#place-rank` (header, lead, metric toggle, "Top cities" plot) and its right half is `#place-regions` (header, lead, `div.rx-groups#place-groups`). `div.rx-start-notices` holds the two notices.
- `#jobs-together` keeps `#chart-job-pairs` and, until PR2, `#jobs-inspector`.
- `#jobs-linkcom` becomes a two-figure `.w4-two` in PR2, with the lead, notice and drawers above it.
- The four method panels are one panel, `details#cut-methods`. The drawers sit inside each `section.w4m-panel`: GN Background, Modularity none, Louvain Method, Overlap Method.
- The roles card keeps `.roles-toolbar` (three `.axis-modes`), the chart, the legend and `#roles-summary`, and ends with `#roles-reveals` as its drawer row.

## Appendix B: topic contents and where each box comes from

| Topic (`details` id) | No. | Contents label (from the board) | Link | Panel | Moves from today |
| --- | --- | --- | --- | --- | --- |
| `topic-where` | 1 | Once the small links go, what's left of the map? | `#place-backbone` | new `details.rx-panel` | `#cut-place` |
| | 2 | Do the same employers tie distant cities together? | `#place-longhaul` | new | `#cut-place` |
| | 3 | Where is the hiring densest? Filings per 1,000 jobs | `#deeper-density` | new; `details.qa` becomes a card | `#cut-more` |
| | none | Does cutting the busiest links split the country? | `#w4m-panel-gn` | `details#cut-methods` | stays |
| | none | Are the three metro groups more than chance? | `#w4m-panel-mod` | same | same |
| | none | Where do the three metro groups come from? | `#w4m-panel-louvain` | same | same |
| | none | Which metros belong to more than one group? | `#w4m-panel-overlap` | same | same |
| `topic-jobs` | 1 | Which jobs belong to two clusters? | `#jobs-bridges` | new | `#cut-jobs` |
| | 2 | Do the clusters follow official job groups? | `#jobs-groups` | new | `#cut-jobs` |
| | 3 | Do occupations the same companies hire together also need similar skills? | `href="#cut-skills"`, `data-target="cut-skills-direct"` | `details#cut-skills`, `data-show="direct"` | stays |
| | 4 | Does that agreement hold for whole hiring clusters, not just direct ties? | `#cut-skills`, `data-target="cut-skills-cluster"` | same, `cluster` | stays |
| | 5 | How do two occupations' day-to-day skills actually compare? | `#cut-skills`, `data-target="cut-skills-radar"` | same, `radar` | stays |
| | 6 | Change the damping factor: does the ranking move? | `#cut-pagerank`, `data-target="cut-pagerank-explore"` | `details#cut-pagerank`, `explore` | stays |
| | 7 | Stepped one round at a time, how fast does the ranking settle? | `#cut-pagerank`, `data-target="cut-pagerank-iteration"` | same, `iteration` | stays |
| `topic-outsourcing` | 1 | Do clients group by industry or by the firm that staffs them? | `#who-q2` | new; card around `.w4-q-block#who-q2` | `#who-first-round` |
| | 2 | Who relies on a single vendor? | `#who-q3` | new | `#who-first-round` |
| | 3 | The client network, year by year | `#staffing-figure` | new; card around `figure#staffing-figure` | `#who-first-round` |
| | 4 | With filing counts or without? | `#staffing-community-stats` | new; `details.qa` becomes a card | `#who-first-round` |
| | 5 | Strong ties, weak ties and pay | `#staffing-ties` | new; same | `#who-first-round` |
| | 6 | Strength against degree: where do the heavy links go? | `#deeper-strength` | new; same | `#cut-more` |
| `topic-paperwork` | 1 | Who files the paperwork? | `#staffing-lawyers` | new | `#who-first-round` |
| | 2 | Do the firms that register the same workers staff the same clients? | `#staffing-lottery` | new; `details.qa` becomes a card | `#who-first-round` |
| | 3 | The lottery a year apart, and who receives the winners | `#deeper-lottery` | new; same | `#cut-more` |
| | 4 | USCIS denials, year by year | `#deeper-uscis` | new; same | `#cut-more` |
| | 5 | Who keeps them? Green cards as the strong tie | `#deeper-perm` | new; same | `#cut-more` |
| | 6 | Where are they from? A network of countries | `#deeper-countries` | new; same | `#cut-more` |
| `topic-years` | 1 | Five years of filings | `#cut-years` | `details#cut-years` | stays |
| | 2 | Who filed, and for which roles? | `#cut-roles` | `details#cut-roles` | stays |
| | 3 | Does it hold from year to year? | `#who-q4` | new; card around `.w4-q-block#who-q4` | `#who-first-round` |
| `evidence` | none | Data and methods (catalogue card: "Sources and the page footer"; "AI use and how we checked it, in the closing" links `#closing-ai`) | `#evidence` | `details.qa.cut.rx-topic#evidence` | stays |

**Topic bars, from the boards:**

| Topic | Holds-line | Contents heading |
| --- | --- | --- |
| Where the hiring is | "The 40 metros, linked by the employers they share." | "Questions", and "The course's community methods, tried on the 40 metros" |
| Jobs and skills | "Occupations, linked by the companies that hire for both." | none |
| Outsourcing firms and their clients | "Who places workers where, and how tightly." | none |
| Paperwork, the lottery and green cards | "What happens around a filing: the lawyers, the draw, USCIS and the green card after it." | none |
| Five years | "How the filings shift from 2022 to 2026." | none |
| Data and methods | "Eight public sources, and how we checked every number." | none |

The holds-lines are topic labels, so PR1 may add them (1.1).

## Appendix C: reproducing the measurements in 0.4

The scripts are in `scratchpad/portplan/`. Copy them to `review/week04-final/tools/` in PR1.

- `python3 build_concat.py [BOARD_DIR]` writes `boards_concat.html`. It concatenates each board's `div.corridor.rx` in page order and drops the scripts and `nav.rx-rail`.
- `fails_prose.txt` and `fails_q.txt` hold the 83 failures from 28 September.
- `t/week04-prose.test.mjs` and `t/week04-questions.test.mjs` are the instrumented copies. `ROOT` points at the worktree, `html` is read from `$BOARD_HTML`, and `assert.ok`, `match` and `equal` collect failures. Run `BOARD_HTML=$PWD/boards_concat.html node --test t/*.test.mjs | grep ^FAIL`.
- With `BOARD_HTML` pointing at today's `index.html`, the same copies report `FAILCOUNT 0`. That is the control.
