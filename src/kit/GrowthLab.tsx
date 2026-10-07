// Nonlinear preferential attachment, Π(k) ∝ k^α, as a lab: sliders for α
// (with sub-linear, linear and super-linear presets), m and n; Grow animates
// the network on the arrival spiral, Instant grows it at once (same seed, same
// network). Beside it the CCDF of the degrees against an optional reference
// series, and the biggest hub's share of links against α: Sweep α runs a
// seeded sweep at two n values, one point per tick so the page never blocks,
// over shaded regimes (α < 1, = 1, > 1). Tiles give the biggest hub, its share
// and its arrival rank. Growth stops off screen; under reduced motion Grow
// acts as Instant. The numbers are in growth-core.js. Style: .kit-growlab in
// post.css.
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useTokens } from "@/lib/useTypeScale";
import DistributionPlot, { type RefCurve } from "./DistributionPlot";
import EChart from "./EChart";
import NetCanvas, { type CanvasLink, type CanvasNode } from "./NetCanvas";
import Readouts from "./Readouts";
import { logSpace, powerLaw } from "./dist-core.js";
import { baInit, baStep, mulberry32 } from "./graph-core";
import { clampAlpha, hubStats, regime, spiralPosition, SWEEP_ALPHAS, sweepPoint } from "./growth-core.js";
import { useOnScreen, useReducedMotion } from "./network/motion";

type BaState = { n: number; m: number; alpha: number; edges: [number, number][]; degree: number[]; born: number[] };
type Sweep = { m: number; ns: number[]; curves: [number, number][][]; next: number };

const TOKENS = ["--access", "--people", "--outbound", "--loss", "--gain", "--ink-mute", "--ink-soft"];
const PRESETS: [number, string][] = [
  [0.5, "sub-linear"],
  [1, "linear"],
  [1.5, "super-linear"],
];
const TICK_MS = 30;
const SWEEP_MS = 0;

const int = (v: number) => v.toLocaleString("en-GB");
const pct = (v: number) => `${(100 * v).toLocaleString("en-GB", { maximumFractionDigits: v < 0.1 ? 1 : 0 })}%`;

const SAYS = {
  sub: "Sub-linear (α < 1): the rich get richer too slowly. No hub breaks away; the tail dies early, close to exponential.",
  linear: "Linear (α = 1): Barabási–Albert. A power law with γ = 3; the biggest hub holds a share of links that falls like 1/√n.",
  super: "Super-linear (α > 1): winner takes all. One early node keeps a fixed share of every link, however large the network gets.",
};

// Grows s by up to `steps` newcomers, short of `until` nodes.
function growWith(s: BaState, until: number, steps: number, rng: () => number) {
  let next = s;
  for (let i = 0; i < steps && next.n < until; i++) next = baStep(next, rng) as BaState;
  return next;
}

