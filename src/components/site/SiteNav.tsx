"use client";
// The site's own links in the top bar: Home, Posts, Games and About. Posts
// goes to the home page's list of posts and its menu lists every post
// (posts.ts); Games goes to the home page's games and its menu lists every
// game (games.ts). Without JavaScript a menu opens on hover and on focus
// inside it (CSS on .site-nav-drop without data-open). Once hydrated the
// island owns each menu: pointer and focus entering open it, the chevron
// toggles it, and Escape or a click outside closes it, Escape returning focus
// to the chevron. `root` is the path to the site's root; `current` is "home"
// or the href of the post this page is, which the nav marks aria-current.
import { useRef, useState, type FocusEvent, type MouseEvent, type RefObject } from "react";
import { island } from "@/lib/island";
import { useOutsideClose } from "@/lib/useEvents";
import { useHydrated } from "@/lib/useHydrated";
import { GAMES, gameLabel } from "./games";
import { POSTS, type Post } from "./posts";

type Props = { root: string; current?: string };

// "open" follows the pointer and focus; "pinned" was opened with the chevron
// and stays open when the pointer leaves.
type Menu = "closed" | "open" | "pinned";

type Live = {
  menu: Menu;
  setMenu: (menu: Menu) => void;
  drop: RefObject<HTMLDivElement | null>;
  toggle: RefObject<HTMLButtonElement | null>;
};

const GAME_ENTRIES: Post[] = GAMES.map((game) => ({ href: game.href, label: gameLabel(game) }));

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

type DropProps = Props & { id: string; href: string; label: string; toggleLabel: string; entries: Post[]; live?: Live };

// A link with a chevron and its menu; without `live` it is the server markup.
function Drop({ root, current, id, href, label, toggleLabel, entries, live }: DropProps) {
  const open = live ? live.menu !== "closed" : false;
  // Focus moving in from outside opens the menu and moving out closes it;
  // moves inside it (Escape sending focus back to the chevron) change nothing.
  const inside = (event: FocusEvent) => live?.drop.current?.contains(event.relatedTarget as Node | null) ?? false;
  // A pointer click while hovering has the menu open keeps it open; a key
  // press (detail 0) and every other click toggle it.
  const toggle = (event: MouseEvent) => {
    if (!live) return;
    if (live.menu === "open" && event.detail > 0) live.setMenu("pinned");
    else live.setMenu(open ? "closed" : "pinned");
  };
  return (
    <div
      className="site-nav-drop"
      data-open={live ? String(open) : undefined}
      ref={live?.drop}
      onMouseEnter={() => {
        if (live?.menu === "closed") live.setMenu("open");
      }}
      onMouseLeave={() => {
        if (live?.menu === "open" && !live.drop.current?.contains(document.activeElement)) live.setMenu("closed");
      }}
      onFocus={(event) => {
        if (live?.menu === "closed" && !inside(event)) live.setMenu("open");
      }}
      onBlur={(event) => {
        if (live && !inside(event)) live.setMenu("closed");
      }}
    >
      <a href={href}>{label}</a>
      <button
        aria-controls={id}
        aria-expanded={open}
        aria-label={toggleLabel}
        className="site-nav-toggle"
        ref={live?.toggle}
        type="button"
        onClick={toggle}
      >
        <svg aria-hidden="true" viewBox="0 0 10 10">
          <path d="M2 3.5 5 6.5 8 3.5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" />
        </svg>
      </button>
      <ul className="site-nav-menu" id={id}>
        {entries.map((post) => (
          <Entry key={post.href} post={post} root={root} current={current} />
        ))}
      </ul>
    </div>
  );
}

// The nav's markup; without `live` it is the server markup.
function Nav({ root, current, live }: Props & { live?: { posts: Live; games: Live } }) {
  return (
    <nav className="site-nav" aria-label="Site">
      <a href={root} aria-current={here(current, "home")}>
        Home
      </a>
      <Drop root={root} current={current} id="site-nav-menu" href={`${root}#weeks`} label="Posts" toggleLabel="Show all posts" entries={POSTS} live={live?.posts} />
      <Drop root={root} current={current} id="site-nav-games-menu" href={`${root}#games`} label="Games" toggleLabel="Show all games" entries={GAME_ENTRIES} live={live?.games} />
      <a href={`${root}#about`}>About</a>
    </nav>
  );
}

// One menu's state: Escape or a click outside it closes it, and Escape with
// focus inside it sends focus back to its chevron.
function useMenu(): Live {
  const [menu, setMenu] = useState<Menu>("closed");
  const drop = useRef<HTMLDivElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);
  useOutsideClose(
    [drop],
    (event) => {
      if (menu === "closed") return;
      setMenu("closed");
      if (event.type === "keydown" && drop.current?.contains(document.activeElement)) toggle.current?.focus();
    },
    { escape: true },
  );
  return { menu, setMenu, drop, toggle };
}

function SiteNavView({ root, current }: Props) {
  const hydrated = useHydrated();
  const posts = useMenu();
  const games = useMenu();
  return <Nav root={root} current={current} live={hydrated ? { posts, games } : undefined} />;
}

function SiteNavPlaceholder({ root, current }: Props) {
  return <Nav root={root} current={current} />;
}

export const SiteNav = island("site/nav/SiteNav", SiteNavView, SiteNavPlaceholder, { roots: [".site-nav"] });
