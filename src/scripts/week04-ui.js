// Week 4 redesign · shared drawer and glossary-term builders for cards that
// scripts build. A drawer is a closed <details class="rx-drawer">; a card's
// drawers sit together in one div.rx-drawers.rx-foot, the last child of its
// text column. Labels run Background, Method, More numbers, then "Table: …"
// or "Maps: …". A term is the page's span.w4-term markup, built in one place
// by termify(). This module has no <script> tag of its own, so page scripts
// may import it.

/** One closed drawer. `body` is a Node or an HTML string. */
export function drawer(label, body) {
  const details = document.createElement("details");
  details.className = "rx-drawer";
  const summary = document.createElement("summary");
  summary.textContent = label;
  const inner = document.createElement("div");
  inner.className = "rx-drawer-body";
  if (typeof body === "string") inner.innerHTML = body;
  else if (body) inner.append(body);
  details.append(summary, inner);
  return details;
}

/** The row that holds a card's drawers, in the order given. */
export function drawerRow(...drawers) {
  const row = document.createElement("div");
  row.className = "rx-drawers rx-foot";
  row.append(...drawers);
  return row;
}

// Text a term never goes inside: chart SVG, another term, and the places C7
// rules out (headings, summaries, buttons, legends and tables).
export const NO_TERM = "svg, .w4-term, button, summary, h1, h2, h3, h4, legend, .w4-legend, table, caption";

/** Wraps the first occurrence of `phrase` in `el`'s text in a glossary term:
 * a button that shows `definition` in a pop-up with the given `id`. Works on
 * nodes not yet in the document. Returns the term, or null when `el` has no
 * such text (the phrase may come from JSON wording). */
export function termify(el, phrase, definition, id) {
  if (!el || !phrase) return null;
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  for (let text = walker.nextNode(); text; text = walker.nextNode()) {
    const at = text.data.indexOf(phrase);
    if (at < 0 || text.parentElement.closest(NO_TERM)) continue;
    const word = text.splitText(at);
    word.splitText(phrase.length);
    const term = document.createElement("span");
    term.className = "w4-term";
    const button = document.createElement("button");
    button.type = "button";
    button.setAttribute("aria-describedby", id);
    button.textContent = phrase;
    const pop = document.createElement("span");
    pop.className = "w4-pop";
    pop.id = id;
    pop.setAttribute("role", "tooltip");
    pop.textContent = definition;
    term.append(button, pop);
    word.replaceWith(term);
    return term;
  }
  return null;
}

// The pure twin of termify() for React (src/components/post/Termified.tsx),
// over a tree instead of the DOM. A node is a string (one text node), an
// element { tag, attrs, children } or a term { term: { id, word, definition } }.
// NO_TERM is read as tag names and classes, so both follow the same list.
const NO_TERM_TAGS = new Set(NO_TERM.split(",").map((s) => s.trim()).filter((s) => !s.startsWith(".")));
const NO_TERM_CLASSES = NO_TERM.split(",").map((s) => s.trim()).filter((s) => s.startsWith(".")).map((s) => s.slice(1));

/** splitTerm("a giant component", "giant") -> ["a ", "giant", " component"], or null when the text lacks the phrase. */
export function splitTerm(text, phrase) {
  if (!phrase) return null;
  const at = text.indexOf(phrase);
  if (at < 0) return null;
  return [text.slice(0, at), phrase, text.slice(at + phrase.length)];
}

function noTerm(node) {
  if (NO_TERM_TAGS.has(String(node.tag).toLowerCase())) return true;
  const cls = node.attrs?.className ?? node.attrs?.class;
  if (typeof cls !== "string") return false;
  return cls.split(/\s+/).some((c) => NO_TERM_CLASSES.includes(c));
}

// One termify() call: the children of `node` with the first eligible text
// that holds the phrase split around a term, or null when none does.
function placeIn(node, term) {
  if (typeof node === "string" || node.term || !node.children || noTerm(node)) return null;
  for (let i = 0; i < node.children.length; i++) {
    const child = node.children[i];
    let replaced = null;
    if (typeof child === "string") {
      const parts = splitTerm(child, term.phrase);
      // splitText keeps the empty text nodes either side, so the tree does too.
      if (parts) replaced = [parts[0], { term: { id: term.id, word: parts[1], definition: term.definition } }, parts[2]];
    } else {
      const inner = placeIn(child, term);
      if (inner) replaced = [inner];
    }
    if (replaced) return { ...node, children: [...node.children.slice(0, i), ...replaced, ...node.children.slice(i + 1)] };
  }
  return null;
}

/**
 * termify() for each of `terms` ({ phrase, definition, id }) in order over a
 * tree, as main calls it on an element: text in document order, skipping text
 * inside NO_TERM, the first indexOf of the phrase within one text node, one
 * term per call. Returns a new tree; the input is left as it was. Main's
 * closest() also sees ancestors above the element, which a tree cannot; no
 * target in scripts/parity/fixtures/terms sits inside one.
 */
export function termifyTree(tree, terms) {
  let out = tree;
  for (const term of terms) {
    if (!term.phrase) continue;
    out = placeIn(out, term) ?? out;
  }
  return out;
}
