// Holds every post from Week 4 on, and the template, to Week 4's density: a
// card shows its answer, baseline and main limit, and everything else opens
// from a drawer. Week 4 cards show 41 to 230 words before any click; Week 5
// shipped cards of 415 to 702 because nothing measured them (POST_GUIDE.md,
// "Keep the card short"). Reads the HTML as text, so words a page script draws
// are not counted: POST_GUIDE.md gives the browser check for those.
import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const WEEKS = fileURLToPath(new URL("../docs/weeks/", import.meta.url));
const BUDGET = 350;

const pages = readdirSync(WEEKS)
  .filter((d) => d === "_template" || (/^week\d+$/.test(d) && Number(d.slice(4)) >= 4))
  .map((d) => join(WEEKS, d, "index.html"))
  .filter(existsSync);

/** The page with what a reader cannot see before a click taken out: scripts,
 * styles, SVG, the body of every <details> (its summary stays) and term pop-ups. */
export function visible(html) {
  let out = html.replace(/<(script|style|svg|template)\b[\s\S]*?<\/\1>/g, " ");
  for (let prev; prev !== out; ) {
    prev = out;
    out = out.replace(/<details\b[^>]*>\s*<summary\b[^>]*>([\s\S]*?)<\/summary>((?:(?!<details\b)[\s\S])*?)<\/details>/g, " $1 ");
  }
  return out.replace(/<span class="w4-pop"[^>]*>[\s\S]*?<\/span>/g, " ");
}

export const words = (html) =>
  html
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-z#0-9]+;/g, "x")
    .split(/\s+/)
    .filter((w) => /[\p{L}\p{N}]/u.test(w)).length;

/** Each element opened by `open` (a regex on its start tag), with its words,
 * matched to its closing tag by depth. */
function elements(html, open, tag) {
  const out = [];
  for (const m of html.matchAll(open)) {
    const re = new RegExp(`<${tag}\\b|</${tag}>`, "g");
    re.lastIndex = m.index + 1;
    let depth = 1;
    let e;
    while (depth && (e = re.exec(html))) depth += e[0].startsWith("</") ? -1 : 1;
    out.push({ at: m.index, tag: m[0], body: html.slice(m.index, e.index) });
  }
  return out;
}

test("the budget test sees pages", () => {
  assert.ok(pages.some((p) => p.includes("week04")) && pages.some((p) => p.includes("_template")));
});

for (const page of pages) {
  const name = page.split("/").slice(-2, -1)[0];
  const html = visible(readFileSync(page, "utf8"));

  test(`${name}: every card shows at most ${BUDGET} words before a click`, () => {
    const cards = elements(html, /<div\b[^>]*class="[^"]*\bw4-card\b[^"]*"[^>]*>/g, "div");
    const sections = elements(html, /<section\b[^>]*\bid="([^"]+)"[^>]*>/g, "section");
    const over = cards
      .map((c) => {
        const section = sections.filter((s) => s.at <= c.at).pop();
        const id = c.tag.match(/\bid="([^"]+)"/)?.[1] ?? section?.tag.match(/\bid="([^"]+)"/)?.[1];
        return { id, n: words(c.body) };
      })
      .filter((c) => c.n > BUDGET);
    assert.deepEqual(over, [], `cards over ${BUDGET} words: move method, extra numbers and extra passages into a drawer, word for word`);
  });

  test(`${name}: "What we did" shows one paragraph, the rest sits in a drawer`, () => {
    for (const slot of elements(html, /<div\b[^>]*data-slot="did"[^>]*>/g, "div")) {
      const id = slot.tag.match(/\bid="([^"]+)"/)[1];
      const paragraphs = slot.body.match(/<p\b/g) ?? [];
      assert.ok(paragraphs.length <= 1, `#${id} shows ${paragraphs.length} paragraphs`);
    }
  });
}
