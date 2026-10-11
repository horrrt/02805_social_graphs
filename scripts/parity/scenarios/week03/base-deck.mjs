// P0b base scenario for Week 3 under ?variant=deck: see steps.mjs for the steps.
import { variantScenarios } from "./steps.mjs";

export default variantScenarios("deck", { hist: "#hist", scatter: "#scatter-z", globe: "#globe-canvas-deck" }, { webgl: true });
