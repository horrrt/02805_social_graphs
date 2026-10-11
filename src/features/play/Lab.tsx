"use client";
// The Baymax link experiment that signal.js ran on main: load the frozen
// network, check it and every imagined state against the exporter's counts,
// draw the map, and play the two missions and the replay. Before the data
// arrives (and if it fails) the section is its server markup; a failed load
// writes the error into #signal-load and hides the first choices, as main did.
import { useEffect, useMemo, useRef, useState } from "react";
import { island } from "@/lib/island";
import { useData } from "@/lib/useData";
import { useHydrated } from "@/lib/useHydrated";
import { useElementSize } from "@/lib/useSize";
import { useTypeScale, type TypeScale } from "@/lib/useTypeScale";
import { asset } from "@/scripts/site.js";
import {
  EDGE,
  PLACEHOLDER,
  RING,
  STATUS,
  addedLinks,
  backgroundLines,
  buildScenarios,
  checkSnapshot,
  dotFill,
  dotRadius,
  edits,
  layout,
  palette,
  sceneType,
} from "@/scripts/signal.js";

type Mode = "snapshot" | "out" | "in" | "both";
type Node = { id: string; name: string; kin: number; kout: number; grp: string; x: number; y: number };
type Graph = { nodes: Node[]; links: { s: string; t: string }[]; signal: Record<Mode, unknown> };
type Reach = { to: Set<string>; from: Set<string>; roundTrip: number };
type Model = { graph: Graph; scenarios: Record<Mode, Reach>; positions: Map<string, [number, number]>; lines: number[][] };
type Step = { complete: boolean; mark: string; current: boolean };
type Mission = {
  phase: 1 | 2 | 3;
  mode: Mode;
  renders: number;
  label: string;
  title: string | null;
  copy: string;
  kicker: string;
  feedback: string;
  success: boolean;
  hide: { first: boolean; next: boolean; ret: boolean; finish: boolean; replay: boolean; restart: boolean };
  found: Step;
  reply: Step;
  focus: { target: "edit" | "return" | "finish" | null; n: number };
};

const FIRST_COPY = "Help a reader elsewhere in the network find Baymax. You have one imagined link. Which page should it go on?";
const CATCH = "A link is a one-way door. Writing about someone doesn’t make them link back.";

const START: Mission = {
  phase: 1,
  mode: "snapshot",
  renders: 0,
  label: "MISSION 01 / BE FOUND",
  title: null,
  copy: FIRST_COPY,
  kicker: "THE CATCH",
  feedback: CATCH,
  success: false,
  hide: { first: false, next: true, ret: true, finish: true, replay: true, restart: true },
  found: { complete: false, mark: "01", current: true },
  reply: { complete: false, mark: "02", current: false },
  focus: { target: null, n: 0 },
};

const REPLAYS: [Mode, string][] = [
  ["snapshot", "No links"],
  ["out", "Out only"],
  ["in", "In only"],
  ["both", "Both"],
];

type Live = {
  model: Model;
  m: Mission;
  scale: TypeScale | null;
  unit: number | null;
  choose: (mode: Mode) => void;
  next: () => void;
  addReturn: () => void;
  replay: (mode: Mode) => void;
  restart: () => void;
  refs: { edit: React.RefObject<HTMLButtonElement | null>; ret: React.RefObject<HTMLButtonElement | null>; finish: React.RefObject<HTMLAnchorElement | null> };
};

