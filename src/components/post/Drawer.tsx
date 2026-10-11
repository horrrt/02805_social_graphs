// One drawer: details.rx-drawer whose summary is followed by its body. It is
// never rendered open: the reader opens it (R5).
import type { ReactNode } from "react";
import { el } from "@/components/site/el";

export function Drawer({ label, bodyId, children }: { label: ReactNode; bodyId?: string; children?: ReactNode }) {
  return (
    <details className="rx-drawer">
      <summary>{label}</summary>
      {el("div", { className: "rx-drawer-body", id: bodyId }, children)}
    </details>
  );
}
