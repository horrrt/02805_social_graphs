"use client";
// The post template's toy charts, one island per host that week-template.js
// drew into on main. Each renders its host as the server did (empty) and,
// once hydrated, the kit component inside it with the toy data from
// src/scripts/week-template.js. The two networks draw once graphs.json is
// loaded; a failed load leaves their hosts empty and logs the error. The
// minis, the strip chart, the passage and the table need no file, so they
// draw whether or not graphs.json loads (on main one failed load left every
// host empty).
import { useMemo, type ReactNode } from "react";
import { MiniStrip, NetworkView, Passage, StripChart, Table, type NetworkSpec } from "@/kit";
import type { MiniSpec } from "@/kit/MiniStrip";
import type { StripOptions, StripRow } from "@/kit/StripChart";
import type { TableSpec } from "@/kit/Table";
import { island, useIslandReady } from "@/lib/island";
import { useData } from "@/lib/useData";
import { useHydrated } from "@/lib/useHydrated";
import { asset } from "@/scripts/site.js";
import { first, minis, second, TOY, TOYS } from "@/scripts/week-template.js";

type Graphs = Parameters<typeof TOYS.hero>[0];

// week-template.js is plain JS; these are the shapes its toys are drawn with.
const MINIS = minis as unknown as Record<"1" | "2", [MiniSpec, string]>;
const STRIP = first as unknown as { rows: StripRow[]; opts: StripOptions; passage: { page: string; text: string; highlight: string } };
const TABLE = second.table as TableSpec;

function useShown() {
  const hydrated = useHydrated();
  useIslandReady(hydrated);
  return hydrated;
}

// A network host: its spec from graphs.json, drawn by NetworkView.
function useNetwork(toy: (graphs: Graphs) => unknown): NetworkSpec | null {
  const hydrated = useHydrated();
  const graphs = useData<Graphs>(hydrated ? asset(TOY) : null, { throwOnError: true });
  const spec = useMemo(() => (graphs.data ? (toy(graphs.data) as NetworkSpec) : null), [graphs.data, toy]);
  useIslandReady(spec !== null);
  return spec;
}

const HERO_LABEL = "Toy figure: replace with the one figure that answers the question";

function HeroHost() {
  return <div aria-label={HERO_LABEL} className="w5-hero-plot" id="chart-hero" role="img"></div>;
}

function HeroView() {
  const spec = useNetwork(TOYS.hero);
  return (
    <div aria-label={HERO_LABEL} className="w5-hero-plot" id="chart-hero" role="img">
      {spec ? <NetworkView spec={spec} /> : null}
    </div>
  );
}

// A findings row's mini chart and the line under it.
const Mini = (finding: "1" | "2") => {
  function MiniView() {
    const shown = useShown();
    const [spec, note] = MINIS[finding];
    return (
      <div className="w4-mini" data-finding={finding}>
        {shown ? (
          <>
            <MiniStrip spec={spec} />
            <small>{note}</small>
          </>
        ) : null}
      </div>
    );
  }
  return MiniView;
};

const MiniHost = (finding: "1" | "2") =>
  function Host() {
    return <div className="w4-mini" data-finding={finding}></div>;
  };

function FirstView() {
  const shown = useShown();
  return <div id="chart-first">{shown ? <StripChart rows={STRIP.rows} opts={STRIP.opts} /> : null}</div>;
}

function PassageView() {
  const shown = useShown();
  return <div id="first-passage">{shown ? <Passage {...STRIP.passage} /> : null}</div>;
}

function SecondNetworkView() {
  const spec = useNetwork(TOYS.second);
  return <div id="chart-second-left">{spec ? <NetworkView spec={spec} /> : null}</div>;
}

function SecondTableView() {
  const shown = useShown();
  return <div id="chart-second-right">{shown ? <Table {...TABLE} /> : null}</div>;
}

const Empty = (id: string) =>
  function Host() {
    return <div id={id}></div>;
  };

// One island per host, so a fault in one leaves the others alone. The keys
// are short because the page's payload repeats each one: the findings minis go
// by their data-finding number, section 2's panels by their side.
const CHARTS = {
  hero: island("template/hero/HeroNetwork", HeroView, HeroHost, { roots: ["#chart-hero"] }),
  "1": island("template/findings/Mini1", Mini("1"), MiniHost("1"), { roots: ['[data-finding="1"]'] }),
  "2": island("template/findings/Mini2", Mini("2"), MiniHost("2"), { roots: ['[data-finding="2"]'] }),
  first: island("template/first/StripChart", FirstView, Empty("chart-first"), { roots: ["#chart-first"] }),
  passage: island("template/first/Passage", PassageView, Empty("first-passage"), { roots: ["#first-passage"] }),
  left: island("template/second/Network", SecondNetworkView, Empty("chart-second-left"), { roots: ["#chart-second-left"] }),
  right: island("template/second/Table", SecondTableView, Empty("chart-second-right"), { roots: ["#chart-second-right"] }),
};

export type ChartName = keyof typeof CHARTS;

const ROOTS: Record<ChartName, string> = {
  hero: "#chart-hero",
  "1": '[data-finding="1"]',
  "2": '[data-finding="2"]',
  first: "#chart-first",
  passage: "#first-passage",
  left: "#chart-second-left",
  right: "#chart-second-right",
};

const HOSTS: Record<ChartName, () => ReactNode> = {
  hero: HeroHost,
  "1": MiniHost("1"),
  "2": MiniHost("2"),
  first: Empty("chart-first"),
  passage: Empty("first-passage"),
  left: Empty("chart-second-left"),
  right: Empty("chart-second-right"),
};

function View({ chart }: { chart: ChartName }) {
  const Shown = CHARTS[chart];
  return <Shown />;
}

// The server markup of each host: empty, as main's server markup has it.
function Placeholder({ chart }: { chart: ChartName }) {
  const Host = HOSTS[chart];
  return <Host />;
}

// The sections render <Chart chart="…" /> for each host: one client reference
// in the page's payload (the kit page's demos found that one per host grows
// the gzipped HTML past the 2% static parity allows), wrapping that host's
// own island.
export const Chart = island("template/charts/Chart", View, Placeholder, {
  roots: (Object.keys(ROOTS) as ChartName[]).map((chart) => ROOTS[chart]),
});
