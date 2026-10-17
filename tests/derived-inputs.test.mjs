// A derived JSON file stamped by analysis/stamps.py carries "inputs", the
// sha256 of every file its script read, and "rerun", the command that remakes
// it. This test re-hashes each input: when one changed after the output was
// written, the output may be stale, and the failure names the script to rerun.
// On 27 Sep 2026 three Week 3 files trailed their inputs and the page quoted
// them; the prose tests passed because they compare the page with that JSON.
// An input under build/ (gitignored) is checked only where it exists.
import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const sha256 = (path) => createHash("sha256").update(readFileSync(join(ROOT, path))).digest("hex");

// Tracked JSON under analysis/ and public/ that carries a stamp.
const tracked = execFileSync("git", ["ls-files", "-z", "--", "analysis/*.json", "public/*.json"], { cwd: ROOT })
  .toString().split("\0").filter(Boolean);
const stamped = tracked.flatMap((file) => {
  const text = readFileSync(join(ROOT, file), "utf8");
  if (!text.includes('"inputs"')) return [];
  const data = JSON.parse(text);
  return data && typeof data.inputs === "object" && typeof data.rerun === "string" ? [{ file, ...data }] : [];
});

test("the Week 3 outputs carry their input stamps", () => {
  const files = stamped.map((s) => s.file);
  for (const file of [
    "public/assets/data/week03_corridors.json",
    "public/assets/data/week03_edges.json",
    "public/assets/data/week03_flights.json",
    "analysis/week03_gravity.json",
    "analysis/week03_communities.json",
    "public/assets/data/week03_cartography.json",
  ]) assert.ok(files.includes(file), `${file} has no "inputs" stamp; rerun its script`);
});

test("every stamped output still matches the inputs it was computed from", () => {
  const stale = [];
  for (const { file, inputs, rerun } of stamped) {
    for (const [input, hash] of Object.entries(inputs)) {
      if (!existsSync(join(ROOT, input))) {
        assert.ok(input.startsWith("build/"), `${file} was computed from ${input}, which is gone`);
        continue;
      }
      if (sha256(input) !== hash) stale.push(`${file}: ${input} changed since it was written; ${rerun}`);
    }
  }
  assert.deepEqual(stale, []);
});
