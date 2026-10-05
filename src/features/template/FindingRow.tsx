// One finding, as src/components/post/FindingRow.tsx renders it, with the
// mini chart's host passed in (`mini`, an island that renders div.w4-mini
// with data-finding) where that component writes an empty one.
import type { ReactNode } from "react";

type Props = {
  num: ReactNode;
  title: ReactNode;
  mini: ReactNode;
  href: string;
  link: ReactNode;
  children: ReactNode;
};

export function FindingRow({ num, title, mini, href, link, children }: Props) {
  return (
    <div className="w4-finding">
      <span className="w4-num">{num}</span>
      <div>
        <h3>{title}</h3>
        <p>{children}</p>
      </div>
      {mini}
      <a href={href}>{link}</a>
    </div>
  );
}
