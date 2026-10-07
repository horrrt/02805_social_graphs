"use client";
// The deep dive's server markup with the attributes the router keeps in the
// deep-dive store: a panel of script-built boxes with its data-show
// (#cut-skills, #cut-pagerank), and a contents entry with aria-current while
// its box is on show. The server and the hydration render carry neither, as
// main's server markup did not.
import type { ReactNode } from "react";
import { useStore } from "@/lib/useStore";
import { deep } from "./deep";

type PanelProps = { className: string; box: string; id: string; name: string; children?: ReactNode };

/** <DeepPanel className="qa cut rx-panel" box="cut-skills" id="cut-skills" name="w4-panel-jobs">…</DeepPanel> */
export function DeepPanel({ className, box, id, name, children }: PanelProps) {
  const show = useStore(deep, (s) => s.show[id]);
  return (
    <details className={className} data-box={box} id={id} name={name} data-show={show}>
      {children}
    </details>
  );
}

/** <TocItem href="#cut-skills" target="cut-skills-direct">…</TocItem> */
export function TocItem({ href, target, children }: { href: string; target?: string; children?: ReactNode }) {
  const id = target ?? decodeURIComponent(href.slice(1));
  const current = useStore(deep, (s) => s.current.includes(id));
  return (
    <a className="rx-toc-item" href={href} data-target={target} aria-current={current ? "true" : undefined}>
      {children}
    </a>
  );
}
