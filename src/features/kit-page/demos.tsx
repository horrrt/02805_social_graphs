"use client";
// The kit page's demos of the React kit, one island per [data-demo]
// host that src/scripts/pages/kit.js drew into. Each renders its host as the
// server did (empty, or the term demo's paragraph) and, once hydrated, the
// demo inside it. The eight network demos draw once graphs.json is loaded; a
// failed load leaves their hosts empty and logs the error, as on main.
import { Drawer } from "@/components/post/Drawer";
import { Drawers } from "@/components/post/Drawers";
import { useId, useMemo, useState } from "react";
import {
  AnalogyPlot, AxisMap, Concordance, CountMatrix, EChart, Figure, GuessRanker, MixtureBar, NetworkView, Passage, RankedBars,
  SplitBars, StripChart, SweepCurve, Table, TermText, TokenWindow, VectorAngle,
} from "@/kit";
import { island, useIslandReady } from "@/lib/island";
import { useData } from "@/lib/useData";
import { useHydrated } from "@/lib/useHydrated";
import { asset } from "@/scripts/site.js";
import { GRAPHS, NETWORKS, type Graphs, type NetworkDemo } from "./networks";
import {
  analogy, guessBanned, guessItems, guessScore, kwicRows, mapAxes, mapHighlight, mapPoints, matrixCells, matrixCols, matrixRows,
  mixParts, mixWords, negatives, passage, rankedBase, rankedNames, sentence, splitParts, splitRows, stripOpts, stripRows, sweepPoints,
  term, toyCaption, toyOption, toyTable, vecA, vecB,
} from "./toy";

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

// The text explorables. Each demo holds the state its controls change.
function VectorView() {
  const shown = useShown();
  const [k, setK] = useState(1);
  return <div data-demo="vector">{shown ? <VectorAngle a={vecA} b={vecB} labels={{ a: "D1", b: "D2" }} scaleB={k} onScaleB={setK} /> : null}</div>;
}

function SplitView() {
  const shown = useShown();
  const [picked, setPicked] = useState("");
  return (
    <div data-demo="split">
      {shown ? (
        <>
          <SplitBars rows={splitRows} parts={splitParts} onPick={setPicked} />
          <p className="kit-note">{picked ? `Picked ${picked}.` : "Click a name to pick it."}</p>
        </>
      ) : null}
    </div>
  );
}

function SweepView() {
  const shown = useShown();
  const id = useId();
  const [at, setAt] = useState("100");
  return (
    <div data-demo="sweep">
      {shown ? (
        <>
          <div className="kit-controls">
            <label htmlFor={id}>Names kept</label>
            <input id={id} type="range" min={0} max={100} step={5} value={at} onChange={(e) => setAt(e.target.value)} />
            <output htmlFor={id}>{at}%</output>
          </div>
          <SweepCurve points={sweepPoints} current={Number(at)} refLine={{ y: 0.31, label: "ten random pages" }} xLabel="names kept (%)" yLabel="linked of ten" domain={{ x: [0, 100], y: [0, 4.5] }} fmt={(v) => String(Math.round(v * 10) / 10)} />
        </>
      ) : null}
    </div>
  );
}

function TokensView() {
  const shown = useShown();
  const id = useId();
  const [centre, setCentre] = useState(2);
  const [win, setWin] = useState("2");
  const [mode, setMode] = useState<"skipgram" | "cbow">("skipgram");
  return (
    <div data-demo="tokens">
      {shown ? (
        <>
          <div className="kit-controls">
            <span className="w5-chips" role="group" aria-label="Model">
              <button type="button" aria-pressed={mode === "skipgram"} onClick={() => setMode("skipgram")}>Skip-gram</button>
              <button type="button" aria-pressed={mode === "cbow"} onClick={() => setMode("cbow")}>CBOW</button>
            </span>
            <label htmlFor={id}>Window</label>
            <input id={id} type="range" min={0} max={4} step={1} value={win} onChange={(e) => setWin(e.target.value)} />
            <output htmlFor={id}>±{win}</output>
          </div>
          <TokenWindow tokens={sentence} centre={centre} window={Number(win)} onCentre={setCentre} negatives={negatives} mode={mode} />
        </>
      ) : null}
    </div>
  );
}