// The map's children once the graph is in: the scene signal.js drawScene() built and render() coloured.
function Scene({ live }: { live: Live }) {
  const { model, m, scale, unit } = live;
  const state = model.scenarios[m.mode];
  const added = edits[m.mode as Mode].length;
  const type = (cls: keyof typeof sceneType) => {
    if (!scale || !unit) return undefined;
    const [role, family] = sceneType[cls];
    return { fontSize: `${scale.fs(role) * unit}px`, fontFamily: scale.family(family) };
  };
  const spider = model.positions.get("Spider-Man") as [number, number];
  return (
    <>
      <title id="signal-map-title">{`${state.to.size} articles can reach Baymax; Baymax can reach ${state.from.size}.`}</title>
      <desc id="signal-map-desc">
        {`${added} hypothetical links added to the frozen graph. Yellow dots can reach Baymax; purple dots are reachable from Baymax; white dots have paths both ways; muted dots have neither. ${state.roundTrip} articles have paths both ways. Bright dashed arrows are hypothetical additions. Muted background connections omit arrowheads for readability.`}
      </desc>
      <defs>
        {(["to", "from"] as const).map((kind) => (
          <marker key={kind} id={`arrow-${kind}`} viewBox="0 0 10 10" refX={9} refY={5} markerWidth={7} markerHeight={7} orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill={palette[kind]} />
          </marker>
        ))}
      </defs>
      <g aria-hidden="true">
        {model.lines.map(([x1, y1, x2, y2], i) => (
          <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={EDGE} strokeWidth={0.6} opacity={0.25} />
        ))}
      </g>
      <g aria-hidden="true">
        {(addedLinks(m.mode, model.positions) as { d: string; kind: "to" | "from" }[]).map(({ d, kind }, i) => (
          <path key={`${m.renders}-${i}`} d={d} className="added-link signal-pulse" stroke={palette[kind]} markerEnd={`url(#arrow-${kind})`} />
        ))}
      </g>
      <g aria-hidden="true">
        {model.graph.nodes.map((node) => {
          const [cx, cy] = model.positions.get(node.id) as [number, number];
          return (
            <circle key={node.id} cx={cx} cy={cy} r={dotRadius(node)} className="scene-node" fill={dotFill(node, state)} data-scene-node={node.id}>
              <title>{node.name}</title>
            </circle>
          );
        })}
      </g>
      <circle cx={150} cy={260} r={42} fill="none" stroke={RING} strokeWidth={1} />
      <text x={150} y={337} textAnchor="middle" className="baymax-label" style={type("baymax-label")}>BAYMAX</text>
      <text x={150} y={363} textAnchor="middle" className="scene-label" id="baymax-scene-status" style={type("scene-label")}>{STATUS[m.mode]}</text>
      <circle cx={spider[0]} cy={spider[1]} r={17} fill="none" stroke={RING} strokeWidth={1} />
      <text x={spider[0] + 24} y={spider[1] + 5} className="spider-label" style={type("spider-label")}>Spider-Man</text>
      <text x={360} y={34} className="scene-label" style={type("scene-label")}>THE ORIGINAL GROUP / 277 ARTICLES</text>
      <text x={355} y={602} className="scene-label" style={type("scene-label")}>16 OTHER ISOLATES</text>
      <text x={735} y={622} className="scene-label" style={type("scene-label")}>THE ISLAND / 9</text>
    </>
  );
}

const stepProps = (s: Step) => ({ className: s.complete ? "complete" : undefined, "aria-current": s.current ? ("step" as const) : undefined });

