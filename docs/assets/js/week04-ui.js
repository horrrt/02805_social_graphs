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
const NO_TERM = "svg, .w4-term, button, summary, h1, h2, h3, h4, legend, .w4-legend, table, caption";

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
