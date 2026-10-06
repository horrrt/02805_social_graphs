# The React kit

The components a section island draws with, from one import:

```tsx
import { Figure, EChart, StripChart, Concordance } from "@/kit";
```

Each is the React twin of a builder in `src/scripts/kit.js` and renders the same elements, classes,
attributes and tooltips. Charts draw only after hydration, from the page's type scale and colour tokens
(`useTypeScale`, `useTokens`, `useTextMeasure` in `src/lib`), so the server renders the host empty, as main's
server markup has it. Use them inside an island (`island()` in `src/lib/island.tsx`); none of these files is
`'use client'`. The rules every island follows are in [src/lib/README.md](../lib/README.md).
`/styleguide/kit/` draws them with toy data (`src/features/kit-page/`). `/styleguide/kit/states/` draws them in awkward cases
(empty rows, long labels, values off the axis, half-width columns); after `npm run build`, `npm run kit:states` loads it
in headless Chromium and fails on an empty host, a page error or a component that spills out of its column. `tests/kit.test.mjs` fails when this
list and the exports of `index.ts` disagree.

## Charts

### StripChart({ rows, opts })

The site's one chart for a real result against its random baseline, as `stripChart()`. Each row:
`{ label, sub, real, realLabel, realTip, hollow, color, base: [mean, sd], baseLabel, baseTip, ci: [lo, hi],
ciTip, ref: [value, label], badge, divider, bold }`; `opts`: `{ domain, ticks, fmt, aria }` and optionally
`width` (the width before the parent is measured, 556 by default), `labelW`, `rowH`, `badgeW`, `axisTitle`,
`zeroLine`, `ref`, `top`. Drawn at its parent's width (`useFittedWidth`) from `stripLayout()`.

```tsx
<StripChart
  rows={[{ label: "Enemy links across communities", real: 0.62, realLabel: "0.62", base: [0.41, 0.03], baseLabel: "shuffled labels" }]}
  opts={{ domain: [0, 1], ticks: [0, 0.5, 1], fmt: (v) => v.toFixed(1), aria: "…" }}
/>
```

### MiniStrip({ spec })

One row of `StripChart` without an axis, as `miniStrip()`: `{ domain, real, realLabel, base, baseLabel, ref,
refLabel, ci, aria, width }` (`width` 300 by default).

```tsx
<MiniStrip spec={{ domain: [0, 1], real: 0.62, realLabel: "0.62", base: [0.41, 0.03], baseLabel: "random", aria: "…" }} />
```

### NetworkView({ spec, onChange })

A network drawn as `networkView()` draws it, from the same rows (`networkLayout()` in `src/scripts/graph.js`):
the same elements, classes, attributes and tooltips, and every option `graph.js`'s header lists (`theme`,
`colorNodes`, `colorLinks`, `fade`, `mark` on a link, `titles`, `hubs`, `labels`, `tone`, `strongLinks`,
`badges`, `hollow`, `weights` and `highlight`, `movable`, `legend`, `unit`, `note`, `ratio`, `explore` and
`describe`). `onChange(nodes)` follows a move. Drawn at `spec.width` (640 by default) and then at its parent's
width (`useFittedWidth`). Under `explore`, d3 loads (`useVendor`) and d3-zoom writes the zoom `<g>`'s transform.
As on main, a move or a link hover redraws the chart only until the parent's width is first measured; after
that the legend counts the move and the next width change draws it.

```tsx
<NetworkView spec={{ theme: "dark", ratio: m.ratio, nodes: m.nodes, links: m.links, groups: m.groups, hubs: m.hubs, legend: true }} />
```

### EChart({ option, height, className, renderer })

An ECharts chart at the site's type sizes and colours, as `echart()`: the theme from the tokens, an item
tooltip, overlapping labels hidden, a resize with its host. `height` is 360 by default, `className`
`"kit-echart"`, `renderer` `"svg"` (as `kit.js` initialises it). The host div appears once ECharts has loaded;
if the load fails, the chart is left out and one error is logged, and what surrounds it stays.

```tsx
<EChart option={{ xAxis: { type: "category", data: words }, yAxis: { type: "value" }, series: [{ type: "bar", data: counts }] }} height={280} />
```

### palette(tokens)

The five series colours in order, as `palette()`, from the values `useTokens(PALETTE)` read (`PALETTE` from
`@/kit/palette`); null until they are read.

```tsx
const colours = palette(useTokens(PALETTE));
```

## Figures and tables

### Figure({ chart, caption, data, label })

