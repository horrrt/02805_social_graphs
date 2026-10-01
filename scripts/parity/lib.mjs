// Shared plumbing for the parity tools: flags, the page list, serving two
// export trees and launching the pinned browser. See scripts/parity/README.md.
import { spawn } from "node:child_process";
import { existsSync, readdirSync, statSync } from "node:fs";
import { createServer } from "node:net";
import { homedir } from "node:os";
import { dirname, isAbsolute, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

export const HERE = dirname(fileURLToPath(import.meta.url));
export const ROOT = join(HERE, "..", "..");
export const BASE_PATH = "/02805_social_graphs/";

/** Page name -> path under the base path. */
export const PAGES = {
  home: "",
  week01: "weeks/week01/",
  week02: "weeks/week02/",
  week03: "weeks/week03/",
  week04: "weeks/week04/",
  week05: "weeks/week05/",
  template: "weeks/_template/",
  kit: "styleguide/kit/",
  styleguide: "styleguide/",
  mockups: "mockups/",
  play: "play/",
  "screen-test": "prototypes/screen-test/",
};

/**
 * Parses --flag value / --flag (boolean) pairs. `bools` lists flags that take
 * no value; everything else consumes the next argument.
 */
export function parseArgs(argv, bools = []) {
  const out = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith("--")) { out._.push(a); continue; }
    const eq = a.indexOf("=");
    const key = (eq > 0 ? a.slice(2, eq) : a.slice(2));
    if (eq > 0) out[key] = a.slice(eq + 1);
    else if (bools.includes(key)) out[key] = true;
    else {
      if (i + 1 >= argv.length) die(`--${key} needs a value`);
      out[key] = argv[++i];
    }
  }
  return out;
}

export function die(message, code = 2) {
  console.error(message);
  process.exit(code);
}

export function pagesArg(value) {
  const pages = value ? value.split(",").map((p) => p.trim()).filter(Boolean) : Object.keys(PAGES);
  for (const p of pages) if (!(p in PAGES)) die(`unknown page ${p}; pages: ${Object.keys(PAGES).join(", ")}`);
  return pages;
}

/** An export tree: a directory holding index.html (out/ or a build-ref cache). */
export function outDir(value, flag) {
  if (!value) die(`--${flag} <out directory> is required`);
  const dir = resolve(value);
  if (!existsSync(join(dir, "index.html"))) die(`--${flag} ${value}: no index.html there; build it first`);
  return dir;
}

export const PARITY_DIR = process.env.PARITY_DIR || join(homedir(), ".cache", "llparity");

export const CHROMIUM = process.env.PARITY_CHROMIUM
  || join(homedir(), "Library/Caches/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-mac-arm64/chrome-headless-shell");

export async function launch(chromium, options = {}) {
  if (!existsSync(CHROMIUM)) die(`no browser at ${CHROMIUM}; set PARITY_CHROMIUM (never download one)`);
  return chromium.launch({ executablePath: CHROMIUM, ...options });
}

export function freePort() {
  return new Promise((ok, fail) => {
    const s = createServer();
    s.once("error", fail);
    s.listen(0, "127.0.0.1", () => {
      const { port } = s.address();
      s.close(() => ok(port));
    });
  });
}

/** Serves an export tree with scripts/serve-out.mjs; resolves to {origin, close}. */
export async function serve(dir) {
  const port = await freePort();
  const child = spawn(process.execPath, [join(ROOT, "scripts/serve-out.mjs")], {
    env: { ...process.env, OUT: dir, PORT: String(port) },
    stdio: ["ignore", "pipe", "inherit"],
  });
  await new Promise((ok, fail) => {
    child.once("exit", (code) => fail(new Error(`serve-out exited with ${code}`)));
    child.stdout.on("data", (b) => { if (String(b).includes("http://")) ok(); });
  });
  const close = () => { try { child.kill(); } catch { /* gone */ } };
  process.once("exit", close);
  return { origin: `http://127.0.0.1:${port}`, base: `http://127.0.0.1:${port}${BASE_PATH}`, close };
}

/** Every file under dir (relative paths), optionally filtered by a predicate. */
export function walk(dir, keep = () => true, prefix = "") {
  const out = [];
  for (const name of readdirSync(join(dir, prefix)).sort()) {
    const rel = prefix ? `${prefix}/${name}` : name;
    if (statSync(join(dir, rel)).isDirectory()) out.push(...walk(dir, keep, rel));
    else if (keep(rel)) out.push(rel);
  }
  return out;
}

/** Turns a shell-style glob (*, **, ?) into a RegExp over relative paths. */
export function globRe(glob) {
  let re = "";
  for (let i = 0; i < glob.length; i++) {
    const c = glob[i];
    if (c === "*" && glob[i + 1] === "*") { re += ".*"; i++; if (glob[i + 1] === "/") i++; }
    else if (c === "*") re += "[^/]*";
    else if (c === "?") re += "[^/]";
    else re += c.replace(/[.+^${}()|[\]\\]/g, "\\$&");
  }
  return new RegExp(`^${re}$`);
}

/**
 * Loads a scenario module: export default [{ name, url, steps }]. `file` is a
 * path, or a name under scenarios/<page>/ (".mjs" optional). Without a file,
 * the page's load scenario: open the page, settle, snapshot.
 */
export async function loadScenario(page, file) {
  if (!file) return { file: null, scenarios: [{ name: "load", url: PAGES[page], steps: [] }] };
  const candidates = [file, `${file}.mjs`, join(HERE, "scenarios", page, file), join(HERE, "scenarios", page, `${file}.mjs`)];
  const path = candidates.map((c) => (isAbsolute(c) ? c : resolve(c))).find((c) => existsSync(c) && statSync(c).isFile());
  if (!path) die(`scenario ${file} not found (looked in . and scripts/parity/scenarios/${page}/)`);
  const mod = await import(pathToFileURL(path).href);
  const scenarios = mod.default;
  if (!Array.isArray(scenarios)) die(`${path}: export default must be an array of { name, url, steps }`);
  for (const s of scenarios) {
    if (!s.name || typeof s.url !== "string" || !Array.isArray(s.steps)) die(`${path}: scenario ${JSON.stringify(s.name)} needs name, url and steps`);
  }
  return { file: path, scenarios };
}

/** Loads scenarios/<page>/lib.mjs when it exists (functions for {evaluate} steps). */
export async function loadPageLib(page) {
  const path = join(HERE, "scenarios", page, "lib.mjs");
  return existsSync(path) ? import(pathToFileURL(path).href) : {};
}

/** "a..b" -> [a, b] step bounds (1-based, inclusive); either side may be empty. */
export function stepsArg(value) {
  if (!value) return null;
  const m = /^(\d*)\.\.(\d*)$/.exec(value) || /^(\d+)$/.exec(value);
  if (!m) die(`--steps takes a..b, got ${value}`);
  const a = m[1] ? Number(m[1]) : 1;
  const b = m[2] === undefined ? a : m[2] ? Number(m[2]) : Infinity;
  return [a, b];
}

export function elapsed(t0) {
  const s = Math.round((Date.now() - t0) / 1000);
  return s >= 60 ? `${Math.floor(s / 60)}m${s % 60}s` : `${s}s`;
}
