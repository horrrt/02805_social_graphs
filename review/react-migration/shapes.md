# Markup shapes (P3)

Every occurrence of each shared server shape on every built page of main at `08501e3`, the variants it comes in, and
the props of the `src/components/site/` and `src/components/post/` component that renders it. Week prep batches read
this file to apply the components; a variant marked page-local gets a component in `src/components/<week>/` or the
page's feature folder, never an edit to `site/` or `post/` (plan.json, architecture 1a).

## How it was surveyed

A scratch script (not committed) parsed each page's `index.html` from
`node scripts/parity/build-ref.mjs --ref 08501e3 --print-out` with linkedom, after dropping Next's own scripts but
keeping React's `<!-- -->` text markers, and matched each shape's selector. In the skeletons below a tag lists its
attributes in document order (values only for class, role, aria-hidden, type, name, href, aria-label, data-owner,
open and hidden), `T` is text, `␣` is a whitespace-only text node (the JSX `{" "}`), `|` is a `<!-- -->` marker
between two text nodes, and `…` is content below the shape's depth. Locators name the element's own id or its
nearest ancestor with one, then its title, summary or bold lead.

## Rules every component keeps

- Server components: no `'use client'`, no hooks, no `useId`, no `url()`, `asset()` or `SITE`; usable from server
  and client components. Ids are explicit props.
- Attributes in the order the old JSX wrote them: class first everywhere below except where a variant says otherwise
  (the style guide's nav: `ariaFirst`).
- Text nodes as the old JSX made them: a component writes `{" "}` exactly where the skeleton has `␣`, and leaves
  every other text to the page's children, so `<!-- -->` markers and termify's one-text-node matches stay put.
- The React payload stays as the old JSX made it: `el()` in `src/components/site/el.ts` drops undefined props and
  absent parts and spreads a `children` array among its siblings, so a page using the components ships the same
  `self.__next_f` payload (the template and kit do, byte for byte apart from chunk names).
- `owner` undefined omits `data-owner`; `""` writes it empty. `Drawer` is never open; `QaDisclosure` has no open prop (R5).
- Credit, hex and size specimen text stays the page's children (`SiteFooter`, the style guide).

## Summary

| shape | component | variants | occurrences |
| --- | --- | ---: | ---: |
| Skip link | `site/SkipLink` | 1 | 8 |
| Topbar | `site/PostTopbar, site/BrandMark` | 6 | 6 |
| Brand | `site/BrandMark` | 4 | 8 |
| Footer | `site/SiteFooter` | 9 | 13 |
| Hero | `post/PostHero, post/HeroStat` | 7 | 8 |
| Hero stat | `post/HeroStat` | 1 | 6 |
| Findings strip | `post/FindingsStrip` | 3 | 3 |
| Finding row | `post/FindingRow` | 14 | 14 |
| Post section | `post/PostSection` | 18 | 41 |
| Section opener | `post/SectionOpener` | 2 | 21 |
| Card | `post/Card, post/QuestionCard, post/ClosingCard` | 42 | 76 |
| Question header | `post/QuestionHeader` | 11 | 45 |
| Notice | `post/Notice` | 16 | 58 |
| Drawer row | `post/Drawers` | 6 | 51 |
| Drawer | `post/Drawer` | 27 | 113 |
| Plot | `post/Plot` | 25 | 53 |
| Week 4 figure | `post/W4Figure` | 4 | 31 |
| Figure row | `post/FigRow` | 2 | 12 |
| QA disclosure | `post/QaDisclosure` | 13 | 17 |
| Anatomy | `post/Anatomy` | 3 | 4 |
| How to read | `post/HowTo` | 2 | 3 |

## Components

| component | renders | props |
| --- | --- | --- |
| `site/PageShell` | `<html lang="en" suppressHydrationWarning>`, optional `<head>`, `<body>` | bodyClass, bodyProps (in order after class), head, children |
| `site/SkipLink` | `a.skip[href=#main]` Skip to content | none |
| `site/BrandMark` | `a.brand` LOG–LOG `{" "}` `<b>`LEGENDS; `mark`: `a.brand[aria-label]` > span.brand-mark + span with `<br>` | href, mark |
| `site/PostTopbar` | `div.topbar > div.shell`: BrandMark, `{" "}`, `a.site-link` All posts, children, `nav.topnav` with `{" "}` between links | root, siteLink, navLabel, links [{href, label, here}], ariaFirst, brandSpace, nav (replaces the nav), children |
| `site/SiteFooter` | `footer.foot > div.shell` | children |
| `post/PostHero` | `section.hero.w4-hero > div.shell`: p.eyebrow, h1, grid > (div.w4-hero-text: p.body, p.caution, legend, div.w4-hero-stats), children | id, eyebrow, title, gridClass (default w4-hero-grid), body, caution, legend, stats, children |
| `post/HeroStat` | `p.w4-stat > b + span` | value, label |
| `post/FindingsStrip` | `section.w4-findings[aria-label]` with the head (caps, key) and the rows | id, label, caps, real, band (default "random baseline, mean ± 1 sd"), children |
| `post/FindingRow` | `div.w4-finding`: span.w4-num, div (h3, p), empty `div.w4-mini[data-finding]`, the `<a>` a direct child | num, title, finding, href, link, children (the answer) |
| `post/PostSection` | `section.step[data-owner][id]` | id, owner, children |
| `post/SectionOpener` | `header.w4-opener`: span.w4-opener-num[aria-hidden], div (h2, p) | num, title, children |
| `post/Card` | `div[class][id][style]` | className, id, style, children |
| `post/QuestionCard` | Card > QuestionHeader `#<s>-asked`, `.w4-two` with `#<s>-did`, `#<s>-surprise`, `#<s>-figure` (beside: right column; below: `div.w5-fig` under it), children | section, className (default card w4-card w5-card), num, question, answer, did, surprise, figure, layout, children |
| `post/QuestionHeader` | `header.w4-q`: optional span.w4-num, div (h2 or p.rx-kicker, optional p.w4-answer) | id, num, question, kicker, answer, answerAttrs |
| `post/Notice` | `div.notice[id]`: span.ico, optional `{" "}`, `span[id]` (optional `<b>` headline, `{" "}`, children) | id, icon, headline, gap, bodyId, children |
| `post/Drawers` | `div.rx-drawers.rx-foot` or `.rx-inline` | variant, id, children |
| `post/Drawer` | `details.rx-drawer > summary + div.rx-drawer-body[id]` | label, bodyId, children |
| `post/Plot` | `div.plot[style]`: h3, optional p.axis-note, children | title, note, style, children |
| `post/W4Figure` | `figure.w4-figure > figcaption (b + span)`, children | title, caption, children |
| `post/FigRow` | `div.rx-fig-row` | children |
| `post/QaDisclosure` | `details[class][data-box][id][name] > summary > span.qa-cue` + `div[class][id]` | id, className (default qa), box, name, cue, bodyClass (default qa-body), bodyId, children |
| `post/Anatomy` | `div.w4-anatomy`: h3, optional p, dl of div (dt, dd, optional span tag) | className, title, intro, rows [{term, def, tag, tagClass}] |
| `post/HowTo` | `div.w4-howto`: h3, then div (i swatch, b, span) per row | title (default How to read the charts), rows [{swatch, swatchChildren, label, text}] |
| `post/ClosingCard` | `div.card.w4-card.w5-stack`: p.sub, the limit, p.sub, children | className, takeaway, limit, next, children |

`PageShell` covers every layout's `<html>`/`<body>`: body classes `corridor` (template, kit, styleguide, week03, week04,
week05), `corridor home`, `mockups`, `theme-packs guided-post visual-design`, `theme-transit guided-post visual-design`,
`signal-story` with `bodyProps={{ "data-signal-src": "../assets/data/marvel_story.json" }}` (play) and none
(screen-test); `head` carries JSON-LD, Week 1 and 2's inline js-class script, the style guide's and screen-test's
`<style>` and screen-test's font links. Layouts keep their literal stylesheet imports.

## Skip link

Selector `a.skip`, component `site/SkipLink`. 8 occurrences in 1 variant.

### skip-1: 8 × (home 1, week01 1, week02 1, week03 1, week04 1, week05 1, template 1, styleguide 1)

```html
<a class="skip" href="#main">T</a>
```

- `<SkipLink />`:
  - home: top
  - week01: top
  - week02: top
  - week03: top
  - week04: top
  - week05: top
  - template: top
  - styleguide: top

## Topbar

Selector `.topbar`, component `site/PostTopbar, site/BrandMark`. 6 occurrences in 6 variants.

### topbar-1: 1 × (home 1)

```html
<div class="topbar"><div class="shell"><a class="brand" href="./">T|␣<b>…</b></a><nav class="topnav" aria-label="Sections of this page"><a class="here" href="#weeks">…</a>␣<a href="#about">…</a></nav></div></div>
```

- `<PostTopbar root="./" navLabel="Sections of this page" links=[#weeks here, #about]>`:
  - home: top

### topbar-2: 1 × (week03 1)

```html
<div class="topbar"><div class="shell"><a class="brand" href="../../">T|␣<b>…</b></a>␣<a class="site-link" href="../../#weeks">T</a><div class="style-menu"><button aria-controls aria-expanded class="style-trigger" id type="button">…</button><div aria-label="Page style" class="style-bar" id role="group" hidden=""></div></div><nav class="topnav" aria-label="Sections of this post"><a class="here" href="#globe">…</a>␣<a href="#twin">…</a>␣<a href="#typology">…</a>␣<a href="#denmark">…</a></nav></div></div>
```

- `<PostTopbar root="../../" brandSpace siteLink navLabel="Sections of this post" links=[#globe here, #twin, #typology, #denmark]>`, children: div.style-menu:
  - week03: top

### topbar-3: 1 × (week04 1)

```html
<div class="topbar"><div class="shell"><a class="brand" href="../../">T|␣<b>…</b></a>␣<a class="site-link" href="../../#weeks">T</a><nav class="topnav" aria-label="Sections of this post"><a href="#opening">…</a>␣<a class="here" href="#place">…</a>␣<a href="#jobs">…</a>␣<a href="#who">…</a>␣<a href="#footprint">…</a>␣<a href="#beyond">…</a>␣<a href="#cut">…</a></nav></div></div>
```

- `<PostTopbar root="../../" brandSpace siteLink navLabel="Sections of this post" links=[#opening, #place here, #jobs, #who, #footprint, #beyond, #cut]>`:
  - week04: top

### topbar-4: 1 × (week05 1)

```html
<div class="topbar"><div class="shell"><a class="brand" href="../../">T|␣<b>…</b></a>␣<a class="site-link" href="../../#weeks">T</a><nav class="topnav" aria-label="Sections of this post"><a href="#opening">…</a>␣<a href="#relations">…</a>␣<a href="#copying">…</a>␣<a href="#search">…</a>␣<a href="#autocomplete">…</a>␣<a href="#heaps">…</a>␣<a href="#fame">…</a>␣<a href="#weird">…</a>␣<a href="#closing">…</a></nav></div></div>
```

- `<PostTopbar root="../../" brandSpace siteLink navLabel="Sections of this post" links=[#opening, #relations, #copying, #search, #autocomplete, #heaps, #fame, #weird, #closing]>`:
  - week05: top

### topbar-5: 1 × (template 1)

```html
<div class="topbar"><div class="shell"><a class="brand" href="../../">T|␣<b>…</b></a>␣<a class="site-link" href="../../#weeks">T</a><nav class="topnav" aria-label="Sections of this post"><a href="#opening">…</a>␣<a href="#first">…</a>␣<a href="#second">…</a>␣<a href="#closing">…</a></nav></div></div>
```

- `<PostTopbar root="../../" brandSpace siteLink navLabel="Sections of this post" links=[#opening, #first, #second, #closing]>`:
  - template: top

### topbar-6: 1 × (styleguide 1)

```html
<div class="topbar"><div class="shell"><a class="brand" href="../">T|␣<b>…</b></a>␣<a class="site-link" href="../#weeks">T</a><div class="style-menu"><button aria-controls aria-expanded class="style-trigger" id type="button">…</button><div aria-label="Page style" class="style-bar" id role="group" hidden="">…</div></div><nav aria-label="Sections of this guide" class="topnav"><a class="here" href="#tokens">…</a>␣<a href="#components">…</a>␣<a href="#skins">…</a>␣<a href="#palettes">…</a></nav></div></div>
```

- `<PostTopbar root="../" brandSpace siteLink navLabel="Sections of this guide" ariaFirst links=[#tokens here, #components, #skins, #palettes]>`, children: div.style-menu:
  - styleguide: top

## Brand

Selector `a.brand`, component `site/BrandMark`. 8 occurrences in 4 variants.

### brand-1: 1 × (home 1)

```html
<a class="brand" href="./">T|␣<b>T</b></a>
```

- `<BrandMark href="./" />`:
  - home: top

### brand-2: 4 × (week03 1, week04 1, week05 1, template 1)

```html
<a class="brand" href="../../">T|␣<b>T</b></a>
```

- `<BrandMark href="../../" />`:
  - week03: top
  - week04: top
  - week05: top
  - template: top

### brand-3: 1 × (styleguide 1)

```html
<a class="brand" href="../">T|␣<b>T</b></a>
```

- `<BrandMark href="../" />`:
  - styleguide: top

