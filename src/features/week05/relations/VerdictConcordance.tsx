// shim: W5-2
// Kit's Concordance (src/kit/Concordance.tsx) with the two cells section 1
// added to each row on main: td.w5-mark (✓ or ✗, with a title) and
// td.w5-verdict (the note), after the right context, as insertCell() appended
// them. Until requests/W5-2.md (2) gives Concordance an `extra` prop.
import { wikiLink } from "@/kit";

export type VerdictRow = { page: string; left: string; hit: string; right: string; mark: string; markTitle: string; note: string };

/** <VerdictConcordance rows={lines(data, label).rows} caption="Enemy: 5 of 12 right" /> */
export function VerdictConcordance({ rows, caption }: { rows: VerdictRow[]; caption: string }) {
  return (
    <table className="kit-kwic">
      <caption>{caption}</caption>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i}>
            <td className="kit-kwic-page">{wikiLink(r.page)}</td>
            <td className="kit-kwic-left">{r.left}</td>
            <td>
              <mark>{r.hit}</mark>
            </td>
            <td className="kit-kwic-right">{r.right}</td>
            <td className="w5-mark" title={r.markTitle}>
              {r.mark}
            </td>
            <td className="w5-verdict">{r.note}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
