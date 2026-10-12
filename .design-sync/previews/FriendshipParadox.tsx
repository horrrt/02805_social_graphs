import { useLayoutEffect, useRef, type ReactNode } from "react";
import { FriendshipParadox } from "log-log-legends-kit";
import { paradoxNets } from "@/features/kit-page/toy-growth";

// Presses "Sample 1,000" once, as a reader would, so the histograms fill.
function Sampled({ children }: { children: ReactNode }) {
  const box = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const btn = [...(box.current?.querySelectorAll("button") ?? [])].find((b) => b.textContent?.includes("1,000"));
    btn?.click();
  }, []);
  return <div ref={box}>{children}</div>;
}

// The kit page's sampler on a toy scale-free network: Barabási–Albert, 300
// nodes, m = 2 (src/features/kit-page/toy-growth.ts), after 1,000 samples.
export const ScaleFree = () => (
  <Sampled>
    <FriendshipParadox n={300} edges={paradoxNets["scale-free"].edges} seed={4} />
  </Sampled>
);
