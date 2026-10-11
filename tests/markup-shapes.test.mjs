// Pins the markup shapes week04-ui.js builds and the React components will
// render instead: the glossary term (a button described by its tooltip) and
// the drawers (a details whose summary is followed by its body, inside a
// drawer row, an inline row or another drawer's body). Week 4 and Week 5 use
// both, so a component that renders either shape differently fails here.
import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { ROOT, builtPage } from "./built-page.mjs";
import { blockAt } from "./week04-html.mjs";

const PAGES = {
  week04: "out/weeks/week04/index.html",
  week05: "out/weeks/week05/index.html",
  template: "out/weeks/_template/index.html",
};

const TERM =
  /^<span class="w4-term"><button aria-describedby="([^"]+)" type="button">[^<]+<\/button><span class="w4-pop" id="\1" role="tooltip">[\s\S]*?<\/span><\/span>$/;
const squash = (html) => html.replace(/\s+/g, " ").replace(/> </g, "><").trim();

function* starts(html, opening) {
  for (let at = html.indexOf(opening); at >= 0; at = html.indexOf(opening, at + 1)) yield at;
}

// The class of the nearest <div> that is still open at `at`.
function parentDivClass(html, at) {
  const tags = [...html.slice(0, at).matchAll(/<(\/?)div\b([^>]*)>/g)];
  let depth = 0;
  for (let i = tags.length - 1; i >= 0; i--) {
    if (tags[i][1]) depth++;
    else if (depth === 0) return tags[i][2].match(/\bclass="([^"]*)"/)?.[1] ?? "";
    else depth--;
  }
  return null;
}

test("every glossary term is a button described by its own tooltip", () => {
  for (const page of ["week04", "week05"]) {
    const html = builtPage(PAGES[page]);
    const ids = [];
    for (const at of starts(html, '<span class="w4-term"')) {
      const term = squash(blockAt(html, at));
      const m = term.match(TERM);
      assert.ok(m, `${page}: a term has another shape: ${term.slice(0, 200)}`);
      ids.push(m[1]);
    }
    assert.equal(new Set(ids).size, ids.length, `${page}: term ids are unique`);
    if (page === "week04") assert.ok(ids.length > 0, "week04 has glossary terms");
  }
});

test("every drawer opens on its summary and sits in a drawer row or one inline place", () => {
  for (const [page, file] of Object.entries(PAGES)) {
    const html = builtPage(file);
    const counts = { "rx-drawers rx-foot": 0, "rx-drawers rx-inline": 0, "rx-drawer-body": 0 };
    for (const at of starts(html, '<details class="rx-drawer"')) {
      const drawer = blockAt(html, at);
      assert.ok(drawer.startsWith('<details class="rx-drawer"><summary>'), `${page}: ${drawer.slice(0, 120)}`);
      const end = drawer.indexOf("</summary>") + "</summary>".length;
      assert.ok(drawer.startsWith('<div class="rx-drawer-body"', end), `${page}: the summary is followed by the body: ${drawer.slice(0, 160)}`);
      const parent = parentDivClass(html, at);
      assert.ok(parent in counts, `${page}: a drawer sits in div.${parent}`);
      counts[parent] += 1;
    }
    assert.equal(
      (html.match(/<details\b[^>]*\brx-drawer\b/g) ?? []).length,
      Object.values(counts).reduce((a, b) => a + b, 0),
      `${page}: every rx-drawer opens with <details class="rx-drawer">`,
    );
    assert.ok(counts["rx-drawers rx-inline"] <= 1, `${page}: at most one drawer in an inline row`);
    assert.ok(counts["rx-drawer-body"] <= 1, `${page}: at most one drawer inside another drawer`);
    console.log(`${page}: drawers under rx-foot ${counts["rx-drawers rx-foot"]}, rx-inline ${counts["rx-drawers rx-inline"]}, a drawer body ${counts["rx-drawer-body"]}`);
  }
});

// The class strings both builders of these shapes must write.
const UI_STRINGS = [
  'term.className = "w4-term"',
  'button.type = "button"',
  'setAttribute("aria-describedby", id)',
  'pop.className = "w4-pop"',
  'setAttribute("role", "tooltip")',
  'details.className = "rx-drawer"',
  'inner.className = "rx-drawer-body"',
  'row.className = "rx-drawers rx-foot"',
];

test("week04-ui.js builds terms and drawers with these classes", () => {
  const ui = readFileSync(join(ROOT, "src/scripts/week04-ui.js"), "utf8");
  for (const s of UI_STRINGS) assert.ok(ui.includes(s), `week04-ui.js keeps ${s}`);
});

test("the Term, Drawer and Drawers components render the same classes", () => {
  const component = (name) => {
    const path = join(ROOT, "src/components/post", name);
    assert.ok(existsSync(path), `src/components/post/${name} exists`);
    return readFileSync(path, "utf8");
  };
  const term = component("Term.tsx");
  for (const s of ['"w4-term"', '"button"', "aria-describedby", '"w4-pop"', '"tooltip"']) assert.ok(term.includes(s), `Term.tsx has ${s}`);
  const drawer = component("Drawer.tsx");
  for (const s of ['"rx-drawer"', '"rx-drawer-body"']) assert.ok(drawer.includes(s), `Drawer.tsx has ${s}`);
  const drawers = component("Drawers.tsx");
  for (const s of ['"rx-drawers rx-foot"', "rx-inline"]) assert.ok(drawers.includes(s), `Drawers.tsx has ${s}`);
});
