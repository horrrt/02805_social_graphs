// A Marvel character's portrait (see portraits.ts), or the initials of the name
// when no source has one. Face is the bare image for a frame the caller styles
// (Cold Read's .cr-face); Portrait is the framed face the posts use, round in a
// row or a rounded tile on a card; PortraitStack overlaps a few faces for a
// sentence that names several characters at once. All take a
// page title or a page id ("Thor_(Marvel_Comics)"); the lookup needs the full
// title, so never pass a name with its bracket stripped. Style: portrait.css.
import "@/styles/portrait.css";
import { portrait } from "./portraits";

const title = (page: string) => page.replaceAll("_", " ");

export const initials = (name: string) =>
  title(name)
    .replace(/\s*\(.*\)\s*/g, " ")
    .split(/[\s-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");

/** <Face name="Hulk" />: the portrait <img>, or the initials in a <span>. */
export function Face({ name }: { name: string }) {
  const src = portrait(title(name));
  return src ? <img src={src} alt="" loading="lazy" /> : <span aria-hidden="true">{initials(name)}</span>;
}

type Size = "xs" | "s" | "m" | "l";

/** <Portrait page="Thor_(Marvel_Comics)" size="s" shape="round" />; optional: draw nothing when no source has the page. */
export default function Portrait({ page, size = "s", shape = "round", optional = false }: { page: string; size?: Size; shape?: "round" | "tile"; optional?: boolean }) {
  if (optional && !portrait(title(page))) return null;
  return (
    <span className="kit-portrait" data-size={size} data-shape={shape} aria-hidden="true">
      <Face name={page} />
    </span>
  );
}

/** <PortraitStack pages={[…]} max={5} />: the first `max` faces, overlapping, then "+n" for the rest. */
export function PortraitStack({ pages, max = 5, size = "s" }: { pages: string[]; max?: number; size?: Size }) {
  const extra = pages.length - max;
  return (
    <span className="kit-portrait-stack" aria-hidden="true">
      {pages.slice(0, max).map((page) => (
        <Portrait key={page} page={page} size={size} />
      ))}
      {extra > 0 ? <span className="kit-portrait" data-size={size}>{`+${extra}`}</span> : null}
    </span>
  );
}
