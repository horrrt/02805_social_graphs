// The bar across the top of a post: the brand, the site nav (Home, Posts,
// About), whatever sits between it and the section links (Week 3's and the
// style guide's style menu, as children), then the section links with {" "}
// between them. `root` is the path to the site's root ("../../" from a week);
// `current` is the post's href in the site nav's list of posts. brandSpace
// writes the {" "} after the brand that every page with the site nav has;
// ariaFirst puts aria-label before class on the nav, as the style guide
// writes it. A page
// whose nav changes after load (Week 4's "here" link) passes its own `nav`.
import type { ReactNode } from "react";
import { BrandMark } from "./BrandMark";
import { el } from "./el";
import { SiteNav } from "./SiteNav";

// `name` gives a link its accessible name when its label is only a number ("1", "2").
export type TopbarLink = { href: string; label: ReactNode; here?: boolean; name?: string };

type Props = {
  root: string;
  current?: string;
  navLabel?: string;
  links?: TopbarLink[];
  ariaFirst?: boolean;
  brandSpace?: boolean;
  nav?: ReactNode;
  children?: ReactNode;
};

export function PostTopbar({ root, current, navLabel, links = [], ariaFirst, brandSpace, nav, children }: Props) {
  const items = links.flatMap((link, i) => [i > 0 && " ", el("a", { className: link.here ? "here" : undefined, href: link.href, ...(link.name ? { "aria-label": link.name } : {}) }, link.label)]);
  const navAttrs = ariaFirst ? { "aria-label": navLabel, className: "topnav" } : { className: "topnav", "aria-label": navLabel };
  return (
    <div className="topbar">
      {el(
        "div",
        { className: "shell" },
        <BrandMark href={root} />,
        brandSpace && " ",
        <SiteNav root={root} current={current} />,
        children,
        nav ?? el("nav", navAttrs, ...items),
      )}
    </div>
  );
}