### brand-4: 2 × (mockups 1, play 1)

```html
<a class="brand" href="../" aria-label="Log-Log Legends home"><span class="brand-mark" aria-hidden="true">T</span><span>T<br></br>T</span></a>
```

- `<BrandMark href="../" mark />`:
  - mockups: top
  - play: top

## Footer

Selector `footer`, component `site/SiteFooter`. 13 occurrences in 9 variants.

### footer-1: 1 × (home 1)

```html
<footer class="foot"><div class="shell"><span>…</span>␣<a aria-label="Source code on GitHub" class="home-github" href="https://github.com/horrrt/02805_social_graphs">…</a></div></footer>
```

- `<SiteFooter>`, children: span ␣ a.home-github:
  - home: in #main "foot"

### footer-2: 2 × (week01 1, week02 1)

```html
<footer class="wrap footer"><span>T|␣<a href="https://creativecommons.org/licenses/by-sa/4.0/">…</a></span><span><a href="../../">…</a>␣|T|␣<a href="../../mockups/">…</a>␣|T|␣<a href="../../weeks/week01/">…</a>␣|T|␣<a href="../../weeks/week02/">…</a></span></footer>
```

- page-local: `footer.wrap.footer` is another shape (no div.shell):
  - week01: top "wrap footer"
  - week02: top "wrap footer"

### footer-3: 4 × (week03 1, week05 1, template 1, styleguide 1)

```html
<footer class="foot"><div class="shell"><span>…</span>␣<span>…</span></div></footer>
```

- `<SiteFooter>`, children: span ␣ span:
  - week03: in #main "foot"
  - week05: top "foot"
  - template: top "foot"
  - styleguide: in #main "foot"

### footer-4: 1 × (week04 1)

```html
<footer class="foot"><div class="shell"><span>…</span>␣<span>…</span>␣<span>…</span>␣<span>…</span></div></footer>
```

- `<SiteFooter>`, children: span ␣ span ␣ span ␣ span:
  - week04: in #main "foot"

### footer-5: 1 × (kit 1)

```html
<footer class="foot"><div class="shell"><span>…</span></div></footer>
```

- `<SiteFooter>`, children: span:
  - kit: top "foot"

### footer-6: 1 × (mockups 1)

```html
<footer class="review-foot"><p>T</p><a href="../weeks/week02/">T</a></footer>
```

- page-local: `footer.review-foot` is another shape (no div.shell):
  - mockups: in #main "review-foot"

### footer-7: 1 × (mockups 1)

```html
<footer class="viewer-foot"><p class="ux-review-note" id hidden=""></p><details class="ux-rationale" id hidden=""><summary id>…</summary><p id></p><p class="ux-sources" id></p><p class="ux-review-note" id></p></details><p id>T</p><p class="viewer-status" id role="status" aria-live aria-atomic></p><div class="copy-fallback" id hidden=""><label for>…</label><textarea id readOnly></textarea></div></footer>
```

- page-local: `footer.viewer-foot` is another shape (no div.shell):
  - mockups: in #mockup-viewer "viewer-foot"

### footer-8: 1 × (play 1)

```html
<footer class="site-foot"><div class="wide"><span>…</span><span>…</span><a href="https://github.com/horrrt/02805_social_graphs">…</a></div></footer>
```

- page-local: `footer.site-foot` is another shape (no div.shell):
  - play: top "site-foot"

### footer-9: 1 × (screen-test 1)

```html
<footer><p id></p><p class="lbl foot-links"><a href="../../weeks/week02/">…</a>␣|T|␣<a href="../../">…</a></p></footer>
```

- page-local: `footer` is another shape (no div.shell):
  - screen-test: top "footer"

## Hero

Selector `section.hero`, component `post/PostHero, post/HeroStat`. 8 occurrences in 7 variants.

### hero-1: 1 × (home 1)

```html
<section class="hero home-hero" id><div class="shell"><div class="home-hero-text"><h1>…</h1><p class="lede">…</p><p class="body">…</p><div class="home-hero-actions">…</div></div><aside aria-label="The course so far" class="home-progress"><p class="home-caps">…</p><ol class="home-track">…</ol></aside></div></section>
```

- page-local: `hero home-hero` is another hero (no .w4-hero-grid):
  - home: #top "hero home-hero"

### hero-2: 1 × (week01 1)

```html
<section class="hero story-hero"><div class="hero-copy"><div><p class="eyebrow">…</p><h1>…</h1><p class="intro">…</p><nav aria-label="This post" class="story-nav">…</nav></div><p class="story-scope">T</p><details class="post-primer"><summary>…</summary><p>…</p><dl>…</dl><a href="https://sunelehmann.com/socialgraphs2026-web/data/">…</a></details></div></section>
```

- page-local: `hero story-hero` is another hero (no .w4-hero-grid):
  - week01: in #main "hero story-hero"

### hero-3: 1 × (week02 1)

```html
<section class="hero story-hero"><div class="hero-copy"><p class="eyebrow">T</p><h1>T</h1><p class="intro">T</p><nav aria-label="This post" class="story-nav"><a class="active-step" href="#try-it">…</a><a href="#post">…</a><a href="#evidence">…</a></nav><p class="story-scope">T</p><details class="post-primer"><summary>…</summary><p>…</p><dl>…</dl><a href="https://sunelehmann.com/socialgraphs2026-web/data/">…</a></details></div></section>
```

- page-local: `hero story-hero` is another hero (no .w4-hero-grid):
  - week02: in #main "hero story-hero"

### hero-4: 1 × (week03 1)

```html
<section class="hero" id><div class="shell"><div><p class="eyebrow">…</p><h1>…</h1><p class="lede">…</p><p class="body">…</p><p class="caution">…</p><p class="body" id>…</p><div class="keys">…</div><div class="yearline">…</div></div><div class="stage-wrap"><canvas aria-label="Globe of the countries and the migration corridors between them" class="stage" height id role="img" width></canvas><p class="stage-hint">…</p></div><aside class="panel" id><h2>…</h2><div class="who">…</div><dl class="stats" id></dl><div class="corridor-list">…</div><div class="corridor-list">…</div></aside></div></section>
```

- page-local: `hero` is another hero (no .w4-hero-grid):
  - week03: #globe "hero"

### hero-5: 1 × (week04 1)

```html
<section class="hero w4-hero" id><div class="shell"><p class="eyebrow">T</p><h1>T</h1><div class="w4-hero-grid"><div class="w4-hero-text">…</div><figure class="w4-hero-stage">…</figure><aside aria-label="Selected metro" aria-live class="w4-inspector" id>…</aside></div></div></section>
```

- `<PostHero id="top" gridClass="w4-hero-grid" legend={div.rx-legend}>`, stats: 2 `<HeroStat>`, children: figure.w4-hero-stage, aside.w4-inspector:
  - week04: #top "hero w4-hero"

### hero-6: 2 × (week05 1, template 1)

```html
<section class="hero w4-hero" id><div class="shell"><p class="eyebrow">T</p><h1>T</h1><div class="w4-hero-grid w5-hero-grid"><div class="w4-hero-text">…</div><figure class="w4-hero-stage w5-hero-stage">…</figure></div></div></section>
```

- `<PostHero id="top" gridClass="w4-hero-grid w5-hero-grid">`, stats: 2 `<HeroStat>`, children: figure.w4-hero-stage:
  - week05: #top "hero w4-hero"
  - template: #top "hero w4-hero"

### hero-7: 1 × (styleguide 1)

```html
<section class="hero sg-hero" id><div class="shell"><div><p class="eyebrow">…</p><h1>…</h1><p class="lede">…</p><p class="body">…</p><p class="caution">…</p><div class="keys">…</div><div class="yearline">…</div></div><aside class="panel"><h2>…</h2><div class="who">…</div><dl class="stats">…</dl><div class="corridor-list">…</div><p class="fineprint">…</p></aside></div></section>
```

- page-local: `hero sg-hero` is another hero (no .w4-hero-grid):
  - styleguide: #hero "hero sg-hero"

## Hero stat

Selector `p.w4-stat`, component `post/HeroStat`. 6 occurrences in 1 variant.

### stat-1: 6 × (week04 2, week05 2, template 2)

```html
<p class="w4-stat"><b>T</b><span>T</span></p>
```

- `<HeroStat value label />`:
  - week04: in #top "537,796"; in #top "40"
  - week05: in #top "713,617"; in #top "1,784"
  - template: in #top "000,000"; in #top "0,000"

## Findings strip

Selector `section.w4-findings`, component `post/FindingsStrip`. 3 occurrences in 3 variants.

### findings-1: 1 × (week04 1)

```html
<section aria-label="Five findings" class="w4-findings" id><div class="w4-findings-head"><p class="w4-caps">…</p><div class="w4-key">…</div></div><div class="w4-finding"><span class="w4-num">…</span><div>…</div><div class="w4-mini" data-finding></div><a href="#place">…</a></div><div class="w4-finding"><span class="w4-num">…</span><div>…</div><div class="w4-mini" data-finding></div><a href="#jobs">…</a></div><div class="w4-finding"><span class="w4-num">…</span><div>…</div><div class="w4-mini" data-finding></div><a href="#who">…</a></div><div class="w4-finding"><span class="w4-num">…</span><div>…</div><div class="w4-mini" data-finding></div><a href="#footprint">…</a></div><div class="w4-finding"><span class="w4-num">…</span><div>…</div><div class="w4-mini" data-finding></div><a href="#beyond">…</a></div></section>
```

- `<FindingsStrip id="findings" label="Five findings" caps real="the real network">`, 5 rows:
  - week04: #findings

### findings-2: 1 × (week05 1)

```html
<section aria-label="Seven findings" class="w4-findings" id><div class="w4-findings-head"><p class="w4-caps">…</p><div class="w4-key">…</div></div><div class="w4-finding"><span class="w4-num">…</span><div>…</div><div class="w4-mini" data-finding></div><a href="#relations">…</a></div><div class="w4-finding"><span class="w4-num">…</span><div>…</div><div class="w4-mini" data-finding></div><a href="#copying">…</a></div><div class="w4-finding"><span class="w4-num">…</span><div>…</div><div class="w4-mini" data-finding></div><a href="#search">…</a></div><div class="w4-finding"><span class="w4-num">…</span><div>…</div><div class="w4-mini" data-finding></div><a href="#autocomplete">…</a></div><div class="w4-finding"><span class="w4-num">…</span><div>…</div><div class="w4-mini" data-finding></div><a href="#heaps">…</a></div><div class="w4-finding"><span class="w4-num">…</span><div>…</div><div class="w4-mini" data-finding></div><a href="#fame">…</a></div><div class="w4-finding"><span class="w4-num">…</span><div>…</div><div class="w4-mini" data-finding></div><a href="#weird">…</a></div></section>
```

- `<FindingsStrip id="findings" label="Seven findings" caps real="the real pages">`, 7 rows:
  - week05: #findings

### findings-3: 1 × (template 1)

```html
<section aria-label="Findings" class="w4-findings" id><div class="w4-findings-head"><p class="w4-caps">…</p><div class="w4-key">…</div></div><div class="w4-finding"><span class="w4-num">…</span><div>…</div><div class="w4-mini" data-finding></div><a href="#first">…</a></div><div class="w4-finding"><span class="w4-num">…</span><div>…</div><div class="w4-mini" data-finding></div><a href="#second">…</a></div></section>
```

- `<FindingsStrip id="findings" label="Findings" caps real="the real data">`, 2 rows:
  - template: #findings

## Finding row

Selector `div.w4-finding`, component `post/FindingRow`. 14 occurrences in 14 variants.

### finding-1: 1 × (week04 1)

```html
<div class="w4-finding"><span class="w4-num">T</span><div><h3>T</h3><p>T</p></div><div class="w4-mini" data-finding></div><a href="#place">T</a></div>
```

- `<FindingRow num="1" finding="1" href="#place">`:
  - week04: in #findings "Where the hiring is"

### finding-2: 1 × (week04 1)

```html
<div class="w4-finding"><span class="w4-num">T</span><div><h3>T</h3><p>T</p></div><div class="w4-mini" data-finding></div><a href="#jobs">T</a></div>
```

- `<FindingRow num="2" finding="2" href="#jobs">`:
  - week04: in #findings "Which jobs go together"

### finding-3: 1 × (week04 1)

```html
<div class="w4-finding"><span class="w4-num">T</span><div><h3>T</h3><p>T|␣<span class="w4-term">…</span>␣|T</p></div><div class="w4-mini" data-finding></div><a href="#who">T</a></div>
```

- `<FindingRow num="3" finding="3" href="#who">`:
  - week04: in #findings "Who staffs whom"

### finding-4: 1 × (week04 1)

```html
<div class="w4-finding"><span class="w4-num">T</span><div><h3>T</h3><p>T</p></div><div class="w4-mini" data-finding></div><a href="#footprint">T</a></div>
```

- `<FindingRow num="4" finding="4" href="#footprint">`:
  - week04: in #findings "Without the biggest firms"

### finding-5: 1 × (week04 1)

```html
<div class="w4-finding"><span class="w4-num">T</span><div><h3>T</h3><p>T</p></div><div class="w4-mini" data-finding></div><a href="#beyond">T</a></div>
```

- `<FindingRow num="5" finding="5" href="#beyond">`:
  - week04: in #findings "Beyond the three networks"

