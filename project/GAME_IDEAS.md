# 100 games simple enough to rebuild

The sourced lists by category, 1,770 games in 17 lists, are in [games/](games/README.md). This page is the first, hand-written list.

A menu for more teaching games like Cold Read. Every game here has one core loop and fits in a single browser page.

**Build** sizes:
- **S**: one session, about the size of a Cold Read round.
- **M**: a few sessions. These need an opponent, physics, generated levels or a large word list.

**Could teach** names the course idea the game's mechanic fits best. ★ marks the 25 strongest fits, where winning the game requires using the concept.

## Daily and word games

| # | Game | Core loop | Build | Could teach |
| --- | --- | --- | --- | --- |
| 1 | Wordle | Six guesses at a five-letter word; each letter turns green, yellow or grey | S | Information gain: each guess should split the remaining candidates |
| 2 | Absurdle | Wordle where the answer dodges you, keeping the largest set of candidates alive | S | Worst-case search |
| 3 | Semantle ★ | Guess a hidden word; each guess scores its cosine similarity to it | S | Embeddings, cosine (Cold Read round 5) |
| 4 | Contexto ★ | Like Semantle, but each guess shows its rank among all words | S | Nearest neighbours by rank |
| 5 | Redactle ★ | A Wikipedia article with every word blacked out; guessed words appear everywhere they occur | M | TF-IDF: rare words reveal the page, common ones reveal nothing |
| 6 | NYT Connections ★ | Sort 16 words into four hidden groups of four | S | Communities and topics: grouping by shared links |
| 7 | Spelling Bee | Make words from seven letters, one of them required | S | Word frequency, vocabulary size |
| 8 | Strands | Find themed words hidden in a letter grid | M | Topics as word groups |
| 9 | Hangman | Guess letters before the drawing completes | S | Letter frequency |
| 10 | Boggle | Find words in a grid of adjacent letter tiles in three minutes | S | Paths on a grid graph |
| 11 | Mini crossword | A 5×5 crossword | M | Not a fit |
| 12 | Word ladder ★ | Turn one word into another, one letter at a time, through real words | S | Shortest paths and BFS on a word graph |
| 13 | Codenames ★ | Give one word that links several of your team's words and avoids the others | M | Word similarity, co-occurrence |
| 14 | Taboo ★ | Describe a word without its five forbidden words | S | PPMI: the forbidden words are its strongest contexts |
| 15 | Password | Get a partner to say a word using one-word clues | S | Associations, embeddings |
| 16 | Just One | Players each write one clue; duplicate clues cancel out | S | Similar words collide |
| 17 | Scattergories | Name a thing in each category starting with one letter | S | Not a fit |
| 18 | Countdown letters | Make the longest word from nine letters | S | Not a fit |
| 19 | Anagram race | Unscramble words against a timer | S | Not a fit |
| 20 | Typing race | Type a passage faster than a ghost runner | S | Zipf: common words are short |

## Wikipedia and network games

