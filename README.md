# Log–Log Legends · 02805 Social Graphs and Interactions

A playable anthology built from the course’s frozen Marvel article graph.
Published at **https://horrrt.github.io/02805_social_graphs/**: a Next.js static
export that `.github/workflows/deploy.yml` builds and publishes on every push to
`main`. No API keys, accounts or live Wikipedia calls are needed, and nothing is
fetched from a third-party domain at runtime: the week 3 render variants load
their charting libraries from `public/assets/vendor/`, which are vendored in the
repository and pinned by version.

## Play

| Post | Course week | Route | What the visitor learns |
| --- | --- | --- | --- |
| Hero Packs | Week 1 · Networks | `/weeks/week01/` | Unequal sampling, degrees, duplicates and the long tail |
| Marvel Transit Authority | Week 2 · Models & null models | `/weeks/week02/` | Directed routes, articulation effects and a degree-controlled comparison |
| Corridor Control | Week 3 · Who matters, and why | `/weeks/week03/` | Two country networks, weighted betweenness and a degree-preserving null |

The lobby at `/` leads with the three published weekly posts. The remaining
course dates sit under Upcoming weeks. Each post follows a short question,
interaction, finding and takeaway; Evidence & details retains the full analysis.

The free-play tools that once sat beside the posts (MARVEL-OS 303, Hero Trumps,
Walk / Listen, Keep It Together and the OS apps) have been removed. Their routes
`/os/`, `/trumps/`, `/sound/` and `/creature/` no longer exist. The prediction
log stays: every post still asks for a first guess before it reveals a number,
and the logbook still files old free-play guesses under FREE PLAY rather than
inventing a week for them.

The schedule lives in `src/scripts/weeks.js`, and `tests/site.test.mjs`
fails if the lobby or the prediction logbook drifts from it. To open a week: set
its status to `live`, add its cabinet, and update the "exactly weeks … are live"
assertion in the test.

The 48-concept design archive remains at `/mockups/`; those image mockups are
separate from the working arcade.

## The frozen data

- Snapshot: 26 August 2026; `data/week1_nodes.tsv` and `data/week1_edges.tsv`.
- 303 nodes and 1,784 directed links; undirected collapse has 1,434 edges.
- Weak components: a 277-node core, a nine-node island, 17 isolates.
- Add the complete roster before adding edges, or the isolates disappear.
- The core has 1,421 undirected edges. Removing one article leaves 276.
- 58 articles have zero incoming links; this includes, but is not limited to, the 17 isolates.

A link is an article hyperlink within this roster. It does not represent
friendship, hero strength, popularity or the whole Marvel universe.

## Reproduce

Use Python 3.13 and the tested dependency snapshot. The project environment is
separate from any existing `.venv`; VS Code uses `.venv-course`.

```bash
python3.13 -m venv .venv-course
source .venv-course/bin/activate
python -m pip install -r requirements-lock.txt
python -m pip check
python -m ipykernel install --sys-prefix --name socialgraphs --display-name "Social Graphs (Python 3.13)"
python -m jupyterlab
```

The notebooks are in `notebooks/`:

| Notebook | What it holds |
| --- | --- |
| `01_toolbox_shakedown.ipynb` | Exercise 1.3: karate club and the adjacency-matrix explorable |
| `02_marvel_degrees.ipynb` | Exercise 1.6 in full: Marvel degree distributions and binning |
| `03_marvel_exercises.ipynb` | Every data exercise from weeks 1-4 on the Marvel network, plus the dataset-free parts (random graphs, Watts-Strogatz, preferential attachment, karate) |
| `04_migration_exercises.ipynb` | The same exercises on the UN DESA 2024 migrant stock network |
| `05_h1b_exercises.ipynb` | The same exercises on the FY2025 H-1B outsourcing firm to client network |

Two notebooks read gitignored files from `build/`. Notebook 04 needs
`build/raw/iso3166_m49.csv`, the pinned ISO 3166 to UN M49 region table that
`scripts/migration/fetch_country_layer.py` downloads (its URL is
`ISO3166_M49_URL` in that script). Notebook 05 reads the Week 4 filings from
`build/week04/`, so run `python analysis/week04_data.py` first on a fresh clone;
it takes about 14 minutes to run. Open a notebook in
JupyterLab, select **Social Graphs (Python 3.13)**, and choose
**Restart Kernel and Run All Cells**. Run analysis scripts from the repository
root. The lock records the Python 3.13 environment tested on macOS; other
platforms may need a compatible resolution from `requirements.txt`.

To regenerate the analysis and figures:

```bash
python analysis/week01_facts.py
python analysis/week01_figures.py
python analysis/week01_presentation.py
python analysis/week02_resilience.py
python analysis/week02_nullmodels.py
python analysis/week02_figures.py   # dark and light variants
python analysis/arcade_data.py
python analysis/week01_packs.py
python analysis/week02_transit.py
```

