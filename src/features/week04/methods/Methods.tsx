"use client";
// The deep dive's four community methods (#cut-methods), which
// week04-methods.js built on main: Girvan–Newman one cut at a time, moving a
// metro to watch modularity, Louvain move by move, and overlapping
// communities. Nothing loads until the box is first opened; then the three
// files load, the status line goes and the tabs show. A contents link to a
// method (the deep-dive store's method ask) presses its tab once they work.
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Drawers } from "@/components/post/Drawers";
import { Term } from "@/components/post/Term";
import { TermText } from "@/kit";
import { island, useIslandReady } from "@/lib/island";
import { useEChartsMap, type EChartsHandler } from "@/lib/useEChart";
import { useStore } from "@/lib/useStore";
import {
  MAP_NAME,
  METHOD_TOKENS,
  gnGo,
  gnModel,
  gnOption,
  lineChartLayout,
  louvainGo,
  louvainModel,
  louvainOption,
  methodsContext,
  modAct,
  modModel,
  modOption,
  overlapItem,
  overlapModel,
  overlapOption,
  stripScale,
} from "@/scripts/week04-methods.js";
import { mainland } from "@/scripts/week04-place.js";
import { deep, setTab } from "../frame/deep";
import { W4Chart } from "../W4Chart";
import { W4, useW4Data } from "../useW4Data";
import { useT, type T } from "../useT";

type Ctx = ReturnType<typeof methodsContext>;
type Live = { explore: any; place: any; ctx: Ctx; T: T };

const resize = () => window.dispatchEvent(new Event("resize"));

// The size CSS gives an svg, in whole px, or the fallback until it is laid out.
function useBox(ref: React.RefObject<SVGSVGElement | null>, fallback: [number, number]) {
  const [box, setBox] = useState(fallback);
  useEffect(() => {
    const svg = ref.current;
    if (!svg) return;
    const read = () => {
      const w = Math.floor(svg.clientWidth);
      const h = Math.floor(svg.clientHeight);
      if (w && h) setBox((b) => (b[0] === w && b[1] === h ? b : [w, h]));
    };
    read();
    const observer = new ResizeObserver(read);
    observer.observe(svg);
    return () => observer.disconnect();
  }, [ref]);
  return box;
}

// A static-domain line chart: axis, ticks, reference line and the whole
// series, with a marker at step `at`.
function LineChart({ id, ys, at, opts, T }: { id: string; ys: number[]; at: number; opts: { ref: number | null; refLabel?: string; xLabel: string; title: string }; T: T }) {
  const ref = useRef<SVGSVGElement>(null);
  const [W, H] = useBox(ref, [1000, 200]);
  const L = useMemo(() => lineChartLayout(ys, opts, W, H), [ys, opts, W, H]);
  const caption = T.fs("caption");
  const mk = L.marker(at);
  const t = T.token;
  return (
    <svg className="w4m-chart" id={id} role="img" ref={ref} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
      <title>{opts.title}</title>
      {L.ticks.map((k: any, i: number) => [
        <line key={`l${i}`} x1={L.L} y1={k.y} x2={W - L.R} y2={k.y} stroke={t("--line")} strokeWidth="1"></line>,
        <text key={`t${i}`} x={L.L - 8} y={k.ty} fontSize={caption} fill={t("--ink-mute-text")} textAnchor="end">
          {k.v.toFixed(2)}
        </text>,
      ])}
      {L.ref ? <line x1={L.L} y1={L.ref.y} x2={W - L.R} y2={L.ref.y} stroke={t("--ink-mute")} strokeWidth="1.4" strokeDasharray="5 4"></line> : null}
      {L.ref && opts.refLabel ? (
        <text x={W - L.R} y={L.ref.ty} fontSize={caption} fill={t("--ink-soft")} textAnchor="end">
          {opts.refLabel}
        </text>
      ) : null}
      <path d={L.d} fill="none" stroke={t("--ink")} strokeWidth="2"></path>
      <text x={W - L.R} y={H - 6} fontSize={caption} fill={t("--ink-mute-text")} textAnchor="end">
        {opts.xLabel}
      </text>
      <line className="w4m-marker-line" x1={mk.x} y1={L.T - 4} x2={mk.x} y2={H - L.Bm} stroke={t("--w4-accent")} strokeWidth="1.4"></line>
      <circle className="w4m-marker-dot" cx={mk.x} cy={mk.y} r="5.5" fill={t("--card")} stroke={t("--w4-accent")} strokeWidth="2"></circle>
    </svg>
  );
}

