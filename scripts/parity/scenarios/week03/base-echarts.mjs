// P0b base scenario for Week 3 under ?variant=echarts: see steps.mjs for the steps.
import { variantScenarios } from "./steps.mjs";

export default variantScenarios("echarts", { hist: "#hist-ec", scatter: "#scatter-z-ec", globe: "#globe-canvas" }, { auditThrows: true });