/** <GrowthLab reference={{ name: "toy network", ks }} sizes={[100, 300, 1000]} /> */
export default function GrowthLab({
  sizes = [100, 300, 1000],
  ms = [1, 2, 3, 5],
  defaultAlpha = 1,
  defaultM = 2,
  defaultN = 300,
  sweepNs = [300, 1000],
  reference,
  refShare,
  seed = 1,
  height = 380,
  start = "seed",
}: {
  sizes?: number[];
  ms?: number[];
  defaultAlpha?: number;
  defaultM?: number;
  defaultN?: number;
  sweepNs?: number[];
  reference?: { name: string; ks: number[] };
  refShare?: { label: string; share: number };
  seed?: number;
  height?: number;
  /** Start from the seed clique (the default) or from the network grown to n. */
  start?: "seed" | "grown";
}) {
  const id = useId();
  const box = useRef<HTMLDivElement>(null);
  const tokens = useTokens(TOKENS);
  const reduced = useReducedMotion();
  const onScreen = useOnScreen(box);

  const [alphaRaw, setAlphaRaw] = useState(String(defaultAlpha));
  const alpha = clampAlpha(Number(alphaRaw));
  const [m, setM] = useState(Math.max(1, Math.round(defaultM)));
  const [n, setN] = useState(Math.max(1, Math.round(defaultN)));
  const rng = useRef<() => number>(mulberry32(seed));
  const growTo = (s: BaState, until: number, steps: number) => growWith(s, until, steps, rng.current);
  const [g, setG] = useState<BaState>(() => {
    const s = baInit(m, alpha) as BaState;
    // A fresh rng, so a StrictMode second call draws the same network.
    return start === "grown" ? growWith(s, n, Infinity, mulberry32(seed)) : s;
  });
  const [growing, setGrowing] = useState(false);
  const [sweep, setSweep] = useState<Sweep | null>(null);

  // A new α, m or n starts the network again from its seed clique.
  const restart = (a: number, mm: number) => {
    rng.current = mulberry32(seed);
    setGrowing(false);
    setG(baInit(mm, a) as BaState);
  };
  const instant = () => {
    rng.current = mulberry32(seed);
    setGrowing(false);
    setG(growTo(baInit(m, alpha) as BaState, n, Infinity));
  };

  // Grow: a few newcomers per tick, so any n takes about four seconds.
  useEffect(() => {
    if (!growing) return;
    if (g.n >= n) {
      setGrowing(false);
      return;
    }
    if (!onScreen) {
      setGrowing(false);
      return;
    }
    const per = Math.max(1, Math.ceil(n / 130));
    const timer = setTimeout(() => setG(growTo(g, n, per)), TICK_MS);
    return () => clearTimeout(timer);
    // growTo reads only the rng ref.
  }, [growing, g, n, onScreen]);

  // Sweep α: one (α, n) point per tick, cancelled on unmount or a new sweep.
  useEffect(() => {
    if (!sweep || sweep.next >= sweep.ns.length * SWEEP_ALPHAS.length) return;
    const timer = setTimeout(() => {
      setSweep((s) => {
        if (!s) return s;
        const ni = Math.floor(s.next / SWEEP_ALPHAS.length);
        const a = SWEEP_ALPHAS[s.next % SWEEP_ALPHAS.length];
        const curves = s.curves.map((c, i) => (i === ni ? [...c, [a, sweepPoint(a, s.ns[i], s.m, seed, 2)] as [number, number]] : c));
        return { ...s, curves, next: s.next + 1 };
      });
    }, SWEEP_MS);
    return () => clearTimeout(timer);
  }, [sweep, seed]);
  const sweepTotal = sweep ? sweep.ns.length * SWEEP_ALPHAS.length : 0;
  const sweeping = sweep !== null && sweep.next < sweepTotal;

  const hub = hubStats(g.degree, g.edges.length);
  const newest = g.n - 1;
  const small = n > 500 ? 0.65 : 1;
  const nodes: CanvasNode[] = g.degree.map((k, v) => {
    const [x, y] = spiralPosition(v, Math.max(n, g.n));
    return { id: String(v), x, y, value: k, r: Math.min(18, (1.6 + 1.5 * Math.sqrt(k)) * small), state: v === hub.hub ? "picked" : v === newest && g.n > m + 1 ? "new" : undefined };
  });
  const links: CanvasLink[] = g.edges.map(([a, b]) => ({ s: String(a), t: String(b), highlight: a === hub.hub || b === hub.hub }));

  const series = useMemo(
    () => [{ key: "run", name: "this network", ks: g.degree }, ...(reference ? [{ key: "ref", name: reference.name, ks: reference.ks, color: "--ink-mute" }] : [])],
    [g.degree, reference],
  );
  const kMax = Math.max(m, ...g.degree);
  const refs = useMemo<RefCurve[]>(() => (kMax > m ? [{ key: "guide", name: "k⁻² guide (γ = 3)", points: powerLaw(logSpace(m, kMax, 20), 2, [m, 1]) as [number, number][] }] : []), [m, kMax]);

  const option = useMemo(() => {
    if (!tokens) return null;
    const colours = [tokens["--access"], tokens["--gain"], tokens["--outbound"]];
    const out: Record<string, unknown>[] = [
      {
        // An invisible carrier spanning the axes: ECharts draws marks on an empty series at Infinity on a log axis.
        type: "line",
        name: "regimes",
        data: [[0, 0.001], [SWEEP_ALPHAS[SWEEP_ALPHAS.length - 1], 1]],
        showSymbol: false,
        lineStyle: { opacity: 0 },
        tooltip: { show: false },
        silent: true,
        markArea: {
          silent: true,
          itemStyle: { color: tokens["--ink-mute"], opacity: 0.08 },
          label: { color: tokens["--ink-soft"], position: "insideTop" },
          data: [
            [{ xAxis: 0, name: "no hubs" }, { xAxis: 1 }],
            [{ xAxis: 1, name: "winner takes all", itemStyle: { color: tokens["--loss"], opacity: 0.06 } }, { xAxis: SWEEP_ALPHAS[SWEEP_ALPHAS.length - 1] }],
          ],
        },
        markLine: { silent: true, symbol: "none", label: { formatter: "α = 1", color: tokens["--ink-soft"] }, lineStyle: { color: tokens["--ink-soft"], type: "dotted" }, data: [{ xAxis: 1 }] },
      },
    ];
    sweep?.curves.forEach((c, i) => {
      out.push({ type: "line", name: `n = ${int(sweep.ns[i])}`, data: c, showSymbol: false, lineStyle: { color: colours[i % 3], width: 2 }, itemStyle: { color: colours[i % 3] } });
    });
    if (refShare && refShare.share > 0)
      out.push({ type: "line", name: refShare.label, data: [[0, refShare.share], [SWEEP_ALPHAS[SWEEP_ALPHAS.length - 1], refShare.share]], showSymbol: false, lineStyle: { color: tokens["--people"], type: "dashed", width: 2 }, itemStyle: { color: tokens["--people"] } });
    if (hub.share > 0) out.push({ type: "scatter", name: "this run", data: [[Math.min(alpha, 2.5), hub.share]], symbolSize: 10, itemStyle: { color: tokens["--loss"] } });
    return {
      grid: { left: 56, right: 18, top: 26, bottom: 46 },
      tooltip: { trigger: "item", formatter: (p: { seriesName: string; value: [number, number] }) => `${p.seriesName}<br/>α ${p.value[0]}: ${pct(p.value[1])}` },
      xAxis: { type: "value", min: 0, max: 2.5, name: "α", nameLocation: "middle", nameGap: 28 },
      yAxis: { type: "log", logBase: 10, min: 0.001, max: 1, name: "biggest hub's share", nameLocation: "middle", nameGap: 44, axisLabel: { formatter: (v: number) => pct(v) } },
      series: out,
    };
  }, [tokens, sweep, refShare, hub.share, alpha]);

  const side = regime(alpha) as keyof typeof SAYS;
  return (
    <div className="kit-growlab" ref={box}>
      <div className="kit-controls">
        <label htmlFor={`${id}-a`}>Preference exponent α</label>
        <input
          id={`${id}-a`}
          type="range"
          min={0}
          max={Math.max(3, alpha)}
          step={0.05}
          value={alphaRaw}
          onChange={(e) => {
            setAlphaRaw(e.target.value);
            restart(clampAlpha(Number(e.target.value)), m);
          }}
        />
        <output htmlFor={`${id}-a`}>{alpha.toFixed(2)}</output>
        <span className="w5-chips" role="group" aria-label="α presets">
          {PRESETS.map(([a, label]) => (
            <button
              key={label}
              type="button"
              aria-pressed={alpha === a}
              onClick={() => {
                setAlphaRaw(String(a));
                restart(a, m);
              }}
            >
              {label}
            </button>
          ))}
        </span>
      </div>
      <div className="kit-controls">
        <span className="kit-seg-label">Links per newcomer m</span>
        <span className="w5-chips" role="group" aria-label="Links per newcomer m">
          {ms.map((v) => (
            <button
              key={v}
              type="button"
              aria-pressed={m === v}
              onClick={() => {
                setM(v);
                restart(alpha, v);
              }}
            >
              {v}
            </button>
          ))}
        </span>
        <span className="kit-seg-label">Nodes n</span>
        <span className="w5-chips" role="group" aria-label="Nodes n">
          {sizes.map((v) => (
            <button
              key={v}
              type="button"
              aria-pressed={n === v}
              onClick={() => {
                setN(v);
                restart(alpha, m);
              }}
            >
              {int(v)}
            </button>
          ))}
        </span>
      </div>
      <div className="kit-controls">
        <button type="button" className="kit-btn" aria-pressed={growing} onClick={() => (reduced ? instant() : setGrowing((on) => !on))} disabled={g.n >= n && !growing}>
          {growing ? "Pause" : "Grow"}
        </button>
        <button type="button" className="kit-btn" onClick={instant}>
          Instant
        </button>
        <button type="button" className="kit-btn" onClick={() => restart(alpha, m)}>
          Reset
        </button>
        <button type="button" className="kit-btn" onClick={() => setSweep({ m, ns: sweepNs, curves: sweepNs.map(() => []), next: 0 })} disabled={sweeping || sweepNs.length === 0}>
          Sweep α
        </button>
        <span className="kit-note" aria-live="polite">
          {sweeping ? `Sweeping: ${sweep!.next} of ${sweepTotal} runs` : sweep ? `Swept ${SWEEP_ALPHAS.length} values of α at m = ${sweep.m}.` : ""}
        </span>
      </div>
      <p className="kit-growlab-says">{SAYS[side]}</p>
      <div className="kit-growlab-body">
        <div className="kit-growlab-net">
          <NetCanvas
            nodes={nodes}
            links={links}
            color="sequential"
            height={height}
            aria={`A network grown with attachment exponent α = ${alpha.toFixed(2)}: ${g.n} of ${n} nodes, the first at the centre of the spiral`}
            describe={`${int(g.n)} of ${int(n)} nodes, ${int(g.edges.length)} links. Centre: first to arrive. Blue: the biggest hub and its links; orange: the newest.`}
            tooltip={(node) => [`Node ${Number(node.id) + 1}`, `${g.degree[Number(node.id)]} links`]}
          />
        </div>
        <div className="kit-growlab-charts">
          <h4 className="kit-growth-head">Degree distribution</h4>
          <DistributionPlot series={series} refs={refs} views={["ccdf"]} defaultView="ccdf" scaleToggle="none" height={200} aria={`CCDF of the degrees at α = ${alpha.toFixed(2)}, log–log`} />
          <h4 className="kit-growth-head">Biggest hub&apos;s share of all links, against α</h4>
          <div role="img" aria-label={`The biggest hub's share of links against α${sweep ? `, swept at n = ${sweep.ns.join(" and ")}` : "; press Sweep α to draw the curves"}; this run at ${pct(hub.share)}`}>
            {option ? <EChart option={option} height={200} /> : null}
          </div>
          <ul className="kit-legend">
            {sweep?.ns.map((v, i) => (
              <li key={v}>
                <span className="kit-swatch kit-swatch-line" style={{ color: `var(${["--access", "--gain", "--outbound"][i % 3]})` }} />n = {int(v)}
              </li>
            ))}
            {refShare ? (
              <li>
                <span className="kit-swatch kit-swatch-dash" style={{ color: "var(--people)" }} />
                {refShare.label}
              </li>
            ) : null}
            <li>
              <span className="kit-swatch kit-swatch-dot" style={{ background: "var(--loss)" }} />
              this run
            </li>
          </ul>
        </div>
      </div>
      <Readouts
        items={[
          { label: "Nodes", value: `${int(g.n)} / ${int(n)}`, sub: g.n > n ? `the seed clique has m + 1 = ${g.n}` : undefined },
          { label: "Links", value: int(g.edges.length) },
          { label: "Biggest hub", value: `${hub.k} links` },
          { label: "Its share of all links", value: pct(hub.share) },
          { label: "It arrived as node", value: `#${hub.arrival}` },
        ]}
      />
    </div>
  );
}
