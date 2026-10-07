// A character's portrait (see portraits.ts), or the initials of the name when no source has one.
import { portrait } from "./portraits";

export const initials = (name: string) =>
  name
    .replace(/\s*\(.*\)\s*/g, " ")
    .split(/[\s-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");

export function Face({ name }: { name: string }) {
  const src = portrait(name);
  return src ? <img src={src} alt="" loading="lazy" /> : <span aria-hidden="true">{initials(name)}</span>;
}
