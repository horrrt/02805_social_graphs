// Captures the markup of the elements a selector matches, for fixtures.
//   node scripts/parity/capture.mjs --out <out> --page p --select <css>
//     [--scenario f --steps a..b] [--raw] --save file
// Default: open the page (or run the scenario's steps up to b), settle, and
// save each matched element's outerHTML as the browser serialises it.
// --raw: cut each matched element's fragment byte for byte from the built
// HTML file instead, with its <!-- --> text markers and entities kept. The
// element is found with JavaScript disabled, by its index among the elements
// of its tag, and the fragment is checked against the browser's own parse.
// Saves [{scenario, index, html}].
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "playwright";
import { functionsFor, openPage, runStep, settle } from "./engine.mjs";
import { PAGES, die, elapsed, launch, loadPageLib, loadScenario, outDir, parseArgs, serve, stepsArg } from "./lib.mjs";

const args = parseArgs(process.argv.slice(2), ["raw"]);
const t0 = Date.now();
if (!args.page || !(args.page in PAGES)) die("usage: capture.mjs --out <out> --page p --select <css> [--scenario f --steps a..b] [--raw] --save file");
if (!args.select || args.select === true) die("--select <css> is required");
if (!args.save || args.save === true) die("--save <file> is required");
const out = outDir(args.out, "out");
const range = stepsArg(args.steps);
if (args.raw && (args.scenario || range)) die("--raw reads the built file; it takes no --scenario or --steps");

const VOID = new Set(["area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "source", "track", "wbr"]);

/** Blanks script, style, template and comment bodies so tag search skips them; offsets stay put. */
function searchable(raw) {
  const blank = (m) => m.replace(/[^\n]/g, " ");
  return raw
    .replace(/<!--[\s\S]*?-->/g, blank)
    .replace(/(<(script|style|template|textarea|title)\b[^>]*>)([\s\S]*?)(<\/\2\s*>)/gi, (_, a, _t, body, b) => a + blank(body) + b);
}

/** Index just past the '>' that closes the tag opening at i, honouring quotes. */
function tagEnd(text, i) {
  let quote = null;
  for (let j = i + 1; j < text.length; j++) {
    const c = text[j];
    if (quote) { if (c === quote) quote = null; }
    else if (c === '"' || c === "'") quote = c;
    else if (c === ">") return j + 1;
  }
  return -1;
}

/** [start, end) of the nth (0-based) <tag> element in the raw file, or null. */
function slice(raw, text, tag, nth) {
  const open = new RegExp(`<${tag}(?=[\\s/>])`, "gi");
  let m;
  let n = -1;
  while ((m = open.exec(text))) if (++n === nth) break;
  if (!m) return null;
  const start = m.index;
  const first = tagEnd(text, start);
  if (VOID.has(tag) || text[first - 2] === "/") return [start, first];
  const any = new RegExp(`<(/?)${tag}(?=[\\s/>])`, "gi");
  any.lastIndex = first;
  let depth = 1;
  while ((m = any.exec(text))) {
    const end = tagEnd(text, m.index);
    if (m[1]) depth--;
    else if (text[end - 2] !== "/") depth++;
    if (depth === 0) return [start, end];
    any.lastIndex = end;
  }
  return null;
}

const srv = await serve(out);
const browser = await launch(chromium);
const saved = [];
try {
  if (args.raw) {
    const raw = readFileSync(join(out, PAGES[args.page], "index.html"), "utf8");
    const text = searchable(raw);
    const { context, page, state } = await openPage(browser, { javaScriptEnabled: false });
    state.origin = new URL(srv.base).origin;
    await page.goto(srv.base + PAGES[args.page], { waitUntil: "load", timeout: 30000 });
    await settle(page, state);
    const found = await page.evaluate((sel) => [...document.querySelectorAll(sel)].map((el) => {
      const tag = el.localName;
      return { tag, nth: [...document.getElementsByTagName(tag)].indexOf(el), total: document.getElementsByTagName(tag).length };
    }), args.select);
    for (const [i, f] of found.entries()) {
      const count = (text.match(new RegExp(`<${f.tag}(?=[\\s/>])`, "gi")) ?? []).length;
      if (count !== f.total) die(`${args.select}: the file has ${count} <${f.tag}> tags, the browser parsed ${f.total}; cannot align`);
      const at = slice(raw, text, f.tag, f.nth);
      if (!at) die(`${args.select}: no closing tag for match ${i} (<${f.tag}> #${f.nth})`);
      const html = raw.slice(...at);
      // The fragment must parse to the element the browser built from the file.
      const same = await page.evaluate(([sel, i, html]) => {
        const el = document.querySelectorAll(sel)[i];
        const t = document.createElement("template");
        t.innerHTML = html;
        return t.content.firstElementChild?.isEqualNode(el) ?? false;
      }, [args.select, i, html]);
      if (!same) die(`${args.select}: match ${i} cut from the file does not parse to the browser's element`);
      saved.push({ scenario: null, index: i, html });
    }
    await context.close();
  } else {
    const { module, scenarios } = await loadScenario(args.page, args.scenario);
    const functions = functionsFor(module, await loadPageLib(args.page));
    let k = 0;
    for (const sc of scenarios) {
      const first = k + 1;
      k += sc.steps.length + 1;
      if (range && (k < range[0] || first > range[1])) continue;
      const { context, page, state } = await openPage(browser, {});
      state.origin = new URL(srv.base).origin;
      await page.goto(srv.base + sc.url, { waitUntil: "load", timeout: 30000 });
      await settle(page, state);
      for (const [i, step] of sc.steps.entries()) {
        if (range && first + i > range[1]) break;
        await runStep(page, state, step, { functions });
      }
      await settle(page, state);
      const html = await page.evaluate((sel) => [...document.querySelectorAll(sel)].map((el) => el.outerHTML), args.select);
      html.forEach((h, index) => saved.push({ scenario: sc.name, index, html: h }));
      await context.close();
    }
  }
} finally {
  await browser.close();
  srv.close();
}
if (!saved.length) die(`${args.select} matched nothing on ${args.page}`, 1);
writeFileSync(args.save, JSON.stringify(saved, null, 1));
console.log(`${args.page}: ${saved.length} elements matching ${args.select}${args.raw ? " (raw)" : ""} -> ${args.save} · ${elapsed(t0)}`);
