// The bar across the top of every page: the brand on the left, the site nav
// (Home, Posts, About) on the right, and the page's own controls in two
// places. `children` sit just after the brand (Week 3's and the style guide's
// style menu); `tools` sit on the right, just before the site nav and set
// off from it by a divider (Weeks 1 and 2's data link and logbook, Cold
// Read's ways to play). `root` is the path to the site's root ("../../" from a
// week); `current` is "home" or the page's href in the site nav's list of
// posts. Its styles are in topbar.css, so the bar looks the same on pages that
// do not load corridor.css.
import type { ReactNode } from "react";
import "@/styles/topbar.css";
import { BrandMark } from "./BrandMark";
import { SiteNav } from "./SiteNav";

type Props = { root: string; current?: string; tools?: ReactNode; children?: ReactNode };

export function PostTopbar({ root, current, tools, children }: Props) {
  return (
    <div className="topbar">
      <div className="shell">
        <BrandMark href={root} />
        {children}
        {tools ? <div className="topbar-tools">{tools}</div> : null}
        <SiteNav root={root} current={current} />
      </div>
    </div>
  );
}
