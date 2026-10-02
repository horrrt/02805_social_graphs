import { chromium } from "playwright";
import { launch, serve, PAGES } from "./lib.mjs";
import { openPage, settle } from "./engine.mjs";
const [out, pageName, url] = process.argv.slice(2);
const srv = await serve(out);
const browser = await launch(chromium);
const { page, state } = await openPage(browser, {});
state.origin = new URL(srv.base).origin;
await page.goto(srv.base + (url ?? PAGES[pageName]), { waitUntil: "load" });
await settle(page, state);
const info = await page.evaluate(() => {
  const d = (el) => { const r = el.getBoundingClientRect(); return `${el.tagName.toLowerCase()}${el.id ? "#" + el.id : ""}${el.className && typeof el.className === "string" ? "." + el.className.trim().split(/\s+/).join(".") : ""}${[...el.attributes].filter(a=>a.name.startsWith("data-")||a.name==="aria-label"||a.name==="type"||a.name==="name").map(a=>`[${a.name}=${a.value.slice(0,30)}]`).join("")} ${r.width>0?"vis":"hid"} "${(el.innerText||el.value||"").replace(/\s+/g," ").slice(0,40)}"`; };
  return {
    ids: [...document.querySelectorAll("[id]")].map((e) => e.id).join(" "),
    controls: [...document.querySelectorAll("button, select, input, textarea, details > summary, a[href^='#'], [role=button], [tabindex]")].map(d),
    console: null,
  };
});
console.log("IDS:", info.ids);
console.log(info.controls.join("\n"));
console.log("CONSOLE:", state.console.join("\n"));
await browser.close(); srv.close();
