// The scripts the /prototypes/screen-test/ page runs, in the order its old <script> tags ran.
// PageScripts imports this once React has hydrated the page.
import { run } from "./run.js";

await run([
  () => import("../pages/screen-test.js"),
]);
