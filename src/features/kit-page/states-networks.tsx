"use client";
// The networks batch's edge states (/styleguide/kit/states/), one island per
// [data-state] host, wrapped by KitStateNetworks as states.tsx wraps its own.
// Each renders its host empty on the server and, once hydrated, the component
// in one awkward case, which scripts/kit-states.mjs checks.
import type { ComponentType, ReactNode } from "react";
import { NetCanvas, NetworkView, Readouts, StepPlayer } from "@/kit";
import { island, useIslandReady } from "@/lib/island";
import { useHydrated } from "@/lib/useHydrated";
import { bigSpec, directedLoop, emptyGraph, multiples, oneNode, readoutsLong, viewAll } from "./toy-states-networks";

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
  "nw-canvas-empty": () => <NetCanvas {...emptyGraph} />,
  "nw-canvas-one": () => <NetCanvas {...oneNode} />,
  "nw-canvas-loop": () => <NetCanvas {...directedLoop} />,
  "nw-canvas-big": () => <NetCanvas {...bigSpec()} />,
  "nw-canvas-multiples": () => <NetCanvas specs={multiples()} columns={4} />,
  "nw-canvas-none": () => <NetCanvas specs={[]} />,
  "nw-view-all": () => <NetworkView spec={viewAll} onNodeClick={() => undefined} />,
  "nw-player-done": () => (
    <StepPlayer label="Already done" seed={1} init={() => 0} step={(s) => s + 1} done={() => true} extraActions={[{ label: "A long extra action label", run: (s) => s }]} render={(s) => <p>State {s}</p>} />
  ),
  "nw-readouts-long": () => <Readouts items={readoutsLong} />,
};

export type NetworksStateName = keyof typeof VIEWS;

const at = (state: string) => ({ roots: [`[data-state="${state}"]`] });
const name = (state: string) => `kit/states/${state.replace(/(^|-)(\w)/g, (_, _d, c: string) => c.toUpperCase())}State`;

// One island per state, so a fault in one leaves the others alone.
const STATES = Object.fromEntries(
  (Object.keys(VIEWS) as NetworksStateName[]).map((s) => [s, island(name(s), State(s, VIEWS[s]), Empty(s), at(s))]),
) as Record<NetworksStateName, ComponentType>;

function View({ state }: { state: NetworksStateName }) {
  const Shown = STATES[state];
  return <Shown />;
}

function Placeholder({ state }: { state: NetworksStateName }) {
  return <div data-state={state}></div>;
}

/** <KitStateNetworks state="nw-canvas-empty" />: one host of the networks batch on the edge-state page. */
export const KitStateNetworks = island("kit/states/KitStateNetworks", View, Placeholder, {
  roots: (Object.keys(VIEWS) as NetworksStateName[]).map((s) => `[data-state="${s}"]`),
});
