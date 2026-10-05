// A row of drawers: div.rx-drawers at the foot of a card (variant "foot") or
// in the text (variant "inline"; Week 4 has one), with Drawer children.
import type { ReactNode } from "react";
import { el } from "@/components/site/el";

const CLASS = { foot: "rx-drawers rx-foot", inline: "rx-drawers rx-inline" } as const;

export function Drawers({ variant, id, children }: { variant: keyof typeof CLASS; id?: string; children?: ReactNode }) {
  return el("div", { className: CLASS[variant], id }, children);
}
