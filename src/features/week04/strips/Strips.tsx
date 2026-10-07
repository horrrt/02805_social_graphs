"use client";
// The figures in Week 4's [data-strip] and [data-more] hosts that the old vis
// scripts filled (week04-vis-staffing.js, week04-vis-intros.js,
// week04-vis-more.js): each host is its own island, which loads the files
// its figure is built from (all at once, as each script's Promise.all did)
// and draws the spec the pure builders in src/scripts return. A failed file
// leaves the host empty and logs one line, as the scripts did.
import { useMemo, useRef, type ReactNode } from "react";
import { MiniStrip, StripChart } from "@/kit";
import type { MiniSpec } from "@/kit/MiniStrip";
import type { StripOptions, StripRow } from "@/kit/StripChart";
import { island, useIslandReady } from "@/lib/island";
import { useFittedWidth } from "@/lib/useSize";
import { INTRO_FILES, backboneLayout, introSpec } from "@/scripts/week04-vis-intros.js";
import { MORE_KEYS, drawsLayout, moreSpec } from "@/scripts/week04-vis-more.js";
import { FILES as STAFFING_FILES, visStaffing } from "@/scripts/week04-vis-staffing.js";
import { HBars, RankBars, Slope, Stacked } from "../charts";
import { W4, useW4All } from "../useW4Data";
import { useT, type T } from "../useT";

export type Spec =
  | { kind: "strip"; rows: StripRow[]; opts: StripOptions }
  | { kind: "mini"; spec: MiniSpec }
  | { kind: "miniStack"; rows: { label: string; spec: MiniSpec; note?: string }[] }
  | { kind: "hbars"; rows: any[]; opts: any }
  | { kind: "stacked"; groups: [string, number[]][]; names: string[]; tints: string[]; opts: any }
  | { kind: "rankbars"; rows: any[]; opts: any }
  | { kind: "slope"; series: any[]; opts: any }
  | { kind: "backbone"; sweep: any[]; range: { lo: number; hi: number } }
  | { kind: "draws"; rows: any[]; hl: Set<string> };

type Entry = { files: string[]; label: string; build: (data: any[]) => Spec | null | undefined; attr?: "data-strip" | "data-more" };

const TOKENS = [
  "--ink",
  "--ink-soft",
  "--ink-mute",
  "--ink-mute-text",
  "--line",
  "--line-soft",
  "--card",
  "--w4-grid",
  "--w4-band",
  "--w4-accent",
  "--w4-accent-soft",
  "--w4-placed",
  "--w4-vis-client",
  "--w4-more-client",
  "--w4-more-employer",
  "--w4-level-1",
  "--w4-level-2",
  "--w4-level-3",
  "--w4-level-4",
];

// Built once per set of files, shared by every host that reads them.
const cache = new WeakMap<object, any>();
function once<R>(key: object, make: () => R): R {
  if (!cache.has(key)) cache.set(key, make());
  return cache.get(key);
}

const file = (name: string) => (name === "place" ? W4.place : W4.data(name));

const ENTRIES: Record<string, Entry> = {};

const staffing = (d: any[]): Record<string, Spec> => once(d[0], () => visStaffing(d[0], d[1], d[2]) as Record<string, Spec>);
for (const id of [
  "who-q1-split",
  "who-q1-denial",
  "who-q1-funnel-registrations",
  "who-q1-funnel-petitions",
  "who-q2-modularity",
  "who-q2-ami",
  "who-q3-concentration",
  "who-q3-topshare",
  "who-q4-stability",
  "who-q4-shift",
  "who-q4-vendor-changed",
  "staffing-lawyers-outsourcing",
  "staffing-lawyers-top5",
  "staffing-community-modularity",
  "staffing-ties-overlap",
  "staffing-ties-wage",
  "staffing-lottery-mates",
  "staffing-lottery-ami",
]) {
  ENTRIES[id] = { files: STAFFING_FILES.map(file), label: "week04-vis-staffing:", build: (d) => staffing(d)[id] };
}

for (const [id, names] of Object.entries(INTRO_FILES as Record<string, string[]>)) {
  ENTRIES[id] = { files: names.map(file), label: `${id} intro`, build: (d) => introSpec(id, d) as Spec | null };
}

