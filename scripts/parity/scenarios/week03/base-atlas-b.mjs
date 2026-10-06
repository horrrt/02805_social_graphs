// P0b base scenario for Week 3 under ?variant=atlas, part b: the hovers, clicks, drag and resize
// (see steps.mjs; the steps are split over base-atlas.mjs and base-atlas-b.mjs).
import { variantScenarios } from "./steps.mjs";

export default variantScenarios("atlas", { hist: "#hist", scatter: "#scatter-z", globe: "#globe-atlas" }, { noAudit: true, webgl: true, part: "b" });
