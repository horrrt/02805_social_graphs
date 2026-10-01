// The post template (src/app/(template)/, served at weeks/_template/) stays a complete, copyable post:
// every part a post has, Week 4's card with the ids slot() finds, and a
// noindex so the template itself is never published as a week.
import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { builtPage, pageScripts } from "./built-page.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const html = builtPage("out/weeks/_template/index.html");
const PARTS = ["asked", "did", "figure", "surprise", "checked", "limit"];

test("the template has every part of a post", () => {
  for (const id of ["top", "findings", "opening", "closing", "methods", "closing-ai"]) assert.match(html, new RegExp(`id="${id}"`), `#${id}`);
  assert.match(html, /<meta name="robots" content="noindex"\/>/);
  assert.match(html, /class="card w4-card w5-card"/, "Week 4's card");
  assert.doesNotMatch(html, /class="w5-slot"/, "no labelled slot blocks");
});

test("each template section keeps the six parts' ids slot() finds", () => {
  const sections = [...html.matchAll(/<section class="step" data-owner="[^"]*" id="(\w+)">/g)].map((m) => m[1]).filter((id) => !["opening", "closing"].includes(id));
  assert.deepEqual(sections, ["first", "second"]);
  for (const s of sections) {
    for (const part of PARTS) {
      assert.ok(html.includes(`id="${s}-${part}"`), `#${s}-${part}`);
    }
  }
  for (const s of sections) assert.ok(html.includes(`href="#${s}"`), `the nav and strip link to #${s}`);
});

test("the template's script exists and every toy says so", () => {
  const [src] = pageScripts("template");
  assert.ok(src && existsSync(join(ROOT, "src/scripts", src)), "the template script is on disk");
  const js = readFileSync(join(ROOT, "src/scripts", src), "utf8");
  for (const [, aria] of js.matchAll(/aria: "([^"]+)"/g)) assert.match(aria, /^Toy/, `a toy chart says so: ${aria}`);
});
