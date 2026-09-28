// Region helpers for the week 4 prose tests. block() cuts one element out of the
// page by counting its nested tags, so a drawer or card that closes early no
// longer ends a region; flatten() turns that slice into the sentences a reader sees.
import assert from "node:assert/strict";

// The element whose id="…" is `id`, from its opening tag to the tag that closes it.
export const block = (html, id) => {
  const at = html.indexOf(`id="${id}"`);
  assert.ok(at >= 0, `no element with id="${id}"`);
  return blockAt(html, html.lastIndexOf("<", at));
};

// The element whose opening tag starts at `start`, up to the tag that closes it.
export const blockAt = (html, start) => {
  const name = html.slice(start + 1).match(/^[a-zA-Z][\w-]*/)[0];
  const tag = new RegExp(`<(/?)${name}(?=[\\s>/])`, "gi");
  tag.lastIndex = start;
  let depth = 0;
  for (let m; (m = tag.exec(html)); ) {
    depth += m[1] ? -1 : 1;
    if (depth === 0) return html.slice(start, html.indexOf(">", m.index) + 1);
  }
  assert.fail(`<${name}> at ${start} never closes`);
};

// Text of a fragment: glossary terms become their word, the remaining popovers
// with plain text go, tags become spaces and whitespace collapses.
export const flatten = (fragment) =>
  fragment
    .replace(/<span class="w4-term">\s*<button[^>]*>([^<]*)<\/button>\s*<span class="w4-pop"[^>]*>[^<]*<\/span>\s*<\/span>/g, "$1")
    .replace(/<span class="w4-pop[^"]*"[^>]*>[^<]*<\/span>/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ");

// Text of the "What to notice" boxes inside element `id`, joined, so a pin on a
// notice cannot pass on the same sentence sitting in a drawer.
export const notices = (html, id) => {
  const card = block(html, id);
  const out = [];
  for (let at = card.indexOf('<div class="notice"'); at >= 0; at = card.indexOf('<div class="notice"', at + 1)) {
    out.push(flatten(blockAt(card, at)));
  }
  return out.join(" ");
};
