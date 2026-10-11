// The header that opens a section: its number (hidden from screen readers),
// its title and the finding in one line (children).
import type { ReactNode } from "react";

export function SectionOpener({ num, title, children }: { num: ReactNode; title: ReactNode; children: ReactNode }) {
  return (
    <header className="w4-opener">
      <span aria-hidden="true" className="w4-opener-num">{num}</span>
      <div>
        <h2>{title}</h2>
        <p>{children}</p>
      </div>
    </header>
  );
}
