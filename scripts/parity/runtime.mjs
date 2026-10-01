// Runtime parity: runs scenarios against two export trees and compares DOM,
// text, storage, URL, scroll, focus, canvases, console, requests, the body
// hash and a pixel diff at every snapshot.
//   node scripts/parity/runtime.mjs --base <out> --head <out> [--pages a,b]
//     [--scenario file] [--steps a..b] [--only name] [--estimate] [--motion]
//     [--faults spec] [--profile slow] [--fonts-delay ms] [--runs n]
//     [--check-known page] [--report file]
// Prints `[k/N] page scenario step ok|DIFF n`; exit 1 on any active diff.
import { writeFileSync } from "node:fs";
import { basename, join } from "node:path";
import { chromium } from "playwright";
import { REPORT_DIR, compareStep, estimate, functionsFor, matcher, runSide } from "./engine.mjs";
import { die, elapsed, knownEntries, launch, loadPageLib, loadScenario, outDir, pagesArg, parseArgs, serve, stepsArg } from "./lib.mjs";

const args = parseArgs(process.argv.slice(2), ["estimate", "motion"]);
const t0 = Date.now();

if (args["check-known"]) {
  const page = args["check-known"];
  const bad = knownEntries(page).filter((e) => e.file !== "base.json" && !e.approvedBug && !e.fp);
  for (const e of bad) console.log(`known/${page}/${e.file}: ${e.key} has neither approvedBug nor fp`);
  console.log(bad.length ? `check-known ${page}: ${bad.length} unapproved entries` : `check-known ${page}: ok`);
  if (bad.length) process.exit(1);
  if (!args.base && !args.head) process.exit(0);
}

const pages = pagesArg(args.pages);
const range = stepsArg(args.steps);
const runs = Math.max(1, Number(args.runs ?? 1));

const plans = [];
for (const page of pages) {
  const { file, module, scenarios: all } = await loadScenario(page, args.scenario);
  const scenarios = args.only ? all.filter((s) => args.only.split(",").includes(s.name)) : all;
  if (!scenarios.length) die(`no scenario named ${args.only} in ${file}`);
  plans.push({ page, file, module, scenarios });
}

if (args.estimate) {
  let total = 0;
  for (const { page, file, scenarios } of plans) {
    const e = estimate(scenarios, range);
    total += e.seconds;
    console.log(`${page} ${file ? basename(file) : "load"}: ${e.steps} steps, ${e.loads} loads, ${e.snaps} snapshots, about ${e.seconds} s per side (sides run in parallel; --runs ${runs} adds ${runs} base sides)`);
  }
  console.log(`total about ${total} s`);
  process.exit(0);
}

const base = outDir(args.base, "base");
const head = outDir(args.head, "head");
const [baseSrv, headSrv] = await Promise.all([serve(base), serve(head)]);
const browser = await launch(chromium);
const report = { base, head, runs, steps: [] };
let failed = false;

try {
  for (const plan of plans) {
    const { page, file, module, scenarios } = plan;
    const functions = functionsFor(module, await loadPageLib(page));
    const known = matcher(knownEntries(page));
    const scen = file ? basename(file, ".mjs") : "load";
    const N = scenarios.reduce((n, s) => n + s.steps.length + 1, 0);
    const common = { scenarios, page, range, functions };
    const baseOpts = (i) => ({
      motion: args.motion,
      faults: args.faults ? args.faults.split(",") : null,
      profile: runs > 1 && i === runs - 1 ? "slow" : args.profile,
      fontsDelay: args["fonts-delay"],
    });
    const [headRecs, ...baseRuns] = await Promise.all([
      runSide(browser, headSrv, { ...common, opts: baseOpts(-1) }),
      ...Array.from({ length: runs }, (_, i) => runSide(browser, baseSrv, { ...common, opts: baseOpts(i) })),
    ]);
    const byK = (recs) => new Map(recs.map((r) => [r.k, r]));
    const baseMaps = baseRuns.map(byK);
    for (const h of headRecs) {
      const bs = baseMaps.map((m) => m.get(h.k)).filter(Boolean);
      const prefix = `${h.scenario}/${h.k}/`;
      const diffs = bs.length ? compareStep(bs, h, { known, prefix, reportDir: join(REPORT_DIR, page) }) : [{ key: `${prefix}missing`, base: null, head: "step ran on head only" }];
      const active = diffs.filter((d) => !d.known);
      if (active.length) failed = true;
      const status = active.length ? `DIFF ${active.length}` : "ok";
      const knownNote = diffs.length > active.length ? ` (${diffs.length - active.length} known)` : "";
      console.log(`[${h.k}/${N}] ${page} ${h.scenario} ${h.label} ${status}${knownNote}${h.error ? ` · step error: ${h.error}` : ""}`);
      for (const d of active.slice(0, 5)) {
        console.log(`    ${d.key}: ${String(d.base).slice(0, 100)} -> ${String(d.head).slice(0, 100)}`);
        if (d.detail) console.log(`      ${JSON.stringify(d.detail).slice(0, 400)}`);
      }
      if (h.marks?.length) console.log(`    marks: ${h.marks.join(", ")}`);
      report.steps.push({ page, file: scen, k: h.k, N, scenario: h.scenario, step: h.label, status, diffs: diffs.slice(0, 20) });
    }
    const headKs = new Set(headRecs.map((r) => r.k));
    for (const r of baseRuns[0]) {
      if (headKs.has(r.k)) continue;
      failed = true;
      console.log(`[${r.k}/${N}] ${page} ${r.scenario} ${r.label} DIFF 1 · step ran on base only`);
      report.steps.push({ page, file: scen, k: r.k, N, scenario: r.scenario, step: r.label, status: "DIFF 1", diffs: [{ key: `${r.scenario}/${r.k}/missing`, base: "ran", head: null }] });
    }
  }
} finally {
  await browser.close();
  baseSrv.close();
  headSrv.close();
}

if (args.report) writeFileSync(args.report, JSON.stringify(report, null, 1));
console.log(`${failed ? "DIFF" : "ok"} · ${report.steps.length} steps · ${elapsed(t0)}`);
process.exit(failed ? 1 : 0);
