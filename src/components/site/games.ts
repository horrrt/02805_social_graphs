// Every standalone game, in course order: the site nav's Games menu and the
// home page's Games section both read this list, so the two cannot drift.
// `href` is relative to the site's root; `week` names the week from
// src/scripts/weeks.js whose post the game goes with.
import { WEEKS } from "@/scripts/weeks.js";

export type Game = { href: string; name: string; week: number; topic: string; blurb: string };

const topic = (n: number) => (WEEKS as { n: number; courseTitle: string }[]).find((w) => w.n === n)!.courseTitle;

export const GAMES: Game[] = [
  {
    href: "play/",
    name: "Give Baymax a Voice",
    week: 1,
    topic: topic(1),
    blurb: "No Marvel article links to Baymax. Add one link, pick its direction, and see who can find him.",
  },
  {
    href: "prototypes/screen-test/",
    name: "Screen Test",
    week: 2,
    topic: topic(2),
    blurb: "Classic network models audition for the part of the Marvel network. Then a shuffle tests what chance alone produces.",
  },
  {
    href: "play/cold-read/",
    name: "Cold Read",
    week: 6,
    topic: topic(6),
    blurb: "A Marvel page is hidden. Flip word cards that show how often each word appears, and name the page against the clock.",
  },
  {
    href: "play/week07/same-word/",
    name: "Same Word, Different Worlds",
    week: 7,
    topic: topic(7),
    blurb: "One word in two sentences. Does its vector change? It depends on whether the model looks the word up or reads the sentence.",
  },
  {
    href: "play/week07/two-stripes/",
    name: "Two Stripes",
    week: 7,
    topic: topic(7),
    blurb: "Find the Marvel page nearest another in 384 dimensions, when the map can draw only two.",
  },
  {
    href: "play/topic-tetris/",
    name: "Topic Tetris",
    week: 7,
    topic: topic(7),
    blurb: "Nine Marvel pages fall three times. Group them by their words, their meaning and their links, and watch the groups change.",
  },
  {
    href: "play/search-detective/",
    name: "Semantic Search Detective",
    week: 7,
    topic: topic(7),
    blurb: "Pick the page that best answers a query, then see how search by meaning ranks them, and where a 2D map misleads.",
  },
  {
    href: "play/week07/semantic-minefield/",
    name: "Semantic Minefield",
    week: 7,
    topic: topic(7),
    blurb: "Minesweeper with Marvel characters. Each round's target category decides who is a bomb.",
  },
];

/** "Week 1 · Give Baymax a Voice", the game's line in the site nav's menu. */
export const gameLabel = (game: Game) => `Week ${game.week} · ${game.name}`;