| # | Game | Core loop | Build | Could teach |
| --- | --- | --- | --- | --- |
| 21 | Wikiracing ★ | Get from one article to another by clicking links only | S | Directed paths, hubs, the Marvel network itself |
| 22 | Six Degrees of Kevin Bacon ★ | Link any actor to Kevin Bacon through shared films | S | Small worlds, bipartite projection |
| 23 | Higher or Lower ★ | Two items appear; say which has more of something | S | Degree and PageRank intuition, heavy tails |
| 24 | Top Trumps ★ | Pick a stat on your card; the higher card wins | S | Comparing centralities across characters |
| 25 | Untangle (Planarity) ★ | Drag nodes until no edges cross | S | Network layout |
| 26 | Bridges (Hashiwokakero) ★ | Join islands with bridges so each island has exactly the number of bridges it shows | S | Degree sequences |
| 27 | Sim ★ | Two players colour edges of a six-node graph; whoever completes a triangle of their colour loses | S | Triangles, clustering |
| 28 | Sprouts | Join dots with curves and add a new dot each move, until no move is left | M | Planar graphs |
| 29 | Hex | Connect your two sides of a rhombus board | M | Connectivity, cuts |
| 30 | Dots and Boxes | Draw edges; completing a box scores it and earns another turn | S | Graph moves |
| 31 | Mini Metro ★ | Draw subway lines as stations appear and demand grows | M | Network design, backbone, load |
| 32 | Ticket to Ride (solo) | Claim routes to finish city-to-city tickets | M | Paths on a weighted graph |
| 33 | Pipe Mania | Lay pipe tiles before the flow arrives | M | Flow through a network |
| 34 | Infinity Loop | Rotate tiles until every line connects | S | Connected components |
| 35 | Flood-It ★ | Recolour your region from the corner to absorb neighbours in as few moves as possible | S | BFS spread, communities merging |
| 36 | Kami | Fold a coloured paper board into one colour | S | Merging communities, region graphs |
| 37 | Lights Out | Pressing a light toggles it and its neighbours; turn all off | S | Adjacency, linear algebra |
| 38 | The Wisdom and/or Madness of Crowds ★ | Draw a network and watch beliefs and contagion spread over it | S | Friendship paradox, complex contagion |
| 39 | Parable of the Polygons ★ | Move unhappy shapes and watch segregation emerge | S | Homophily, Schelling's model |
| 40 | The Evolution of Trust | Play the repeated prisoner's dilemma against strategies | M | Cooperation on networks |
| 41 | Plague Inc. (simplified) ★ | Pick where a disease starts and how it spreads; infect the world | M | SIR spreading, hubs as super-spreaders |
| 42 | Pandemic (solo, simplified) | Treat outbreaks before they chain across a city map | M | Cascades on networks |
| 43 | Little Alchemy | Combine elements to discover new ones | S | Growing a recipe graph |
| 44 | Guess Who? ★ | Ask yes/no questions and flip down the faces they rule out | S | Elimination by attributes (Cold Read round 1's board) |
| 45 | Clue (Cluedo) | Deduce suspect, weapon and room from shown cards | M | Deduction, set intersection |

## Data and estimation games

| # | Game | Core loop | Build | Could teach |
| --- | --- | --- | --- | --- |
| 46 | Guess the Correlation ★ | See a scatter plot; guess r | S | Reading scatter plots |
| 47 | You Draw It (NYT) ★ | Draw the rest of a curve, then see the real one | S | Degree distributions, power laws on log-log |
| 48 | Calibration game | Give 90% intervals for numeric questions | S | Uncertainty, overconfidence |
| 49 | Wits & Wagers | Guess a number, then bet on whose guess is closest | S | Heavy tails, estimation |
| 50 | The Price Is Right | Guess the price without going over | S | Estimation |
| 51 | Family Feud ★ | Name the most popular answers to a survey question | S | Word frequency, Zipf |
| 52 | Worldle | Guess a country from its outline; get distance and direction | S | Week 3 migration data |
| 53 | Globle | Guess countries; the map colours them hotter as you get closer | S | Distance as feedback |
| 54 | Tradle | Guess a country from a treemap of its exports | S | Reading part-to-whole charts |
| 55 | GeoGuessr-lite | Guess where a photo was taken on a map | M | Not a fit |
| 56 | Timeline | Place each card in the right spot of a growing chronology | S | Character first appearances, network growth |
| 57 | Akinator / 20 Questions ★ | The game asks yes/no questions and guesses your character | M | Information gain, splitting a set |
| 58 | Mastermind | Crack a colour code from black and white peg feedback | S | Search under feedback |
| 59 | Battleship | Fire at a grid to sink hidden ships | S | Probability maps |
| 60 | Higher Lower search trends | Which of two searches had more volume? | S | Heavy-tailed popularity |

## Logic puzzles

| # | Game | Core loop | Build | Could teach |
| --- | --- | --- | --- | --- |
| 61 | Minesweeper ★ | Numbers count mines among neighbours; clear the board | S | Neighbourhoods; a version on a network graph |
| 62 | Sudoku | Fill 1–9 with no repeat in a row, column or box | M | Graph colouring |
| 63 | Nonograms (Picross) | Fill cells from row and column run counts | M | Not a fit |
| 64 | KenKen | Grid arithmetic with cage targets | M | Not a fit |
| 65 | Flow Free | Join matching colour dots with paths that fill the grid | M | Disjoint paths |
| 66 | Tower of Hanoi | Move a disc stack under size rules | S | Recursion, state graphs |
| 67 | 15-puzzle | Slide tiles into order | S | State-space search |
| 68 | Rush Hour (Klotski) | Slide cars to free the red one | M | Shortest path in a state graph |
| 69 | Sokoban | Push boxes onto targets | M | Planning |
| 70 | Set ★ | Find three cards where each feature is all same or all different | S | Feature vectors |
| 71 | Spot It! (Dobble) ★ | Any two cards share exactly one symbol; find it first | S | Bipartite co-occurrence, projective planes |
| 72 | Memory (Concentration) | Flip pairs to find matches | S | Not a fit |
| 73 | Simon | Repeat a growing light and sound sequence | S | Not a fit |
| 74 | Nim | Take objects from heaps; the last take wins | S | Game theory |
| 75 | 24 game / Countdown numbers | Combine numbers to hit a target | S | Not a fit |

## Arcade

| # | Game | Core loop | Build | Could teach |
| --- | --- | --- | --- | --- |
| 76 | Snake | Grow by eating; don't hit yourself | S | Random walks |
| 77 | Tetris | Clear lines with falling pieces | M | Not a fit |
| 78 | 2048 ★ | Slide and merge tiles that double | S | Rich-get-richer growth |
| 79 | Threes | 2048's predecessor, with 1+2 merges | S | Same as 2048 |
| 80 | Pong | Bounce a ball past a paddle | S | Not a fit |
| 81 | Breakout | Clear bricks with a ball | S | Not a fit |
| 82 | Space Invaders | Shoot descending rows | M | Not a fit |
| 83 | Asteroids | Split rocks in a wrap-around field | M | Not a fit |
| 84 | Pac-Man | Eat dots in a maze while ghosts chase | M | Paths in a maze graph |
| 85 | Frogger | Cross lanes of traffic | S | Not a fit |
| 86 | Flappy Bird | Tap through gaps | S | Not a fit |
| 87 | Chrome dinosaur runner | Jump obstacles at rising speed | S | Not a fit |
| 88 | Doodle Jump | Bounce upward on platforms | S | Not a fit |
| 89 | Crossy Road | Endless lane crossing | M | Not a fit |
| 90 | Whack-a-Mole | Hit targets as they pop up | S | Not a fit |
| 91 | Fruit Ninja | Slice thrown fruit, avoid bombs | M | Not a fit |
| 92 | Bejeweled (match-3) | Swap gems to make lines of three | M | Not a fit |
| 93 | Cookie Clicker | Click, buy producers, watch the numbers grow | S | Exponential growth |
| 94 | Universal Paperclips | Incremental game where one goal consumes everything | M | Growth curves |

## Cards, dice and quiz shows

| # | Game | Core loop | Build | Could teach |
| --- | --- | --- | --- | --- |
| 95 | Klondike solitaire | Build foundations from a tableau | M | Not a fit |
| 96 | Blackjack | Get closer to 21 than the dealer | S | Probability |
| 97 | Yahtzee | Roll five dice three times to fill a scorecard | S | Probability, expected value |
| 98 | Snakes and Ladders | Roll and move; ladders up, snakes down | S | Random walks, Markov chains |
| 99 | Who Wants to Be a Millionaire | Climb a question ladder with three lifelines | S | Quiz format for any week |
| 100 | Jeopardy | Pick a category and value; answer in question form | S | Quiz format for any week |

## Best next picks

These are the S-sized ★ games that would extend Cold Read to other weeks:

- **Wikiracing (21) and Higher or Lower (23)** on the Marvel network: paths, hubs and centrality. Both work with data we already have.
- **Sim (27)** for clustering: losing means making a triangle.
- **You Draw It (47)** for degree distributions: draw the curve on log-log axes, then see the real one.
- **Flood-It (35)** for communities: spread a colour through the network's own groups.
- **Connections (6)** for topics: sort 16 Marvel words into their four LDA topics.
- **Taboo (14)** for PPMI: the forbidden words are a word's top PPMI contexts.
- **Parable of the Polygons (39)** for homophily.

# 100 more, by genre

These are the best-known games in each genre. Many are far too big to clone, so **Build** gains a third size:
- **L**: only a stripped-down version is realistic. The core loop describes that mini version.

## Arcade

| # | Game | Core loop | Build | Could teach |
| --- | --- | --- | --- | --- |
| 101 | Galaga | Shoot a diving alien formation; let one capture your ship to win it back doubled | M | Not a fit |
| 102 | Donkey Kong | Climb girders and jump barrels to reach the top | M | Not a fit |
| 103 | Centipede | Shoot a centipede that splits into two at every hit | M | Not a fit |
| 104 | Missile Command ★ | Spend limited shots to protect six cities from falling missiles | S | Network robustness: targeted attacks on hubs against random failure |
| 105 | Dig Dug | Tunnel through dirt and pump up monsters | M | Not a fit |
| 106 | Q*bert | Hop on a cube pyramid to change every top's colour | S | Not a fit |
| 107 | Joust | Flap a flying ostrich and win collisions from above | M | Not a fit |
| 108 | Bomberman | Lay bombs that blast along the grid lines | M | Not a fit |

## Shoot 'em up

| # | Game | Core loop | Build | Could teach |
| --- | --- | --- | --- | --- |
| 109 | 1942 | Vertical scrolling plane shooter with a loop-the-loop dodge | M | Not a fit |
| 110 | Gradius | Side-scroller where collected capsules buy upgrades from a power bar | M | Not a fit |
| 111 | R-Type | Side-scroller with a detachable pod that blocks and shoots | M | Not a fit |
| 112 | Raiden | Vertical shooter with weapon colours and bombs | M | Not a fit |
| 113 | Xevious | Shoot air targets and bomb ground targets on two layers | M | Not a fit |
| 114 | Ikaruga | Switch your ship between two colours to absorb matching bullets | M | Not a fit |
| 115 | Touhou Project | Bullet hell: weave through dense patterns with a tiny hitbox | M | Not a fit |
| 116 | Geometry Wars | Twin-stick shooter in a neon arena of swarming shapes | M | Not a fit |

## Platform

| # | Game | Core loop | Build | Could teach |
| --- | --- | --- | --- | --- |
| 117 | Super Mario Bros. | Run and jump to the flag; stomp enemies, grab power-ups | M | Not a fit |
| 118 | Sonic the Hedgehog | Speed through loops; rings protect you from one hit | M | Not a fit |
| 119 | Mega Man 2 | Beat a boss to take its weapon, which beats another boss | M | Who-beats-whom as a directed graph |
| 120 | Celeste | Precise jumps with one air dash, short rooms, instant retries | M | Not a fit |
| 121 | Super Meat Boy | Tiny deadly levels; every failed attempt replays together at the end | M | Not a fit |
| 122 | Lode Runner | Collect gold, dig holes to trap guards | M | Not a fit |
| 123 | Geometry Dash | One-button jumps timed to the music | S | Not a fit |
| 124 | Spelunky | Randomly generated caves where every run starts over | L | Mini: one generated cave, one life |

## Survival

| # | Game | Core loop | Build | Could teach |
| --- | --- | --- | --- | --- |
| 125 | Vampire Survivors | Move only; weapons fire on their own while hordes grow | M | Not a fit |
| 126 | Brotato | Arena waves, a shop between them, stacking stats | M | Not a fit |
| 127 | Don't Starve | Gather, craft and keep the fire lit through the night | L | Mini: one day-night cycle with hunger and fire |
| 128 | Terraria | Dig, build and craft in a 2D world | L | Mini: a small block world with three recipes |
| 129 | Minecraft | Gather blocks, craft tools, survive the night | L | Mini: Terraria's mini in 2D |
| 130 | A Dark Room | A text survival game that grows from stoking one fire | M | Not a fit |
| 131 | Agar.io ★ | A cell eats smaller cells to grow; bigger cells move slower | S | Rich-get-richer growth, preferential attachment |
| 132 | Slither.io | A snake grows from the remains of the snakes it cuts off | M | Not a fit |

## Rhythm

| # | Game | Core loop | Build | Could teach |
| --- | --- | --- | --- | --- |
| 133 | Guitar Hero | Hit coloured notes as they reach the line | M | Not a fit |
| 134 | Dance Dance Revolution | Step on arrows in time | M | Not a fit |
| 135 | osu! | Click circles and follow sliders to the beat | M | Not a fit |
| 136 | Taiko no Tatsujin | Two drum hits, centre or rim, on a scrolling lane | S | Not a fit |
| 137 | Rhythm Heaven | Short minigames, each with a single rhythm action | M | Not a fit |
| 138 | Friday Night Funkin' | Arrow-key rap battles against a rival | M | Not a fit |
| 139 | Crypt of the NecroDancer | Dungeon crawling where every move must land on the beat | L | Mini: one room on a beat |

## Survival horror

| # | Game | Core loop | Build | Could teach |
| --- | --- | --- | --- | --- |
| 140 | Five Nights at Freddy's ★ | Watch cameras, shut doors and ration power until 6 AM | S | Random walks: the threats wander a graph of rooms |
| 141 | Resident Evil | Scarce ammo, locked doors, a mansion map | L | Mini: top-down rooms, keys, scarce ammo |
| 142 | Silent Hill | Explore a foggy town with a radio that crackles near danger | L | Mini: fog, radio static as a proximity meter |
| 143 | Amnesia: The Dark Descent | Hide from monsters you cannot fight; darkness drains sanity | L | Mini: light against sanity |
| 144 | Darkwood | Scavenge by day, barricade a house by night | L | Mini: one night's barricade |
| 145 | Phasmophobia ★ | Gather evidence and name the ghost type from a journal | M | Deduction by elimination, Cold Read round 1's board |
| 146 | Lethal Company | Scrap salvage against a quota on monster moons | L | Mini: collect and return before time runs out |

## Adventure

| # | Game | Core loop | Build | Could teach |
| --- | --- | --- | --- | --- |
| 147 | The Legend of Zelda | Explore a map of screens, find items that open new areas | L | Mini: a 5×5 screen map with locked doors |
| 148 | Zork ★ | Text adventure: type commands, move between rooms | S | Rooms as a graph; parsing text |
| 149 | The Secret of Monkey Island | Point-and-click: combine items, trade insults | M | Not a fit |
| 150 | Myst | Click through still scenes and solve machine puzzles | M | Not a fit |
| 151 | The Oregon Trail | Ration supplies and choose at each landmark on a westward trek | S | A narrative frame for any week |
| 152 | Return of the Obra Dinn ★ | Name every crew member and their fate from frozen death scenes | M | Deduction from partial clues |
| 153 | Her Story ★ | Search a database of video clips by keyword to piece a story together | S | Search engines, TF-IDF (Weeks 5 and 6) |
| 154 | Papers, Please | Check documents against changing rules at a border post | M | Not a fit |

## Puzzle

| # | Game | Core loop | Build | Could teach |
| --- | --- | --- | --- | --- |
| 155 | Baba Is You | Push word blocks to rewrite the level's rules | M | Not a fit |
| 156 | The Witness | Draw a line through a grid panel that satisfies its symbols | M | Paths with constraints |
| 157 | Portal (2D) | Place two linked portals to cross a level | M | Not a fit |
| 158 | Lemmings | Assign jobs to walkers so enough of them reach the exit | M | Not a fit |
| 159 | World of Goo | Build towers and bridges from goo balls that link to their neighbours | M | Building a network that bears load |
| 160 | Cut the Rope | Cut ropes to swing candy into a mouth | M | Not a fit |
| 161 | Angry Birds | Fling birds to topple structures | M | Not a fit |
| 162 | Zuma | Shoot balls into a moving chain to make groups of three | M | Not a fit |

## Logical

| # | Game | Core loop | Build | Could teach |
| --- | --- | --- | --- | --- |
| 163 | Zebra puzzle (logic grid) ★ | Fill a grid of who-owns-what from a list of clues | S | Deduction, set elimination |
| 164 | Slitherlink ★ | Draw one closed loop; each number counts its loop edges | M | Cycles in graphs |
| 165 | Hitori ★ | Shade repeats so no row has duplicates and the unshaded cells stay connected | M | Connectivity |
| 166 | Kakuro | Crossword with sums in place of words | M | Not a fit |
| 167 | Light Up (Akari) | Place bulbs to light every cell without bulbs seeing each other | M | Not a fit |
| 168 | Star Battle | One star per row, column and region; no two touch | M | Not a fit |
| 169 | Tents and Trees | Put a tent beside every tree; tents never touch | M | Matching in a bipartite graph |
| 170 | Shikaku | Split the grid into rectangles of the given areas | M | Not a fit |

## Tower defense

| # | Game | Core loop | Build | Could teach |
| --- | --- | --- | --- | --- |
| 171 | Bloons TD | Place monkeys along a fixed track to pop balloon waves | M | Not a fit |
| 172 | Plants vs. Zombies | Plant defenders in five lanes against walking zombies | M | Not a fit |
| 173 | Kingdom Rush | Build four tower types at fixed spots; call reinforcements | M | Not a fit |
| 174 | Desktop Tower Defense ★ | Your towers build the maze; enemies take the shortest path through it | S | Shortest paths; removing edges lengthens paths |
| 175 | Fieldrunners ★ | Desktop Tower Defense's mazing on a field | S | Same as 174 |
| 176 | GemCraft | Combine gems into stronger towers | M | Not a fit |
| 177 | Defense Grid | Mazing towers that defend cores enemies try to carry away | M | Paths and chokepoints |

## Strategy

| # | Game | Core loop | Build | Could teach |
| --- | --- | --- | --- | --- |
| 178 | StarCraft | Three asymmetric races; gather, build, fight | L | Mini: one resource and two units |
| 179 | Age of Empires II | Advance through ages; gather four resources | L | Mini: gather and build without fighting |
| 180 | Warcraft II | Gold, lumber, ground and naval units | L | Mini: StarCraft's mini |
| 181 | Command & Conquer | Harvest a resource field; base building | L | Mini: StarCraft's mini |
| 182 | Galcon ★ | Send ships between planets that make more ships | S | Flows on a network; hubs as strongholds |
| 183 | Mushroom Wars | Galcon with buildings | M | Same as 182 |
| 184 | Kingdom: Two Crowns | Ride left or right, spend coins, defend your walls at night | M | Not a fit |
| 185 | Factorio ★ | Automate production chains with belts and machines | L | Mini: a supply graph with throughput |

## Turn-based strategy

| # | Game | Core loop | Build | Could teach |
| --- | --- | --- | --- | --- |
| 186 | Civilization | Settle cities, research, expand, win | L | Mini: a hex map, one resource, a tech tree as a DAG |
| 187 | The Battle of Polytopia | A small, fast Civilization on a square grid | M | Not a fit |
| 188 | Advance Wars | Units on a grid with rock-paper-scissors matchups | M | Not a fit |
| 189 | XCOM | Squad tactics with cover and hit percentages | L | Mini: one map, four units |
| 190 | Into the Breach | Small grid; you see every enemy move before you act | M | Not a fit |
| 191 | Fire Emblem | Grid tactics; dead units stay dead | L | Mini: one map |
| 192 | Heroes of Might and Magic III | Explore an overworld; battles play out on a hex grid | L | Mini: one battle |
| 193 | Slay ★ | Conquer hexes; a region cut off from its capital starves | S | Connected components |

## Board games

| # | Game | Core loop | Build | Could teach |
| --- | --- | --- | --- | --- |
| 194 | Chess | The classic, against a simple engine | M | Not a fit |
| 195 | Go (9×9) ★ | Surround territory; a group with no liberties is captured | M | Connected components, cuts |
| 196 | Connect Four | Drop discs to get four in a row | S | Not a fit |
| 197 | Reversi (Othello) | Flank discs to flip them | S | Not a fit |
| 198 | Backgammon | Race your checkers home with dice | M | Probability |
| 199 | Risk ★ | Attack across a map of territories with dice | M | Chokepoints and betweenness on the territory graph |
| 200 | Carcassonne ★ | Lay tiles to grow roads, cities and fields, then score them | M | Connected components, network growth |

## Best picks from the genre list

- **Her Story (153)** is a search engine as a game. It suits Weeks 5 and 6 and needs only the Marvel pages.
- **Desktop Tower Defense (174)** teaches shortest paths. Every tower you place lengthens the enemies' route, which is edge removal in reverse.
- **Risk (199)** on the Marvel network: the territories with the highest betweenness are the chokepoints you have to hold.
- **Missile Command (104)** in a Week 2 frame: defend the network against targeted attacks on hubs and against random failure.
- **Galcon (182)**: ships flow along edges, and hubs grow fastest.
- **Agar.io (131)**: big cells get bigger, which is preferential attachment.
- **Five Nights at Freddy's (140)**: the threats random-walk a room graph, and you choose which rooms to watch.
