// next/error with named exports Node can see; tests/components/hooks.mjs
// resolves "next/error" here. It requires "next/error.js", a specifier the
// hook leaves alone, so it loads the real module. The default export is the
// Error page component, as Next's bundler gives it.
import { createRequire } from "node:module";

const nextError = createRequire(import.meta.url)("next/error.js");

export default nextError.default;
export const catchError = nextError.catchError;
