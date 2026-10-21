// The runners rerun the analysis and report what moved: analysis/run_all.py
// for weeks 1 to 3 and 5 to 7, analysis/week04_run_all.py for week 4. A script
// no runner lists never reruns, so its output can go stale without anyone
// noticing (Week 4's runner missed three scripts that way). Every
// analysis/weekNN_*.py script must be in a runner's SCRIPTS or in EXCLUDED
// below, with the reason it stays out.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (path) => readFileSync(join(ROOT, path), "utf8");

// run_all.py maps names to paths; week04_run_all.py lists bare names.
const runAll = read("analysis/run_all.py");
const week4 = read("analysis/week04_run_all.py").match(/^SCRIPTS = \[([\s\S]*?)\]/m)[1];
const RUNNERS = {
  "analysis/run_all.py": [...runAll.matchAll(/"((?:analysis|scripts)\/[\w/]+\.py)"/g)].map((m) => m[1]),
  "analysis/week04_run_all.py": [...week4.matchAll(/"(week04_\w+)"/g)].map((m) => `analysis/${m[1]}.py`),
};
const listed = Object.values(RUNNERS).flat();

const LIVE = "queries a live API, so a rerun cannot reproduce it; its output is a committed snapshot";
const EXCLUDED = {
  "analysis/run_all.py": "the runner itself",
  "analysis/week04_run_all.py": "the runner itself",
  "analysis/week01_api_check.py": `${LIVE} (Wikipedia)`,
  "analysis/week03_forced_patch.py": "a one-off patch that a full week03_corridor_control.py run supersedes",
  "analysis/week04_data.py": "the downloader for build/week04/, not an analysis",
  "analysis/week04_names.py": "a shared module (name rules) the week 4 scripts import",
  "analysis/week04_gleif.py": `${LIVE} (GLEIF), and its rows are reviewed into week04_client_aliases.parquet`,
  "analysis/week04_sec.py": `${LIVE} (SEC EDGAR): week04_sec_sectors.parquet`,
  "analysis/week04_wikidata.py": `${LIVE} (Wikidata): week04_wikidata_sectors.parquet`,
  "analysis/week04_brief_gaps.py": "feeds only the design canvas under review/week04-redesign/, never the site",
  "analysis/week04_names_check.py": "a diagnostic of the name rules; only the design canvas under review/ reads it",
  "analysis/week05_text.py": "a shared module (corpus and graph loaders) the week 5 and 6 scripts import",
  "analysis/week06_gender.py": `${LIVE} (Wikidata): week06_gender.parquet`,
  "analysis/week06_cold_read_images.py": `${LIVE} (Wikipedia pageimages): week06_cold_read_images.json`,
  "analysis/week06_portraits.py": "downloads portrait images once and skips those on disk; not a derived number",
  "analysis/week07_page_vectors.py": "needs sentence-transformers (PyTorch), which the course environment does not carry; writes build/week07/ once",
};

test("every analysis/weekNN_*.py script is in a runner or excluded with a reason", () => {
  const scripts = readdirSync(join(ROOT, "analysis"))
    .filter((f) => /^(week\d\d_|arcade_).*\.py$/.test(f) && !f.endsWith("_schemas.py"))
    .map((f) => `analysis/${f}`);
  const missing = scripts.filter((s) => !listed.includes(s) && !(s in EXCLUDED));
  assert.deepEqual(missing, [], "add these to a runner's SCRIPTS, or to EXCLUDED here with the reason");
});

test("no script is both run and excluded, and every exclusion still exists", () => {
  for (const [script, reason] of Object.entries(EXCLUDED)) {
    assert.ok(existsSync(join(ROOT, script)), `${script} is excluded but no longer exists`);
    assert.ok(reason.length > 10, `${script} needs a reason`);
    assert.ok(!listed.includes(script), `${script} is both in a runner and in EXCLUDED`);
  }
});

test("every script a runner lists exists, once", () => {
  for (const [runner, scripts] of Object.entries(RUNNERS)) {
    assert.ok(scripts.length > 10, `could not read SCRIPTS from ${runner}`);
    for (const s of scripts) assert.ok(existsSync(join(ROOT, s)), `${runner} lists ${s}, which is missing`);
  }
  assert.equal(new Set(listed).size, listed.length, "a script sits in two runners");
});
