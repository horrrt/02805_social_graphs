import { chromium } from "playwright";
import { launch, serve, loadPageLib } from "./lib.mjs";
import { openPage, settle, runStep, functionsFor } from "./engine.mjs";
const [out, pageName, url, stepsJson, expr] = process.argv.slice(2);
const srv = await serve(out);
const browser = await launch(chromium);
const { page, state } = await openPage(browser, {});
state.origin = new URL(srv.base).origin;
await page.goto(srv.base + url, { waitUntil: "load" });
await settle(page, state);
const functions = functionsFor({}, await loadPageLib(pageName));
for (const step of JSON.parse(stepsJson)) {
  try { const v = await runStep(page, state, step, { functions }); console.log("step", JSON.stringify(step).slice(0,80), "->", (process.env.FULL ? JSON.stringify(v) : JSON.stringify(v)?.slice(0, 300))); }
  catch (e) { console.log("step", JSON.stringify(step), "ERR", e.message.split("\n")[0]); }
}
console.log(await page.evaluate(expr));
console.log("CONSOLE", state.console.join("\n"));
await browser.close(); srv.close();
