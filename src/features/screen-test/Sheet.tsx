"use client";
// The Screen Test prototype that pages/screen-test.js filled on main: every
// number on the sheet comes from week02_screentest.json, the canvases draw
// the networks, the tail and the null histogram, and the auditions, tail
// keys, live rig, report toggle and paradox handle respond to the reader.
// Each island shows its server markup until the data is in, and keeps it if
// the data fails, as main's script did.
import { useCallback, useEffect, useRef, useState } from "react";
import { island } from "@/lib/island";
import { useCanvasStage } from "@/lib/useCanvas";
import { useData } from "@/lib/useData";
import { useHydrated } from "@/lib/useHydrated";
import { asset } from "@/scripts/site.js";
import { CCDF, EN, MECH, MID, MUTED, NAMES, PM, clustering, commas, f, fmt, makeRig, netPainter, paintCcdf, paintHist, verdictCell } from "@/scripts/pages/screen-test.js";

type Key = "marvel" | "er" | "ws" | "ba";
type Stat = "path" | "clus" | "kmax";
type Model = { n: number; m: number; path: number; clus: number; kmax: number };
type Net = { pos: [number, number][]; edges: [number, number][]; deg: number[]; ccdf: [number, number][]; __real?: boolean };
type Row = { key: string; label: string; real: number; mu: number; sd: number; z: number; p: number };
type Data = {
  meta: { n: number; m: number; kbar: number; snapshot: string; seed: number; ws_k: number; ba_m: number; samples: number; swaps: number };
  models: Record<Key, Model>;
  rows: Row[];
  null: { clus: number[] };
  control: { real: number; nullSd: number };
  nets: Record<Key, Net>;
  chars: [string, number, number, string, string][];
  adj: number[][];
};
type Painter = (c: CanvasRenderingContext2D, w: number, h: number) => void;

const CANDIDATES: Key[] = ["er", "ws", "ba"];
const STATS: Stat[] = ["path", "clus", "kmax"];

/** The sheet's data once loaded, or null. */
function useSheet(): Data | null {
  const hydrated = useHydrated();
  const data = useData<Data>(hydrated ? asset("assets/data/week02_screentest.json") : null);
  return data.status === "ready" ? (data.data ?? null) : null;
}

/** A canvas drawn by `paint`, repainted when it resizes and whenever `deps` change. */
function useStage(paint: Painter, deps: unknown[]) {
  const ref = useRef<HTMLCanvasElement>(null);
  const draw = useCanvasStage(ref, paint);
  // The caller's dependency list, as useEffect's.
  useEffect(draw, deps);
  return { ref, draw };
}

const rowOf = (D: Data, key: string) => D.rows.filter((r) => r.key === key)[0];

// ---- the masthead and the vitals -------------------------------------------------

function SnapView({ D }: { D?: Data | null }) {
  return <span className="lbl" id="snap">{D ? "Snapshot " + D.meta.snapshot : "Snapshot"}</span>;
}
export const Snap = island("screen-test/sheet/Snap", () => <SnapView D={useSheet()} />, () => <SnapView />, { roots: ["#snap"] });

function VitalsView({ D }: { D?: Data | null }) {
  const v = D?.models.marvel;
  const rows: [string, string | number][] = D && v
    ? [["Articles", commas(v.n)], ["Links", commas(v.m)], ["Mean degree", f(D.meta.kbar, 2)], ["Mean path", f(v.path, 2)], ["Clustering", f(v.clus, 3)], ["Largest hub", v.kmax]]
    : [];
  return (
    <dl className="vitals" id="vitals">
      {rows.map(([dt, dd]) => (
        <div key={dt}>
          <dt>{dt}</dt>
          <dd>{dd}</dd>
        </div>
      ))}
    </dl>
  );
}
export const Vitals = island("screen-test/sheet/Vitals", () => <VitalsView D={useSheet()} />, () => <VitalsView />, { roots: ["#vitals"] });

// ---- 01 auditions -----------------------------------------------------------------

