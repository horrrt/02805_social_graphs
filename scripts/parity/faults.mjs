// Fault injection: what a page does when one file fails to load (--data), and
// whether a failing island leaves the rest of the page alone (--islands).
//   node scripts/parity/faults.mjs --base <out> --head <out> --pages p
//     [--scenario f] [--data [--files glob]] [--islands prefix --modes render,effect]
//     [--shard i/n] [--estimate] [--report file]
// --data aborts each data or vendor file the page requests on base, on both
// sides, and compares as runtime.mjs does, minus the selectors that
// known/<page>/faults-*.json expects to differ for that file.
// --islands faults each registered island in turn on head (the registry
// globalThis.__ISLANDS__ exists only when __PARITY_FAULTS__ is defined).
import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { basename, join } from "node:path";
import { chromium } from "playwright";
import { REPORT_DIR, compareStep, estimate, functionsFor, matcher, openPage, runSide, settle, snapshot } from "./engine.mjs";
import { HERE, PAGES, die, elapsed, globRe, knownEntries, launch, loadPageLib, loadScenario, outDir, pagesArg, parseArgs, serve } from "./lib.mjs";

const args = parseArgs(process.argv.slice(2), ["data", "estimate"]);
const t0 = Date.now();
if (!args.data && args.islands === undefined) die("faults.mjs needs --data or --islands <prefix>");
const pages = pagesArg(args.pages);
let shard = null;
if (args.shard) {
  const m = /^(\d+)\/(\d+)$/.exec(args.shard);
  if (!m || Number(m[1]) < 1 || Number(m[1]) > Number(m[2])) die(`--shard takes i/n with 1 <= i <= n, got ${args.shard}`);
  shard = [Number(m[1]), Number(m[2])];
}
const inShard = (_, i) => !shard || i % shard[1] === shard[0] - 1;

/** {file: {expectDiff, fp, reason}} merged from known/<page>/faults-*.json. */
function faultsKnown(page) {
  const dir = join(HERE, "known", page);
  const out = {};
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir).filter((n) => /^faults-.*\.json$/.test(n)).sort()) {
    const table = JSON.parse(readFileSync(join(dir, name), "utf8"));
    for (const [file, e] of Object.entries(table)) {
      if (!Array.isArray(e.expectDiff) || !e.reason) die(`known/${page}/${name}: ${file} needs expectDiff [selectors] and reason`);
      out[file] = { expectDiff: [...(out[file]?.expectDiff ?? []), ...e.expectDiff], fp: e.fp, reason: e.reason, from: name };
    }
  }
  return out;
}

/** The page's base load scenario: scenarios/<page>/base.mjs when it exists. */
async function scenarioFor(page) {
  if (args.scenario) return loadScenario(page, args.scenario);
  const base = join(HERE, "scenarios", page, "base.mjs");
  return loadScenario(page, existsSync(base) ? base : null);
}

const DATA_FILE = /\/(assets\/data\/.+|weeks\/[^/]+\/data\/.+|assets\/vendor\/.+)$/;
const base = args.estimate ? null : outDir(args.base, "base");
const head = outDir(args.head, "head");
const report = { mode: args.data ? "data" : "islands", items: [] };
let failed = false;
const browser = args.estimate ? null : await launch(chromium);
const servers = args.estimate ? [] : await Promise.all([base ? serve(base) : null, serve(head)]);
const [baseSrv, headSrv] = servers;

/** Console lines reduced to "an error was logged or not" (--data). */
function errorsOnly(records) {
  for (const r of records) {
    if (!r.flat) continue;
    const lines = (r.flat.get("console") ?? "").split("\n");
    r.flat.set("console", `errors logged: ${lines.some((l) => /^(error|pageerror):/.test(l))}`);
  }
  return records;
}

