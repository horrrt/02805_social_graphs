// Every post typesets its formulas with KaTeX (src/lib/Tex.tsx) and underlines
// the first use of each new term (src/components/post/Term.tsx), as Week 6 does.
// The built HTML holds each formula as LaTeX, typeset after load, and each
// term's pop-up beside its word; the page's one TermLayer opens a term on click.
// This checks what the server renders: the terms each post marks, wired by
// aria-describedby to a pop-up; the number of formulas; and that every formula
// tags at least one part with \htmlClass{x-…} for its hover explanations.
// That each tagged part shows an explanation once KaTeX has run is a browser
// check, not one this file can make.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ROOT, builtPage } from "./built-page.mjs";

const POSTS = {
  week01: {
    page: "weeks/week01/",
    src: "src/app/(week01)/weeks/week01/page.tsx",
    formulas: 8,
    terms: [
      "w1-term-log-log", "w1-term-giant-component", "w1-term-hub", "w1-term-power-law", "w1-term-spearman",
      "w1-term-pearson", "w1-term-force-layout", "w1-term-scc", "w1-term-coupon-collector", "w1-term-exponential-race",
    ],
  },
  week02: {
    page: "weeks/week02/",
    src: "src/app/(week02)/weeks/week02/page.tsx",
    formulas: 33,
    terms: [
      "w2-term-degree-preserving-shuffle", "w2-term-erdos-renyi", "w2-term-friendship-paradox", "w2-term-clustering",
      "w2-term-path-length", "w2-term-watts-strogatz", "w2-term-barabasi-albert", "w2-term-degree-tail", "w2-term-p-value",
      "w2-term-one-sided", "w2-term-unadjusted", "w2-term-assortativity", "w2-term-giant", "w2-term-degree-biased",
      "w2-term-poisson", "w2-term-local-maxima", "w2-term-path-decomposition",
    ],
  },
};

const formulas = (html) => [...html.matchAll(/<(span|div) class="tex[^"]*"[^>]*>([^<]*)<\/\1>/g)].map((m) => m[2]);

for (const [name, post] of Object.entries(POSTS)) {
  const html = builtPage(`out/${post.page}index.html`);

  test(`${name}: the page mounts one TermLayer`, () => {
    const src = readFileSync(join(ROOT, post.src), "utf8");
    assert.equal(src.match(/<TermLayer \/>/g)?.length, 1);
  });

  test(`${name}: each marked term is a button described by its own pop-up`, () => {
    for (const id of post.terms) {
      assert.equal(html.match(new RegExp(`<button aria-describedby="${id}"`, "g"))?.length, 1, `${id}: one button`);
      assert.equal(html.match(new RegExp(`<span class="w4-pop" id="${id}" role="tooltip">[^<]`, "g"))?.length, 1, `${id}: one pop-up with text`);
    }
    const ids = [...html.matchAll(/<span class="w4-pop" id="([^"]+)"/g)].map((m) => m[1]);
    assert.deepEqual(ids.filter((id, i) => ids.indexOf(id) !== i), [], "a term id is used twice");
  });

  test(`${name}: every formula is LaTeX with at least one tagged part`, () => {
    const found = formulas(html);
    assert.equal(found.length, post.formulas, "formulas on the page");
    for (const tex of found) assert.match(tex, /\\htmlClass\{x-[\w-]+\}\{/, `untagged formula: ${tex}`);
  });
}