// The lab section: the server markup without `live`, the running experiment with it.
function LabMarkup({ live, svgRef, load, failed }: { live?: Live; svgRef?: React.RefObject<SVGSVGElement | null>; load?: string; failed?: boolean }) {
  const m = live?.m ?? START;
  const state = live?.model.scenarios[m.mode];
  const added = edits[m.mode as Mode].length;
  const pressed = (mode: Mode) => live !== undefined && mode === m.mode;
  return (
    <section className="signal-lab wide" aria-label="Baymax link experiment">
      <div className="signal-topline">
        <span id="edit-label">{live ? (added ? `WHAT IF / ${added} IMAGINED LINK${added === 1 ? "" : "S"} ADDED` : "REAL SNAPSHOT / NO EDITS") : "REAL SNAPSHOT · NO EDITS"}</span>
        <ol className="mission-progress" aria-label="Mission progress">
          <li id="progress-found" {...stepProps(m.found)}>
            <span>{m.found.mark}</span>
            {" "}
            Be found
          </li>
          <li id="progress-reply" {...stepProps(m.reply)}>
            <span>{m.reply.mark}</span>
            {" "}
            Answer back
          </li>
        </ol>
      </div>
      <div className="signal-layout">
        <div className="signal-visual">
          <figure className="signal-map">
            <svg id="signal-map" viewBox="0 0 1000 630" role="img" aria-labelledby="signal-map-title signal-map-desc" ref={svgRef}>
              {live ? (
                <Scene live={live} />
              ) : (
                <>
                  <title id="signal-map-title">Baymax has no paths to or from the other articles.</title>
                  <desc id="signal-map-desc">
                    A diagram of the frozen 303-article network. Baymax is isolated. The controls add hypothetical directed links to Spider-Man; the two counts below report reachability through any number of links.
                  </desc>
                  <text x="160" y="300" textAnchor="middle" fill={PLACEHOLDER.baymax}>BAYMAX · 0 LINKS</text>
                  <text x="660" y="300" textAnchor="middle" fill={PLACEHOLDER.group}>277 ARTICLES IN THE MAIN GROUP</text>
                </>
              )}
            </svg>
            <figcaption className="signal-key">
              <span>
                <i className="key-to"></i>
                Can reach Baymax
              </span>
              <span>
                <i className="key-from"></i>
                Baymax can reach
              </span>
              <span>
                <i className="key-both"></i>
                Both ways
              </span>
              <span>
                <i className="key-none"></i>
                Neither
              </span>
            </figcaption>
          </figure>
          <div className="reach-counts" aria-label="Reachability results">
            <div>
              <span>ARTICLES THAT CAN REACH BAYMAX</span>
              <strong id="reach-to">{state ? state.to.size : 0}</strong>
            </div>
            <div>
              <span>ARTICLES BAYMAX CAN REACH</span>
              <strong id="reach-from">{state ? state.from.size : 0}</strong>
            </div>
          </div>
          <p className="reach-definition">
            Following one or more arrows. Other articles only. A path is a possible sequence of clicks, not measured readership.
          </p>
        </div>
        <div className="mission-panel">
          <p className="eyebrow" id="mission-label">{m.label}</p>
          <h2 id="mission-title">
            {m.title ?? (
              <>
                PUT HIM
                <br />
                ON THE MAP.
              </>
            )}
          </h2>
          <p id="mission-copy">
            {m.copy}
          </p>
          <div className="edit-choices" id="first-choices" role="group" aria-label="Choose one hypothetical link" hidden={m.hide.first || failed}>
            <button type="button" data-edit="out" aria-pressed={pressed("out")} disabled={!live} onClick={() => live?.choose("out")} ref={live?.refs.edit}>
              <span>WRITE ON BAYMAX’S PAGE</span>
              <b>Baymax → Spider-Man</b>
            </button>
            {" "}
            <button type="button" data-edit="in" aria-pressed={pressed("in")} disabled={!live} onClick={() => live?.choose("in")}>
              <span>WRITE ON SPIDER-MAN’S PAGE</span>
              <b>Spider-Man → Baymax</b>
            </button>
          </div>
          <div className={m.success ? "mission-feedback success" : "mission-feedback"} id="mission-feedback" role="status" aria-live="polite">
            <span className="feedback-kicker">{m.kicker}</span>
            <p>{m.feedback}</p>
          </div>
          <button className="button" id="next-mission" type="button" hidden={m.hide.next} onClick={live?.next}>
            Now let him answer
            {" "}
            <span aria-hidden="true">↗</span>
          </button>
          {" "}
          <button className="button" id="add-return" type="button" hidden={m.hide.ret} onClick={live?.addReturn} ref={live?.refs.ret}>
            Add the return link
            {" "}
            <span aria-hidden="true">↔</span>
          </button>
          {" "}
          <a className="button" id="mission-finish" href="#results" hidden={m.hide.finish} ref={live?.refs.finish}>
            See what you changed
            {" "}
            <span aria-hidden="true">↓</span>
          </a>
          <div id="replay-controls" hidden={m.hide.replay}>
            <p className="small-note">REPLAY THE DIFFERENCE</p>
            <div className="signal-replay" role="group" aria-label="Compare imagined link states">
              {REPLAYS.map(([mode, text]) => (
                <button key={mode} type="button" data-replay={mode} aria-pressed={live ? (mode === m.mode ? "true" : "false") : mode === "both" ? "true" : undefined} onClick={() => live?.replay(mode)}>
                  {text}
                </button>
              ))}
            </div>
          </div>
          <button className="text-button" id="restart-mission" type="button" hidden={m.hide.restart} onClick={live?.restart}>Start over ↺</button>
          <p className="signal-load" id="signal-load" role="status">{load ?? "Loading the frozen network…"}</p>
          <p className="simulation-note">
            A what-if experiment on the 26 August 2026 snapshot. These edits are imagined; the original 303 articles and 1,784 links stay intact.
          </p>
        </div>
      </div>
    </section>
  );
}

const FAILED = "The interactive network could not load. The verified findings below are still available.";

