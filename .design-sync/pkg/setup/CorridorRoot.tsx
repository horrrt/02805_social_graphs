import type { ReactNode } from "react";

/**
 * The root every kit component expects. It puts the `corridor` class on
 * <body>, where the colour tokens (`--ink`, `--ground`, `--card`, the series
 * colours) live and where the charts read them. By default it also renders
 * `<main class="shell">`, the centred 1180px column that tables need for their
 * card styling (`.corridor main table`). With `page`, it renders its children
 * as they are, for a whole post laid out as the site does: SkipLink and
 * PostTopbar, then your own `<main id="main">` holding a full-width PostHero
 * and `<div className="shell">` columns, then SiteFooter. Use it once.
 */
export default function CorridorRoot({ children, page = false }: { children?: ReactNode; page?: boolean }) {
  if (typeof document !== "undefined") document.body.classList.add("corridor");
  return page ? <>{children}</> : <main className="shell">{children}</main>;
}
