import { AnalogyPlot } from "log-log-legends-kit";
import { analogy } from "@/features/kit-page/toy";

// The kit page's analogy demo: the toy word map from
// src/features/kit-page/toy.ts, first the words alone, then the arithmetic.
export const Words = () => <AnalogyPlot points={analogy} step={0} />;

// Step 2: the relationship carried over to the third word.
export const Arithmetic = () => <AnalogyPlot points={analogy} step={2} />;
