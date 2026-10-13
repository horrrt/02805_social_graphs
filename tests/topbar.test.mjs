// Every page opens with the site's top bar (PostTopbar): the brand on the
// left, the site nav (Home, Posts, About) on the right, and no in-page
// section links. It is the page's only header: no second logo or site links
// under it. Pages are every page.tsx under src/app, read from out/, plus
// out/404.html, which GitHub Pages serves for any unknown path.
import test from "node:test";
import assert from "node:assert/strict";
import { join, relative, sep } from "node:path";
import { liveWeeks } from "../src/scripts/weeks.js";
import { builtPage, codeFiles, ROOT } from "./built-page.mjs";

const BASE = "/02805_social_graphs/";
// The pages the site nav lists as posts (src/components/site/posts.ts).
const POSTS_HREFS = [...liveWeeks().map((w) => w.cabinet.href), "weeks/week06/essentials/"];

// "src/app/(week04)/weeks/week04/page.tsx" -> "weeks/week04/"; route groups drop out.
const routes = codeFiles(join(ROOT, "src/app"), /^page\.tsx$/).map((file) =>
  relative(join(ROOT, "src/app"), file)
    .split(sep)
    .slice(0, -1)
    .filter((part) => !/^\(.*\)$/.test(part))
    .map((part) => decodeURIComponent(part) + "/")
    .join(""),
);

// The bar's markup on a built page, with what sits around it.
function bar(html) {
  const start = html.indexOf('<div class="topbar">');
  const main = html.search(/<main[\s>]/);
  const nav = html.indexOf('<nav class="site-nav" aria-label="Site">', start);
  const navEnd = html.indexOf("</nav>", nav);
  return { start, main, nav, html: html.slice(start, navEnd + "</nav></div></div>".length), after: html.slice(navEnd, navEnd + "</nav></div></div>".length) };
}

// Pages and the URL each is served at.
const PAGES = [...routes.map((route) => [route, `out/${route}index.html`]), ["404", "out/404.html"]];
const served = (route) => `https://example.org${BASE}${route === "404" ? "missing/page/" : route}`;
// A link's target as a path from the site's root ("" is the root itself).
const target = (href, route) => new URL(href, served(route)).pathname.slice(BASE.length);

test("the routes cover every kind of page", () => {
  for (const route of ["", "weeks/week01/", "weeks/week02/", "weeks/week04/", "weeks/week06/essentials/", "play/", "play/cold-read/", "play/cold-read/round-3/", "styleguide/kit/states/", "mockups/", "prototypes/screen-test/"])
    assert.ok(routes.includes(route), `no page.tsx found for /${route}`);
});

for (const [route, path] of PAGES) {
  test(`/${route === "404" ? "404.html" : route} opens with the top bar: brand left, site nav right`, () => {
    const html = builtPage(path);
    assert.equal(html.split('<div class="topbar">').length - 1, 1, "one top bar");
    const b = bar(html);
    assert.ok(b.start >= 0 && b.nav > b.start, "the site nav sits in the top bar");
    assert.ok(b.main === -1 || b.start < b.main, "the bar comes before <main>");
    const brand = b.html.match(/^<div class="topbar"><div class="shell"><a class="brand" href="([^"]*)">/);
    assert.ok(brand, "the brand comes first");
    assert.equal(target(brand[1], route), "", "the brand links to the site's root");
    assert.equal(b.after, "</nav></div></div>", "the site nav is the bar's last part");
    const home = b.html.match(/<a href="([^"]*)"[^>]*>Home<\/a>/);
    assert.equal(target(home[1], route), "", "Home links to the site's root");
    assert.doesNotMatch(b.html, /class="topnav"|aria-label="Sections of this/, "no section links in the bar");
    // Only the site nav's own links; a page's tools (Cold Read's Campaign) mark their own.
    const current = [...b.html.slice(b.nav - b.start).matchAll(/<a href="([^"]*)" aria-current="page">/g)].map((m) => target(m[1], route));
    const own = route === "" ? [""] : POSTS_HREFS.includes(route) ? [route] : [];
    assert.deepEqual(current, own, "the nav marks this page current when it is home or a post");
  });
}

// The page without its <main> and <footer>: what is left is the header, so a
// second header's logo or site links show up here. Links back to the posts
// inside the story ("Back to weekly posts") and in the footer stay out of it.
const chrome = (html) => html.replace(/<main[\s>][\s\S]*?<\/main>/g, "").replace(/<footer[\s>][\s\S]*?<\/footer>/g, "");
const links = (html, route) => [...html.matchAll(/<a [^>]*href="([^"]*)"[^>]*>/g)].map((m) => {
  const url = new URL(m[1].replace(/&amp;/g, "&"), served(route));
  return url.pathname.slice(BASE.length) + url.hash;
});

for (const [route, path] of PAGES) {
  test(`/${route === "404" ? "404.html" : route} has one header: one logo, one link home besides Home, one to the posts`, () => {
    const html = builtPage(path);
    const logos = html.match(/<a [^>]*(class="[^"]*\b(brand|[a-z-]*wordmark)\b[^"]*"|aria-label="[^"]*\bhome")[^>]*>/gi) ?? [];
    assert.equal(logos.length, 1, "one brand or logo link on the page");
    const head = links(chrome(html), route);
    assert.equal(head.filter((href) => href === "").length, 2, "the brand and Home are the header's only links to the site's root");
    assert.equal(head.filter((href) => href === "#weeks").length, 1, "Posts is the header's only link to the list of posts");
  });
}

for (const week of ["week01", "week02"]) {
  test(`/weeks/${week}/ has no data link or logbook in the bar`, () => {
    const html = builtPage(`out/weeks/${week}/index.html`);
    assert.doesNotMatch(bar(html).html, /topbar-tools/, "the bar has no page tools");
    assert.doesNotMatch(html, />The data<\/a>|id="open-logbook"|<dialog id="logbook"/, "no data link, LOGBOOK button or logbook dialog");
  });
}