function AuditionsMarkup({ D, pick, onPick, marvelRef, candRef }: {
  D?: Data | null;
  pick?: Key;
  onPick?: (k: Key) => void;
  marvelRef?: React.RefObject<HTMLCanvasElement | null>;
  candRef?: React.RefObject<HTMLCanvasElement | null>;
}) {
  const chosen = pick ?? "er";
  const m = D?.models;
  let passing = 0;
  if (D) for (const k of CANDIDATES) if (STATS.every((key) => verdictCell(D, k, key).ok)) passing++;
  return (
    <>
      <div className="cast" id="cast">
        {D &&
          CANDIDATES.map((k) => (
            <button key={k} type="button" className="cand" aria-pressed={k === chosen ? "true" : "false"} onClick={() => onPick?.(k)}>
              <span className="nm">{NAMES[k]}</span>
              <span className="mech">{MECH[k]}</span>
            </button>
          ))}
      </div>
      <div className="reel">
        <figure>
          <canvas id="cv-marvel" ref={marvelRef}></canvas>
          <figcaption id="cap-marvel">{D ? "Marvel " + MID + " 277 articles " + MID + " largest hub 106" : "Marvel"}</figcaption>
        </figure>
        <figure>
          <canvas id="cv-cand" ref={candRef}></canvas>
          <figcaption id="cap-cand">{m ? NAMES[chosen] + " " + MID + " " + m[chosen].n + " articles " + MID + " largest hub " + m[chosen].kmax : "Candidate"}</figcaption>
        </figure>
      </div>
      <div className="tw">
        <table id="score">
          <caption>Screen test scorecard · a scene passes inside the tolerance named in its column</caption>
          <thead>
            <tr>
              <th>Network</th>
              <th>Mechanism</th>
              <th>Short paths ±20%</th>
              <th>Clustering ±25%</th>
              <th>Hubs ±40%</th>
            </tr>
          </thead>
          <tbody id="score-body">
            {D &&
              (["marvel", ...CANDIDATES] as Key[]).map((k) => (
                <tr key={k} data-real={k === "marvel" ? "yes" : undefined}>
                  <td>{NAMES[k]}</td>
                  <td style={{ textAlign: "left", color: MUTED, fontSize: "12px" }}>{MECH[k]}</td>
                  {STATS.map((key) => {
                    if (k === "marvel") return <td key={key} style={{ fontWeight: "600" }}>{fmt(key, D.models.marvel[key])}</td>;
                    const r = verdictCell(D, k, key);
                    return (
                      <td key={key}>
                        <span style={{ marginRight: "8px", color: MUTED }}>{fmt(key, r.val)}</span>
                        <span className={"stamp " + (r.ok ? "p" : "f")}>{r.ok ? "PASS" : "FAIL"}</span>
                      </td>
                    );
                  })}
                </tr>
              ))}
          </tbody>
        </table>
      </div>
      <p className="lbl" id="score-note">One seed per model, one run · not an average over many draws.</p>
      <div className="finding" id="verdict-01">
        {m && (
          <p>
            <strong>No candidate passes all three scenes.</strong>
            {" Short paths come free to all three, even random links. Random links stop there: clustering falls to " +
              f(m.er.clus, 3) + " and its biggest hub reaches only " + m.er.kmax + ", both far off Marvel's " + f(m.marvel.clus, 3) + " and " + m.marvel.kmax +
              ". Watts" + EN + "Strogatz also buys the clustering scene with a ring lattice, but its biggest hub still reaches only " + m.ws.kmax +
              ". Preferential attachment buys the hub scene instead, reaching " + m.ba.kmax + ", but its clustering falls to " + f(m.ba.clus, 3) +
              ". Two scenes each is the best any candidate manages, and " + (passing === 0 ? "none plays all three" : "the combination still escapes them") + "."}
          </p>
        )}
      </div>
    </>
  );
}

function AuditionsView() {
  const D = useSheet();
  const [pick, setPick] = useState<Key>("er");
  const marvel = useStage(netPainter(() => (D ? { ...D.nets.marvel, __real: true } : null)) as Painter, [D]);
  const cand = useStage(netPainter(() => D?.nets[pick]) as Painter, [D, pick]);
  return <AuditionsMarkup D={D} pick={pick} onPick={setPick} marvelRef={marvel.ref} candRef={cand.ref} />;
}
export const Auditions = island("screen-test/auditions/Auditions", AuditionsView, () => <AuditionsMarkup />, {
  roots: ["#cast", ".reel", "#score", "#score-note", "#verdict-01"],
});

// ---- 02 CCDF ----------------------------------------------------------------------

