"use client";
// Section 6's slots, which week05-fame.js drew into on main: the ECharts
// scatter (#chart-fame-scatter), the outlier table (#fame-outliers) and the
// passages (#fame-passages). Each renders as the server did until hydrated and
// draws once fame.json has loaded, the one file main awaited. The scatter is
// kit EChart with the svg renderer, as kit.js echart() initialised it, inside
// a host swept as main's hover-tip sweep left it (a hidden tip first). A
// failed fame.json leaves every part as the server rendered it, the chart host
// swept, and logs one line.
import { Fragment, useEffect, useMemo } from "react";
import { EChart, Passage, Table } from "@/kit";
import type { TableSpec } from "@/kit/Table";
import { island, useIslandReady } from "@/lib/island";
import { useData } from "@/lib/useData";
import { useHydrated } from "@/lib/useHydrated";
import { useTokens } from "@/lib/useTypeScale";
import { asset } from "@/scripts/site.js";
import { FAME, HEIGHT, SCATTER_TOKENS, outliers, passages, scatter } from "@/scripts/week05-fame.js";
import { ChartHost, ServerHost } from "../map/ChartHost";

type Data = Parameters<typeof outliers>[0];

// fame.json after hydration, built into one part, with main's one line if it fails.
function useFame<T>(build: (data: Data) => unknown) {
  const hydrated = useHydrated();
  const state = useData<Data>(hydrated ? asset(FAME) : null);
  useEffect(() => {
    if (state.status === "error") console.error("week05 fame failed", state.error);
  }, [state]);
  const part = useMemo(() => (state.data ? (build(state.data) as T) : null), [state.data, build]);
  useIslandReady(part !== null);
  return { hydrated, part };
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

const Empty = (id: string) =>
  function Host() {
    return <div id={id}></div>;
  };

const HOSTS = {
  scatter: () => <ServerHost id={SCATTER} />,
  outliers: Empty("fame-outliers"),
  passages: Empty("fame-passages"),
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
