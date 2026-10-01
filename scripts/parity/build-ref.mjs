// Builds a commit's static export once and caches it:
//   node scripts/parity/build-ref.mjs --ref <sha|HEAD|branch> [--print-out]
// The tree lands in $PARITY_DIR/<full sha>/out (default ~/.cache/llparity).
// A lock directory keeps two callers from building the same commit; the second
// waits and reuses the first one's tree. --print-out prints only the path.
import { execFileSync, spawn } from "node:child_process";
import { createWriteStream, existsSync, mkdirSync, readFileSync, renameSync, rmSync, statSync, utimesSync } from "node:fs";
import { join } from "node:path";
import { PARITY_DIR, ROOT, die, elapsed, parseArgs } from "./lib.mjs";

const args = parseArgs(process.argv.slice(2), ["print-out"]);
if (!args.ref) die("usage: build-ref.mjs --ref <sha> [--print-out]");
const log = (line) => console.error(`build-ref: ${line}`);

let sha;
try {
  sha = execFileSync("git", ["rev-parse", "--verify", `${args.ref}^{commit}`], { cwd: ROOT, encoding: "utf8" }).trim();
} catch {
  die(`build-ref: ${args.ref} is not a commit here`);
}
const short = sha.slice(0, 10);
const done = join(PARITY_DIR, sha, "out");
const lock = join(PARITY_DIR, `${sha}.lock`);
const STALE_MS = 10 * 60 * 1000;
mkdirSync(PARITY_DIR, { recursive: true });

function finish() {
  if (args["print-out"]) console.log(done);
  else console.log(`base out for ${short}: ${done}`);
  process.exit(0);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function acquire() {
  const t0 = Date.now();
  let said = 0;
  for (;;) {
    if (existsSync(join(done, "index.html"))) finish();
    try {
      mkdirSync(lock);
      return;
    } catch (e) {
      if (e.code !== "EEXIST") throw e;
    }
    let age = 0;
    try { age = Date.now() - statSync(lock).mtimeMs; } catch { continue; }
    if (age > STALE_MS) {
      log(`lock ${lock} is ${Math.round(age / 60000)} min old; taking it over`);
      rmSync(lock, { recursive: true, force: true });
      continue;
    }
    if (Date.now() - said >= 10000) {
      log(`waiting for another build of ${short} (${elapsed(t0)})`);
      said = Date.now();
    }
    await sleep(1000);
  }
}

await acquire();
const tmp = join(PARITY_DIR, `${sha}.tmp-${process.pid}`);
const tree = join(tmp, "tree");
const release = () => {
  rmSync(tmp, { recursive: true, force: true });
  rmSync(lock, { recursive: true, force: true });
};
for (const sig of ["SIGINT", "SIGTERM", "SIGHUP"]) process.on(sig, () => { release(); process.exit(130); });

try {
  const t0 = Date.now();
  mkdirSync(tree, { recursive: true });
  log(`extracting ${short} into ${tmp}`);
  execFileSync("sh", ["-c", `git -C "$1" archive --format=tar "$2" | tar -xf - -C "$3"`, "sh", ROOT, sha, tree]);

  // Turbopack rejects a node_modules symlink that points outside the project,
  // so clone the directory (APFS clone on macOS, hard links on Linux).
  const modules = process.env.LL_NODE_MODULES || join(ROOT, "node_modules");
  if (!existsSync(join(modules, ".bin", "next"))) throw new Error(`no next in ${modules}; set LL_NODE_MODULES`);
  log(`cloning node_modules from ${modules}`);
  execFileSync("cp", [process.platform === "darwin" ? "-Rc" : "-al", modules, join(tree, "node_modules")]);

  const logFile = join(tmp, "build.log");
  const out = createWriteStream(logFile);
  log(`next build (log: ${logFile})`);
  const child = spawn(join(tree, "node_modules/.bin/next"), ["build"], {
    cwd: tree,
    env: { ...process.env, GITHUB_SHA: "parity00000", NEXT_TELEMETRY_DISABLED: "1" },
    stdio: ["ignore", "pipe", "pipe"],
  });
  let last = "";
  const keep = (b) => {
    out.write(b);
    const lines = String(b).split("\n").map((l) => l.trim()).filter(Boolean);
    if (lines.length) last = lines.at(-1);
  };
  child.stdout.on("data", keep);
  child.stderr.on("data", keep);
  const tick = setInterval(() => {
    log(`building ${short} ${elapsed(t0)} · ${last.slice(0, 120)}`);
    const now = new Date();
    try { utimesSync(lock, now, now); } catch { /* lock gone */ }
  }, 10000);
  const code = await new Promise((ok) => child.on("close", ok));
  clearInterval(tick);
  out.end();
  if (code !== 0) {
    const tail = readFileSync(logFile, "utf8").split("\n").slice(-30).join("\n");
    throw new Error(`next build exited with ${code}\n${tail}`);
  }
  if (!existsSync(join(tree, "out", "index.html"))) throw new Error("next build left no out/index.html");
  mkdirSync(join(PARITY_DIR, sha), { recursive: true });
  renameSync(join(tree, "out"), done);
  log(`built ${short} in ${elapsed(t0)}`);
} catch (e) {
  release();
  die(`build-ref: ${e.message}`, 1);
}
release();
finish();