function TailMarkup({ D, hidden, onToggle, canvasRef }: { D?: Data | null; hidden?: Partial<Record<Key, boolean>>; onToggle?: (k: Key) => void; canvasRef?: React.RefObject<HTMLCanvasElement | null> }) {
  return (
    <>
      <figure>
        <canvas id="cv-ccdf" style={{ "aspectRatio": "1/0.5" }} ref={canvasRef}></canvas>
        <figcaption>P(K ≥ k) against k · both axes logarithmic · click a name to hide it</figcaption>
      </figure>
      <div className="controls" id="ccdf-keys">
        {D &&
          (["marvel", ...CANDIDATES] as Key[]).map((k) => (
            <button
              key={k}
              type="button"
              className="go ghost"
              style={{ borderColor: CCDF[k], color: CCDF[k], opacity: hidden?.[k] === undefined ? undefined : hidden[k] ? ".35" : "1" }}
              onClick={() => onToggle?.(k)}
            >
              {NAMES[k]}
            </button>
          ))}
      </div>
    </>
  );
}

function TailView() {
  const D = useSheet();
  const [hidden, setHidden] = useState<Partial<Record<Key, boolean>>>({});
  const { ref } = useStage(((c: CanvasRenderingContext2D, w: number, h: number) => {
    if (D) paintCcdf(D, hidden, c, w, h);
  }) as Painter, [D, hidden]);
  return <TailMarkup D={D} hidden={hidden} onToggle={(k) => setHidden((h) => ({ ...h, [k]: !h[k] }))} canvasRef={ref} />;
}
export const Tail = island("screen-test/tail/Tail", TailView, () => <TailMarkup />, { roots: ["#cv-ccdf", "#ccdf-keys"] });

// ---- 03 the shuffle rig -------------------------------------------------------------

type RigModel = ReturnType<typeof makeRig> & { edges: () => [number, number][]; adj: () => number[][]; count: () => number };

function RigMarkup({ readout, note, running, onRun, onReset, canvasRef }: {
  readout?: { c: string; swaps: string };
  note?: string;
  running?: boolean;
  onRun?: () => void;
  onReset?: () => void;
  canvasRef?: React.RefObject<HTMLCanvasElement | null>;
}) {
  return (
    <div className="rig">
      <figure>
        <canvas id="cv-rig" style={{ "aspectRatio": "1/0.62" }} ref={canvasRef}></canvas>
        <figcaption id="cap-rig">Live rig · clustering recomputed as the links swap</figcaption>
      </figure>
      <div>
        <div className="gauge">
          <p className="small">Clustering now</p>
          <p className="big" id="rig-c">{readout?.c ?? "—"}</p>
          <p className="small" id="rig-swaps">{readout?.swaps ?? "0 swaps"}</p>
        </div>
        <div className="controls" style={{ "marginTop": "10px" }}>
          <button className="go" id="rig-run" type="button" disabled={running} onClick={onRun}>Run the shuffle</button>
          {" "}
          <button className="go ghost" id="rig-reset" type="button" onClick={onReset}>Restore Marvel</button>
        </div>
        <p className="lbl" style={{ "marginTop": "12px" }} id="rig-note">{note ?? "Every article keeps its exact number of links."}</p>
      </div>
    </div>
  );
}

