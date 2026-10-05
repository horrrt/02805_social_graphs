// A link to a node's English Wikipedia article, labelled with its title, as
// kit.js wikiLink() builds it.
import { createElement } from "react";

/** wikiLink("Thor_(Marvel_Comics)") -> <a href="https://en.wikipedia.org/wiki/Thor_(Marvel_Comics)">Thor (Marvel Comics)</a> */
export function wikiLink(page: string) {
  return createElement("a", { href: `https://en.wikipedia.org/wiki/${encodeURIComponent(page)}` }, page.replaceAll("_", " "));
}