// The modularity strip: a band for the rewired baseline, a reference tick for
// Louvain's score, and a marker for the visitor's current groups.
function Strip({ s, q, T }: { s: { loQ: number; hiQ: number; band: number[]; meanQ: number; refQ: number }; q: number; T: T }) {
  const ref = useRef<SVGSVGElement>(null);
  const [W, H] = useBox(ref, [440, 70]);
  const { Lm, Rm, SX } = stripScale(s, W);
  const caption = T.fs("caption");
  const t = T.token;
  const bx0 = SX(s.band[0]);
  const bx1 = SX(s.band[1]);
  return (
    <svg className="w4m-strip" id="w4m-mod-strip" role="img" ref={ref} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
      <title>Your modularity against the rewired networks and Louvain’s</title>
      <line x1={Lm} y1="30" x2={W - Rm} y2="30" stroke={t("--line")} strokeWidth="1"></line>
      <rect x={bx0.toFixed(1)} y="24" width={(bx1 - bx0).toFixed(1)} height="12" rx="6" fill={t("--w4-band")}></rect>
      <line x1={SX(s.meanQ).toFixed(1)} y1="21" x2={SX(s.meanQ).toFixed(1)} y2="39" stroke={t("--ink-mute")} strokeWidth="2"></line>
      <text x={SX(s.meanQ).toFixed(1)} y="54" fontSize={caption} fill={t("--ink-soft")} textAnchor="middle">
        rewired {s.meanQ.toFixed(3)}
      </text>
      <line x1={SX(s.refQ).toFixed(1)} y1="16" x2={SX(s.refQ).toFixed(1)} y2="44" stroke={t("--ink-soft")} strokeWidth="1.3" strokeDasharray="3 2"></line>
      <text x={SX(s.refQ).toFixed(1)} y="12" fontSize={caption} fill={t("--ink-soft")} textAnchor="middle">
        Louvain {s.refQ.toFixed(3)}
      </text>
      {[-0.02, 0, 0.02, 0.04, 0.06].map((v) => (
        <text key={v} x={SX(v).toFixed(1)} y="68" fontSize={caption} fill={t("--ink-mute-text")} textAnchor="middle">
          {v.toFixed(2)}
        </text>
      ))}
      <circle className="w4m-strip-mk" cx={SX(q).toFixed(1)} cy="30" r="7" fill={t("--ink")} stroke={t("--card")} strokeWidth="2"></circle>
    </svg>
  );
}

// A drawer that main hid when the data no longer said what its text says.
function Drawer({ label, hidden, children }: { label: string; hidden?: boolean; children: ReactNode }) {
  return (
    <details className="rx-drawer" hidden={hidden}>
      <summary>{label}</summary>
      <div className="rx-drawer-body">{children}</div>
    </details>
  );
}

function Btn({ act, primary, children, onAct }: { act: string; primary?: boolean; children: ReactNode; onAct?: (act: string) => void }) {
  return (
    <button className={primary ? "w4m-btn primary" : "w4m-btn"} data-act={act} type="button" onClick={onAct ? () => onAct(act) : undefined}>
      {children}
    </button>
  );
}

// ---- 1 · Girvan–Newman

