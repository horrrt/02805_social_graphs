// Marvel character portraits, served from the site itself (public/play/cold-read/portraits/,
// written by analysis/week06_portraits.py). PORTRAIT_ORDER is the toggle: the site
// shows the first source that has a page, and initials when none does.
import { asset } from "@/scripts/site.js";
import { PORTRAIT_SOURCES } from "./portraits.generated";

export type PortraitSource = keyof typeof PORTRAIT_SOURCES;

/** Sources in the order the game tries them. */
export const PORTRAIT_ORDER: PortraitSource[] = ["wikipedia", "marveldb"];

const has = Object.fromEntries(
  Object.entries(PORTRAIT_SOURCES).map(([source, titles]) => [source, new Set<string>(titles)]),
) as Record<PortraitSource, Set<string>>;

/** The file name the script gives a page: "Ghost Rider (Danny Ketch)" -> "ghost-rider-danny-ketch". */
export const portraitSlug = (title: string) =>
  title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

/** The source a page's portrait comes from, or null when it shows initials. */
export function portraitSource(title: string, order: readonly PortraitSource[] = PORTRAIT_ORDER): PortraitSource | null {
  return order.find((source) => has[source].has(title)) ?? null;
}

/** The root-relative URL of a page's portrait, or null when it shows initials. Root-relative, not
 *  asset()'s absolute href: a server-rendered section has no page origin, and hydration keeps the
 *  server's src. */
export function portrait(title: string, order: readonly PortraitSource[] = PORTRAIT_ORDER): string | null {
  const source = portraitSource(title, order);
  if (!source) return null;
  const url = asset(`play/cold-read/portraits/${source}/${portraitSlug(title)}.webp`);
  return url.pathname + url.search;
}
