// The bar across the top of a post: the brand, the "All posts" link, whatever
// sits between it and the nav (Week 3's and the style guide's style menu, as
// children), then the section links with {" "} between them. `root` is the
// path to the site's root ("../../" from a week). brandSpace writes the {" "}
// after the brand that every page with a site link has; ariaFirst puts
// aria-label before class on the nav, as the style guide writes it. A page
// whose nav changes after load (Week 4's "here" link) passes its own `nav`.
import type { ReactNode } from "react";
import { BrandMark } from "./BrandMark";
import { el } from "./el";

export type TopbarLink = { href: string; label: ReactNode; here?: boolean };

type Props = {
  root: string;
  siteLink?: boolean;
  navLabel?: string;
  links?: TopbarLink[];
  ariaFirst?: boolean;
  brandSpace?: boolean;
  nav?: ReactNode;
  children?: ReactNode;
};

export function PostTopbar({ root, siteLink, navLabel, links = [], ariaFirst, brandSpace, nav, children }: Props) {
  const items = links.flatMap((link, i) => [i > 0 && " ", el("a", { className: link.here ? "here" : undefined, href: link.href }, link.label)]);
  const navAttrs = ariaFirst ? { "aria-label": navLabel, className: "topnav" } : { className: "topnav", "aria-label": navLabel };
  return (
    <div className="topbar">
      {el(
        "div",
        { className: "shell" },
        <BrandMark href={root} />,
        brandSpace && " ",
        siteLink && <a className="site-link" href={`${root}#weeks`}>All posts</a>,
        children,
        nav ?? el("nav", navAttrs, ...items),
      )}
    </div>
  );
}