function GN({ live, show }: { live: Live | null; show: boolean }) {
  const m = useMemo(() => (live ? gnModel(live.explore, live.place, live.ctx) : null), [live]);
  const [s, setS] = useState(0);
  const option = useMemo(() => (live && m ? gnOption(m, live.ctx, s, live.T.token, live.T) : null), [live, m, s]);
  const st = m?.steps[s];
  const onAct = m ? (act: string) => setS((cur) => gnGo(m, cur, act)) : undefined;
  return (
    <section aria-labelledby="w4m-tab-gn" className="w4m-panel" data-panel="gn" id="w4m-panel-gn" hidden={!show}>
      <p className="w4m-eyebrow">Explore · after the course's week 4</p>
      <h3 className="w4m-title" id="w4m-gn-title">Girvan–Newman, one cut at a time</h3>
      <p className="w4m-lead" id="w4m-gn-lead">
        {m ? (
          <TermText
            text={m.lead}
            phrase="modularity"
            definition="How much more of the link weight falls inside the groups than chance would put there. Higher means sharper groups."
            id="w4-term-w4m-panel-gn-modularity"
          />
        ) : null}
      </p>
      <div className="w4m-controls" role="group" aria-label="Girvan–Newman controls">
        <Btn act="step" primary onAct={onAct}>Step</Btn>{" "}
        <Btn act="split" onAct={onAct}>Next split</Btn>{" "}
        <Btn act="back" onAct={onAct}>Back</Btn>{" "}
        <Btn act="reset" onAct={onAct}>Reset</Btn>
      </div>
      <div className="w4m-grid">
        <W4Chart className="w4m-map" id="w4m-gn-map" option={option} />
        <div aria-live="polite" className="w4m-side">
          <div className="w4m-stats">
            <div className="w4m-stat">
              <b id="w4m-gn-step">{m ? `${s} of ${m.n}` : null}</b>
              <span>links removed</span>
            </div>
            <div className="w4m-stat">
              <b id="w4m-gn-comps">{st ? String(st.comps) : null}</b>
              <span>
                pieces, largest first:{" "}
                <span id="w4m-gn-sizes">{st?.sizesText}</span>
              </span>
            </div>
          </div>
          <div className="w4m-rows">
            <div className="w4m-row">
              <span>Next to go</span>
              <b id="w4m-gn-next">{st?.nextText}</b>
            </div>
            <div className="w4m-row">
              <span>Its edge betweenness</span>
              <b id="w4m-gn-bet">{st?.bet}</b>
            </div>
            <div className="w4m-row">
              <span>Modularity of these pieces</span>
              <b id="w4m-gn-q">{st ? st.Q.toFixed(4) : null}</b>
            </div>
          </div>
          <p className="w4m-note">
            Thick line: the next link to go, the one carrying the most shortest paths. Dashed: links already cut. Hollow dots: metros cut off on their own.
          </p>
        </div>
      </div>
      <figure className="w4m-figure">
        <figcaption>
          <span className="w4m-fig-title">Modularity after each split</span>{" "}
          <span className="w4m-fig-caption" id="w4m-gn-caption">{m?.caption}</span>
        </figcaption>
        {live && m && st ? (
          <LineChart id="w4m-gn-chart" ys={m.qs} at={st.li} opts={GN_LINE} T={live.T} />
        ) : (
          <svg className="w4m-chart" id="w4m-gn-chart" role="img"></svg>
        )}
      </figure>
      <Drawers variant="foot">
        <Drawer label="Background" hidden={Boolean(m && !m.background)}>
          <p>
            <span id="w4m-gn-hubs">{m?.background?.hubs}</span> link to every other metro, so each split strands a single metro, starting with{" "}
            <span id="w4m-gn-first">{m?.background?.first}</span>.
          </p>
        </Drawer>
      </Drawers>
    </section>
  );
}

const GN_LINE = { ref: 0, refLabel: "0: the backbone as one piece", xLabel: "split →", title: "Modularity of the pieces after each split" };

// ---- 2 · Move a metro, watch modularity

