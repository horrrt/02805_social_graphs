"use client";

// The section rail down the left margin, as Week 4 draws it (nav.w4-rail; the
// styles are in post.css). One dot per section, with its questions as small
// dots under it; the section in view is current and opens its questions.
// Hovering or focusing the rail shows every name, in a panel sized to the
// widest one. Week 4's static page wires the same markup in week04-frame.js.
import { type CSSProperties, useCallback, useEffect, useMemo, useRef, useState } from "react";

export type RailItem = { target: string; label: string; children?: RailItem[] };

// Each target in page order, with the targets of the items that hold it.
function flatten(items: RailItem[], parents: string[] = []): { target: string; path: string[] }[] {
  return items.flatMap((item) => {
    const path = [...parents, item.target];
    return [{ target: item.target, path }, ...flatten(item.children ?? [], path)];
  });
}

function RailList({ items, open }: { items: RailItem[]; open: Set<string> }) {
  return (
    <ol>
      {items.map((item) => {
        const current = open.has(item.target);
        return (
          <li className={current ? "is-current" : undefined} data-target={item.target} key={item.target}>
            <a aria-current={current ? "true" : undefined} aria-label={item.label} href={`#${item.target}`}>
              <span aria-hidden="true" className="w4-rail-label">{item.label}</span>
            </a>
            {item.children?.length ? <RailList items={item.children} open={open} /> : null}
          </li>
        );
      })}
    </ol>
  );
}

export function SectionRail({ items, label = "Contents of this post" }: { items: RailItem[]; label?: string }) {
  const ref = useRef<HTMLElement>(null);
  const flat = useMemo(() => flatten(items), [items]);
  const [open, setOpen] = useState<Set<string>>(() => new Set());
  const [panel, setPanel] = useState<number | null>(null);

  const fit = useCallback(() => {
    const rail = ref.current;
    if (!rail) return;
    const left = rail.getBoundingClientRect().left;
    let right = 0;
    for (const span of rail.querySelectorAll<HTMLElement>(".w4-rail-label")) {
      if (span.offsetParent) right = Math.max(right, span.getBoundingClientRect().right);
    }
    if (right) setPanel(Math.ceil(right - left) + 40);
  }, []);

  useEffect(() => {
    let frame = 0;
    const mark = () => {
      frame = 0;
      const line = window.innerHeight * 0.35;
      let path: string[] = [];
      for (const entry of flat) {
        const target = document.getElementById(entry.target);
        // A closed drawer, or a box inside one, has no place on screen to pass.
        if (!target || target.closest("details:not([open])")) continue;
        if (target.getBoundingClientRect().top <= line) path = entry.path;
      }
      setOpen((old) => (old.size === path.length && path.every((t) => old.has(t)) ? old : new Set(path)));
    };
    const queue = () => {
      if (!frame) frame = requestAnimationFrame(mark);
    };
    document.addEventListener("scroll", queue, { passive: true });
    window.addEventListener("resize", queue);
    // toggle does not bubble; the capture phase also sees drawers built later.
    document.addEventListener("toggle", queue, true);
    mark();
    return () => {
      if (frame) cancelAnimationFrame(frame);
      document.removeEventListener("scroll", queue);
      window.removeEventListener("resize", queue);
      document.removeEventListener("toggle", queue, true);
    };
  }, [flat]);

  // Which questions show depends on the section in view, so refit an open panel when it changes.
  useEffect(() => {
    if (ref.current?.matches(":hover, :focus-within")) fit();
  }, [open, fit]);

  const refit = () => requestAnimationFrame(fit);
  const style = panel ? ({ "--w4-rail-panel": `${panel}px` } as CSSProperties) : undefined;
  return (
    <nav aria-label={label} className="w4-rail" onFocus={refit} onMouseEnter={refit} ref={ref} style={style}>
      <RailList items={items} open={open} />
    </nav>
  );
}
