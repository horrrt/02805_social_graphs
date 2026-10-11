// The games batch's toy data for the kit page: a made-up town of 30 pages with
// one-way links (a loop through 24 of them with chords, a cul-de-sac with one
// way out, two dead ends and a page that leads only into one), Zachary's
// karate club with the split the club really made, and toy word bags and
// sentences for the quiz. Nothing here is a result of this project.
import type { QuizRound } from "@/kit/QuizRun";
import { KARATE, type Edge } from "./toy-networks";

export const TOWN = [
  "Town Hall", "Market", "Bakery", "Library", "Museum", "Park", "Station", "Bridge", "Harbour", "Lighthouse",
  "School", "Hospital", "Square", "Theatre", "Cinema", "Stadium", "Zoo", "Garden", "Castle", "Cathedral",
  "Mill", "Farm", "Forest", "Lake", "Cave", "Mine", "Quarry", "Island", "Tower", "Ferry",
];

/** One-way links: from Town Hall, Island, Tower and Ferry have no way back. */
export const TOWN_LINKS: Edge[] = [
  [0, 1], [0, 7], [0, 12], [1, 2], [2, 3], [2, 22], [3, 4], [3, 10], [4, 5], [4, 27], [5, 0], [5, 6], [6, 7], [6, 13], [7, 3], [7, 8],
  [8, 9], [9, 10], [9, 16], [9, 24], [10, 11], [11, 12], [11, 28], [12, 0], [12, 8], [12, 13], [12, 19], [13, 14], [14, 15], [14, 27],
  [15, 16], [15, 22], [15, 29], [16, 17], [17, 13], [17, 18], [17, 25], [18, 1], [18, 19], [19, 0], [19, 20], [20, 21], [21, 4],
  [21, 22], [21, 28], [22, 18], [22, 23], [23, 0], [24, 25], [25, 26], [26, 20], [26, 24], [29, 27],
];

export { KARATE };

/** The karate club's members: Mr Hi the instructor (node 0), the Officer (node 33), and members 1 to 32 by node. */
export const KARATE_NAMES = Array.from({ length: 34 }, (_, i) => (i === 0 ? "Mr Hi" : i === 33 ? "Officer" : `Member ${i}`));

/** The club the members joined after the split, as networkx records it: 0 with Mr Hi, 1 with the Officer. */
export const KARATE_SPLIT = Array.from({ length: 34 }, (_, i) => ([0, 1, 2, 3, 4, 5, 6, 7, 8, 10, 11, 12, 13, 16, 17, 19, 21].includes(i) ? 0 : 1));

// Six made-up townsfolk and the words on their toy pages.
const BAGS: Record<string, Record<string, number>> = {
  keeper: { lamp: 5, sea: 4, storm: 3, night: 3, tower: 4, light: 5, ship: 2 },
  baker: { bread: 6, oven: 4, flour: 5, morning: 3, sugar: 2, night: 1 },
  astronomer: { star: 6, night: 5, telescope: 4, light: 3, sky: 4, moon: 3 },
  gardener: { soil: 5, rose: 4, rain: 3, seed: 4, morning: 2, light: 1 },
  sailor: { ship: 6, sea: 6, storm: 3, rope: 3, star: 2, night: 1 },
  librarian: { book: 7, shelf: 4, quiet: 3, light: 1, morning: 1, ink: 2 },
};
const WHO: Record<string, string> = {
  keeper: "The lighthouse keeper", baker: "The baker", astronomer: "The astronomer", gardener: "The gardener", sailor: "The sailor", librarian: "The librarian",
};
const suspects = (...keys: string[]) => keys.map((key) => ({ key, label: WHO[key] }));
const bags = (...keys: string[]) => Object.fromEntries(keys.map((k) => [k, BAGS[k]]));
const clue = (id: string, answer: string, others: string[], clues: string[]): QuizRound => ({
  type: "clue", id, answer, clues, suspects: suspects(answer, ...others).sort((a, b) => a.label.localeCompare(b.label)), bags: bags(answer, ...others),
});

export const QUIZ: QuizRound[] = [
  clue("keeper", "keeper", ["astronomer", "sailor", "baker"], ["night", "light", "tower", "lamp"]),
  clue("gardener", "gardener", ["baker", "librarian", "astronomer"], ["morning", "rain", "seed", "rose"]),
  clue("sailor", "sailor", ["keeper", "astronomer", "gardener"], ["star", "storm", "rope", "ship"]),
  clue("librarian", "librarian", ["baker", "gardener", "keeper"], ["quiet", "ink", "shelf", "book"]),
  { type: "two", id: "lamp", options: ["The keeper lit the lamp before the storm reached the harbour.", "The keeper lit the storm before the lamp reached the harbour the harbour."], answer: 0, why: "A trigram model swaps roles and repeats itself." },
  { type: "two", id: "bread", options: ["The baker sold the morning bread of the oven and the oven of the flour.", "The baker sold out of bread before the market opened."], answer: 1, why: "Each word pair is common; the sentence as a whole means nothing." },
  { type: "two", id: "stars", options: ["On clear nights the astronomer counted the moons of the far planet.", "On clear nights the astronomer counted the telescope of the moon of the night."], answer: 0 },
  { type: "blank", id: "telescope", left: "the astronomer pointed her", right: "at the brightest star", answer: "telescope", decoys: ["bread", "rope", "shelf"], source: "toy page: The astronomer" },
  { type: "blank", id: "rope", left: "the sailor coiled the", right: "on the deck before the storm", answer: "rope", decoys: ["rose", "ink", "flour"], source: "toy page: The sailor" },
  { type: "blank", id: "soil", left: "the gardener turned the", right: "after the first rain", answer: "soil", decoys: ["lamp", "star", "book"], source: "toy page: The gardener" },
];