function Mod({ live, show }: { live: Live | null; show: boolean }) {
  const m = useMemo(() => (live ? modModel(live.explore, live.place, live.ctx) : null), [live]);
  const [state, setState] = useState<{ g: Record<string, number>; last: string } | null>(null);
  const cur = state ?? (m ? { g: m.page, last: "none yet" } : null);
  const option = useMemo(() => (live && cur ? modOption(live.ctx, cur.g, live.T.token, live.T) : null), [live, cur?.g]);
  const events = useMemo<Record<string, EChartsHandler>>(
    () => ({
      click: (ev: { data?: { id?: string } }) => {
        const id = ev.data?.id;
        if (!id || !live || !m) return;
        setState((s) => {
          const g = s?.g ?? m.page;
          const next = { ...g, [id]: (g[id] + 1) % 3 };
          return { g: next, last: `${live.ctx.CITY[id].name} to group ${next[id] + 1}` };
        });
      },
    }),
    [live, m],
  );
  const onAct = live && m ? (act: string) => setState((s) => modAct(m, live.ctx, (s ?? { g: m.page }).g, act)) : undefined;
  const Q = m && cur ? m.computeQ(cur.g) : null;
  const sizes = cur && live ? [0, 1, 2].map((k) => live.ctx.IDS.filter((id: string) => cur.g[id] === k).length).join(" · ") : null;
  return (
    <section aria-labelledby="w4m-tab-mod" className="w4m-panel" data-panel="mod" id="w4m-panel-mod" hidden={!show}>
      <p className="w4m-eyebrow">Explore · after the course's week 4</p>
      <h3 className="w4m-title">Move a metro, watch modularity</h3>
      <p className="w4m-lead" id="w4m-mod-lead">{m?.lead}</p>
      <div className="w4m-controls" role="group" aria-label="Modularity controls">
        <Btn act="reset" primary onAct={onAct}>Louvain's groups</Btn>{" "}
        <Btn act="shuffle" onAct={onAct}>Shuffle the labels</Btn>{" "}
        <Btn act="one" onAct={onAct}>Everyone in one group</Btn>
      </div>
      <div className="w4m-grid">
        <W4Chart className="w4m-map" id="w4m-mod-map" option={option} onEvents={events} />
        <div aria-live="polite" className="w4m-side">
          <div className="w4m-stats">
            <div className="w4m-stat">
              <b id="w4m-mod-q">{Q === null ? null : Q.toFixed(3)}</b>
              <span id="w4m-mod-q-label">{m ? m.qLabel : "modularity of your three groups"}</span>
            </div>
          </div>
          {live && m && Q !== null ? <Strip s={m.strip} q={Q} T={live.T} /> : <svg className="w4m-strip" id="w4m-mod-strip" role="img"></svg>}
          <div className="w4m-rows">
            <div className="w4m-row">
              <span>Metros per group</span>
              <b id="w4m-mod-sizes">{sizes}</b>
            </div>
            <div className="w4m-row">
              <span>Last move</span>
              <b id="w4m-mod-last">{cur ? cur.last : "none yet"}</b>
            </div>
          </div>
          <p className="w4m-note">
            Grey band: rewired networks in which each company keeps its number of metros, Louvain's best on each, mean and one standard deviation.
          </p>
        </div>
      </div>
    </section>
  );
}

// ---- 3 · Louvain, move by move

function Louvain({ live, show }: { live: Live | null; show: boolean }) {
  const m = useMemo(() => (live ? louvainModel(live.explore, live.place, live.ctx) : null), [live]);
  const [s, setS] = useState(0);
  const option = useMemo(() => (live && m ? louvainOption(m, live.ctx, s, live.T.token, live.T) : null), [live, m, s]);
  const line = useMemo(() => (m ? { ref: m.ref, refLabel: m.refLabel, xLabel: "move →", title: "Modularity after each move" } : null), [m]);
  const st = m?.steps[s];
  const onAct = m ? (act: string) => setS((cur) => louvainGo(m, cur, act)) : undefined;
  return (
    <section aria-labelledby="w4m-tab-louvain" className="w4m-panel" data-panel="louvain" id="w4m-panel-louvain" hidden={!show}>
      <p className="w4m-eyebrow">Explore · after the course's week 4</p>
      <h3 className="w4m-title">Louvain, move by move</h3>
      <p className="w4m-lead" id="w4m-louvain-lead">{m?.lead}</p>
      <div className="w4m-controls" role="group" aria-label="Louvain controls">
        <Btn act="step" primary onAct={onAct}>Step</Btn>{" "}
        <Btn act="level" onAct={onAct}>Finish this level</Btn>{" "}
        <Btn act="back" onAct={onAct}>Back</Btn>{" "}
        <Btn act="reset" onAct={onAct}>Reset</Btn>
      </div>
      <div className="w4m-grid">
        <W4Chart className="w4m-map" id="w4m-louvain-map" option={option} />
        <div aria-live="polite" className="w4m-side">
          <div className="w4m-stats">
            <div className="w4m-stat">
              <b id="w4m-louvain-q">{st ? st.Q.toFixed(3) : null}</b>
              <span>modularity after this move</span>
            </div>
            <div className="w4m-stat">
              <b id="w4m-louvain-n">{st ? String(st.n) : null}</b>
              <span>communities</span>
            </div>
          </div>
          <div className="w4m-rows">
            <div className="w4m-row">
              <span>Move</span>
              <b id="w4m-louvain-step">{m ? `${s} of ${m.steps.length - 1}` : null}</b>
            </div>
            <div className="w4m-row">
              <span>Level</span>
              <b id="w4m-louvain-level">{st ? String(st.level) : null}</b>
            </div>
            <div className="w4m-row">
              <span>Moved</span>
              <b id="w4m-louvain-moved">{st?.moved}</b>
            </div>
            <div className="w4m-row">
              <span>Gain in modularity</span>
              <b id="w4m-louvain-gain">{st?.gain}</b>
            </div>
          </div>
          <p className="w4m-note">
            Hollow dots are alone in their community. A community of two or more takes the colour of the metro group most of its members end in.
          </p>
        </div>
      </div>
      <figure className="w4m-figure">
        <figcaption>
          <span className="w4m-fig-title">Modularity after each move</span>{" "}
          <span className="w4m-fig-caption">The dashed line is where Louvain lands on rewired networks. The ring marks the current move.</span>
        </figcaption>
        {live && m && line ? <LineChart id="w4m-louvain-chart" ys={m.qs} at={s} opts={line} T={live.T} /> : <svg className="w4m-chart" id="w4m-louvain-chart" role="img"></svg>}
      </figure>
      <Drawers variant="foot">
        <Drawer label="Method" hidden={Boolean(m && !m.method)}>
          <p>
            The run uses seed <span id="w4m-louvain-seed">{m?.method?.seed}</span> and all <span id="w4m-louvain-links">{m?.method?.links}</span> weighted links. The moves lift{" "}
            <Term id="w4-term-cut-methods-q" word="Q">The usual symbol for modularity.</Term> from <span id="w4m-louvain-q-from">{m?.method?.from}</span> to{" "}
            <span id="w4m-louvain-q-to">{m?.method?.to}</span>; the second level finds nothing to merge.
          </p>
        </Drawer>
      </Drawers>
    </section>
  );
}

