"use client";
// The growth batch's edge states (/styleguide/kit/states/), one island per
// [data-state] host, wrapped by KitStateGrowth as states.tsx wraps its own.
// Each renders its host empty on the server and, once hydrated, the component
// in one awkward case, which scripts/kit-states.mjs checks.
import type { ComponentType, ReactNode } from "react";
import { ComponentGallery, FriendshipParadox, GrowthLab, GrowthReplay } from "@/kit";
import { island, useIslandReady } from "@/lib/island";
import { useHydrated } from "@/lib/useHydrated";
import { emptyModeFirst, groupCase, longCard, oneNodeModes, ringEdges, tinyComponents } from "./toy-states-growth";

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

const tiny = tinyComponents();

const VIEWS = {
  "gr-replay-one": () => <GrowthReplay modes={oneNodeModes} card={longCard} height={260} />,
  "gr-replay-nomodes": () => <GrowthReplay modes={[]} />,
  "gr-replay-emptymode": () => <GrowthReplay modes={emptyModeFirst} height={260} />,
  "gr-lab-alpha0": () => <GrowthLab defaultAlpha={0} defaultN={300} start="grown" sweepNs={[]} height={300} />,
  "gr-lab-huge": () => <GrowthLab defaultAlpha={50} defaultM={1} defaultN={300} start="grown" sizes={[300]} height={300} />,
  "gr-lab-n1": () => <GrowthLab defaultN={1} defaultM={3} sizes={[1]} ms={[3]} start="grown" height={260} />,
  "gr-gallery-one": () => <ComponentGallery n={24} edges={ringEdges} />,
  "gr-gallery-tiny": () => <ComponentGallery n={tiny.n} edges={tiny.edges} max={14} minWidth={140} />,
  "gr-gallery-empty": () => <ComponentGallery n={0} edges={[]} />,
  "gr-gallery-groups": () => <ComponentGallery n={groupCase.n} edges={groupCase.edges} groups={groupCase.groups} />,
  "gr-paradox-nolinks": () => <FriendshipParadox n={10} edges={[]} height={200} />,
};

export type GrowthStateName = keyof typeof VIEWS;

const at = (state: string) => ({ roots: [`[data-state="${state}"]`] });
const name = (state: string) => `kit/states/${state.replace(/(^|-)(\w)/g, (_, _d, c: string) => c.toUpperCase())}State`;

// One island per state, so a fault in one leaves the others alone.
const STATES = Object.fromEntries(
  (Object.keys(VIEWS) as GrowthStateName[]).map((s) => [s, island(name(s), State(s, VIEWS[s]), Empty(s), at(s))]),
) as Record<GrowthStateName, ComponentType>;

function View({ state }: { state: GrowthStateName }) {
  const Shown = STATES[state];
  return <Shown />;
}

function Placeholder({ state }: { state: GrowthStateName }) {
  return <div data-state={state}></div>;
}

/** <KitStateGrowth state="gr-replay-one" />: one host of the growth batch on the edge-state page. */
export const KitStateGrowth = island("kit/states/KitStateGrowth", View, Placeholder, {
  roots: (Object.keys(VIEWS) as GrowthStateName[]).map((s) => `[data-state="${s}"]`),
});
