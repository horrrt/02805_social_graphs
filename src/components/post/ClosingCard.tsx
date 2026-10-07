// The closing card of a Week 5-style post: the takeaway, the one limit (a
// Notice), an optional next step, then the methods and AI-use disclosures as children.
import type { ReactNode } from "react";
import { el } from "@/components/site/el";

type Props = { className?: string; takeaway: ReactNode; limit: ReactNode; next?: ReactNode; children?: ReactNode };

export function ClosingCard({ className = "card w4-card w5-stack", takeaway, limit, next, children }: Props) {
  return el("div", { className }, <p className="sub">{takeaway}</p>, limit, next ? <p className="sub">{next}</p> : null, children);
}
