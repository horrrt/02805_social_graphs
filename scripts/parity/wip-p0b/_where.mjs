import { chromium } from "playwright";
import { launch, serve, PAGES } from "./lib.mjs";
import { openPage, settle } from "./engine.mjs";
const [out, pageName, ...sels] = process.argv.slice(2);
const srv = await serve(out);
const browser = await launch(chromium);
const { page, state } = await openPage(browser, {});
state.origin = new URL(srv.base).origin;
await page.goto(srv.base + (process.env.URL ?? PAGES[pageName]), { waitUntil: "load" });
await settle(page, state);
const info = await page.evaluate((sels) => sels.map((sel) => {
  const els = [...document.querySelectorAll(sel)];
  return `${sel}: ${els.length} ` + els.slice(0, 3).map((el) => {
    const chain = [];
    for (let p = el.parentElement; p; p = p.parentElement) if (p.tagName === "DETAILS") chain.unshift(`${p.open ? "open" : "CLOSED"} details${p.id ? "#" + p.id : ""}${p.className ? "." + String(p.className).split(" ").join(".") : ""} sum="${(p.querySelector(":scope > summary")?.textContent || "").replace(/\s+/g, " ").trim().slice(0, 50)}" idanc=${p.parentElement?.closest("[id]")?.id}`);
    const r = el.getBoundingClientRect();
    const opts = el.tagName === "SELECT" ? " opts=" + [...el.options].map((o) => o.value).join("|") : ""; const ty = el.tagName === "INPUT" ? ` type=${el.type} val=${el.value} min=${el.min} max=${el.max}` : "";
    return `[${r.width > 0 ? "vis" : "hid"}${opts}${ty} y=${Math.round(r.top + scrollY)} ${chain.join(" / ")}]`;
  }).join(" ");
}), sels);
console.log(info.join("\n"));
await browser.close(); srv.close();
