# Log–Log Legends

DTU 02805 Social Graphs and Interactions, autumn 2026. Weekly interactive posts
by Àngela Buxó, Gyula Kürthy and Niklas Johansen, with the notebooks and analysis
behind them.

**[Open the course website](https://horrrt.github.io/02805_social_graphs/)**

## Weekly posts

| Week | Post | Topic |
| --- | --- | --- |
| 1 | [Hero Packs](https://horrrt.github.io/02805_social_graphs/weeks/week01/) | Marvel article links, degrees and unequal sampling |
| 2 | [Transit Authority](https://horrrt.github.io/02805_social_graphs/weeks/week02/) | Network resilience and degree-preserving null models |
| 3 | [Corridor Control](https://horrrt.github.io/02805_social_graphs/weeks/week03/) | Migration networks, centrality and country comparisons |
| 4 | [Who Hires](https://horrrt.github.io/02805_social_graphs/weeks/week04/) | H-1B hiring, communities and backbones |
| 5 | [Marvel in Words](https://horrrt.github.io/02805_social_graphs/weeks/week05/) | Text analysis of 303 Marvel Wikipedia pages |

The schedule in [weeks.js](docs/assets/js/weeks.js) controls the lobby and the
prediction logbook. Weeks 6–8 are upcoming.

## Run locally

The website is static HTML, CSS and JavaScript. GitHub Pages publishes `docs/`
from `main`; there is no site build step.

```bash
python3 -m http.server 8765 --bind 127.0.0.1 --directory docs
```

Open [localhost:8765](http://127.0.0.1:8765/). Serve through HTTP so browser
modules and data loading work.

For notebooks and analysis, use Python 3.13 and the tested dependency snapshot:

```bash
python3.13 -m venv .venv-course
source .venv-course/bin/activate
python -m pip install -r requirements-lock.txt
python -m pip check
python -m ipykernel install --sys-prefix --name socialgraphs --display-name "Social Graphs (Python 3.13)"
python -m jupyterlab
```

Select **Social Graphs (Python 3.13)** in JupyterLab. Run analysis scripts from
the repository root. Some notebooks need downloaded inputs in `build/`; see
[Development and data reference](project/DEVELOPMENT.md) for prerequisites,
reproduction commands and platform notes.

Run the site checks with a recent Node.js version that supports `fs.globSync`:

```bash
node --test 'tests/*.test.mjs'
```

## Repository layout

| Folder | Contents |
| --- | --- |
| `docs/` | Published website, weekly posts, shared assets, style guide and mockups |
| `analysis/` | Python analyses, exporters and committed results |
| `notebooks/` | Course exercises and notebook figures |
| `data/` | Committed datasets and source index |
| `scripts/` | Data collection, rebuilding and maintenance tools |
| `tests/` | Node.js checks for the site, data and documentation |
| `project/` | Development guide, post guidelines, weekly notes and migration references |
| `review/` | Review notes, screenshots and design work |
| `.github/` | Assistant instructions, Copilot prompts and commit-format workflow |

Downloaded inputs and generated scratch files live in ignored folders such as
`build/`, `materials/` and `output/`. Libraries, fonts and imagery needed by the
published site are committed under `docs/assets/`.

## Project notes

- [Development and data reference](project/DEVELOPMENT.md): notebooks, analysis commands, data scope and site controls.
- [Post guide](project/POST_GUIDE.md): writing, design and review workflow.
- [Week 4 notes](project/WEEK04.md) and [Week 5 notes](project/WEEK05.md): sources, methods and section details.
- [Migration questions](project/MIGRATION_QUESTIONS.md) and [data catalogue](project/MIGRATION_DATA_CATALOGUE.md): research questions and source coverage.
- [Presentation and accessibility](project/PRESENTATION.md).
- [Hand-in review](review/social-graphs-simplify.md).

Coding assistants start with [AGENTS.md](AGENTS.md) and
[the shared instructions](.github/copilot-instructions.md). Contribute on a
branch and use a pull request with a Conventional Commit title.

Publishing the website is separate from posting the weekly URL in Teams and
giving peer feedback. This repository does not establish whether those course
hand-in actions are complete.