A chart, its caption and its numbers, as `figure()`: `chart` in `div.kit-stage`, the caption, and `data` (a
`Table` spec) in a closed drawer labelled `label` ("Table: the numbers behind the figure" by default).

```tsx
<Figure
  chart={<EChart option={option} height={280} />}
  caption="Each bar is one word; taller bars are more frequent."
  data={{ columns: [{ key: "word", label: "Word" }, { key: "count", label: "Count", num: true }], rows }}
/>
```

### Table({ columns, rows, caption })

A plain table, as `table()`: `columns` is `[{ key, label, num }]`, `rows` objects keyed by column; numbers are
written the en-GB way and `num: true` right-aligns the column. Rendered through `DecoratedTable`, so numeric
columns get Week 4's bars and meters.

```tsx
<Table caption="Toy table" columns={[{ key: "word", label: "Word" }, { key: "count", label: "Count", num: true }]} rows={rows} />
```

### DecoratedTable({ caption, head, rows, rxBars, className, id })

A table with the classes and bars `decorate()` (`week04-tables.js`) would give it, worked out by
`decorationFor()` from the cells' text. `head` is `[{ text, className, scope }]`; each row is an array of cells,
a cell being its text or `{ text, tag, className, children }` (`children` replaces the text as the cell's
content; `tag: "th"` for a row header). `rxBars` is the table's `data-rx-bars`. The table is marked as React's
(`useOwnedRef`), so the old pages' table sweeps leave it alone.

```tsx
<DecoratedTable
  head={[{ text: "Firm" }, { text: "Filings" }]}
  rows={[["Infosys", "12,410"], ["Cognizant", "9,830"]]}
/>
```

## Text evidence

### Concordance({ rows, caption })

A concordance (key word in context), as `concordance()`: one row per hit, `rows`
`[{ page, left, hit, right, extra }]` with `page` a node id linked to Wikipedia and `extra`, cells appended after
the right context (Week 5's verdict cells).

```tsx
<Concordance rows={[{ page: "Thor_(Marvel_Comics)", left: "… before ", hit: "power", right: " after …" }]} caption="Power in context" />
```

### Passage({ page, text, highlight })

A quoted passage from one page, as `passage()`, with every occurrence of `highlight` marked.

```tsx
<Passage page="Thor_(Marvel_Comics)" text="…" highlight="power" />
```

### wikiLink(page)

A link to a node's English Wikipedia article, labelled with its title, as `wikiLink()`. A function that
returns the element.

```tsx
<td>{wikiLink("Storm_(Marvel_Comics)")}</td>
```

### TermText({ text, phrase, definition, id })

Script-built text with one glossary term, as `termify()` places it: the first `phrase` in `text` becomes a
`<Term>` with `definition` in its pop-up and `id` on the pop-up. The server and the first client render show
the text plain; the term follows once hydrated. Server prose takes `TermProse` instead
(`src/components/post/`).

```tsx
<p><TermText text="A hapax is a word that occurs once." phrase="hapax" definition="A type observed exactly once in the corpus." id="kit-term-hapax" /></p>
```

## Tooltips

### TipBox({ host, tip })

A chart tooltip inside its host, as `tipBox()`: `div.kit-tip`, hidden while `tip` is null, the first line
bold, placed beside the pointer and kept inside the host. Hiding keeps the last lines and position. `host` is
the host's ref; the host carries the `kit-tip-host` class.

```tsx
<TipBox host={hostRef} tip={hover ? { lines: [name, detail], x: hover.clientX, y: hover.clientY } : null} />
```

### HoverTipHost({ as, className, tip, redraws, ...props })

A chart host with instant tooltips, as `hoverTips()` leaves it: the `kit-tip-host` class, its own `TipBox`,
`data-tip` and `aria-label` on every kit chart mark inside it in place of a `<title>`, `kit-hot` on the mark
under the pointer (a mark that was hot keeps an empty class). The tip div sits where main's history puts it
(KB07): before the chart (`tip="first"`, the default, for a host `hoverTips()` found empty and a chart then
appended to), out of the host (`tip="none"`, for a host whose draw emptied it) until a hover puts it last.
Changing `redraws` stands for a redraw that empties the host: the chart is drawn anew and the tip leaves until
the next hover. The other props go to the host element (a div unless `as` says otherwise). The kit page has no
demo of it; Week 5's frame batch (W5-1) accepts it against `scripts/parity/fixtures/hovertips/week05.json`.

```tsx
<HoverTipHost id="chart-hero-fame" className="w5-hero-plot" role="img" aria-label="…" tip="none">
  <StripChart rows={rows} opts={opts} />
</HoverTipHost>
```
