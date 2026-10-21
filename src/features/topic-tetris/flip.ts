// Moves for the tiles that change group: every element under `root` with a
// data-flip id slides from where it stood at the last change of `key` to where
// it stands now (the FLIP technique, on the Web Animations API). Nothing moves
// under prefers-reduced-motion or where the browser lacks element.animate.
import { type RefObject, useLayoutEffect, useRef } from "react";

export const reducedMotion = () =>
  typeof window !== "undefined" && typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export function useFlip(root: RefObject<HTMLElement | null>, key: unknown, ms = 650) {
  const before = useRef(new Map<string, DOMRect>());
  useLayoutEffect(() => {
    const el = root.current;
    if (!el) return;
    const still = reducedMotion();
    for (const item of el.querySelectorAll<HTMLElement>("[data-flip]")) {
      const id = item.dataset.flip!;
      const now = item.getBoundingClientRect();
      const was = before.current.get(id);
      before.current.set(id, now);
      if (!was || still || typeof item.animate !== "function") continue;
      const dx = was.left - now.left;
      const dy = was.top - now.top;
      if (Math.abs(dx) + Math.abs(dy) < 1) continue;
      item.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: "none" }], { duration: ms, easing: "cubic-bezier(.2,.75,.25,1)" });
    }
  }, [key]);
}
