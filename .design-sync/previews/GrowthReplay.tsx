import { useLayoutEffect, useRef, type ReactNode } from "react";
import { GrowthReplay } from "log-log-legends-kit";
import { REPLAY_N, replayCard, replayModes } from "@/features/kit-page/toy-growth";

// Moves the time scrubber to `t`, as a reader dragging it would.
function At({ t, children }: { t: number; children: ReactNode }) {
  const box = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const input = box.current?.querySelector<HTMLInputElement>("input[type=range]");
    if (!input) return;
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(input, String(t));
    input.dispatchEvent(new Event("input", { bubbles: true }));
  }, [t]);
  return <div ref={box}>{children}</div>;
}

// The kit page's replay: one toy network of 150 nodes in the order of its toy
// debut years, against preferential attachment and uniform growth
// (src/features/kit-page/toy-growth.ts). Scrubbed to node 90.
export const Midway = () => (
  <At t={90}>
    <GrowthReplay modes={replayModes} card={replayCard} seed={3} />
  </At>
);
