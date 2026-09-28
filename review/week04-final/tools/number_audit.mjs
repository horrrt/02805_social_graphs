// Number audit for the Week 4 text transfer (PORT_PLAN.md 3.5).
//
// Three modes:
//   node number_audit.mjs snapshot <out.json> [url]
//       Render the page, open every details, wait for the lazy loaders and
//       write each card's text and numbers.
//   node number_audit.mjs boards <out.json> <board.dc.html>...
//       Extract the same cards from design boards (scripts stripped).
//   node number_audit.mjs compare <before.json> <after.json> [boards.json]
//       List removed, added, invented and term-definition numbers. Exits 1
//       when a number is invented.
//
// A card is #top, #findings, a section opener, .w4-card, .w4-intro, the
// catalogue or a topic bar. Numbers inside a card nested in another card
// count for the inner card only. Text outside every card lands in "(rest)".
// Numbers are kept in three buckets per card: "text" (static prose), "js"
// (inside a node a script writes, PORT_PLAN 0.6) and "pop" (term definitions).
import { writeFileSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { resolve } from "node:path";

const require = createRequire(import.meta.url);
const { chromium } = require("/Users/gyula/.npm/_npx/9833c18b2d85bc59/node_modules/playwright-core");
const CHROME =
  "/Users/gyula/Library/Caches/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-mac-arm64/chrome-headless-shell";
const PAGE_URL = "http://localhost:8765/weeks/week04/";

// Runs inside the browser: collect card text in three buckets.
function extract() {
  const CARD = "#top, #findings, header.w4-opener, .w4-card, .w4-intro, #cut-catalogue, .rx-topic-bar";
  const SKIP = "svg, canvas, table, select, .chart-host, script, style, template, noscript";
  const JS_OWNED = [
    "#place-status", "[id^='place-sel-']", "#place-null-stats", "#place-alpha-table", "#place-snap-note",
    "#place-alpha-choice", "#place-region-legend", "#place-employer", "#place-draft-banner",
    "[id^='hero-sel-']", "[id^='chart-']",
    "#jobs-status", "#jobs-inspector", "#jobs-node-inspector", "#jobs-bridge-list",
    "#where-break-links", "#jobs-linkcom-table", "#who-movers-table", "#who-overlap-table",
    "#staffing-figure", "#staffing-community-stats tbody", "#staffing-community-stats .cross",
    "#staffing-community-stats .mod",
    "[id^='years-']", "[id^='roles-']", "#methods-status", "[id^='w4m-']", "[id^='skills-']", "[id^='pagerank-']",
    "[data-strip]", "[data-more]", "[data-finding]",
    "#cut-skills article", "#cut-pagerank article",
  ].join(", ");
  const root = document.querySelector("main") || document.body;
  const cards = [...root.querySelectorAll(CARD)];
  const seen = new Map();
  const keyOf = (el) => {
    if (el.id) return el.id;
    const host = el.parentElement?.closest("[id]");
    const kind = el.matches("header.w4-opener") ? "opener" : el.classList[el.classList.length - 1];
    const base = `${host ? host.id : "(page)"}>${kind}`;
    const n = seen.get(base) || 0;
    seen.set(base, n + 1);
    return n ? `${base}#${n}` : base;
  };
  const out = {};
  const keys = new Map(cards.map((el) => [el, keyOf(el)]));
  const bucketFor = (node) => {
    const el = node.parentElement;
    if (!el) return null;
    if (el.closest(SKIP)) return null;
    const card = el.closest(CARD);
    const key = card ? keys.get(card) : "(rest)";
    const kind = el.closest(".w4-pop") ? "pop" : el.closest(JS_OWNED) ? "js" : "text";
    return [key, kind];
  };
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  for (let n; (n = walker.nextNode()); ) {
    const b = bucketFor(n);
    if (!b) continue;
    const [key, kind] = b;
    out[key] ??= { text: [], js: [], pop: [] };
    out[key][kind].push(n.textContent);
  }
  for (const k of Object.keys(out)) for (const kind of ["text", "js", "pop"]) out[k][kind] = out[k][kind].join(" ").replace(/\s+/g, " ").trim();
  return out;
}

// The plan's regex, with a lookbehind so "H-1B" reads as 1, not -1.
const NUM = /(?<![A-Za-z0-9])(?:[−-]?\d{1,3}(?:,\d{3})+(?:\.\d+)?%?|[−-]?\d+(?:\.\d+)?(?:%|×)?)/g;
const WORDS = /\b(?:zero|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|twice|half|a third|a quarter|one in \w+)\b/gi;

export const numbers = (text) => [
  ...(text.replace(/−/g, "-").match(NUM) || []),
  ...(text.match(WORDS) || []).map((w) => w.toLowerCase()),
];

const withNumbers = (cards) => {
  const res = {};
  for (const [k, v] of Object.entries(cards)) {
    res[k] = { ...v, n_text: numbers(v.text), n_js: numbers(v.js), n_pop: numbers(v.pop) };
  }
  return res;
};

async function browser() {
  return chromium.launch({ executablePath: CHROME, headless: true });
}

async function snapshot(out, url = PAGE_URL) {
  const b = await browser();
  const page = await b.newPage({ viewport: { width: 1440, height: 1000 } });
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  await page.goto(url, { waitUntil: "networkidle" });
  // Remove exclusive-accordion names, then open every details (twice, so
  // details that scripts insert on the first toggle open too).
  for (let round = 0; round < 3; round++) {
    await page.evaluate(() => {
      document.querySelectorAll("details[name]").forEach((d) => d.removeAttribute("name"));
      document.querySelectorAll("details:not([open])").forEach((d) => (d.open = true));
    });
    await page.waitForTimeout(400);
  }
  const statuses = ["#years-status", "#methods-status", "#skills-status", "#pagerank-status"];
  const deadline = Date.now() + 30000;
  let left = statuses;
  while (Date.now() < deadline) {
    left = await page.evaluate((ids) => ids.filter((s) => document.querySelector(s)), statuses);
    if (!left.length) break;
    await page.waitForTimeout(250);
  }
  await page.evaluate(() => {
    document.querySelectorAll("details[name]").forEach((d) => d.removeAttribute("name"));
    document.querySelectorAll("details:not([open])").forEach((d) => (d.open = true));
    document.querySelectorAll(".w4m-panel").forEach((s) => (s.hidden = false));
    document.querySelectorAll("[data-show]").forEach((e) => e.removeAttribute("data-show"));
  });
  await page.waitForTimeout(500);
  const cards = withNumbers(await page.evaluate(extract));
  const pageAll = Object.values(cards).flatMap((c) => [...c.n_text, ...c.n_js, ...c.n_pop]);
  writeFileSync(
    out,
    JSON.stringify({ url, taken: new Date().toISOString(), loaders_left: left, page_errors: errors, page_numbers: pageAll.length, cards }, null, 1),
  );
  console.log(`${Object.keys(cards).length} cards, ${pageAll.length} numbers, loaders left: ${left.join(", ") || "none"}, page errors: ${errors.length}`);
  await b.close();
}

async function boards(out, files) {
  const b = await browser();
  const page = await b.newPage({ viewport: { width: 1440, height: 1000 } });
  const all = {};
  for (const f of files) {
    const html = readFileSync(f, "utf8")
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<link[^>]*>/gi, "")
      .replace(/<img[^>]*>/gi, "");
    await page.setContent(html);
    const cards = withNumbers(await page.evaluate(extract));
    const board = f.split("/").pop().replace(".dc.html", "");
    for (const [k, v] of Object.entries(cards)) all[`${board}:${k}`] = { board, key: k, ...v };
  }
  writeFileSync(out, JSON.stringify({ taken: new Date().toISOString(), cards: all }, null, 1));
  console.log(`${Object.keys(all).length} board cards from ${files.length} boards`);
  await b.close();
}

