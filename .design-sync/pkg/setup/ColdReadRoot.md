---
category: Setup
---

### ColdReadRoot({ children })

The page root for Cold Read, the Week 6 game. It takes the `corridor` class off `<body>` and puts
`cold-read` on, where the game's tokens live: the site's navy, ground and card colours plus the
rarity (`--r-common` to `--r-legendary`), heat (`--h-found` to `--h-cold`) and topic (`--t0` to
`--t7`) colours. It renders its children as they are.

Put `Frame` inside it, the game's header, title and footer, and one round or the `Campaign` inside
that. The rounds load their decks, word vectors and portraits from the live site, so they show a
short "Shuffling the decks…" note first.

```tsx
<ColdReadRoot>
  <Frame page="practice" home="./">
    <ClueShop />
  </Frame>
</ColdReadRoot>
```

Rounds, in campaign order: `ClueShop` (TF-IDF), `WhoseLine` (comparing groups), `MixDesk` (topic
models), `Tezguino` (context and PPMI), `HotCold` (word vectors). `Campaign` plays all five in a row. `LEVELS` lists
them with name, topic and blurb, as the practice menu shows them.
