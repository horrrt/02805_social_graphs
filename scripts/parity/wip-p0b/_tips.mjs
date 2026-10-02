// Scratch: builds fixtures/hovertips/week05.json (deleted before commit).
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "playwright";
import { launch, serve, HERE, BASE_PATH } from "./lib.mjs";
import { openPage, settle } from "./engine.mjs";

const [out] = process.argv.slice(2);
const srv = await serve(out);
const browser = await launch(chromium);
const runs = [{ profile: null }, { profile: null }, { profile: "slow" }];
const states = {}; // host -> state -> Map(html -> runs[])
const add = (host, state, html, run) => {
  const s = ((states[host] ??= {})[state] ??= new Map());
  s.set(html, [...(s.get(html) ?? []), run]);
};
const grab = (page) => page.evaluate(() => Object.fromEntries([...document.querySelectorAll('[id^="chart-"]')].map((h) => [h.id,
  h.outerHTML.replace(/ _echarts_instance_="[^"]*"/g, "").split(location.origin).join("ORIGIN")])));
for (const [i, r] of runs.entries()) {
  const run = `${i + 1}${r.profile ? " (slow)" : ""}`;
  const { context, page, state } = await openPage(browser, { profile: r.profile });
  state.origin = new URL(srv.base).origin;
  await page.goto(srv.base + "weeks/week05/", { waitUntil: "load" });
  await settle(page, state);
  for (const [h, html] of Object.entries(await grab(page))) add(h, "load", html, run);
  await page.click("details.rx-drawer:has(#chart-autocomplete-modularity) > summary");
  await page.waitForTimeout(300);
  const hosts = await page.evaluate(() => [...document.querySelectorAll('[id^="chart-"]')].map((h) => [h.id, !!h.querySelector("[data-tip]")]));
  for (const [id, has] of hosts) {
    if (!has) continue;
    const loc = page.locator(`#${id} [data-tip]`).first();
    await loc.scrollIntoViewIfNeeded();
    const b = await loc.boundingBox();
    await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2);
    await page.evaluate(() => new Promise((res) => requestAnimationFrame(() => requestAnimationFrame(res))));
    await page.waitForTimeout(150);
    add(id, "hover", (await grab(page))[id], run);
  }
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.waitForTimeout(1500);
  await page.evaluate(() => new Promise((res) => requestAnimationFrame(() => requestAnimationFrame(res))));
  for (const [h, html] of Object.entries(await grab(page))) add(h, "resize", html, run);
  await context.close();
}
await browser.close(); srv.close();
const fixture = {
  page: "week05",
  how: "Main's export, three runs (the third with --profile slow). For every [id^=\"chart-\"] host: its outerHTML after the page settles (load); after the pointer moves onto its first [data-tip] (hover; hosts are hovered in document order after the modularity drawer is opened; hosts without a [data-tip] have no hover state); and after the viewport is resized to 1280x800 (resize). _echarts_instance_ attributes are dropped and the server origin reads ORIGIN. Each state lists its distinct DOMs and the runs that produced each one (KB07: the tip's position among the host's children depends on draw and hover history).",
  hosts: Object.fromEntries(Object.entries(states).map(([h, st]) => [h, Object.fromEntries(Object.entries(st).map(([s, m]) => [s, [...m].map(([html, rs]) => ({ runs: rs, html }))]))])),
};
mkdirSync(join(HERE, "fixtures/hovertips"), { recursive: true });
writeFileSync(join(HERE, "fixtures/hovertips/week05.json"), JSON.stringify(fixture, null, 1) + "\n");
for (const [h, st] of Object.entries(fixture.hosts)) console.log(h, Object.entries(st).map(([s, v]) => `${s}:${v.length}`).join(" "));
