// The one loader for the vendored libraries in public/assets/vendor/ (ECharts,
// D3, globe.gl, deck.gl). Vendored, not fetched from a CDN: see
// public/assets/vendor/README.md. One <script> per URL, whoever asks first:
// a second copy of a library would replace its global (window.echarts) and
// orphan every chart drawn with the first. A script already in the document
// is reused. A failed load is removed and evicted, so the next call tries
// again. Touches the DOM only when called: Node can import it.
import { asset } from "../site.js";

/** href -> promise */
const loading = new Map();

function settled(script) {
  return new Promise((resolve, reject) => {
    script.addEventListener("load", () => resolve(), { once: true });
    script.addEventListener("error", () => reject(new Error("script error")), { once: true });
  });
}

/**
 * Load assets/vendor/<file> once. Resolves when the script has run; rejects
 * with Error(`could not load ${file}`). Vendor URLs carry no ?v= (asset()).
 */
export function loadVendor(file) {
  const href = asset(`assets/vendor/${file}`).href;
  const cached = loading.get(href);
  if (cached) return cached;
  let script = document.querySelector(`script[src="${href}"]`);
  if (!script) {
    script = document.createElement("script");
    script.src = href;
    script.__ready = settled(script);
    document.head.appendChild(script);
  }
  const promise = (script.__ready ?? settled(script)).then(
    () => undefined,
    () => {
      loading.delete(href);
      script.remove();
      throw new Error(`could not load ${file}`);
    },
  );
  loading.set(href, promise);
  return promise;
}
