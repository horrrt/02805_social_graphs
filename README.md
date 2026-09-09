# Log-Log Legends · 02805 Social Graphs and Interactions

Group repository for DTU course 02805, autumn 2026. One post per week on the
shared Marvel playground dataset, published at
**<https://horrrt.github.io/02805_social_graphs/>**.

## What is here

```
data/          frozen week-1 snapshot from the course data page
                 week1_nodes.tsv   303 characters, names, Wikidata ids, blurbs
                 week1_edges.tsv   1,784 directed links between their articles
notebooks/     the weekly exercise working, with assertions
analysis/      scripts that produce everything the site quotes
docs/          the GitHub Pages site (served from main /docs)
```

## Reproducing week 1

```bash
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

python analysis/week01_facts.py      # every number quoted in the post
python analysis/week01_figures.py    # the four figures and the graph JSON
python analysis/week01_presentation.py # verified data and layout for the story
python analysis/week01_api_check.py  # diffs the snapshot against live Wikipedia
```

`week01_facts.py` writes `analysis/week01_facts.json`. `week01_figures.py` writes
into `docs/weeks/week01/figures/` and `docs/assets/data/`.

`week01_presentation.py` checks the frozen data against the saved facts and writes
`docs/assets/data/marvel_story.json`, including a deterministic drawing layout.
The presentation uses local fonts and data, with no remote JavaScript dependency.
Its design criteria and narrative direction are in [PRESENTATION.md](PRESENTATION.md).

## The one trap worth repeating

Seventeen of the 303 characters have no link in either direction. Build the graph
from the edge list alone and they never get created:

```python
D = nx.DiGraph()
D.add_nodes_from(nodes.node_id)   # add the roster first, or you get 286 nodes
D.add_edges_from(edges.itertuples(index=False, name=None))
```

## Reproducing week 2

Week 2's post is **Pull one hero**, at `docs/weeks/week02/`. Remove one article,
then compare the fragmentation with 1,000 connected, degree-preserving shuffled
networks. The home page indexes every week; Week 2 is the latest issue. The Baymax experiment remains at `play/`.

Using the environment and requirements above:

```bash
python analysis/week01_presentation.py
python analysis/week02_resilience.py
python analysis/week02_figures.py
```

The analysis uses the undirected 277-node giant component (1,421 edges), 20 edge
swaps per edge per draw, and a separate 200-draw check at 50 swaps per edge.
Disconnected outputs are rejected so every comparison starts connected. The
script checks every node's degree and saves seeds, source hashes, exact outcomes,
all draws and the first four accepted example graphs under `docs/assets/data/`.
NetworkX 3.6.1 generated the checked-in results; its version and Python version
are recorded in the JSON. Allow a few minutes for reproduction.

The browser independently checks the real graph and all four example worlds,
including the exact stranded names. Main results remain readable without
JavaScript. Methods explain the exploratory case selection, unadjusted tail
estimates and finite-shuffle limitations.

The [weekly brief](https://sunelehmann.com/socialgraphs2026-web/weeks/week2.html)
also asks for the site link in the Week 2 Teams channel and constructive feedback
on at least one other group's post. Publishing the site does not send those messages.

## Reviewing the design mockups

The [mockup gallery](https://horrrt.github.io/02805_social_graphs/mockups/) contains
all 31 complete design concepts. Explore the new
[comic concept (31)](https://horrrt.github.io/02805_social_graphs/mockups/?collection=comedy),
the seven reference-inspired additions or the three [UX-principle concepts (28–30)](https://horrrt.github.io/02805_social_graphs/mockups/?collection=ux),
open a full-page viewer, and save favourites in the current browser. Copy the
shortlist and paste it into chat to communicate choices; saving a favourite does
not send it anywhere. Each design also has a direct link, such as
`mockups/#mockup-24`. The UX concepts include concise rationale, primary-source
links and specific review notes; they are design proposals, not tested usability
or accessibility claims.

The gallery uses small, lazy-loaded previews and loads a full-resolution,
lossless image when opened. These are static visual concepts, with illustrative
network diagrams and generated labels that need correction before implementation.

## Previewing the site locally

```bash
python -m http.server 8765 --directory docs
```

Then open <http://localhost:8765>.