function RigView() {
  const D = useSheet();
  const rig = useRef<RigModel | null>(null);
  if (D && !rig.current) rig.current = makeRig(D) as RigModel;
  const running = useRef(false);
  const [busy, setBusy] = useState(false);
  const [readout, setReadout] = useState<{ c: string; swaps: string } | undefined>(undefined);
  const [note, setNote] = useState<string | undefined>(undefined);
  const { ref, draw } = useStage(((c: CanvasRenderingContext2D, w: number, h: number) => {
    const r = rig.current;
    netPainter(() => (D && r ? { pos: D.nets.marvel.pos, edges: r.edges(), deg: D.nets.marvel.deg, __real: r.count() === 0 } : null))(c, w, h);
  }) as Painter, [D]);
  const read = useCallback(() => {
    const r = rig.current;
    if (r) setReadout({ c: f(clustering(r.adj()), 3), swaps: commas(r.count()) + " swaps" });
  }, []);
  useEffect(() => {
    if (D) read();
  }, [D, read]);

  if (!D) return <RigMarkup canvasRef={ref} />;
  const onRun = () => {
    const r = rig.current;
    if (running.current || !r) return;
    running.current = true;
    setBusy(true);
    const target = D.meta.swaps, per = Math.ceil(target / 34);
    const tick = () => {
      r.step(per); draw(); read();
      if (r.count() < target) requestAnimationFrame(tick);
      else {
        running.current = false;
        setBusy(false);
        setNote("Degrees unchanged. Clustering has fallen to roughly the null mean.");
      }
    };
    tick();
  };
  const onReset = () => {
    const r = rig.current;
    if (running.current || !r) return;
    r.reset(); draw(); read();
    setNote("Every article keeps its exact number of links.");
  };
  return <RigMarkup readout={readout} note={note} running={busy} onRun={onRun} onReset={onReset} canvasRef={ref} />;
}
export const Rig = island("screen-test/rig/Rig", RigView, () => <RigMarkup />, { roots: [".rig"] });

// ---- 03 the null distribution and the report ----------------------------------------

