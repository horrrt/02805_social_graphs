"use client";
// Section 5's slots, which week05-heaps.js drew into on main: the curve
// (#chart-heaps-curve), the gap strip (#chart-heaps-gap), the table drawer
// (#heaps-table), the passages (#heaps-passages) and the word samples
// (#heaps-samples). Each renders as the server did until hydrated and draws
// once heaps.json has loaded, the one file main awaited. The curve host keeps
// main's two tip divs (KB07): the hover-tip sweep's, which HoverTipHost puts
// first, then the curve's own TipBox, which its hover guide shows. A failed
// heaps.json leaves every part as the server rendered it, the chart hosts
// swept, and logs one line.
import { Fragment, useEffect, useMemo, useRef, useState, type PointerEvent } from "react";
import { Passage, StripChart, Table, TipBox } from "@/kit";
import type { StripOptions, StripRow } from "@/kit/StripChart";
import type { TableSpec } from "@/kit/Table";
import type { Tip } from "@/kit/TipBox";
import { Drawer } from "@/components/post/Drawer";
import { Drawers } from "@/components/post/Drawers";
import { island, useIslandReady } from "@/lib/island";
import { useData } from "@/lib/useData";
import { useHydrated } from "@/lib/useHydrated";
import { useFittedWidth } from "@/lib/useSize";
import { useTokens, useTypeScale, type TypeScale } from "@/lib/useTypeScale";
import { asset } from "@/scripts/site.js";
import { CURVE_TOKENS, HEAPS, TABLE_LABEL, curveLayout, curveTip, gap, passages, samples, table } from "@/scripts/week05-heaps.js";
import { ChartHost, ServerHost } from "../map/ChartHost";

type Data = Parameters<typeof curveLayout>[0];
type Point = Record<string, number>;
type Layout = {
  width: number;
  height: number;
  aria: string;
  xTicks: { x: number; y1: number; y2: number; labelY: number; label: string }[];
  yTicks: { y: number; x1: number; x2: number; labelX: number; labelY: number; label: string }[];
  xTitle: { x: number; y: number; text: string };
  yTitle: { x: number; y: number; text: string };
  band: string;
  mean: string;
  fit: string;
  lines: { d: string; colour: string }[];
  guide: { y1: number; y2: number };
  marks: string[];
  overlay: { x: number; y: number; width: number; height: number };
  legend: { label: string; colour: string; x1: number; y1: number; x2: number; y2: number; dash: string; textX: number; y: number }[];
  nearest: (at: number) => Point;
  at: (p: Point) => { x: number; ys: number[] };
};

// heaps.json after hydration, built into one part, with main's one line if it fails.
function useHeaps<T>(build: (data: Data) => unknown) {
  const hydrated = useHydrated();
  const state = useData<Data>(hydrated ? asset(HEAPS) : null);
  useEffect(() => {
    if (state.status === "error") console.error("week05 heaps failed", state.error);
  }, [state]);
  const part = useMemo(() => (state.data ? (build(state.data) as T) : null), [state.data, build]);
  useIslandReady(part !== null);
  return { hydrated, part };
}

// ---- the curve -------------------------------------------------------------------

const CURVE = "chart-heaps-curve";
const same = (data: Data) => data;

// The guide as the pointer left it at one width: hidden or shown, at the last
// grid point. main's draw() built a new guide at each width, hidden and unplaced.
type Guide = { width: number; p: Point | null; shown: boolean };

