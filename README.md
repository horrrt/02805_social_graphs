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

## How the site is built

The site is a Next.js static export, moving page by page to React components
([the plan](review/react-migration/plan.json)). Static markup is server
components. Each element a script used to write is a client island made with
`island()`: it renders the server markup until the page has hydrated and its
data has loaded, and a failing island leaves the rest of the page alone.
Page-wide state lives in small module stores; data, vendored libraries,
charts, canvases and listeners go through the hooks in `src/lib/`. The rules,
recipes and checks every change follows are in
[src/lib/README.md](src/lib/README.md). Every page has converted, and the old
script loader (`src/scripts/entries/` and `PageScripts`) is gone: a script
runs only when a component imports it. Links stay plain `<a href>`, so each
page loads fresh.

See the [development and data reference](project/DEVELOPMENT.md) for setup and
reproduction, the [migration questions](project/MIGRATION_QUESTIONS.md) and
[data catalogue](project/MIGRATION_DATA_CATALOGUE.md) for research sources, and
[AGENTS.md](AGENTS.md) for contributor instructions.

## A new week

A post starts as a copy of the post template, `src/app/(template)/`, which the
site serves at `/weeks/_template/`:

1. Copy the route group, `cp -r "src/app/(template)" "src/app/(week06)"`, and
   rename its page folder from `weeks/%5Ftemplate` to `weeks/week06`. The
   header comment in its `layout.tsx` lists what to change in the copy.
2. Keep one component per section in the copy's `_sections/` folder. Give each
   chart host an island in `src/features/week06/`, made with `island()` from
   `src/lib/island.tsx` and named `week06/<section>/<Name>`, as
   `src/features/template/charts.tsx` does.
3. Put each section's pure builders in `src/scripts/week06-<section>.js`:
   chart specs and data shaping, with no DOM, listeners or fetch.
   `src/scripts/week-template.js` holds the template's toy data this way.
4. Load each JSON file with `useData(asset(path))` from `src/lib/useData.ts`
   and draw with the kit in `src/kit/`, whose README documents every
   component. Prose that gets a glossary term goes through `TermProse`
   (`src/components/post/TermProse.tsx`).
5. Keep each card within the text budget: `tests/text-budget.test.mjs` fails a
   card that shows more than 350 words before a click
   ([the post guide](project/POST_GUIDE.md), "Keep the card short").
6. Keep `noindex` and the week "coming" in `src/scripts/weeks.js` until the
   post is done, then run the gates in [src/lib/README.md](src/lib/README.md)
   (G1 to G6). `scripts/parity/static.mjs` reports the new page as missing on
   main; every other page must still match it.