try {
  for (const page of pages) {
    const { file, module, scenarios } = await scenarioFor(page);
    const functions = functionsFor(module, await loadPageLib(page));
    const est = estimate(scenarios, null);

    if (args.data) {
      // The files main requests while running the scenario, unfaulted.
      let files = [];
      if (!args.estimate) {
        const log = [];
        await runSide(browser, baseSrv, { scenarios, functions, opts: { requestLog: log }, snap: { screenshot: false } });
        files = [...new Set(log.map((u) => new URL(u).pathname.replace(/^\/02805_social_graphs\//, "")).filter((p) => DATA_FILE.test(`/${p}`)))].sort();
      }
      if (args.files) files = files.filter((f) => globRe(args.files).test(f) || globRe(`**/${args.files}`).test(f));
      files = files.filter(inShard);
      if (args.estimate) {
        console.log(`${page}: one unfaulted base run plus one run per requested data/vendor file (${est.seconds} s each per side); run without --estimate to list the files, then shard with --files or --shard`);
        continue;
      }
      const expected = faultsKnown(page);
      const known = matcher(knownEntries(page));
      console.log(`${page}: ${files.length} files to fault (${file ? basename(file) : "load"})`);
      for (const [i, f] of files.entries()) {
        const abort = [(url) => new URL(url).pathname.endsWith(`/${f}`)];
        const exp = expected[f] ?? expected[basename(f)] ?? null;
        const snap = { mask: exp?.expectDiff ?? [] };
        const [h, b] = await Promise.all([
          runSide(browser, headSrv, { scenarios, functions, opts: { abort }, snap }),
          runSide(browser, baseSrv, { scenarios, functions, opts: { abort }, snap }),
        ]);
        errorsOnly(h);
        errorsOnly(b);
        const bk = new Map(b.map((r) => [r.k, r]));
        const diffs = [];
        for (const r of h) {
          const other = bk.get(r.k);
          if (!other) { diffs.push({ key: `${r.scenario}/${r.k}/missing`, base: null, head: "ran" }); continue; }
          diffs.push(...compareStep([other], r, { known, prefix: `${f}/${r.scenario}/${r.k}/`, reportDir: join(REPORT_DIR, page, "faults") }));
        }
        const active = diffs.filter((d) => !d.known);
        if (active.length) failed = true;
        const note = exp ? ` (expected: ${exp.expectDiff.join(", ")}${exp.fp ? `, ${exp.fp}` : ""})` : "";
        console.log(`[${i + 1}/${files.length}] ${page} abort ${f} ${active.length ? `DIFF ${active.length}` : "ok"}${note}`);
        for (const d of active.slice(0, 5)) {
          console.log(`    ${d.key}: ${String(d.base).slice(0, 100)} -> ${String(d.head).slice(0, 100)}`);
          if (d.detail) console.log(`      ${JSON.stringify(d.detail).slice(0, 400)}`);
        }
        report.items.push({ page, file: f, status: active.length ? "DIFF" : "ok", expected: exp, diffs: diffs.slice(0, 20) });
      }
      continue;
    }

    // --islands: read the registry from head with the fault hook defined.
    const prefix = args.islands === true ? "" : String(args.islands);
    const modes = (args.modes ?? "render,effect").split(",").map((m) => m.trim()).filter(Boolean);
    // --estimate launches no browser, and the registry is only known by
    // loading head, so estimate before opening anything.
    if (args.estimate) {
      console.log(`${page}: about 7 s per island and mode, plus 7 s to read the registry; run without --estimate to list the islands`);
      continue;
    }
    const open = async (opts) => {
      const o = await openPage(browser, opts);
      o.state.origin = new URL(headSrv.base).origin;
      await o.page.goto(headSrv.base + PAGES[page], { waitUntil: "load", timeout: 30000 });
      await settle(o.page, o.state);
      return o;
    };
    const plain = await open({ faults: [] });
    const registry = await plain.page.evaluate(() => globalThis.__ISLANDS__ ?? {});
    const names = Object.keys(registry).filter((n) => n.startsWith(prefix)).sort();
    if (!names.length) {
      console.log(`${page}: no islands${prefix ? ` matching ${prefix}` : ""}`);
      await plain.context.close();
      continue;
    }
    const work = names.flatMap((n) => modes.map((m) => [n, m])).filter(inShard);
    const sel = (list) => (list === "none" || list === "page" || !list ? [] : list);
    const allRoots = [...new Set(names.flatMap((n) => sel(registry[n].roots)))];
    const allSel = [...new Set(names.flatMap((n) => [...sel(registry[n].roots), ...sel(registry[n].affects)]))];
    const unfaulted = await snapshot(plain.page, plain.state, { screenshot: false });
    const unfaultedMasked = new Map();
    await plain.context.close();
    const noJs = await open({ javaScriptEnabled: false });
    const off = await snapshot(noJs.page, noJs.state, { screenshot: false, select: allRoots, textOf: allSel });
    await noJs.context.close();

    for (const [i, [name, mode]] of work.entries()) {
      const { roots, affects } = registry[name];
      const rootSel = sel(roots);
      const affectSel = sel(affects);
      const o = await open({ faults: [`${name}:${mode}`] });
      const s = await snapshot(o.page, o.state, { screenshot: false, select: rootSel, exclude: [...rootSel, ...affectSel] });
      const consoleLines = s.flat.get("console") ?? "";
      // For (2): the same page with this island's roots and affects masked.
      const hidden = [...rootSel, ...affectSel];
      const sMasked = affects === "page" ? null : await snapshot(o.page, o.state, { screenshot: false, mask: hidden });
      await o.context.close();
      const problems = [];
      // (1) roots render their JavaScript-disabled markup.
      for (const r of rootSel) {
        const now = s.selected[r] ?? [];
        const was = off.selected[r] ?? [];
        if (!now.length) problems.push(`roots ${r} matches nothing`);
        else if (JSON.stringify(now) !== JSON.stringify(was)) problems.push(`roots ${r} differs from its JavaScript-disabled markup`);
      }
      if (roots !== "none" && !rootSel.length) problems.push("roots lists no selectors");
      // (2) every id element outside roots and affects is unchanged. Both
      // sides are compared with those elements masked, so an id inside them
      // (on either side) is not compared, and an ancestor of a root is
      // compared with the root's subtree left out rather than skipped.
      if (sMasked) {
        const key = JSON.stringify(hidden);
        if (!unfaultedMasked.has(key)) {
          const u = await open({ faults: [] });
          unfaultedMasked.set(key, await snapshot(u.page, u.state, { screenshot: false, mask: hidden }));
          await u.context.close();
        }
        const um = unfaultedMasked.get(key);
        const ids = new Set([...um.flat.keys(), ...sMasked.flat.keys()].filter((k) => k.startsWith("id:#")));
        for (const k of ids) if (sMasked.flat.get(k) !== um.flat.get(k)) problems.push(`${k} changed outside roots/affects`);
      }
      // (3) main keeps its children.
      if (s.mainChildren !== unfaulted.mainChildren) problems.push(`main has ${s.mainChildren} children, not ${unfaulted.mainChildren}`);
      // (4) server text outside roots/affects is still there.
      const present = new Set(s.bodyLines);
      const inside = new Map();
      // Every island may replace its own server text, so lines inside any
      // island's roots or affects (this one's included) are not checked.
      for (const l of allSel.flatMap((x) => off.textOf[x] ?? [])) inside.set(l, (inside.get(l) ?? 0) + 1);
      const outside = off.bodyLines.filter((l) => { const n = inside.get(l); if (!n) return true; inside.set(l, n - 1); return false; });
      const lost = outside.filter((l) => !present.has(l));
      if (lost.length) problems.push(`server text lost: ${lost.slice(0, 3).map((l) => JSON.stringify(l.slice(0, 60))).join(", ")}${lost.length > 3 ? ` and ${lost.length - 3} more` : ""}`);
      // (5) the failure is reported once by name.
      if (!consoleLines.split("\n").some((l) => l.includes("a page script failed") && l.includes(name))) problems.push("no console error 'a page script failed' naming the island");
      if (problems.length) failed = true;
      console.log(`[${i + 1}/${work.length}] ${page} ${name}:${mode} ${problems.length ? `FAIL ${problems.length}` : "ok"}`);
      for (const p of problems.slice(0, 8)) console.log(`    ${p}`);
      report.items.push({ page, island: name, mode, status: problems.length ? "FAIL" : "ok", problems });
    }
  }
} finally {
  await browser?.close();
  for (const s of servers) s?.close();
}

if (args.report) writeFileSync(args.report, JSON.stringify(report, null, 1));
if (!args.estimate) console.log(`${failed ? "DIFF" : "ok"} · ${report.items.length} faults · ${elapsed(t0)}`);
process.exit(failed ? 1 : 0);
