#!/usr/bin/env node
// Stage a converter build (./ds-bundle) for the Log-Log Legends Kit artifact.
//
// kit-layout.mjs turns the build into the kit's files (the Design System type's
// layout since the 15 Oct clean-up). kit-published.json records the sha256 of
// every one of them as last published. This script copies only files whose hash
// differs (or that are new) into ds-stage/project/..., prints them, and with
// --record rewrites the record to match the build. Run --record only after the
// publish succeeded.
//
// Usage: node .design-sync/stage-kit.mjs [--out ds-bundle] [--stage ds-stage] [--record]
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { kitFiles } from "./kit-layout.mjs";

const argv = process.argv.slice(2);
const flag = (n, d) => { const i = argv.indexOf(`--${n}`); return i < 0 ? d : argv[i + 1]; };
const OUT = flag("out", "ds-bundle");
const STAGE = flag("stage", "ds-stage");
const RECORD = new URL("./kit-published.json", import.meta.url);
const config = JSON.parse(readFileSync(new URL("./config.json", import.meta.url), "utf8"));

const record = existsSync(RECORD) ? JSON.parse(readFileSync(RECORD, "utf8")) : {};
const sha = (data) => createHash("sha256").update(data).digest("hex");
const next = {};
const changed = [];
for (const [path, data] of kitFiles(OUT, config)) {
  const dest = `project/${path}`;
  next[dest] = sha(data);
  if (record[dest] !== next[dest]) changed.push([dest, data]);
}

rmSync(STAGE, { recursive: true, force: true });
for (const [dest, data] of changed) {
  mkdirSync(dirname(join(STAGE, dest)), { recursive: true });
  writeFileSync(join(STAGE, dest), data);
}
const gone = Object.keys(record).filter((p) => !(p in next));
console.log(`${changed.length} changed or new, ${gone.length} no longer built, of ${Object.keys(next).length}`);
for (const [dest] of changed) console.log(`  ${record[dest] ? "changed" : "new    "} ${dest}`);
for (const p of gone) console.log(`  gone    ${p} (move it to project/archived/ in the kit if it should go)`);
if (changed.length > 255) console.log("More than 255 paths: publish in several calls.");

if (argv.includes("--record")) {
  writeFileSync(RECORD, JSON.stringify(Object.fromEntries(Object.entries(next).sort()), null, 1) + "\n");
  console.log(`recorded ${Object.keys(next).length} hashes in ${relative(process.cwd(), RECORD.pathname)}`);
}
