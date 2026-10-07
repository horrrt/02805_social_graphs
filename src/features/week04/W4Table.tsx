// A Week 4 table that a script filled on main, rendered with the classes and
// bars week04-tables.js decorate() gave it (decorationFor works them out from
// the cells' text): num on numeric columns, soft on other text columns after
// the first, a bar or meter in front of a cell's content, data-rx on every
// body row. Cells keep their own style and class, as the scripts wrote them.
// Marked as React's, so the old scripts' table sweep leaves it alone.
import type { CSSProperties, ReactNode } from "react";
import { useOwnedRef } from "@/lib/useOwnedRef";
import { decorationFor as plan } from "@/scripts/week04-tables.js";

export type W4Head = string | { text: string; content?: ReactNode; style?: CSSProperties; className?: string; scope?: string };
export type W4Cell = string | { text: string; content?: ReactNode; style?: CSSProperties; className?: string; tag?: "td" | "th"; colSpan?: number };
export type W4Row = W4Cell[] | { cells: W4Cell[]; style?: CSSProperties; className?: string };

type Plan = {
  head: string[];
  rows: { cells: { tag: string; className: string; bar: { kind: string; width: string } | null }[] }[];
} | null;

const decorationFor = plan as unknown as (table: { headers: string[]; rows: { text: string; tag: string }[][]; rxBars?: string }) => Plan;

const cellOf = (c: W4Cell) => (typeof c === "string" ? { text: c } : c);
const headOf = (c: W4Head) => (typeof c === "string" ? { text: c } : c);
const rowOf = (r: W4Row) => (Array.isArray(r) ? { cells: r } : r);

// classList.add: the class appended once to what the cell had.
const add = (base: string | undefined, extra: string | undefined) => {
  if (!extra) return base;
  const now = base ? base.split(" ").filter(Boolean) : [];
  return (now.includes(extra) ? now : [...now, extra]).join(" ");
};

/** The rows alone, decorated, for a <tbody> inside a table the server renders: rows and the head's text. */
export function W4Rows({ rows, headers = [], rxBars, id }: { rows: W4Row[]; headers?: string[]; rxBars?: string; id?: string }) {
  const body = rows.map(rowOf);
  const decoration = decorationFor({
    headers,
    rows: body.map((r) => r.cells.map((c) => ({ text: cellOf(c).text, tag: cellOf(c).tag ?? "td" }))),
    rxBars,
  });
  return (
    <tbody id={id}>
      {body.map((row, i) => (
        <tr key={i} style={row.style} className={row.className} data-rx={decoration ? "" : undefined}>
          {row.cells.map((raw, j) => {
            const c = cellOf(raw);
            const Tag = c.tag ?? "td";
            const deco = decoration?.rows[i].cells[j];
            const own = c.content ?? c.text;
            if (Tag !== "td" || !deco) return <Tag key={j} className={c.className} style={c.style} colSpan={c.colSpan}>{own}</Tag>;
            const bar = deco.bar;
            return (
              <td key={j} className={add(c.className, deco.className)} style={c.style} colSpan={c.colSpan}>
                {bar ? (
                  <span className="rx-cell">
                    <span className={bar.kind ? `rx-bar ${bar.kind}` : "rx-bar"}>
                      <i style={{ width: bar.width }}></i>
                    </span>
                    <span>{own}</span>
                  </span>
                ) : (
                  own
                )}
              </td>
            );
          })}
        </tr>
      ))}
    </tbody>
  );
}

/** A whole table: <W4Table className="ego" head={["α", …]} rows={…} tbodyId="place-alpha-table" />. */
export function W4Table({
  className,
  id,
  head,
  rows,
  tbodyId,
  rxBars,
  caption,
}: {
  className?: string;
  id?: string;
  head?: W4Head[];
  rows: W4Row[];
  tbodyId?: string;
  rxBars?: string;
  caption?: ReactNode;
}) {
  const heads = (head ?? []).map(headOf);
  const body = rows.map(rowOf);
  const decoration = decorationFor({
    headers: heads.map((h) => h.text),
    rows: body.map((r) => r.cells.map((c) => ({ text: cellOf(c).text, tag: cellOf(c).tag ?? "td" }))),
    rxBars,
  });
  return (
    <table ref={useOwnedRef()} className={className} id={id} data-rx-bars={rxBars}>
      {caption ? <caption>{caption}</caption> : null}
      {head ? (
        <thead>
          <tr>
            {heads.map((h, j) => (
              <th key={j} scope={h.scope} className={add(h.className, decoration?.head[j])} style={h.style}>
                {h.content ?? h.text}
              </th>
            ))}
          </tr>
        </thead>
      ) : null}
      <W4Rows rows={rows} headers={heads.map((h) => h.text)} rxBars={rxBars} id={tbodyId} />
    </table>
  );
}
