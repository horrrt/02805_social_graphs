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

### EChart({ option, height, className, renderer, onEvents })

An ECharts chart at the site's type sizes and colours, as `echart()`: the theme from the tokens, an item
tooltip, overlapping labels hidden, a resize with its host. `height` is 360 by default, `className`
`"kit-echart"`, `renderer` `"svg"` (as `kit.js` initialises it). `onEvents` maps ECharts event names to
handlers (`{ click: (p) => … }`), bound once the chart exists; keep its identity stable. The host div appears once ECharts has loaded;
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

## Text explorables

Prop-driven pieces for the language weeks: no fetching inside, toy data on `/styleguide/kit/`. The SVG ones
(`VectorAngle`, `SweepCurve`, `AnalogyPlot`) draw after hydration from the type scale and tokens, at their
parent's width; the rest are plain HTML that renders on the server. Styles: the "Kit: text explorables"
section of `post.css`.

### VectorAngle({ a, b, labels, scaleB, onScaleB })

Two vectors from the origin on equal-unit axes, the angle θ as an arc, and the cosine, angle and B's length as
readouts. `a` and `b` are `[x, y]`, `labels` `{ a, b }`. With `onScaleB(k)` a slider scales B from 0.25× to
3×: the arrow grows, the cosine stays.

```tsx
<VectorAngle a={[4, 1]} b={[1, 3]} labels={{ a: "D1", b: "D2" }} scaleB={k} onScaleB={setK} />
```

### SplitBars({ rows, parts, max, onPick })

Ranked rows, each a bar split into `parts` (`[{ name, color }]`, a colour token such as `"--people"` or any CSS
colour), the value at the right and an optional status pill, with a legend under. Each row:
`{ key, label, sub, parts: number[], value, valueLabel, status: { text, tone: "good" | "bad" } }`. Bars share
`max` (the largest row total by default). With `onPick(key)` the labels are buttons.

```tsx
<SplitBars rows={[{ key: "torch", label: "Human Torch", parts: [0.25, 0.02, 0.05], value: 0.32, valueLabel: "0.32", status: { text: "not linked", tone: "bad" } }]} parts={[{ name: "names", color: "--people" }, { name: "habit words", color: "--w4-group-0" }, { name: "everything else", color: "--access" }]} />
```

### SweepCurve({ points, current, ref, xLabel, yLabel, domain, fmt })

A small line chart of `points` (`[x, y]`), a dashed reference line `ref: { y, label }` and a marker on the
curve at `current`. `domain` is `{ x: [lo, hi], y: [lo, hi] }`, each worked out from the data when left out;
`fmt` writes the ticks.

```tsx
<SweepCurve points={[[0, 2], [50, 3.6], [100, 4]]} current={100} ref={{ y: 0.3, label: "ten random pages" }} xLabel="names kept (%)" yLabel="linked neighbours" />
```

### TokenWindow({ tokens, centre, window, onCentre, negatives, mode })

A sentence's tokens as chips, the centre word highlighted, its context (`window` tokens either side) tinted,
the rest muted; then the positive pairs (skip-gram: centre → each context word; `mode: "cbow"`: the context →
the centre) beside the negative pairs, centre × each of `negatives`. With `onCentre(i)` the chips are buttons.

```tsx
<TokenWindow tokens={["the", "puppy", "chased", "the", "ball"]} centre={2} window={2} negatives={["cloud", "budget"]} mode="skipgram" />
```

### CountMatrix({ rows, cols, cells, highlightRow, onRow, caption })

A word-context count table: `cells[i][j]` is how often `cols[j]` appears near `rows[i]`. Cells are tinted by
count, zeros muted; the highlighted row is written out under the table as `word = [..]`. With `onRow(i)` the
row heads are buttons.

```tsx
<CountMatrix rows={["wine", "bourbon"]} cols={["bottle", "corn"]} cells={[[1, 0], [0, 1]]} highlightRow={0} caption="Counts within ±2 words" />
```

### MixtureBar({ parts, focus, onFocus, words })

A 100% bar of `parts` (`[{ label, share, color }]`, shares normalised to sum to 1), a card per part, and for
the part named `focus`, bars for `words` (`[word, probability]`). With `onFocus(label)` the cards are buttons.

```tsx
<MixtureBar parts={[{ label: "Crime", share: 0.78 }, { label: "Space", share: 0.22 }]} focus="Crime" words={[["crime", 0.16], ["gang", 0.14]]} />
```

### RankedBars({ rows, colHeads, title, labelHead })

A numbered ranking: label, a bar on one scale, the optional `valueLabel` and extra columns `cols` headed by
`colHeads`. Each row: `{ key, label, value, valueLabel, cols, muted, onClick }`; a muted row greys its bar, a
row with `onClick` gets a button. `labelHead` heads the label column ("Word" by default).

```tsx
<RankedBars title="Most distinctive words" colHeads={["On page", "Pages with it"]} rows={[{ key: "claws", label: "claws", value: 0.12, cols: ["17×", "26 of 303"] }]} />
```

### AxisMap({ points, axes, highlight, find, onPick, height })

A scatter on the kit's `EChart` with the four axis ends named at the sides. `points`:
`[{ key, label, x, y, size, group }]` (dot area from `size`, one colour per `group`); `axes`:
`{ left, right, bottom, top }`. Keys in `highlight` and labels containing `find` are labelled, the `find`
matches enlarged. `onPick(key)` follows a click on a point.

```tsx
<AxisMap points={points} axes={{ left: "science", right: "magic", bottom: "street", top: "cosmic" }} highlight={["strange"]} find="storm" />
```

### AnalogyPlot({ points, step })

Word arithmetic in three steps over `points: { a, b, c, d }`, each `{ label, x, y }`: step 0 the four words,
step 1 the offset a→b drawn again from c, step 2 where c + (b − a) lands and its nearest real word d. The
expression "c − a + b ≈ d" above the plot is built from the labels, with "?" for d before step 2.

```tsx
<AnalogyPlot points={{ a: { label: "man", x: 1, y: 1 }, b: { label: "woman", x: 1, y: 3 }, c: { label: "king", x: 4, y: 1 }, d: { label: "queen", x: 4.2, y: 3.1 } }} step={2} />
```

### GuessRanker({ items, score, target, budget, banned })

A describe-without-naming round: the reader types one word at a time, `score(words)` returns each item's
score (a Map or an object keyed by item key), and the live top ten shows where the `target` stands. Words
spent show as chips (a word `banned(word)` rejects is struck through and still costs one) beside an
"n / budget" counter; the round is won when the target ranks first on its own. The rules (`start`,
`addWord`, `ranking`, `isWin`, `points`) are DOM-free in `src/kit/guess-core.js`, tested by
`tests/guess-core.test.mjs`.

```tsx
<GuessRanker items={[{ key: "wolverine", label: "Wolverine" }]} score={scoreWords} target="wolverine" budget={8} banned={(w) => w === "logan"} />
```
