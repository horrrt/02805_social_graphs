// The built pages under out/, the way the tests read them. Run `npm run build`
// first (`npm test` does). Next's HTML carries the React Server Components
// payload in <script> tags, which repeats every string on the page; React
// escapes ' and " in text and puts an empty <!-- --> between adjacent text
// nodes. The tests assert on the markup a reader gets, so this drops Next's
// own scripts and those markers and undoes the two escapes in text.
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

const cache = new Map();

/** Built HTML with Next's scripts, preload links and text markers dropped. */
export function normalise(html) {
  return html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/g, (tag) =>
      /src="[^"]*\/_next\//.test(tag) || /__next|\$RC|\$RS/.test(tag) ? "" : tag,
    )
    .replace(/<link rel="(?:preload|preconnect)"[^>]*\/>/g, "")
    .replace(/<!-- -->/g, "")
    .replace(/>([^<]*)</g, (_, text) => `>${text.replace(/&#x27;/g, "'").replace(/&quot;/g, '"')}<`);
}

/** The HTML of a built page, e.g. builtPage("out/weeks/week05/index.html"). */
export function builtPage(path) {
  if (cache.has(path)) return cache.get(path);
  const file = join(ROOT, path);
  if (!existsSync(file)) throw new Error(`${path} is missing: run \`npm run build\` before the tests`);
  const html = normalise(readFileSync(file, "utf8"));
  cache.set(path, html);
  return html;
}

const SRC = join(ROOT, "src");
const SCRIPTS = join(SRC, "scripts");
const CODE = [".tsx", ".ts", ".js", ".mjs"];
const PAGE_SCRIPTS = join(SRC, "components/PageScripts.tsx");

/** The entry module of a page, src/scripts/entries/<page>.js, or null once it is gone. */
export const entryFile = (page) => {
  const file = join(SCRIPTS, "entries", `${page}.js`);
  return existsSync(file) ? file : null;
};

// The scripts an entry imports, as file names under src/scripts, in its order.
function entryWalk(page) {
  const names = [];
  const walk = (file) => {
    const src = readFileSync(join(SCRIPTS, "entries", file), "utf8");
    for (const [, spec] of src.matchAll(/import(?:\s*\(\s*|\s+)"([^"]+)"/g)) {
      if (spec.startsWith("./")) walk(spec.slice(2));
      else if (spec.startsWith("../") && spec !== "../site.js") names.push(spec.slice(3));
    }
  };
  if (entryFile(page)) walk(`${page}.js`);
  return names;
}

// A specifier as a code file under src/, or null for packages, styles and
// anything outside src/.
export function resolveSpec(from, spec) {
  let base;
  if (spec.startsWith("@/")) base = join(SRC, spec.slice(2));
  else if (spec.startsWith(".")) base = join(dirname(from), spec);
  else return null;
  const tries = [base, ...CODE.map((ext) => base + ext), ...CODE.map((ext) => join(base, "index" + ext))];
  const hit = tries.find((p) => CODE.some((ext) => p.endsWith(ext)) && existsSync(p) && statSync(p).isFile());
  return hit && hit.startsWith(SRC + sep) ? hit : null;
}

/**
 * The imports of a source file: static (with their bindings), side-effect,
 * `export … from` and import("…"). Each has the specifier, the file it
 * resolves to under src/ (or null), its kind, the statement text and, for a
 * static import, its local binding names.
 */
