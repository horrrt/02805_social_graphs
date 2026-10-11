// The key to the charts: one row per mark, its swatch (i with the swatch
// class, and children for a multi-colour one), its name and what it shows.
import type { ReactNode } from "react";
import { el } from "@/components/site/el";

export type HowToRow = { swatch: string; swatchChildren?: ReactNode; label: ReactNode; text: ReactNode };

export function HowTo({ title = "How to read the charts", rows }: { title?: ReactNode; rows: HowToRow[] }) {
  return el(
    "div",
    { className: "w4-howto" },
    <h3>{title}</h3>,
    ...rows.map((row) =>
      el("div", null, el("i", { className: row.swatch }, row.swatchChildren), <b>{row.label}</b>, <span>{row.text}</span>),
    ),
  );
}