// ---- 4 · Overlap

const MODES = [
  ["link", "Link communities"],
  ["k3", "k = 3"],
  ["k4", "k = 4"],
  ["k5", "k = 5"],
  ["k6", "k = 6"],
] as const;

function Overlap({ live, show }: { live: Live | null; show: boolean }) {
  const m = useMemo(() => (live ? overlapModel(live.explore, live.place, live.ctx) : null), [live]);
  const [mode, setMode] = useState("link");
  const [j, setJ] = useState(0);
  const option = useMemo(() => (live && m ? overlapOption(m, live.ctx, mode, j, live.T.token, live.T) : null), [live, m, mode, j]);
  const shown = m ? overlapItem(m, mode, j) : null;
  return (
    <section aria-labelledby="w4m-tab-overlap" className="w4m-panel" data-panel="overlap" id="w4m-panel-overlap" hidden={!show}>
      <p className="w4m-eyebrow">Explore · after the course's week 4</p>
      <h3 className="w4m-title">Overlap: k-cliques and link communities</h3>
      <p className="w4m-lead" id="w4m-overlap-lead">
        {m ? (
          <TermText
            text={m.lead}
            phrase="Clique percolation"
            definition="Grows groups from cliques: sets of k metros that all link to each other. Cliques that overlap in almost every metro join the same group."
            id="w4-term-w4m-panel-overlap-clique"
          />
        ) : null}
      </p>
      <div className="w4m-controls" id="w4m-overlap-modes" role="group" aria-label="Overlap controls">
        {MODES.map(([value, label]) => [
          <button
            key={value}
            aria-pressed={mode === value ? "true" : "false"}
            className="w4m-btn segment"
            data-mode={value}
            type="button"
            onClick={() => {
              if (!m) return;
              setMode(value);
              setJ(0);
            }}
          >
            {label}
          </button>,
          " ",
        ])}
        <button className="w4m-btn primary" data-act="next" type="button" onClick={() => m && setJ((x) => x + 1)}>
          Next community
        </button>
      </div>
      <div className="w4m-grid">
        <W4Chart className="w4m-map" id="w4m-overlap-map" option={option} />
        <div aria-live="polite" className="w4m-side">
          <div className="w4m-stats">
            <div className="w4m-stat">
              <b id="w4m-overlap-count">{shown ? String(shown.view.count) : null}</b>
              <span>
                communities ·{" "}
                <span id="w4m-overlap-title">{shown?.view.title}</span>
              </span>
            </div>
          </div>
          <p className="w4m-extra" id="w4m-overlap-extra">{shown?.view.extra}</p>
          <div className="w4m-rows">
            <div className="w4m-row">
              <span>Showing</span>
              <b id="w4m-overlap-which">{shown ? (shown.view.items.length ? `${(j % shown.view.items.length) + 1} of ${shown.view.items.length}` : "none") : null}</b>
            </div>
          </div>
          <p className="w4m-names" id="w4m-overlap-names">{shown?.item.names}</p>
          <p className="w4m-note">
            Dark links and filled dots: the community shown. Rings: metros that belong to two or more communities at this setting.
          </p>
        </div>
      </div>
      <Drawers variant="foot">
        <Drawer label="Method">
          <p>
            Link communities group the links, and a metro joins every community its links are in.
            <span id="w4m-overlap-fringe">{m?.fringe}</span>
          </p>
        </Drawer>
      </Drawers>
    </section>
  );
}

