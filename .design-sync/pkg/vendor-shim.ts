// Stands in for src/scripts/runtime/vendor.js in the Claude Design bundle.
// The site loads ECharts and D3 from public/assets/vendor/ by <script>; a
// Claude Design page has no such path, so the bundle carries both files.
// The repo is "type": "module", so esbuild reads them as ES modules without
// exports and their UMD wrappers set globalThis.echarts and globalThis.d3,
// the globals useVendor() reads. The kit needs no other vendored library
// (deck.gl and globe.gl are for pages).
import "../../public/assets/vendor/echarts-5.5.1.min.js";
import "../../public/assets/vendor/d3-7.9.0.min.js";

const GLOBALS: Record<string, string> = {
  "echarts-5.5.1.min.js": "echarts",
  "d3-7.9.0.min.js": "d3",
};

/** loadVendor("echarts-5.5.1.min.js") -> resolves when window.echarts is there. */
export function loadVendor(file: string): Promise<void> {
  const name = GLOBALS[file];
  if (!name || !(globalThis as Record<string, unknown>)[name]) return Promise.reject(new Error(`could not load ${file}`));
  return Promise.resolve();
}
