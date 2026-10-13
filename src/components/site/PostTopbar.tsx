// The bar across the top of every page: the brand on the left, the site nav
// (Home, Posts, About) on the right, and between them whatever control the
// page keeps in the bar (Week 3's and the style guide's style menu, as
// children). `root` is the path to the site's root ("../../" from a week);
// `current` is "home" or the page's href in the site nav's list of posts.
// Its styles are in topbar.css, so the bar looks the same on pages that do
// not load corridor.css.
import type { ReactNode } from "react";
import "@/styles/topbar.css";
import { BrandMark } from "./BrandMark";
import { SiteNav } from "./SiteNav";

type Props = { root: string; current?: string; children?: ReactNode };

export function PostTopbar({ root, current, children }: Props) {
  return (
    <div className="topbar">
      <div className="shell">
        <BrandMark href={root} />
        {children}
        <SiteNav root={root} current={current} />
      </div>
    </div>
  );
}