### finding-6: 1 × (week05 1)

```html
<div class="w4-finding"><span class="w4-num">T</span><div><h3>T</h3><p>T</p></div><div class="w4-mini" data-finding></div><a href="#relations">T</a></div>
```

- `<FindingRow num="1" finding="1" href="#relations">`:
  - week05: in #findings "Turn links into relationships"

### finding-7: 1 × (week05 1)

```html
<div class="w4-finding"><span class="w4-num">T</span><div><h3>T</h3><p>T</p></div><div class="w4-mini" data-finding></div><a href="#copying">T</a></div>
```

- `<FindingRow num="2" finding="2" href="#copying">`:
  - week05: in #findings "Catch Wikipedia copying itself"

### finding-8: 1 × (week05 1)

```html
<div class="w4-finding"><span class="w4-num">T</span><div><h3>T</h3><p>T</p></div><div class="w4-mini" data-finding></div><a href="#search">T</a></div>
```

- `<FindingRow num="3" finding="3" href="#search">`:
  - week05: in #findings "A Marvel search engine in 20 lines"

### finding-9: 1 × (week05 1)

```html
<div class="w4-finding"><span class="w4-num">T</span><div><h3>T</h3><p>T</p></div><div class="w4-mini" data-finding></div><a href="#autocomplete">T</a></div>
```

- `<FindingRow num="4" finding="4" href="#autocomplete">`:
  - week05: in #findings "Community autocomplete"

### finding-10: 1 × (week05 1)

```html
<div class="w4-finding"><span class="w4-num">T</span><div><h3>T</h3><p>T</p></div><div class="w4-mini" data-finding></div><a href="#heaps">T</a></div>
```

- `<FindingRow num="5" finding="5" href="#heaps">`:
  - week05: in #findings "Heaps' law of the Marvel universe"

### finding-11: 1 × (week05 1)

```html
<div class="w4-finding"><span class="w4-num">T</span><div><h3>T</h3><p>T</p></div><div class="w4-mini" data-finding></div><a href="#fame">T</a></div>
```

- `<FindingRow num="6" finding="6" href="#fame">`:
  - week05: in #findings "Does network fame buy you more words?"

### finding-12: 1 × (week05 1)

```html
<div class="w4-finding"><span class="w4-num">T</span><div><h3>T</h3><p>T</p></div><div class="w4-mini" data-finding></div><a href="#weird">T</a></div>
```

- `<FindingRow num="7" finding="7" href="#weird">`:
  - week05: in #findings "Who has the weirdest Wikipedia page?"

### finding-13: 1 × (template 1)

```html
<div class="w4-finding"><span class="w4-num">T</span><div><h3>T</h3><p>T</p></div><div class="w4-mini" data-finding></div><a href="#first">T</a></div>
```

- `<FindingRow num="1" finding="1" href="#first">`:
  - template: in #findings "First section's title"

### finding-14: 1 × (template 1)

```html
<div class="w4-finding"><span class="w4-num">T</span><div><h3>T</h3><p>T</p></div><div class="w4-mini" data-finding></div><a href="#second">T</a></div>
```

- `<FindingRow num="2" finding="2" href="#second">`:
  - template: in #findings "Second section's title"

## Post section

Selector `section.step`, component `post/PostSection`. 41 occurrences in 18 variants.

### step-1: 12 × (week03 7, styleguide 5)

```html
<section class="step" id><div class="card">…</div></section>
```

- `<PostSection id="tails">`:
  - week03: #tails
- `<PostSection id="bridge">`:
  - week03: #bridge
- `<PostSection id="twin">`:
  - week03: #twin
- `<PostSection id="typology">`:
  - week03: #typology
- `<PostSection id="edge">`:
  - week03: #edge
- `<PostSection id="denmark">`:
  - week03: #denmark
- `<PostSection id="methods">`:
  - week03: #methods
- `<PostSection id="tokens">`:
  - styleguide: #tokens
- `<PostSection id="components">`:
  - styleguide: #components
- `<PostSection id="skins">`:
  - styleguide: #skins
- `<PostSection id="palettes">`:
  - styleguide: #palettes
- `<PostSection id="tables">`:
  - styleguide: #tables

### step-2: 1 × (week03 1)

```html
<section class="step" id><div class="card">…</div><div class="card" id>…</div><div class="card" id>…</div><div class="card" id>…</div><div class="card" id>…</div></section>
```

- `<PostSection id="asks">`:
  - week03: #asks

### step-3: 2 × (week04 2)

```html
<section class="step" id><header class="w4-opener">…</header><div class="card w4-card">…</div></section>
```

- `<PostSection id="opening">`:
  - week04: #opening
- `<PostSection id="closing">`:
  - week04: #closing

### step-4: 1 × (week04 1)

```html
<section class="step" id><header class="w4-opener">…</header><div class="w4-two w4-intro">…</div><div class="draft-banner" id hidden="">…</div><div class="card w4-card" id>…</div><div class="card w4-card" id>…</div><div class="card w4-card" id>…</div></section>
```

- `<PostSection id="place">`:
  - week04: #place

### step-5: 1 × (week04 1)

```html
<section class="step" id><header class="w4-opener">…</header><div class="card w4-card">…</div><p aria-live class="status-line" id>…</p><div class="card jobs-card w4-card" id>…</div><div class="card w4-card" id>…</div><div class="card w4-card" id>…</div></section>
```

- `<PostSection id="jobs">`:
  - week04: #jobs

### step-6: 1 × (week04 1)

```html
<section class="step" id><header class="w4-opener">…</header><div class="card w4-card">…</div><div class="card w4-card" id>…</div><div class="card w4-card" id>…</div><div class="card w4-card" id>…</div><div class="card w4-card" id>…</div></section>
```

- `<PostSection id="who">`:
  - week04: #who

### step-7: 1 × (week04 1)

```html
<section class="step" id><header class="w4-opener">…</header><div class="w4-two w4-intro">…</div><div class="rx-fig-row">…</div><div class="rx-drawers rx-foot">…</div><div class="card w4-card" id>…</div></section>
```

- `<PostSection id="footprint">`:
  - week04: #footprint

### step-8: 1 × (week04 1)

```html
<section class="step" id><header class="w4-opener">…</header><div class="card w4-card">…</div><div class="card w4-card" id>…</div><div class="card w4-card" id>…</div><div class="card w4-card" id>…</div></section>
```

- `<PostSection id="beyond">`:
  - week04: #beyond

### step-9: 1 × (week04 1)

```html
<section class="step" id><header class="w4-opener">…</header><div class="rx-catalogue" id>…</div><details class="rx-topic" id name="w4-topic">…</details><details class="rx-topic" id name="w4-topic">…</details><details class="rx-topic" id name="w4-topic">…</details><details class="rx-topic" id name="w4-topic">…</details><details class="rx-topic" id name="w4-topic">…</details><details class="qa cut rx-topic" id name="w4-topic">…</details></section>
```

- `<PostSection id="cut">`:
  - week04: #cut

### step-10: 2 × (week05 1, template 1)

```html
<section class="step" data-owner="" id><header class="w4-opener">…</header><div class="card w4-card">…</div></section>
```

- `<PostSection id="opening" owner="">`:
  - week05: #opening
  - template: #opening

### step-11: 2 × (week05 2)

```html
<section class="step" data-owner="Gyula" id><header class="w4-opener">…</header><div class="card w4-card w5-card">…</div></section>
```

- `<PostSection id="relations" owner="Gyula">`:
  - week05: #relations
- `<PostSection id="copying" owner="Gyula">`:
  - week05: #copying

### step-12: 2 × (week05 2)

```html
<section class="step" data-owner="Àngela" id><header class="w4-opener">…</header><div class="card w4-card w5-card">…</div></section>
```

- `<PostSection id="search" owner="Àngela">`:
  - week05: #search
- `<PostSection id="autocomplete" owner="Àngela">`:
  - week05: #autocomplete

### step-13: 3 × (week05 3)

```html
<section class="step" data-owner="Niklas" id><header class="w4-opener">…</header><div class="card w4-card w5-card">…</div></section>
```

- `<PostSection id="heaps" owner="Niklas">`:
  - week05: #heaps
- `<PostSection id="fame" owner="Niklas">`:
  - week05: #fame
- `<PostSection id="weird" owner="Niklas">`:
  - week05: #weird

### step-14: 2 × (week05 1, template 1)

```html
<section class="step" data-owner="" id><header class="w4-opener">…</header><div class="card w4-card w5-stack">…</div></section>
```

- `<PostSection id="closing" owner="">`:
  - week05: #closing
  - template: #closing

### step-15: 2 × (template 2)

```html
<section class="step" data-owner="" id><header class="w4-opener">…</header><div class="card w4-card w5-card">…</div></section>
```

- `<PostSection id="first" owner="">`:
  - template: #first
- `<PostSection id="second" owner="">`:
  - template: #second

### step-16: 5 × (kit 5)

```html
<section class="step" id><h2>…</h2><div data-demo></div></section>
```

- `<PostSection id="demo-figure">`:
  - kit: #demo-figure
- `<PostSection id="demo-strip">`:
  - kit: #demo-strip
- `<PostSection id="demo-table">`:
  - kit: #demo-table
- `<PostSection id="demo-kwic">`:
  - kit: #demo-kwic
- `<PostSection id="demo-passage">`:
  - kit: #demo-passage

### step-17: 1 × (kit 1)

```html
<section class="step" id><h2>…</h2><div data-demo>…</div></section>
```

- `<PostSection id="demo-term">`:
  - kit: #demo-term

### step-18: 1 × (kit 1)

```html
<section class="step" id><h2>…</h2><p class="sub">…</p><div class="w4-two">…</div><div class="w4-two">…</div><div class="w4-two">…</div><div class="w4-two">…</div></section>
```

- `<PostSection id="demo-network">`:
  - kit: #demo-network

## Section opener

Selector `header.w4-opener`, component `post/SectionOpener`. 21 occurrences in 2 variants.

### opener-1: 1 × (week04 1)

```html
<header class="w4-opener"><span aria-hidden="true" class="w4-opener-num">T</span><div><h2>T</h2><p>T|␣<span class="w4-term">…</span>T</p></div></header>
```

- `<SectionOpener num="0" title>`:
  - week04: in #opening "Opening"

### opener-2: 20 × (week04 7, week05 9, template 4)

```html
<header class="w4-opener"><span aria-hidden="true" class="w4-opener-num">T</span><div><h2>T</h2><p>T</p></div></header>
```

- `<SectionOpener num="1" title>`:
  - week04: in #place "Where the hiring is"
  - week05: in #relations "Turn links into relationships"
  - template: in #first "First section's title"
- `<SectionOpener num="2" title>`:
  - week04: in #jobs "Which jobs go together"
  - week05: in #copying "Catch Wikipedia copying itself"
  - template: in #second "Second section's title"
- `<SectionOpener num="3" title>`:
  - week04: in #who "Who staffs whom"
  - week05: in #search "A Marvel search engine in 20 lines"
- `<SectionOpener num="4" title>`:
  - week04: in #footprint "Without the biggest firms"
  - week05: in #autocomplete "Community autocomplete"
- `<SectionOpener num="5" title>`:
  - week04: in #beyond "Beyond the three networks"
  - week05: in #heaps "Heaps' law of the Marvel universe"
- `<SectionOpener num="✓" title>`:
  - week04: in #closing "Closing"
  - week05: in #closing "Closing"
  - template: in #closing "Closing"
- `<SectionOpener num="+" title>`:
  - week04: in #cut "Deep dive"
- `<SectionOpener num="0" title>`:
  - week05: in #opening "Opening"
  - template: in #opening "Opening"
- `<SectionOpener num="6" title>`:
  - week05: in #fame "Does network fame buy you more words?"
- `<SectionOpener num="7" title>`:
  - week05: in #weird "Who has the weirdest Wikipedia page?"

## Card

Selector `div.card`, component `post/Card, post/QuestionCard, post/ClosingCard`. 76 occurrences in 42 variants.

### card-1: 1 × (home 1)

```html
<div class="card"><p class="home-caps">…</p><ul class="members">…</ul></div>
```

- `<Card className="card">`:
  - home: in #about "Made by Gyula Kürthy Àngela Buxó Niklas "

### card-2: 1 × (week03 1)

```html
<div class="card"><div class="step-head">…</div><p class="sub">…</p><div class="grid2">…</div></div>
```

- `<Card className="card">`:
  - week03: in #tails "Heavy tails in migration"

### card-3: 1 × (week03 1)

```html
<div class="card"><div class="step-head">…</div><div class="grid-side">…</div><div class="grid-side" style>…</div></div>
```

- `<Card className="card">`:
  - week03: in #bridge "Popular ≠ bridge. Big ≠ prestigious."

### card-4: 1 × (week03 1)

```html
<div class="card"><div class="step-head">…</div><p class="sub">…</p><p class="sub">…</p><div class="grid-pair">…</div></div>
```

- `<Card className="card">`:
  - week03: in #twin "Compared to what?"

### card-5: 1 × (week03 1)

```html
<div class="card"><div class="step-head">…</div><p class="sub">…</p><p class="sub">…</p><p class="sub">…</p><canvas aria-label="Chart: roles of countries inside their communities" class="chart" height id role="img" width></canvas><div aria-label="How many countries carry each role" class="type-strip" id></div><div class="grid5" id></div><aside aria-label="Countries in this role" class="type-drawer" id hidden=""></aside><div class="notice">…</div><div class="notice">…</div></div>
```

