"use client";
// Section 7's slots, which week05-weird.js drew into on main: the scatter with
// its drawer of all pages (#chart-weird-scatter), the top and bottom five as
// read (#weird-table) and the quoted sentences (#weird-passages). Each renders
// as the server did until hydrated and draws once weird.json has loaded, the
// one file main awaited. The scatter's host is swept as main's hover-tip sweep
// left it (a hidden tip first); its band, its neighbour line and its 303 dots
// carry their tips as data-tip. Main's fitted() redrew only the svg at a new
// width, so the drawer after it keeps its state across a resize. A failed
// weird.json leaves every part as the server rendered it, the chart host
// swept, and logs one line.
import { Fragment, useMemo, useRef } from "react";
import { Passage, Table } from "@/kit";
import { Tipped } from "@/kit/HoverTipHost";
import type { Measure } from "@/kit/StripChart";
import type { TableSpec } from "@/kit/Table";
import { Drawer } from "@/components/post/Drawer";
import { Drawers } from "@/components/post/Drawers";
import { island } from "@/lib/island";
import { useFittedWidth } from "@/lib/useSize";
import { useTextMeasure, useTokens, useTypeScale, type TypeScale } from "@/lib/useTypeScale";
import { IDS, SCATTER_TOKENS, WEIRD, allPages, passages, readTable, scatterLayout } from "@/scripts/week05-weird.js";
import { ChartHost, ServerHost } from "../map/ChartHost";
import { useSectionPart } from "../map/useSectionPart";

type Data = Parameters<typeof readTable>[0];
type Tick = { x?: number; y?: number; x1?: number; x2?: number; y1?: number; y2?: number; labelX?: number; labelY: number; label: string };
type Layout = {
  width: number;
  height: number;
  aria: string;
  xTicks: Tick[];
  yTicks: Tick[];
  xTitle: { x: number; y: number; text: string };
  yTitle: { x: number; y: number; text: string; transform: string };
  band: { points: string; tip: string };
  bandMean: string;
  near: { points: string; tip: string };
  dots: { cx: string; cy: string; r: number; colour: string; opacity: number; stroke: string | null; tip: string }[];
  labels: { x: number; y: number; anchor: "start" | "end"; text: string }[];
};

function useWeird<T>(build: (data: Data) => unknown) {
  return useSectionPart<Data, T>(WEIRD, "weird", build);
}

// ---- the scatter and its drawer ------------------------------------------------------

const same = (data: Data) => data;

function ScatterSvg({ data, scale, measure, tokens }: { data: Data; scale: TypeScale; measure: Measure; tokens: Record<string, string> }) {
  const ref = useRef<SVGSVGElement>(null);
  const width = useFittedWidth(ref, 560);
  const L = useMemo(() => scatterLayout(data, width, measure) as Layout, [data, width, measure]);
  const caption = scale.fs("caption");
  const t = (name: string) => tokens[name];
  return (
    <svg ref={ref} viewBox={`0 0 ${L.width} ${L.height}`} width={L.width} height={L.height} role="img" aria-label={L.aria}>
      <Fragment key={width}>
        {L.xTicks.map((k, i) => (
          <Fragment key={`x${i}`}>
            <line x1={k.x} x2={k.x} y1={k.y1} y2={k.y2} stroke={t("--line-soft")} />
            <text x={k.x} y={k.labelY} fontSize={caption} fill={t("--ink-mute")} textAnchor="middle">
              {k.label}
            </text>
          </Fragment>
        ))}
        {L.yTicks.map((k, i) => (
          <Fragment key={`y${i}`}>
            <line x1={k.x1} x2={k.x2} y1={k.y} y2={k.y} stroke={t("--line-soft")} />
            <text x={k.labelX} y={k.labelY} fontSize={caption} fill={t("--ink-mute")} textAnchor="end">
              {k.label}
            </text>
          </Fragment>
        ))}
        <text x={L.xTitle.x} y={L.xTitle.y} fontSize={caption} fill={t("--ink-soft")} textAnchor="middle">
          {L.xTitle.text}
        </text>
        <text x={L.yTitle.x} y={L.yTitle.y} fontSize={caption} fill={t("--ink-soft")} textAnchor="middle" transform={L.yTitle.transform}>
          {L.yTitle.text}
        </text>
        <Tipped tag="polygon" tip={L.band.tip} points={L.band.points} fill={t("--line")} opacity={0.55} />
        <polyline points={L.bandMean} fill="none" stroke={t("--ink-mute")} strokeDasharray="4 3" />
        <Tipped tag="polyline" tip={L.near.tip} points={L.near.points} fill="none" stroke={t("--ink-soft")} strokeWidth={1.5} opacity={0.8} />
        {L.dots.map((d, i) => (
          <Tipped
            key={`d${i}`}
            tag="circle"
            tip={d.tip}
            cx={d.cx}
            cy={d.cy}
            r={d.r}
            fill={t(d.colour)}
            opacity={d.opacity}
            stroke={d.stroke ? t(d.stroke) : "none"}
            strokeWidth={1.5}
          />
        ))}
        {L.labels.map((k, i) => (
          <text key={`n${i}`} x={k.x} y={k.y} fontSize={caption} fill={t("--ink-soft")} textAnchor={k.anchor}>
            {k.text}
          </text>
        ))}
      </Fragment>
    </svg>
  );
}

function Scatter({ data }: { data: Data }) {
  const scale = useTypeScale();
  const measure = useTextMeasure();
  const tokens = useTokens(SCATTER_TOKENS);
  if (!scale || !measure || !tokens) return null;
  return <ScatterSvg data={data} scale={scale} measure={measure} tokens={tokens} />;
}

function ScatterPart() {
  const { hydrated, part } = useWeird<Data>(same);
  const pages = useMemo(() => (part ? (allPages(part) as { label: string; table: TableSpec }) : null), [part]);
  return (
    <ChartHost id={IDS.scatter} hydrated={hydrated}>
      {part ? <Scatter data={part} /> : null}
      {pages ? (
        <Drawers variant="foot">
          <Drawer label={pages.label}>
            <Table {...pages.table} />
          </Drawer>
        </Drawers>
      ) : null}
    </ChartHost>
  );
}

// ---- the top and bottom five, and the passages ------------------------------------------

function TablePart() {
  const { part } = useWeird<TableSpec>(readTable);
  return <div id={IDS.table}>{part ? <Table {...part} /> : null}</div>;
}

type Shown = { head: string; page: string; text: string }[];

function PassagesPart() {
  const { part } = useWeird<Shown>(passages);
  return (
    <div id={IDS.passages}>
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
  scatter: () => <ServerHost id={IDS.scatter} />,
  table: () => <ServerHost id={IDS.table} />,
  passages: () => <ServerHost id={IDS.passages} />,
};

// One island per part, so a fault in one leaves the others alone.
const PARTS = {
  scatter: island("week05/weird/Scatter", ScatterPart, HOSTS.scatter, { roots: [`#${IDS.scatter}`] }),
  table: island("week05/weird/Table", TablePart, HOSTS.table, { roots: [`#${IDS.table}`] }),
  passages: island("week05/weird/Passages", PassagesPart, HOSTS.passages, { roots: [`#${IDS.passages}`] }),
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

// The section renders <Weird part="scatter" />, "table" and "passages": one
// client reference in the page's payload, wrapping each part's own island.
export const Weird = island("week05/weird/Weird", View, Placeholder, {
  roots: [`#${IDS.scatter}`, `#${IDS.table}`, `#${IDS.passages}`],
});
