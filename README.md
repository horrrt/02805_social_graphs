# The Log–Log Arcade · 02805 Social Graphs and Interactions

A playable anthology built from the course’s frozen Marvel article graph.
Published at **https://horrrt.github.io/02805_social_graphs/** from `main /docs`.
No API keys, bundler, external JavaScript, accounts or live Wikipedia calls are needed.

## Play

| Post | Course week | Route | What the visitor learns |
| --- | --- | --- | --- |
| Hero Packs | Week 1 · Networks | `/weeks/week01/` | Unequal sampling, degrees, duplicates and the long tail |
| Marvel Transit Authority | Week 2 · Models & null models | `/weeks/week02/` | Directed routes, articulation effects and a degree-controlled comparison |

The lobby at `/` shows one cabinet per course week. Weeks 3–8 carry only the
course title and date until their session; nothing is posted there yet.

| Free play (not posts) | Route | What the visitor learns |
| --- | --- | --- |
| MARVEL-OS 303 | `/os/` | Operate the graph through real commands and movable app windows |
| Prediction log | Across all cabinets | Commit a first guess, reveal the result, record the learning |
| Hero Trumps | `/trumps/` | Different centrality metrics answer different questions; five-card coverage |
| Walk / Listen | `/sound/` | Hear a seeded random walk and download it as WAV |
| Keep It Together | `/creature/` | Remove a node, observe components, add hypothetical repair links |
| Hidden Districts · Inside the Articles · Word Finder | `/os/?app=…` | One Louvain partition; the 303 roster descriptions; TF-IDF search |

Weeks 1–2 are posted. The free-play pages are experiments over the same
snapshot, not hand-ins, and carry no week number. The Notepad and TF-IDF apps
use the **303 real short descriptions in the course roster**, not full
Wikipedia article bodies. Links to the live source pages are provided.

The schedule lives in `docs/assets/js/weeks.js`, and `tests/site.test.mjs`
fails if the lobby, the free-play pages or the prediction logbook drift from
it. To open a week: set its status to `live`, add its cabinet, and update the
"exactly weeks … are live" assertion in the test.

The previous Baymax mission remains at `/play/`. The 49-concept design archive
remains at `/mockups/`; those image mockups are separate from the working arcade.

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

Use Python with the packages in `requirements.txt` (NetworkX is pinned to the
version used for the published metrics and community partition).

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python analysis/week01_facts.py
python analysis/week01_figures.py
python analysis/week01_presentation.py
python analysis/week02_resilience.py
python analysis/week02_figures.py
python analysis/arcade_data.py
python analysis/week01_packs.py
python analysis/week02_transit.py
```

The week-2 ensemble takes longer than the other steps. It records 1,000 accepted
connected degree-preserving rewires for each tested article at 20 successful
swaps per edge, plus a 200-draw sensitivity check at 50 swaps per edge. Source
hashes, seeds and exact outcomes are recorded under `docs/assets/data/`.

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

```bash
python -m http.server 8765 --directory docs
node --test 'tests/*.test.mjs'
```

Open `http://127.0.0.1:8765/`. Serve through HTTP rather than opening HTML files
from disk, because browser modules and data loading require a web origin.

Tests cross-check all 277 browser removals against independently generated CSV
results, Python path fixtures, exact stranded groups, triangle and coverage
counts, connected degree-preserving rewires, random walks, text search, terminal
commands, prediction bounds and PCM audio export. The site tests pin the lobby,
the free-play pages and the logbook to the course schedule and check every
fragment link. Browser review covers desktop
and phone layouts, actual playback/export, window controls and saved progress.

## Terminal examples

```text
bfs baymax spider-man
bfs "Doctor Strange" hulk --undirected
top --in 10
top --betweenness 10
rewire --swaps 20 --seed 7
strand hulk
triangles
walk spider-man --steps 32 --seed 7
search spider
restore
help
```

The terminal is a graph interpreter, not a shell. Interactive rewiring starts
from the observed core each time, preserves connectivity and degrees, and accepts
up to 2,000 swaps. It creates one demonstration world, not a substitute for the
recorded 1,000-draw benchmark or a claim of uniform null sampling. Directed paths
always use the original snapshot; undirected paths, walks and removals use the
current scenario. The nine-node island and original isolates are preserved.

## UX and scope

See [PRESENTATION.md](PRESENTATION.md). All free-play concepts are usable without a key.
Audio is opt-in, with stop and volume controls. Canvases have text equivalents.
Controls work by keyboard; OS title bars support Alt + arrow movement. Small
screens stack windows. Reduced-motion preferences suppress optional movement.
Static takeaways remain readable without JavaScript. Each page discloses graph
scope, methods, limitations and AI assistance.

First predictions and card collections stay in browser storage. The logbook
supports download and reset; no visitor data is uploaded. Scores measure absolute
numerical error relative to the displayed range, not formal probabilistic
calibration. Only the first attempt for each challenge counts.

Publishing the site does not submit a Teams message or peer feedback. Those are
separate course hand-in actions.
