"use client";
// The kit page's "Distributions and nulls" demos, one island per [data-demo]
// host, as demos.tsx does for the rest of the page. Each renders its host
// empty on the server and, once hydrated, the demo inside it, with the state
// its controls change. Toy numbers from toy-distributions.ts.
import { useCallback, useId, useMemo, useState } from "react";
import { SegmentedControl } from "@/components/post/SegmentedControl";
import { DistributionPlot, NullBars, NullBoard, NullHistogram, type DistView } from "@/kit";
import { island, useIslandReady } from "@/lib/island";
import { useHydrated } from "@/lib/useHydrated";
import {
  baEnvelope, baOne, boardCells, boardMeasures, boardModels, degreeSets, linkRows, poissonRef, shuffleReal, shuffleSamples, topNodes, zipfObserved,
  zipfRef, zipfTop, type DegreeMode,
} from "./toy-distributions";

function useShown() {
  const hydrated = useHydrated();
  useIslandReady(hydrated);
  return hydrated;
}

const MODES: { value: DegreeMode; label: string }[] = [
  { value: "in", label: "in" },
  { value: "out", label: "out" },
  { value: "undirected", label: "undirected" },
];

function DegreeView() {
  const shown = useShown();
  const id = useId();
  const [mode, setMode] = useState<DegreeMode>("in");
  const ks = degreeSets[mode];
  const series = useMemo(() => [{ key: mode, name: `${mode === "undirected" ? "undirected" : `${mode}-`}degree of 300 toy nodes`, ks }], [mode, ks]);
  const refs = useCallback((v: DistView) => poissonRef(ks, v), [ks]);
  return (
    <div data-demo="dist-degree">
      {shown ? (
        <>
          <div className="kit-controls">
            <span className="kit-seg-label" id={`${id}-deg`}>Degree</span>
            <SegmentedControl className="w5-chips" ariaLabelledBy={`${id}-deg`} buttons={MODES} value={mode} onChange={(v) => setMode(v as DegreeMode)} />
          </div>
          <DistributionPlot series={series} refs={refs} top={{ title: "The tail, by name", items: topNodes(ks) }} aria="Toy degree distribution against the Poisson of the same mean" />
        </>
      ) : null}
    </div>
  );
}

const ZIPF_SERIES = [{ key: "observed", name: "toy corpus, 400 word types", points: zipfObserved }];

function ZipfView() {
  const shown = useShown();
  const id = useId();
  const [s, setS] = useState("1");
  const refs = useMemo(() => zipfRef(Number(s)), [s]);
  return (
    <div data-demo="dist-zipf">
      {shown ? (
        <>
          <div className="kit-controls">
            <label htmlFor={id}>Exponent s</label>
            <input id={id} type="range" min={0.5} max={2} step={0.05} value={s} onChange={(e) => setS(e.target.value)} />
            <output htmlFor={id}>{Number(s).toFixed(2)}</output>
          </div>
          <DistributionPlot series={ZIPF_SERIES} refs={refs} scaleToggle="split" xLabel="frequency rank" yLabel="count" top={{ title: "Most frequent words", items: zipfTop }} aria="Toy word counts by rank against an ideal Zipf curve" />
        </>
      ) : null}
    </div>
  );
}

const BA_SERIES = [{ key: "one", name: "one more run", ks: baOne, color: "--people" }];

function EnsembleView() {
  const shown = useShown();
  return <div data-demo="dist-ba">{shown ? <DistributionPlot series={BA_SERIES} envelopes={baEnvelope} defaultView="ccdf" aria="One toy preferential-attachment network against the spread of forty runs" /> : null}</div>;
}

function ShuffleView() {
  const shown = useShown();
  const [step, setStep] = useState(0);
  const [normal, setNormal] = useState(false);
  const more = (n: number) => () => setStep((s) => Math.min(shuffleSamples.length, s + n));
  return (
    <div data-demo="dist-shuffle">
      {shown ? (
        <>
          <div className="kit-controls">
            <button type="button" className="kit-btn" onClick={more(1)} disabled={step >= shuffleSamples.length}>
              Shuffle ×1
            </button>
            <button type="button" className="kit-btn" onClick={more(100)} disabled={step >= shuffleSamples.length}>
              Shuffle ×100
            </button>
            <button type="button" className="kit-btn" onClick={() => setStep(0)} disabled={step === 0}>
              Reset
            </button>
            <span className="w5-chips">
              <button type="button" aria-pressed={normal} onClick={() => setNormal((v) => !v)}>
                Normal curve
              </button>
            </span>
          </div>
          <NullHistogram samples={shuffleSamples} real={shuffleReal} step={step} normalOverlay={normal} xLabel="average clustering of a shuffled toy network" realLabel="real" />
        </>
      ) : null}
    </div>
  );
}

const CELLS = boardCells();

function BoardView() {
  const shown = useShown();
  return <div data-demo="dist-board">{shown ? <NullBoard measures={boardMeasures} models={boardModels} cells={CELLS} caption="Toy numbers: 300 draws per null model." /> : null}</div>;
}

function LinksView() {
  const shown = useShown();
  return <div data-demo="dist-links">{shown ? <NullBars rows={linkRows} xLabel="links of each type (toy)" /> : null}</div>;
}

const Empty = (demo: string) =>
  function Host() {
    return <div data-demo={demo}></div>;
  };

const at = (demo: string) => ({ roots: [`[data-demo="${demo}"]`] });

// One island per demo, so a fault in one leaves the others alone.
const DEMOS = {
  "dist-degree": island("kit/distributions/DegreeDemo", DegreeView, Empty("dist-degree"), at("dist-degree")),
  "dist-zipf": island("kit/distributions/ZipfDemo", ZipfView, Empty("dist-zipf"), at("dist-zipf")),
  "dist-ba": island("kit/distributions/EnsembleDemo", EnsembleView, Empty("dist-ba"), at("dist-ba")),
  "dist-shuffle": island("kit/distributions/ShuffleDemo", ShuffleView, Empty("dist-shuffle"), at("dist-shuffle")),
  "dist-board": island("kit/distributions/BoardDemo", BoardView, Empty("dist-board"), at("dist-board")),
  "dist-links": island("kit/distributions/LinksDemo", LinksView, Empty("dist-links"), at("dist-links")),
};

export type DistDemoName = keyof typeof DEMOS;

function View({ demo }: { demo: DistDemoName }) {
  const Shown = DEMOS[demo];
  return <Shown />;
}

function Placeholder({ demo }: { demo: DistDemoName }) {
  return <div data-demo={demo}></div>;
}

/** <DistDemo demo="dist-degree" />: one host of the section, wrapping that demo's own island. */
export const DistDemo = island("kit/distributions/DistDemo", View, Placeholder, {
  roots: (Object.keys(DEMOS) as DistDemoName[]).map((demo) => `[data-demo="${demo}"]`),
});
