"use client";
// The kit page's demos of the React kit, one island per [data-demo]
// host that src/scripts/pages/kit.js drew into. Each renders its host as the
// server did (empty, or the term demo's paragraph) and, once hydrated, the
// demo inside it. The network demos stay with pages/kit.js until K2.
import { Drawer } from "@/components/post/Drawer";
import { Drawers } from "@/components/post/Drawers";
import { Concordance, EChart, Figure, Passage, StripChart, Table, TermText } from "@/kit";
import { island, useIslandReady } from "@/lib/island";
import { useHydrated } from "@/lib/useHydrated";
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

const Empty = (demo: string) =>
  function Host() {
    return <div data-demo={demo}></div>;
  };

const at = (demo: string) => ({ roots: [`[data-demo="${demo}"]`] });

// One island per demo, so a fault in one leaves the other five alone.
const DEMOS = {
  figure: island("kit/demos/FigureDemo", FigureView, Empty("figure"), at("figure")),
  strip: island("kit/demos/StripDemo", StripView, Empty("strip"), at("strip")),
  table: island("kit/demos/TableDemo", TableView, Empty("table"), at("table")),
  kwic: island("kit/demos/KwicDemo", KwicView, Empty("kwic"), at("kwic")),
  passage: island("kit/demos/PassageDemo", PassageView, Empty("passage"), at("passage")),
  term: island("kit/demos/TermDemo", TermView, TermPlaceholder, at("term")),
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
  roots: ['[data-demo="figure"]', '[data-demo="strip"]', '[data-demo="table"]', '[data-demo="kwic"]', '[data-demo="passage"]', '[data-demo="term"]'],
});
