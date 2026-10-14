// Every post and the home page close with the same footer (SiteFooter): one
// footer.foot whose row reads "02805 Social graphs and interactions · Fall
// 2026", then the Credits disclosure, then the GitHub link. Each page's data
// credits, and Week 6's AI-use note, sit inside that disclosure.
// tests/credits.test.mjs checks the wording each licence asks for.
import test from "node:test";
import assert from "node:assert/strict";
import { builtPage } from "./built-page.mjs";

const COURSE = "02805 Social graphs and interactions · Fall 2026";
const GITHUB = 'href="https://github.com/horrrt/02805_social_graphs"';
const BY_SA = 'href="https://creativecommons.org/licenses/by-sa/4.0/"';
const BY = 'href="https://creativecommons.org/licenses/by/4.0/"';
const CC0 = 'href="https://creativecommons.org/publicdomain/zero/1.0/"';

// Each page and the credits its Credits disclosure must hold.
const PAGES = {
  "": ["English Wikipedia", BY_SA],
  "weeks/week01/": ["English Wikipedia", BY_SA],
  "weeks/week02/": ["English Wikipedia", BY_SA],
  "weeks/week03/": [
    "UNHCR Refugee Population Statistics Database",
    "World Bank, World Development Indicators",
    "Eurostat, asylum applicants by citizenship",
    "Blavatnik School of Government, University of Oxford",
    'href="https://opendatacommons.org/licenses/odbl/1-0/"',
    "offered under the same licence",
    'href="https://visibleearth.nasa.gov/collection/1484/blue-marble"',
    BY,
  ],
  "weeks/week04/": [
    "This page includes information from the O*NET® 31.0 Database",
    "USDOL/ETA has not approved, endorsed, or tested these modifications.",
    BY,
    "Registrations per lottery draw: USCIS",
  ],
  "weeks/week05/": ["English Wikipedia", BY_SA, "26 August 2026"],
  "weeks/week06/": [
    "English Wikipedia",
    BY_SA,
    'href="https://www.wikidata.org/wiki/Property:P21"',
    CC0,
    'href="https://opendatacommons.org/licenses/pddl/1-0/"',
    "Every number comes from analysis/week06_essentials.py. An AI coding assistant (Claude) wrote the analysis",
  ],
  "weeks/week06/alternative/": ["English Wikipedia", BY_SA, 'href="https://www.wikidata.org/wiki/Property:P21"', CC0],
  "weeks/_template/": ["Credit each data source here"],
};

for (const [route, credits] of Object.entries(PAGES)) {
  test(`/${route} closes with the site footer and its credits inside Credits`, () => {
    const html = builtPage(`out/${route}index.html`);
    assert.equal(html.split('<footer class="foot">').length - 1, 1, "one footer.foot");
    assert.equal(html.split("<footer").length - 1, 1, "no other footer");
    const start = html.indexOf('<footer class="foot">');
    const footer = html.slice(start, html.indexOf("</footer>", start)).replace(/\s+/g, " ");
    assert.ok(
      footer.startsWith(`<footer class="foot"><div class="shell"><span>${COURSE}</span><details class="foot-credits"><summary>Credits</summary>`),
      "the row opens with the course line, then Credits",
    );
    const open = footer.indexOf('<details class="foot-credits">');
    const close = footer.indexOf("</details>", open);
    const disclosure = footer.slice(open, close);
    assert.match(footer.slice(close), new RegExp(`^</details><a aria-label="Source code on GitHub" class="home-github" ${GITHUB}>`), "the GitHub link closes the row");
    assert.doesNotMatch(disclosure, /<details[^>]*\bopen\b/, "Credits ships closed");
    for (const credit of credits) assert.ok(disclosure.includes(credit), `Credits should include ${credit}`);
    assert.doesNotMatch(footer, /DTU 02805/, "the page's own name span is gone");
  });
}
