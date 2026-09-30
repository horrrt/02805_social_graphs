// The scripts the /weeks/week04/ page runs, in the order its old <script> tags ran.
// PageScripts imports this once React has hydrated the page.
import { asset } from "../site.js";
import { run } from "./run.js";

function classic(path) {
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = asset(path).href;
    s.onload = resolve;
    s.onerror = () => reject(new Error(`could not load ${path}`));
    document.head.appendChild(s);
  });
}

// week04-place.js and week04-methods.js load ECharts again if this fails.
await classic("assets/vendor/echarts-5.5.1.min.js").catch((error) => console.error(error));
await run([
  () => import("../week04-place.js"),
  () => import("../week04-frame.js"),
  () => import("../week04-years.js"),
  () => import("../week04-roles.js"),
  () => import("../week04-methods.js"),
  () => import("../week04-skills.js"),
  () => import("../week04-skills-radar.js"),
  () => import("../week04-pagerank.js"),
  () => import("../week04-jobs.js"),
  () => import("../week04-staffing.js"),
  () => import("../week04-questions.js"),
  () => import("../week04-cut.js"),
  () => import("../week04-vis-more.js"),
  () => import("../week04-vis-intros.js"),
  () => import("../week04-vis-staffing.js"),
  () => import("../week04-entities.js"),
]);
