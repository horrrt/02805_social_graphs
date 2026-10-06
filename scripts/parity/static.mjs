// Zero static diff: compares two export trees page by page.
//   node scripts/parity/static.mjs <baseOut> <headOut> [--report file]
// For every .html in either tree it compares normalise() output (the markup a
// reader gets; tests/built-page.mjs), the page set and the ordered stylesheet
// list, then prints a size table. Exit 1 on any difference or when a page's
// gzipped HTML grows by more than 2%. Raw HTML is never compared: Next's
// payload scripts and chunk names differ between builds of the same markup.
import { createHash } from "node:crypto";
import { existsSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { gzipSync } from "node:zlib";
import { normalise } from "../../tests/built-page.mjs";
import { die, outDir, parseArgs, walk } from "./lib.mjs";

const args = parseArgs(process.argv.slice(2));
const [baseArg, headArg] = args._;
if (!baseArg || !headArg) die("usage: static.mjs <baseOut> <headOut> [--report file]");
const base = outDir(baseArg, "base");
const head = outDir(headArg, "head");
const CONTEXT = 160;
const GROWTH = 0.02;

const html = (dir) => walk(dir, (f) => f.endsWith(".html") && !f.startsWith("_next/"));
const baseSet = new Set(html(base));
const headSet = new Set(html(head));
const pages = [...new Set([...baseSet, ...headSet])].sort();

const sha = (s) => createHash("sha1").update(s).digest("hex").slice(0, 12);
const fileCache = new Map();
function assetText(dir, url) {
  const m = /\/_next\/(static\/[^"?#]+)/.exec(url);
  if (!m) return null;
  const file = join(dir, "_next", m[1]);
  if (!fileCache.has(file)) fileCache.set(file, existsSync(file) ? readFileSync(file) : null);
  return fileCache.get(file);
}

// Stylesheets are named by Turbopack's chunk hash, which can move when chunking
// moves while the CSS stays byte-identical. Compare them by content instead.
function canonical(dir, text) {
  return text.replace(/(<link rel="stylesheet" href=")([^"]*\/_next\/static\/[^"]+\.css)(")/g, (_, a, url, b) => {
    const body = assetText(dir, url);
    return `${a}_next-css:${body ? sha(body) : "missing"}${b}`;
  });
}

const stylesheets = (raw) =>
  [...raw.matchAll(/<link rel="stylesheet" href="([^"]+)"/g)].map((m) => {
    const name = m[1].split("/").pop().split("?")[0];
    // Strip the content hash from the name: "0jh_25iwaebe5.css" -> ".css".
    return name.replace(/(^|[.-])[0-9a-z_-]{8,}(?=\.)/i, "$1");
  });

function sizes(dir, raw) {
  const pushed = [...raw.matchAll(/<script>(self\.__next_f\.push\([\s\S]*?)<\/script>/g)].reduce((n, m) => n + Buffer.byteLength(m[1]), 0);
  const chunks = new Set([...raw.matchAll(/(?:src|href)="([^"]*\/_next\/static\/chunks\/[^"]+)"/g)].map((m) => m[1].split("?")[0]));
  let chunkBytes = 0;
  for (const url of chunks) chunkBytes += assetText(dir, url)?.length ?? 0;
  return { raw: Buffer.byteLength(raw), gzip: gzipSync(raw).length, flight: pushed, chunks: chunkBytes };
}

function firstMismatch(a, b) {
  let i = 0;
  const n = Math.min(a.length, b.length);
  while (i < n && a.charCodeAt(i) === b.charCodeAt(i)) i++;
  const cut = (s) => s.slice(Math.max(0, i - CONTEXT), i + CONTEXT);
  return { offset: i, base: cut(a), head: cut(b) };
}

const report = { base, head, pages: [], failed: false };
const rows = [];
for (const page of pages) {
  const entry = { page };
  if (!baseSet.has(page) || !headSet.has(page)) {
    entry.diff = baseSet.has(page) ? "missing in head" : "only in head";
    report.pages.push(entry);
    report.failed = true;
    console.log(`DIFF ${page}: ${entry.diff}`);
    continue;
  }
  const rawA = readFileSync(join(base, page), "utf8");
  const rawB = readFileSync(join(head, page), "utf8");
  const a = canonical(base, normalise(rawA));
  const b = canonical(head, normalise(rawB));
  const sa = stylesheets(rawA);
  const sb = stylesheets(rawB);
  entry.size = { base: sizes(base, rawA), head: sizes(head, rawB) };
  if (a !== b) {
    entry.diff = "markup";
    entry.mismatch = firstMismatch(a, b);
  } else if (JSON.stringify(sa) !== JSON.stringify(sb)) {
    entry.diff = "stylesheets";
    entry.stylesheets = { base: sa, head: sb };
  }
  const growth = entry.size.head.gzip / entry.size.base.gzip - 1;
  if (growth > GROWTH) entry.growth = `gzip +${(growth * 100).toFixed(2)}%`;
  if (entry.diff || entry.growth) report.failed = true;
  report.pages.push(entry);
  if (entry.diff === "markup") {
    console.log(`DIFF ${page}: normalised markup differs at offset ${entry.mismatch.offset}`);
    console.log(`  base: …${entry.mismatch.base}…`);
    console.log(`  head: …${entry.mismatch.head}…`);
  } else if (entry.diff) {
    console.log(`DIFF ${page}: stylesheets ${JSON.stringify(sa)} -> ${JSON.stringify(sb)}`);
  }
  if (entry.growth) console.log(`GROWTH ${page}: ${entry.growth} (limit ${GROWTH * 100}%)`);
  rows.push([page, entry.size.base, entry.size.head]);
}

const k = (n) => (n / 1024).toFixed(1);
const delta = (a, b) => (a ? `${b >= a ? "+" : ""}${(((b - a) / a) * 100).toFixed(1)}%` : "");
console.log("\npage                                   raw kB (base→head)    gzip kB              flight kB            chunks kB");
for (const [page, sa, sb] of rows) {
  const col = (key) => `${k(sa[key])}→${k(sb[key])} ${delta(sa[key], sb[key])}`.padEnd(21);
  console.log(`${page.padEnd(38)} ${col("raw")} ${col("gzip")} ${col("flight")} ${col("chunks")}`);
}
console.log(`\n${pages.length} pages, ${report.pages.filter((p) => p.diff).length} differ, ${report.pages.filter((p) => p.growth).length} grew over ${GROWTH * 100}%`);
if (args.report) writeFileSync(args.report, JSON.stringify(report, null, 1));
process.exit(report.failed ? 1 : 0);
