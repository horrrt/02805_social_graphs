# Week 5 glossary terms

Main's Week 5 scripts call `termify()` (`src/scripts/week04-ui.js`) 21 times, on eight server-rendered
elements. This file records each call so the section batches can replace it with `TermProse` (W5-2:
relations, copying, autocomplete; W5-3: search, heaps, fame, weird). Source:
`scripts/parity/fixtures/terms/week05.json`, captured on main.

## How main places a term

- `termify(el, phrase, definition, id)` walks the text nodes under `el` in document order and wraps the first
  occurrence of `phrase` in the first text node that holds it, skipping text inside `svg`, `.w4-term`,
  `button`, `summary`, `h1` to `h4`, `legend`, `.w4-legend`, `table` and `caption`. A phrase the element does
  not contain places nothing.
- Calls run in module order, and each later call searches the text nodes the earlier calls left. Pass the
  matched terms to `TermProse` in this order. A call that matches nothing places nothing and splits nothing
  (10 of the 21 on main), so `TermProse` can leave it out. Each definition it carries adds to the page's
  payload, and static parity fails a page whose gzipped HTML grows by more than 2%: the template skipped
  `TermProse` for that reason (`src/features/template/charts.tsx`).
- Every call runs after its module's data has loaded: at module top level after `await loadData(…)`, and for
  search inside `boot()` after `Promise.all` of `search.json` and `search_live.json`. The calls also run after
  the drawing code above them in the module, so a failed load or an earlier throw leaves the prose plain.
- Relations places its terms before it awaits `network.json` (`week05-relations.js:88`), so its terms wait for
  `relations.json` only.

## What each section wraps

`QuestionCard` renders the `#<section>-did` and `#<section>-surprise` boxes itself, so `TermProse` wraps the
element inside the box and finds it through `roots`, as the template's `#second-did p` does. No new id.

| Element | TermProse target | roots | after | Slot, chart host or island inside |
| --- | --- | --- | --- | --- |
| `#relations-did` | `p.sub` (`as="p" className="sub"`) | `#relations-did p` | `weeks/week05/data/relations.json` | none |
| `#copying-did` | `p.sub` | `#copying-did p` | `weeks/week05/data/copying.json` | none |
| `#search-did` | `p.sub` | `#search-did p` | `weeks/week05/data/search.json`, `weeks/week05/data/search_live.json` | none |
| `#autocomplete-did` | `p.sub` | `#autocomplete-did p` | `weeks/week05/data/autocomplete.json` | none |
| `#heaps-did` | `p.sub` | `#heaps-did p` | `weeks/week05/data/heaps.json` | none |
| `#heaps-surprise` | `div.notice` (`as="div" className="notice"`, with `span.ico` and the body span as `Notice` renders them) | `#heaps-surprise .notice` | `weeks/week05/data/heaps.json` | none |
| `#fame-did` | `p.sub` | `#fame-did p` | `weeks/week05/data/fame.json` | none |
| `#weird-did` | `p.sub` | `#weird-did p` | `weeks/week05/data/weird.json` | none |

- Each `did` box holds one `p.sub` and nothing else, and every term the calls place lands in that paragraph's
  text.
- In `#heaps-surprise` the term "types" lands in the notice's body span, in the text after
  `<b>What to notice</b>` and its `{" "}`. That span is the narrowest element holding it, but it has no class
  or id, so the target is its parent `div.notice`.
- `#chart-copying-linked` sits in `#copying-surprise`, beside the notice. No call touches `#copying-surprise`,
  and `#copying-did` holds no chart host.
- None of the eight targets contains a slot, a chart host or an island, so `TermProse` takes each as it stands.

## Every call

Order counts within one module. "Matched" says whether main placed the term; the table keeps all 21 as the
record of main's calls.

