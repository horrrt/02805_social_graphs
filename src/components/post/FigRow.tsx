// Two figures or plots side by side.
import type { ReactNode } from "react";

export function FigRow({ children }: { children: ReactNode }) {
  return <div className="rx-fig-row">{children}</div>;
}
