// P0b base scenario for Week 3 under ?variant=globe, part a: the controls
// (see steps.mjs; the steps are split over base-globe.mjs and base-globe-b.mjs).
import { variantScenarios } from "./steps.mjs";

export default variantScenarios("globe", { hist: "#hist", scatter: "#scatter-z", globe: "#globe-gl" }, { noAudit: true, webgl: true, part: "a" });
