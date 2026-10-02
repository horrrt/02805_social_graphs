// Scratch: builds fixtures/terms/<page>.json (deleted before commit).
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "playwright";
import { launch, serve, PAGES, ROOT, HERE } from "./lib.mjs";
import { openPage, settle, runStep } from "./engine.mjs";

const [out, pageName, outFile, ...modules] = process.argv.slice(2);
const OPEN = {
  week04: ["#place-backbone", "#cut-skills", "#cut-pagerank", "#cut-methods", "#cut-roles", "#cut-years"],
  week05: [],
  template: [],
};
const SERVER = { // arg0 expression -> selector of a server-rendered element
  'document.querySelector("#second-did p")': "#second-did p",
  did: null, // filled per module below
  '$("w4m-gn-lead")': "#w4m-gn-lead",
  '$("w4m-overlap-lead")': "#w4m-overlap-lead",
  el: "#place-snap-note",
  'document.getElementById("heaps-surprise")': "#heaps-surprise",
};
const DID = { "week05-fame.js": "#fame-did", "week05-autocomplete.js": "#autocomplete-did", "week05-copying.js": "#copying-did", "week05-heaps.js": "#heaps-did", "week05-search.js": "#search-did", "week05-relations.js": "#relations-did", "week05-weird.js": "#weird-did" };

function splitArgs(src, start) {
  let depth = 0, i = start, args = [], cur = "", q = null;
  for (; i < src.length; i++) {
    const c = src[i];
    if (q) { cur += c; if (c === "\\") { cur += src[++i]; continue; } if (c === q) q = null; continue; }
    if (c === '"' || c === "'" || c === "`") { q = c; cur += c; continue; }
    if (c === "(" || c === "[" || c === "{") depth++;
    if (c === ")" || c === "]" || c === "}") { if (depth === 0) { args.push(cur.trim()); return args; } depth--; }
    if (c === "," && depth === 0) { args.push(cur.trim()); cur = ""; continue; }
    cur += c;
  }
  return args;
}
const literal = (e) => { const lit = String.raw`(?:"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|\`(?:\\.|[^\`\\$])*\`)`; if (new RegExp(`^${lit}(?:\\s*\\+\\s*${lit})*$`).test(e.trim())) return Function(`return (${e})`)(); return null; };

const calls = [];
for (const m of modules) {
  const src = readFileSync(join(ROOT, "src/scripts", m), "utf8");
  const re = /(^|[^.\w])termify\(/g;
  let match, order = 0;
  while ((match = re.exec(src))) {
    const at = match.index + match[1].length;
    const before = src.slice(Math.max(0, at - 60), at);
    if (/import\s*\{[^}]*$/.test(before) || /function\s+$/.test(before)) continue;
    const line = src.slice(0, at).split("\n").length;
    const lineText = src.split("\n")[line - 1];
    if (/^\s*(\/\/|\*)/.test(lineText) || /import /.test(lineText)) continue;
    const args = splitArgs(src, at + "termify(".length);
    order++;
    const sel = args[0] === "did" ? DID[m] : (SERVER[args[0]] ?? null);
    calls.push({ module: `src/scripts/${m}`, line, arg: args[0], selector: sel, phrase: literal(args[1]), definitionSource: args[2], definition: literal(args[2]), id: literal(args[3]), order });
  }
}

const srv = await serve(out);
const browser = await launch(chromium);
const { page, state } = await openPage(browser, {});
state.origin = new URL(srv.base).origin;
await page.goto(srv.base + PAGES[pageName], { waitUntil: "load" });
await settle(page, state);
for (const h of OPEN[pageName]) { await runStep(page, state, { hash: h }, { functions: {} }); await page.waitForTimeout(2500); }
await settle(page, state);
const rt = await page.evaluate((calls) => calls.map((c) => {
  const pop = document.getElementById(c.id);
  const term = pop?.closest(".w4-term");
  const el = c.selector ? document.querySelector(c.selector) : term?.parentElement;
  const path = (e) => { const parts = []; for (let x = e; x && x !== document.body; x = x.parentElement) { if (x.id) { parts.unshift(`#${x.id}`); break; } const same = [...(x.parentElement?.children ?? [])].filter((y) => y.tagName === x.tagName); parts.unshift(`${x.tagName.toLowerCase()}:nth-of-type(${same.indexOf(x) + 1})`); } return parts.join(" > "); };
  return { matched: !!term, definition: pop?.textContent ?? null, runtimeSelector: el ? path(el) : null, after: el?.outerHTML ?? null };
}), calls);
await browser.close(); srv.close();

const rows = [];
for (const [i, c] of calls.entries()) {
  let raw = null;
  if (c.selector) {
    const tmp = join(HERE, `_raw-${process.pid}.json`);
    execFileSync(process.execPath, [join(HERE, "capture.mjs"), "--out", out, "--page", pageName, "--select", c.selector, "--raw", "--save", tmp], { stdio: "ignore" });
    raw = JSON.parse(readFileSync(tmp, "utf8"))[0].html;
    execFileSync("rm", [tmp]);
  }
  const r = rt[i];
  rows.push({
    module: c.module, line: c.line, selector: c.selector ?? r.runtimeSelector, serverRendered: !!c.selector,
    phrase: c.phrase, definition: r.definition ?? c.definition, id: c.id, order: c.order, afterData: true,
    matched: r.matched, raw, after: r.after,
  });
}
mkdirSync(join(HERE, "fixtures/terms"), { recursive: true });
writeFileSync(outFile, JSON.stringify(rows, null, 1) + "\n");
console.log(pageName, rows.length, "calls;", rows.filter((r) => r.matched).length, "matched;", rows.filter((r) => !r.definition || !r.phrase || !r.id || !r.after).map((r) => `${r.module}:${r.line}`).join(" "));
