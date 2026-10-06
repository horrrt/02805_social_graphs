// Pins the week 4 page's frame to the 28 September redesign: the rail, the
// drawers, the deep-dive topics and their contents, the card numbers and the
// aliases that keep old anchors working, so a markup edit that breaks one of
// them fails here instead of on the page.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { block, blockAt } from "./week04-html.mjs";
import { builtPage } from "./built-page.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (name) => readFileSync(join(ROOT, name), "utf8");
const html = builtPage("out/weeks/week04/index.html");
const cut = read("src/scripts/week04-cut.js");

// The keys and values of one `const NAME = { … };` table in week04-cut.js.
const table = (name) => {
  const body = cut.match(new RegExp(`const ${name} = \\{([\\s\\S]*?)\\n\\};`));
  assert.ok(body, `week04-cut.js should define ${name}`);
  return Object.fromEntries(
    [...body[1].matchAll(/"([^"]+)":\s*(\[[^\]]*\]|"[^"]*")/g)].map(([, k, v]) => [k, JSON.parse(v)]),
  );
};
const ALIAS = table("ALIAS");
const SUB = table("SUB");
const METHOD = table("METHOD");

const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
const hasId = (id) => ids.includes(id);
const attr = (tag, name) => (tag.match(new RegExp(`\\s${name}="([^"]*)"`)) || [])[1];
const classes = (tag) => (attr(tag, "class") || "").split(/\s+/);
// Every element in `fragment` that carries class token `cls`, as [openingTag, wholeElement].
const withClass = (fragment, cls) =>
  [...fragment.matchAll(/<[a-zA-Z][\w-]*\s[^>]*>/g)]
    .filter((m) => classes(m[0]).includes(cls))
    .map((m) => [m[0], blockAt(fragment, m.index)]);
const text = (fragment) => fragment.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
// Which box an entry points at: its data-target, else its fragment.
const entry = (tag) => attr(tag, "data-target") || decodeURIComponent(attr(tag, "href").slice(1));

const TOPICS = ["topic-where", "topic-jobs", "topic-outsourcing", "topic-paperwork", "topic-years"];

test("no old pop-up is left and no id repeats", () => {
  assert.ok(!/class="[^"]*\bw4-tip\b/.test(html), "every .w4-tip pop-up became a drawer");
  const seen = new Set();
  const dup = ids.filter((id) => (seen.has(id) ? true : (seen.add(id), false)));
  assert.deepEqual(dup, [], "ids must be unique");
});

test("drawer labels come from the fixed set, in order", () => {
  const rank = (label) =>
    label === "Background" ? 0 : label === "Method" ? 1 : label === "More numbers" ? 2 : /^(Table|Maps): \S/.test(label) ? 3 : -1;
  const rows = withClass(html, "rx-drawers");
  assert.ok(rows.length > 0, "the page should have drawer rows");
  for (const [, row] of rows) {
    const labels = [...row.matchAll(/<summary>([\s\S]*?)<\/summary>/g)].map((m) => text(m[1]));
    if (labels.length === 1 && labels[0] === "Which ones") continue; // the catalogue's list of moved questions
    const ranks = labels.map(rank);
    assert.ok(!ranks.includes(-1), `unknown drawer label in ${JSON.stringify(labels)}`);
    assert.deepEqual(ranks, [...ranks].sort((a, b) => a - b), `drawer order ${JSON.stringify(labels)}`);
  }
});

test("contents and catalogue links reach a box inside the right topic", () => {
  // The panel that holds a box, for a target that exists only once a script runs.
  const lands = (topic, target) => {
    if (SUB[target]) return topic.includes(`id="${SUB[target][0]}"`);
    if (METHOD[target]) return topic.includes('id="cut-methods"') && hasId(target);
    return topic.includes(`id="${target}"`);
  };
  for (const id of TOPICS) {
    const topic = block(html, id);
    const items = withClass(topic, "rx-toc-item");
    assert.ok(items.length > 0, `#${id} should have contents`);
    for (const [tag] of items) {
      assert.ok(lands(topic, entry(tag)), `#${id} contents entry ${entry(tag)} should open a box in the topic`);
      if (SUB[entry(tag)]) assert.equal(attr(tag, "href"), `#${SUB[entry(tag)][0]}`, `${entry(tag)} links its panel`);
    }
  }
  const cards = withClass(block(html, "cut-catalogue"), "rx-tcard");
  assert.equal(cards.length, TOPICS.length + 1, "one catalogue card per topic, plus Data");
  for (const [, card] of cards) {
    const [head, ...links] = [...card.matchAll(/<a\s[^>]*>/g)].map((m) => m[0]);
    const topicId = attr(head, "href").slice(1);
    const topic = block(html, topicId);
    for (const tag of links) {
      const target = entry(tag);
      if (topicId === "evidence" && target === "closing-ai") continue; // AI use sits in the closing
      if (target === topicId) continue;
      assert.ok(lands(topic, target), `catalogue link ${target} should open a box in #${topicId}`);
    }
  }
});

