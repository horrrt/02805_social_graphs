"use client";
// The games batch's demos on the kit page: a round trip on a toy one-way town,
// shattering and seating Zachary's karate club, and a quiz on toy word bags,
// each from toy-games.ts. One island per [data-demo] host, wrapped by
// DemoGames as demos-networks.tsx wraps its own.
import type { ReactNode } from "react";
import { AttackGame, PathQuest, QuizRun, SeatingGame } from "@/kit";
import { island, useIslandReady } from "@/lib/island";
import { useHydrated } from "@/lib/useHydrated";
import { KARATE, KARATE_NAMES, KARATE_SPLIT, QUIZ, TOWN, TOWN_LINKS } from "./toy-games";

function Shown({ demo, children }: { demo: string; children: () => ReactNode }) {
  const hydrated = useHydrated();
  useIslandReady(hydrated);
  return <div data-demo={demo}>{hydrated ? children() : null}</div>;
}

const QuestView = () => <Shown demo="games-quest">{() => <PathQuest names={TOWN} edges={TOWN_LINKS} homes={[0, 12, 9]} seed={3} />}</Shown>;
const AttackView = () => <Shown demo="games-attack">{() => <AttackGame n={34} edges={KARATE} names={KARATE_NAMES} seed={5} />}</Shown>;
const SeatingView = () => (
  <Shown demo="games-seating">{() => <SeatingGame n={34} edges={KARATE} names={KARATE_NAMES} reference={{ label: "the club's real split", partition: KARATE_SPLIT }} seed={2} />}</Shown>
);
const QuizView = () => <Shown demo="games-quiz">{() => <QuizRun rounds={QUIZ} lengths={[4, 8]} seed={7} />}</Shown>;

const Empty = (demo: string) =>
  function Host() {
    return <div data-demo={demo}></div>;
  };

const at = (demo: string) => ({ roots: [`[data-demo="${demo}"]`] });

// One island per demo, so a fault in one leaves the others alone.
const DEMOS = {
  "games-quest": island("kit/demos/GamesQuestDemo", QuestView, Empty("games-quest"), at("games-quest")),
  "games-attack": island("kit/demos/GamesAttackDemo", AttackView, Empty("games-attack"), at("games-attack")),
  "games-seating": island("kit/demos/GamesSeatingDemo", SeatingView, Empty("games-seating"), at("games-seating")),
  "games-quiz": island("kit/demos/GamesQuizDemo", QuizView, Empty("games-quiz"), at("games-quiz")),
};

export type GamesDemoName = keyof typeof DEMOS;

function View({ demo }: { demo: GamesDemoName }): ReactNode {
  const Demo = DEMOS[demo];
  return <Demo />;
}

function Placeholder({ demo }: { demo: GamesDemoName }) {
  return <div data-demo={demo}></div>;
}

/** <DemoGames demo="games-quest" />: one host of the games batch on the kit page. */
export const DemoGames = island("kit/demos/DemoGames", View, Placeholder, {
  roots: (Object.keys(DEMOS) as GamesDemoName[]).map((demo) => `[data-demo="${demo}"]`),
});
