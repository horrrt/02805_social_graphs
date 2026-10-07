"use client";
// The edge-state page's demos (/styleguide/kit/states/), one island per
// [data-state] host, as demos.tsx does for the kit page. Each renders its host
// empty on the server and, once hydrated, the component in one awkward case.
// A component that throws leaves its host empty, which
// scripts/kit-states.mjs reports.
import type { ComponentType, ReactNode } from "react";
import {
  AnalogyPlot, AxisMap, Concordance, CountMatrix, EChart, Figure, GuessRanker, MiniStrip, MixtureBar, Passage, RankedBars, SplitBars,
  StripChart, SweepCurve, Table, TermText, TokenWindow, VectorAngle,
} from "@/kit";
import { island, useIslandReady } from "@/lib/island";
import { useHydrated } from "@/lib/useHydrated";
import {
  analogySame, echartEmpty, echartLongLabels, guessTieItems, guessTieScore, kwicLong, mapOne, matrixWideCells, matrixWideCols,
  matrixWideRows, miniEdge, mixTiny, passageNoMatch, passageRegex, rankedAwkward, splitLong, stripAllOpts, stripAllRows,
  stripManyOpts, stripManyRows, stripNarrowRows, sweepOne, tableAwkward, tableEmpty, termMissing, tokensLong,
} from "./toy-states";
import { mapAxes, splitParts, stripOpts, toyCaption, toyOption, toyTable } from "./toy";

// One state's view: its host, and inside it once hydrated what draw() returns.
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
  "strip-all": () => <StripChart rows={stripAllRows} opts={stripAllOpts} />,
  "strip-many": () => <StripChart rows={stripManyRows} opts={stripManyOpts} />,
  "strip-empty": () => <StripChart rows={[]} opts={{ ...stripOpts, aria: "Toy strip chart with no rows" }} />,
  "strip-narrow": () => <StripChart rows={stripNarrowRows} opts={{ ...stripOpts, aria: "Toy strip chart in a half-width column" }} />,
  "mini-edge": () => <MiniStrip spec={miniEdge} />,
  "table-empty": () => <Table caption="Toy table with no rows" {...tableEmpty} />,
  "table-awkward": () => <Table caption="Toy table: long, missing and negative values" {...tableAwkward} />,
  "kwic-empty": () => <Concordance rows={[]} caption="Toy concordance with no hits" />,
  "kwic-long": () => <Concordance rows={kwicLong} caption="Toy concordance: long contexts and an empty one" />,
  "passage-nomatch": () => <Passage {...passageNoMatch} />,
  "passage-regex": () => <Passage {...passageRegex} />,
  "figure-empty": () => <Figure chart={<EChart option={echartEmpty} height={220} />} caption="Toy figure with no data." />,
  "figure-narrow": () => <Figure chart={<EChart option={echartLongLabels} height={220} />} caption="Toy figure in a half-width column, long category labels." />,
  "figure-bare": () => <Figure chart={<EChart option={toyOption} height={220} />} />,
  "figure-table": () => <Figure caption={toyCaption} data={toyTable} />,
  "vector-zero": () => <VectorAngle a={[-3, 1]} b={[0, 0]} labels={{ a: "A long label for A", b: "zero" }} />,
  "vector-opposite": () => <VectorAngle a={[3, -1]} b={[-6, 2]} labels={{ a: "A", b: "B" }} scaleB={3} onScaleB={() => undefined} />,
  "split-long": () => <SplitBars rows={splitLong} parts={splitParts} max={1} onPick={() => undefined} />,
  "split-empty": () => <SplitBars rows={[]} parts={splitParts} />,
  "sweep-one": () => <SweepCurve points={sweepOne} current={500} refLine={{ y: 99, label: "a reference far above the curve" }} xLabel="x" yLabel="y" />,
  "sweep-empty": () => <SweepCurve points={[]} xLabel="x" yLabel="y" />,
  "tokens-edge": () => <TokenWindow tokens={tokensLong} centre={9} window={0} mode="cbow" />,
  "tokens-empty": () => <TokenWindow tokens={[]} centre={0} window={2} />,
  "matrix-wide": () => <CountMatrix rows={matrixWideRows} cols={matrixWideCols} cells={matrixWideCells} highlightRow={1} caption="Eighteen long column heads and a row of zeros." />,
  "matrix-empty": () => <CountMatrix rows={[]} cols={[]} cells={[]} highlightRow={4} />,
  "mix-awkward": () => <MixtureBar parts={mixTiny} focus="Tiny" onFocus={() => undefined} words={[]} />,
  "ranked-awkward": () => <RankedBars rows={rankedAwkward} colHeads={["Count"]} title="Long, zero, negative and muted rows; more columns than heads" />,
  "ranked-empty": () => <RankedBars rows={[]} colHeads={["On page", "Pages"]} />,
  "axismap-one": () => <AxisMap points={mapOne} axes={{ ...mapAxes, left: "a long axis-end label on the left side" }} find="only" height={240} />,
  "axismap-empty": () => <AxisMap points={[]} axes={mapAxes} height={200} />,
  "analogy-same": () => <AnalogyPlot points={analogySame} step={2} />,
  "guess-spent": () => <GuessRanker items={guessTieItems} score={guessTieScore} target="x" budget={0} />,
  "term-missing": () => (
    <p>
      <TermText {...termMissing} />
    </p>
  ),
};

export type StateName = keyof typeof VIEWS;

const at = (state: string) => ({ roots: [`[data-state="${state}"]`] });
const name = (state: string) => `kit/states/${state.replace(/(^|-)(\w)/g, (_, _d, c: string) => c.toUpperCase())}State`;

// One island per state, so a fault in one leaves the others alone.
const STATES = Object.fromEntries(
  (Object.keys(VIEWS) as StateName[]).map((s) => [s, island(name(s), State(s, VIEWS[s]), Empty(s), at(s))]),
) as Record<StateName, ComponentType>;

function View({ state }: { state: StateName }) {
  const Shown = STATES[state];
  return <Shown />;
}

function Placeholder({ state }: { state: StateName }) {
  return <div data-state={state}></div>;
}

/** <KitState state="strip-all" />: one host on the edge-state page. */
export const KitState = island("kit/states/KitState", View, Placeholder, {
  roots: (Object.keys(VIEWS) as StateName[]).map((s) => `[data-state="${s}"]`),
});
