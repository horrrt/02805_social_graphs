// One stylesheet for every post: type.css (type tokens), corridor.css (the site's
// base and colours), then post.css (everything posts share). A post adds its
// rules to post.css; only a figure no other post will use may keep a sheet of
// its own, linked after post.css. Weeks 1 and 2 keep the arcade sheets on purpose.
import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (name) => readFileSync(join(ROOT, name), "utf8");
const sheets = (html) => [...html.matchAll(/<link href="[^"]*assets\/css\/([\w-]+\.css)(?:\?[^"]*)?" rel="stylesheet"/g)].map((m) => m[1]);

// Every page built from post.css, and the extra sheets each may add after it.
const POSTS = {
  "docs/weeks/week04/index.html": /^week04-[\w-]+\.css$/,
  "docs/weeks/week05/index.html": null,
  "docs/styleguide/kit.html": null,
  "docs/weeks/_template/index.html": null,
};

test("each post loads type.css, corridor.css and post.css first, in that order", () => {
  for (const [page, extra] of Object.entries(POSTS)) {
    const list = sheets(read(page));
    assert.deepEqual(list.slice(0, 3), ["type.css", "corridor.css", "post.css"], page);
    for (const name of list.slice(3)) {
      assert.ok(extra && extra.test(name), `${page} links ${name}; put shared rules in post.css`);
      assert.ok(existsSync(join(ROOT, "docs/assets/css", name)), `${page} links a missing ${name}`);
    }
  }
});

test("posts carry no inline style blocks", () => {
  for (const page of Object.keys(POSTS)) {
    assert.doesNotMatch(read(page), /<style[\s>]/, `${page}: move the rules into post.css`);
  }
});

test("the sheets merged into post.css stay gone", () => {
  for (const name of ["week04.css", "week04-rx.css", "kit.css", "week05.css"]) {
    assert.ok(!existsSync(join(ROOT, "docs/assets/css", name)), `${name} is back; its rules live in post.css`);
    for (const page of Object.keys(POSTS)) assert.ok(!sheets(read(page)).includes(name), `${page} links ${name}`);
  }
});