`python analysis/run_all.py` runs these and the week 3 scripts in parallel, each as soon as the
files it reads are ready, in about 16 minutes. `python analysis/run_all.py week02` runs one week. It ends by
listing every committed file under `analysis/` and `public/` that changed, so run it before editing a
script: an empty list means the committed data still reproduces.

The week-2 ensemble takes longer than the other steps. It records 1,000 accepted
connected degree-preserving rewires for each tested article at 20 successful
swaps per edge, plus a 200-draw sensitivity check at 50 swaps per edge. Source
hashes, seeds and exact outcomes are recorded under `public/assets/data/`.

The arcade exporters add:

- `arcade_graph.json`: all roster text and links, exact normalized undirected
  betweenness and local clustering, seeded Louvain communities, the greedy
  coverage reference, source hashes and independent path fixtures.
- `week01_packs.json`: draw weights, degree histogram and unequal coupon-collector
  expectation. Expected whole five-card packs lie between 1,944.19 and 1,944.99;
  “about 1,945” is an approximation. A 20,000-trial exponential-race simulation
  independently checks the integral.
- `week02_transit.json`: the 16-hub schematic, its real links and the original
  removal/ensemble summaries. Coloured lines are drawing paths, **not communities**.

## Run and check

Use Node 20.9 or newer.

```bash
npm ci
npm run dev
```

Open `http://127.0.0.1:8765/`. The dev server serves from the root; the
published build lives under `/02805_social_graphs/`.

```bash
npm test
```

`npm test` builds the static export into `out/` and then runs
`node --test 'tests/*.test.mjs'`, because most tests read the built pages.

Tests cross-check all 277 browser removals against independently generated CSV
results, Python path fixtures, exact stranded groups, triangle and coverage
counts, connected degree-preserving rewires and prediction bounds. The site
tests pin the lobby and the logbook to the course schedule and check every
fragment link. The theme tests check that every canvas colour the scripts read
is defined in the stylesheet. Browser review covers the published posts and
saved progress.

## How the site is built

- **Pages.** Each page is a route group in `src/app/`, for example
  `src/app/(week05)/`. Its `layout.tsx` holds the page's `<html>`, body class,
  title and stylesheet imports; `page.tsx` under the route's folder holds the
  markup. Every page is its own group because the pages differ in body class and
  stylesheets, so moving between pages is a full page load.
- **Chart code.** `src/scripts/` holds plain ES modules that draw into the
  markup. `src/components/PageScripts.tsx` imports a page's entry module,
  `src/scripts/entries/<page>.js`, once React has hydrated the page, so a script
  never races React for the DOM.
- **Styles.** Stylesheets live in `src/styles/` and fonts in `src/fonts/`. Next
  bundles both and names every file by its content hash, so a deploy cannot serve
  one version's code with another version's markup.
- **Static files.** Data, vendored libraries, textures and images stay in
  `public/` at fixed URLs. Scripts reach them through `asset()` in
  `src/scripts/site.js`, which adds the deploy's commit to the query string, so
  a new deploy also replaces cached data.
- **A new week.** Copy `src/app/(template)/` to `src/app/(week06)/` and rename
  its `weeks/%5Ftemplate/` folder to `weeks/week06/`. Add
  `src/scripts/entries/week06.js` and list it in `PageScripts.tsx`.
- **Deploy.** The workflow builds on every push to `main` and publishes `out/`.
  The repository's Pages source must be set to GitHub Actions.

## Coding assistants (Copilot in VS Code)

The repository tells GitHub Copilot how to work here, on every plan including Free and Student:

| File | What it does |
| --- | --- |
| `.github/copilot-instructions.md` | Rules for every request: read first, plan, run the checks, report honestly, and what never to do |
| `.github/instructions/*.instructions.md` | Extra rules that apply to `analysis/`, to `public/` and `tests/`, and to prose |
| `.github/prompts/*.prompt.md` | Slash commands in Copilot Chat: `/check`, `/review`, `/ship` |
| `AGENTS.md` | Points Copilot, Claude Code and Codex at the same rules |
| `.vscode/settings.json` | Turns instruction files on and lets the read-only checks run without a prompt |

`tests/assistant-docs.test.mjs` fails when one of these files names a path or script that no longer exists.
`python analysis/check_pages.py` checks every week's page data against the fields its page scripts read.

To use them, open the repository folder in VS Code and use Copilot Chat in **Agent** mode, so it can run
the checks itself. Type `/check` before a commit, `/review` before a pull request, and `/ship` to open one.
Copilot Free and Student choose the model automatically, so no file can pick one; the instructions ask
every model to read, plan and verify instead.

If VS Code still asks before running `node --test` or the names check, add the same
`chat.tools.terminal.autoApprove` entries from `.vscode/settings.json` to your user settings. Some
Copilot session types only read that setting there.

