# Log–Log Legends kit: how to build with it

These are the React components of the Log–Log Legends course site (DTU 02805, Social Graphs and
Interactions). The site writes up network analyses: a result against its random baseline, networks
coloured by community, tables of counts, and quoted text evidence. Every component is on
`window.LogLogKit`.

## Wrap the page in CorridorRoot

`CorridorRoot` adds the `corridor` class to `<body>`. Without it the colour tokens, which live on
`.corridor`, are undefined: text falls back to browser defaults and the charts draw without colours
(they read the tokens from `<body>`). Use it once, at the top, in one of two forms:

- `<CorridorRoot>`: a single section or a few components. It renders `<main class="shell">`, the
  centred 1180px column; tables get their white-card style only inside `<main>`.
- `<CorridorRoot page>`: a whole post. It renders its children as they are, and you lay the page
  out as the site does:

```tsx
<CorridorRoot page>
  <SkipLink />
  <PostTopbar root="../../" siteLink navLabel="Sections of this post"
    links={[{ href: "#opening", label: "Opening" }, { href: "#relations", label: "1" }]} />
  <main id="main">
    <PostHero id="hero" eyebrow="…" title="…" body={…} caution={…} stats={<HeroStat value="303" label="pages" />} />
    <div className="shell">
      <FindingsStrip id="findings" label="…" caps="Seven sections, seven findings" real="the real network">
        <FindingRow num="1" title="…" finding="1" href="#relations" link="Section 1">…</FindingRow>
      </FindingsStrip>
      <PostSection id="relations">
        <SectionOpener num="1" title="Turn links into relationships">…</SectionOpener>
        <QuestionCard section="relations" num="1A" question="…" answer="…" did="…" surprise="…"
          figure={<StripChart … />} layout="below">
          <Drawers variant="foot"><Drawer label="Method">…</Drawer></Drawers>
        </QuestionCard>
      </PostSection>
      <ClosingCard takeaway="…" limit="…" next="…" />
    </div>
  </main>
  <SiteFooter>…</SiteFooter>
</CorridorRoot>
```

`SectionRail` (the dot rail beside the sections) shows only on screens 1240px wide or more. Drawers
start closed. Charts draw after mount and fit their parent's width, so give them a parent with a real
width, never one that shrinks to fit its content.

## Styling: the site's own classes and tokens

Lay out with the site's classes and `var(--*)` tokens. Don't add a utility framework or new colours.

| Use | Name |
| --- | --- |
| Section of a post | `<section className="step">`, with an `<h2>` title |
| White panel | `className="card"` (border, radius, shadow, 20px/22px padding) |
| Card title and the line under it | `<h3>` then `<p className="sub">`, both direct children of `.card` (`.card > p.sub`; it has no style elsewhere) |
| Mini chart and its note | `<div className="w4-mini"><MiniStrip …/><small>…</small></div>` |
| Ink, quieter ink, faint ink | `--ink`, `--ink-soft`, `--ink-mute` |
| Page ground, card, rules | `--ground`, `--card`, `--line`, `--line-soft` |
| Accent, good and bad | `--accent`, `--good`, `--bad`, `--gain`, `--loss` |
| Community colours | `--group-0` … `--group-7`, `--group-none` (text on them: `--on-group-N`) |
| Type sizes | `--fs-display` 54, `--fs-h2` 30, `--fs-h3` 22, `--fs-h4` 20, `--fs-lead` 18, `--fs-strong` 16, `--fs-body` 13.5, `--fs-small` 12.5, `--fs-caption` 11.5 (px) |
| Fonts | `--font-sans` (system UI), `--font-display` (Barlow Condensed 800, for big numbers and titles), `--font-mono` |

Take every font size from the `--fs-*` tokens. The site has no other sizes.

## Which component for what

- Page parts: `PostTopbar`, `PostHero` (with `HeroStat`s), `FindingsStrip` of `FindingRow`s,
  `SectionRail`, `PostSection` > `SectionOpener` + `QuestionCard`s, `ClosingCard`, `SiteFooter`.
  A section's question goes in `QuestionCard` (`layout="beside"` puts the figure in the right column,
  `"below"` under the text); method and extra numbers go in `Drawers` > `Drawer`, never on the card
  face. `Notice` for one caution, `Card` for a plain card, `Term` for a glossary word.

- A result against a random baseline: `StripChart` (several rows, with an axis) or `MiniStrip` (one row,
  no axis). Wrap a chart in `HoverTipHost` to get instant tooltips from each row's `realTip`/`baseTip`.
- A network: `NetworkView` with pre-laid-out nodes (`x`, `y` in 0–1, `group`) and `links`.
  `theme: "dark"` for the dark card.
- Any other chart: `EChart` with an ECharts option; the theme comes from the tokens.
- A chart with its caption and the numbers behind it: `Figure` (`chart`, `caption`, `data`).
- Tables: `Table` (columns and row objects; `num: true` right-aligns and adds bars) or
  `DecoratedTable` (cells as text).
- Text evidence: `Concordance` (key word in context), `Passage` (quote with highlights), `TermText`
  (one glossary term with a pop-up). `page` is an English Wikipedia page id such as
  `"Thor_(Marvel_Comics)"`.

Each component's `.prompt.md` has its full props, and its `.d.ts` has the types. Before styling, read
`styles.css` and `_ds_bundle.css`, which is the site's `type.css`, `corridor.css` and `post.css`.

## Example

```tsx
const { CorridorRoot, StripChart, Table } = window.LogLogKit;

<CorridorRoot>
  <section className="step">
    <h2>Do enemies cross community lines?</h2>
    <div className="card">
      <h3>Enemy links against shuffled labels</h3>
      <p className="sub">Enemy links cross communities more often than shuffled labels would make them.</p>
      <StripChart
        rows={[{ label: "Enemy links across communities", real: 0.54, realLabel: "54%",
                 base: [0.42, 0.028], baseLabel: "shuffled labels 42%" }]}
        opts={{ domain: [0, 1], ticks: [0, 0.5, 1], fmt: (v) => v.toFixed(1),
                aria: "Enemy link share against shuffled labels" }}
      />
    </div>
    <Table caption="Links by kind"
      columns={[{ key: "kind", label: "Kind" }, { key: "links", label: "Links", num: true }]}
      rows={[{ kind: "Teammate", links: 217 }, { kind: "Enemy", links: 202 }, { kind: "Family", links: 116 }]} />
  </section>
</CorridorRoot>
```
