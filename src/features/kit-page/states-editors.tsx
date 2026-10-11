"use client";
// The editors batch's edge states (/styleguide/kit/states/), one island per
// [data-state] host, wrapped by KitStateEditors as states.tsx wraps its own.
// Each renders its host empty on the server and, once hydrated, the component
// in one awkward case, which scripts/kit-states.mjs checks.
import type { ComponentType, ReactNode } from "react";
import { Dendrogram, DetailPanel, EditableMatrix, EgoEditor, NodePicker, PartitionEditor, StageTabs, StepFlow } from "@/kit";
import { island, useIslandReady } from "@/lib/island";
import { useHydrated } from "@/lib/useHydrated";
import { WIDE_LABELS, WIDE_MATRIX, crowdedEgo, forest, longFlow, longItems, longWords, manyStages, tinyPuzzle, wideTree } from "./toy-states-editors";

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

const noNodes = () => ({ nodes: [], links: [] });
const never = () => ({ ok: false, msg: "Never." });

const VIEWS = {
  "ed-dendro-empty": () => <Dendrogram merges={[]} n={0} cut={{ height: 1 }} />,
  "ed-dendro-forest": () => <Dendrogram {...forest} cut={{ height: 9 }} onSelect={() => undefined} metric={{ label: "a score with one point", points: [[2, 0.1]], best: { y: 0.1, label: "the only point" } }} />,
  "ed-dendro-wide": () => {
    const t = wideTree();
    return <Dendrogram {...t} cut={{ clusters: [t.n + 100, t.n + 90, 5, 9999, -1] }} minBlock={1} height={220} />;
  },
  "ed-matrix-empty": () => <EditableMatrix labels={[]} />,
  "ed-matrix-one": () => <EditableMatrix labels={["Only one"]} initial={[[3]]} example={[[1]]} />,
  "ed-matrix-wide": () => <EditableMatrix labels={WIDE_LABELS} initial={WIDE_MATRIX} diagonal caption="Twelve long names, a self-loop, negatives and large decimals in a half-width column." />,
  "ed-partition-lonely": () => <PartitionEditor nodes={[{ id: 0, x: 0.5, y: 0.3, label: "0" }]} edges={[]} groups={["Only group"]} presets={[{ key: "p", label: "A preset longer than the node list", partition: [7, 7, 7] }]} aria="One node and no links" />,
  "ed-ego-none": () => <EgoEditor neighbours={[]} />,
  "ed-ego-crowded": () => <EgoEditor focal="Ego" neighbours={crowdedEgo} initial={{ attached: [0, 1, 2, 15, 99], links: [[0, 1], [1, 1], [2, 5], [0, 15]] }} seed={9} />,
  "ed-picker-tiny": () => <NodePicker k={5} generate={tinyPuzzle} check={never} aria="Three nodes, five to pick" prompt="Pick five of three: the puzzle cannot be solved, and Reveal has nothing to show." />,
  "ed-picker-empty": () => <NodePicker k={3} generate={noNodes} check={never} aria="No nodes" />,
  "ed-flow-empty": () => <StepFlow steps={[]} />,
  "ed-flow-long": () => <StepFlow steps={longFlow} heads={["Process", "Example"]} />,
  "ed-stages-many": () => <StageTabs stages={manyStages} initial={2} label="Twelve stages" />,
  "ed-stages-empty": () => <StageTabs stages={[]} label="No stages" />,
  "ed-detail-empty": () => <DetailPanel kicker="Selected document" />,
  "ed-detail-long": () => (
    <DetailPanel
      kicker="Selected document with a very long kicker that goes on"
      title={"Spider-Man (Marvel Mangaverse) and a much longer title that has to wrap ".repeat(2)}
      sub="A sub line"
      stats={Array.from({ length: 7 }, (_, i) => ({ label: i === 0 ? "A long stat label that wraps" : `Stat ${i}`, value: i === 1 ? 1234567.89 : i }))}
      words={longWords}
      items={longItems}
      nearest={[
        { title: "Nearest by a long-named measure of similarity", rows: Array.from({ length: 5 }, (_, i) => ({ key: String(i), label: i === 0 ? "averyveryverylongnamewithnospaces".repeat(2) : `Page ${i}`, score: 1 - i * 0.137, onPick: () => undefined })) },
        { title: "Nearest on the map", rows: [] },
        { title: "A third list, which is dropped", rows: [{ key: "x", label: "never shown", score: "2D" }] },
      ]}
    />
  ),
};

export type EditorsStateName = keyof typeof VIEWS;

const at = (state: string) => ({ roots: [`[data-state="${state}"]`] });
const name = (state: string) => `kit/states/${state.replace(/(^|-)(\w)/g, (_, _d, c: string) => c.toUpperCase())}State`;

// One island per state, so a fault in one leaves the others alone.
const STATES = Object.fromEntries(
  (Object.keys(VIEWS) as EditorsStateName[]).map((s) => [s, island(name(s), State(s, VIEWS[s]), Empty(s), at(s))]),
) as Record<EditorsStateName, ComponentType>;

function View({ state }: { state: EditorsStateName }) {
  const Shown = STATES[state];
  return <Shown />;
}

function Placeholder({ state }: { state: EditorsStateName }) {
  return <div data-state={state}></div>;
}

/** <KitStateEditors state="ed-dendro-empty" />: one host of the editors batch on the edge-state page. */
export const KitStateEditors = island("kit/states/KitStateEditors", View, Placeholder, {
  roots: (Object.keys(VIEWS) as EditorsStateName[]).map((s) => `[data-state="${s}"]`),
});