## The migration project

From week 3 the project also works on a second domain: global migration. Two
documents cover the data behind it, and both are generated from
`scripts/migration/sources.py`.

- **[Four questions about global migration](MIGRATION_QUESTIONS.md)** — the four
  questions we want to answer with closeness, betweenness, cliques and event
  studies, the trap in each, and the datasets each one actually needs. Then
  twenty candidate questions for the weekly posts, each with what is at stake,
  its null and a verdict on which week it fits. Start here.
- **[Migration data catalogue](MIGRATION_DATA_CATALOGUE.md)** — 82 sources in 17
  families. Per source: what one row is, coverage, metrics, network shape and
  limitations.

`scripts/migration/` harvests the data. `run_all.py` runs the whole thing:
a Wikipedia category crawl, Wikidata classification into organisations, the
article-link graph, then the country layer from UN DESA, UNHCR and the World
Bank. Files land in `data/migration_*.tsv`; rebuild them rather than editing
them.

## Style dimensions

The week 3 post is drawn from four independent choices, each a dropdown in the
Style menu in the top bar and each a URL parameter, so any combination is a link
you can send. The data, the numbers and the copy never change.

| Parameter | Choices |
| --- | --- |
| `?variant=` | `canvas` (default, no library) · `d3` 273 KB · `echarts` 1007 KB · `globe` 1008 KB · `atlas` 1491 KB · `deck` 1217 KB |
| `?palette=` | `signal` (default) · `ember` · `iris` · `okabe` (colourblind-safe) · `slate` (mono, prints well) |
| `?arcs=` | `curve` (default) · `straight` · `flow` (animated dashes) · `taper` (width carries direction) |
| `?basemap=` | `outline` (default) · `photo` (NASA Blue Marble, in every renderer) · `none` |
| `?tables=` | `rules` (default) · `zebra` · `cards` · `compact` |

Example: [`?variant=atlas&palette=okabe&arcs=taper&tables=compact`](https://horrrt.github.io/02805_social_graphs/weeks/week03/?variant=atlas&palette=okabe&arcs=taper&tables=compact)

Only the renderer reloads when it changes; the other three repaint in place. A
renderer overrides the visuals it replaces and inherits the canvas one for the
rest, so a library that fails to load falls back rather than taking the post
down. The palette lives in CSS custom properties and the canvas reads it back
through `getComputedStyle`, so one definition drives the stylesheet, the SVG
variants and the 2D canvas at once.

`src/scripts/week03-boot.js` holds the registries; each renderer is one
module under `src/scripts/variants/`.

### Rebuilding, and what is committed

Nothing large is kept here that cannot be recreated. Raw inputs (a 6 MB
spreadsheet, an 820 KB boundary file) live in gitignored `build/raw/`; what is
committed is the derived output the browser loads, 5 MB in total.

    python scripts/rebuild_week03.py --check   # what is committed, and what made it
    python scripts/rebuild_week03.py           # download everything and rebuild
    python scripts/rebuild_week03.py --fast    # reuse the cached null model

Libraries and imagery are committed on purpose: the published site can load
only what is in `public/` or bundled from `src/`.

`rebuild_week03.py` rebuilds the two network files and the roles. The analyses
that read them and write to `analysis/` are separate runs, because each is slow
and none is needed to serve the page:

    python analysis/week03_tails.py         # heavy-tail fits, a few minutes
    python analysis/week03_gravity.py       # PPML gravity and its residuals
    python analysis/week03_communities.py   # Louvain against a degree-preserving null
    python analysis/week03_passengers.py    # the route proxy against US BTS passengers
    python analysis/week03_country_networks.py

### Checking the renderers

`scripts/audit_week03.js` exercises every control in whichever renderer is
loaded and reports the ones that render but do nothing. Load the post, paste
the file into the console, and run `await auditWeek03()`; repeat per
`?variant=`. It is how the ECharts and D3 axis switches were caught doing
nothing.

## UX and scope

See [PRESENTATION.md](PRESENTATION.md). Canvases have text equivalents and
controls work by keyboard. Reduced-motion preferences suppress optional movement.
Static takeaways remain readable without JavaScript. Each page discloses graph
scope, methods, limitations and AI assistance.

First predictions and card collections stay in browser storage. The logbook
supports download and reset; no visitor data is uploaded. Scores measure absolute
numerical error relative to the displayed range, not formal probabilistic
calibration. Only the first attempt for each challenge counts.

Publishing the site does not submit a Teams message or peer feedback. Those are
separate course hand-in actions.

## Hand-in review

See [the review](review/social-graphs-simplify.md) for brief coverage, environment
checks and screenshots. Publishing does not complete the course workflow: post
the weekly URL in Teams by Monday evening and give feedback to another group.
The repository does not establish whether either action has been completed.
