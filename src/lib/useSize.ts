// surface: measures rendered elements with ResizeObserver and getComputedStyle
// Sizes of rendered elements, for charts drawn at the width they get.
import { useEffect, useRef, useState, type RefObject } from "react";

export type Size = { width: number; height: number };

/** The element's content box, null until the first measurement after mount. */
export function useElementSize(ref: RefObject<Element | null>): Size | null {
  const [size, setSize] = useState<Size | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setSize((s) => (s && s.width === width && s.height === height ? s : { width, height }));
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref]);
  return size;
}

/**
 * The width a chart may take inside its parent: the content box, in whole px.
 * 0 when the parent is hidden or lays its children out in a row, where the
 * parent's width is not the chart's. week04-strip.js roomFor().
 */
function roomFor(el: Element | null): number {
  const parent = el?.parentElement;
  if (!parent) return 0;
  const cs = getComputedStyle(parent);
  if (cs.display.includes("flex") && cs.flexDirection.startsWith("row")) return 0;
  return Math.floor(parent.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight));
}

/**
 * The width to draw a chart at, as week04-strip.js fitted(): the fallback
 * first (the server render, and a parent still hidden in a closed drawer),
 * then the parent's room in the frame after each resize of the parent,
 * whenever that room is above 0 and differs from the width drawn. A redraw
 * only follows a change of width, so the new chart's height cannot set off
 * another.
 */
export function useFittedWidth(ref: RefObject<Element | null>, fallback: number): number {
  const [width, setWidth] = useState(fallback);
  const drawn = useRef(fallback);
  useEffect(() => {
    const el = ref.current;
    const parent = el?.parentElement;
    if (!el || !parent) return;
    let frame = 0;
    const redraw = () => {
      frame = 0;
      const room = roomFor(el);
      if (room <= 0 || room === drawn.current) return;
      drawn.current = room;
      setWidth(room);
    };
    const observer = new ResizeObserver(() => {
      if (!frame) frame = requestAnimationFrame(redraw);
    });
    observer.observe(parent);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [ref]);
  return width;
}
