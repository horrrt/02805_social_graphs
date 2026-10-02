import { chromium } from "playwright";
import { launch, serve, loadPageLib } from "./lib.mjs";
import { openPage, settle, runStep, functionsFor, snapshot } from "./engine.mjs";
const [out, pageName, url, stepsJson] = process.argv.slice(2);
const srv = await serve(out);
const browser = await launch(chromium);
const { page, state } = await openPage(browser, {});
state.origin = new URL(srv.base).origin;
let t = Date.now();
await page.goto(srv.base + url, { waitUntil: "load" });
await settle(page, state);
console.log("load+settle", Date.now() - t);
const functions = functionsFor({}, await loadPageLib(pageName));
const mutations = await page.evaluate(() => new Promise((res) => { let n = 0; const mo = new MutationObserver((l) => { n += l.length; }); mo.observe(document.documentElement, { childList: true, subtree: true, attributes: true, characterData: true }); setTimeout(() => { mo.disconnect(); res(n); }, 2000); }));
console.log("mutations in 2 s idle:", mutations);
for (const step of JSON.parse(stepsJson)) {
  t = Date.now();
  if (step.snap) { await snapshot(page, state, {}); console.log("snap", Date.now() - t); continue; }
  await runStep(page, state, step, { functions }); console.log(JSON.stringify(step).slice(0, 60), Date.now() - t);
}
await browser.close(); srv.close();