export function importsOf(file) {
  const src = readFileSync(file, "utf8");
  const out = [];
  const add = (kind, spec, text, bindings = [], type = false) =>
    out.push({ kind, spec, text, bindings, type, file: resolveSpec(file, spec) });
  for (const m of src.matchAll(/^[ \t]*import\s+(type\s+)?([^;"'`]*?)\s+from\s*["']([^"']+)["'];?/gm)) {
    add("static", m[3], m[0], bindingsOf(m[2]), Boolean(m[1]));
  }
  for (const m of src.matchAll(/^[ \t]*import\s*["']([^"']+)["'];?/gm)) add("side-effect", m[1], m[0]);
  for (const m of src.matchAll(/^[ \t]*export\s+(type\s+)?[^;"'`]*?\s+from\s*["']([^"']+)["'];?/gm)) {
    add("re-export", m[2], m[0], [], Boolean(m[1]));
  }
  for (const m of src.matchAll(/\bimport\(\s*["'`]([^"'`$]+)["'`]\s*\)/g)) add("dynamic", m[1], m[0]);
  return out;
}

// The local names an import clause binds: `A`, `{ b, c as d }`, `* as e`.
function bindingsOf(clause) {
  const names = [];
  const braces = clause.match(/\{([^}]*)\}/);
  if (braces) {
    for (const item of braces[1].split(",")) {
      const name = item.trim().replace(/^type\s+/, "").split(/\s+as\s+/).pop();
      if (name) names.push(name);
    }
  }
  const rest = clause.replace(/\{[^}]*\}/, "");
  const star = rest.match(/\*\s+as\s+([\w$]+)/);
  if (star) names.push(star[1]);
  const def = rest.replace(/\*\s+as\s+[\w$]+/, "").match(/^\s*([\w$]+)/);
  if (def) names.push(def[1]);
  return names;
}

/** Whether `name` appears in `src` once the import statements are cut out. */
export function usedOutsideImports(src, name, statements) {
  let body = src;
  for (const s of statements) body = body.replace(s, "");
  const word = new RegExp(`(?<![\\w$.])${name.replace(/\$/g, "\\$")}(?![\\w$])`);
  return word.test(body) || body.includes(`<${name}`);
}

// Which imports of a file the page actually follows. In .tsx/.ts files a
// static import counts only when one of its bindings is used outside the
// import; side-effect, dynamic and `export … from` imports always count.
function followed(file) {
  const imports = importsOf(file).filter((i) => i.file && !i.type);
  if (!/\.tsx?$/.test(file)) return imports.map((i) => i.file);
  const src = readFileSync(file, "utf8");
  const statements = imports.map((i) => i.text);
  return imports
    .filter((i) => i.kind !== "static" || i.bindings.some((name) => usedOutsideImports(src, name, statements)))
    .map((i) => i.file);
}

// Every code file under a directory, in path order.
function codeFiles(dir) {
  if (!existsSync(dir)) return [];
  const files = [];
  for (const entry of readdirSync(dir, { withFileTypes: true }).sort((a, b) => (a.name < b.name ? -1 : 1))) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...codeFiles(path));
    else if (CODE.some((ext) => entry.name.endsWith(ext))) files.push(path);
  }
  return files;
}

/** Every code file the import graph reaches from `roots` (absolute paths), depth first. */
export function reach(roots) {
  const seen = new Set();
  const order = [];
  const visit = (file) => {
    if (seen.has(file) || file === PAGE_SCRIPTS) return;
    seen.add(file);
    order.push(file);
    for (const next of followed(file)) visit(next);
  };
  for (const root of roots) visit(root);
  return order;
}

/** The files under src/scripts the page's entry reaches, directly or through their imports. */
export const entryReach = (page) => reach(entryWalk(page).map((name) => join(SCRIPTS, name)));

/**
 * Every code file a page runs, as absolute paths: the entry's scripts in its
 * order, then the import graph from every file under src/app/(<page>)/ and
 * from those scripts. PageScripts.tsx is never walked, so a script reached
 * only through the entry counts only while the entry lists it.
 */
export function pageModules(page) {
  const entry = entryWalk(page).map((name) => join(SCRIPTS, name));
  const app = codeFiles(join(SRC, "app", `(${page})`));
  return [...new Set([...entry, ...reach([...app, ...entry])])];
}

/**
 * The scripts a page runs, relative to src/scripts, entry order first and then
 * import-graph order (see pageModules). Code that has moved out of src/scripts
 * shows up as "../features/…".
 */
export function pageScripts(page) {
  return pageModules(page).map((file) => relative(SCRIPTS, file).split(sep).join("/"));
}

/** The stylesheets a page's layout imports, as file names under src/styles, in order. */
export function pageStyles(page) {
  const src = readFileSync(join(ROOT, "src/app", `(${page})`, "layout.tsx"), "utf8");
  return [...src.matchAll(/^import "@\/styles\/([^"]+)";$/gm)].map((m) => m[1]);
}
