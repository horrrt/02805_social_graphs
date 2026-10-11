// The built pages under out/, the way the tests read them. Run `npm run build`
// first (`npm test` does). Next's HTML carries the React Server Components
// payload in <script> tags, which repeats every string on the page; React
// escapes ' and " in text and puts an empty <!-- --> between adjacent text
// nodes. The tests assert on the markup a reader gets, so this drops Next's
// own scripts and those markers and undoes the two escapes in text.
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";
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
const CODE = /\.(tsx|ts|js|mjs)$/;

/**
 * The modules a page's entry (src/scripts/entries/<page>.js) imports, as file
 * names under src/scripts, in order: the old way pages listed their scripts.
 * Empty once the page has no entry.
 */
export function entryScripts(page) {
  const names = [];
  const walk = (file) => {
    const src = readFileSync(join(SCRIPTS, "entries", file), "utf8");
    for (const [, spec] of src.matchAll(/import(?:\s*\(\s*|\s+)"([^"]+)"/g)) {
      if (spec.startsWith("./")) walk(spec.slice(2));
      else if (spec.startsWith("../") && spec !== "../site.js") names.push(spec.slice(3));
    }
  };
  if (existsSync(join(SCRIPTS, "entries", `${page}.js`))) walk(`${page}.js`);
  return names;
}

/** Every code file under `dir` (absolute), recursively, in path order; [] if it is missing. */
export function codeFiles(dir, test = CODE) {
  if (!existsSync(dir)) return [];
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true }).sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0))) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...codeFiles(path, test));
    else if (test.test(entry.name)) out.push(path);
  }
  return out;
}

/** A module specifier in file `from` as the code file under src/ it names, or null. */
export function resolveSpec(from, spec) {
  let base;
  if (spec.startsWith("@/")) base = join(SRC, spec.slice(2));
  else if (spec.startsWith("./") || spec.startsWith("../")) base = resolve(dirname(from), spec);
  else return null;
  const candidates = [base, ...[".tsx", ".ts", ".js", ".mjs"].map((ext) => base + ext), ...["tsx", "ts", "js", "mjs"].map((ext) => join(base, `index.${ext}`))];
  for (const path of candidates) {
    if (!path.startsWith(SRC + sep) || !CODE.test(path)) continue;
    if (existsSync(path) && statSync(path).isFile()) return path;
  }
  return null;
}

const escapeRe = (s) => s.replace(/[$.*+?^()[\]{}|\\]/g, "\\$&");

/**
 * The import statements of a module: { spec, bindings, names, text, kind } with
 * kind "static", "side-effect", "re-export" or "dynamic". bindings are the local
 * names a static import creates and names pairs them with what they import
 * ("default", "*" or the exported name); type-only imports and names are left out.
 */
export function importsOf(src) {
  const found = [];
  const statics = /(^|[;\n}])\s*import\s+(type\s+)?([\w$*{}\s,]+?)\s+from\s*(["'])([^"'\n]+)\4/g;
  for (const m of src.matchAll(statics)) {
    const text = m[0].slice(m[1].length);
    if (m[2]) continue;
    const clause = m[3];
    const names = [];
    const braces = clause.match(/\{([^}]*)\}/);
    const head = clause.replace(/\{[^}]*\}/, "").split(",").map((s) => s.trim()).filter(Boolean);
    for (const part of head) {
      const ns = part.match(/^\*\s+as\s+([\w$]+)$/);
      names.push(ns ? { imported: "*", local: ns[1] } : { imported: "default", local: part });
    }
    if (braces)
      for (const item of braces[1].split(",").map((s) => s.trim()).filter(Boolean)) {
        if (/^type\s/.test(item)) continue;
        const [imported, local = imported] = item.split(/\s+as\s+/).map((s) => s.trim());
        names.push({ imported, local });
      }
    found.push({ spec: m[5], bindings: names.map((n) => n.local), names, text, kind: "static" });
  }
  for (const m of src.matchAll(/(^|[;\n}])\s*import\s*(["'])([^"'\n]+)\2/g))
    found.push({ spec: m[3], bindings: [], names: [], text: m[0].slice(m[1].length), kind: "side-effect" });
  for (const m of src.matchAll(/(^|[;\n}])\s*export\s+(?:type\s+)?(?:\*(?:\s+as\s+[\w$]+)?|\{[^}]*\})\s*from\s*(["'])([^"'\n]+)\2/g))
    found.push({ spec: m[3], bindings: [], names: [], text: m[0].slice(m[1].length), kind: "re-export" });
  for (const m of src.matchAll(/\bimport\(\s*(["'`])([^"'`$\n]+)\1\s*\)/g))
    found.push({ spec: m[2], bindings: [], names: [], text: m[0], kind: "dynamic" });
  return found.sort((a, b) => src.indexOf(a.text) - src.indexOf(b.text));
}

/** `src` with its static, side-effect and re-export statements cut out. */
export function withoutImports(src) {
  let out = src;
  for (const { text, kind } of importsOf(src)) if (kind !== "dynamic") out = out.replace(text, "");
  return out;
}

/** Whether `rest` (a module without its imports) names `name`, or renders <Name when it is Capitalised. */
export function uses(rest, name) {
  const word = new RegExp(`(?<![\\w$.])${escapeRe(name)}(?![\\w$])`);
  if (/^[A-Z]/.test(name) && rest.includes(`<${name}`)) return true;
  return word.test(rest);
}

/**
 * Code files under src/ reached from `roots` (absolute paths) by following
 * imports, depth first in source order, roots included. A .tsx/.ts file
 * follows a static import only for a binding it uses.
 */
export function importGraph(roots) {
  const seen = new Set();
  const order = [];
  const visit = (file) => {
    if (seen.has(file)) return;
    seen.add(file);
    order.push(file);
    const src = readFileSync(file, "utf8");
    const typed = /\.tsx?$/.test(file);
    const rest = typed ? withoutImports(src) : "";
    for (const imp of importsOf(src)) {
      if (typed && imp.kind === "static" && !imp.bindings.some((name) => uses(rest, name))) continue;
      const target = resolveSpec(file, imp.spec);
      if (target) visit(target);
    }
  };
  for (const root of roots) visit(root);
  return order;
}

const fromScripts = (path) => relative(SCRIPTS, path).split(sep).join("/");

/** The code files of a page's route group, src/app/(<page>)/, in path order. */
export function pageFiles(page) {
  return codeFiles(join(SRC, "app", `(${page})`));
}

/**
 * The scripts a page runs, relative to src/scripts ("week05-map.js",
 * "../features/week05/x.tsx"): the entry's modules in order, then every code
 * file under src/ reached by imports from the page's route group and from the
 * entry's modules, depth first, without repeats.
 */
export function pageScripts(page) {
  const entry = entryScripts(page);
  const roots = [...pageFiles(page), ...entry.map((name) => join(SCRIPTS, name))];
  return [...new Set([...entry, ...importGraph(roots).map(fromScripts)])];
}

/** The files reached from a page's entry module alone, relative to src/scripts; [] once the entry is gone. */
export function entryGraph(page) {
  const entry = join(SCRIPTS, "entries", `${page}.js`);
  if (!existsSync(entry)) return [];
  return importGraph([entry]).map(fromScripts);
}

/** The stylesheets a page's layout imports, as file names under src/styles, in order. */
export function pageStyles(page) {
  const src = readFileSync(join(ROOT, "src/app", `(${page})`, "layout.tsx"), "utf8");
  return [...src.matchAll(/^import "@\/styles\/([^"]+)";$/gm)].map((m) => m[1]);
}
