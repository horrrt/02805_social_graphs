// The scripts the /weeks/week04/ page runs, in the order its old <script> tags ran.
// PageScripts imports this once React has hydrated the page.
import { asset } from "../site.js";

function classic(path) {
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = asset(path).href;
    s.onload = resolve;
    s.onerror = () => reject(new Error(`could not load ${path}`));
    document.head.appendChild(s);
  });
}

await classic("assets/vendor/echarts-5.5.1.min.js");
// Static imports keep the old tag order without making each module wait for
// the previous one to finish loading its data.
await import("./week04-modules.js");
