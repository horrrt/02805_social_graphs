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

// Text: tokens, contributions, search results and method comparisons for the
// language weeks. Their methods are DOM-free in text-core.js.
export { default as TaggedTokens } from "./TaggedTokens";
export type { TaggedToken, TokenGram, TokenSource, TokenSpan, TokenTone } from "./TaggedTokens";
export { default as ContributionBars } from "./ContributionBars";
export type { Contribution, ContributionTotal } from "./ContributionBars";
export { default as RankedResults } from "./RankedResults";
export type { ResultColumn, ResultDoc, ResultQuery } from "./RankedResults";
export { default as MethodCompare } from "./MethodCompare";
export type { MethodCard } from "./MethodCompare";
export type { MatrixTransform } from "./CountMatrix";
export type { MapSides } from "./AxisMap";
// ---- Distributions and nulls (dist-core.js holds the numbers; import it directly)
export { default as DistributionPlot } from "./DistributionPlot";
export type { AxisScale, DistSeries, DistView, Envelope, RefCurve, TopList } from "./DistributionPlot";
export { default as NullHistogram } from "./NullHistogram";
export { default as NullBoard } from "./NullBoard";
export type { BoardAxis, BoardCell } from "./NullBoard";
export type { Verdict } from "./nullBits";
export { default as NullBars } from "./NullBars";
export type { NullBarRow } from "./NullBars";
// ---- Editors and puzzles: a cut dendrogram, an editable matrix, a partition
// to edit, an ego network, a pick-k puzzle, a pipeline, a strip of stages and
// a detail panel. Their pure helpers are dendro-core.js and matrix-core.js.
export { default as Dendrogram } from "./Dendrogram";
export type { DendroBlock, DendroCut, DendroMetric, DendroTree, Merge } from "./Dendrogram";
export { default as EditableMatrix } from "./EditableMatrix";
export { default as PartitionEditor } from "./PartitionEditor";
export type { PartitionPreset } from "./PartitionEditor";
export { default as EgoEditor } from "./EgoEditor";
export type { Ego } from "./EgoEditor";
export { default as NodePicker } from "./NodePicker";
export type { PickerGraph, PickerVerdict } from "./NodePicker";
export type { NetId } from "./network/layout";
export { default as StepFlow } from "./StepFlow";
export type { FlowStep } from "./StepFlow";
export { default as StageTabs } from "./StageTabs";
export type { Stage } from "./StageTabs";
export { default as DetailPanel } from "./DetailPanel";
export type { DetailItem, DetailStat, NearestList, NearestRow } from "./DetailPanel";
// ---- Growth: replay, nonlinear attachment, components, friendship paradox
// (growth-core.js holds the numbers; import it directly)
export { default as GrowthReplay } from "./GrowthReplay";
export type { ArrivalCard, GrowthMode } from "./GrowthReplay";
export { default as GrowthLab } from "./GrowthLab";
export { default as ComponentGallery } from "./ComponentGallery";
export { default as FriendshipParadox } from "./FriendshipParadox";