- `<Card className="card">`:
  - week03: in #typology "Roles inside the communities"

### card-6: 1 × (week03 1)

```html
<div class="card"><div class="step-head">…</div><div class="edgebar">…</div><div class="facts" id></div><div class="notice" id>…</div></div>
```

- `<Card className="card">`:
  - week03: in #edge "Edge inspector"

### card-7: 1 × (week03 1)

```html
<div class="card"><div class="step-head">…</div><p class="sub">…</p><div class="dk-head" id></div><div class="grid2">…</div><div class="grid2" style>…</div><div class="notice" id>…</div></div>
```

- `<Card className="card">`:
  - week03: in #denmark "Let's analyse Denmark"

### card-8: 1 × (week03 1)

```html
<div class="card"><div class="step-head">…</div><h2 id>…</h2><details class="qa" id>…</details></div>
```

- `<Card className="card">`:
  - week03: in #asks "More ways to look at this"

### card-9: 1 × (week03 1)

```html
<div class="card" id><h2>…</h2><p class="sub">…</p><p class="sub">…</p><p class="sub">…</p><table class="ego">…</table><div class="notice">…</div><h3>…</h3><p class="sub">…</p><table class="ego">…</table><div class="notice">…</div><p class="fineprint">…</p><p class="fineprint">…</p><p class="fineprint">…</p></div>
```

- `<Card className="card" id="gravity">`:
  - week03: #gravity "What is left after gravity"

### card-10: 1 × (week03 1)

```html
<div class="card" id><h2>…</h2><p class="sub">…</p><p class="sub">…</p><table class="ego">…</table><div class="notice">…</div><div class="notice">…</div><h3>…</h3><p class="sub">…</p><table class="ego">…</table><p class="sub">…</p><div class="notice">…</div><details class="qa" id>…</details><table class="ego">…</table><p class="fineprint">…</p><h3>…</h3><p class="sub">…</p><table class="ego">…</table><div class="notice">…</div></div>
```

- `<Card className="card" id="communities">`:
  - week03: #communities "Does the world split into groups?"

### card-11: 1 × (week03 1)

```html
<div class="card" id><h3>…</h3><p class="sub">…</p></div>
```

- `<Card className="card" id="surprise">`:
  - week03: #surprise "What surprised us"

### card-12: 1 × (week03 1)

```html
<div class="card" id><h2>…</h2><details class="qa" id>…</details></div>
```

- `<Card className="card" id="more">`:
  - week03: #more "Four extra views, two of them from files"

### card-13: 1 × (week03 1)

```html
<div class="card"><div class="step-head">…</div><details class="qa" id>…</details></div>
```

- `<Card className="card">`:
  - week03: in #methods "Methods, and what this cannot tell you"

### card-14: 5 × (week04 3, week05 1, template 1)

```html
<div class="card w4-card"><div class="w4-two">…</div></div>
```

- `<Card className="card w4-card">`:
  - week04: in #opening "What one filing names"; in #jobs "Two occupations are linked when the same"; in #beyond "The same filings name the law firm that "
  - week05: in #opening "How each section reads"
  - template: in #opening "How each section reads"

### card-15: 1 × (week04 1)

```html
<div class="card w4-card" id><header class="w4-q">…</header><div class="rx-start-grid">…</div><div class="rx-start-notices">…</div><div class="rx-drawers rx-foot">…</div></div>
```

- `<Card className="card w4-card" id="place-start">`:
  - week04: #place-start "Which cities hire the most?"

### card-16: 12 × (week04 12)

```html
<div class="card w4-card" id><header class="w4-q">…</header><div class="w4-two">…</div></div>
```

- `<Card className="card w4-card" id="place-who">`:
  - week04: #place-who "Do cities group by who hires there inste"
- `<Card className="card w4-card" id="place-break">`:
  - week04: #place-break "Where does the backbone break, and whose"
- `<Card className="card w4-card" id="who-switch">`:
  - week04: #who-switch "When a client changes its main vendor, d"
- `<Card className="card w4-card" id="who-movers">`:
  - week04: #who-movers "Which clients change group when filing c"
- `<Card className="card w4-card" id="who-overlap">`:
  - week04: #who-overlap "Which clients sit in two groups at once?"
- `<Card className="card w4-card" id="beyond-law">`:
  - week04: #beyond-law "Do immigration law firms split companies"
- `<Card className="card w4-card" id="beyond-perm">`:
  - week04: #beyond-perm "Do outsourcing firms sponsor fewer green"
- `<Card className="card w4-card" id="beyond-wage">`:
  - week04: #beyond-wage "Do outsourcing firms file at lower wage "
- `<Card className="card w4-card" id="deeper-density">`:
  - week04: #deeper-density "Where is the hiring densest? Filings per"
- `<Card className="card w4-card" id="staffing-community-stats">`:
  - week04: #staffing-community-stats "With filing counts or without?"
- `<Card className="card w4-card" id="deeper-strength">`:
  - week04: #deeper-strength "Strength against degree: where do the he"
- `<Card className="card w4-card" id="deeper-perm">`:
  - week04: #deeper-perm "Who keeps them? Green cards as the stron"

### card-17: 1 × (week04 1)

```html
<div class="card jobs-card w4-card" id><header class="w4-q">…</header><p class="sub">…</p><div class="plot">…</div></div>
```

- `<Card className="card jobs-card w4-card" id="jobs-together">`:
  - week04: #jobs-together "Which jobs are hired together?"

### card-18: 4 × (week04 4)

```html
<div class="card w4-card" id><header class="w4-q">…</header><div class="w4-two">…</div><div class="rx-fig-row">…</div><div class="rx-drawers rx-foot">…</div></div>
```

- `<Card className="card w4-card" id="jobs-split">`:
  - week04: #jobs-split "Do outsourcing firms bundle jobs differe"
- `<Card className="card w4-card" id="footprint-which">`:
  - week04: #footprint-which "Which firm hides the regions?"
- `<Card className="card w4-card" id="deeper-lottery">`:
  - week04: #deeper-lottery "The lottery a year apart, and who receiv"
- `<Card className="card w4-card" id="deeper-countries">`:
  - week04: #deeper-countries "Where are they from? A network of countr"

### card-19: 1 × (week04 1)

```html
<div class="card w4-card" id><header class="w4-q">…</header><p class="sub">…</p><div class="notice">…</div><div class="w4-two">…</div><div class="rx-drawers rx-foot">…</div></div>
```

- `<Card className="card w4-card" id="jobs-linkcom">`:
  - week04: #jobs-linkcom "Does any job belong to two clusters at o"

### card-20: 1 × (week04 1)

```html
<div class="card w4-card"><div class="w4-two">…</div><div class="rx-fig-row">…</div><div class="rx-drawers rx-foot">…</div></div>
```

- `<Card className="card w4-card">`:
  - week04: in #who "Words in this section"

### card-21: 3 × (week04 3)

```html
<div class="card w4-card" id><header class="w4-q">…</header><p class="sub">…</p><div class="rx-fig-row">…</div><div class="rx-drawers rx-foot">…</div></div>
```

- `<Card className="card w4-card" id="who-q1">`:
  - week04: #who-q1 "How many workers sit at a client?"
- `<Card className="card w4-card" id="staffing-ties">`:
  - week04: #staffing-ties "Strong ties, weak ties and pay"
- `<Card className="card w4-card" id="staffing-lottery">`:
  - week04: #staffing-lottery "Do the firms that register the same work"

### card-22: 1 × (week04 1)

```html
<div class="card w4-card"><div class="w4-two">…</div><div class="notice">…</div><details class="qa" id>…</details><p class="fineprint">…</p><div class="rx-drawers rx-foot">…</div></div>
```

- `<Card className="card w4-card">`:
  - week04: in #closing "What surprised us"

### card-23: 1 × (week04 1)

```html
<div class="card w4-card" id><header class="w4-q">…</header><p class="sub">…</p><div class="rx-seg-row">…</div><div class="plot">…</div><div class="plot" style>…</div><div class="notice">…</div><div class="rx-drawers rx-foot">…</div></div>
```

- `<Card className="card w4-card" id="place-backbone">`:
  - week04: #place-backbone "Once the small links go, what's left of "

### card-24: 1 × (week04 1)

```html
<div class="card w4-card" id><header class="w4-q">…</header><p class="sub">…</p><div class="longhaul-stack">…</div><div class="notice">…</div><div class="rx-drawers rx-foot">…</div></div>
```

- `<Card className="card w4-card" id="place-longhaul">`:
  - week04: #place-longhaul "Do the same employers tie distant cities"

### card-25: 1 × (week04 1)

```html
<div class="card jobs-card w4-card" id><header class="w4-q">…</header><p class="sub">…</p><figure class="w4-figure">…</figure><div class="jobs-grid jobs-network-grid">…</div><div class="rx-drawers rx-foot">…</div></div>
```

- `<Card className="card jobs-card w4-card" id="jobs-bridges">`:
  - week04: #jobs-bridges "Which jobs belong to two clusters?"

### card-26: 1 × (week04 1)

```html
<div class="card jobs-card w4-card" id><header class="w4-q">…</header><p class="sub">…</p><div class="jobs-grid jobs-groups-grid">…</div><div class="notice">…</div><div class="rx-drawers rx-foot">…</div></div>
```

- `<Card className="card jobs-card w4-card" id="jobs-groups">`:
  - week04: #jobs-groups "Do the clusters follow official job grou"

### card-27: 3 × (week04 3)

```html
<div class="card w4-card"><div class="w4-q-block" id>…</div></div>
```

- `<Card className="card w4-card">`:
  - week04: in #topic-outsourcing "Do clients group by industry or by the f"; in #topic-outsourcing "Who relies on a single vendor?"; in #topic-years "Does it hold from year to year?"

### card-28: 1 × (week04 1)

```html
<div class="card w4-card"><header class="w4-q">…</header><figure class="staffing" id>…</figure><div class="rx-drawers rx-foot">…</div></div>
```

- `<Card className="card w4-card">`:
  - week04: in #topic-outsourcing "The client network, year by year"

### card-29: 1 × (week04 1)

```html
<div class="card w4-card"><header class="w4-q">…</header><figure class="w4-entities" id>…</figure></div>
```

- `<Card className="card w4-card">`:
  - week04: in #topic-outsourcing "Do workers group by job and pay, or by w"

### card-30: 1 × (week04 1)

```html
<div class="card w4-card" id><header class="w4-q">…</header><div class="rx-fig-row">…</div><div class="rx-drawers rx-foot">…</div></div>
```

- `<Card className="card w4-card" id="staffing-lawyers">`:
  - week04: #staffing-lawyers "Who files the paperwork?"

### card-31: 1 × (week04 1)

```html
<div class="card w4-card" id><header class="w4-q">…</header><p class="sub">…</p><table class="ego" data-rx-bars>…</table><div class="notice">…</div></div>
```

- `<Card className="card w4-card" id="deeper-uscis">`:
  - week04: #deeper-uscis "USCIS denials, year by year"

### card-32: 1 × (week04 1)

```html
<div class="card w4-card" id><header class="w4-q">…</header><div class="roles-toolbar" role="group" aria-label="Chart controls">…</div><p class="axis-note">…</p><div class="roles-chart-wrap">…</div><p class="roles-summary" id aria-live></p><div class="notice" id>…</div><div class="rx-drawers rx-foot" id></div></div>
```

- `<Card className="card w4-card" id="roles-card">`:
  - week04: #roles-card "Who filed, and for which roles?"

### card-33: 5 × (week05 4, template 1)

```html
<div class="card w4-card w5-card"><header class="w4-q" id>…</header><div class="w4-two">…</div><div class="w5-fig" id>…</div><div class="rx-drawers rx-foot">…</div></div>
```

- `<QuestionCard section="relations" layout="below">`, children: Drawers:
  - week05: in #relations "Do enemies sit in different communities "
- `<QuestionCard section="search" layout="below">`, children: Drawers:
  - week05: in #search "Can a Bag-of-Words search find the right"
- `<QuestionCard section="autocomplete" layout="below">`, children: Drawers:
  - week05: in #autocomplete "Can someone who has not seen the pages t"
- `<QuestionCard section="heaps" layout="below">`, children: Drawers:
  - week05: in #heaps "Do minor characters bring new words, or "
- `<QuestionCard section="second" layout="below">`, children: Drawers:
  - template: in #second "The second question?"

### card-34: 4 × (week05 3, template 1)

```html
<div class="card w4-card w5-card"><header class="w4-q" id>…</header><div class="w4-two">…</div><div class="rx-drawers rx-foot">…</div></div>
```

- `<QuestionCard section="copying" layout="beside">`, children: Drawers:
  - week05: in #copying "Which Marvel pages copy text from each o"
- `<QuestionCard section="fame" layout="beside">`, children: Drawers:
  - week05: in #fame "Do characters that more pages link to ge"
- `<QuestionCard section="weird" layout="beside">`, children: Drawers:
  - week05: in #weird "Which Marvel page uses the most varied w"
- `<QuestionCard section="first" layout="beside">`, children: Drawers:
  - template: in #first "The question, answerable after reading t"

### card-35: 2 × (week05 1, template 1)