function CurveSvg({ data, scale, tokens }: { data: Data; scale: TypeScale; tokens: Record<string, string> }) {
  const ref = useRef<SVGSVGElement>(null);
  const width = useFittedWidth(ref, 520);
  const L: Layout = useMemo(() => curveLayout(data, width), [data, width]);
  // The curve's own tip, tipBox(curve) on main: kept across redraws.
  const host = useMemo(() => ({ get current() { return (ref.current?.parentElement ?? null) as HTMLElement | null; } }), []);
  const [tip, setTip] = useState<Tip | null>(null);
  const [guide, setGuide] = useState<Guide>({ width, p: null, shown: false });
  const g = guide.width === width ? guide : { width, p: null, shown: false };
  const caption = scale.fs("caption");
  const t = (name: string) => tokens[name];

  const onPointerMove = (e: PointerEvent<SVGRectElement>) => {
    const ctm = ref.current?.getScreenCTM();
    if (!ctm) return;
    const at = new DOMPoint(e.clientX, e.clientY).matrixTransform(ctm.inverse()).x;
    const p = L.nearest(at);
    setGuide({ width, p, shown: true });
    setTip({ lines: curveTip(p) as string[], x: e.clientX, y: e.clientY });
  };
  const onPointerLeave = () => {
    setGuide({ ...g, shown: false });
    setTip(null);
  };
  const placed = g.p ? L.at(g.p) : null;

  return (
    <>
      <TipBox host={host} tip={tip} />
      <svg ref={ref} viewBox={`0 0 ${L.width} ${L.height}`} width={L.width} height={L.height} role="img" aria-label={L.aria}>
        <Fragment key={width}>
          {L.xTicks.map((k, i) => (
            <Fragment key={`x${i}`}>
              <line x1={k.x} y1={k.y1} x2={k.x} y2={k.y2} stroke={t("--line-soft")} />
              <text x={k.x} y={k.labelY} fontSize={caption} fill={t("--ink-mute")} textAnchor="middle">
                {k.label}
              </text>
            </Fragment>
          ))}
          {L.yTicks.map((k, i) => (
            <Fragment key={`y${i}`}>
              <line x1={k.x1} y1={k.y} x2={k.x2} y2={k.y} stroke={t("--line-soft")} />
              <text x={k.labelX} y={k.labelY} fontSize={caption} fill={t("--ink-mute")} textAnchor="end">
                {k.label}
              </text>
            </Fragment>
          ))}
          <text x={L.xTitle.x} y={L.xTitle.y} fontSize={caption} fill={t("--ink-soft")} textAnchor="end">
            {L.xTitle.text}
          </text>
          <text x={L.yTitle.x} y={L.yTitle.y} fontSize={caption} fill={t("--ink-soft")}>
            {L.yTitle.text}
          </text>
          <path d={L.band} fill={t("--w4-band")} stroke="none" />
          <path d={L.mean} fill="none" stroke={t("--ink-mute")} strokeWidth={1.5} />
          <path d={L.fit} fill="none" stroke={t("--ink")} strokeWidth={1.5} strokeDasharray="5 4" />
          {L.lines.map((l, i) => (
            <path key={`o${i}`} d={l.d} fill="none" stroke={t(l.colour)} strokeWidth={2} />
          ))}
          <g visibility={g.shown ? "visible" : "hidden"}>
            <line y1={L.guide.y1} y2={L.guide.y2} className="kit-guide" x1={placed?.x} x2={placed?.x} />
            {L.marks.map((colour, i) => (
              <circle key={`m${i}`} r={4.5} fill={t(colour)} stroke={t("--card")} strokeWidth={1.5} cx={placed?.x} cy={placed?.ys[i]} />
            ))}
          </g>
          <rect {...L.overlay} fill="transparent" onPointerMove={onPointerMove} onPointerLeave={onPointerLeave} />
          {L.legend.map((k, i) => (
            <Fragment key={`l${i}`}>
              <line x1={k.x1} y1={k.y1} x2={k.x2} y2={k.y2} stroke={t(k.colour)} strokeWidth={2} strokeDasharray={k.dash} />
              <text x={k.textX} y={k.y} fontSize={caption} fill={t("--ink-soft")}>
                {k.label}
              </text>
            </Fragment>
          ))}
        </Fragment>
      </svg>
    </>
  );
}

function Curve({ data }: { data: Data }) {
  const scale = useTypeScale();
  const tokens = useTokens(CURVE_TOKENS);
  if (!scale || !tokens) return null;
  return <CurveSvg data={data} scale={scale} tokens={tokens} />;
}

function CurvePart() {
  const { hydrated, part } = useHeaps<Data>(same);
  return <ChartHost id={CURVE} hydrated={hydrated}>{part ? <Curve data={part} /> : null}</ChartHost>;
}

// ---- the gap strip ---------------------------------------------------------------

const GAP = "chart-heaps-gap";

function GapPart() {
  const { hydrated, part } = useHeaps<{ rows: StripRow[]; opts: StripOptions }>(gap);
  return <ChartHost id={GAP} hydrated={hydrated}>{part ? <StripChart rows={part.rows} opts={part.opts} /> : null}</ChartHost>;
}

// ---- the table, the passages and the samples ---------------------------------------

function TablePart() {
  const { part } = useHeaps<TableSpec>(table);
  return (
    <div id="heaps-table">
      {part ? (
        <Drawers variant="foot">
          <Drawer label={TABLE_LABEL}>
            <Table {...part} />
          </Drawer>
        </Drawers>
      ) : null}
    </div>
  );
}

type Shown = { head: string; page: string; text: string; highlight: string }[];

function PassagesPart() {
  const { part } = useHeaps<Shown>(passages);
  return (
    <div id="heaps-passages">
      {part?.map((s, i) => (
        <Fragment key={i}>
          <p className="fineprint">{s.head}</p>
          <Passage page={s.page} text={s.text} highlight={s.highlight} />
        </Fragment>
      ))}
    </div>
  );
}

function SamplesPart() {
  const { part } = useHeaps<string[]>(samples);
  return (
    <div id="heaps-samples">
      {part?.map((line, i) => (
        <p key={i} className="fineprint">
          {line}
        </p>
      ))}
    </div>
  );
}

const Empty = (id: string) =>
  function Host() {
    return <div id={id}></div>;
  };

const HOSTS = {
  curve: () => <ServerHost id={CURVE} />,
  gap: () => <ServerHost id={GAP} />,
  table: Empty("heaps-table"),
  passages: Empty("heaps-passages"),
  samples: Empty("heaps-samples"),
};

// One island per part, so a fault in one leaves the others alone.
const PARTS = {
  curve: island("week05/heaps/Curve", CurvePart, HOSTS.curve, { roots: [`#${CURVE}`] }),
  gap: island("week05/heaps/Gap", GapPart, HOSTS.gap, { roots: [`#${GAP}`] }),
  table: island("week05/heaps/Table", TablePart, HOSTS.table, { roots: ["#heaps-table"] }),
  passages: island("week05/heaps/Passages", PassagesPart, HOSTS.passages, { roots: ["#heaps-passages"] }),
  samples: island("week05/heaps/Samples", SamplesPart, HOSTS.samples, { roots: ["#heaps-samples"] }),
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

// The section renders <Heaps part="curve" />, "gap", "table", "passages" and
// "samples": one client reference in the page's payload, wrapping each part's
// own island.
export const Heaps = island("week05/heaps/Heaps", View, Placeholder, {
  roots: [`#${CURVE}`, `#${GAP}`, "#heaps-table", "#heaps-passages", "#heaps-samples"],
});
