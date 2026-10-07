// The scripts the /weeks/week04/ page runs, in the order its old <script> tags ran.
// PageScripts imports this once React has hydrated the page.
import { loadVendor } from "../runtime/vendor.js";
import { run } from "./run.js";

function classic(path) {
  return loadVendor(path.replace(/^assets\/vendor\//, "")).catch(() => {
    throw new Error(`could not load ${path}`);
  });
}

await classic("assets/vendor/echarts-5.5.1.min.js").catch((error) => console.error(error));
await run([
]);