for (const key of MORE_KEYS as string[]) {
  ENTRIES[`more:${key}`] = { files: [W4.data("more")], label: "week04-vis-more", build: (d) => moreSpec(key, d[0]) as Spec | null, attr: "data-more" };
}

// ---- the figures the shared charts do not cover

function MiniStack({ rows }: { rows: { label: string; spec: MiniSpec; note?: string }[] }) {
  return (
    <div className="w4-mini-stack">
      {rows.map((row) => (
        <div className="w4-mini-row" key={row.label}>
          <p className="w4-mini-label">{row.label}</p>
          <MiniStrip spec={row.spec} />
          {row.note ? <small>{row.note}</small> : null}
        </div>
      ))}
    </div>
  );
}

// The closing's backbone: metros connected as α tightens, in small steps.
function Backbone({ sweep, range, T }: { sweep: any[]; range: { lo: number; hi: number }; T: T }) {
  const ref = useRef<SVGSVGElement>(null);
  const W = useFittedWidth(ref, 470);
  const L = backboneLayout(sweep, range, W);
  const caption = T.fs("caption");
  const mute = T.token("--ink-mute-text");
  return (
    <svg
      ref={ref}
      viewBox={`0 0 ${W} ${L.H}`}
      width={W}
      height={L.H}
      role="img"
      aria-label={`Metros in the largest connected piece as the disparity filter tightens: it falls in small steps, with no single drop between α = ${L.hi} and ${L.lo}`}
    >
      <rect x={L.X(L.lo)} y={L.T} width={L.X(L.hi) - L.X(L.lo)} height={L.H - L.T - L.B} fill={T.token("--line-soft")} />
      {[0, 20, 40].map((v) => (
        <g key={v}>
          <line x1={L.L} x2={W - L.R} y1={L.Y(v)} y2={L.Y(v)} stroke={T.token("--line")} strokeWidth={1} />
          <text x={L.L - 8} y={L.Y(v) + 4} textAnchor="end" fontSize={caption} fill={mute}>
            {String(v)}
          </text>
        </g>
      ))}
      <path d={L.d} fill="none" stroke={T.token("--ink")} strokeWidth={2}>
        <title>Metros still connected at each α; every step is one link removed</title>
      </path>
      {(
        [
          [0.01, "0.01"],
          [0.1, "0.1"],
          [1, "1"],
        ] as [number, string][]
      ).map(([a, label]) => (
        <text key={label} x={L.X(a)} y={L.H - L.B + 16} textAnchor="middle" fontSize={caption} fill={mute}>
          {label}
        </text>
      ))}
      <text x={W - L.R} y={L.H - 4} textAnchor="end" fontSize={caption} fill={mute}>
        α, disparity filter →
      </text>
      <text x={(L.X(L.lo) + L.X(L.hi)) / 2} y={L.T + 12} textAnchor="middle" fontSize={caption} fill={T.token("--ink-soft")}>
        {`α ${L.lo}–${L.hi}`}
      </text>
      <text x={L.L} y={L.T - 3} fontSize={caption} fill={mute}>
        metros connected
      </text>
    </svg>
  );
}

