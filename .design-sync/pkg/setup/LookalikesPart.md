---
category: Week 6
---

### LookalikesPart({ part })

Every figure on the Week 6 post, "Why do two Marvel pages read alike?", by name. Each loads
`weeks/week06/data/lookalikes.json` from the live site (TF-IDF on the 303 Marvel pages, with and
without names) and draws the post's own figure; nothing is passed in.

| `part` | What it draws |
| --- | --- |
| `hero` | Storm's four nearest pages with names kept and removed, side by side (the hero panel) |
| `1`, `2`, `3` | The findings strip's mini charts, one per section |
| `explore` | The explorer: pick a character, its ten nearest pages with and without names |
| `ladder` | Linked pages among each page's ten nearest, per representation, against a matched removal and ten random pages |
| `lean` | Share of all ten-nearest slots that go to pages about women |
| `gap` | Women's lists against men's, against 1,000 label shuffles |
| `ladderTable`, `distance`, `words` | The drawers' tables |
| `readKept`, `readRemoved` | The pairs read by hand, names kept and removed |

Put a chart inside `Plot` (title and note), and `lean` with `gap` in one `div.w5-two` row, as the
post does. `hero` sits on the dark hero: wrap it in `PostHero`'s figure.

```tsx
<Plot title="Linked pages among each page's ten nearest" note="Mean over the 303 pages.">
  <LookalikesPart part="ladder" />
</Plot>
```
