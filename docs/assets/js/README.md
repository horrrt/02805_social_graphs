# Components

Every component a section script needs comes from one import, `kit.js`:

```js
import { slot, figure, echart, concordance, passage, loadData } from "./kit.js?v=1";
```

Link three stylesheets, in this order: `type.css`, `corridor.css`, `post.css`.
The Week 5 page already does. See every component drawn with toy data at
[`docs/styleguide/kit.html`](../../styleguide/kit.html) (served at `/styleguide/kit.html`).

Week 5 has one script per section, `week05-<section>.js`, already loaded by the page. Each draws into its
section's slots and reads its data from `docs/weeks/week05/data/<section>.json`. `tests/kit.test.mjs` fails
when this list and the exports of `kit.js` disagree.

## Page and data

### loadData(url)

Fetches a JSON file. Build the URL with `new URL("../../weeks/week05/data/heaps.json", import.meta.url)` so it
works locally and on GitHub Pages. Only files under `docs/` are published.

### slot(section, part)

The element to draw into. `part` is one of `asked`, `did`, `figure`, `surprise`, `checked`, `limit`:
`slot("heaps", "figure")` is the body of `#heaps-figure`. Drawing into it replaces the hint and keeps the
heading.

The Week 4 card layout is a class, not a function: `<div class="w5-slots card w4-card w5-card">` puts the six
slots in Week 4's arrangement (question and answer on top, text column with the figure beside it, checked
passages below), styled in `post.css`. Sections 1 and 2 of the week 5 page show the markup.

## Figures and tables

### figure(host, { chart, caption, data, label })

A chart, its caption and its numbers in one call, which is what every chart on the site needs. `chart` is an
SVG or element, or a function that draws into the element it is given, such as
`(el) => echart(el, option)`. `data` is a `table()` spec shown in a closed drawer.

```js
figure(slot("fame", "figure"), {
  chart: (el) => echart(el, { xAxis: { type: "log", name: "in-degree" }, yAxis: { name: "tokens" },
                              series: [{ type: "scatter", data: rows.map((r) => [r.indeg, r.tokens]) }] }),
  caption: "Each dot is one page. Dots above the line are longer than their links predict.",
  data: { columns: [{ key: "page", label: "Page" }, { key: "tokens", label: "Tokens", num: true }], rows },
});
```

### table({ columns, rows, caption })

A plain table. `columns` is `[{ key, label, num }]`; `num: true` right-aligns the column. Numeric columns get
Week 4's bars and meters through `decorate()`.

### echart(host, option, { height })

Loads the vendored ECharts on first use and draws `option` at the site's type sizes and colours. It adds an
item tooltip, hides overlapping labels and resizes with the page. Resolves to the chart.

### loadECharts()

Loads `docs/assets/vendor/echarts-5.5.1.min.js` once and resolves to `window.echarts`, for a chart
`echart()` does not cover.

### palette()

The series colours, in order, read from the page's CSS tokens. Give each colour one meaning across the page.

### stripChart(rows, opts)

The site's one chart for a real result against its random baseline. Use it for every null-model comparison.
Each row: `{ label, real, realLabel, base: [mean, sd], baseLabel }`; `opts`: `{ domain, ticks, fmt, aria }`.

```js
stripChart([{ label: "Enemy links across communities", real: 0.62, realLabel: "0.62",
              base: [0.41, 0.03], baseLabel: "shuffled labels" }],
           { domain: [0, 1], ticks: [0, 0.5, 1], fmt: (v) => v.toFixed(1), aria: "…" });
```

### miniStrip(spec)

One row of `stripChart` without an axis: `{ domain, real, realLabel, base, baseLabel, aria }`.

## Text evidence

### concordance(rows, { caption })

Key word in context: one row per hit, the hit centred and marked, the page linked to Wikipedia.
`rows`: `[{ page, left, hit, right }]`, where `page` is a node_id.

### passage({ page, text, highlight })

A quoted passage from one page, with every occurrence of `highlight` marked and a link to the article. Use it
in the "What we checked in the text" slot.

### wikiLink(page)

A link to a node's English Wikipedia article, labelled with its title.

## Glossary and drawers

### termify(el, phrase, definition, id)

Turns the first `phrase` inside `el` into a glossary term that opens its definition on hover, focus or click.
`id` must be unique on the page.

### drawer(label, body)

One closed disclosure. `body` is a Node or an HTML string. Labels run "Background", "Method",
"More numbers", "Table: …".

### drawerRow(...drawers)

Puts drawers side by side in one row.

### decorate(table), decorateAll(root)

Week 4's table styling: numeric columns aligned, a bar for counts, a meter for shares. `table()` already calls
`decorate()`.

## SVG and type

### node(name, attrs, text)

Creates an SVG element.

### token(name)

A CSS custom property's value, such as `token("--access")`. Never write a hex colour in JavaScript: the theme
test fails on it.

### fs(role), family(name), font(role, weight, name)

Font size, family and canvas font string from the type scale. Roles: `caption`, `small`, `body`, `strong`,
`lead`, `h4`, `h3`, `h2`. The type-scale test fails on a size typed in by hand.

### textWidth(text, role, weight)

The rendered width of a line of text, for fitting labels.

### fitted(build, fallback), roomFor(el)

Draws an SVG at its parent's width and redraws when the width changes. `build(width)` returns the SVG.
