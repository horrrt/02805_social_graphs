// termifyTree (src/scripts/week04-ui.js), the tree twin of termify() that
// Termified renders, against every termify call main makes on load
// (scripts/parity/fixtures/terms/<page>.json). Each fixture element is parsed
// into the tree TermProse builds, its recorded calls run in order, and the
// result, serialised as main's DOM would print it, must equal main's outerHTML
// after the calls. React's <!-- --> markers separate text nodes, so they
// become separate strings and print again between adjacent strings.
//
// Where main's script wrote the element's text before termifying it (raw is
// null, or holds other text, as on all ten Week 4 calls), raw is not the input
// the call saw. The input is then rebuilt from `after`: each recorded term
// turned back into its word, joined to the text either side, as the one text
// node the script set. Everything else runs on raw.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ROOT } from "./built-page.mjs";

const { NO_TERM, splitTerm, termifyTree } = await import("../src/scripts/week04-ui.js");

const VOID = new Set(["br", "hr", "img", "input", "wbr", "meta", "link", "source"]);
const ENTITIES = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };
const decode = (s) =>
  s.replace(/&(#x[0-9a-f]+|#\d+|\w+);/gi, (m, e) =>
    e[0] === "#" ? String.fromCodePoint(e[1].toLowerCase() === "x" ? parseInt(e.slice(2), 16) : +e.slice(1)) : (ENTITIES[e] ?? m),
  );

/** One well-formed fragment -> its root node. Attribute names as React props (class -> className). */
function parse(html) {
  const root = { tag: "#root", attrs: {}, children: [] };
  const stack = [root];
  const top = () => stack[stack.length - 1];
  for (const [, comment, close, open, attrs, text] of html.matchAll(/(<!--[\s\S]*?-->)|<\/([\w-]+)\s*>|<([\w-]+)((?:\s+[^\s=/>]+(?:="[^"]*")?)*)\s*\/?>|([^<]+)/g)) {
    if (comment) continue;
    if (text !== undefined) top().children.push(decode(text));
    else if (close) {
      assert.equal(top().tag, close, `well-formed: </${close}>`);
      stack.pop();
    } else {
      const node = { tag: open, attrs: {}, children: [] };
      for (const [, name, value] of attrs.matchAll(/([^\s=/>]+)(?:="([^"]*)")?/g))
        node.attrs[name === "class" ? "className" : name] = decode(value ?? "");
      top().children.push(node);
      if (!VOID.has(open)) stack.push(node);
    }
  }
  assert.equal(stack.length, 1, "every element closes");
  assert.equal(root.children.length, 1, "one root element");
  return root.children[0];
}

const escText = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const escAttr = (s) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;");

/** A node as main's DOM prints it: termify()'s term markup, a <!-- --> between adjacent text nodes. */
function serialise(node) {
  if (typeof node === "string") return escText(node);
  if (node.term) {
    const { id, word, definition } = node.term;
    return `<span class="w4-term"><button type="button" aria-describedby="${escAttr(id)}">${escText(word)}</button><span class="w4-pop" id="${escAttr(id)}" role="tooltip">${escText(definition)}</span></span>`;
  }
  const attrs = Object.entries(node.attrs).map(([k, v]) => ` ${k === "className" ? "class" : k}="${escAttr(v)}"`).join("");
  const inner = node.children.map((c, i) => (i > 0 && typeof c === "string" && typeof node.children[i - 1] === "string" ? "<!-- -->" : "") + serialise(c));
  return `<${node.tag}${attrs}>${inner.join("")}${VOID.has(node.tag) ? "" : `</${node.tag}>`}`;
}

// The text a reader would see with every pop-up left out.
const textOf = (node) =>
  typeof node === "string"
    ? node
    : node.term
      ? node.term.word
      : /\bw4-pop\b/.test(node.attrs.className ?? "")
        ? ""
        : node.children.map(textOf).join("");

// `after` with each recorded term back to its word, joined to the text either side.
function untermify(node, ids) {
  if (typeof node === "string" || node.term) return node;
  const children = [];
  let glue = false;
  for (const child of node.children) {
    const button = typeof child !== "string" && child.attrs?.className === "w4-term" ? child.children.find((c) => c.tag === "button") : null;
    if (button && ids.has(button.attrs["aria-describedby"])) {
      const word = textOf(button);
      if (typeof children.at(-1) === "string") children[children.length - 1] += word;
      else children.push(word);
      glue = true;
    } else if (glue && typeof child === "string") {
      children[children.length - 1] += child;
      glue = false;
    } else {
      children.push(untermify(child, ids));
      glue = false;
    }
  }
  return { ...node, children };
}

const squash = (s) => s.replace(/\s+/g, " ").trim();

// Reconstructed inputs per page: every Week 4 call runs on text its script wrote.
const REBUILT = { template: 0, week04: 10, week05: 0 };

for (const page of Object.keys(REBUILT)) {
  test(`termifyTree reproduces every termify call on ${page}`, () => {
    const calls = JSON.parse(readFileSync(join(ROOT, "scripts/parity/fixtures/terms", `${page}.json`), "utf8"));
    const groups = Map.groupBy(calls, (c) => `${c.module} ${c.selector}`);
    let rebuilt = 0;
    let checked = 0;
    for (const [key, group] of groups) {
      const after = group.at(-1).after;
      for (const c of group) {
        assert.equal(c.after, after, `${key}: one after per element`);
        assert.equal(c.raw, group[0].raw, `${key}: one raw per element`);
      }
      const afterTree = parse(after);
      const ids = new Set(group.filter((c) => c.matched).map((c) => c.id));
      const fromAfter = untermify(afterTree, ids);
      let tree = group[0].raw === null ? null : parse(group[0].raw);
      if (tree === null || textOf(tree) !== textOf(fromAfter)) {
        tree = fromAfter;
        rebuilt += group.length;
      }
      for (const c of group) {
        const next = termifyTree(tree, [{ phrase: c.phrase, definition: c.definition, id: c.id }]);
        assert.equal(next !== tree, c.matched, `${key}: "${c.phrase}" matched is ${c.matched}`);
        tree = next;
        checked += 1;
      }
      assert.equal(squash(serialise(tree)), squash(after), key);
    }
    assert.equal(checked, calls.length);
    assert.equal(rebuilt, REBUILT[page], `${page}: calls run on text rebuilt from after`);
  });
}

test("all calls of one element in one termifyTree call give the same tree", () => {
  const calls = JSON.parse(readFileSync(join(ROOT, "scripts/parity/fixtures/terms/week05.json"), "utf8"));
  const group = calls.filter((c) => c.selector === "#search-did");
  const terms = group.map(({ phrase, definition, id }) => ({ phrase, definition, id }));
  assert.equal(squash(serialise(termifyTree(parse(group[0].raw), terms))), squash(group[0].after));
});

test("splitTerm splits around the first occurrence and keeps empty ends", () => {
  assert.deepEqual(splitTerm("a giant component", "giant"), ["a ", "giant", " component"]);
  assert.deepEqual(splitTerm("types and types", "types"), ["", "types", " and types"]);
  assert.deepEqual(splitTerm("count the tokens", "tokens"), ["count the ", "tokens", ""]);
  assert.equal(splitTerm("no such word", "Louvain"), null);
  assert.equal(splitTerm("anything", ""), null);
});

test("termifyTree skips text inside NO_TERM and goes on to the next text", () => {
  assert.equal(NO_TERM, "svg, .w4-term, button, summary, h1, h2, h3, h4, legend, .w4-legend, table, caption");
  const def = { phrase: "degree", definition: "Links per node.", id: "t-degree" };
  const tree = {
    tag: "div",
    attrs: { id: "x" },
    children: [
      { tag: "h3", attrs: {}, children: ["degree in a heading"] },
      { tag: "span", attrs: { className: "rx-legend w4-legend" }, children: ["degree"] },
      { tag: "svg", attrs: {}, children: [{ tag: "text", attrs: {}, children: ["degree"] }] },
      { tag: "table", attrs: {}, children: [{ tag: "tbody", attrs: {}, children: [{ tag: "tr", attrs: {}, children: [{ tag: "td", attrs: {}, children: ["degree"] }] }] }] },
      { term: { id: "t-other", word: "degree", definition: "Another term." } },
      { tag: "p", attrs: { className: "sub" }, children: ["no match here", " then degree once, degree twice"] },
    ],
  };
  const frozen = JSON.stringify(tree);
  const out = termifyTree(tree, [def]);
  assert.equal(JSON.stringify(tree), frozen, "the input tree is unchanged");
  assert.deepEqual(out.children.slice(0, 5), tree.children.slice(0, 5));
  assert.deepEqual(out.children[5].children, ["no match here", " then ", { term: { id: "t-degree", word: "degree", definition: "Links per node." } }, " once, degree twice"]);
  assert.equal(termifyTree(out, [{ ...def, phrase: "Louvain" }]), out, "no match returns the same tree");
  assert.equal(termifyTree("degree", [def]), "degree", "a bare text root has no element to split in");
  assert.equal(termifyTree(tree, [{ ...def, phrase: "" }]), tree, "an empty phrase does nothing");
});