```html
<div class="card w4-card w5-stack"><p class="sub">…</p><div class="notice">…</div><p class="sub">…</p><details class="qa" id>…</details><details class="qa" id>…</details></div>
```

- `<ClosingCard takeaway limit next>`, children: 2 QaDisclosure:
  - week05: in #closing "Where the words meet the links, the link"
  - template: in #closing "The takeaway with the sections' key numb"

### card-36: 1 × (styleguide 1)

```html
<div class="card"><div class="step-head">…</div><p class="sub">…</p><div class="sg-swatches">…</div><div class="grid2" style>…</div></div>
```

- `<Card className="card">`:
  - styleguide: in #tokens "Tokens"

### card-37: 1 × (styleguide 1)

```html
<div class="card" style></div>
```

- `<Card className="card" style>`:
  - styleguide: in #tokens

### card-38: 1 × (styleguide 1)

```html
<div class="card"><div class="step-head">…</div><p class="sub">…</p><div class="grid2">…</div><div class="grid2" style>…</div><div class="grid-side" style>…</div><div class="grid-pair" style>…</div><div class="grid3" style>…</div><div class="grid5" style>…</div></div>
```

- `<Card className="card">`:
  - styleguide: in #components "Components"

### card-39: 2 × (styleguide 2)

```html
<div class="card"><div class="step-head">…</div><p class="sub">…</p><div class="sg-specimens four">…</div></div>
```

- `<Card className="card">`:
  - styleguide: in #skins "Skins"; in #tables "Tables"

### card-40: 4 × (styleguide 4)

```html
<div class="card"><div class="step-head">…</div><p class="sub">…</p><div class="sg-row">…</div></div>
```

- `<Card className="card">`:
  - styleguide: in #skins "Popular ≠ bridge"; in #skins "Popular ≠ bridge"; in #skins "Popular ≠ bridge"; in #skins "Popular ≠ bridge"

### card-41: 1 × (styleguide 1)

```html
<div class="card"><div class="step-head">…</div><p class="sub">…</p><div class="sg-specimens five">…</div></div>
```

- `<Card className="card">`:
  - styleguide: in #palettes "Palettes"

### card-42: 1 × (screen-test 1)

```html
<div class="card"><h3>…</h3><p id></p><h3>…</h3><p id></p><h3>…</h3><p id></p><h3>…</h3><p id></p><h3>…</h3><p>…</p></div>
```

- `<Card className="card">`:
  - screen-test: top "Population"

## Question header

Selector `header.w4-q`, component `post/QuestionHeader`. 45 occurrences in 11 variants.

### qheader-1: 1 × (week04 1)

```html
<header class="w4-q"><span class="w4-num">T</span><div><p class="rx-kicker">T</p></div></header>
```

- `<QuestionHeader num="Start" kicker>`:
  - week04: in #place-start "The opening questions, side by side, before 1A"

### qheader-2: 2 × (week04 2)

```html
<header class="w4-q"><div><h2>T</h2><p class="w4-answer">T</p></div></header>
```

- `<QuestionHeader question answer>`:
  - week04: in #place-rank "Which cities hire the most?"; in #place-regions "Is it one national job market or several regio…"

### qheader-3: 26 × (week04 26)

```html
<header class="w4-q"><span class="w4-num">T</span><div><h2>T</h2><p class="w4-answer">T</p></div></header>
```

- `<QuestionHeader num="1A" question answer>`:
  - week04: in #place-who "Do cities group by who hires there instead of …"
- `<QuestionHeader num="1B" question answer>`:
  - week04: in #place-break "Where does the backbone break, and whose links…"
- `<QuestionHeader num="Start" question answer>`:
  - week04: in #jobs-together "Which jobs are hired together?"; in #who-q1 "How many workers sit at a client?"
- `<QuestionHeader num="2A" question answer>`:
  - week04: in #jobs-split "Do outsourcing firms bundle jobs differently f…"
- `<QuestionHeader num="2B" question answer>`:
  - week04: in #jobs-linkcom "Does any job belong to two clusters at once?"
- `<QuestionHeader num="3A" question answer>`:
  - week04: in #who-switch "When a client changes its main vendor, does it…"
- `<QuestionHeader num="3B" question answer>`:
  - week04: in #who-movers "Which clients change group when filing counts …"
- `<QuestionHeader num="3C" question answer>`:
  - week04: in #who-overlap "Which clients sit in two groups at once?"
- `<QuestionHeader num="4A" question answer>`:
  - week04: in #footprint-which "Which firm hides the regions?"
- `<QuestionHeader num="5A" question answer>`:
  - week04: in #beyond-law "Do immigration law firms split companies the w…"
- `<QuestionHeader num="5B" question answer>`:
  - week04: in #beyond-perm "Do outsourcing firms sponsor fewer green cards?"
- `<QuestionHeader num="5C" question answer>`:
  - week04: in #beyond-wage "Do outsourcing firms file at lower wage levels…"
- `<QuestionHeader num="1" question answer>`:
  - week04: in #place-backbone "Once the small links go, what's left of the map?"; in #who-q2 "Do clients group by industry or by the firm th…"; in #staffing-lawyers "Who files the paperwork?"
- `<QuestionHeader num="2" question answer>`:
  - week04: in #place-longhaul "Do the same employers tie distant cities toget…"; in #who-q3 "Who relies on a single vendor?"; in #staffing-lottery "Do the firms that register the same workers st…"
- `<QuestionHeader num="3" question answer>`:
  - week04: in #deeper-density "Where is the hiring densest? Filings per 1,000…"; in #deeper-lottery "The lottery a year apart, and who receives the…"; in #who-q4 "Does it hold from year to year?"
- `<QuestionHeader num="5" question answer>`:
  - week04: in #staffing-ties "Strong ties, weak ties and pay"
- `<QuestionHeader num="6" question answer>`:
  - week04: in #deeper-strength "Strength against degree: where do the heavy li…"; in #deeper-countries "Where are they from? A network of countries"
- `<QuestionHeader num="4" question answer>`:
  - week04: in #deeper-uscis "USCIS denials, year by year"

### qheader-4: 1 × (week04 1)

```html
<header class="w4-q"><span class="w4-num">T</span><div><h2>T</h2><p class="w4-answer">T|␣<span data-jobs>…</span>␣|T|␣<span data-jobs>…</span>␣|T|␣<span data-jobs>…</span>␣|T</p></div></header>
```

- `<QuestionHeader num="1" question answer>`:
  - week04: in #jobs-bridges "Which jobs belong to two clusters?"

### qheader-5: 1 × (week04 1)

```html
<header class="w4-q"><span class="w4-num">T</span><div><h2>T</h2><p class="w4-answer">T|␣<span class="w4-term">…</span>␣<strong data-jobs>…</strong>␣|T|␣<strong data-jobs>…</strong>␣|T</p></div></header>
```

- `<QuestionHeader num="2" question answer>`:
  - week04: in #jobs-groups "Do the clusters follow official job groups?"

### qheader-6: 1 × (week04 1)

```html
<header class="w4-q"><span class="w4-num">T</span><div><h2>T</h2></div></header>
```

- `<QuestionHeader num="3" question>`:
  - week04: in #topic-outsourcing "The client network, year by year"

### qheader-7: 1 × (week04 1)

```html
<header class="w4-q"><span class="w4-num">T</span><div><h2>T</h2><p class="w4-answer">T|␣<span class="w4-term">…</span>␣|T|␣<b class="cross">…</b>T<b class="seeds">…</b>␣|T|␣<b class="seeds-plain">…</b>␣|T</p></div></header>
```

- `<QuestionHeader num="4" question answer>`:
  - week04: in #staffing-community-stats "With filing counts or without?"

### qheader-8: 1 × (week04 1)

```html
<header class="w4-q"><span class="w4-num">T</span><div><h2>T</h2><p class="w4-answer" data-entities>T</p></div></header>
```

- `<QuestionHeader num="7" question answer answerAttrs={{ "data-entities": "answer" }}>`:
  - week04: in #topic-outsourcing "Do workers group by job and pay, or by who fil…"

### qheader-9: 1 × (week04 1)

```html
<header class="w4-q"><span class="w4-num">T</span><div><h2>T</h2><p class="w4-answer">T<span class="w4-term">…</span>T</p></div></header>
```

- `<QuestionHeader num="5" question answer>`:
  - week04: in #deeper-perm "Who keeps them? Green cards as the strong tie"

### qheader-10: 1 × (week04 1)

```html
<header class="w4-q"><span class="w4-num">T</span><div><h2>T</h2><p class="w4-answer" id>T</p></div></header>
```

- `<QuestionHeader num="2" question answer answerAttrs={{ "id": "roles-answer" }}>`:
  - week04: in #roles-card "Who filed, and for which roles?"

### qheader-11: 9 × (week05 7, template 2)

```html
<header class="w4-q" id><span class="w4-num">T</span><div><h2>T</h2><p class="w4-answer">T</p></div></header>
```

- `<QuestionHeader id="relations-asked" num="1A" question answer>`:
  - week05: #relations-asked "Do enemies sit in different communities from a…"
- `<QuestionHeader id="copying-asked" num="2A" question answer>`:
  - week05: #copying-asked "Which Marvel pages copy text from each other?"
- `<QuestionHeader id="search-asked" num="3A" question answer>`:
  - week05: #search-asked "Can a Bag-of-Words search find the right Marve…"
- `<QuestionHeader id="autocomplete-asked" num="4A" question answer>`:
  - week05: #autocomplete-asked "Can someone who has not seen the pages tell wh…"
- `<QuestionHeader id="heaps-asked" num="5A" question answer>`:
  - week05: #heaps-asked "Do minor characters bring new words, or mostly…"
- `<QuestionHeader id="fame-asked" num="6A" question answer>`:
  - week05: #fame-asked "Do characters that more pages link to get long…"
- `<QuestionHeader id="weird-asked" num="7A" question answer>`:
  - week05: #weird-asked "Which Marvel page uses the most varied words f…"
- `<QuestionHeader id="first-asked" num="1A" question answer>`:
  - template: #first-asked "The question, answerable after reading this ca…"
- `<QuestionHeader id="second-asked" num="2A" question answer>`:
  - template: #second-asked "The second question?"

## Notice

Selector `div.notice`, component `post/Notice`. 58 occurrences in 16 variants.

### notice-1: 27 × (week03 11, week04 11, week05 2, template 2, styleguide 1)

```html
<div class="notice"><span class="ico">T</span>␣<span><b>T</b>␣|T</span></div>
```

- `<Notice icon="💡" gap headline>`:
  - week03: in #tails "What to notice, in 2020"; in #tails "What to notice"; in #tails "So the word on this page is \"heavy-taile"; in #bridge "What to notice"; in #twin "What to notice"; in #gravity "Doubling the distance roughly halves the"; in #gravity "Read the list and the categories name th"; in #communities "At a floor of zero the top brokers are A"
  - week04: in #place-start "What to notice"; in #place-start "What to notice"; in #jobs-split "What to notice"; in #jobs-linkcom "What to notice"; in #who-overlap "What to notice"; in #footprint-which "What to notice"; in #beyond-perm "What to notice"; in #place-longhaul "What to notice"; in #jobs-groups "What to notice"
  - styleguide: in #components "Denmark, in one line."
- `<Notice icon="🧪" gap headline>`:
  - week03: in #typology "Louvain is random, and one run would hav"; in #communities "And the amount of grouping is not a find"
- `<Notice icon="🕰️" gap headline>`:
  - week03: in #views "The next two have a date on them."
- `<Notice icon="!" gap headline>`:
  - week04: in #opening "Read the scope carefully"; in #closing "One important limit"
  - week05: in #opening "Preprocessing changes the counts"; in #closing "One important limit"
  - template: in #opening "Read the scope carefully"; in #closing "One important limit"

### notice-2: 1 × (week03 1)

```html
<div class="notice"><span class="ico">T</span>␣<span><b>T</b>␣<span id></span></span></div>
```

- `<Notice icon="💡" gap headline>`:
  - week03: in #bridge "What to notice"

### notice-3: 1 × (week03 1)

```html
<div class="notice"><span class="ico">T</span>␣<span id></span></div>
```

- `<Notice icon="💡" gap bodyId="typology-note">`:
  - week03: in #typology "💡"

### notice-4: 1 × (week03 1)

```html
<div class="notice" id><span class="ico">T</span>␣<span></span></div>
```

- `<Notice id="edge-note" icon="💡" gap>`:
  - week03: #edge-note "💡"

### notice-5: 1 × (week03 1)

```html
<div class="notice" id><span class="ico">T</span><span></span></div>
```

- `<Notice id="dk-verdict" icon="💡">`:
  - week03: #dk-verdict "💡"

### notice-6: 1 × (week03 1)

```html
<div class="notice"><span class="ico">T</span>␣<span>T|␣<a href="https://github.com/horrrt/02805_social_graphs/blob/main/project/MIGRATION_DATA_CATALOGUE.md">T</a>␣|T|␣<a href="https://github.com/horrrt/02805_social_graphs/blob/main/project/MIGRATION_QUESTIONS.md">T</a>␣|T</span></div>
```

- `<Notice icon="📄" gap>`:
  - week03: in #questions "📄 Three of these questions run out of d"

### notice-7: 1 × (week03 1)

