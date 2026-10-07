// Whether the reader asked for less motion, read after hydration (false on
// the server and the first client render) and followed when it changes.
import { useEffect, useState } from "react";

export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const read = () => setReduced(query.matches);
    read();
    const controller = new AbortController();
    query.addEventListener("change", read, { signal: controller.signal });
    return () => controller.abort();
  }, []);
  return reduced;
}

/** Whether the element is on screen (true until first observed), for pausing work nobody sees. */
export function useOnScreen(ref: { current: Element | null }): boolean {
  const [on, setOn] = useState(true);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(([entry]) => setOn(entry.isIntersecting));
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref]);
  return on;
}
