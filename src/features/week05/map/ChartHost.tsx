// A [id^="chart-"] host of sections 1, 2 and 4, as main's hover-tip sweep left
// it (HOVERTIPS.md). Until hydrated it is the server's empty div; from then on a
// HoverTipHost: the kit-tip-host class and a hidden tip before the chart
// ("first"), or, for a host whose draw emptied it, no tip until a hover
// ("none"; pass redraws so the tip leaves on each draw).
import type { ReactNode } from "react";
import HoverTipHost from "@/kit/HoverTipHost";

/** The host as the server renders it. */
export function ServerHost({ id }: { id: string }) {
  return <div id={id} />;
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
    <HoverTipHost id={id} tip={tip} redraws={redraws}>
      {children}
    </HoverTipHost>
  );
}