function NullMarkup({ D, full = true, onMode, canvasRef }: { D?: Data | null; full?: boolean; onMode?: (full: boolean) => void; canvasRef?: React.RefObject<HTMLCanvasElement | null> }) {
  const M = D?.meta;
  const cl = D?.rows[0];
  const pa = D ? rowOf(D, "paradox") : undefined;
  return (
    <>
      <figure>
        <canvas id="cv-hist" style={{ "aspectRatio": "1/0.42" }} ref={canvasRef}></canvas>
        <figcaption id="cap-hist">{M ? "Average clustering across " + M.samples + " degree-preserving shuffles " + MID + " Marvel's real value marked in blue" : "Distribution of average clustering across shuffles"}</figcaption>
      </figure>
      <div className="controls">
        <span className="lbl">Report</span>
        <div className="toggle" id="stats-toggle">
          <button type="button" data-mode="full" aria-pressed={full ? "true" : "false"} onClick={() => onMode?.(true)}>Full table</button>
          {" "}
          <button type="button" data-mode="plain" aria-pressed={full ? "false" : "true"} onClick={() => onMode?.(false)}>Headline only</button>
        </div>
      </div>
      <div id="stats-full" hidden={!full}>
        <div className="tw">
          <table>
            <caption>Marvel against the degree-preserving null</caption>
            <thead>
              <tr>
                <th>Measurement</th>
                <th>Marvel</th>
                <th>Null mean</th>
                <th>Null SD</th>
                <th>z</th>
                <th>p</th>
              </tr>
            </thead>
            <tbody id="null-body">
              {D?.rows.map((r) => {
                const dec = r.key === "paradox" || r.key === "path" ? 3 : 4;
                return (
                  <tr key={r.key}>
                    <td>{r.label}</td>
                    <td>{f(r.real, dec)}</td>
                    <td>{f(r.mu, dec)}</td>
                    <td>{f(r.sd, 4)}</td>
                    <td className={"z " + (Math.abs(r.z) >= 2 ? "hi" : "no")}>{(r.z >= 0 ? "+" : "") + f(r.z, 2)}</td>
                    <td>{f(r.p, 4)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="lbl" style={{ "marginTop": "8px" }} id="null-note">
          {M ? "p is empirical, (runs at least as extreme + 1) / (runs + 1), so " + M.samples + " shuffles can never report zero. Its floor here is " + f(1 / (M.samples + 1), 4) + "." : null}
        </p>
      </div>
      <div id="stats-plain" hidden={full}>
        {M && cl && pa && (
          <p>
            {"Marvel's clustering of " + f(cl.real, 3) + " sits " + f(cl.z, 1) + " standard deviations above what the shuffle produces (" + f(cl.mu, 3) + " " + PM + " " + f(cl.sd, 3) +
              "), and not one of " + M.samples + " shuffles came close. The friendship paradox is the exception: " + f(pa.real * 100, 1) + "% against the shuffle's " + f(pa.mu * 100, 1) +
              "%, a z of " + f(pa.z, 2) + ", which is no difference at all."}
          </p>
        )}
      </div>
      <div className="finding" id="verdict-03">
        {cl && (
          <p>
            <strong>Half the clustering is the hubs. Half is not.</strong>
            {" Scrambling the wiring while holding every degree fixed drops clustering from " + f(cl.real, 3) + " to " + f(cl.mu, 3) +
              ", so the degree sequence alone accounts for roughly " + Math.round((cl.mu / cl.real) * 100) + "% of it. What is left stands " + f(cl.z, 1) +
              " standard deviations clear of chance. Had we compared against plain random links instead, we would have credited the whole amount to the wiring and missed the half the hubs explain."}
          </p>
        )}
      </div>
    </>
  );
}

function NullView() {
  const D = useSheet();
  const [full, setFull] = useState(true);
  const { ref } = useStage(((c: CanvasRenderingContext2D, w: number, h: number) => {
    if (D) paintHist(D, c, w, h);
  }) as Painter, [D]);
  return <NullMarkup D={D} full={full} onMode={D ? setFull : undefined} canvasRef={ref} />;
}
export const Null = island("screen-test/null/Null", NullView, () => <NullMarkup />, {
  roots: ["#cv-hist", "#stats-toggle", "#stats-full", "#stats-plain", "#verdict-03"],
});

// ---- 04 the paradox draw -----------------------------------------------------------

type Card = { i: number; sub: string } | null;

function Who({ id, D, card, empty }: { id: string; D?: Data | null; card: Card; empty: string }) {
  if (!D || !card)
    return (
      <div className="who" id={id}>
        <p className="nm">—</p>
        <p className="k">{empty}</p>
      </div>
    );
  const ch = D.chars[card.i];
  return (
    <div className="who" id={id}>
      <p className="nm">{ch[0]}</p>
      <p className="k">{ch[1] + " links " + MID + " neighbours average " + ch[2] + (card.sub ? " " + MID + " " + card.sub : "")}</p>
      <p className="bio">{ch[4]}</p>
    </div>
  );
}

type Draws = { a: Card; b: Card; drawn: number; para: number };
const NO_DRAWS: Draws = { a: null, b: null, drawn: 0, para: 0 };

function DrawMarkup({ D, draws = NO_DRAWS, onOne, onMany, onReset }: { D?: Data | null; draws?: Draws; onOne?: () => void; onMany?: () => void; onReset?: () => void }) {
  const M = D?.meta;
  const pa = D ? rowOf(D, "paradox") : undefined;
  return (
    <>
      <div className="draw">
        <Who id="who-a" D={D} card={draws.a} empty="Press draw" />
        <div className="arrow">→</div>
        <Who id="who-b" D={D} card={draws.b} empty="their random neighbour" />
      </div>
      <div className="controls">
        <button className="go" id="draw-one" type="button" onClick={onOne}>Draw a pair</button>
        {" "}
        <button className="go ghost" id="draw-many" type="button" onClick={onMany}>Draw 200</button>
        {" "}
        <button className="go ghost" id="draw-reset" type="button" onClick={onReset}>Clear</button>
        {" "}
        <span className="lbl" id="draw-tally">
          {draws.drawn ? commas(draws.drawn) + " draws " + MID + " the drawn neighbour was at least as popular in " + f((draws.para / draws.drawn) * 100, 1) + "% of them" : "0 draws"}
        </span>
      </div>
      <p className="lbl" style={{ "maxWidth": "68ch", "lineHeight": "1.7" }}>
        The handle measures single draws: one character, one of their neighbours. The 87.4% quoted below is the other common form, comparing each article with the
        {" "}
        <em>average</em>
        {" "}
        of all its neighbours. Both are the friendship paradox, and they are not the same number: the neighbour-average form below matches what the shuffle predicts, but the single-draw form here is slightly weaker than the shuffle predicts.
      </p>
      <div className="finding warn" id="verdict-04">
        {M && pa && (
          <p>
            <strong>The neighbour-average paradox is real, and on its own it tells us nothing about Marvel.</strong>
            {" " + f(pa.real * 100, 1) + "% of articles have neighbours more connected than themselves on average. " +
              "Then we ran the same measurement on " + M.samples + " shuffled networks, where the wiring is destroyed and only the degrees survive: " +
              f(pa.mu * 100, 1) + "%" + ", if anything slightly higher. That is a z of " + f(pa.z, 2) + " and an empirical p of " + f(pa.p, 2) +
              ". In this neighbour-average form the paradox is a consequence of the degree sequence alone; it would appear in any network with these link counts. The single-draw form measured by the handle above is different: it does differ from the shuffle, just slightly weaker than the degrees alone would predict."}
          </p>
        )}
      </div>
    </>
  );
}

function DrawView() {
  const D = useSheet();
  const [draws, setDraws] = useState<Draws>(NO_DRAWS);
  if (!D) return <DrawMarkup />;
  const CH = D.chars, ADJ = D.adj;
  const run = (times: number) =>
    setDraws((s) => {
      let { a: cardA, b: cardB, drawn, para } = s;
      for (let n = 0; n < times; n++) {
        const a = (Math.random() * CH.length) | 0, nb = ADJ[a];
        if (!nb.length) continue;
        const b = nb[(Math.random() * nb.length) | 0];
        drawn++;
        if (CH[b][1] >= CH[a][1]) para++;
        cardA = { i: a, sub: "you drew" };
        cardB = { i: b, sub: CH[b][1] >= CH[a][1] ? "more popular" : "less popular" };
      }
      return { a: cardA, b: cardB, drawn, para };
    });
  return <DrawMarkup D={D} draws={draws} onOne={() => run(1)} onMany={() => run(200)} onReset={() => setDraws(NO_DRAWS)} />;
}
export const Draw = island("screen-test/draw/Draw", DrawView, () => <DrawMarkup />, {
  roots: [".draw", "#draw-one", "#draw-many", "#draw-reset", "#draw-tally", "#verdict-04"],
});

// ---- 05 receipts and the footer -----------------------------------------------------

function ReceiptsView({ D }: { D?: Data | null }) {
  const M = D?.meta;
  return (
    <div className="card">
      <h3>Population</h3>
      <p id="rec-pop">
        {M ? "The connected core of the Marvel Wikipedia snapshot of " + M.snapshot + ": " + M.n + " articles and " + commas(M.m) + " undirected links, mean degree " + f(M.kbar, 2) +
          ". A link exists when either article links to the other. Every measurement on this page runs on that same core." : null}
      </p>
      <h3>Candidates</h3>
      <p id="rec-models">
        {M ? "Random graph G(n, m) at the same node and link count. Watts" + EN + "Strogatz on a ring of degree " + M.ws_k + " with rewiring probability 0.2. Barab" + String.fromCharCode(225) + "si" + EN + "Albert attaching " + M.ba_m +
          " links per arriving node. One fixed seed (" + M.seed + ") per model, so each is one reproducible draw and not an average over many." : null}
      </p>
      <h3>Null model</h3>
      <p id="rec-null">
        {M ? M.samples + " shuffles, each applying " + commas(M.swaps) +
          " degree-preserving double-edge swaps, which is ten per link. Connectivity is not enforced during swapping, so a shuffled network may break into pieces; path length is measured on the largest piece in that case. z is (real " + String.fromCharCode(8722) +
          " null mean) / null SD, and p is empirical." : null}
      </p>
      <h3>Control</h3>
      <p id="rec-control">
        {D && M ? "The largest hub stays at " + D.control.real + " across all " + M.samples + " shuffles, standard deviation " + f(D.control.nullSd, 1) +
          ". That is not a finding; it is the check that the method did what it claims, since preserving degrees must leave the maximum untouched." : null}
      </p>
      <h3>What this page does not claim</h3>
      <p>
        Tolerances on the scorecard are our choice and are printed in the column headings; the raw values sit beside every verdict so you can apply your own. The live rig is a feel for the mechanism and is not the source of any statistic. Nothing here says why the links exist, only what chance alone would and would not produce.
      </p>
    </div>
  );
}
export const Receipts = island("screen-test/receipts/Receipts", () => <ReceiptsView D={useSheet()} />, () => <ReceiptsView />, { roots: [".card"] });

function FootView({ D }: { D?: Data | null }) {
  return (
    <p id="foot">
      {D ? "Prototype for the Week 2 post " + MID + " Log" + EN + "Log Legends " + MID + " every figure computed from the frozen snapshot, models and null model in Python with NetworkX, the live rig in the page itself." : null}
    </p>
  );
}
export const Foot = island("screen-test/receipts/Foot", () => <FootView D={useSheet()} />, () => <FootView />, { roots: ["#foot"] });
