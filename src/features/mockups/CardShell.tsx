"use client";
// A concept card's <article>, around its server markup: hidden when the
// active filter leaves it out, and its three [data-open-mockup] links open
// the viewer instead of the image, unless a modifier key asks for a new tab,
// as mockups.js wired them on main.
import type { MouseEvent, ReactNode } from "react";
import { useStore } from "@/lib/useStore";
import { openMockup, review, visible } from "./store.js";

type State = Parameters<typeof visible>[0];

export function CardShell({ n, className = "mockup-card", children }: { n: number; className?: string; children: ReactNode }) {
  const shown = useStore(review, (s: State) => visible(s, n));
  const onClick = (event: MouseEvent<HTMLElement>) => {
    const link = (event.target as Element).closest("[data-open-mockup]");
    if (!link || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || typeof HTMLDialogElement.prototype.showModal !== "function") return;
    event.preventDefault();
    openMockup(Number((link as HTMLElement).dataset.openMockup));
  };
  return (
    <article className={className} data-mockup={n} id={`card-${n}`} hidden={!shown} onClick={onClick}>
      {children}
    </article>
  );
}
