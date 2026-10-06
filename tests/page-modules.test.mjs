// Keeps tests/built-page.mjs pageScripts() honest while page code moves from
// src/scripts into components: the import-graph walk must still list every
// module a page's entry runs, and the source lines other tests read
// ("anchors") must stay live code. While a page's entry still imports the
// anchor's file the line runs as it always did. Once it does not, the
// declaration around the line has to be exported and used by another file
// the page reaches, so a test cannot keep passing on dead code.
import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { ROOT, entryGraph, entryScripts, importsOf, pageScripts, resolveSpec, uses, withoutImports } from "./built-page.mjs";

const SCRIPTS = join(ROOT, "src/scripts");
const read = (file) => readFileSync(join(SCRIPTS, file), "utf8");

const PAGES = readdirSync(join(SCRIPTS, "entries"))
  .filter((f) => f.endsWith(".js") && f !== "run.js")
  .map((f) => f.slice(0, -3));

// The lines other tests read, by page and file (src/scripts-relative).
const ANCHORS = [
  ["week04", "week04-cut.js", ["const ALIAS", "const SUB", "const METHOD"]],
  ["week04", "week04-staffing.js", ["SECTORS"]],
  ["week04", "week04-years.js", ["const oj = data.oct_jun.totals;"]],
  ["week04", "week04-pagerank.js", [
    "${claims.leaderTitle} leads from round ${claims.leaderStep}; the rest of the top ${n} settles by round ${claims.orderStep}.",
    "The grey lines stop crossing by round ${claims.orderStep}",
  ]],
  ["week05", "week05-weird.js", ['"chart-weird-scatter"', '"weird-table"', '"weird-passages"']],
  ["week05", "week05-map.js", ["n.name,"]],
  ["week03", "week03-boot.js", ["bytes:", "DIMENSIONS"]],
  ["week03", "corridor.js", ["GLOSSARY", "function spotlight()", "function peersOf(", "ARC_STYLES", "EARTH_SIZES", 'metrics("VEN", first)']],
  ["week03", "questions.js", ['r.o === "RUS" && r.d === "UKR"']],
];

// Every line holding the anchor: "bytes:" stands for each registry line.
function anchorLines(src, anchor) {
  const lines = src.split("\n");
  if (anchor === "bytes:") return lines.flatMap((line, i) => (/^\s+bytes: \d+,$/.test(line) ? [i] : []));
  const at = src.indexOf(anchor);
  return at < 0 ? [] : [src.slice(0, at).split("\n").length - 1];
}

// The top-level declaration a line sits in: the last line before it that
// starts in column 0 and is not a comment or a closing bracket. null when
// that line is a statement rather than a declaration.
function declarationAt(src, line) {
  const lines = src.split("\n");
  for (let i = line; i >= 0; i--) {
    const text = lines[i];
    if (!text || /^[\s})\]]/.test(text) || /^(\/\/|\/\*|\*)/.test(text)) continue;
    const m = text.match(/^(?:export\s+)?(?:default\s+)?(?:async\s+)?(?:function\*?|const|let|var|class)\s+([\w$]+)/);
    return m ? m[1] : null;
  }
  return null;
}

function exported(src, name) {
  const word = name.replace(/\$/g, "\\$");
  if (new RegExp(`^export\\s+(?:async\\s+)?(?:function\\*?|const|let|var|class)\\s+${word}\\b`, "m").test(src)) return true;
  return [...src.matchAll(/^export\s*\{([^}]*)\}/gm)].some(([, list]) =>
    list.split(",").some((item) => item.trim().split(/\s+as\s+/)[0].trim() === name),
  );
}

// Reached files that import `name` from `file` by name and use it outside the import.
function importersOf(page, file, name) {
  const target = join(SCRIPTS, file);
  return pageScripts(page).filter((other) => {
    if (other === file) return false;
    const path = join(SCRIPTS, other);
    const src = readFileSync(path, "utf8");
    const rest = withoutImports(src);
    return importsOf(src).some(
      (imp) =>
        imp.kind === "static" &&
        resolveSpec(path, imp.spec) === target &&
        imp.names.some((n) => (n.imported === name ? uses(rest, n.local) : n.imported === "*" && rest.includes(`${n.local}.${name}`))),
    );
  });
}

// Exported functions of a file whose body names `name`.
function exportedUsers(src, name) {
  const word = new RegExp(`(?<![\\w$.])${name.replace(/\$/g, "\\$")}(?![\\w$])`);
  const isFunction = (fn) => new RegExp(`^(?:export\\s+)?(?:async\\s+)?function\\*?\\s+${fn.replace(/\$/g, "\\$")}\\b`, "m").test(src);
  const users = new Set();
  src.split("\n").forEach((text, i) => {
    if (!word.test(text)) return;
    const owner = declarationAt(src, i);
    if (owner && owner !== name && isFunction(owner) && exported(src, owner)) users.add(owner);
  });
  return [...users];
}

test("pageScripts lists every module each page's entry runs, in the entry's order", () => {
  for (const page of PAGES) {
    const entry = entryScripts(page);
    assert.ok(entry.length > 0, `${page}: the entry imports at least one script`);
    assert.deepEqual(pageScripts(page).slice(0, entry.length), entry, `${page}: the walk starts with the entry's modules`);
    for (const name of entry) assert.ok(existsSync(join(SCRIPTS, name)), `${page}: ${name} exists`);
  }
});

test("the week 5 walk reaches week05-map.js through the sections that import it", () => {
  assert.ok(!entryScripts("week05").includes("week05-map.js"), "the entry does not import the map itself");
  assert.ok(pageScripts("week05").includes("week05-map.js"), "week05-map.js is reached");
});

test("every anchor other tests read stays in live code", () => {
  let active = 0;
  let total = 0;
  const problems = [];
  for (const [page, file, anchors] of ANCHORS) {
    assert.ok(existsSync(join(SCRIPTS, file)), `${file} exists`);
    const src = read(file);
    const live = entryGraph(page).includes(file);
    for (const anchor of anchors) {
      const lines = anchorLines(src, anchor);
      assert.ok(lines.length > 0, `${file} still holds ${anchor}`);
      for (const line of lines) {
        total += 1;
        if (live) continue;
        active += 1;
        const name = declarationAt(src, line);
        const where = `${file}:${line + 1} (${anchor})`;
        if (!name) {
          problems.push(`${where} sits in a top-level statement, not a declaration`);
          continue;
        }
        if (!exported(src, name)) {
          problems.push(`${where}: ${name} is not exported`);
          continue;
        }
        if (importersOf(page, file, name).length) continue;
        const via = exportedUsers(src, name).filter((fn) => importersOf(page, file, fn).length);
        if (!via.length) problems.push(`${where}: no file the ${page} page reaches imports and uses ${name}`);
      }
    }
  }
  console.log(`anchor liveness: ${active} of ${total} checks active`);
  assert.deepEqual(problems, []);
});
