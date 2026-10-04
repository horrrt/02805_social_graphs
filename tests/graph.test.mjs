// The network views (src/scripts/graph.js, and src/kit/NetworkView.tsx with
// src/kit/network/ once they exist): colours only from post.css
// tokens, sizes only from the type scale, and demo data a view can draw.
import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (name) => readFileSync(join(ROOT, name), "utf8");
const js = read("src/scripts/graph.js");
const css = read("src/styles/post.css");
const data = JSON.parse(read("public/styleguide/data/graphs.json"));

// The React network view, once it exists, follows the same three rules.
const tree = (dir) =>
  existsSync(join(ROOT, dir))
    ? readdirSync(join(ROOT, dir), { withFileTypes: true }).flatMap((e) =>
        e.isDirectory() ? tree(join(dir, e.name)) : [join(dir, e.name)],
      )
    : [];
const views = () => [
  ["src/scripts/graph.js", js],
  ...["src/kit/NetworkView.tsx", ...tree("src/kit/network")]
    .filter((f) => existsSync(join(ROOT, f)) && /\.(js|mjs|ts|tsx)$/.test(f))
    .map((f) => [f, read(f)]),
];

test("graph.js takes colours from classes and sizes from the type scale", () => {
  for (const [file, src] of views()) {
    assert.doesNotMatch(src, /#[0-9a-fA-F]{3,8}\b/, `no hex colours in ${file}`);
    assert.doesNotMatch(src, /"font-size":\s*\d/, `${file}: font sizes come from fs()`);
    assert.doesNotMatch(src, /\binnerHTML\b/, `${file}: labels are set as text`);
  }
});

test("both themes define every group colour and its label ink", () => {
  const rule = (sel) => css.match(new RegExp(sel.replace(/[.]/g, "\\.") + "\\s*\\{([^}]*)\\}"))?.[1] ?? "";
  for (const sel of [".corridor .gv", ".corridor .gv.gv-dark"]) {
    const body = rule(sel);
    for (const name of [...Array(8).keys()].map((i) => `--group-${i}`).concat("--group-none"))
      assert.match(body, new RegExp(`${name}:\\s*#[0-9a-f]{6};`), `${sel} sets ${name}`);
    for (const name of [...Array(8).keys()].map((i) => `--on-group-${i}`).concat("--on-group-none"))
      assert.match(body, new RegExp(`${name}:\\s*#[0-9a-f]{6};`), `${sel} sets ${name}`);
  }
  for (let i = 0; i < 8; i++) assert.ok(css.includes(`.corridor .gv .g${i} { fill: var(--group-${i}); }`), `group ${i} has a fill rule`);
});

test("the demo networks are drawable", () => {
  for (const key of ["karate", "marvel", "pair", "overlap"]) {
    const d = data[key];
    const ids = new Set(d.nodes.map((n) => n.id));
    assert.equal(ids.size, d.nodes.length, `${key}: node ids are unique`);
    for (const n of d.nodes) {
      assert.ok(n.x >= 0 && n.x <= 1, `${key} ${n.id}: x in [0, 1]`);
      assert.ok(n.y >= 0 && n.y <= d.ratio + 1e-9, `${key} ${n.id}: y in [0, ratio]`);
      const gs = n.groups ?? (n.group === null || n.group === undefined ? [] : [n.group]);
      for (const g of gs) assert.ok(Number.isInteger(g) && g >= 0 && g < d.groups.length && g < 8, `${key} ${n.id}: group ${g}`);
    }
    for (const l of d.links) assert.ok(ids.has(l.source) && ids.has(l.target), `${key}: link ${l.source}-${l.target}`);
  }
  assert.equal(data.karate.nodes.length, 34);
  assert.equal(data.karate.links.length, 78);
  assert.equal(data.marvel.nodes.length, 303);
  assert.equal(data.marvel.hubs.length, 8);
  assert.equal(data.overlap.toy, true, "the overlap example is labelled a toy");
  const h = data.pair.highlight;
  assert.ok(data.pair.links.some((l) => l.source === h.source && l.target === h.target && l.weight === h.weight));
});
