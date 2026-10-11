"use client";
// Section 6's slots, which week05-fame.js drew into on main: the ECharts
// scatter (#chart-fame-scatter), the outlier table (#fame-outliers) and the
// passages (#fame-passages). Each renders as the server did until hydrated and
// draws once fame.json has loaded, the one file main awaited. The scatter is
// kit EChart with the svg renderer, as kit.js echart() initialised it, inside
// a host swept as main's hover-tip sweep left it (a hidden tip first). A
// failed fame.json leaves every part as the server rendered it, the chart host
// swept, and logs one line.
import { Fragment, useMemo } from "react";
import { EChart, Passage, Table } from "@/kit";
import type { TableSpec } from "@/kit/Table";
import { island } from "@/lib/island";
import { useTokens } from "@/lib/useTypeScale";
import { FAME, HEIGHT, SCATTER_TOKENS, outliers, passages, scatter } from "@/scripts/week05-fame.js";
import { ChartHost, ServerHost } from "../map/ChartHost";
import { useSectionPart } from "../map/useSectionPart";

type Data = Parameters<typeof outliers>[0];

function useFame<T>(build: (data: Data) => unknown) {
  return useSectionPart<Data, T>(FAME, "fame", build);
}

// ---- the scatter -------------------------------------------------------------------

const SCATTER = "chart-fame-scatter";
const same = (data: Data) => data;

function Scatter({ data }: { data: Data }) {
  const tokens = useTokens(SCATTER_TOKENS);
  const option = useMemo(() => (tokens ? (scatter(data, (name: string) => tokens[name]) as Record<string, unknown>) : null), [data, tokens]);
  if (!option) return null;
  return <EChart option={option} height={HEIGHT} renderer="svg" />;
}

function ScatterPart() {
  const { hydrated, part } = useFame<Data>(same);
  return <ChartHost id={SCATTER} hydrated={hydrated}>{part ? <Scatter data={part} /> : null}</ChartHost>;
}

// ---- the outlier table and the passages ------------------------------------------------

function OutliersPart() {
  const { part } = useFame<TableSpec>(outliers);
  return <div id="fame-outliers">{part ? <Table {...part} /> : null}</div>;
}

type Shown = { lead: string; reason: string; page: string; text: string; highlight: string }[];

function PassagesPart() {
  const { part } = useFame<Shown>(passages);
  return (
    <div id="fame-passages">
      {part?.map((s, i) => (
        <Fragment key={i}>
          <p className="fineprint">
            <b>{s.lead}</b>
            {s.reason}
          </p>
          <Passage page={s.page} text={s.text} highlight={s.highlight} />
        </Fragment>
      ))}
    </div>
  );
}

const HOSTS = {
  scatter: () => <ServerHost id={SCATTER} />,
  outliers: () => <ServerHost id="fame-outliers" />,
  passages: () => <ServerHost id="fame-passages" />,
};

// One island per part, so a fault in one leaves the others alone.
const PARTS = {
  scatter: island("week05/fame/Scatter", ScatterPart, HOSTS.scatter, { roots: [`#${SCATTER}`] }),
  outliers: island("week05/fame/Outliers", OutliersPart, HOSTS.outliers, { roots: ["#fame-outliers"] }),
  passages: island("week05/fame/Passages", PassagesPart, HOSTS.passages, { roots: ["#fame-passages"] }),
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

// The section renders <Fame part="scatter" />, "outliers" and "passages": one
// client reference in the page's payload, wrapping each part's own island.
export const Fame = island("week05/fame/Fame", View, Placeholder, {
  roots: [`#${SCATTER}`, "#fame-outliers", "#fame-passages"],
});
