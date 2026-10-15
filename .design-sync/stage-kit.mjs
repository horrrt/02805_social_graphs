#!/usr/bin/env node
// Stage a converter build (./ds-bundle) for the Log-Log Legends Kit artifact.
//
// The kit keeps the layout the 12 Oct migration gave it: the 39 components the
// old Claude Design manifest listed sit whole in project/components/<group>/<Name>/;
// the 53 added later keep their .jsx there but their .d.ts, .html card and
// .prompt.md in project/docs/components/<group>/<Name>/, where the card's
// ../../../ links miss the bundle. A component new to the kit goes whole under
// project/components/, so its card opens.
//
// kit-published.json records the sha256 of every file last published. This
// script copies only files whose hash differs (or that are new) into
// ds-stage/project/..., prints them, and with --record rewrites the record to
// match the build. Run --record only after the publish succeeded.
//
// Usage: node .design-sync/stage-kit.mjs [--out ds-bundle] [--stage ds-stage] [--record]
import { createHash } from "node:crypto";
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";

const argv = process.argv.slice(2);
const flag = (n, d) => { const i = argv.indexOf(`--${n}`); return i < 0 ? d : argv[i + 1]; };
const OUT = flag("out", "ds-bundle");
const STAGE = flag("stage", "ds-stage");
const RECORD = new URL("./kit-published.json", import.meta.url);

// Converter output the kit does not take: its own bookkeeping, and README.md,
// which the kit page extends with its card index (edit the kit's copy instead).
const SKIP = /^(\.|_screenshots\/|_ds_sync\.json$|_ds_needs_recompile$|README\.md$)|\/\./;

const record = existsSync(RECORD) ? JSON.parse(readFileSync(RECORD, "utf8")) : {};
const inDocs = new Set(
  Object.keys(record)
    .map((p) => p.match(/^project\/docs\/components\/[^/]+\/([^/]+)\//)?.[1])
    .filter(Boolean),
);

function walk(dir) {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}

function kitPath(file) {
  const m = file.match(/^components\/[^/]+\/([^/]+)\/[^/]+\.(jsx|d\.ts|html|prompt\.md)$/);
  if (m && m[2] !== "jsx" && inDocs.has(m[1])) return `project/docs/${file}`;
  return `project/${file}`;
}

const sha = (p) => createHash("sha256").update(readFileSync(p)).digest("hex");
const next = {};
const changed = [];
for (const abs of walk(OUT)) {
  const file = relative(OUT, abs).split("\\").join("/");
  if (SKIP.test(file)) continue;
  const dest = kitPath(file);
  next[dest] = sha(abs);
  if (record[dest] !== next[dest]) changed.push([abs, dest]);
}

rmSync(STAGE, { recursive: true, force: true });
for (const [abs, dest] of changed) {
  mkdirSync(dirname(join(STAGE, dest)), { recursive: true });
  cpSync(abs, join(STAGE, dest));
}
const gone = Object.keys(record).filter((p) => !(p in next));
console.log(`${changed.length} changed or new, ${gone.length} no longer built, of ${Object.keys(next).length}`);
for (const [, dest] of changed) console.log(`  ${record[dest] ? "changed" : "new    "} ${dest}`);
for (const p of gone) console.log(`  gone    ${p} (remove from the kit by hand if it should go)`);
if (changed.length > 255) console.log("More than 255 paths: publish in several calls.");

if (argv.includes("--record")) {
  writeFileSync(RECORD, JSON.stringify(Object.fromEntries(Object.entries(next).sort()), null, 1) + "\n");
  console.log(`recorded ${Object.keys(next).length} hashes in ${relative(process.cwd(), RECORD.pathname)}`);
}
