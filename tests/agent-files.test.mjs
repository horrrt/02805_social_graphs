// The files scripts/agent-files.mjs writes for AI agents and crawlers after
// the build, and the tags that point the pages at them.
import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { ROOT, builtPage } from "./built-page.mjs";
import { liveWeeks } from "../src/scripts/weeks.js";

const SITE_URL = "https://horrrt.github.io/02805_social_graphs/";
const out = (path) => join(ROOT, "out", path);
const read = (path) => readFileSync(out(path), "utf8");
const pad = (n) => String(n).padStart(2, "0");
const PAGES = ["", ...liveWeeks().map((w) => `weeks/week${pad(w.n)}/`)];
const noindex = (path) => /<meta name="robots" content="[^"]*noindex/.test(builtPage(`out/${path}index.html`));

test("every live page links its canonical URL and its Markdown copy", () => {
  for (const path of PAGES) {
    const html = builtPage(`out/${path}index.html`);
    assert.ok(html.includes(`<link rel="canonical" href="${SITE_URL + path}"`), `${path || "lobby"}: canonical`);
    assert.ok(
      html.includes(`<link rel="alternate" type="text/markdown" href="${SITE_URL + path}index.md"`),
      `${path || "lobby"}: Markdown alternate`,
    );
    assert.ok(html.includes('<script type="application/ld+json">'), `${path || "lobby"}: JSON-LD`);
  }
});

test("every live page has a Markdown copy with its text and footer credits", () => {
  for (const path of PAGES) {
    const md = read(`${path}index.md`);
    assert.match(md, new RegExp(`^---\\ntitle: .+\\ndescription: .+\\nurl: ${SITE_URL + path}\\n---\\n`), `${path}: front matter`);
    assert.match(md, /^# /m, `${path}: the page's own heading`);
    assert.ok(md.includes("creativecommons.org") || path === "weeks/week04/", `${path}: footer credits survive`);
    assert.doesNotMatch(md, /<script|self\.__next_f|\$RC/, `${path}: no Next payload`);
  }
});

test("llms.txt follows llmstxt.org and lists every live post", () => {
  const llms = read("llms.txt");
  assert.match(llms, /^# Log–Log Legends\n\n> .+\n/, "an H1, then a blockquote summary");
  for (const section of ["## Posts", "## Data", "## Optional"]) assert.ok(llms.includes(section), section);
  for (const path of PAGES) assert.ok(llms.includes(`(${SITE_URL + path}index.md)`), `llms.txt lists ${path || "the lobby"}`);
  for (const [, url] of llms.matchAll(/\]\((https:[^)]+)\)/g)) {
    if (!url.startsWith(SITE_URL)) continue;
    assert.ok(existsSync(out(url.slice(SITE_URL.length))), `${url} exists in out/`);
  }
  const full = read("llms-full.txt");
  for (const path of PAGES) assert.ok(full.includes(`url: ${SITE_URL + path}\n`), `llms-full.txt holds ${path || "the lobby"}`);
});

test("sitemap.xml lists the indexable pages, never a noindex draft", () => {
  const sitemap = read("sitemap.xml");
  for (const path of PAGES) {
    const listed = sitemap.includes(`<loc>${SITE_URL + path}</loc>`);
    assert.equal(listed, !noindex(path), `${path || "lobby"} ${noindex(path) ? "is noindex and must not be" : "must be"} listed`);
  }
  assert.equal(sitemap.match(/<url>/g).length, sitemap.match(/<lastmod>\d{4}-\d\d-\d\d<\/lastmod>/g).length, "every URL has a lastmod");
});

test("every canvas chart on a live page has an accessible name", () => {
  for (const path of PAGES) {
    for (const [tag] of builtPage(`out/${path}index.html`).matchAll(/<canvas\b[^>]*>/g)) {
      assert.match(tag, /aria-label="[^"]+"|aria-labelledby=|aria-hidden="true"/, `${path}: ${tag}`);
    }
  }
});
