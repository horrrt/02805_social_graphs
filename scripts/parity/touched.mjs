// Records every server-rendered element main's scripts look up, listen on or
// mutate, so prep batches can prove each one sits behind a slot.
//   node scripts/parity/touched.mjs --out <out> --page p [--scenario f] --save file
// The elements present at DOMContentLoaded are the reference set. From the
// first task after it, lookups (getElementById, querySelector(All),
// getElementsByClassName/TagName, closest, matches), addEventListener and DOM
// mutations are recorded; a node created later maps to its nearest ancestor
// from the reference set. html, body, head, script and template are ignored.
// {evaluate} steps run paused, so harness helpers do not count as page code.
import { writeFileSync } from "node:fs";
import { chromium } from "playwright";
import { functionsFor, openPage, runStep, settle, stepKind } from "./engine.mjs";
import { PAGES, die, elapsed, launch, loadPageLib, loadScenario, outDir, parseArgs, serve } from "./lib.mjs";

const args = parseArgs(process.argv.slice(2));
const t0 = Date.now();
if (!args.page || !(args.page in PAGES)) die("usage: touched.mjs --out <out> --page p [--scenario f] --save file");
if (!args.save || args.save === true) die("--save <file> is required");
const out = outDir(args.out, "out");

/** Runs in the page before any script. */
function touchedInit() {
  const initial = new WeakSet();
  const paths = new WeakMap();
  const records = new Map();
  let armed = false;
  let busy = false;
  const P = {
    byId: Document.prototype.getElementById,
    dq: Document.prototype.querySelector,
    dqa: Document.prototype.querySelectorAll,
    eq: Element.prototype.querySelector,
    eqa: Element.prototype.querySelectorAll,
    dcls: Document.prototype.getElementsByClassName,
    dtag: Document.prototype.getElementsByTagName,
    ecls: Element.prototype.getElementsByClassName,
    etag: Element.prototype.getElementsByTagName,
    closest: Element.prototype.closest,
    matches: Element.prototype.matches,
    listen: EventTarget.prototype.addEventListener,
  };
  const ignored = (el) => {
    if (!el || el.nodeType !== 1) return true;
    if (el === document.documentElement || el === document.body) return true;
    for (let e = el; e; e = e.parentElement) {
      const t = e.tagName;
      if (t === "HEAD" || t === "SCRIPT" || t === "TEMPLATE") return true;
    }
    return false;
  };
  function touch(node, kind, selector) {
    if (!armed || globalThis.__touchedPaused) return;
    let el = node;
    while (el && !initial.has(el)) el = el.parentNode;
    if (!el || ignored(el)) return;
    let r = records.get(el);
    if (!r) records.set(el, (r = { path: paths.get(el), id: el.id || null, selector: null, kinds: new Set(), count: 0 }));
    if (selector != null && r.selector == null) r.selector = String(selector);
    r.kinds.add(kind);
    r.count++;
  }
  const many = (list, kind, selector) => { for (const el of list) touch(el, kind, selector); };
  const wrap = (proto, name, orig, after) => {
    proto[name] = function (...a) {
      const result = orig.apply(this, a);
      if (armed && !busy) {
        busy = true;
        try { after.call(this, result, a); } finally { busy = false; }
      }
      return result;
    };
  };
  function arm() {
    wrap(Document.prototype, "getElementById", P.byId, (r, a) => touch(r, "lookup", `#${a[0]}`));
    wrap(Document.prototype, "querySelector", P.dq, (r, a) => touch(r, "lookup", a[0]));
    wrap(Element.prototype, "querySelector", P.eq, (r, a) => touch(r, "lookup", a[0]));
    wrap(Document.prototype, "querySelectorAll", P.dqa, (r, a) => many(r, "lookup", a[0]));
    wrap(Element.prototype, "querySelectorAll", P.eqa, (r, a) => many(r, "lookup", a[0]));
    wrap(Document.prototype, "getElementsByClassName", P.dcls, (r, a) => many(r, "lookup", `.${a[0]}`));
    wrap(Element.prototype, "getElementsByClassName", P.ecls, (r, a) => many(r, "lookup", `.${a[0]}`));
    wrap(Document.prototype, "getElementsByTagName", P.dtag, (r, a) => many(r, "lookup", a[0]));
    wrap(Element.prototype, "getElementsByTagName", P.etag, (r, a) => many(r, "lookup", a[0]));
    wrap(Element.prototype, "closest", P.closest, (r, a) => touch(r, "closest", a[0]));
    wrap(Element.prototype, "matches", P.matches, function (_, a) { touch(this, "matches", a[0]); });
    wrap(EventTarget.prototype, "addEventListener", P.listen, function (_, a) { if (this instanceof Element) touch(this, `listen:${a[0]}`, null); });
    new MutationObserver((list) => {
      for (const m of list) {
        const target = m.type === "characterData" ? m.target.parentElement : m.target;
        touch(target, m.type === "attributes" ? `attr:${m.attributeName}` : m.type, null);
      }
    }).observe(document.documentElement, { childList: true, attributes: true, characterData: true, subtree: true });
    armed = true;
  }
  document.addEventListener("DOMContentLoaded", () => {
    const walk = (el, path) => {
      const counts = new Map();
      for (const c of el.children) {
        const tag = c.tagName.toLowerCase();
        const n = (counts.get(tag) ?? 0) + 1;
        counts.set(tag, n);
        const p = c.id ? `#${CSS.escape(c.id)}` : `${path} > ${tag}:nth-of-type(${n})`;
        initial.add(c);
        paths.set(c, p);
        walk(c, p);
      }
    };
    initial.add(document.body);
    walk(document.body, "body");
    setTimeout(arm, 0);
  }, { once: true });
  globalThis.__touchedDump = () => [...records.values()].map((r) => ({ ...r, kinds: [...r.kinds].sort() }));
}

const { file, module, scenarios } = await loadScenario(args.page, args.scenario);
const functions = functionsFor(module, await loadPageLib(args.page));
const srv = await serve(out);
const browser = await launch(chromium);
const merged = new Map();
try {
  for (const sc of scenarios) {
    const { context, page, state } = await openPage(browser, {});
    state.origin = new URL(srv.base).origin;
    await page.addInitScript(touchedInit);
    await page.goto(srv.base + sc.url, { waitUntil: "load", timeout: 30000 });
    await settle(page, state);
    for (const step of sc.steps) {
      const paused = stepKind(step) === "evaluate";
      if (paused) await page.evaluate(() => { globalThis.__touchedPaused = true; });
      try {
        await runStep(page, state, step, { functions });
      } catch (e) {
        console.error(`${sc.name}: step ${JSON.stringify(step)} failed: ${e.message.split("\n")[0]}`);
      }
      if (paused) await page.evaluate(() => { globalThis.__touchedPaused = false; }).catch(() => {});
    }
    await settle(page, state);
    const rows = await page.evaluate(() => globalThis.__touchedDump?.() ?? []);
    for (const r of rows) {
      const m = merged.get(r.path);
      if (!m) merged.set(r.path, { page: args.page, ...r });
      else {
        m.kinds = [...new Set([...m.kinds, ...r.kinds])].sort();
        m.count += r.count;
        m.selector ??= r.selector;
      }
    }
    console.log(`${sc.name}: ${rows.length} touched elements`);
    await context.close();
  }
} finally {
  await browser.close();
  srv.close();
}
const list = [...merged.values()];
writeFileSync(args.save, JSON.stringify(list, null, 1));
console.log(`${args.page}${file ? ` (${file})` : ""}: ${list.length} touched elements -> ${args.save} · ${elapsed(t0)}`);
