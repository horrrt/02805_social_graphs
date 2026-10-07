"use client";
// The figures in Week 4's [data-strip] and [data-more] hosts that the old vis
// scripts filled: each host is its own island, which loads the files its
// figure is built from (all at once, as each script's Promise.all did) and
// draws the spec the pure builders in src/scripts return. A failed file
// leaves the host empty and logs one line, as the scripts did.
import { useMemo, type ReactNode } from "react";
import { MiniStrip, StripChart } from "@/kit";
import type { MiniSpec } from "@/kit/MiniStrip";
import type { StripOptions, StripRow } from "@/kit/StripChart";
import { island, useIslandReady } from "@/lib/island";
import { FILES as STAFFING_FILES, visStaffing } from "@/scripts/week04-vis-staffing.js";
import { HBars, RankBars, Slope, Stacked } from "../charts";
import { W4, useW4All } from "../useW4Data";
import { useT, type T } from "../useT";

export type Spec =
  | { kind: "strip"; rows: StripRow[]; opts: StripOptions }
  | { kind: "mini"; spec: MiniSpec }
  | { kind: "hbars"; rows: any[]; opts: any }
  | { kind: "stacked"; groups: [string, number[]][]; names: string[]; tints: string[]; opts: any }
  | { kind: "rankbars"; rows: any[]; opts: any }
  | { kind: "slope"; series: any[]; opts: any }
  | { kind: "node"; render: (T: T) => ReactNode };

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

const staffing = (d: any[]): Record<string, Spec> => once(d[0], () => visStaffing(d[0], d[1], d[2]) as Record<string, Spec>);

const ENTRIES: Record<string, Entry> = {};
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
  ENTRIES[id] = { files: STAFFING_FILES.map(W4.data), label: "week04-vis-staffing:", build: (d) => staffing(d)[id] };
}

function Draw({ spec, T }: { spec: Spec; T: T }) {
  switch (spec.kind) {
    case "strip":
      return <StripChart rows={spec.rows} opts={spec.opts} />;
    case "mini":
      return <MiniStrip spec={spec.spec} />;
    case "hbars":
      return <HBars rows={spec.rows} {...spec.opts} T={T} />;
    case "stacked":
      return <Stacked groups={spec.groups} names={spec.names} tints={spec.tints} {...spec.opts} T={T} />;
    case "rankbars":
      return <RankBars rows={spec.rows} {...spec.opts} T={T} />;
    case "slope":
      return <Slope series={spec.series} {...spec.opts} T={T} />;
    case "node":
      return <>{spec.render(T)}</>;
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

/** <StripPart id="who-q1-split" />: the figure in one [data-strip] host. */
export const StripPart = island("week04/strips/StripPart", View, Server, { roots: ["[data-strip]", "[data-more]"] });
