// Pins the exact markup of the glossary term and the drawer, which the
// stylesheets, the week 4 prose helpers and the parity tools all read. Today
// week04-ui.js builds both; the React Term, Drawer and Drawers components must
// render the same shapes. Reads the built pages and the source as text.
import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { ROOT, builtPage } from "./built-page.mjs";
import { blockAt } from "./week04-html.mjs";

const PAGES = { week04: "out/weeks/week04/index.html", week05: "out/weeks/week05/index.html", template: "out/weeks/_template/index.html" };
const TERM = /^<span class="w4-term"><button aria-describedby="([^"]+)" type="button">[^<]+<\/button><span class="w4-pop" id="\1" role="tooltip">[\s\S]*?<\/span><\/span>$/;
const PARENTS = ["rx-drawers rx-foot", "rx-drawers rx-inline", "rx-drawer-body"];

const starts = (html, needle) => {
  const at = [];
  for (let i = html.indexOf(needle); i >= 0; i = html.indexOf(needle, i + 1)) at.push(i);
  return at;
};

test("every glossary term on the week 4 and week 5 pages has the term's markup", () => {
  for (const page of ["week04", "week05"]) {
    const html = builtPage(PAGES[page]);
    const ids = [];
    for (const at of starts(html, '<span class="w4-term"')) {
      const block = blockAt(html, at).replace(/\s+/g, " ").replace(/> </g, "><");
      const m = block.match(TERM);
      assert.ok(m, `${page}: term markup changed: ${block.slice(0, 160)}`);
      ids.push(m[1]);
    }
    assert.equal(new Set(ids).size, ids.length, `${page}: term ids are unique`);
  }
});

// The class of the innermost <div> open at each drawer, in page order.
function drawerParents(html) {
  const stack = [];
  const parents = [];
  for (const m of html.matchAll(/<(\/?)div\b([^>]*)>|<details class="rx-drawer"/g)) {
    if (m[0].startsWith("<details")) parents.push(stack.at(-1) ?? null);
    else if (m[1]) stack.pop();
    else stack.push(m[2].match(/\bclass="([^"]*)"/)?.[1] ?? "");
  }
  return parents;
}

test("every drawer has the drawer's markup and sits in a drawer row", () => {
  const counts = {};
  for (const [page, path] of Object.entries(PAGES)) {
    const html = builtPage(path);
    for (const at of starts(html, '<details class="rx-drawer')) {
      const block = blockAt(html, at);
      assert.ok(block.startsWith('<details class="rx-drawer"><summary>'), `${page}: a drawer opens <details class="rx-drawer"><summary>: ${block.slice(0, 80)}`);
      const after = block.slice(block.indexOf("</summary>") + "</summary>".length);
      assert.ok(after.startsWith('<div class="rx-drawer-body"'), `${page}: a drawer's body follows its summary: ${after.slice(0, 80)}`);
    }
    const parents = drawerParents(html);
    for (const parent of parents) assert.ok(PARENTS.includes(parent), `${page}: a drawer sits in a div of class "${parent}"`);
    counts[page] = PARENTS.map((p) => parents.filter((x) => x === p).length);
    const [, inline, body] = counts[page];
    assert.ok(inline <= 1, `${page}: at most one inline drawer row`);
    assert.ok(body <= 1, `${page}: at most one drawer nested in a drawer`);
  }
  console.log(`# drawers (foot/inline/body): ${Object.entries(counts).map(([p, c]) => `${p} ${c.join("/")}`).join(", ")}`);
});

test("week04-ui.js builds the term and the drawer with those classes", () => {
  const ui = readFileSync(join(ROOT, "src/scripts/week04-ui.js"), "utf8");
  for (const line of [
    'term.className = "w4-term"',
    'button.type = "button"',
    'setAttribute("aria-describedby", id)',
    'pop.className = "w4-pop"',
    'setAttribute("role", "tooltip")',
    'details.className = "rx-drawer"',
    'inner.className = "rx-drawer-body"',
    'row.className = "rx-drawers rx-foot"',
  ])
    assert.ok(ui.includes(line), `week04-ui.js: ${line}`);
});

test("the React Term, Drawer and Drawers render the same classes", () => {
  const read = (name) => {
    const file = join(ROOT, "src/components/post", name);
    return existsSync(file) ? readFileSync(file, "utf8") : null;
  };
  const term = read("Term.tsx");
  const drawer = read("Drawer.tsx");
  const drawers = read("Drawers.tsx");
  if (term) for (const s of ['"w4-term"', '"button"', "aria-describedby", '"w4-pop"', '"tooltip"']) assert.ok(term.includes(s), `Term.tsx: ${s}`);
  if (drawer) for (const s of ['"rx-drawer"', '"rx-drawer-body"']) assert.ok(drawer.includes(s), `Drawer.tsx: ${s}`);
  if (drawers) for (const s of ["rx-drawers", "rx-foot", "rx-inline"]) assert.ok(drawers.includes(s), `Drawers.tsx: ${s}`);
});
