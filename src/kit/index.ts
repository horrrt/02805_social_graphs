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

// ---- Distributions and nulls (dist-core.js holds the numbers; import it directly)
export { default as DistributionPlot } from "./DistributionPlot";
export type { AxisScale, DistSeries, DistView, Envelope, RefCurve, TopList } from "./DistributionPlot";
export { default as NullHistogram } from "./NullHistogram";
export { default as NullBoard } from "./NullBoard";
export type { BoardAxis, BoardCell } from "./NullBoard";
export type { Verdict } from "./nullBits";
export { default as NullBars } from "./NullBars";
export type { NullBarRow } from "./NullBars";
