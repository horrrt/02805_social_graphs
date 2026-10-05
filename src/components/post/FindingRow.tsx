// One finding: its number, the section's title and its answer (children), the
// empty host the page's script draws the mini chart into (div.w4-mini with
// data-finding), and the link to the section as a direct child of the row.
import type { ReactNode } from "react";

type Props = {
  num: ReactNode;
  title: ReactNode;
  finding: string;
  href: string;
  link: ReactNode;
  children: ReactNode;
};

export function FindingRow({ num, title, finding, href, link, children }: Props) {
  return (
    <div className="w4-finding">
      <span className="w4-num">{num}</span>
      <div>
        <h3>{title}</h3>
        <p>{children}</p>
      </div>
      <div className="w4-mini" data-finding={finding}></div>
      <a href={href}>{link}</a>
    </div>
  );
}
