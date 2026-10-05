"use client";
// The kit page's demos of the React kit, one island per [data-demo]
// host that src/scripts/pages/kit.js drew into. Each renders its host as the
// server did (empty, or the term demo's paragraph) and, once hydrated, the
// demo inside it. The eight network demos draw once graphs.json is loaded; a
// failed load leaves their hosts empty and logs the error, as on main.
import { Drawer } from "@/components/post/Drawer";
import { Drawers } from "@/components/post/Drawers";
import { useMemo } from "react";
import { Concordance, EChart, Figure, NetworkView, Passage, StripChart, Table, TermText } from "@/kit";
import { island, useIslandReady } from "@/lib/island";
import { useData } from "@/lib/useData";
import { useHydrated } from "@/lib/useHydrated";
import { asset } from "@/scripts/site.js";
import { GRAPHS, NETWORKS, type Graphs, type NetworkDemo } from "./networks";
import { kwicRows, passage, stripOpts, stripRows, term, toyCaption, toyOption, toyTable } from "./toy";

function useShown() {
  const hydrated = useHydrated();
  useIslandReady(hydrated);
  return hydrated;
}

function FigureView() {
  const shown = useShown();
  return (
    <div data-demo="figure">
      {shown ? <Figure chart={<EChart option={toyOption} height={280} />} caption={toyCaption} data={toyTable} /> : null}
    </div>
  );
}

function StripView() {
  const shown = useShown();
  return <div data-demo="strip">{shown ? <StripChart rows={stripRows} opts={stripOpts} /> : null}</div>;
}

function TableView() {
  const shown = useShown();
  return <div data-demo="table">{shown ? <Table caption="Toy table" {...toyTable} /> : null}</div>;
}

function KwicView() {
  const shown = useShown();
  return <div data-demo="kwic">{shown ? <Concordance rows={kwicRows} caption="Toy concordance for power" /> : null}</div>;
}

function PassageView() {
  const shown = useShown();
  return <div data-demo="passage">{shown ? <Passage {...passage} /> : null}</div>;
}

function TermPlaceholder() {
  return (
    <div data-demo="term">
      <p>{term.text}</p>
    </div>
  );
}

function TermView() {
  const shown = useShown();
  return (
    <div data-demo="term">
      <p>
        <TermText {...term} />
      </p>
      {shown ? (
        <Drawers variant="foot">
          <Drawer label="Method">
            <p>Toy drawer body.</p>
          </Drawer>
          <Drawer label="More numbers">
            <p>Another toy drawer.</p>
          </Drawer>
        </Drawers>
      ) : null}
    </div>
  );
}

// One network demo: its spec from graphs.json, drawn by NetworkView.
const Network = (demo: NetworkDemo) =>
  function NetworkHost() {
    const hydrated = useHydrated();
    const graphs = useData<Graphs>(hydrated ? asset(GRAPHS) : null, { throwOnError: true });
    const spec = useMemo(() => (graphs.data ? NETWORKS[demo](graphs.data) : null), [graphs.data]);
    useIslandReady(spec !== null);
    return <div data-demo={demo}>{spec ? <NetworkView spec={spec} /> : null}</div>;
  };

const Empty = (demo: string) =>
  function Host() {
    return <div data-demo={demo}></div>;
  };

const at = (demo: string) => ({ roots: [`[data-demo="${demo}"]`] });

// One island per demo, so a fault in one leaves the others alone.
const DEMOS = {
  figure: island("kit/demos/FigureDemo", FigureView, Empty("figure"), at("figure")),
  strip: island("kit/demos/StripDemo", StripView, Empty("strip"), at("strip")),
  table: island("kit/demos/TableDemo", TableView, Empty("table"), at("table")),
  kwic: island("kit/demos/KwicDemo", KwicView, Empty("kwic"), at("kwic")),
  passage: island("kit/demos/PassageDemo", PassageView, Empty("passage"), at("passage")),
  term: island("kit/demos/TermDemo", TermView, TermPlaceholder, at("term")),
  "net-hubs": island("kit/demos/NetHubsDemo", Network("net-hubs"), Empty("net-hubs"), at("net-hubs")),
  "net-links": island("kit/demos/NetLinksDemo", Network("net-links"), Empty("net-links"), at("net-links")),
  "net-both": island("kit/demos/NetBothDemo", Network("net-both"), Empty("net-both"), at("net-both")),
  "net-weight": island("kit/demos/NetWeightDemo", Network("net-weight"), Empty("net-weight"), at("net-weight")),
  "net-karate": island("kit/demos/NetKarateDemo", Network("net-karate"), Empty("net-karate"), at("net-karate")),
  "net-overlap": island("kit/demos/NetOverlapDemo", Network("net-overlap"), Empty("net-overlap"), at("net-overlap")),
  "net-hubs-light": island("kit/demos/NetHubsLightDemo", Network("net-hubs-light"), Empty("net-hubs-light"), at("net-hubs-light")),
  "net-karate-light": island("kit/demos/NetKarateLightDemo", Network("net-karate-light"), Empty("net-karate-light"), at("net-karate-light")),
};

export type DemoName = keyof typeof DEMOS;

function View({ demo }: { demo: DemoName }) {
  const Shown = DEMOS[demo];
  return <Shown />;
}

// The server markup of each host: empty, or the term demo's paragraph.
function Placeholder({ demo }: { demo: DemoName }) {
  return demo === "term" ? <TermPlaceholder /> : <div data-demo={demo}></div>;
}

// The page renders <Demo demo="…" /> for each host: one client reference in
// its payload (six would grow the page's gzipped HTML by 2.45%, over the 2%
// static parity allows), wrapping that demo's own island.
export const Demo = island("kit/demos/Demo", View, Placeholder, {
  roots: (Object.keys(DEMOS) as DemoName[]).map((demo) => `[data-demo="${demo}"]`),
});
