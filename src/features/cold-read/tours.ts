// The five example games, one per round, for Tutorial.tsx, which deals a fresh
// game before the first step. Each step finds what it shows on the page as it
// stands when the step opens. Steps that act
// press the game's own buttons, the way a player would.
import { press, type TourStep } from "./Tutorial";

/** The face-down clue cards with the page count each shows on its back. */
function faceDown(): { el: HTMLButtonElement; pages: number }[] {
  return [...document.querySelectorAll<HTMLButtonElement>('.cr-card[data-open="false"]')].map((el) => ({
    el,
    pages: Number(el.getAttribute("aria-label")?.match(/on (\d+) of/)?.[1] ?? 0),
  }));
}

const mostCommon = () => faceDown().sort((a, b) => b.pages - a.pages)[0]?.el ?? null;
const rarest = () => faceDown().sort((a, b) => a.pages - b.pages)[0]?.el ?? null;

export const clueShopTour = (): TourStep[] => {
  // The cards picked when the tour reaches them, so the step that shows a card and the step that flips it agree.
  let common: HTMLButtonElement | null = null;
  let rare: HTMLButtonElement | null = null;
  return [
    {
      element: ".cr-hand",
      title: "Eight clue cards",
      text: "Each card is a word from one hidden Marvel page. Its back shows two numbers: how often the word is used on this page, and on how many of the 303 pages it appears.",
    },
    {
      act: () => {
        common = mostCommon();
      },
      element: () => common,
      title: "A common card",
      text: "This word is on a large share of the pages. However often the hidden page uses it, it can't tell that page from many others. Watch.",
    },
    {
      act: () => common?.click(),
      element: ".cr-board",
      title: "Barely a dent",
      text: "Every page that uses the word stays a suspect, and most do. Frequent is not the same as informative.",
    },
    {
      act: () => {
        rare = rarest();
      },
      element: () => rare,
      title: "A rare card",
      text: "This word is on only a handful of pages. Flip it.",
    },
    {
      act: () => rare?.click(),
      element: ".cr-board",
      title: "The board empties",
      text: "Only pages that use the word stay. The rarer a word across pages, the more it tells you: that is the inverse document frequency in TF-IDF.",
    },
    {
      element: ".cr-leads",
      title: "Top leads",
      text: "The pages left, ranked by cosine similarity between the words you flipped and each page's TF-IDF vector. Name one when you trust it.",
    },
    {
      element: ".cr-worth-box",
      title: "Name it, or flip again",
      text: "Playing for is what a right name scores now: 100 for each card still face down, falling as the clock runs. A wrong name costs a heart. The tour is over: the round starts fresh, so these flips don't count.",
    },
  ];
};

export const whoseLineTour = (): TourStep[] => [
  {
    element: ".cr-match",
    title: "Two communities",
    text: "Two groups of Marvel pages, found from the links alone in Week 5. Each round asks which group's pages use a word more.",
  },
  {
    element: ".cr-term-card",
    title: "The word",
    text: "Call it from what you know about the two groups. Inspecting first shows how many pages in each use it, for 50 points.",
  },
  {
    element: ".cr-calls",
    title: "Four calls",
    text: "1: the left group uses it more. 2: the same in both. 3: the right group. 4: skip it, a fluke where one page alone makes it look like a group's word.",
  },
  {
    element: ".cr-board",
    title: "Where words land",
    text: "Across: uses per 10,000 words in the left group's pages. Up: in the right group's. On the diagonal, both use it alike; the further off it, the more one group leans on it. Your called words land here.",
  },
];

export const mixDeskTour = (): TourStep[] => [
  {
    element: ".cr-bag",
    title: "The page's words",
    text: "Its 30 most used words, bigger for more uses. LDA says a page is a mix of topics; read the words and guess the mix.",
  },
  {
    element: ".cr-desk",
    title: "Eight topics",
    text: "LDA found eight word lists. Each card shows a topic's likeliest words; the names on the cards are yours to give.",
  },
  {
    act: () => {
      for (let i = 0; i < 3; i++) press('.cr-topic[data-topic="0"] .cr-topic-body')();
    },
    element: '.cr-topic[data-topic="0"]',
    title: "Spread chips",
    text: "Click a topic to put a chip on it, − to take one back. Ten chips make your guess: three here says 30% of the page comes from this topic.",
  },
  {
    element: ".cr-md-action",
    title: "Lock it in",
    text: "With all ten down, lock in. The reveal colours every word by its likeliest topic and scores how close your mix was.",
  },
];

export const tezguinoTour = (): TourStep[] => [
  {
    element: ".cr-board",
    title: "The company it keeps",
    text: "A word is hidden. This is all you see of it: the words found most often right next to it, by raw count.",
  },
  {
    element: '.cr-seg[aria-label="Weights"]',
    title: "Counts favour filler",
    text: "The, of and was sit next to everything. PPMI keeps only the neighbours that turn up more than chance would put them there. It costs 200.",
  },
  {
    act: press('.cr-seg[aria-label="Weights"] button:last-child'),
    element: ".cr-board",
    title: "With PPMI",
    text: "Now the row shows the word's real company.",
  },
  {
    element: '.cr-seg[aria-label="Context window"]',
    title: "Wider windows",
    text: "±1 sees the words right beside it, mostly grammar; ±4 sees the topic around it. Each step wider costs 100.",
  },
  {
    element: ".cr-picks",
    title: "Pick the word",
    text: "Choose from four, with keys 1 to 4. A right pick earns 1,000 less what you spent on tools.",
  },
];

export const hotColdTour = (): TourStep[] => [
  {
    element: ".cr-guess",
    title: "Guess a word",
    text: "A word from the Marvel pages is hidden. Type any word and press Enter; each guess scores its cosine similarity to the hidden word.",
  },
  {
    act: press(".cr-guess .cr-ghost"),
    element: ".cr-radar-box",
    title: "The radar",
    text: "Each guess lands nearer the centre the higher it ranks among the 9,000 words. That dot is a hint: one of the hidden word's 100 nearest neighbours.",
  },
  {
    element: ".cr-leads",
    title: "Follow the heat",
    text: "Your guesses, closest first, with cosine and rank. Guess words that sit near your best ones and the heat climbs. Fewer guesses score more.",
  },
];
