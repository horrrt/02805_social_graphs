---
category: Setup
---

### CorridorRoot({ children, page })

The page root for every kit component, as the site's post layout renders it. It adds the `corridor` class to
`<body>` and renders `<main class="shell">`, the centred column (1180px wide, 24px side padding).

- The colour tokens (`--ink`, `--ink-soft`, `--ground`, `--card`, `--line` and the series colours) are defined
  on `.corridor`, and the charts read them from `<body>`. Without the class, text and tables lose their
  styling and charts draw without colours.
- Tables are styled as white cards only inside `<main>` (`.corridor main table`).

Wrap a whole design in it once. Do not nest a second `<main>` inside it.

`page` renders the children without the `<main class="shell">` wrapper, for a whole post laid out as the
site lays it out: the topbar and footer sit outside `<main>`, and the hero runs full width inside it.

```tsx
<CorridorRoot page>
  <SkipLink />
  <PostTopbar root="../../" siteLink navLabel="Sections of this post" links={[{ href: "#opening", label: "Opening" }]} />
  <main id="main">
    <PostHero id="hero" eyebrow="Week 5" title="…" body={…} caution={…} stats={…} />
    <div className="shell">
      <PostSection id="opening">…</PostSection>
    </div>
  </main>
  <SiteFooter>…</SiteFooter>
</CorridorRoot>
```

```tsx
<CorridorRoot>
  <StripChart rows={rows} opts={opts} />
</CorridorRoot>
```
