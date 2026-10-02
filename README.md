# Log–Log Legends

An interactive network science project for DTU 02805 Social Graphs and
Interactions, autumn 2026, by Gyula Kürthy, Àngela Buxó and Niklas Johansen.

**[Explore the website](https://horrrt.github.io/02805_social_graphs/)**

The project explores how connections and language reveal patterns in three
kinds of data: Marvel Wikipedia articles, global migration and H-1B hiring.
It asks how networks hold together, which nodes connect different groups,
how communities form and whether the words in articles reflect their links.

Interactive visualizations let readers make predictions, explore the data and
compare observed patterns with random baselines. The notebooks and Python
analyses record the methods behind the findings, alongside source coverage
and limitations.

## Inside the repository

- `src/`: the Next.js website, interactive visualizations and styles.
- `public/`: datasets, images, fonts and vendored libraries served by the website.
- `analysis/` and `notebooks/`: reproducible analyses and course exercises.
- `data/` and `scripts/`: datasets, collection tools and exporters.
- `tests/`: checks for the website, data and documentation.
- `project/` and `review/`: methods, project notes, guidelines and review records.

See the [development and data reference](project/DEVELOPMENT.md) for setup and
reproduction, the [migration questions](project/MIGRATION_QUESTIONS.md) and
[data catalogue](project/MIGRATION_DATA_CATALOGUE.md) for research sources, and
[AGENTS.md](AGENTS.md) for contributor instructions.
