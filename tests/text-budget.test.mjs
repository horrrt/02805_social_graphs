// Holds Week 3, every post from Week 4 on, and the template to Week 4's density:
// a card shows its answer, baseline and main limit, and everything else opens
// from a drawer. Week 4 cards show 41 to 230 words before any click; Week 5
// shipped cards of 415 to 702 because nothing measured them (project/POST_GUIDE.md,
// "Keep the card short"). The limits apply per unit, never per page, so a post
// grows by adding cards: each main-path card shows at most LIMITS.section words
// before a click, and each run from an <h3> to the next one (or the card's end)
// at most LIMITS.subsection. A section marked data-depth="deep" is a deep dive:
// it is left out of the main budget, but each card inside it is held to
// LIMITS.deep. Reads the HTML as text, so words a page script draws are not
// counted: project/POST_GUIDE.md gives the browser check for those.
import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { ROOT, builtPage } from "./built-page.mjs";

const WEEKS = fileURLToPath(new URL("../out/weeks/", import.meta.url));
const LIMITS = { section: 350, subsection: 200, deep: 350 };

const pages = readdirSync(WEEKS)
  .filter((d) => d === "_template" || (/^week\d+$/.test(d) && Number(d.slice(4)) >= 3))
  .map((d) => join(WEEKS, d, "index.html"))
  .filter(existsSync);

/** Week 3 predates Week 4's card and uses the plain `card` class. */
const cardOpen = (name) =>
  name === "week03" ? /<div\b[^>]*class="[^"]*\bcard\b[^"]*"[^>]*>/g : /<div\b[^>]*class="[^"]*\bw4-card\b[^"]*"[^>]*>/g;

/** The page with what a reader cannot see before a click taken out: scripts,
 * styles, SVG, the body of every <details> (its summary stays) and term pop-ups. */
export function visible(html) {
  let out = html.replace(/<(script|style|svg|template)\b[\s\S]*?<\/\1>/g, " ");
  for (let prev; prev !== out; ) {
    prev = out;
    out = out.replace(/<details\b[^>]*>\s*<summary\b[^>]*>((?:(?!<\/summary>|<details\b)[\s\S])*?)<\/summary>((?:(?!<details\b)[\s\S])*?)<\/details>/g, " $1 ");
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
  assert.ok(["week03", "week04", "_template"].every((w) => pages.some((p) => p.includes(`/${w}/`))));
});

const idOf = (tag) => tag.match(/\bid="([^"]+)"/)?.[1];
const text = (html) => html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

for (const page of pages) {
  const name = page.split("/").slice(-2, -1)[0];
  const html = visible(builtPage(page.slice(ROOT.length + 1)));
  const sections = elements(html, /<section\b[^>]*>/g, "section");
  const cards = elements(html, cardOpen(name), "div").map((c) => {
    const around = sections.filter((s) => s.at <= c.at && c.at < s.at + s.body.length);
    const named = around.filter((s) => idOf(s.tag)).pop();
    return {
      ...c,
      id: idOf(c.tag) ?? idOf(named?.tag ?? "") ?? `card at ${c.at}`,
      deep: around.some((s) => /\bdata-depth="deep"/.test(s.tag)),
    };
  });

  test(`${name}: every main-path card shows at most ${LIMITS.section} words before a click`, () => {
    const over = cards.filter((c) => !c.deep).map((c) => ({ id: c.id, n: words(c.body) })).filter((c) => c.n > LIMITS.section);
    assert.deepEqual(over, [], `cards over ${LIMITS.section} words: move method, extra numbers and extra passages into a drawer, word for word`);
  });

  test(`${name}: every subsection of a main-path card shows at most ${LIMITS.subsection} words before a click`, () => {
    const over = [];
    for (const c of cards.filter((c) => !c.deep)) {
      const runs = c.body.split(/(?=<h3\b)/).slice(1);
      for (const run of runs) {
        const n = words(run);
        if (n > LIMITS.subsection) over.push({ card: c.id, subsection: text(run.match(/<h3\b[\s\S]*?<\/h3>/)[0]), n });
      }
    }
    assert.deepEqual(over, [], `subsections over ${LIMITS.subsection} words: move method and extra numbers into a drawer, word for word`);
  });

  test(`${name}: every deep-dive card shows at most ${LIMITS.deep} words before a click`, () => {
    const over = cards.filter((c) => c.deep).map((c) => ({ id: c.id, n: words(c.body) })).filter((c) => c.n > LIMITS.deep);
    assert.deepEqual(over, [], `deep-dive cards over ${LIMITS.deep} words: move method and extra numbers into a drawer, word for word`);
  });

  test(`${name}: "What we did" shows one paragraph, the rest sits in a drawer`, () => {
    for (const slot of elements(html, /<div\b[^>]*\bid="[a-z]+-did"[^>]*>/g, "div")) {
      const id = slot.tag.match(/\bid="([^"]+)"/)[1];
      const paragraphs = slot.body.match(/<p\b/g) ?? [];
      assert.ok(paragraphs.length <= 1, `#${id} shows ${paragraphs.length} paragraphs`);
    }
  });
}
