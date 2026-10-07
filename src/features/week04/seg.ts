// The keyboard every Week 4 segmented control has (week04-frame.js
// wireSegments, as SegmentedControl in components/post has it), for the
// groups whose buttons carry more than SegmentedControl renders: Tab reaches
// the group once, on its pressed button, and ArrowLeft, ArrowRight, Home and
// End move to another button and press it.
import type { KeyboardEvent } from "react";

const KEYS = new Set(["ArrowLeft", "ArrowRight", "Home", "End"]);

/** onKeyDown for the group element. */
export function segKeyDown(event: KeyboardEvent<HTMLElement>) {
  if (!KEYS.has(event.key) || event.defaultPrevented) return;
  const target = event.target as HTMLElement;
  if (target.tagName !== "BUTTON") return;
  const group = [...event.currentTarget.querySelectorAll("button")].filter((b) => !b.disabled && !b.hidden);
  const i = group.indexOf(target as HTMLButtonElement);
  if (i < 0 || !group.length) return;
  const n = group.length;
  const next = { ArrowLeft: group[(i - 1 + n) % n], ArrowRight: group[(i + 1) % n], Home: group[0], End: group[n - 1] }[event.key]!;
  event.preventDefault();
  next.focus();
  next.click();
}

/** The button's tabIndex: 0 on the pressed one, -1 on the rest; undefined before hydration. */
export const segTab = (hydrated: boolean, pressed: boolean) => (hydrated ? (pressed ? 0 : -1) : undefined);
