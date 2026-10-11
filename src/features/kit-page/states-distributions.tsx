"use client";
// The edge-state page's "Distributions and nulls" cases, one island per
// [data-state] host, as states.tsx does for the rest of the page. Each renders
// its host empty on the server and, once hydrated, the component in one
// awkward case; scripts/kit-states.mjs reports a host left empty.
import type { ComponentType, ReactNode } from "react";
import { DistributionPlot, NullBars, NullBoard, NullHistogram } from "@/kit";
import { island, useIslandReady } from "@/lib/island";
import { useHydrated } from "@/lib/useHydrated";
import { farSamples, fixedBoard, longBars, longBoard, zerosKs } from "./toy-states-distributions";

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

const VIEWS = {
  "dist-empty": () => <DistributionPlot series={[{ key: "none", name: "no nodes", ks: [] }]} top={{ title: "The tail", items: [] }} aria="Toy distribution with no values" height={200} />,
  "dist-single": () => <DistributionPlot series={[{ key: "one", name: "one point", points: [[3, 0.5]] }]} scaleToggle="split" aria="Toy distribution with one point" height={200} />,
  "dist-zeros": () => <DistributionPlot series={[{ key: "z", name: "degrees, many of them 0", ks: zerosKs }]} scaleToggle="split" aria="Toy distribution with zeros on log axes" height={220} />,
  "nullhist-far": () => <NullHistogram samples={farSamples} real={0.32} normalOverlay xLabel="average clustering under G(n, m)" />,
  "nullhist-empty": () => <NullHistogram samples={[]} real={0.3} xLabel="no shuffles yet" />,
  "nullhist-one": () => <NullHistogram samples={[0.3, 0.29]} step={1} real={0.3} xLabel="one shuffle, equal to the real value" />,
  "board-fixed": () => <NullBoard {...fixedBoard} caption="Every measure fixed by its null model." />,
  "board-long": () => <NullBoard {...longBoard} />,
  "bars-long": () => <NullBars rows={longBars} xLabel="links (toy)" />,
  "bars-empty": () => <NullBars rows={[]} />,
};

export type DistStateName = keyof typeof VIEWS;

const at = (state: string) => ({ roots: [`[data-state="${state}"]`] });
const name = (state: string) => `kit/distributions/${state.replace(/(^|-)(\w)/g, (_, _d, c: string) => c.toUpperCase())}State`;

// One island per state, so a fault in one leaves the others alone.
const STATES = Object.fromEntries(
  (Object.keys(VIEWS) as DistStateName[]).map((s) => [s, island(name(s), State(s, VIEWS[s]), Empty(s), at(s))]),
) as Record<DistStateName, ComponentType>;

function View({ state }: { state: DistStateName }) {
  const Shown = STATES[state];
  return <Shown />;
}

function Placeholder({ state }: { state: DistStateName }) {
  return <div data-state={state}></div>;
}

/** <DistState state="dist-empty" />: one host on the edge-state page. */
export const DistState = island("kit/distributions/DistState", View, Placeholder, {
  roots: (Object.keys(VIEWS) as DistStateName[]).map((s) => `[data-state="${s}"]`),
});
