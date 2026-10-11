// A table rendered with the classes and bars week04-tables.js decorate()
// would add to it, worked out by decorationFor from the cells' text: num on
// numeric columns, soft on other text columns after the first, a bar or meter
// in front of the cell's own content, and data-rx on every body row. Classes
// a cell already has come first, as classList.add keeps them. The table is
// marked as React's (useOwnedRef), so the old page scripts' sweeps leave it.
import type { ReactNode } from "react";
import { useOwnedRef } from "@/lib/useOwnedRef";
import { decorationFor as plan } from "@/scripts/week04-tables.js";

/** A head cell: its text, and the class and scope it has before decoration. */
export type HeadCell = { text: string; className?: string; scope?: string };
/** A body cell: its text (a <td>), or its text with a tag, a class and content other than the text. */
export type BodyCell = string | { text: string; tag?: "td" | "th"; className?: string; children?: ReactNode };

type Plan = {
  head: string[];
  rows: { rx: true; cells: { tag: string; className: string; bar: { kind: string; width: string } | null }[] }[];
} | null;

// classList.add: the class appended once to what the cell had; "" adds nothing.
const add = (base: string | undefined, extra: string | undefined) => {
  if (!extra) return base;
  const now = base ? base.split(" ").filter(Boolean) : [];
  return (now.includes(extra) ? now : [...now, extra]).join(" ");
};

// week04-tables.js is plain JS; this is the type its plan is used with.
const decorationFor = plan as unknown as (table: { headers: string[]; rows: { text: string; tag: string }[][]; rxBars?: string }) => Plan;

const cellOf = (cell: BodyCell) => (typeof cell === "string" ? { text: cell } : cell);

export default function DecoratedTable({
  caption,
  head,
  rows,
  rxBars,
  className,
  id,
  empty,
}: {
  caption?: ReactNode;
  head: HeadCell[];
  rows: BodyCell[][];
  rxBars?: string;
  className?: string;
  id?: string;
  /** What the body says when there are no rows; without it the body stays empty. */
  empty?: ReactNode;
}) {
  const decoration = decorationFor({
    headers: head.map((h) => h.text),
    rows: rows.map((row) => row.map((c) => ({ text: cellOf(c).text, tag: cellOf(c).tag ?? "td" }))),
    rxBars,
  });
  return (
    <table ref={useOwnedRef()} className={className} id={id} data-rx-bars={rxBars}>
      {caption ? <caption>{caption}</caption> : null}
      <thead>
        <tr>
          {head.map((h, j) => (
            <th key={j} scope={h.scope} className={add(h.className, decoration?.head[j])}>
              {h.text}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.length === 0 && empty ? (
          <tr>
            <td colSpan={head.length} className="kit-empty">
              {empty}
            </td>
          </tr>
        ) : null}
        {rows.map((row, i) => (
          <tr key={i} data-rx={decoration ? "" : undefined}>
            {row.map((raw, j) => {
              const c = cellOf(raw);
              const Tag = c.tag ?? "td";
              const deco = decoration?.rows[i].cells[j];
              const own = c.children ?? c.text;
              if (Tag !== "td" || !deco) return <Tag key={j} className={c.className}>{own}</Tag>;
              const bar = deco.bar;
              return (
                <td key={j} className={add(c.className, deco.className)}>
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
    </table>
  );
}