```html
<div class="notice"><span class="ico">T</span>␣<span><b>T</b>T</span></div>
```

- `<Notice icon="💡" gap>`, children: `<b>` and the text (no {" "} after the bold):
  - week03: in #communities "68.7% of the world's 282 million migrant"

### notice-8: 1 × (week03 1)

```html
<div class="notice"><span class="ico">T</span>␣<span><b>T</b>␣|T|␣<strong>T</strong>␣|T|␣<strong>T</strong>T</span></div>
```

- `<Notice icon="💡" gap headline>`:
  - week03: in #communities "Of the fifteen biggest destinations in e"

### notice-9: 3 × (week04 3)

```html
<div class="notice"><span class="ico">T</span>␣<span><b>T</b>␣|T|␣<span class="w4-term"><button aria-describedby type="button">…</button><span class="w4-pop" id role="tooltip">…</span></span>␣|T</span></div>
```

- `<Notice icon="💡" gap headline>`:
  - week04: in #place-who "What to notice"; in #footprint "What to notice"; in #beyond-wage "What to notice"

### notice-10: 1 × (week04 1)

```html
<div class="notice"><span class="ico">T</span>␣<span><b>T</b>␣|T|␣<span class="w4-term"><button aria-describedby type="button">…</button><span class="w4-pop" id role="tooltip">…</span></span>␣|T|␣<span class="w4-term"><button aria-describedby type="button">…</button><span class="w4-pop" id role="tooltip">…</span></span>␣|T</span></div>
```

- `<Notice icon="💡" gap headline>`:
  - week04: in #place-break "What to notice"

### notice-11: 1 × (week04 1)

```html
<div class="notice"><span class="ico">T</span>␣<span><b>T</b>␣|T<span class="w4-term"><button aria-describedby type="button">…</button><span class="w4-pop" id role="tooltip">…</span></span>␣|T</span></div>
```

- `<Notice icon="💡" gap headline>`:
  - week04: in #who-switch "What to notice"

### notice-12: 1 × (week04 1)

```html
<div class="notice"><span class="ico">T</span>␣<span><b>T</b>␣|T|␣<span class="w4-term"><button aria-describedby type="button">…</button><span class="w4-pop" id role="tooltip">…</span></span>T</span></div>
```

- `<Notice icon="💡" gap headline>`:
  - week04: in #who-movers "What to notice"

### notice-13: 1 × (week04 1)

```html
<div class="notice"><span class="ico">T</span>␣<span><b>T</b>␣<span class="w4-term"><button aria-describedby type="button">…</button><span class="w4-pop" id role="tooltip">…</span></span>␣|T|␣<span class="w4-term"><button aria-describedby type="button">…</button><span class="w4-pop" id role="tooltip">…</span></span>T|␣<span class="w4-term"><button aria-describedby type="button">…</button><span class="w4-pop" id role="tooltip">…</span></span>␣|T</span></div>
```

- `<Notice icon="💡" gap headline>`:
  - week04: in #beyond-law "What to notice"

### notice-14: 1 × (week04 1)

```html
<div class="notice"><span class="ico">T</span>␣<span><b>T</b>␣<span id>T</span></span></div>
```

- `<Notice icon="💡" gap headline>`:
  - week04: in #place-backbone "What to notice"

### notice-15: 15 × (week04 6, week05 7, template 2)

```html
<div class="notice"><span class="ico">T</span><span><b>T</b>␣|T</span></div>
```

- `<Notice icon="💡" headline>`:
  - week04: in #deeper-density "What to notice"; in #deeper-strength "What to notice"; in #deeper-lottery "What to notice"; in #deeper-uscis "What to notice"; in #deeper-perm "What to notice"; in #deeper-countries "What to notice"
  - week05: in #relations-surprise "What to notice"; in #copying-surprise "What to notice"; in #search-surprise "What to notice"; in #autocomplete-surprise "What to notice"; in #heaps-surprise "What to notice"; in #fame-surprise "What to notice"; in #weird-surprise "What to notice"
  - template: in #first-surprise "What to notice"; in #second-surprise "What to notice"

### notice-16: 1 × (week04 1)

```html
<div class="notice" id><span class="ico">T</span>␣<span id>T</span></div>
```

- `<Notice id="roles-notice" icon="!" gap bodyId="roles-notice-text">`:
  - week04: #roles-notice "! Loading…"

## Drawer row

Selector `div.rx-drawers`, component `post/Drawers`. 51 occurrences in 6 variants.

### drawers-1: 12 × (week04 11, week05 1)

```html
<div class="rx-drawers rx-foot"><details class="rx-drawer">…</details></div>
```

- `<Drawers variant="foot">`, 1 drawers:
  - week04: in #opening; in #jobs; in #closing; in #w4m-panel-gn; in #w4m-panel-louvain; in #w4m-panel-overlap; in #jobs-bridges; in #who-q2; in #who-q3; in #topic-outsourcing; in #staffing-lottery
  - week05: in #opening

### drawers-2: 19 × (week04 16, week05 2, template 1)

```html
<div class="rx-drawers rx-foot"><details class="rx-drawer">…</details><details class="rx-drawer">…</details></div>
```

- `<Drawers variant="foot">`, 2 drawers:
  - week04: in #place; in #place-who; in #jobs-split; in #who; in #who-q1; in #footprint-which; in #beyond-law; in #place-backbone; in #deeper-density; in #staffing-community-stats; in #staffing-ties; in #deeper-strength; in #staffing-lawyers; in #deeper-lottery; in #deeper-perm; in #deeper-countries
  - week05: in #search; in #weird
  - template: in #second

### drawers-3: 7 × (week04 4, week05 3)

```html
<div class="rx-drawers rx-foot"><details class="rx-drawer">…</details><details class="rx-drawer">…</details><details class="rx-drawer">…</details><details class="rx-drawer">…</details></div>
```

- `<Drawers variant="foot">`, 4 drawers:
  - week04: in #place-start; in #place-break; in #jobs-linkcom; in #who-overlap
  - week05: in #copying; in #heaps; in #fame

### drawers-4: 11 × (week04 8, week05 2, template 1)

```html
<div class="rx-drawers rx-foot"><details class="rx-drawer">…</details><details class="rx-drawer">…</details><details class="rx-drawer">…</details></div>
```

- `<Drawers variant="foot">`, 3 drawers:
  - week04: in #who-switch; in #who-movers; in #footprint; in #beyond-perm; in #beyond-wage; in #place-longhaul; in #jobs-groups; in #who-q4
  - week05: in #relations; in #autocomplete
  - template: in #first

### drawers-5: 1 × (week04 1)

```html
<div class="rx-drawers rx-inline"><details class="rx-drawer">…</details></div>
```

- `<Drawers variant="inline">`, 1 drawers:
  - week04: in #cut-catalogue

### drawers-6: 1 × (week04 1)

```html
<div class="rx-drawers rx-foot" id></div>
```

- `<Drawers variant="foot" id="roles-reveals">`, 0 drawers:
  - week04: #roles-reveals

## Drawer

Selector `details.rx-drawer`, component `post/Drawer`. 113 occurrences in 27 variants.

### drawer-1: 31 × (week04 28, week05 3)

```html
<details class="rx-drawer"><summary>T</summary><div class="rx-drawer-body"><p>…</p><p>…</p></div></details>
```

- `<Drawer label>`:
  - week04: in #opening "Background"; in #place-who "Method"; in #place-break "Method"; in #jobs-split "Method"; in #jobs-linkcom "More numbers"; in #who-switch "Method"; in #who-switch "More numbers"; in #who-movers "Method"; in #footprint "Background"; in #footprint "More numbers"; in #footprint-which "Method"; in #beyond-perm "Method"; in #beyond-perm "More numbers"; in #beyond-wage "Background"; in #beyond-wage "More numbers"; in #place-backbone "Background"; in #place-longhaul "Method"; in #place-longhaul "More numbers"; in #deeper-density "Method"; in #jobs-groups "Background"; in #who-q2 "More numbers"; in #who-q3 "More numbers"; in #topic-outsourcing "Background"; in #staffing-community-stats "More numbers"; in #staffing-lawyers "Background"; in #deeper-lottery "Method"; in #deeper-countries "More numbers"; in #who-q4 "More numbers"
  - week05: in #relations "More numbers"; in #copying "More numbers"; in #heaps "More numbers"

### drawer-2: 42 × (week04 40, week05 1, template 1)

```html
<details class="rx-drawer"><summary>T</summary><div class="rx-drawer-body"><p>…</p></div></details>
```

- `<Drawer label>`:
  - week04: in #place "Background"; in #place "Method"; in #place-start "Method"; in #place-break "Background"; in #jobs "Background"; in #jobs-split "More numbers"; in #jobs-linkcom "Background"; in #jobs-linkcom "Method"; in #who "Background"; in #who "Method"; in #who-q1 "Method"; in #who-q1 "More numbers"; in #who-switch "Background"; in #who-movers "More numbers"; in #who-overlap "Method"; in #who-overlap "More numbers"; in #footprint "Method"; in #footprint-which "More numbers"; in #beyond-law "Method"; in #beyond-law "More numbers"; in #beyond-perm "Background"; in #beyond-wage "Method"; in #closing "Background"; in #place-longhaul "Background"; in #deeper-density "More numbers"; in #w4m-panel-gn "Background"; in #w4m-panel-louvain "Method"; in #w4m-panel-overlap "Method"; in #jobs-bridges "Background"; in #jobs-groups "More numbers"; in #staffing-ties "Background"; in #staffing-ties "More numbers"; in #deeper-strength "More numbers"; in #staffing-lawyers "More numbers"; in #staffing-lottery "More numbers"; in #deeper-lottery "More numbers"; in #deeper-perm "More numbers"; in #deeper-countries "Method"; in #who-q4 "Background"; in #who-q4 "Method"
  - week05: in #heaps "Does the curve flatten?"
  - template: in #first "More numbers"

### drawer-3: 1 × (week04 1)

```html
<details class="rx-drawer"><summary>T</summary><div class="rx-drawer-body"><p class="sub">…</p><p class="sub">…</p><p class="sub">…</p><table class="ego">…</table><p class="sub">…</p><p class="sub">…</p><p class="sub">…</p></div></details>
```

- `<Drawer label>`:
  - week04: in #place-start "Background"

### drawer-4: 3 × (week04 3)

```html
<details class="rx-drawer"><summary>T</summary><div class="rx-drawer-body"><p>…</p><p>…</p><p>…</p></div></details>
```

- `<Drawer label>`:
  - week04: in #place-start "More numbers"; in #place-who "More numbers"; in #staffing-community-stats "Method"

### drawer-5: 1 × (week04 1)

```html
<details class="rx-drawer"><summary>T</summary><div class="rx-drawer-body"><p class="sub">…</p><div class="axis-modes" role="group" aria-label="Colour cities by">…</div><div class="region-legend" id></div><div class="plot" style>…</div><div class="plot">…</div></div></details>
```

- `<Drawer label>`:
  - week04: in #place-start "Maps: groups and Census regions"

### drawer-6: 1 × (week04 1)

```html
<details class="rx-drawer"><summary>T</summary><div class="rx-drawer-body"><p>…</p><p>…</p><p>…</p><p>…</p><p>…</p></div></details>
```

- `<Drawer label>`:
  - week04: in #place-break "More numbers"

### drawer-7: 3 × (week04 3)

```html
<details class="rx-drawer"><summary>T</summary><div class="rx-drawer-body"><table class="ego">…</table></div></details>
```

- `<Drawer label>`:
  - week04: in #place-break "Table: 14 links that peel metros off"; in #jobs-linkcom "Table: 15 jobs in the most communities"; in #who-overlap "Table: 15 largest split clients"

### drawer-8: 1 × (week04 1)

```html
<details class="rx-drawer"><summary>T</summary><div class="rx-drawer-body"><table class="ego">…</table><p class="fineprint">…</p></div></details>
```

- `<Drawer label>`:
  - week04: in #who-movers "Table: 15 largest movers"

### drawer-9: 3 × (week04 3)

```html
<details class="rx-drawer"><summary>T</summary><div class="rx-drawer-body"></div></details>
```

- `<Drawer label>`:
  - week04: in #who-overlap "Background"; in #deeper-strength "Background"; in #deeper-perm "Method"

### drawer-10: 1 × (week04 1)

```html
<details class="rx-drawer"><summary>T</summary><div class="rx-drawer-body"><span>…</span></div></details>
```

- `<Drawer label>`:
  - week04: in #cut-catalogue "Which ones"

### drawer-11: 1 × (week04 1)

```html
<details class="rx-drawer"><summary>T</summary><div class="rx-drawer-body"><p class="sub">…</p><table class="ego">…</table><p>…</p></div></details>
```

- `<Drawer label>`:
  - week04: in #place-backbone "Method"

### drawer-12: 1 × (week04 1)

```html
<details class="rx-drawer"><summary>T</summary><div class="rx-drawer-body"><p class="sub">…</p><p class="sub">…</p></div></details>
```

- `<Drawer label>`:
  - week04: in #jobs-groups "Method"

### drawer-13: 1 × (week05 1)

```html
<details class="rx-drawer"><summary>T</summary><div class="rx-drawer-body"><p class="sub">…</p><div class="notice">…</div></div></details>
```

- `<Drawer label>`:
  - week05: in #opening "What counts as a word"

