// One of Week 5's search panels: div.w5-panel with its title in an h3, then
// the panel's controls, results and caption as children.
import type { ReactNode } from "react";
import { el } from "@/components/site/el";

export function Panel({ title, children }: { title: ReactNode; children?: ReactNode }) {
  return el("div", { className: "w5-panel" }, <h3>{title}</h3>, children);
}
