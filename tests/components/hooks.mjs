// Module hooks for the component tests. Passed to node with --import, so they
// are in place before the test's imports resolve.
//
// A stylesheet a component imports (import "@/styles/rail.css") loads as an
// empty module: Next bundles the CSS, Node cannot run it, and jsdom applies no
// layout for a component test to read anyway.
//
// "next/error" resolves to ./next-error.mjs. next/error.js adds catchError
// with a getter Node's CommonJS export detection misses, so under Node
// `import { catchError } from "next/error"` (src/lib/island.tsx) fails, while
// Next's bundler reads it fine. The shim re-exports the same module.
import { registerHooks } from "node:module";

const nextError = new URL("./next-error.mjs", import.meta.url).href;

registerHooks({
  resolve(specifier, context, next) {
    if (specifier === "next/error") return { url: nextError, shortCircuit: true };
    return next(specifier, context);
  },
  load(url, context, next) {
    if (new URL(url).pathname.endsWith(".css")) return { format: "module", source: "", shortCircuit: true };
    return next(url, context);
  },
});