// Every H-1B registration draw since 2020, per selected registration.
function Draws({ rows, hl, T }: { rows: any[]; hl: Set<string>; T: T }) {
  const ref = useRef<SVGSVGElement>(null);
  const W = useFittedWidth(ref, 556);
  const L = drawsLayout(rows, hl, W, T.measure);
  const caption = T.fs("caption");
  const small = T.fs("small");
  const ink = T.token("--ink");
  return (
    <svg ref={ref} viewBox={`0 0 ${W} ${L.H}`} width={W} height={L.H} role="img" aria-label={L.aria}>
      {L.band ? (
        <>
          <rect x={L.band.x0} y={L.T - 18} width={L.band.x1 - L.band.x0} height={L.H - L.B - L.T + 18} rx={8} fill={T.token("--w4-accent-soft")} fillOpacity={0.5} />
          <text x={(L.band.x0 + L.band.x1) / 2} y={L.T - 6} fontSize={caption} fill={T.token("--w4-accent")} textAnchor="middle">
            The draws this box splits by employer
          </text>
        </>
      ) : null}
      {L.grid.map((g: { v: number; y: number }) => (
        <g key={g.v}>
          <line x1={L.L} y1={g.y} x2={W - L.R} y2={g.y} stroke={T.token("--w4-grid")} strokeWidth={1} />
          <text x={L.L - 8} y={g.y + 4} fontSize={caption} fill={T.token("--ink-mute-text")} textAnchor="end">
            {String(g.v)}
          </text>
        </g>
      ))}
      {L.split ? (
        <>
          <line x1={L.split.xm} y1={L.T} x2={L.split.xm} y2={L.H - L.B} stroke={T.token("--ink-mute")} strokeWidth={1} strokeDasharray="3 3" />
          <text x={L.split.x} y={L.H - L.B - 8} fontSize={caption} fill={T.token("--ink-soft")} textAnchor={L.split.anchor as "start" | "end"}>
            {L.split.note}
          </text>
        </>
      ) : null}
      <polyline points={L.line} fill="none" stroke={ink} strokeWidth={2.4} strokeLinejoin="round" />
      {L.points.map((p: any, i: number) => (
        <g key={i}>
          <title>{p.tip}</title>
          <circle cx={p.x} cy={p.y} r={p.on ? 5 : 4} fill={p.on ? ink : T.token("--card")} stroke={ink} strokeWidth={2} />
          {/* The first value starts at its point so it clears the y-axis numbers. */}
          <text x={p.first ? p.x - 4 : p.x} y={p.y - 10} fontSize={small} fontWeight={700} fill={ink} textAnchor={p.first ? "start" : "middle"}>
            {p.value}
          </text>
          <text x={p.x} y={L.H - L.B + 18} fontSize={caption} fontWeight={p.on ? 700 : 400} fill={p.on ? ink : T.token("--ink-soft")} textAnchor="middle">
            {p.date}
          </text>
          <text x={p.x} y={L.H - L.B + 34} fontSize={caption} fill={T.token("--ink-mute-text")} textAnchor="middle">
            {p.multi}
          </text>
        </g>
      ))}
    </svg>
  );
}

function Draw({ spec, T }: { spec: Spec; T: T }) {
  switch (spec.kind) {
    case "strip":
      return <StripChart rows={spec.rows} opts={spec.opts} />;
    case "mini":
      return <MiniStrip spec={spec.spec} />;
    case "miniStack":
      return <MiniStack rows={spec.rows} />;
    case "hbars":
      return <HBars rows={spec.rows} {...spec.opts} T={T} />;
    case "stacked":
      return <Stacked groups={spec.groups} names={spec.names} tints={spec.tints} {...spec.opts} T={T} />;
    case "rankbars":
      return <RankBars rows={spec.rows} {...spec.opts} T={T} />;
    case "slope":
      return <Slope series={spec.series} {...spec.opts} T={T} />;
    case "backbone":
      return <Backbone sweep={spec.sweep} range={spec.range} T={T} />;
    case "draws":
      return <Draws rows={spec.rows} hl={spec.hl} T={T} />;
  }
}

type Props = { id: string };

function attrs(id: string) {
  const attr = ENTRIES[id]?.attr ?? "data-strip";
  return { className: "w4-figure-body", [attr]: attr === "data-more" ? id.replace(/^more:/, "") : id };
}

function Server({ id }: Props) {
  return <div {...attrs(id)}></div>;
}

function View({ id }: Props) {
  const entry = ENTRIES[id];
  const data = useW4All(entry.files, entry.label);
  const T = useT(TOKENS);
  const spec = useMemo(() => (data ? entry.build(data) ?? null : null), [data, entry]);
  useIslandReady(spec !== null && T !== null);
  return <div {...attrs(id)}>{spec && T ? <Draw spec={spec} T={T} /> : null}</div>;
}

/** <StripPart id="who-q1-split" /> or <StripPart id="more:draws" />: the figure in one host. */
export const StripPart = island("week04/strips/StripPart", View, Server, { roots: ["[data-strip]", "[data-more]"] });