| Call | Element | Order | Phrase | Id | Matched on main | Definition |
| --- | --- | ---: | --- | --- | --- | --- |
| `week05-relations.js:81` | `#relations-did` | 1 | Louvain | `w5-term-relations-louvain` | no | A method that finds groups in a network by moving nodes between groups until the links inside groups are as dense as they can get. Two runs can differ, so we use 100. |
| `week05-relations.js:82` | `#relations-did` | 2 | communities | `w5-term-relations-communities` | yes | Groups of characters linked more among themselves than to the rest of the network. |
| `week05-copying.js:129` | `#copying-did` | 1 | 8-gram | `w5-term-copying-ngram` | no | A run of eight words in a row, in the order they appear on the page. |
| `week05-copying.js:130` | `#copying-did` | 2 | house style | `w5-term-copying-house` | yes | Wording Wikipedia editors repeat on page after page, such as the first sentence of almost every character's article. |
| `week05-search.js:166` | `#search-did` | 1 | Bag of Words | `w5-term-search-bow` | yes | A page or a query as a list of word counts, with the word order thrown away. |
| `week05-search.js:167` | `#search-did` | 2 | cosine similarity | `w5-term-search-cosine` | yes | How close two count vectors point: their dot product divided by both their lengths, from 0 (no shared word) to 1 (the same proportions). |
| `week05-search.js:168` | `#search-did` | 3 | document-term matrix | `w5-term-search-dtm` | no | A table with one row per page, one column per word and the counts inside. |
| `week05-search.js:169` | `#search-did` | 4 | stopwords | `w5-term-search-stop` | yes | Very common words such as the, of and with, dropped before counting. |
| `week05-autocomplete.js:156` | `#autocomplete-did` | 1 | Louvain | `w5-term-autocomplete-louvain` | no | A method that finds groups in a network by moving pages between groups until the links inside groups are as dense as they can get. Two runs can differ, so we ran it 100 times. |
| `week05-autocomplete.js:157` | `#autocomplete-did` | 2 | normalised mutual information | `w5-term-autocomplete-nmi` | no | How much two ways of splitting the same pages into groups agree: 1 when they are identical, near 0 when they are unrelated. |
| `week05-autocomplete.js:158` | `#autocomplete-did` | 3 | trigram model | `w5-term-autocomplete-trigram` | yes | A table of how often each word follows each pair of words. It predicts the next word from the two before it. |
| `week05-heaps.js:197` | `#heaps-did` | 1 | Heaps' law | `w5-term-heaps-law` | no | An empirical rule for text: the number of distinct words grows with the number of words read as a power below 1, so it keeps rising but ever more slowly. |
| `week05-heaps.js:198` | `#heaps-did` | 2 | tokens | `w5-term-heaps-tokens` | yes | Words as they occur on the page: "the Hulk smashes the tank" has 5 tokens. |
| `week05-heaps.js:199` | `#heaps-surprise` | 3 | types | `w5-term-heaps-types` | yes | Distinct words: "the Hulk smashes the tank" has 4 types, since "the" comes twice. |
| `week05-heaps.js:200` | `#heaps-did` | 4 | random orders | `w5-term-heaps-random` | yes | The same 303 pages shuffled into a random order, 500 times with fixed seeds. Their spread shows how much the count moves by chance. |
| `week05-fame.js:122` | `#fame-did` | 1 | in-degree | `w5-term-fame-indegree` | yes | The number of pages that link to a page. Here only links among the 303 Marvel pages count. |
| `week05-fame.js:123` | `#fame-did` | 2 | isolates | `w5-term-fame-isolates` | no | Pages with no links in or out: no page links to them and they link to none. |
| `week05-fame.js:124` | `#fame-did` | 3 | residual | `w5-term-fame-residual` | no | How far a page sits from the fitted line. Above zero, the page is longer than its links predict; below zero, shorter. |
| `week05-weird.js:140` | `#weird-did` | 1 | MATTR | `w5-term-weird-mattr` | yes | Moving-average type-token ratio: the share of different words in each 100-word window of a page, averaged over every window. |
| `week05-weird.js:141` | `#weird-did` | 2 | z-score | `w5-term-weird-z` | no | How many standard deviations a value sits above (+) or below (−) the mean of the group it is compared with. |
| `week05-weird.js:142` | `#weird-did` | 3 | House phrasing | `w5-term-weird-house` | no | Wording Wikipedia editors repeat on page after page, such as the first sentence of almost every character's article. |

- `week05-weird.js:140` builds the MATTR definition from the window constant `W` (100). The text above is the
  definition as main shows it.
- The two Louvain terms carry different definitions (relations: "moving nodes … so we use 100";
  autocomplete: "moving pages … so we ran it 100 times"). Neither matches on main.
