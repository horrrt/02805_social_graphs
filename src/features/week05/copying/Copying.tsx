"use client";
// Section 2's slots, which week05-copying.js drew into on main: the copying
// network (#chart-copying-network), the linked-share strip
// (#chart-copying-linked), the cluster table (#copying-clusters) and the
// passages we checked (#copying-passages). Each renders as the server did until
// hydrated and draws once copying.json has loaded, the one file main awaited.
// The network's draw empties its host of the swept tip (tip "none"); a hover on
// a line puts the tip back with its passage. A failed copying.json leaves every
// part as the server rendered it, the chart hosts swept, and logs one line.
import { Fragment } from "react";
import { NetworkView, Passage, StripChart, Table, type NetworkSpec } from "@/kit";
import type { StripOptions, StripRow } from "@/kit/StripChart";
import type { TableSpec } from "@/kit/Table";
import { island } from "@/lib/island";
import { COPYING, clusters, linked, network, passages } from "@/scripts/week05-copying.js";
import { ChartHost, ServerHost } from "../map/ChartHost";
import { useSectionPart } from "../map/useSectionPart";

type Data = Parameters<typeof network>[0];

function useCopying<T>(build: (data: Data) => unknown) {
  return useSectionPart<Data, T>(COPYING, "copying", build);
}

const NETWORK_HOST = "chart-copying-network";
const LINKED = "chart-copying-linked";

function NetworkPart() {
  const { hydrated, part } = useCopying<NetworkSpec>(network);
  return (
    <ChartHost id={NETWORK_HOST} hydrated={hydrated} tip={part ? "none" : "first"} redraws={part ? 1 : 0}>
      {part ? <NetworkView spec={part} /> : null}
    </ChartHost>
  );
}

function LinkedPart() {
  const { hydrated, part } = useCopying<{ rows: StripRow[]; opts: StripOptions }>(linked);
  return <ChartHost id={LINKED} hydrated={hydrated}>{part ? <StripChart rows={part.rows} opts={part.opts} /> : null}</ChartHost>;
}

function ClustersPart() {
  const { part } = useCopying<TableSpec>(clusters);
  return <div id="copying-clusters">{part ? <Table {...part} /> : null}</div>;
}

type Shown = { head: string; page: string; text: string }[];

function PassagesPart() {
  const { part } = useCopying<Shown>(passages);
  return (
    <div id="copying-passages">
      {part?.map((s, i) => (
        <Fragment key={i}>
          <p className="fineprint">{s.head}</p>
          <Passage page={s.page} text={s.text} />
        </Fragment>
      ))}
    </div>
  );
}

const HOSTS = {
  network: () => <ServerHost id={NETWORK_HOST} />,
  linked: () => <ServerHost id={LINKED} />,
  clusters: () => <ServerHost id="copying-clusters" />,
  passages: () => <ServerHost id="copying-passages" />,
};

// One island per part, so a fault in one leaves the others alone.
const PARTS = {
  network: island("week05/copying/Network", NetworkPart, HOSTS.network, { roots: [`#${NETWORK_HOST}`] }),
  linked: island("week05/copying/Linked", LinkedPart, HOSTS.linked, { roots: [`#${LINKED}`] }),
  clusters: island("week05/copying/Clusters", ClustersPart, HOSTS.clusters, { roots: ["#copying-clusters"] }),
  passages: island("week05/copying/Passages", PassagesPart, HOSTS.passages, { roots: ["#copying-passages"] }),
};

type Props = { part: keyof typeof PARTS };

function View({ part }: Props) {
  const Part = PARTS[part];
  return <Part />;
}

function Placeholder({ part }: Props) {
  const Host = HOSTS[part];
  return <Host />;
}

// The section renders <Copying part="network" />, "linked", "clusters" and
// "passages": one client reference in the page's payload, wrapping each part's
// own island.
export const Copying = island("week05/copying/Copying", View, Placeholder, {
  roots: [`#${NETWORK_HOST}`, `#${LINKED}`, "#copying-clusters", "#copying-passages"],
});
