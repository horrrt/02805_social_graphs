// analysis/run_all.py reruns weeks 1 to 3 and reports what moved. A script it
// leaves out never reruns, so its output can go stale without anyone noticing
// (Week 4's runner missed two scripts that way). Every week 1 to 3 analysis
// script must be in its list, apart from the schema modules and the two it
// names as excluded.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const runner = readFileSync(join(ROOT, "analysis/run_all.py"), "utf8");
const listed = [...runner.matchAll(/"(analysis|scripts)\/([\w/]+\.py)"/g)].map((m) => `${m[1]}/${m[2]}`);
const EXCLUDED = ["analysis/week01_api_check.py", "analysis/week03_forced_patch.py"];

test("run_all.py lists every week 1 to 3 analysis script it does not exclude", () => {
  const scripts = readdirSync(join(ROOT, "analysis"))
    .filter((f) => /^(week0[123]_|arcade_).*\.py$/.test(f) && !f.endsWith("_schemas.py"))
    .map((f) => `analysis/${f}`);
  const missing = scripts.filter((s) => !listed.includes(s) && !EXCLUDED.includes(s));
  assert.deepEqual(missing, []);
  for (const s of EXCLUDED) assert.ok(runner.includes(s.split("/").pop()), `run_all.py should say why it skips ${s}`);
});

test("every script run_all.py lists exists", () => {
  for (const s of listed) assert.ok(existsSync(join(ROOT, s)), `${s} is listed but missing`);
});
