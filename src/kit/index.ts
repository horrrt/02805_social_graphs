// The React kit: the components a section island draws with, from one import.
// README.md documents every export; tests/kit.test.mjs keeps the two in step.
//
//   import { Figure, EChart, StripChart, Concordance } from "@/kit";

export { default as StripChart } from "./StripChart";
export { default as MiniStrip } from "./MiniStrip";
export { default as NetworkView } from "./NetworkView";
export type { NetLink, NetNode, NetworkSpec, NodeInfo } from "./NetworkView";
export { default as Table } from "./Table";
export { default as DecoratedTable } from "./DecoratedTable";
export { default as Figure } from "./Figure";
export { default as EChart } from "./EChart";
export { default as Concordance } from "./Concordance";
export { default as Passage } from "./Passage";
export { wikiLink } from "./wikiLink";
export { default as TermText } from "./TermText";
export { default as TipBox } from "./TipBox";
export { default as HoverTipHost } from "./HoverTipHost";
export { palette } from "./palette";
export { default as VectorAngle } from "./VectorAngle";
export { default as SplitBars } from "./SplitBars";
export type { SplitPart, SplitRow } from "./SplitBars";
export { default as SweepCurve } from "./SweepCurve";
export { default as TokenWindow } from "./TokenWindow";
export { default as CountMatrix } from "./CountMatrix";
export { default as MixtureBar } from "./MixtureBar";
export type { MixPart } from "./MixtureBar";
export { default as RankedBars } from "./RankedBars";
export type { RankedRow } from "./RankedBars";
export { default as AxisMap } from "./AxisMap";
export type { MapAxes, MapPoint } from "./AxisMap";
export { default as AnalogyPlot } from "./AnalogyPlot";
export type { AnalogyPoints } from "./AnalogyPlot";
export { default as GuessRanker } from "./GuessRanker";
export type { GuessItem, Scores } from "./GuessRanker";

// Networks: a canvas network for big graphs, a player that steps a process,
// a row of readouts. Their models and measures are in ./graph-core.js.
export { default as NetCanvas } from "./NetCanvas";
export type { CanvasLink, CanvasNode, NetCanvasSpec, NodeState, Point } from "./NetCanvas";
export { default as StepPlayer, useStepper } from "./StepPlayer";
export type { Rng, StepAction, Stepper, StepperOptions } from "./StepPlayer";
export { default as Readouts } from "./Readouts";
export type { ReadoutItem } from "./Readouts";
