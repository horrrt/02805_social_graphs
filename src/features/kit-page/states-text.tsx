"use client";
// The edge-state page's Text states, one island per [data-state="text-…"]
// host, as states.tsx does for the other components: each host is empty on
// the server and, once hydrated, holds the component in one awkward case.
import type { ComponentType, ReactNode } from "react";
import { AxisMap, ContributionBars, CountMatrix, MethodCompare, RankedResults, TaggedTokens } from "@/kit";
import { island, useIslandReady } from "@/lib/island";
import { useHydrated } from "@/lib/useHydrated";
import { mapAxes } from "./toy";
import { matrixWideCells, matrixWideCols, matrixWideRows } from "./toy-states";
import {
  cardsFour, contribAwkward, logEdge, resultPresets, resultsAwkward, spansAwkward, tfidfCells, tfidfCols, tfidfRows, tokensAwkward,
} from "./toy-states-text";

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

const none = () => undefined;

const VIEWS = {
  "text-tokens-empty": () => <TaggedTokens tokens={[]} gram={{ n: 2 }} source={{ value: "", onChange: none, label: "Raw text" }} />,
  "text-tokens-awkward": () => <TaggedTokens tokens={tokensAwkward} spans={spansAwkward} gram={{ n: 3, active: 4, onActive: none }} />,
  "text-tokens-short": () => <TaggedTokens tokens={[{ text: "one" }, { text: "two" }]} gram={{ n: 3, active: 0 }} />,
  "text-contrib-empty": () => <ContributionBars items={[]} total={{ mode: "sigmoid", bias: -0.4 }} ends={["negative", "positive"]} />,
  "text-contrib-awkward": () => <ContributionBars items={contribAwkward} max={2} ends={["an end label that is rather long on the left", "right"]} />,
  "text-results-awkward": () => <RankedResults columns={resultsAwkward} query={{ value: "", onChange: none, presets: resultPresets }} />,
  "text-results-none": () => <RankedResults columns={[]} />,
  "text-compare-four": () => <MethodCompare cards={cardsFour} facts={[["A fact with a long name", "and a long value"], ["Empty", ""]]} />,
  "text-compare-none": () => <MethodCompare cards={[]} />,
  "text-matrix-ppmi": () => <CountMatrix rows={matrixWideRows} cols={matrixWideCols} cells={matrixWideCells} highlightRow={1} transform="ppmi" nearest caption="PPMI with a row of zeros highlighted: no nearest row." />,
  "text-matrix-tfidf": () => <CountMatrix rows={tfidfRows} cols={tfidfCols} cells={tfidfCells} highlightRow={0} transform="tfidf" nearest caption="TF-IDF: a word in every document weighs 0, and an empty document." />,
  "text-logmap-edge": () => (
    <AxisMap points={logEdge} axes={{ ...mapAxes, left: "a long axis-end label on the left side" }} log diagonal sides={{ above: "above", below: "below" }} selected="huge" height={260} detail={<p>A detail slot under the map.</p>} />
  ),
};

export type TextStateName = keyof typeof VIEWS;

const at = (state: string) => ({ roots: [`[data-state="${state}"]`] });
const name = (state: string) => `kit/states/${state.replace(/(^|-)(\w)/g, (_, _d, c: string) => c.toUpperCase())}State`;

// One island per state, so a fault in one leaves the others alone.
const STATES = Object.fromEntries(
  (Object.keys(VIEWS) as TextStateName[]).map((s) => [s, island(name(s), State(s, VIEWS[s]), Empty(s), at(s))]),
) as Record<TextStateName, ComponentType>;

function View({ state }: { state: TextStateName }) {
  const Shown = STATES[state];
  return <Shown />;
}

function Placeholder({ state }: { state: TextStateName }) {
  return <div data-state={state}></div>;
}

/** <TextState state="text-tokens-empty" />: one Text host on the edge-state page. */
export const TextState = island("kit/states/TextState", View, Placeholder, {
  roots: (Object.keys(VIEWS) as TextStateName[]).map((s) => `[data-state="${s}"]`),
});
