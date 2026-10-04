// The rules React code follows as it replaces src/scripts (review/react-migration/):
// a static export with no router hooks or suspense, React owns the DOM it
// renders, interactive parts are islands, and URLs reach markup only after
// hydration. Covers src/features, src/kit, src/components and src/lib; until
// code lands there most checks have nothing to read. Reads source as text.
import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { basename, join } from "node:path";
import { ROOT, entryFile } from "./built-page.mjs";

const DIRS = ["src/features", "src/kit", "src/components", "src/lib"];
const tree = (dir) =>
  existsSync(join(ROOT, dir))
    ? readdirSync(join(ROOT, dir), { withFileTypes: true }).flatMap((e) =>
        e.isDirectory() ? tree(`${dir}/${e.name}`) : /\.(ts|tsx|js)$/.test(e.name) ? [`${dir}/${e.name}`] : [],
      )
    : [];
const FILES = DIRS.flatMap(tree).map((path) => ({ path, src: readFileSync(join(ROOT, path), "utf8") }));
console.log(`# react rules: ${FILES.length} files`);

const header = (src) => src.split("\n", 1)[0];
const isClient = (src) => /^(?:\s*\/\/[^\n]*\n|\s*\/\*[\s\S]*?\*\/)*\s*["']use client["']/.test(src);

// The entry a src/features/<folder>/ bridge belongs to, as entry names.
const ENTRIES = {
  week03: ["week03"],
  styleguide: ["styleguide"],
  "kit-page": ["kit"],
  template: ["template"],
  arcade: ["week01", "week02"],
  week01: ["week01"],
  week02: ["week02"],
  week04: ["week04"],
  week05: ["week05"],
  play: ["play"],
  mockups: ["mockups"],
  "screen-test": ["screen-test"],
};

/**
 * Whether the file may write to the DOM itself: a `// surface:` file under
 * src/lib or src/kit, or a `// bridge:` / `// shim:` file under
 * src/features/<page>/ while that page's entry still exists.
 */
function exempt(path, src, { surface = true } = {}) {
  const first = header(src);
  if (surface && /^\/\/ surface: \S/.test(first)) return /^src\/(lib|kit)\//.test(path);
  if (/^\/\/ (bridge|shim): \S/.test(first)) {
    const folder = path.match(/^src\/features\/([^/]+)\//)?.[1];
    return Boolean(folder && ENTRIES[folder]?.some((entry) => entryFile(entry)));
  }
  return false;
}

const BANNED = [
  [/\buseSearchParams\b/, "useSearchParams"],
  [/\busePathname\b/, "usePathname"],
  [/\buseRouter\b/, "useRouter"],
  [/["']next\/link["']/, "next/link"],
  [/["']next\/dynamic["']/, "next/dynamic"],
  [/\bReact\.lazy\b/, "React.lazy"],
  [/<Suspense\b/, "<Suspense"],
  [/(?<![.\w])use\(/, "React's use()"],
];

const DOM_WRITES = [
  [/\.classList\./, ".classList"],
  [/\.setAttribute\(/, ".setAttribute("],
  [/\.innerHTML\b/, ".innerHTML"],
  [/\.textContent\s*=(?!=)/, ".textContent ="],
  [/\.replaceChildren\(/, ".replaceChildren("],
  [/\binsertAdjacentHTML\b/, "insertAdjacentHTML"],
  [/\.hidden\s*=(?!=)/, ".hidden ="],
  [/\bappendChild\(/, "appendChild("],
  [/\.append\(/, ".append("],
];

const SHELL_BANNED = ["useData", "useVendor", "useEChart", "useCanvasPaint", "useDeck", "useGlobe", "throw"];

test("no router hooks, lazy loading or suspense in a static export", () => {
  const found = [];
  for (const { path, src } of FILES)
    for (const [re, name] of BANNED) if (re.test(src)) found.push(`${path}: ${name}`);
  assert.deepEqual(found, []);
});

test("React code leaves the DOM to React outside surfaces and bridges", () => {
  const found = [];
  for (const { path, src } of FILES) {
    const first = header(src);
    if (/^\/\/ surface: /.test(first) && !/^src\/(lib|kit)\//.test(path)) found.push(`${path}: // surface: belongs under src/lib or src/kit`);
    if (/^\/\/ (bridge|shim): /.test(first) && !exempt(path, src)) found.push(`${path}: a bridge or shim needs its page's entry under src/features/<page>/`);
    if (exempt(path, src)) continue;
    for (const [re, name] of DOM_WRITES) if (re.test(src)) found.push(`${path}: ${name}`);
  }
  assert.deepEqual(found, []);
});

test("document-level click handlers live in src/lib or in a bridge", () => {
  const found = [];
  for (const { path, src } of FILES) {
    if (!/document\.addEventListener\(\s*["']click["']/.test(src)) continue;
    if (path.startsWith("src/lib/") || exempt(path, src, { surface: false })) continue;
    found.push(path);
  }
  assert.deepEqual(found, []);
});

// A JSON-LD block (agentMeta.tsx's JsonLd) writes data into a
// <script type="application/ld+json">, not HTML into the page, so it is not raw HTML.
const inJsonLd = (src, at) => {
  const open = src.lastIndexOf("<script", at);
  return open >= 0 && !src.slice(open, at).includes(">") && /type="application\/ld\+json"/.test(src.slice(open, at));
};

test("raw HTML only in a src/lib file that says why", () => {
  const found = [];
  for (const { path, src } of FILES) {
    const uses = [...src.matchAll(/dangerouslySetInnerHTML/g)].filter((m) => !inJsonLd(src, m.index));
    if (!uses.length) continue;
    if (path.startsWith("src/lib/") && /^\/\/ allow-html: \S/.test(header(src))) continue;
    found.push(path);
  }
  assert.deepEqual(found, []);
});

// Exported component names of a file: `export function A`, `export const A`,
// `export default …` and `export { A, B as C }`.
function exportedComponents(src) {
  const names = [];
  for (const m of src.matchAll(/^export\s+(?:async\s+)?(function|const|let|class)\s+([\w$]+)/gm)) names.push({ name: m[2], kind: m[1] });
  for (const m of src.matchAll(/^export\s*\{([^}]*)\}/gm))
    for (const item of m[1].split(",")) {
      const [local] = item.trim().replace(/^type\s+/, "").split(/\s+as\s+/);
      if (local) names.push({ name: local, kind: "list" });
    }
  if (/^export\s+default\b/m.test(src)) names.push({ name: "default", kind: "default" });
  return names.filter(({ name }) => name === "default" || /^[A-Z][a-z]/.test(name));
}

// The argument text of the call that starts at `open` (the index of its "(").
function callArgs(src, open) {
  let depth = 0;
  for (let i = open; i < src.length; i++) {
    if (src[i] === "(") depth++;
    else if (src[i] === ")" && --depth === 0) return src.slice(open + 1, i);
  }
  return "";
}

const islandCall = (src, at) => {
  const m = src.slice(at).match(/^\s*island\s*\(/);
  return m ? callArgs(src, at + m[0].length - 1) : null;
};

test("every client component under src/features is an island with its roots", () => {
  const found = [];
  for (const { path, src } of FILES) {
    if (!path.startsWith("src/features/") || !path.endsWith(".tsx") || !isClient(src)) continue;
    if (basename(path).endsWith("Shell.tsx")) continue;
    for (const { name, kind } of exportedComponents(src)) {
      let args = null;
      if (kind === "default") {
        const m = src.match(/^export\s+default\b/m);
        args = islandCall(src, m.index + m[0].length);
      } else if (kind === "function" || kind === "class") {
        args = null;
      } else {
        const m = src.match(new RegExp(`^(?:export\\s+)?(?:const|let)\\s+${name}\\s*(?::[^=]+)?=`, "m"));
        args = m ? islandCall(src, m.index + m[0].length) : null;
      }
      if (args === null) found.push(`${path}: ${name} is not created by island(…)`);
      else if (!/\broots\s*:/.test(args)) found.push(`${path}: ${name}'s island(…) has no roots:`);
    }
  }
  assert.deepEqual(found, []);
});

test("shells fetch and draw nothing, and slot files stay on the server", () => {
  const found = [];
  for (const { path, src } of FILES) {
    const name = basename(path);
    if (name.endsWith("Shell.tsx"))
      for (const word of SHELL_BANNED) if (new RegExp(`\\b${word}\\b`).test(src)) found.push(`${path}: ${word}`);
    if (/^slots.*\.tsx$/.test(name) && isClient(src)) found.push(`${path}: 'use client' in a slot file`);
  }
  assert.deepEqual(found, []);
});

test("a URL rendered into an attribute waits for hydration", () => {
  const found = [];
  for (const { path, src } of FILES) {
    if (!path.endsWith(".tsx")) continue;
    const renders = /=\{\s*url\(/.test(src) || /=\{\s*asset\(/.test(src) || /=\{[^}]*\bSITE\b/.test(src);
    if (renders && !/\buseHydrated\(/.test(src)) found.push(path);
  }
  assert.deepEqual(found, []);
});
