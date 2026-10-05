// A card: div with its classes ("card w4-card", "card jobs-card w4-card" …),
// then an id and a style when it has them.
import type { CSSProperties, ReactNode } from "react";
import { el } from "@/components/site/el";

type Props = { className: string; id?: string; style?: CSSProperties; children?: ReactNode };

export function Card({ className, id, style, children }: Props) {
  return el("div", { className, id, style }, children);
}
