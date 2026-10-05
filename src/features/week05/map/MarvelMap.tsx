// The Marvel map that sections 1 and 4 share (week05-map.js), drawn by
// NetworkView into its chart host. network.json loads once for both (useData)
// and only once the section's own file has loaded (`after`), as each section
// called loadNetwork() after its own await on main. Until the map draws, the
// host is swept and holds a hidden tip; the draw empties it (tip "none"), and a
// new `mark` draws a new view, as marvelMap() replaced the host's content. A
// failed network.json leaves the swept host and logs main's line.
import { useEffect, useMemo } from "react";
import { NetworkView, type NetworkSpec } from "@/kit";
import { useData, type DataState } from "@/lib/useData";
import { useStore } from "@/lib/useStore";
import { asset } from "@/scripts/site.js";
import { NETWORK, mapSpec } from "@/scripts/week05-map.js";
import { ChartHost } from "./ChartHost";
import { network } from "./store.js";

type Net = Parameters<typeof mapSpec>[0];

type Props = {
  id: string;
  hydrated: boolean;
  after: boolean;
  mark?: string;
  options?: Record<string, unknown>;
};

const failedOnce = (s: { error: unknown }) => s.error;

/**
 * network.json for a map, once the section's own file has loaded (`after`).
 * main's loadNetwork() kept its one promise, a rejected one too, so a map that
 * asks after the file failed takes the failure without a second request; the
 * shared data cache would fetch again (store.js keeps the failure).
 */
export function useNetworkData(hydrated: boolean, after: boolean): DataState<Net> {
  const failed = useStore(network, failedOnce);
  const net = useData<Net>(hydrated && after && failed === undefined ? asset(NETWORK) : null);
  useEffect(() => {
    if (net.status === "error") network.setState({ error: net.error });
  }, [net]);
  return failed === undefined ? net : { status: "error", data: undefined, error: failed };
}

/** useNetworkData, logging main's line when the file fails. */
function useNetwork(hydrated: boolean, after: boolean) {
  const net = useNetworkData(hydrated, after);
  useEffect(() => {
    if (net.status === "error") console.error("week05 map failed", net.error);
  }, [net.status, net.error]);
  return net;
}

/** <MarvelMap id="chart-relations-map" hydrated={hydrated} after={ready} mark="enemy" options={{ aria }} /> */
export function MarvelMap({ id, hydrated, after, mark, options }: Props) {
  const net = useNetwork(hydrated, after);
  const spec = useMemo(
    () => (net.data ? (mapSpec(net.data, { mark, ...options }) as unknown as NetworkSpec) : null),
    [net.data, mark, options],
  );
  return (
    <ChartHost id={id} hydrated={hydrated} tip={spec ? "none" : "first"} redraws={spec ? (mark ?? 1) : 0}>
      {spec ? <NetworkView key={mark ?? ""} spec={spec} /> : null}
    </ChartHost>
  );
}
