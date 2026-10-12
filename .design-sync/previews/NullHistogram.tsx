import { NullHistogram } from "log-log-legends-kit";
import { shuffleReal, shuffleSamples } from "@/features/kit-page/toy-distributions";

// The kit page's shuffle demo after "Shuffle ×100" pressed once: average
// clustering of shuffled toy networks against the real one
// (src/features/kit-page/toy-distributions.ts).
export const HundredShuffles = () => <NullHistogram samples={shuffleSamples} real={shuffleReal} step={100} xLabel="average clustering of a shuffled toy network" realLabel="real" />;

// Every sample drawn, with the normal curve on.
export const AllWithNormal = () => <NullHistogram samples={shuffleSamples} real={shuffleReal} step={shuffleSamples.length} normalOverlay xLabel="average clustering of a shuffled toy network" realLabel="real" />;
