---
category: Week 6
---

### EssentialsCard({ part })

One section of the Week 6 essentials page, whole, as the page renders it:

1. the section opener: its number, title and the finding in one line;
2. the card: the question and the short answer, the essentials it uses, what we did, a
   "Compared to what" note with the baseline, the explorable in its `Plot`, and the Method drawer.

The explorable inside is `EssentialsPart`, and it loads its JSON from the live site.

| `part` | Section |
| --- | --- |
| `weights` | 1 · IDF finds Marvel's own stopwords |
| `cosine` | 2 · Weighting is what makes similarity mean anything |
| `contrast` | 3 · Pronouns split women's pages from men's beyond chance |
| `topics` | 4 · Topics move when the seed moves |
| `contexts` | 5 · A word's row is mostly the and and |
| `pmi` | 6 · Association, not frequency, finds the meaning |
| `vectors` | 7 · Prediction packs a row into 100 numbers |
| `glove` | 8 · General English and Marvel English disagree |

Use one card on its own, or several in a row inside `<div className="shell">`, as the page does.
For the whole page, use `EssentialsPage`.

```tsx
<EssentialsCard part="cosine" />
```