### drawer-14: 4 × (week05 4)

```html
<details class="rx-drawer"><summary>T</summary><div class="rx-drawer-body"><p>…</p><p>…</p><p>…</p><p>…</p><p>…</p><p id>…</p></div></details>
```

- `<Drawer label>`:
  - week05: in #relations "Method"; in #search "Method"; in #autocomplete "Method"; in #heaps "Method"

### drawer-15: 1 × (week05 1)

```html
<details class="rx-drawer"><summary>T</summary><div class="rx-drawer-body" id><p>…</p><p>…</p><div aria-label="Show the sentences for one label" class="w5-chips" id role="group"></div><div id></div></div></details>
```

- `<Drawer label bodyId="relations-checked">`:
  - week05: in #relations "What we read in the pages"

### drawer-16: 2 × (week05 2)

```html
<details class="rx-drawer"><summary>T</summary><div class="rx-drawer-body"><p>…</p><p>…</p><p>…</p><p>…</p><p id>…</p></div></details>
```

- `<Drawer label>`:
  - week05: in #copying "Method"; in #fame "Method"

### drawer-17: 3 × (week05 3)

```html
<details class="rx-drawer"><summary>T</summary><div class="rx-drawer-body"><div id></div></div></details>
```

- `<Drawer label>`:
  - week05: in #copying "Table: the 12 clusters"; in #fame "Table: the ten pages furthest from the line"
