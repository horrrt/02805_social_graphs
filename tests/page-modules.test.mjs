// Keeps the module walker (pageScripts in built-page.mjs) honest while code
// moves out of src/scripts: it still finds every script a page's entry lists,
// it follows imports a page reaches only indirectly, and each piece of code a
// test pins by its text stays reachable from its page once the entry stops
// importing the file it used to live in. Reads source files only.
import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import {
  ROOT,
  entryFile,
  entryReach,
  importsOf,
  pageModules,
  pageScripts,
  usedOutsideImports,
} from "./built-page.mjs";

const SCRIPTS = join(ROOT, "src/scripts");
const PAGES = readdirSync(join(ROOT, "src/app"), { withFileTypes: true })
  .filter((d) => d.isDirectory() && /^\(.+\)$/.test(d.name))
  .map((d) => d.name.slice(1, -1));

// Text the tests pin in a script, by page and the file it lives in today.
const ANCHORS = [
  ["week04", "week04-cut.js", "const ALIAS"],
  ["week04", "week04-cut.js", "const SUB"],
  ["week04", "week04-cut.js", "const METHOD"],
  ["week04", "week04-staffing.js", "const SECTORS"],
  ["week04", "week04-years.js", "const oj = data.oct_jun.totals;"],
  ["week04", "week04-pagerank.js", "lead from round ${claims.leaderStep} and hold first place for good."],
  ["week04", "week04-pagerank.js", "`After round ${claims.firstStep} ${claims.firstLeaderTitle} lead; from round ${claims.leaderStep} `"],
  ["week05", "week05-weird.js", '"w5-term-weird-mattr"'],
  ["week05", "week05-weird.js", '"w5-term-weird-z"'],
  ["week05", "week05-weird.js", '"w5-term-weird-house"'],
  ["week05", "week05-map.js", "n.name,"],
  ...[0, 279706, 1030855, 1032643, 1526503, 1246673].map((n) => ["week03", "week03-boot.js", `bytes: ${n},`]),
  ["week03", "week03-boot.js", "const DIMENSIONS"],
  ["week03", "corridor.js", "const GLOSSARY"],
  ["week03", "corridor.js", "function spotlight()"],
  ["week03", "corridor.js", "function peersOf("],
  ["week03", "corridor.js", "const ARC_STYLES"],
  ["week03", "corridor.js", "const EARTH_SIZES"],
  ["week03", "corridor.js", 'metrics("VEN", first)'],
  ["week03", "questions.js", 'r.o === "RUS" && r.d === "UKR"'],
];

const DECLARATION = /^(?:export\s+)?(?:default\s+)?(?:async\s+)?(?:function\*?|const|let|var|class)\s+([\w$]+)/;

/**
 * The top-level declaration whose text holds `index`: the last line at column
 * 0 that starts a statement, if that statement declares a name. Null when the
 * text sits in a top-level statement that declares nothing.
 */
function enclosing(src, index) {
  const end = src.indexOf("\n", index);
  const lines = src.slice(0, end < 0 ? src.length : end).split("\n");
  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i];
    if (!/^[^\s}\])/*]/.test(line)) continue;
    const m = line.match(DECLARATION);
    return m ? { name: m[1], exported: /^export\b/.test(line) || exportList(src).includes(m[1]) } : null;
  }
  return null;
}

const exportList = (src) =>
  [...src.matchAll(/^export\s*\{([^}]*)\}/gm)].flatMap((m) => m[1].split(",").map((s) => s.trim().split(/\s+as\s+/)[0]));

// Exported functions of `src` whose body uses `name`.
function exportedUsers(src, name) {
  const starts = [...src.matchAll(/^(?:export\s+)?(?:async\s+)?function\*?\s+([\w$]+)|^(?:export\s+)?(?:const|let|var|class)\s+([\w$]+)/gm)];
  const users = [];
  starts.forEach((m, i) => {
    const fn = m[1];
    if (!fn || !(/^export\b/.test(m[0]) || exportList(src).includes(fn))) return;
    const body = src.slice(m.index + m[0].length, starts[i + 1]?.index ?? src.length);
    if (new RegExp(`(?<![\\w$.])${name}(?![\\w$])`).test(body)) users.push(fn);
  });
  return users;
}

// Whether a file the page reaches imports `name` from `file` by name and uses it.
function importedAndUsed(modules, file, name) {
  return modules.some((other) => {
    if (other === file) return false;
    const imports = importsOf(other);
    const statements = imports.map((i) => i.text);
    const src = readFileSync(other, "utf8");
    return imports.some((i) => {
      if (i.file !== file || i.kind !== "static") return false;
      const braces = i.text.match(/\{([^}]*)\}/);
      if (!braces) return false;
      return braces[1].split(",").some((item) => {
        const [imported, local = imported] = item.trim().replace(/^type\s+/, "").split(/\s+as\s+/);
        return imported === name && usedOutsideImports(src, local, statements);
      });
    });
  });
}

test("the walker keeps every script each page's entry lists, in the entry's order", () => {
  let pages = 0;
  for (const page of PAGES) {
    if (!entryFile(page)) continue;
    pages++;
    const src = readFileSync(entryFile(page), "utf8");
    const listed = [...src.matchAll(/import\(\s*"\.\.\/([^"]+)"\s*\)/g)].map((m) => m[1]);
    const walked = pageScripts(page);
    assert.deepEqual(walked.slice(0, listed.length), listed, `${page}: the entry's scripts come first`);
  }
  assert.ok(pages > 0, "at least one page still has an entry");
});

test("the walker follows imports a page reaches only through its scripts", () => {
  assert.ok(pageScripts("week05").includes("week05-map.js"), "week05 reaches week05-map.js");
});

test("code the tests pin stays reachable from its page once it leaves the entry", () => {
  let active = 0;
  const problems = [];
  for (const [page, name, needle] of ANCHORS) {
    const modules = pageModules(page);
    const home = join(SCRIPTS, name);
    const file = [home, ...modules].find((f) => existsSync(f) && readFileSync(f, "utf8").includes(needle));
    if (!file) {
      problems.push(`${page}: "${needle}" is in no file the page reaches; update the anchor table`);
      continue;
    }
    if (entryFile(page) && entryReach(page).includes(file)) continue;
    active++;
    const src = readFileSync(file, "utf8");
    const decl = enclosing(src, src.indexOf(needle));
    if (!decl) {
      problems.push(`${page}: "${needle}" sits in top-level code of ${name}, not in a declaration a page can import`);
      continue;
    }
    if (decl.exported && importedAndUsed(modules, file, decl.name)) continue;
    if (exportedUsers(src, decl.name).some((fn) => importedAndUsed(modules, file, fn))) continue;
    problems.push(`${page}: ${decl.name} (holding "${needle}") is not exported and used by a file the page reaches`);
  }
  console.log(`# anchor checks active: ${active} of ${ANCHORS.length}`);
  assert.deepEqual(problems, []);
});