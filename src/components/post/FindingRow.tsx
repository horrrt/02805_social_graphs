// One finding: its number, the section's title and its answer (children), the
// mini chart, and the link to the section as a direct child of the row. Pass
// the chart as `mini` (an element that renders div.w4-mini with
// data-finding); without it the row writes that host empty, for a page script
// to draw into, with `finding` as its data-finding.
import type { ReactNode } from "react";

type Props = {
  num: ReactNode;
  title: ReactNode;
  mini?: ReactNode;
  finding?: string;
  href: string;
  link: ReactNode;
  children: ReactNode;
};

export function FindingRow({ num, title, mini, finding, href, link, children }: Props) {
  return (
    <div className="w4-finding">
      <span className="w4-num">{num}</span>
      <div>
        <h3>{title}</h3>
        <p>{children}</p>
      </div>
      {mini ?? <div className="w4-mini" data-finding={finding}></div>}
      <a href={href}>{link}</a>
    </div>
  );
}