- `<Drawer label>` (inside another drawer's body):
  - week05: in #autocomplete-checked "Show one fake's copied run beside its source s…"

### drawer-18: 4 × (week05 3, template 1)

```html
<details class="rx-drawer"><summary>T</summary><div class="rx-drawer-body" id><p>…</p><div id></div></div></details>
```

- `<Drawer label bodyId="copying-checked">`:
  - week05: in #copying "What we read in the pages"
- `<Drawer label bodyId="search-checked">`:
  - week05: in #search "What we read in the pages"
- `<Drawer label bodyId="fame-checked">`:
  - week05: in #fame "What we read in the pages"
- `<Drawer label bodyId="first-checked">`:
  - template: in #first "What we read in the data"

### drawer-19: 1 × (week05 1)

```html
<details class="rx-drawer"><summary>T</summary><div class="rx-drawer-body"><p>…</p><p>…</p><p>…</p><p>…</p><div class="plot">…</div></div></details>
```

- `<Drawer label>`:
  - week05: in #autocomplete "More numbers"

### drawer-20: 1 × (week05 1)

```html
<details class="rx-drawer"><summary>T</summary><div class="rx-drawer-body" id><p>…</p><details class="rx-drawer">…</details></div></details>
```

- `<Drawer label bodyId="autocomplete-checked">`:
  - week05: in #autocomplete "What we read in the pages"

### drawer-21: 1 × (week05 1)

```html
<details class="rx-drawer"><summary>T</summary><div class="rx-drawer-body" id><p>…</p><div id></div><p>…</p><div id></div></div></details>
```

- `<Drawer label bodyId="heaps-checked">`:
  - week05: in #heaps "What we read in the pages"

### drawer-22: 1 × (week05 1)

```html
<details class="rx-drawer"><summary>T</summary><div class="rx-drawer-body"><p>…</p><p>…</p><p>…</p><p>…</p></div></details>
```

- `<Drawer label>`:
  - week05: in #fame "More numbers"

### drawer-23: 1 × (week05 1)

```html
<details class="rx-drawer"><summary>T</summary><div class="rx-drawer-body"><p>…</p><p>…</p><p>…</p><p>…</p><p>…</p><p>…</p><p id>…</p></div></details>
```

- `<Drawer label>`:
  - week05: in #weird "Method"

### drawer-24: 1 × (week05 1)

```html
<details class="rx-drawer"><summary>T</summary><div class="rx-drawer-body" id><p>…</p><div id></div><div class="plot">…</div></div></details>
```

- `<Drawer label bodyId="weird-checked">`:
  - week05: in #weird "What we read in the pages"

### drawer-25: 1 × (template 1)

```html
<details class="rx-drawer"><summary>T</summary><div class="rx-drawer-body"><p>…</p><p>…</p><p id>…</p></div></details>
```

- `<Drawer label>`:
  - template: in #first "Method"

### drawer-26: 1 × (template 1)

```html
<details class="rx-drawer"><summary>T</summary><div class="rx-drawer-body"><p id>…</p></div></details>
```

- `<Drawer label>`:
  - template: in #second "Method"

### drawer-27: 1 × (template 1)

```html
<details class="rx-drawer"><summary>T</summary><div class="rx-drawer-body" id><p>…</p></div></details>
```

- `<Drawer label bodyId="second-checked">`:
  - template: in #second "What we read in the data"

## Plot

Selector `div.plot`, component `post/Plot`. 53 occurrences in 25 variants.

### plot-1: 1 × (week03 1)

```html
<div class="plot"><h3>…</h3><p class="axis-note">…</p><div class="legend">…</div><div class="axis-modes" data-chart role="group" aria-label="Axis scale for the degree distribution">…</div><canvas aria-label="Chart: distribution of the number of partners per country" class="chart" height id role="img" width></canvas><div class="notice">…</div></div>
```

- `<Plot title note>`:
  - week03: in #tails "A. Distribution of partners"

### plot-2: 1 × (week03 1)

```html
<div class="plot"><h3>…</h3><p class="axis-note">…</p><div class="legend">…</div><div class="axis-modes" data-chart role="group" aria-label="Axis scale for the CCDF">…</div><canvas aria-label="Chart: CCDF of the number of partners per country" class="chart" height id role="img" width></canvas><div class="notice">…</div><details class="qa">…</details></div>
```

- `<Plot title note>`:
  - week03: in #tails "B. CCDF of partners"

### plot-3: 1 × (week03 1)

```html
<div class="plot"><h3>…</h3><p class="axis-note">…</p><p class="axis-note">…</p><p class="axis-note" id></p><div class="legend">…</div><canvas aria-label="Scatter plot: betweenness against origins (in-degree), log–log" class="chart" height id role="img" width></canvas></div>
```

- `<Plot title note>`:
  - week03: in #bridge "Betweenness vs origins (in-degree), log–log"

### plot-4: 1 × (week03 1)

```html
<div class="plot"><h3>…</h3><p class="axis-note">…</p><p class="axis-note" id></p><div class="legend">…</div><canvas aria-label="Chart: countries ranked by people against ranked by PageRank" class="chart" height id role="img" width></canvas><div class="notice">…</div></div>
```

- `<Plot title note>`:
  - week03: in #bridge "Big ≠ prestigious: rank by people, rank by Pag…"

### plot-5: 1 × (week03 1)

```html
<div class="plot"><h3>…</h3><p class="axis-note" id>…</p><canvas aria-label="Scatter plot: betweenness z-score against origins (in-degree), log x" class="chart" height id role="img" width></canvas></div>
```

- `<Plot title>`:
  - week03: in #twin "Betweenness z-score vs origins (in-degree), lo…"

### plot-6: 1 × (week03 1)

```html
<div class="plot"><h3>…</h3><p class="axis-note">…</p><div class="grid2" style>…</div></div>
```

- `<Plot title note>`:
  - week03: in #denmark "A. Denmark, in and out"

### plot-7: 1 × (week03 1)

```html
<div class="plot"><h3>…</h3><p class="axis-note">…</p><div class="legend">…</div><canvas aria-label="Chart: Denmark through time" class="chart" height id role="img" width></canvas></div>
```

- `<Plot title note>`:
  - week03: in #denmark "B. Denmark through time"

### plot-8: 1 × (week03 1)

```html
<div class="plot"><h3>…</h3><p class="axis-note">…</p><canvas aria-label="Chart: Denmark's bridge rank, 1990–2024" class="chart" height id role="img" width></canvas></div>
```

- `<Plot title note>`:
  - week03: in #denmark "C. Bridge rank, 1990–2024"

### plot-9: 1 × (week03 1)

```html
<div class="plot"><h3>…</h3><p class="axis-note">…</p><canvas aria-label="Chart: Denmark's nearest neighbours" class="chart" height id role="img" width></canvas></div>
```

- `<Plot title note>`:
  - week03: in #denmark "D. Nearest neighbours"

### plot-10: 1 × (week04 1)

```html
<div class="plot"><h3>…</h3><p class="axis-note">…</p><div class="chart-host tall" id></div></div>
```

- `<Plot title note>`:
  - week04: in #place-rank "Top cities"

### plot-11: 1 × (week04 1)

```html
<div class="plot" style><h3>…</h3><p class="axis-note">…</p><div class="chart-host map" id></div></div>
```

- `<Plot title note style>`:
  - week04: in #place-start "On the map"

### plot-12: 2 × (week04 2)

```html
<div class="plot"><h3>…</h3><p class="axis-note">…</p><div class="chart-host map" id></div></div>
```

- `<Plot title note>`:
  - week04: in #place-start "Same cities, two labelings"; in #place-backbone "Backbone at this α"

### plot-13: 8 × (week04 8)

```html
<div class="plot"><h3>…</h3><p class="axis-note">…</p><div class="chart-host short" id></div></div>
```

- `<Plot title note>`:
  - week04: in #place-who "How well each labelling matches the Louvain gr…"; in #place-break "Metros in the largest piece as the filter tigh…"; in #who-switch "Switches that stay inside the client's group"; in #who-movers "Share of clients that change group"; in #who-overlap "Clients split between two groups"; in #beyond-law "Agreement with the section 3 groups"; in #beyond-perm "Green-card filings per H-1B filing"; in #beyond-wage "Share of filings at level I or II"

### plot-14: 2 × (week04 2)

```html
<div class="plot"><h3>…</h3><div class="w4-figure-body" id></div></div>
```

- `<Plot title>`:
  - week04: in #jobs-together "The 12 most common job pairs"; in #jobs-bridges "Occupation network"

### plot-15: 3 × (week04 3)

```html
<div class="plot"><h3>…</h3><p class="axis-note">…</p><div class="w4-figure-body" id></div></div>
```

- `<Plot title note>`:
  - week04: in #jobs-split "Do outsourcers cluster jobs like random firms …"; in #jobs-groups "What each hiring cluster holds, by official gr…"; in #jobs-groups "How closely the clusters match the official gr…"

### plot-16: 2 × (week04 2)

```html
<div class="plot"><h3>…</h3><p class="axis-note">…</p><div class="chart-host" id></div></div>
```

- `<Plot title note>`:
  - week04: in #jobs-split "The largest occupations in each group"; in #place-longhaul "Distance vs weight"

### plot-17: 4 × (week04 4)

```html
<div class="plot"><h3>…</h3><p class="axis-note">…</p><div class="chart-host jobs-nmi" id></div></div>
```

- `<Plot title note>`:
  - week04: in #footprint "How much do the groups change?"; in #footprint "Do the metro groups follow Census regions?"; in #footprint-which "The largest filers removed in turn"; in #footprint-which "One firm out at a time"

### plot-18: 1 × (week04 1)

```html
<div class="plot" style><h3>…</h3><p class="axis-note">…</p><div class="w4-figure-body" id></div></div>
```

- `<Plot title note style>`:
  - week04: in #place-backbone "Giant component vs α"

### plot-19: 1 × (week04 1)

```html
<div class="plot"><h3>…</h3><p class="axis-note">…</p><div class="select-row">…</div><div class="chart-host map" id></div></div>
```

- `<Plot title note>`:
  - week04: in #place-longhaul "One employer’s map"

### plot-20: 12 × (week05 9, template 3)

```html
<div class="plot"><h3>…</h3><p class="axis-note">…</p><div id></div></div>
```

- `<Plot title note>`:
  - week05: in #relations-figure "Links that join two communities, by label"; in #copying-figure "The copying network"; in #autocomplete-figure "The eight groups the generators learn from"; in #autocomplete "Modularity of the groups against rewired netwo…"; in #heaps-figure "Types seen against tokens read"; in #heaps-figure "Each order against random, at two points"; in #fame-figure "Page length against incoming links"; in #weird-figure "Varied words against page length"; in #weird-checked "The top and bottom five, read"
  - template: in #first-figure "The figure's title: what it compares"; in #second-figure "Left panel: the network"; in #second-figure "Right panel: the numbers behind it"

### plot-21: 1 × (week05 1)

```html
<div class="plot"><h3>…</h3><p class="axis-note">…</p><div aria-label="Which links to draw" class="w5-chips" id role="group">…</div><div id></div></div>
```

- `<Plot title note>`:
  - week05: in #relations-figure "Where the fight and family links run"

### plot-22: 1 × (week05 1)

```html
<div class="plot"><h3>…</h3><p class="axis-note">…</p><p aria-live class="w5-scoreboard" id></p><p class="w5-caption" id></p><div class="w5-fake">…</div><div class="w5-guess">…</div><div class="w5-quiz-nav">…</div><div aria-live class="w5-reveal" id hidden=""></div></div>
```

- `<Plot title note>`:
  - week05: in #autocomplete-figure "Guess the community"

### plot-23: 3 × (styleguide 3)

```html
<div class="plot"><h3>…</h3><p class="axis-note">…</p><canvas class="chart" height width></canvas></div>
```

- `<Plot title note>`:
  - styleguide: in #components ".grid-side · a wide plot beside a narrow panel"; in #components ".grid-pair · two linked visuals side by side"; in #components "A. .plot with .chart"

### plot-24: 1 × (styleguide 1)

```html
<div class="plot"><h3>…</h3><p class="axis-note">…</p><table class="ego">…</table></div>
```

- `<Plot title note>`:
  - styleguide: in #components "B. table.ego"

### plot-25: 1 × (styleguide 1)

```html
<div class="plot"><h3>…</h3><p class="axis-note">…</p><div class="stage-wrap">…</div></div>
```

- `<Plot title note>`:
  - styleguide: in #components "C. .stage-wrap · .stage-hint"

## Week 4 figure

Selector `figure.w4-figure`, component `post/W4Figure`. 31 occurrences in 4 variants.

### figure-1: 18 × (week04 18)

```html
<figure class="w4-figure"><figcaption><b>…</b><span>…</span></figcaption><div class="w4-figure-body" data-strip></div></figure>
```

- `<W4Figure title caption>`:
  - week04: in #place "Weak but real"; in #jobs "Real, not noise"; in #who "Weak groups, beyond chance"; in #who "One client, many vendors"; in #beyond "Three small answers"; in #closing "Five weak groups, none of them noise"; in #who-q2 "Groups against rewired networks"; in #who-q2 "Match with vendor and industry"; in #who-q3 "One firm, many clients, few filings"; in #who-q3 "How concentrated the big clients are"; in #staffing-community-stats "Modularity with and without filing counts"; in #staffing-ties "Heavy links, looser neighbourhoods"; in #staffing-ties "Wage levels as filed"; in #staffing-lawyers "Who uses an outside law firm"; in #staffing-lawyers "The five largest law firms"; in #staffing-lottery "Do high firms cluster?"; in #staffing-lottery "Agreement with the groups"; in #who-q4 "Consecutive years against the same year"

### figure-2: 3 × (week04 3)

```html
<figure class="w4-figure"><figcaption><b>…</b><span>…</span></figcaption><div class="w4-figure-body" id></div></figure>
```

- `<W4Figure title caption>`:
  - week04: in #jobs-linkcom "Where the links go"; in #jobs-linkcom "The 15 jobs with the most communities per link"; in #jobs-bridges "Occupations passing each rule"

### figure-3: 3 × (week04 3)

```html
<figure class="w4-figure"><figcaption><b>…</b><span>…</span></figcaption><div class="w4-vis-stack"><div class="w4-figure-body" data-strip></div><div class="w4-figure-body" data-strip></div></div></figure>
```

- `<W4Figure title caption>`:
  - week04: in #who-q1 "The lottery funnel"; in #who-q1 "A filing, a client, a denial"; in #who-q4 "2026 so far, against a year earlier"

### figure-4: 7 × (week04 7)

```html
<figure class="w4-figure"><figcaption><b>…</b><span>…</span></figcaption><div class="w4-figure-body" data-more></div></figure>
```

- `<W4Figure title caption>`:
  - week04: in #deeper-density "Filings per 1,000 jobs"; in #deeper-strength "The heaviest one-to-one ties"; in #deeper-lottery "Every draw since 2020"; in #deeper-lottery "Registrations per approved petition"; in #deeper-perm "Green cards per 100 H-1B filings"; in #deeper-countries "Citizenship of 2023's green cards"; in #deeper-countries "Do countries group?"

## Figure row

Selector `div.rx-fig-row`, component `post/FigRow`. 12 occurrences in 2 variants.

### figrow-1: 3 × (week04 3)

```html
<div class="rx-fig-row"><div class="plot">…</div><div class="plot">…</div></div>
```

- `<FigRow>`, children: div.plot, div.plot:
  - week04: in #jobs-split; in #footprint; in #footprint-which

### figrow-2: 9 × (week04 9)

```html
<div class="rx-fig-row"><figure class="w4-figure">…</figure><figure class="w4-figure">…</figure></div>
```

- `<FigRow>`, children: figure.w4-figure, figure.w4-figure:
  - week04: in #who; in #who-q1; in #who-q3; in #staffing-ties; in #staffing-lawyers; in #staffing-lottery; in #deeper-lottery; in #deeper-countries; in #who-q4

## QA disclosure

Selector `details.qa`, component `post/QaDisclosure`. 17 occurrences in 13 variants.

### qa-1: 1 × (week03 1)

```html
<details class="qa"><summary><span class="qa-cue">…</span></summary><div class="qa-body"><p class="sub">…</p><table class="ego">…</table><p class="sub">…</p><div class="notice">…</div></div></details>
```

- `<QaDisclosure cue>`:
  - week03: in #tails "Is it a power law? We fitted it"

### qa-2: 1 × (week03 1)

```html
<details class="qa" id><summary><span class="qa-cue">…</span></summary><div class="qa-body"><article class="qa-item">…</article><article class="qa-item">…</article><article class="qa-item">…</article><article class="qa-item">…</article><article class="qa-item">…</article><article class="qa-item">…</article><div class="notice">…</div></div></details>
```

- `<QaDisclosure id="questions" cue>`:
  - week03: #questions "The six questions"

### qa-3: 1 × (week03 1)

```html
<details class="qa" id><summary>T</summary><p class="sub"><b>…</b>␣|T</p><p class="sub"><b>…</b>␣|T</p></details>
```

- page-local: the summary has no span.qa-cue and there is no qa-body (Week 3's QaItem):
  - week03: #cliques "The two largest cliques, by name"

### qa-4: 1 × (week03 1)

```html
<details class="qa" id><summary><span class="qa-cue">…</span></summary><div class="qa-body"><p aria-live class="status-line" id></p><article class="qa-item">…</article><article class="qa-item">…</article><div class="notice">…</div><article class="qa-item">…</article><article class="qa-item">…</article></div></details>
```

- `<QaDisclosure id="views" cue>`:
  - week03: #views "The four extra views"

### qa-5: 1 × (week03 1)

```html
<details class="qa" id><summary><span class="qa-cue">…</span></summary><div class="qa-body"><div class="grid2">…</div></div></details>
```

- `<QaDisclosure id="methods-drawer" cue>`:
  - week03: #methods-drawer "Sources, methods and limits"

### qa-6: 3 × (week04 1, week05 1, template 1)

```html
<details class="qa" id><summary><span class="qa-cue">…</span></summary><div class="qa-body"><p class="sub">…</p><p class="sub">…</p></div></details>
```

- `<QaDisclosure id="closing-ai" cue>`:
  - week04: #closing-ai "AI use and how we checked it"
  - week05: #closing-ai "AI use and how we checked it"
  - template: #closing-ai "AI use and how we checked it"

### qa-7: 1 × (week04 1)

```html
<details class="qa cut rx-panel" data-box id name="w4-panel-where"><summary><span class="qa-cue">…</span></summary><div class="qa-body cut-body" id><p class="w4-box-intro">…</p><p aria-live class="status-line" id>…</p><div class="w4m" id hidden="">…</div></div></details>
```

- `<QaDisclosure className="qa cut rx-panel" box="cut-methods" id="cut-methods" name="w4-panel-where" cue bodyClass="qa-body cut-body" bodyId="methods-body">`:
  - week04: #cut-methods "The course's four community methods, step by s…"

### qa-8: 2 × (week04 2)

```html
<details class="qa cut rx-panel" data-box id name="w4-panel-jobs"><summary><span class="qa-cue">…</span></summary><div class="qa-body cut-body" id><p aria-live class="status-line" id>…</p></div></details>
```

- `<QaDisclosure className="qa cut rx-panel" box="cut-skills" id="cut-skills" name="w4-panel-jobs" cue bodyClass="qa-body cut-body" bodyId="skills-body">`:
  - week04: #cut-skills "Skills behind the jobs, from O*NET"
- `<QaDisclosure className="qa cut rx-panel" box="cut-pagerank" id="cut-pagerank" name="w4-panel-jobs" cue bodyClass="qa-body cut-body" bodyId="pagerank-body">`:
  - week04: #cut-pagerank "PageRank on the jobs network, step by step"

### qa-9: 1 × (week04 1)

```html
<details class="qa cut rx-panel" data-box id name="w4-panel-years"><summary><span class="qa-cue">…</span></summary><div class="qa-body cut-body" id><p aria-live class="status-line" id>…</p></div></details>
```

- `<QaDisclosure className="qa cut rx-panel" box="cut-years" id="cut-years" name="w4-panel-years" cue bodyClass="qa-body cut-body" bodyId="years-body">`:
  - week04: #cut-years "Five years of filings, 2022 to 2026"

### qa-10: 1 × (week04 1)

```html
<details class="qa cut rx-panel" data-box id name="w4-panel-years"><summary><span class="qa-cue">…</span></summary><div class="qa-body cut-body" id><p class="w4-box-intro">…</p><div class="card w4-card" id>…</div></div></details>
```

- `<QaDisclosure className="qa cut rx-panel" box="cut-roles" id="cut-roles" name="w4-panel-years" cue bodyClass="qa-body cut-body" bodyId="roles-body">`:
  - week04: #cut-roles "Who filed for which roles, 2022 to 2026"

### qa-11: 1 × (week04 1)

```html
<details class="qa cut rx-topic" id name="w4-topic"><summary><span class="qa-cue">…</span></summary><div class="rx-topic-bar"><a class="rx-back" href="#cut">…</a><div>…</div><span class="rx-topic-count"></span></div><div class="qa-body"><p class="sub">…</p><dl class="w4-sources">…</dl></div></details>
```

- page-local: div.rx-topic-bar between summary and body (Week 4's RxTopic):
  - week04: #evidence "Data and methods"

### qa-12: 2 × (week05 1, template 1)

```html
<details class="qa" id><summary><span class="qa-cue">…</span></summary><div class="qa-body"><p class="sub">…</p><ul class="w5-methods">…</ul></div></details>
```

- `<QaDisclosure id="methods" cue>`:
  - week05: #methods "Methods, data and AI use"
  - template: #methods "Methods, data and AI use"

### qa-13: 1 × (styleguide 1)

```html
<details class="qa" open=""><summary><span class="qa-cue">…</span></summary><div class="qa-body"><article class="qa-item">…</article></div></details>
```

- page-local: rendered open (`open=""`); R5 gives QaDisclosure no open prop:
  - styleguide: in #components "Here you can learn more"

## Anatomy

Selector `div.w4-anatomy`, component `post/Anatomy`. 4 occurrences in 3 variants.

### anatomy-1: 1 × (week04 1)

```html
<div class="w4-anatomy"><h3>T</h3><p>T</p><dl><div><dt>…</dt><dd>…</dd><span class="w4-tag access">…</span></div><div><dt>…</dt><dd>…</dd><span class="w4-tag">…</span></div><div><dt>…</dt><dd>…</dd><span class="w4-tag">…</span></div><div><dt>…</dt><dd>…</dd><span class="w4-tag">…</span></div><div><dt>…</dt><dd>…</dd><span class="w4-tag">…</span></div><div><dt>…</dt><dd>…</dd><span class="w4-tag">…</span></div></dl></div>
```

- `<Anatomy title intro rows>`, 6 rows, 6 with a tag (tagClass "w4-tag access"):
  - week04: in #opening "What one filing names"

### anatomy-2: 1 × (week04 1)

```html
<div class="w4-anatomy w4-anatomy--pair"><h3>T</h3><dl><div><dt>…</dt><dd>…</dd></div><div><dt>…</dt><dd>…</dd></div><div><dt>…</dt><dd>…</dd></div></dl></div>
```

- `<Anatomy className="w4-anatomy w4-anatomy--pair" title rows>`, 3 rows:
  - week04: in #who "Words in this section"

### anatomy-3: 2 × (week05 1, template 1)

```html
<div class="w4-anatomy"><h3>T</h3><p>T</p><dl><div><dt>…</dt><dd>…</dd></div><div><dt>…</dt><dd>…</dd></div><div><dt>…</dt><dd>…</dd></div><div><dt>…</dt><dd>…</dd></div></dl></div>
```

- `<Anatomy title intro rows>`, 4 rows:
  - week05: in #opening "How each section reads"
  - template: in #opening "How each section reads"

## How to read

Selector `div.w4-howto`, component `post/HowTo`. 3 occurrences in 2 variants.

### howto-1: 1 × (week04 1)

```html
<div class="w4-howto"><h3>T</h3><div><i class="w4-sw-real"></i><b>T</b><span>T</span></div><div><i class="w4-sw-band"></i><b>T</b><span>T</span></div><div><i class="w4-sw-people"></i><b>T</b><span>T</span></div><div><i class="w4-sw-access"></i><b>T</b><span>T</span></div><div><i class="w4-sw-ref"></i><b>T</b><span>T</span></div><div><i class="w4-sw-groups"><b class="g0"></b><b class="g1"></b><b class="g2"></b></i><b>T</b><span>T</span></div></div>
```

- `<HowTo rows>`, 6 rows, 1 with swatchChildren:
  - week04: in #opening

### howto-2: 2 × (week05 1, template 1)

```html
<div class="w4-howto"><h3>T</h3><div><i class="w4-sw-real"></i><b>T</b><span>T</span></div><div><i class="w4-sw-band"></i><b>T</b><span>T</span></div><div><i class="w4-sw-ref"></i><b>T</b><span>T</span></div></div>
```

- `<HowTo rows>`, 3 rows:
  - week05: in #opening
  - template: in #opening
