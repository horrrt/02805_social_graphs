// A Week 4 figure: figure.w4-figure with a caption (title in bold, then the
// reading) and the chart bodies as children.
import type { ReactNode } from "react";
import { el } from "@/components/site/el";

export function W4Figure({ title, caption, children }: { title: ReactNode; caption: ReactNode; children?: ReactNode }) {
  return el(
    "figure",
    { className: "w4-figure" },
    <figcaption>
      <b>{title}</b>
      <span>{caption}</span>
    </figcaption>,
    children,
  );
}