function MatrixView() {
  const shown = useShown();
  const [row, setRow] = useState(0);
  return (
    <div data-demo="matrix">
      {shown ? <CountMatrix rows={matrixRows} cols={matrixCols} cells={matrixCells} highlightRow={row} onRow={setRow} caption="Toy counts of each column word within two words of the row word." /> : null}
    </div>
  );
}

function MixView() {
  const shown = useShown();
  const [focus, setFocus] = useState("Crime");
  return <div data-demo="mix">{shown ? <MixtureBar parts={mixParts} focus={focus} onFocus={setFocus} words={mixWords[focus]} /> : null}</div>;
}

function RankedView() {
  const shown = useShown();
  const [names, setNames] = useState(true);
  const rows = rankedBase.map((r) => ({ ...r, muted: !names && rankedNames.has(r.key) }));
  return (
    <div data-demo="ranked">
      {shown ? (
        <>
          <div className="kit-controls">
            <span className="w5-chips" role="group" aria-label="Names">
              <button type="button" aria-pressed={names} onClick={() => setNames(true)}>Names kept</button>
              <button type="button" aria-pressed={!names} onClick={() => setNames(false)}>Names greyed</button>
            </span>
          </div>
          <RankedBars title="Most distinctive words on a toy page" colHeads={["On page", "Pages with it"]} rows={rows} />
        </>
      ) : null}
    </div>
  );
}

function MapView() {
  const shown = useShown();
  const id = useId();
  const [find, setFind] = useState("");
  const [picked, setPicked] = useState("");
  return (
    <div data-demo="axismap">
      {shown ? (
        <>
          <div className="kit-controls">
            <label htmlFor={id}>Find</label>
            <input id={id} type="text" value={find} onChange={(e) => setFind(e.target.value)} />
            <span className="kit-note">{picked ? `Clicked ${picked}.` : "Click a point."}</span>
          </div>
          <AxisMap points={mapPoints} axes={mapAxes} highlight={mapHighlight} find={find} onPick={setPicked} height={340} />
        </>
      ) : null}
    </div>
  );
}

function AnalogyView() {
  const shown = useShown();
  const [step, setStep] = useState<0 | 1 | 2>(0);
  const steps = ["words", "relationship", "arithmetic"];
  return (
    <div data-demo="analogy">
      {shown ? (
        <>
          <div className="kit-controls">
            <span className="w5-chips" role="group" aria-label="Step">
              {steps.map((s, i) => (
                <button key={s} type="button" aria-pressed={step === i} onClick={() => setStep(i as 0 | 1 | 2)}>
                  {s}
                </button>
              ))}
            </span>
          </div>
          <AnalogyPlot points={analogy} step={step} />
        </>
      ) : null}
    </div>
  );
}

function GuessView() {
  const shown = useShown();
  return <div data-demo="guess">{shown ? <GuessRanker items={guessItems} score={guessScore} target="wolverine" budget={6} banned={guessBanned} /> : null}</div>;
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
  vector: island("kit/demos/VectorDemo", VectorView, Empty("vector"), at("vector")),
  split: island("kit/demos/SplitDemo", SplitView, Empty("split"), at("split")),
  sweep: island("kit/demos/SweepDemo", SweepView, Empty("sweep"), at("sweep")),
  tokens: island("kit/demos/TokensDemo", TokensView, Empty("tokens"), at("tokens")),
  matrix: island("kit/demos/MatrixDemo", MatrixView, Empty("matrix"), at("matrix")),
  mix: island("kit/demos/MixDemo", MixView, Empty("mix"), at("mix")),
  ranked: island("kit/demos/RankedDemo", RankedView, Empty("ranked"), at("ranked")),
  axismap: island("kit/demos/AxisMapDemo", MapView, Empty("axismap"), at("axismap")),
  analogy: island("kit/demos/AnalogyDemo", AnalogyView, Empty("analogy"), at("analogy")),
  guess: island("kit/demos/GuessDemo", GuessView, Empty("guess"), at("guess")),
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
