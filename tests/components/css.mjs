// Loads a stylesheet a component imports (import "@/styles/rail.css") as an
// empty module: Next bundles the CSS, Node cannot run it, and jsdom applies
// no layout for a component test to read anyway. Passed to node with --import,
// so the hook is in place before the test's imports resolve.
import { registerHooks } from "node:module";

registerHooks({
  load(url, context, next) {
    if (new URL(url).pathname.endsWith(".css")) return { format: "module", source: "", shortCircuit: true };
    return next(url, context);
  },
});
