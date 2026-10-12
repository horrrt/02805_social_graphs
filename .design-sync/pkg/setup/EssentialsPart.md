---
category: Week 6
---

### EssentialsPart({ part })

The eight explorables of the Week 6 essentials page, one per pair of terms on the week's list, all
on the course's 303 Marvel pages. Each loads its own `weeks/week06/data/essentials-<part>.json` from
the live site; nothing is passed in.

| `part` | What it draws |
| --- | --- |
| `weights` | A page's words by raw count and by TF-IDF |
| `cosine` | Two pages' cosine, word by word |
| `contrast` | Every word's frequency rank on women's and men's pages |
| `topics` | The topics of one LDA fit, and one page's mixture |
| `contexts` | One word's row of the word-context matrix |
| `pmi` | One word's neighbours by count, PMI and PPMI |
| `vectors` | Nearest words under PPMI, skip-gram and CBOW |
| `glove` | Nearest words in GloVe and in the Marvel skip-gram |

Wrap each in `Plot` with its title, as the essentials page does.

```tsx
<Plot title="A page's words by raw count and by TF-IDF">
  <EssentialsPart part="weights" />
</Plot>
```
