// The "how each section reads" box: a title, an optional intro line, and a
// list of terms with what each means; a row may end in a tag (Week 4).
import type { ReactNode } from "react";
import { el } from "@/components/site/el";

export type AnatomyRow = { term: ReactNode; def: ReactNode; tag?: ReactNode; tagClass?: string };

type Props = { className?: string; title: ReactNode; intro?: ReactNode; rows: AnatomyRow[] };

export function Anatomy({ className = "w4-anatomy", title, intro, rows }: Props) {
  return el(
    "div",
    { className },
    <h3>{title}</h3>,
    intro !== undefined && <p>{intro}</p>,
    el(
      "dl",
      null,
      ...rows.map((row) =>
        el(
          "div",
          null,
          <dt>{row.term}</dt>,
          <dd>{row.def}</dd>,
          row.tag !== undefined && <span className={row.tagClass ?? "w4-tag"}>{row.tag}</span>,
        ),
      ),
    ),
  );
}
