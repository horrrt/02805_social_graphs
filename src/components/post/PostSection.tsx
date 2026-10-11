// A post section: section.step with its id. owner "" writes an empty
// data-owner, as the template does; leaving it out writes none.
import type { ReactNode } from "react";
import { el } from "@/components/site/el";

export function PostSection({ id, owner, children }: { id: string; owner?: string; children: ReactNode }) {
  return el("section", { className: "step", "data-owner": owner, id }, children);
}
