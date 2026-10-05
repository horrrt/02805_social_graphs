// A [id^="chart-"] host of sections 1, 2 and 4, as main's hover-tip sweep left
// it (HOVERTIPS.md). Until hydrated it is the server's empty div; from then on a
// HoverTipHost: the kit-tip-host class and a hidden tip before the chart
// ("first"), or, for a host whose draw emptied it, no tip until a hover
// ("none"; pass redraws so the tip leaves on each draw). Both are OwnedHost
// (W5-1's shim), marked as React's in the hydration commit, so the W5-1 compat
// sweep never gives them a second tip.
import type { ReactNode } from "react";
import HoverTipHost from "@/kit/HoverTipHost";
import { OwnedHost } from "../frame/OwnedHost";

// HoverTipHost takes a tag name; the host's element is OwnedHost.
const OWNED = OwnedHost as unknown as string;

/** The host as the server renders it. */
export function ServerHost({ id }: { id: string }) {
  return <OwnedHost id={id} />;
}

type Props = {
  id: string;
  hydrated: boolean;
  tip?: "first" | "none";
  redraws?: string | number;
  children?: ReactNode;
};

/** <ChartHost id="chart-relations-crossing" hydrated={hydrated}>{chart}</ChartHost> */
export function ChartHost({ id, hydrated, tip = "first", redraws, children }: Props) {
  if (!hydrated) return <ServerHost id={id} />;
  return (
    <HoverTipHost as={OWNED} id={id} tip={tip} redraws={redraws}>
      {children}
    </HoverTipHost>
  );
}
