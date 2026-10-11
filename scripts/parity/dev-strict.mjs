// StrictMode check: what next dev (React StrictMode, effects run twice) does
// to each page, against the production export.
//   node scripts/parity/dev-strict.mjs --pages a,b
// Starts next dev on a free port in the background, waits for it to be ready,
// loads each page and reports: requests per data and vendor path, the number
// of div.chart-tip elements, vendor <script> tags per src, ECharts instances
// per host and canvases inside deck/globe hosts. When out/ (or $OUT) holds a
// production export, the same page is loaded from it and every line that
// differs is marked DIFF; exit 1 if one does. Dev serves from the root, so the
// /02805_social_graphs base path is stripped before request paths are compared.
// Never run it beside next build in the same checkout, and note that next dev
// rewrites AGENTS.md (restore it with git checkout AGENTS.md).
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { chromium } from "playwright";
import { WEBGL, openPage, settle } from "./engine.mjs";
import { BASE_PATH, PAGES, ROOT, die, elapsed, freePort, launch, pagesArg, parseArgs, serve } from "./lib.mjs";

const args = parseArgs(process.argv.slice(2));
const t0 = Date.now();
const pages = pagesArg(args.pages === true ? null : args.pages);
const prodDir = resolve(process.env.OUT ?? join(ROOT, "out"));
const haveProd = existsSync(join(prodDir, "index.html"));
const DATA_RE = /\/(assets\/data|weeks\/[^/]+\/data|assets\/vendor)\//;

const port = await freePort();
const next = join(ROOT, "node_modules/.bin/next");
if (!existsSync(next)) die("no node_modules/.bin/next here");
console.log(`next dev on port ${port} (log lines prefixed "dev:")`);
const dev = spawn(next, ["dev", "-p", String(port), "-H", "127.0.0.1"], {
  cwd: ROOT,
  env: { ...process.env, NEXT_TELEMETRY_DISABLED: "1" },
  stdio: ["ignore", "pipe", "pipe"],
  detached: true,
});
const stop = () => { try { process.kill(-dev.pid, "SIGTERM"); } catch { /* gone */ } };
process.once("exit", stop);
for (const sig of ["SIGINT", "SIGTERM"]) process.once(sig, () => { stop(); process.exit(130); });

await new Promise((ok, fail) => {
  const cap = setTimeout(() => fail(new Error("next dev was not ready within 60 s")), 60000);
  const tick = setInterval(() => console.log(`waiting for next dev (${elapsed(t0)})`), 10000);
  const watch = (b) => {
    for (const line of String(b).split("\n").filter((l) => l.trim())) {
      if (/error/i.test(line)) console.log(`dev: ${line.trim()}`);
      if (/Ready in|✓ Ready/.test(line)) { clearTimeout(cap); clearInterval(tick); ok(); }
    }
  };
  dev.stdout.on("data", watch);
  dev.stderr.on("data", watch);
  dev.once("exit", (code) => { clearTimeout(cap); clearInterval(tick); fail(new Error(`next dev exited with ${code}`)); });
}).catch((e) => { stop(); die(e.message, 1); });

/** Runs in the page: everything the report counts except requests. */
function census(webgl) {
  const strip = (s) => s.replace(location.origin, "").replace(/\?.*$/, "");
  const vendor = {};
  for (const s of document.querySelectorAll('script[src*="/assets/vendor/"]')) {
    const src = strip(s.src);
    vendor[src] = (vendor[src] ?? 0) + 1;
  }
  const echarts = {};
  for (const host of document.querySelectorAll("[_echarts_instance_]")) {
    const key = host.id ? `#${host.id}` : `${host.localName}.${[...host.classList].join(".")}`;
    const live = window.echarts?.getInstanceByDom?.(host) ? 1 : 0;
    // A second init on the same host leaves a second renderer root behind.
    const roots = [...host.children].filter((c) => c.querySelector(":scope > canvas, :scope > svg")).length;
    const e = (echarts[key] ??= { instances: 0, roots: 0 });
    e.instances += live;
    e.roots += roots;
  }
  const webglCanvases = {};
  for (const host of document.querySelectorAll(webgl)) {
    const key = host.id ? `#${host.id}` : `${host.localName}.${[...host.classList].join(".")}`;
    webglCanvases[key] = host.querySelectorAll("canvas").length;
  }
  return { tips: document.querySelectorAll("div.chart-tip").length, vendor, echarts, webglCanvases };
}

async function visit(browser, base, page) {
  const { context, page: tab, state } = await openPage(browser, {});
  state.origin = new URL(base).origin;
  await tab.goto(base + PAGES[page], { waitUntil: "load", timeout: 90000 });
  await settle(tab, state);
  const c = await tab.evaluate(census, WEBGL);
  const requests = {};
  for (const [path, n] of state.requests) {
    const p = path.startsWith(BASE_PATH) ? `/${path.slice(BASE_PATH.length)}` : path;
    if (DATA_RE.test(p)) requests[p] = n;
  }
  const errors = state.console.filter((l) => /^(error|pageerror):/.test(l)).length;
  await context.close();
  const lines = [];
  for (const [p, n] of Object.entries(requests).sort()) lines.push(`request ${p} x${n}`);
  lines.push(`div.chart-tip ${c.tips}`);
  for (const [src, n] of Object.entries(c.vendor).sort()) lines.push(`vendor script ${src.replace(BASE_PATH.slice(0, -1), "")} x${n}`);
  for (const [host, v] of Object.entries(c.echarts).sort()) lines.push(`echarts ${host}: ${v.instances} instances, ${v.roots} renderer roots`);
  for (const [host, n] of Object.entries(c.webglCanvases).sort()) lines.push(`canvases in ${host}: ${n}`);
  lines.push(`console errors ${errors}`);
  return lines;
}

const browser = await launch(chromium);
const prod = haveProd ? await serve(prodDir) : null;
let failed = false;
try {
  for (const page of pages) {
    const devLines = await visit(browser, `http://127.0.0.1:${port}/`, page);
    const prodLines = prod ? await visit(browser, prod.base, page) : null;
    const diff = prodLines && devLines.join("\n") !== prodLines.join("\n");
    if (diff) failed = true;
    console.log(`${page}: ${prodLines ? (diff ? "DIFF against production" : "same as production") : "no production export to compare"} (${elapsed(t0)})`);
    const prodSet = new Set(prodLines ?? []);
    const devSet = new Set(devLines);
    for (const l of devLines) console.log(`  ${prodLines && !prodSet.has(l) ? "DIFF dev " : ""}${l}`);
    for (const l of prodLines ?? []) if (!devSet.has(l)) console.log(`  DIFF prod ${l}`);
  }
} finally {
  await browser.close();
  prod?.close();
  stop();
}
console.log(`${failed ? "DIFF" : "ok"} · ${pages.length} pages · ${elapsed(t0)}`);
process.exit(failed ? 1 : 0);
