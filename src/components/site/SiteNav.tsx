"use client";
// The site's own links in the top bar: Home, Posts and About. Posts goes to
// the home page's list of posts, and its menu lists every post (posts.ts).
// Without JavaScript the menu opens on hover and on focus inside it (CSS on
// .site-nav-posts without data-open). Once hydrated the island owns it:
// pointer and focus entering open it, the chevron toggles it, and Escape or a
// click outside closes it, Escape returning focus to the chevron.
// `root` is the path to the site's root; `current` is "home" or the href of
// the post this page is, which the nav marks aria-current.
import { useRef, useState, type FocusEvent, type MouseEvent, type RefObject } from "react";
import { island } from "@/lib/island";
import { useOutsideClose } from "@/lib/useEvents";
import { useHydrated } from "@/lib/useHydrated";
import { POSTS, type Post } from "./posts";

type Props = { root: string; current?: string };

// "open" follows the pointer and focus; "pinned" was opened with the chevron
// and stays open when the pointer leaves.
type Menu = "closed" | "open" | "pinned";

type Live = {
  menu: Menu;
  setMenu: (menu: Menu) => void;
  posts: RefObject<HTMLDivElement | null>;
  toggle: RefObject<HTMLButtonElement | null>;
};

const here = (current: string | undefined, href: string) => (current === href ? ("page" as const) : undefined);

function Entry({ post, root, current }: { post: Post; root: string; current?: string }) {
  return (
    <li>
      <a href={root + post.href} aria-current={here(current, post.href)}>
        {post.label}
      </a>
      {post.parts ? (
        <ul>
          {post.parts.map((part) => (
            <Entry key={part.href} post={part} root={root} current={current} />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

// The nav's markup; without `live` it is the server markup.
function Nav({ root, current, live }: Props & { live?: Live }) {
  const open = live ? live.menu !== "closed" : false;
  // Focus moving in from outside opens the menu and moving out closes it;
  // moves inside it (Escape sending focus back to the chevron) change nothing.
  const inside = (event: FocusEvent) => live?.posts.current?.contains(event.relatedTarget as Node | null) ?? false;
  // A pointer click while hovering has the menu open keeps it open; a key
  // press (detail 0) and every other click toggle it.
  const toggle = (event: MouseEvent) => {
    if (!live) return;
    if (live.menu === "open" && event.detail > 0) live.setMenu("pinned");
    else live.setMenu(open ? "closed" : "pinned");
  };
  return (
    <nav className="site-nav" aria-label="Site">
      <a href={root} aria-current={here(current, "home")}>
        Home
      </a>
      <div
        className="site-nav-posts"
        data-open={live ? String(open) : undefined}
        ref={live?.posts}
        onMouseEnter={() => {
          if (live?.menu === "closed") live.setMenu("open");
        }}
        onMouseLeave={() => {
          if (live?.menu === "open" && !live.posts.current?.contains(document.activeElement)) live.setMenu("closed");
        }}
        onFocus={(event) => {
          if (live?.menu === "closed" && !inside(event)) live.setMenu("open");
        }}
        onBlur={(event) => {
          if (live && !inside(event)) live.setMenu("closed");
        }}
      >
        <a href={`${root}#weeks`}>Posts</a>
        <button
          aria-controls="site-nav-menu"
          aria-expanded={open}
          aria-label="Show all posts"
          className="site-nav-toggle"
          ref={live?.toggle}
          type="button"
          onClick={toggle}
        >
          <svg aria-hidden="true" viewBox="0 0 10 10">
            <path d="M2 3.5 5 6.5 8 3.5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" />
          </svg>
        </button>
        <ul className="site-nav-menu" id="site-nav-menu">
          {POSTS.map((post) => (
            <Entry key={post.href} post={post} root={root} current={current} />
          ))}
        </ul>
      </div>
      <a href={`${root}#about`}>About</a>
    </nav>
  );
}

function SiteNavView({ root, current }: Props) {
  const hydrated = useHydrated();
  const [menu, setMenu] = useState<Menu>("closed");
  const posts = useRef<HTMLDivElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);
  useOutsideClose(
    [posts],
    (event) => {
      if (menu === "closed") return;
      setMenu("closed");
      if (event.type === "keydown" && posts.current?.contains(document.activeElement)) toggle.current?.focus();
    },
    { escape: true },
  );
  return <Nav root={root} current={current} live={hydrated ? { menu, setMenu, posts, toggle } : undefined} />;
}

function SiteNavPlaceholder({ root, current }: Props) {
  return <Nav root={root} current={current} />;
}

export const SiteNav = island("site/nav/SiteNav", SiteNavView, SiteNavPlaceholder, { roots: [".site-nav"] });
