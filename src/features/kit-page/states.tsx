"use client";
// The edge-state page's demos (/styleguide/kit/states/), one island per
// [data-state] host, as demos.tsx does for the kit page. Each renders its host
// empty on the server and, once hydrated, the component in one awkward case.
// A component that throws leaves its host empty, which
// scripts/kit-states.mjs reports.
import type { ComponentType, ReactNode } from "react";
import { Concordance, EChart, Figure, MiniStrip, Passage, StripChart, Table, TermText } from "@/kit";
import { island, useIslandReady } from "@/lib/island";
import { useHydrated } from "@/lib/useHydrated";
import {
  echartEmpty, echartLongLabels, kwicLong, miniEdge, passageNoMatch, passageRegex, stripAllOpts, stripAllRows,
  stripManyOpts, stripManyRows, stripNarrowRows, tableAwkward, tableEmpty, termMissing,
} from "./toy-states";
import { stripOpts, toyCaption, toyOption, toyTable } from "./toy";

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
