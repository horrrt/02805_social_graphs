// A quoted passage from one page, as kit.js passage() builds it: the text
// with every occurrence of `highlight` in a <mark> (any case), and the page
// as a Wikipedia link in a <cite>. Style: .kit-passage in post.css.
import { wikiLink } from "./wikiLink";

/** <Passage page="Thor_(Marvel_Comics)" text="…" highlight="power" /> */
export default function Passage({ page, text, highlight }: { page: string; text: string; highlight?: string }) {
  const parts = highlight ? text.split(new RegExp(`(${highlight.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi")) : [text];
  return (
    <blockquote className="kit-passage">
      <p>{parts.map((part, i) => (i % 2 ? <mark key={i}>{part}</mark> : part))}</p>
      <cite>{wikiLink(page)}</cite>
    </blockquote>
  );
}
