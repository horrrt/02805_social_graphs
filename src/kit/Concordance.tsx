// A concordance (key word in context), as kit.js concordance() builds it: one
// row per hit, the page as a Wikipedia link, the left context, the hit in a
// <mark> and the right context. Style: .kit-kwic in post.css.
import type { ReactNode } from "react";
import { wikiLink } from "./wikiLink";

export type KwicRow = { page: string; left: string; hit: string; right: string; extra?: ReactNode };

/** <Concordance rows={[{ page, left, hit, right, extra }]} caption="…" />; extra: cells after the right context. */
export default function Concordance({ rows, caption }: { rows: KwicRow[]; caption?: ReactNode }) {
  return (
    <table className="kit-kwic">
      {caption ? <caption>{caption}</caption> : null}
      <tbody>
        {rows.map((r, i) => (
          <tr key={i}>
            <td className="kit-kwic-page">{wikiLink(r.page)}</td>
            <td className="kit-kwic-left">{r.left}</td>
            <td>
              <mark>{r.hit}</mark>
            </td>
            <td className="kit-kwic-right">{r.right}</td>
            {r.extra}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
