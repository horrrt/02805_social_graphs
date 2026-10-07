"use client";
// The games batch's edge states (/styleguide/kit/states/), one island per
// [data-state] host, wrapped by GamesState as states-networks.tsx wraps its
// own. Each renders its host empty on the server and, once hydrated, the game
// in one awkward case, most of them opened mid-run, which
// scripts/kit-states.mjs checks.
import type { ComponentType, ReactNode } from "react";
import { AttackGame, ClueReveal, FillBlank, PathQuest, QuizRun, SeatingGame, TwoChoice } from "@/kit";
import { island, useIslandReady } from "@/lib/island";
import { useHydrated } from "@/lib/useHydrated";
import { KARATE, KARATE_NAMES, TOWN, TOWN_LINKS } from "./toy-games";
import { ALL_CLUES, LONE_SUSPECT, LONERS, LONG_TWO, NO_DECOYS, PATH4, PATH4_NAMES, TRIANGLE } from "./toy-states-games";

const State = (state: string, draw: () => ReactNode) =>
  function View() {
    const hydrated = useHydrated();
    useIslandReady(hydrated);
    return <div data-state={state}>{hydrated ? draw() : null}</div>;
  };

const Empty = (state: string) =>
  function Host() {
    return <div data-state={state}></div>;
  };

const noop = () => undefined;

const VIEWS = {
  // Ferry links only to Island, which links nowhere: no target has a way back.
  "games-quest-noway": () => <PathQuest names={TOWN} edges={TOWN_LINKS} homes={[29]} bands={[{ key: "near", label: "Next door", range: [1, 2] }]} />,
  // Out to the Library, then into the Museum and on to the Island: no link leads out.
  "games-quest-stuck": () => <PathQuest names={TOWN} edges={TOWN_LINKS} preset={{ home: 0, target: 3, moves: [7, 3, 4, 27] }} />,
  "games-attack-budget": () => <AttackGame n={4} edges={PATH4} names={PATH4_NAMES} budgets={[8]} preset={{ budget: 8, hits: [1] }} />,
  "games-attack-nolinks": () => <AttackGame n={6} edges={[]} names={LONERS} budgets={[3]} hints={0} preset={{ budget: 3 }} />,
  "games-attack-late": () => <AttackGame n={34} edges={KARATE} names={KARATE_NAMES} budgets={[3]} preset={{ budget: 3, hits: [0, 33] }} />,
  "games-seating-empty": () => <SeatingGame n={0} edges={[]} />,
  "games-seating-small": () => <SeatingGame n={3} edges={TRIANGLE} names={["Ann", "Ben", "Cleo"]} sizes={[9]} preset={{ mode: "table", host: 0, size: 9 }} />,
  "games-seating-room": () => <SeatingGame n={34} edges={KARATE} names={KARATE_NAMES} preset={{ mode: "room", count: 2, cards: { 0: 0, 33: 1 } }} />,
  "games-quiz-none": () => <QuizRun rounds={[]} />,
  "games-clue-single": () => <ClueReveal round={LONE_SUSPECT} onAnswer={noop} />,
  "games-clue-all": () => <ClueReveal round={ALL_CLUES} onAnswer={noop} startAt={6} />,
  "games-two-long": () => <TwoChoice round={LONG_TWO} onAnswer={noop} answered={0} />,
  "games-blank-alone": () => <FillBlank round={NO_DECOYS} onAnswer={noop} />,
};

export type GamesStateName = keyof typeof VIEWS;

const at = (state: string) => ({ roots: [`[data-state="${state}"]`] });
const name = (state: string) => `kit/states/${state.replace(/(^|-)(\w)/g, (_, _d, c: string) => c.toUpperCase())}State`;

// One island per state, so a fault in one leaves the others alone.
const STATES = Object.fromEntries(
  (Object.keys(VIEWS) as GamesStateName[]).map((s) => [s, island(name(s), State(s, VIEWS[s]), Empty(s), at(s))]),
) as Record<GamesStateName, ComponentType>;

function View({ state }: { state: GamesStateName }) {
  const Shown = STATES[state];
  return <Shown />;
}

function Placeholder({ state }: { state: GamesStateName }) {
  return <div data-state={state}></div>;
}

/** <GamesState state="games-quest-noway" />: one host of the games batch on the edge-state page. */
export const GamesState = island("kit/states/GamesState", View, Placeholder, {
  roots: (Object.keys(VIEWS) as GamesStateName[]).map((s) => `[data-state="${s}"]`),
});
