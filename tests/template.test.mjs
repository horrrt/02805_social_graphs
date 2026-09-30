// The post template (docs/weeks/_template/) stays a complete, copyable post:
// every part a post has, the six slots per section that slot() finds, and a
// noindex so the template itself is never published as a week.
import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const html = readFileSync(join(ROOT, "docs/weeks/_template/index.html"), "utf8");
const PARTS = ["asked", "did", "figure", "surprise", "checked", "limit"];

test("the template has every part of a post", () => {
  for (const id of ["top", "findings", "opening", "closing", "methods", "closing-ai"]) assert.match(html, new RegExp(`id="${id}"`), `#${id}`);
  assert.match(html, /<meta content="noindex" name="robots" \/>/);
  assert.match(html, /class="w5-slots card w4-card w5-card"/, "the standard card");
  assert.match(html, /class="w5-slots card w4-card w5-card w5-card-wide"/, "the wide card");
});

test("each template section has the six slots slot() finds", () => {
  const sections = [...html.matchAll(/<section class="step" data-owner="[^"]*" id="(\w+)">/g)].map((m) => m[1]).filter((id) => !["opening", "closing"].includes(id));
  assert.deepEqual(sections, ["first", "second"]);
  for (const s of sections) {
    for (const part of PARTS) {
      assert.match(html, new RegExp(`data-slot="${part}" id="${s}-${part}">\\s*<h3>[^<]+</h3>\\s*<div data-body>`), `#${s}-${part}`);
    }
  }
  for (const s of sections) assert.ok(html.includes(`href="#${s}"`), `the nav and strip link to #${s}`);
});

test("the template's script exists and every toy says so", () => {
  const src = html.match(/<script src="\.\.\/\.\.\/assets\/js\/([\w-]+\.js)\?v=\d+" type="module">/);
  assert.ok(src && existsSync(join(ROOT, "docs/assets/js", src[1])), "the template script is on disk");
  const js = readFileSync(join(ROOT, "docs/assets/js", src[1]), "utf8");
  for (const [, aria] of js.matchAll(/aria: "([^"]+)"/g)) assert.match(aria, /^Toy/, `a toy chart says so: ${aria}`);
});
