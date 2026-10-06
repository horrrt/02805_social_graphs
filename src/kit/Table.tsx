// A plain table from columns and rows, as kit.js table() builds it: an
// optional caption, th[scope=col] heads, numbers written the en-GB way, num on
// the columns marked num, then decorate()'s classes and bars (DecoratedTable).
import type { ReactNode } from "react";
import DecoratedTable from "./DecoratedTable";

export type Column = { key: string; label: string; num?: boolean };
export type TableSpec = { columns: Column[]; rows: Record<string, unknown>[]; caption?: ReactNode };

const cellText = (v: unknown) => (v === null || v === undefined ? "" : typeof v === "number" ? v.toLocaleString("en-GB") : String(v));

/** <Table columns={[{ key: "word", label: "Word" }, { key: "count", label: "Count", num: true }]} rows={rows} caption="…" /> */
export default function Table({ columns, rows, caption }: TableSpec) {
  return (
    <DecoratedTable
      caption={caption}
      head={columns.map((c) => ({ text: c.label, scope: "col", className: c.num ? "num" : undefined }))}
      rows={rows.map((r) => columns.map((c) => ({ text: cellText(r[c.key]), className: c.num ? "num" : undefined })))}
    />
  );
}
