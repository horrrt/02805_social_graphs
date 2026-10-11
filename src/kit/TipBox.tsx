// A chart tooltip inside its host, as tips.js tipBox() draws it: div.kit-tip,
// hidden until the first show, the first line bold and the rest in spans,
// placed 14px right of and below the pointer and kept inside the host's width.
// Hiding keeps the last lines and position, as tipBox's hide() does. The host
// carries the kit-tip-host class (HoverTipHost adds it). Style: .kit-tip in
// post.css.
import { useLayoutEffect, useRef, useState, type RefObject } from "react";

export type Tip = { lines: string[]; x: number; y: number };

/** <TipBox host={hostRef} tip={{ lines, x: e.clientX, y: e.clientY }} />; tip null hides it. */
export default function TipBox({ host, tip }: { host: RefObject<HTMLElement | null>; tip: Tip | null }) {
  const ref = useRef<HTMLDivElement>(null);
  const [kept, setKept] = useState<Tip | null>(tip);
  if (tip && tip !== kept) setKept(tip);
  const [at, setAt] = useState<{ left: number; top: number } | null>(null);

  // tipBox show(): unhide, then measure the tip and the host and place it.
  useLayoutEffect(() => {
    const el = ref.current;
    const box = host.current?.getBoundingClientRect();
    if (!tip || !el || !box) return;
    const width = el.offsetWidth;
    const left = Math.max(0, Math.min(tip.x - box.left + 14, box.width - width));
    const top = tip.y - box.top + 14;
    setAt((a) => (a && a.left === left && a.top === top ? a : { left, top }));
  }, [tip, host]);

  const lines = (tip ?? kept)?.lines ?? [];
  return (
    <div className="kit-tip" hidden={!tip} ref={ref} style={at ? { left: at.left, top: at.top } : undefined}>
      {lines.map((line, i) => (i ? <span key={i}>{line}</span> : <b key={i}>{line}</b>))}
    </div>
  );
}
