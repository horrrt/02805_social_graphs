# Game lists by category

1,770 games in 17 lists (1,554 distinct titles; some games sit in more than one list). Research agents built each list from at least five authoritative sources: Wikipedia's genre and best-seller lists, Metacritic, publisher sales figures, the World Video Game Hall of Fame, Steam rankings, BoardGameGeek, award winners and major outlets' best-of lists. Games are ranked by how many sources include them; each list says how it broke ties and links its sources.

Every row links the game's Wikipedia article and the game itself (official site, else Steam, BoardGameGeek or MobyGames, from Wikidata), and gives the core loop, a build size (S: one session in a browser; M: a few sessions; L: only a stripped-down version is realistic) and the course idea the mechanic could teach. ★ marks games where winning requires that idea.

**Source of truth:** [games.json](games.json). Edit it, then run `python scripts/game_catalogue.py render`; the Markdown is generated. Each game carries `concepts`, fixed tags mapped from its free-text idea, so finding games for a concept is a filter:

```bash
jq -r '.lists[] | .label as $l | .games[] | select(.concepts | index("centrality")) | "\($l) #\(.rank) \(.name)"' project/games/games.json
```

| List | Games | Sources | Top three | ★ | Links | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| [Arcade](arcade.md) | 100 | 9 | Pac-Man, Space Invaders, Donkey Kong | 2 | 96 Wikipedia, 88 game | Ranks 74 to 100 rest on one source each. |
| [Strategy](strategy.md) | 100 | 15 | Rome: Total War, Command & Conquer, Warcraft III: Reign of Chaos | 5 | 98 Wikipedia, 98 game | Tycoon and business sims are left out; one row per series. |
| [Platform](platform.md) | 100 | 14 | Banjo-Kazooie, Super Mario 64, Super Mario World | 0 | 100 Wikipedia, 98 game | Remakes count toward the original. |
| [Shoot 'em up](shoot-em-up.md) | 100 | 13 | R-Type, Ikaruga, Batsugun | 0 | 91 Wikipedia, 85 game | The Shmups Forum poll is confirmed through a mirror post. |
| [Survival](survival.md) | 100 | 16 | Don't Starve, Valheim, Subnautica | 1 | 86 Wikipedia, 85 game | Steam 250 stands in for SteamDB, which blocked the agent. |
| [Rhythm](rhythm.md) | 100 | 13 | Guitar Hero (series; Guitar Hero III sold over US$1 billion), Beat Saber, Rock Band (series) | 0 | 93 Wikipedia, 82 game | 43 games rest on one source, mostly Wikipedia's list of music games. |
| [Survival horror](survival-horror.md) | 100 | 10 | Resident Evil 4 (and 2023 remake), Dead Space (and 2023 remake), Silent Hill 2 (and 2024 remake) | 3 | 99 Wikipedia, 96 game | IGN's list is cited through a site that republished it. |
| [Adventure](adventure.md) | 100 | 12 | Grim Fandango, The Walking Dead, Myst | 9 | 99 Wikipedia, 94 game | Includes detective and deduction games. |
| [Puzzle](puzzle.md) | 100 | 17 | Tetris, The Talos Principle, Antichamber | 12 | 96 Wikipedia, 92 game | Pen-and-paper logic types are in the logic list instead. |
| [Logic](logic.md) | 100 | 14 | Sudoku, Nonogram (Picross, Pic-a-Pix), Slitherlink (Loopy) | 57 | 73 Wikipedia, 15 game | Ties are ordered by judgement; few sources give sales figures. Pen-and-paper types rarely have a game link. |
| [Tower defense](tower-defense.md) | 100 | 12 | Kingdom Rush, Plants vs. Zombies, Bloons TD 6 | 18 | 89 Wikipedia, 79 game | Metacritic, IGN and GameSpot blocked the agent; PCGamesN entries come from a search summary. Ranks 89 to 100 rest on one source. |
| [Turn-based strategy](turn-based-strategy.md) | 100 | 21 | Sid Meier's Civilization (series), XCOM: Enemy Unknown and XCOM 2, Final Fantasy Tactics | 5 | 91 Wikipedia, 82 game | Total War and Paradox grand strategy are in the strategy list, because their main play runs in real time. |
| [Board games](board-games.md) | 140 | 10 | Azul, Catan, Wingspan | 20 | 134 Wikipedia, 133 game | Rows 101 to 140 add classics that just missed, such as Ludo, Xiangqi and Shogi. |
| [Nintendo](nintendo.md) | 130 | 15 | Pokémon Red and Green (incl. Blue, Yellow, FireRed and LeafGreen), Super Mario Bros., The Legend of Zelda: Ocarina of Time | 2 | 130 Wikipedia, 128 game | Every game at 10 million copies or more is in; rows 101 to 130 are well-reviewed games the sales rule pushed out. |
| [2D (2000 on)](2d.md) | 100 | 23 | Stardew Valley, Papers, Please, Hollow Knight | 8 | 98 Wikipedia, 97 game | Released 2000 or later, to complement the retro list. |
| [Retro (1972 to 1999)](retro.md) | 100 | 15 | Super Mario Kart (incl. Mario Kart 64), SimCity (incl. SimCity 2000), Pokémon Red and Green / Red and Blue (incl. Gold and Silver) | 11 | 99 Wikipedia, 96 game | Games that debuted in arcades are in the arcade list instead. |
| [Flash](flash.md) | 100 | 12 | The Fancy Pants Adventure, Pico's School, Alien Hominid | 4 | 73 Wikipedia, 53 game | The thinnest sourcing: two of the sources are overlapping Wikipedia membership lists, and some ties were ordered by judgement. |

## Games per concept

| Concept | Tag | Games | ★ |
| --- | --- | --- | --- |
| Degree and hubs | `degree-hubs` | 6 | 3 |
| Paths, shortest paths, BFS | `paths` | 143 | 44 |
| Small worlds | `small-worlds` | 1 | 0 |
| Random graphs and null models | `random-graphs` | 1 | 0 |
| Robustness, targeted attacks | `robustness` | 22 | 5 |
| Communities, modularity | `communities` | 11 | 0 |
| Centrality: betweenness, PageRank | `centrality` | 13 | 1 |
| Clustering, triangles | `clustering` | 3 | 1 |
| Preferential attachment, rich-get-richer growth | `preferential-attachment` | 6 | 0 |
| Bipartite networks and projection | `bipartite` | 8 | 3 |
| Homophily | `homophily` | 6 | 0 |
| Spreading and contagion | `spreading` | 25 | 7 |
| Random walks | `random-walks` | 10 | 1 |
| Directed graphs, trees, DAGs | `directed-graphs` | 140 | 17 |
| Flows on networks | `flows` | 46 | 11 |
| Search engines, TF-IDF | `search-tfidf` | 3 | 3 |
| Word frequency, Zipf's law | `word-frequency` | 1 | 0 |
| Topic models | `topic-models` | 1 | 0 |
| Word context, PMI | `word-context` | 6 | 2 |
| Word embeddings, cosine similarity | `embeddings` | 3 | 1 |
| Comparing groups | `comparing-groups` | 4 | 0 |
| Deduction by elimination, information gain | `deduction` | 89 | 54 |
| Probability, estimation | `probability` | 83 | 9 |
