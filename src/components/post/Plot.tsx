// A chart panel: div.plot with its title, an optional axis note and the chart
// host and anything else as children.
import type { CSSProperties, ReactNode } from "react";
import { el } from "@/components/site/el";

type Props = { title: ReactNode; note?: ReactNode; style?: CSSProperties; children?: ReactNode };

export function Plot({ title, note, style, children }: Props) {
  return el("div", { className: "plot", style }, <h3>{title}</h3>, note !== undefined && <p className="axis-note">{note}</p>, children);
}