function LabView() {
  const hydrated = useHydrated();
  const data = useData<Graph>(hydrated ? asset("assets/data/marvel_story.json") : null);
  const built = useMemo((): { model: Model | null; error: unknown } => {
    if (data.status === "error") return { model: null, error: data.error };
    if (data.status !== "ready" || !data.data) return { model: null, error: null };
    try {
      const graph = data.data;
      checkSnapshot(graph);
      const scenarios = buildScenarios(graph) as Record<Mode, Reach>;
      const positions = layout(graph.nodes) as Map<string, [number, number]>;
      return { model: { graph, scenarios, positions, lines: backgroundLines(graph, positions) as number[][] }, error: null };
    } catch (error) {
      return { model: null, error };
    }
  }, [data]);
  useEffect(() => {
    if (built.error) console.error("Baymax experiment:", built.error);
  }, [built.error]);

  const [m, setM] = useState<Mission>(START);
  const svgRef = useRef<SVGSVGElement>(null);
  const size = useElementSize(svgRef);
  const scale = useTypeScale();
  const refs = { edit: useRef<HTMLButtonElement>(null), ret: useRef<HTMLButtonElement>(null), finish: useRef<HTMLAnchorElement>(null) };

  useEffect(() => {
    const target = m.focus.target === "edit" ? refs.edit.current : m.focus.target === "return" ? refs.ret.current : m.focus.target === "finish" ? refs.finish.current : null;
    target?.focus({ preventScroll: true });
    // The refs are stable; focus runs once per request.
  }, [m.focus.n]);

  if (built.error) return <LabMarkup svgRef={svgRef} load={FAILED} failed />;
  if (!built.model) return <LabMarkup svgRef={svgRef} />;
  const model = built.model;

  const focus = (s: Mission, target: Mission["focus"]["target"]) => ({ target, n: s.focus.n + 1 });
  const live: Live = {
    model,
    m,
    scale,
    unit: size?.width ? 1000 / size.width : null,
    refs,
    choose: (mode) =>
      setM((s) => {
        if (s.phase !== 1) return s;
        const found = mode === "in";
        return {
          ...s,
          mode,
          renders: s.renders + 1,
          hide: { ...s.hide, next: !found },
          found: { ...s.found, complete: found, mark: found ? "✓" : "01" },
          ...(found
            ? { kicker: "MISSION 01 COMPLETE", feedback: "274 articles can now reach Baymax. But he still cannot reach a single one of them. Getting found is only half a conversation.", success: true }
            : { kicker: "HE CAN LEAVE. NOBODY CAN FIND HIM.", feedback: "Baymax can now reach 231 articles, but 0 can reach him. Your arrow points away from his page. Try writing the link on Spider-Man’s page.", success: false }),
        };
      }),
    next: () =>
      setM((s) => ({
        ...s,
        phase: 2,
        hide: { ...s.hide, first: true, next: true, ret: false, restart: false },
        found: { ...s.found, current: false },
        reply: { ...s.reply, current: true },
        label: "MISSION 02 / ANSWER BACK",
        title: "LET HIM ANSWER.",
        copy: "Keep the link that lets others find him. Now give Baymax a link back to Spider-Man. What changes?",
        kicker: "ONE MORE EDIT",
        feedback: "A link from Spider-Man to Baymax cannot be followed backwards. Add the return direction and watch the two counts.",
        success: false,
        focus: focus(s, "return"),
      })),
    addReturn: () =>
      setM((s) => ({
        ...s,
        phase: 3,
        mode: "both",
        renders: s.renders + 1,
        hide: { ...s.hide, ret: true, finish: false, replay: false },
        reply: { complete: true, mark: "✓", current: false },
        label: "BOTH MISSIONS COMPLETE",
        title: "A WAY THERE. AND BACK.",
        copy: "Two imagined links. Baymax now has a round trip to 229 other articles. Try removing a direction below to see what disappears.",
        kicker: "229 ROUND-TRIP DESTINATIONS",
        feedback: "274 articles can reach him. He can reach 231. The 229 in both groups have a route there and back. Connections are not automatically mutual.",
        success: true,
        focus: focus(s, "finish"),
      })),
    replay: (mode) =>
      setM((s) => {
        const state = model.scenarios[mode];
        return {
          ...s,
          mode,
          renders: s.renders + 1,
          label: "EXPERIMENT COMPLETE / REPLAY",
          title: "FLIP THE ARROW.",
          copy: "Compare the alternatives. The original graph stays the same; only your imagined link directions change.",
          kicker: mode === "snapshot" ? "BACK TO THE REAL SNAPSHOT" : "REPLAYING AN IMAGINED EDIT",
          feedback: `${state.to.size} articles can reach Baymax. He can reach ${state.from.size}. ${state.roundTrip} have a route both ways.`,
          success: mode === "both",
        };
      }),
    restart: () =>
      setM((s) => ({
        ...START,
        renders: s.renders + 1,
        title: "PUT HIM ON THE MAP.",
        focus: focus(s, "edit"),
      })),
  };
  return <LabMarkup live={live} svgRef={svgRef} load="" />;
}

export const Lab = island("play/lab/Lab", LabView, () => <LabMarkup />, { roots: [".signal-lab"] });
