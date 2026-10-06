// One stylesheet for every post: type.css (type tokens), corridor.css (the site's
// base and colours), then post.css (everything posts share). A post adds its
// rules to post.css; only a figure no other post will use may keep a sheet of
// its own, linked after post.css. Weeks 1 and 2 keep the arcade sheets on purpose.
import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { builtPage, pageStyles } from "./built-page.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
// Each page's layout imports its sheets from src/styles (pageStyles); the
// built page is checked for inline style blocks.
const sheets = (page) => pageStyles(page);
const html = (page) => builtPage(`out/${PAGE_PATHS[page]}index.html`);
const PAGE_PATHS = { week04: "weeks/week04/", week05: "weeks/week05/", week06: "weeks/week06/", kit: "styleguide/kit/", template: "weeks/_template/" };

// Every page built from post.css, and the extra sheets each may add after it.
const POSTS = {
  week04: /^week04-[\w-]+\.css$/,
  week05: null,
  week06: null,
  kit: null,
  template: null,
};

test("each post loads type.css, corridor.css and post.css first, in that order", () => {
  for (const [page, extra] of Object.entries(POSTS)) {
    const list = sheets(page);
    assert.deepEqual(list.slice(0, 3), ["type.css", "corridor.css", "post.css"], page);
    for (const name of list.slice(3)) {
      assert.ok(extra && extra.test(name), `${page} links ${name}; put shared rules in post.css`);
      assert.ok(existsSync(join(ROOT, "src/styles", name)), `${page} links a missing ${name}`);
    }
  }
});

test("posts carry no inline style blocks", () => {
  for (const page of Object.keys(POSTS)) {
    assert.doesNotMatch(html(page), /<style[\s>]/, `${page}: move the rules into post.css`);
  }
});

test("the sheets merged into post.css stay gone", () => {
  for (const name of ["week04.css", "week04-rx.css", "kit.css", "week05.css"]) {
    assert.ok(!existsSync(join(ROOT, "src/styles", name)), `${name} is back; its rules live in post.css`);
    for (const page of Object.keys(POSTS)) assert.ok(!sheets(page).includes(name), `${page} links ${name}`);
  }
});