// ---- the box

const TABS = [
  ["gn", "Girvan–Newman"],
  ["mod", "Modularity"],
  ["louvain", "Louvain"],
  ["overlap", "Overlap"],
] as const;

const LOADING = "Loading the community explorables…";
const FILES = [W4.data("explore"), W4.place, W4.usa];

function Body({ live, status, tab, onTab }: { live: Live | null; status: string | null; tab: string; onTab?: (tab: string) => void }) {
  return (
    <>
      {status !== null ? (
        <p aria-live="polite" className="status-line" id="methods-status">
          {status}
        </p>
      ) : null}
      <div className="w4m" id="w4m-root" hidden={!live}>
        <div className="w4m-tabs">
          {TABS.map(([panel, label], i) => [
            i > 0 ? " " : null,
            <button
              key={panel}
              aria-pressed={tab === panel ? "true" : "false"}
              className="w4m-tab"
              data-panel={panel}
              id={`w4m-tab-${panel}`}
              type="button"
              onClick={onTab ? () => onTab(panel) : undefined}
            >
              {label}
            </button>,
          ])}
        </div>
        <GN live={live} show={tab === "gn"} />
        <Mod live={live} show={tab === "mod"} />
        <Louvain live={live} show={tab === "louvain"} />
        <Overlap live={live} show={tab === "overlap"} />
      </div>
    </>
  );
}

function Server() {
  return <Body live={null} status={LOADING} tab="gn" />;
}

function MethodsView() {
  // Built lazily: nothing loads until #cut-methods is first opened.
  const [opened, setOpened] = useState(false);
  useEffect(() => {
    const box = document.getElementById("cut-methods") as HTMLDetailsElement | null;
    if (!box) return;
    if (box.open) setOpened(true);
    const controller = new AbortController();
    box.addEventListener("toggle", () => box.open && setOpened(true), { signal: controller.signal });
    return () => controller.abort();
  }, []);
  const states = FILES.map((path) => useW4Data(path, "methods", { enabled: opened }));
  const [explore, place, usa] = states.every((st) => st.status === "ready") ? states.map((st) => st.data) : [];
  const error = states.find((st) => st.status === "error")?.error as Error | undefined;
  const mapReady = useEChartsMap(MAP_NAME, usa ?? null, mainland);
  const T = useT(METHOD_TOKENS);
  const live = useMemo<Live | null>(
    () => (explore && place && T && mapReady ? { explore, place, ctx: methodsContext(explore, place), T } : null),
    [explore, place, T, mapReady],
  );
  const [tab, setTabShown] = useState("gn");
  const ask = useStore(deep, (s) => s.method);
  useEffect(() => {
    if (live && ask) setTabShown(ask.panel);
  }, [live, ask]);
  // The deep dive's contents mark the method on show.
  useEffect(() => {
    if (live) setTab(tab);
  }, [live, tab]);
  // The maps were set up while their container was hidden; size them once it shows.
  useEffect(() => {
    if (!live) return;
    const frame = requestAnimationFrame(resize);
    return () => cancelAnimationFrame(frame);
  }, [live, tab]);
  useIslandReady(live !== null);
  const status = live ? null : error ? `Community explorables failed to load: ${error.message ?? error}` : LOADING;
  return <Body live={live} status={status} tab={tab} onTab={setTabShown} />;
}

/** <Methods />: the #cut-methods body's status line and tabs. */
export const Methods = island("week04/methods/Methods", MethodsView, Server, { roots: ["#methods-status", "#w4m-root"] });
