// Slot coverage: every element main's scripts touch must sit behind a slot.
//   node scripts/parity/slot-coverage.mjs --touched file --slots '<glob of slots*.json>' --head <out>
// --touched is a touched.mjs file ([{page, path, id, selector, kinds, count}]);
// each slots JSON is [{selector, slot}]. On the head build, loaded with
// JavaScript disabled (slots are server markup), a touched path is covered when
// it equals or lies inside an element a slot selector matches. Prints every
// uncovered path and exits 1 if there is one; a path that no longer resolves
// counts as uncovered.
import { globSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { chromium } from "playwright";
import { openPage, settle } from "./engine.mjs";
import { PAGES, ROOT, die, launch, outDir, parseArgs, serve } from "./lib.mjs";

const args = parseArgs(process.argv.slice(2));
if (!args.touched || args.touched === true || !args.slots || args.slots === true) {
  die("usage: slot-coverage.mjs --touched file --slots '<glob of slots*.json>' --head <out>");
}
const head = outDir(args.head, "head");

const touched = JSON.parse(readFileSync(args.touched, "utf8"));
if (!Array.isArray(touched)) die(`${args.touched} must be a touched.mjs file (an array)`);
const files = globSync(args.slots, { cwd: ROOT }).sort();
if (!files.length) die(`no slots file matches ${args.slots}`);
const slots = [];
for (const file of files) {
  const list = JSON.parse(readFileSync(resolve(ROOT, file), "utf8"));
  if (!Array.isArray(list)) die(`${file} must be an array of {selector, slot}`);
  for (const s of list) {
    if (!s.selector || !s.slot) die(`${file}: every entry needs selector and slot`);
    slots.push({ ...s, file });
  }
}

const byPage = new Map();
for (const t of touched) {
  const page = t.page ?? args.page;
  if (!page || !(page in PAGES)) die(`${args.touched}: entry ${t.path} names no known page (pass --page)`);
  if (!byPage.has(page)) byPage.set(page, []);
  byPage.get(page).push(t);
}

const srv = await serve(head);
const browser = await launch(chromium);
const uncovered = [];
try {
  for (const [page, list] of byPage) {
    const { context, page: tab, state } = await openPage(browser, { javaScriptEnabled: false });
    state.origin = new URL(srv.base).origin;
    await tab.goto(srv.base + PAGES[page], { waitUntil: "load", timeout: 30000 });
    await settle(tab, state);
    const result = await tab.evaluate(({ paths, selectors }) => {
      const hosts = [];
      const bad = [];
      for (const sel of selectors) {
        try { hosts.push(...document.querySelectorAll(sel)); } catch { bad.push(sel); }
      }
      const out = paths.map((path) => {
        let el = null;
        try { el = document.querySelector(path); } catch { /* not a selector */ }
        if (!el) return "missing";
        return hosts.some((h) => h === el || h.contains(el)) ? "ok" : "uncovered";
      });
      return { out, bad };
    }, { paths: list.map((t) => t.path), selectors: slots.map((s) => s.selector) });
    for (const sel of result.bad) die(`slot selector ${sel} is not valid CSS`);
    list.forEach((t, i) => {
      if (result.out[i] !== "ok") uncovered.push({ page, path: t.path, why: result.out[i], kinds: t.kinds });
    });
    await context.close();
  }
} finally {
  await browser.close();
  srv.close();
}

for (const u of uncovered) {
  console.log(`${u.page} ${u.path}${u.why === "missing" ? " (not found on head)" : ""} [${(u.kinds ?? []).join(", ")}]`);
}
process.exit(uncovered.length ? 1 : 0);
