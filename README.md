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
python analysis/week01_api_check.py  # diffs the snapshot against live Wikipedia
```

`week01_facts.py` writes `analysis/week01_facts.json`. `week01_figures.py` writes
into `docs/weeks/week01/figures/` and `docs/assets/data/`.

## The one trap worth repeating

Seventeen of the 303 characters have no link in either direction. Build the graph
from the edge list alone and they never get created:

```python
D = nx.DiGraph()
D.add_nodes_from(nodes.node_id)   # add the roster first, or you get 286 nodes
D.add_edges_from(edges.itertuples(index=False, name=None))
```

## Previewing the site locally

```bash
python -m http.server 8765 --directory docs
```

Then open <http://localhost:8765>.