const multiset = (list) => list.reduce((m, x) => m.set(x, (m.get(x) || 0) + 1), new Map());
const minus = (a, b) => {
  const mb = multiset(b);
  const res = [];
  for (const x of a) {
    if (mb.get(x) > 0) mb.set(x, mb.get(x) - 1);
    else res.push(x);
  }
  return res;
};

function compare(beforeFile, afterFile, boardsFile) {
  const before = JSON.parse(readFileSync(beforeFile, "utf8")).cards;
  const after = JSON.parse(readFileSync(afterFile, "utf8")).cards;
  const boardCards = boardsFile ? JSON.parse(readFileSync(boardsFile, "utf8")).cards : {};
  const boardByKey = {};
  for (const v of Object.values(boardCards)) boardByKey[v.key] = [...v.n_text, ...v.n_js, ...v.n_pop];
  const beforeAll = new Set(Object.values(before).flatMap((c) => [...c.n_text, ...c.n_js]));
  const report = { removed: [], added: [], invented: [], pop: [] };
  for (const key of new Set([...Object.keys(before), ...Object.keys(after)])) {
    const b = before[key] || { n_text: [], n_js: [], n_pop: [] };
    const a = after[key] || { n_text: [], n_js: [], n_pop: [] };
    const board = boardByKey[key];
    // A number that moves from prose into a term definition is not removed.
    for (const n of minus([...b.n_text, ...b.n_js, ...b.n_pop], [...a.n_text, ...a.n_js, ...a.n_pop])) {
      report.removed.push({ card: key, n, board_has: board ? board.includes(n) : null });
    }
    for (const n of minus(a.n_text, b.n_text)) {
      const row = { card: key, n, board_has: board ? board.includes(n) : null, elsewhere_before: beforeAll.has(n) };
      report.added.push(row);
      if (!beforeAll.has(n)) report.invented.push(row);
    }
    for (const n of minus(a.n_pop, b.n_pop)) report.pop.push({ card: key, n });
  }
  console.log(JSON.stringify(report, null, 1));
  if (report.invented.length) {
    console.error(`STOP: ${report.invented.length} invented number(s)`);
    process.exit(1);
  }
}

const [mode, ...args] = process.argv.slice(2);
if (mode === "snapshot") await snapshot(resolve(args[0]), args[1]);
else if (mode === "boards") await boards(resolve(args[0]), args.slice(1).map((f) => resolve(f)));
else if (mode === "compare") compare(...args.map((f) => resolve(f)));
else {
  console.error("usage: number_audit.mjs snapshot <out> [url] | boards <out> <board>... | compare <before> <after> [boards]");
  process.exit(2);
}
