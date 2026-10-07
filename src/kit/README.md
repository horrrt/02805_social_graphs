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

### SweepCurve({ points, current, refLine, xLabel, yLabel, domain, fmt })

A small line chart of `points` (`[x, y]`), a dashed reference line `refLine: { y, label }` and a marker on the
curve at `current`. `domain` is `{ x: [lo, hi], y: [lo, hi] }`, each worked out from the data when left out;
`fmt` writes the ticks.

```tsx
<SweepCurve points={[[0, 2], [50, 3.6], [100, 4]]} current={100} refLine={{ y: 0.3, label: "ten random pages" }} xLabel="names kept (%)" yLabel="linked neighbours" />
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

## Networks

Pieces for the network weeks: a canvas network for graphs too big for SVG marks, a player that steps a process,
a row of readouts, additions to `NetworkView`, and the models and measures they run on. No fetching inside; toy
and textbook graphs on `/styleguide/kit/`. Styles: the "Kit: networks" section of `post.css`.

### graph-core.js

DOM-free and seeded, in `src/kit/graph-core.js`, tested against networkx by `tests/graph-core.test.mjs`. Import
it as `@/kit/graph-core`. Nodes are `0 … n − 1`, edges `[a, b]` (or `[a, b, w]` where a weight is allowed).

- Randomness: `mulberry32(seed)` returns an rng on [0, 1); every random function takes one, so a seed repeats.
- Models: `gnp(n, p, rng)`, `gnm(n, m, rng)`; `ba(n, m, { alpha }, rng)` (attachment Π ∝ k^α; `born[i]` is
  the step that added edge `i`), stepped with `baInit(m, alpha)` and `baStep(state, rng)`; `ringLattice(n, k)`,
  `wattsStrogatz(n, k, q, rng)` (`rewired[i]` flags a moved edge; the moved set grows with q under one seed),
  `ringPlusShortcuts(n, k, s, rng)` (the graph at s + 1 adds one link to the graph at s),
  `plantedClique(n, p, k, rng)`, `degreePreservingSwaps(edges, nSwaps, rng)`.
- Search and structure: `toAdj(n, edges, directed)`, `bfsLayers(adj, src, "any" | "out" | "in")` (`dist`,
  `parent`, `layers`), `components(n, edges)` (numbered largest first), `giant(n, edges)`, `degrees`.
- Centrality, as networkx computes it: `degreeCentrality`, `closeness` (Wasserman–Faust), `harmonic`,
  `betweenness` and `edgeBetweenness` (Brandes, normalised unless the third argument is false), `eigenvector`
  (unit length), `pagerank(n, edges, { alpha, directed })` (dangling rank spread over every node).
- Clustering: `localClustering`, `transitivity`.
- Communities: `modularity(edges, partition)`; Louvain as a stepper, `louvainInit(edges, { rng })` then
  `stepMove` (until one node moves), `sweep` (the rest of a pass), `aggregate` (collapse the communities),
  `louvainPartition(state)`, with `state.q`, `state.phase` and `state.last` (the four also as
  `louvainStepper.init/stepMove/sweep/aggregate`); or `louvain(edges, rng)` at once;
  `labelPropagation(n, edges, rng)`.
- Layouts in the unit square: `circleLayout(n)`, `forceLayout(n, edges, { iterations, init, rng })`.

```tsx
const { edges, rewired } = wattsStrogatz(30, 4, 0.1, mulberry32(3));
```

### NetworkView additions

`NetworkView` takes `onNodeClick(id)`, which makes each node a button (Enter or Space picks it), and these spec
options, each off unless set, so every existing view draws as before: `directed` (arrowheads), a node's `state`
(`"ghost"`, `"picked"`, `"new"` or `"ring"`), a node's `value` sizing it within the radius range `scale` (set
before layout, so labels and rings clear the disc) and, with `color: "sequential"`, shading it on a ramp of the
site's blues; `layout: "circle"` (or `"fixed"`, the nodes' own x and y), and `highlightLinks: [[a, b], …]`. A
value does nothing without `scale` or `color`. Values and states are read from the spec on every render.

```tsx
<NetworkView spec={{ ratio: 0.8, layout: "circle", nodes, links, highlightLinks: moved }} onNodeClick={pick} />
```

### NetCanvas({ nodes, links, positions, layout, color, directed, linkWidth, onNodeClick, tooltip, aria })

A network painted on a canvas, for 200 to 2,000 nodes, at its parent's width and the device's pixel ratio. Nodes:
`{ id, x, y, r, value, group, state, label }` (x and y in the unit square; without them, a circle); links:
`{ s, t, w, highlight }`. `positions` maps layout names to `[x, y]` per node and `layout` picks one: a new
layout or new positions tween the nodes there (at once under reduced motion or off screen). `color` is
`"group"` (the `.gv` group colours) or `"sequential"` (by value); `value` sizes nodes within `sizes` (under
`"sequential"`, only when `sizes` is given).
`tooltip(node)` gives the hover lines, `onNodeClick(id)` follows a click; the canvas has no per-node keyboard
access, so pair a pick with a control. A line under the canvas counts the nodes, links and states (`describe`
replaces it). `height` is 360 by default; `useCanvasStage` backs the canvas at its size and pixel ratio, and the
label sits on the stage around it. `specs={[…]}` with `columns` draws small multiples, each with its `title`.

```tsx
<NetCanvas nodes={nodes} links={links} positions={{ grow: pos }} layout="grow" color="sequential" aria="…" />
```

### StepPlayer({ init, step, done, extraActions, speedMs, seed, render, label })

Step, Play/Pause, Reset, `extraActions` (`[{ label, run(state, rng) }]`) and a speed slider around
`render(state)`. `step(state, rng)` takes an rng from `mulberry32(seed)`, rebuilt by Reset, so a seed replays
the run. Space plays or pauses and → steps while focus is in the player; Play stops at `done(state)` or when the
player leaves the screen, and runs at most two steps a second under reduced motion. The counter beside the
controls counts steps and extra actions, and is announced only while paused.

```tsx
<StepPlayer seed={7} init={() => baInit(2)} step={baStep} done={(s) => s.n >= 200} render={(s) => <Readouts items={[{ label: "Nodes", value: s.n }]} />} />
```

### useStepper({ init, step, done, seed, speedMs })

StepPlayer's state without its controls: `{ state, steps, playing, done, speed, setSpeed, stepOnce, play, pause,
toggle, reset, run }`.

```tsx
const p = useStepper({ init: () => 0, step: (s) => s + 1, seed: 1 });
```

### Readouts({ items, live, label })

A row of labelled numbers, `items` `[{ label, value, sub }]`, the value large and `sub` a note under it. `live`
announces changes politely. Plain HTML; renders nothing for no items.

```tsx
<Readouts items={[{ label: "Nodes", value: "43" }, { label: "Biggest hub", value: "k = 17", sub: "node 3" }]} />
```

## Text

Pieces for the text weeks: tokens and their tags, signed contributions, search results side by side and one input
under several methods. All plain HTML that renders on the server, toy data on `/styleguide/kit/` and awkward cases
on `/styleguide/kit/states/`. Styles: the "Kit: Text" section of `post.css`.

The methods are DOM-free in `src/kit/text-core.js`, tested by `tests/text-core.test.mjs`: `tokenize` and
`tokenDetails` (letters with one inner apostrophe, optional clitic split, lowercase, punctuation and stopword
filters over a small English `STOPWORDS` list), `ngrams` (n from 1 to 3), `bioSpans` (BIO tags to entity spans; an
orphan I- opens a span), `makeRng`, `nextDistribution`, `sampleNext` and `generate` (a seeded Markov sampler over a
`{ context: { token: prob } }` table with a temperature; greedy at 0), `scoreLexicon` (a lexicon sum where a negator
flips matched words among the next three tokens, two negators cancel and . ! ? ends the reach), `tfidf`,
`tfidfVector`, `countVector` and `cosine` (tf is count over length, idf is ln(N/df)), `ppmi`, `tfMatrix`,
`tfidfMatrix`, `transformMatrix` and `nearestRow`, and `fitLogistic`, `predictLogistic` and `sigmoid` (batch
gradient descent with seeded starting weights and an L2 penalty; each feature's contribution w·x, which with the
bias sums to z).

### TaggedTokens({ tokens, spans, gram, source, label })

A row of token chips. Each token: `{ text, tag, tone, attrs }`, `tag` shown beneath the text, `tone` one of `"pos"`,
`"neg"`, `"accent"` and `"muted"`, and `attrs` (`[name, value]` pairs) making the chip a button whose pop-up lists
them on hover or focus. `spans` (`[{ start, end, label, tone }]`, `end` one past the last token) box runs of chips
under their label, as named entities; a span that overlaps an earlier one is dropped and one past the end is cut.
`gram: { n, active, onActive }` lists every n-token window, numbered, and marks the active one's chips. `source:
{ value, onChange, label }` adds a textarea above that holds the raw string (R21).

```tsx
<TaggedTokens tokens={[{ text: "Iron", tag: "PER", tone: "accent" }, { text: "Man", tag: "PER", tone: "accent" }, { text: "met", tag: "O" }]} spans={[{ start: 0, end: 2, label: "PER: Iron Man" }]} />
```

### ContributionBars({ items, total, ends, max, fmt })

Signed bars from a zero line in the middle, one per item (`[{ key, label, value, valueLabel }]`): negative to the
left in `--bad`, positive to the right in `--good`, on one scale (`max`, or the largest magnitude). Under them a
gauge between the two `ends` labels: with `total: { mode: "sum" }` the plain sum, with `{ mode: "sigmoid", bias }`
the sum plus the bias through the logistic function, read as a probability. A value that is not a number counts as
0; `fmt` writes the values.

```tsx
<ContributionBars items={[{ key: "great", label: "great", value: 1.1 }, { key: "boring", label: "boring", value: -0.6 }]} total={{ mode: "sigmoid", bias: -0.1 }} ends={["negative", "positive"]} />
```

### RankedResults({ columns, query, limit })

One column per engine, side by side: `columns` is `[{ key, title, sub, results, empty }]`, each result
`{ key, title, snippet, score, scoreLabel }`, the first `limit` (6) shown with a score bar on the column's own scale.
Hovering or focusing a result marks the same key in every column. `query: { value, onChange, label, presets,
onSubmit }` adds a search input that holds the raw string and a button per preset query.

```tsx
<RankedResults query={{ value: q, onChange: setQ, presets: ["mutant school"] }} columns={[{ key: "tfidf", title: "TF-IDF", results: [{ key: "d1", title: "Toy hero A", snippet: "…", score: 0.41 }] }]} />
```

### MethodCompare({ cards, facts })

One input under several methods, a card each side by side: `cards` is `[{ key, title, blurb, body, note, accent }]`,
titles numbered, `body` any content (say a `ContributionBars`), and `accent` the colour of the rule across the top
(a token such as `"--access"` or any CSS colour; by default `--access`, `--good`, `--w4-group-0`, `--people` in
turn). `facts` (`[label, value]` pairs) run in a row under the cards.

```tsx
<MethodCompare cards={[{ key: "lexicon", title: "Lexicon", blurb: "Each word adds its fixed score.", body: <ContributionBars items={items} />, note: "Ignores word order." }]} facts={[["Same input", "one sentence"]]} />
```

### CountMatrix and AxisMap: new options

`CountMatrix` takes `transform`: `"count"` (the default, as before), `"ppmi"` (max(0, log2 P(w,c) / P(w)P(c))),
`"tf"` or `"tfidf"` (rows read as documents), computed from the counts by `text-core.js` and written to two
decimals; zeros stay 0. `nearest` adds a line naming the row closest to the highlighted one by cosine over the
shown values.

`AxisMap` takes `log` (both axes on a log scale over whole decades; points at or below 0 are left out and counted),
`diagonal` (a dashed y = x, with both axes sharing one range on log axes), `sides: { above, below, similar, band }`
(points coloured `--access` above the diagonal, `--people` below and grey within `band` of it, in place of the
groups, with a legend of counts), `selected` (one key ringed and labelled) and `detail` (content under the map,
such as the picked point's numbers).

```tsx
<CountMatrix rows={rows} cols={cols} cells={cells} highlightRow={0} transform="ppmi" nearest />
<AxisMap points={rates} axes={axes} log diagonal sides={{ above: "more in A", below: "more in B", band: 0.15 }} selected={picked} onPick={setPicked} detail={<p>…</p>} />
```

## Distributions and nulls

Four pieces for degree distributions and null models, with toy data on `/styleguide/kit/`. The numbers under
them live in `src/kit/dist-core.js`, DOM-free and tested by `tests/dist-core.test.mjs`: `degrees` (in, out or
undirected, from an edge list), `rawPk`, `binnedPk` (one bin per k below 8, then doubling bins), `ccdf`,
`poisson` and `poissonCurve`, `powerLaw`, `exponential`, `lognormalFit`, `zipfIdeal`, `rankFrequency` (with tie
levels), `envelope` (median and 5–95% per x across runs), `histogram`, `nullStats` (mean, sd, z, empirical p
with the +1 correction) and `verdict`. Import them from `@/kit/dist-core.js`. Styles: the "Kit: distributions
and nulls" section of `post.css`.

### DistributionPlot({ series, refs, envelopes, views, defaultView, scale, scaleToggle, xLabel, yLabel, top, height, aria })

A distribution on the kit's `EChart`. Each of `series` is `{ key, name, ks, points, style, color }`: raw values
`ks` (say degrees) are drawn in the view the reader picks, raw, binned or CCDF; `points` (`[x, y]`) are drawn as
given in every view; `style` is `"dots"` (the default) or `"line"`. `refs` (`[{ key, name, points, color }]`,
dashed) and `envelopes` (`[{ key, name, rows: [{ x, median, lo, hi }], color }]`, a median line over a shaded
band) are arrays or functions of the view. `scale` sets the starting axes (`{ x: "log", y: "log" }` by
default); `scaleToggle` shows one linear/log–log toggle (`"joint"`), one per axis (`"split"`) or none. Points
at 0 are left off a log axis and a note counts them. `top: { title, items: [{ label, value }] }` adds a ranked
list beside the plot. Toggles are `SegmentedControl`s.

```tsx
<DistributionPlot series={[{ key: "in", name: "in-degree", ks }]} refs={(view) => poissonRef(ks, view)} top={{ title: "The tail", items }} aria="In-degrees against a Poisson" />
```

### NullHistogram({ samples, real, xLabel, normalOverlay, step, bins, realLabel, fmt })

A permutation test as it grows: the first `step` of `samples` as a histogram, a fixed line at `real`, an
optional normal curve with the same mean and sd, and readouts of the samples shown, null mean ± sd, z and the
one- and two-sided empirical p. The x axis comes from every sample, so it holds still as `step` grows; a real
value far beyond the samples stands at the edge with an arrow.

```tsx
<NullHistogram samples={shuffled} real={0.32} step={shown} normalOverlay xLabel="average clustering" />
```

### NullBoard({ measures, models, cells, alpha, fmt, caption })

The survivor board: a small histogram per measure × null model with the real value's line, the panel's title
naming its verdict and tinted by it (survives, dies, fixed by construction), and a table of the numbers under
the grid. `measures` and `models` are `[{ key, label }]`; each of `cells` is `{ measure, model, samples, real,
verdict }`, the verdict worked out by `verdict()` at `alpha` (0.05, two-sided) unless given. Hovering or focusing
a panel highlights its row; hovering a row highlights its panel.

```tsx
<NullBoard measures={[{ key: "C", label: "Clustering" }]} models={[{ key: "gnm", label: "G(n, m)" }]} cells={[{ measure: "C", model: "gnm", samples, real: 0.32 }]} />
```

### NullBars({ rows, xLabel, fmt })

Observed values against a null, one row per category: a bar for `observed`, the null mean with whiskers to
±2 sd and z at the right, bold once |z| ≥ 2. Each row: `{ key, label, observed, samples }` or `{ key, label,
observed, mean, sd }`. Long labels are cut with an ellipsis and keep their full text as a tooltip.

```tsx
<NullBars rows={[{ key: "hv", label: "hero – villain", observed: 268, mean: 301, sd: 13 }]} xLabel="links" />
```
