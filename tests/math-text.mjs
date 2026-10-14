// The prose a reader gets from a built page's formulas and glossary terms, so
// the prose tests can keep pinning whole sentences. The server renders a
// formula (src/lib/Tex.tsx) as its LaTeX, which KaTeX typesets after load, and
// a glossary term (src/components/post/Term.tsx) as its word followed by a
// pop-up that is not part of the sentence.

/** LaTeX as the sentence reads it: the \htmlClass{x-…}{…} tags that drive the
 * hover explanations unwrapped, \text{…} unwrapped, and {,} (a thousands comma
 * that KaTeX would otherwise space as punctuation) read as a comma. */
export function untag(tex) {
  let s = tex;
  for (let prev; prev !== s; ) {
    prev = s;
    s = s.replace(/\\htmlClass\{x-[\w-]+\}\{((?:[^{}]|\{(?:[^{}]|\{[^{}]*\})*\})*)\}/g, "$1");
  }
  for (let prev; prev !== s; ) {
    prev = s;
    s = s.replace(/\\text\{([^{}]*)\}/g, "$1");
  }
  return s.replace(/\{,\}/g, ",");
}

/** Built HTML with each formula's span replaced by its untagged LaTeX and each
 * glossary term by its word, its pop-up dropped. */
export function unmath(html) {
  return html
    .replace(/<span class="w4-term[^"]*"[^>]*><button[^>]*>([\s\S]*?)<\/button><span class="w4-pop"[^>]*>[\s\S]*?<\/span><\/span>/g, "$1")
    .replace(/<(span|div) class="tex[^"]*"[^>]*>([^<]*)<\/\1>/g, (_, _tag, tex) => untag(tex));
}