test("old anchors are aliases, and every alias lands", () => {
  for (const old of ["cut-place", "cut-jobs", "cut-who", "cut-more", "who-first-round", "place-inspector"]) {
    assert.ok(old in ALIAS, `#${old} needs an ALIAS entry`);
    assert.ok(!hasId(old), `#${old} is retired, so only the alias answers it`);
  }
  for (const [old, to] of Object.entries(ALIAS)) assert.ok(hasId(to), `ALIAS ${old} → ${to} needs id="${to}"`);
});

test("the rail: labels, targets and accessible names", () => {
  const railAt = html.search(/<nav[^>]*class="w4-rail"/);
  assert.ok(railAt >= 0, "the page has a rail");
  const rail = blockAt(html, railAt);
  // The deep dive's entries carry their topic's title from the catalogue.
  const topicTitles = new Map(
    withClass(block(html, "cut-catalogue"), "rx-tcard").map(([, card]) => [
      attr(card.match(/<a\s[^>]*>/)[0], "href").slice(1),
      text(card.match(/<b>([\s\S]*?)<\/b>/)[1]),
    ]),
  );
  const items = [...rail.matchAll(/<li data-target="([^"]+)">\s*<a([^>]*)>\s*<span[^>]*class="w4-rail-label"[^>]*>([^<]*)<\/span>/g)];
  assert.equal(items.length, (rail.match(/<li\b/g) || []).length, "every rail item has a link and a label");
  for (const [, target, a, label] of items) {
    assert.ok(hasId(target), `rail data-target ${target} needs a target`);
    assert.ok(attr(`<a${a}>`, "aria-label"), `rail link to ${target} needs an aria-label`);
    assert.ok(!label.includes(" · "), `rail label "${label}" uses no " · "`);
    assert.ok(label.trim(), `rail link to ${target} needs a label`);
    assert.ok(!/^\d[A-C]? /.test(label), `rail label "${label}" carries no section number`);
    if (topicTitles.has(target)) assert.equal(label, topicTitles.get(target), `rail label for ${target} is its topic title`);
  }
  for (const id of [...TOPICS, "evidence"]) assert.ok(items.some(([, t]) => t === id), `the rail lists #${id}`);
});

test("segmented controls are named groups of five options at most", () => {
  for (const cls of ["rx-seg", "axis-modes", "staffing-years"]) {
    for (const [tag, el] of withClass(html, cls)) {
      assert.equal(attr(tag, "role"), "group", `.${cls} needs role="group"`);
      const by = attr(tag, "aria-labelledby");
      assert.ok(attr(tag, "aria-label") || (by && hasId(by)), `.${cls} needs an accessible name`);
      assert.ok((el.match(/<button\b/g) || []).length <= 5, `.${cls} holds five options at most`);
    }
  }
});

test("deep-dive card numbers follow each topic's contents", () => {
  for (const id of TOPICS) {
    const topic = block(html, id);
    // The panel each contents entry opens, with the number its card should carry.
    const want = new Map();
    withClass(topic, "rx-toc-item").forEach(([tag], i) => {
      const t = entry(tag);
      const panel = SUB[t]?.[0] ?? (METHOD[t] ? "cut-methods" : t);
      want.set(panel, [...(want.get(panel) || []), String(i + 1)]);
    });
    let seen = 0;
    for (const [tag, panel] of withClass(topic, "rx-panel")) {
      const nums = [...panel.matchAll(/<span class="w4-num">([^<]*)<\/span>/g)].map((m) => m[1]);
      seen += nums.length;
      const box = attr(tag, "data-box");
      for (const n of nums) assert.ok((want.get(box) || []).includes(n), `#${id}: box ${box} shows ${n}, contents want ${want.get(box)}`);
    }
    assert.equal(seen, (topic.match(/class="w4-num"/g) || []).length, `#${id}: every number sits in a panel`);
  }
});

test("each box the router can pick in a shared panel has a CSS rule that hides the other cards", () => {
  const css = read("src/styles/post.css");
  for (const [id, [panel, show]] of Object.entries(SUB)) {
    // The scripts build these cards as div.card.w4-card, so the selector must
    // not name an element: `article.w4-card` would never match.
    const rule = `#${panel}[data-show="${show}"] .w4-card:not(#${id})`;
    assert.ok(css.includes(rule), `post.css should hide the other cards when ${panel} shows ${show}: ${rule}`);
  }
});
