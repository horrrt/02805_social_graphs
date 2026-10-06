// Loads the kit's edge-state page (/styleguide/kit/states/) from a built
// export in headless Chromium and fails when a host stays empty, the page
// throws or logs an error, or a component spills out of its host or makes the
// page scroll sideways. Writes one screenshot per host to output/kit-states/
// (gitignored) for a look by eye. Asserts, never compares pixels: fonts differ
// between macOS and Linux.
//
//   npm run build && npm run kit:states [-- --out <export dir>]
//
// Uses the parity tools' pinned browser and server (scripts/parity/lib.mjs),
// so it never downloads a browser; set PARITY_CHROMIUM to use another.
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "playwright";
import { ROOT, launch, outDir, parseArgs, serve } from "./parity/lib.mjs";

const PAGE = "styleguide/kit/states/";
const SHOTS = join(ROOT, "output", "kit-states");
const WIDTH = 1280;

const args = parseArgs(process.argv.slice(2));
const out = outDir(args.out ?? join(ROOT, "out"), "out");
const t0 = Date.now();

const server = await serve(out);
const browser = await launch(chromium);
const failures = [];
try {
  const page = await browser.newPage({ viewport: { width: WIDTH, height: 900 } });
  page.on("pageerror", (e) => failures.push(`page error: ${e.message}`));
  page.on("console", (m) => { if (m.type() === "error") failures.push(`console error: ${m.text()}`); });
  page.on("requestfailed", (r) => failures.push(`request failed: ${r.url()} (${r.failure()?.errorText})`));

  await page.goto(server.base + PAGE, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  // Charts draw after hydration, then again at their parent's width.
  await page.waitForFunction(() => [...document.querySelectorAll("[data-state]")].every((h) => h.childElementCount > 0), null, { timeout: 10_000 })
    .catch(() => { /* reported per host below */ });
  await page.evaluate(() => new Promise((ok) => requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(ok, 300)))));

  const hosts = await page.evaluate(() =>
    [...document.querySelectorAll("[data-state]")].map((host) => {
      const box = host.getBoundingClientRect();
      // The widest element inside the host, by how far its right edge passes the host's.
      let spill = 0;
      let culprit = "";
      for (const el of host.querySelectorAll("*")) {
        const r = el.getBoundingClientRect();
        if (r.width === 0) continue;
        const over = r.right - box.right;
        if (over > spill) { spill = over; culprit = el.tagName.toLowerCase() + (el.className && typeof el.className === "string" ? `.${el.className.split(" ")[0]}` : ""); }
      }
      return {
        state: host.getAttribute("data-state"),
        children: host.childElementCount,
        width: Math.round(box.width),
        height: Math.round(box.height),
        scroll: host.scrollWidth - host.clientWidth,
        spill: Math.round(spill),
        culprit,
      };
    }),
  );
  const pageScroll = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  if (pageScroll > 0) failures.push(`the page scrolls sideways by ${pageScroll}px at ${WIDTH}px wide`);

  mkdirSync(SHOTS, { recursive: true });
  for (const h of hosts) {
    const problems = [];
    if (h.children === 0) problems.push("empty: the component drew nothing or threw");
    if (h.scroll > 1) problems.push(`scrolls sideways by ${h.scroll}px`);
    if (h.spill > 1) problems.push(`${h.culprit} spills ${h.spill}px past the host`);
    for (const p of problems) failures.push(`${h.state}: ${p}`);
    console.log(`${problems.length ? "FAIL" : "ok  "} ${h.state.padEnd(16)} ${String(h.width).padStart(4)}×${String(h.height).padEnd(4)} ${problems.join("; ")}`);
    if (h.children > 0) await page.locator(`[data-state="${h.state}"]`).screenshot({ path: join(SHOTS, `${h.state}.png`) });
  }
  if (hosts.length === 0) failures.push(`no [data-state] hosts on ${PAGE}`);
  await page.screenshot({ path: join(SHOTS, "_page.png"), fullPage: true });
} finally {
  await browser.close();
  server.close();
}

console.log(`\n${failures.length ? `${failures.length} problem(s):\n  ${failures.join("\n  ")}` : "every edge state drew cleanly"}`);
console.log(`screenshots in ${SHOTS} · ${((Date.now() - t0) / 1000).toFixed(1)}s`);
process.exit(failures.length ? 1 : 0);
