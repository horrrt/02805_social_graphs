// surface: d3-zoom on the view's svg writes the transform of its zoom <g>
// A network as graph.js networkView() draws it: the same elements, classes,
// attributes and tooltips, from the same rows (networkLayout). It draws once
// the page's type scale and text measure are read after hydration (the server
// renders nothing, as main's host held nothing), at spec.width or 640 first
// and then at its parent's width (useFittedWidth). State follows networkView's
// closure (network/state.ts): the groups a move gives, the highlighted link,
// the lighting and the pinned tooltip under explore. d3 loads only for a view
// that explores (useVendor), and d3-zoom writes only the zoom <g>'s transform.
import { useCallback, useEffect, useLayoutEffect, useMemo, useReducer, useRef, type MouseEvent, type PointerEvent } from "react";
import { useHydrated } from "@/lib/useHydrated";
import { useFittedWidth } from "@/lib/useSize";
import { useTextMeasure, useTypeScale, type TypeScale } from "@/lib/useTypeScale";
import { useVendor } from "@/lib/useVendor";
import {
  describeNode,
  groupOf,
  legendRows,
  neighbours,
  networkLayout,
  nextGroup,
  type HubRow,
  type Measure,
  type NetId,
  type NetNode,
  type NetworkSpec,
  type NodeRow,
  type Options,
} from "./network/layout";
import { HubMark, LineMark, NodeMark, type HubEvents, type NodeEvents } from "./network/marks";
import { initModel, initUi, model, ui, uiFor, type Lit, type TipText } from "./network/state";

export type { NetLink, NetNode, NetworkSpec, NodeInfo } from "./network/layout";

const ZOOMS: [string, string][] = [
  ["+", "Zoom in"],
  ["−", "Zoom out"],
  ["Reset", "Reset the zoom"],
];

type D3 = any;

// A tooltip line as textContent writes it: nothing for null or undefined.
const text = (t: unknown) => (t === null || t === undefined ? null : String(t));

function View({ spec, onChange, scale, measure }: { spec: NetworkSpec; onChange?: (nodes: NetNode[]) => void; scale: TypeScale; measure: Measure }) {
  const opts: Options = useMemo(() => ({ colorNodes: true, ratio: 0.75, ...spec }), [spec]);
  const explore = Boolean(opts.explore);
  const k = opts.groups?.length ?? 0;
  const fallback = opts.width || 640;
  const [m, dispatch] = useReducer(model, null, () =>
    initModel({ nodes: spec.nodes.map((n) => ({ ...n })), focus: spec.highlight ? `${spec.highlight.source}|${spec.highlight.target}` : null, width: fallback }),
  );
  const [uiState, act] = useReducer(ui, 0, initUi);
  const u = uiFor(uiState, m.gen);

  const svgRef = useRef<SVGSVGElement>(null);
  const viewRef = useRef<SVGGElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const width = useFittedWidth(svgRef, fallback);
  // fitted(): a new width draws a new svg from the state now.
  if (width !== m.drawn.width) dispatch({ type: "resize", width });

  const { drawn } = m;
  const L = useMemo(() => networkLayout(opts, drawn.nodes, drawn.width, drawn.focus, measure, scale.fs), [opts, drawn, measure, scale]);
  const near = useMemo(() => (explore ? neighbours(drawn.nodes, L.lines) : null), [explore, drawn.nodes, L]);
  const legend = useMemo(() => (opts.legend ? legendRows(opts, m.nodes) : null), [opts, m.nodes]);

  // The handlers read the latest state through a ref, so the memoised marks keep them.
  const now = useRef({ m, L, near, opts, onChange });
  useLayoutEffect(() => {
    now.current = { m, L, near, opts, onChange };
  });

  // A redraw after a move puts the focus back on the moved node, as redraw(keep) does.
  useLayoutEffect(() => {
    if (m.keep) svgRef.current?.querySelector<SVGGElement>(`[data-id="${CSS.escape(String(m.keep))}"]`)?.focus();
  }, [m.gen, m.keep]);

  const say = useCallback((lines: unknown[], x: number, y: number): TipText => {
    const box = stageRef.current!.getBoundingClientRect();
    return { lines, left: `${Math.min(x - box.left + 14, box.width - 240)}px`, top: `${y - box.top + 14}px` };
  }, []);
  const describe = useCallback((id: NetId) => {
    const { m, near, opts } = now.current;
    const n = m.nodes.find((x) => x.id === id)!;
    return describeNode(opts, n, near!.get(id)!);
  }, []);
  const litNode = useCallback((id: NetId): Lit => {
    const e = now.current.near!.get(id)!;
    return { nodes: new Set([id, ...e.ids]), lines: new Set(e.lines), hubs: new Set() };
  }, []);
  // lightGroup(): the group's nodes, the lines inside it and its hubs, by the groups now.
  const litGroup = useCallback((g: number | null | undefined): Lit => {
    const { m, L } = now.current;
    const byId = new Map(m.nodes.map((n) => [n.id, n]));
    const of = (id: NetId) => groupOf(byId.get(id)!);
    const lines = new Set<number>();
    L.lines.forEach(({ link }, i) => {
      if (of(link.source) === g && of(link.target) === g) lines.add(i);
    });
    return { nodes: new Set(m.nodes.filter((n) => groupOf(n) === g).map((n) => n.id)), lines, hubs: new Set(L.hubs.filter((h) => of(h.id) === g).map((h) => h.id)) };
  }, []);

  const gen = m.gen;
  const move = useCallback(
    (mark: NodeRow) => {
      const { m, opts, onChange } = now.current;
      const group = nextGroup(mark, opts.groups?.length ?? 0);
      const nodes = m.nodes.map((n) => (n.id === mark.id ? { ...n, group } : n));
      dispatch({ type: "move", nodes, id: mark.id });
      onChange?.(nodes);
    },
    [],
  );
  const nodeEvents: NodeEvents = useMemo(() => {
    const events: NodeEvents = opts.movable ? { move } : {};
    if (!explore) return events;
    return {
      ...events,
      enter: (id: NetId, e: PointerEvent) => act({ type: "light", gen, lit: litNode(id), pin: false, ifUnpinned: true, say: say(describe(id), e.clientX, e.clientY) }),
      hover: (id: NetId, e: PointerEvent) => act({ type: "say", gen, say: say(describe(id), e.clientX, e.clientY) }),
      leave: () => act({ type: "clear", gen, unpin: false }),
      pin: (id: NetId, e: MouseEvent) => act({ type: "light", gen, lit: litNode(id), pin: true, say: say(describe(id), e.clientX, e.clientY) }),
    };
  }, [opts.movable, explore, move, gen, litNode, say, describe]);
  const hubEvents: HubEvents | null = useMemo(() => {
    if (!explore) return null;
    return {
      show: (hub: HubRow, pin: boolean, el: Element) => {
        const lit = litGroup(hub.group);
        const r = el.getBoundingClientRect();
        act({ type: "light", gen, lit, pin, say: say(describe(hub.id), r.left, r.bottom - 8) });
      },
      leave: () => act({ type: "clear", gen, unpin: false }),
    };
  }, [explore, gen, litGroup, say, describe]);
  const onHit = useCallback((key: string) => dispatch({ type: "focus", key }), []);

  // The legend, the zoom buttons and Escape drive the view drawn last, which
  // after a redraw off the page (m.orphan) is not this one.
  const target = m.orphan ? -1 : gen;
  const lightLegend = (g: number) => act({ type: "light", gen: target, lit: litGroup(g), pin: true });

  const d3 = useVendor<D3>("d3-7.9.0.min.js", "d3", { enabled: explore });
  const zoomBy = useRef<(label: string) => void>(() => {});
  useEffect(() => {
    if (d3.status === "error") console.error(new Error("could not load d3"));
    if (d3.status !== "ready") return;
    const svg = svgRef.current;
    const lib = d3.lib;
    if (!svg || !lib) return;
    const z = lib
      .zoom()
      .scaleExtent([1, 8])
      .translateExtent([
        [0, 0],
        [L.width, L.height],
      ])
      .filter((ev: WheelEvent | MouseEvent) => (ev.type === "wheel" ? ev.ctrlKey || ev.metaKey : !ev.button))
      .on("zoom", (ev: { transform: unknown }) => viewRef.current?.setAttribute("transform", String(ev.transform)));
    const sel = lib.select(svg).call(z).on("dblclick.zoom", null);
    zoomBy.current = (label) => {
      const t = sel.transition().duration(250);
      if (label === "+") t.call(z.scaleBy, 1.6);
      else if (label === "−") t.call(z.scaleBy, 1 / 1.6);
      else t.call(z.transform, lib.zoomIdentity);
    };
    return () => {
      sel.interrupt().on(".zoom", null);
      zoomBy.current = () => {};
    };
  }, [d3.status, d3.lib, gen, L.width, L.height]);

  const fs = scale.fs;
  const hiNodes = u.lit?.nodes;
  const hiLines = u.lit?.lines;
  const hiHubs = u.lit?.hubs;
  const nodeClass = (id: NetId) => (hiNodes?.has(id) ? "gv-hi" : u.ever.has(id) ? "" : undefined);

  return (
    <div
      className={`gv${opts.theme === "dark" ? " gv-dark" : ""}${explore ? " gv-explore" : ""}`}
      onKeyDown={explore ? (e) => e.key === "Escape" && act({ type: "clear", gen: target, unpin: true }) : undefined}
    >
      {opts.note ? <p className="gv-note">{opts.note}</p> : null}
      {legend ? (
        <p className="gv-legend">
          {legend.rows.map((row) =>
            explore ? (
              <button key={row.group} type="button" className="gv-key" onClick={() => lightLegend(row.group)}>
                <i className={row.dot}></i>
                {row.text}
              </button>
            ) : (
              <span key={row.group}>
                <i className={row.dot}></i>
                {row.text}
              </span>
            ),
          )}
          {legend.none ? (
            <span>
              <i className={legend.none.dot || undefined}></i>
              {legend.none.text}
            </span>
          ) : null}
        </p>
      ) : null}
      <div className="gv-stage" ref={stageRef}>
        {explore ? (
          <>
            <div className="gv-tip" hidden={u.hidden} style={u.tip ? { left: u.tip.left, top: u.tip.top } : undefined}>
              {u.tip?.lines.map((t, i) => (i ? <span key={i}>{text(t)}</span> : <b key={i}>{text(t)}</b>))}
            </div>
            <div className="gv-tools">
              {ZOOMS.map(([label, name]) => (
                <button key={label} type="button" aria-label={name} onClick={() => !m.orphan && zoomBy.current(label)}>
                  {label}
                </button>
              ))}
            </div>
          </>
        ) : null}
        <svg
          ref={svgRef}
          viewBox={`0 0 ${L.width} ${L.height}`}
          width={L.width}
          height={L.height}
          role="img"
          aria-label={opts.aria ?? "Network"}
          className={u.lit ? "gv-lit" : u.wasLit ? "" : undefined}
          onClick={
            explore
              ? (e) => {
                  // A node's or a hub's click stops before the svg on main.
                  if (!(e.target as Element).closest("[data-id], .gv-hub")) act({ type: "clear", gen, unpin: true });
                }
              : undefined
          }
        >
          {/* A new <g> per drawn view: main draws a new svg, so the zoom and the lighting start afresh. */}
          <g key={gen} ref={viewRef}>
            <g>
              {L.lines.map((row, i) => (
                <LineMark key={i} row={row} hi={hiLines?.has(i) ?? false} onHit={opts.weights ? onHit : undefined} />
              ))}
            </g>
            <g>
              {L.nodes.map((mark) => (
                <NodeMark key={mark.id} mark={mark} cls={nodeClass(mark.id)} fs={fs} events={nodeEvents} />
              ))}
            </g>
            {L.side ? (
              <g className="gv-side">
                {L.side.map((t, i) => (
                  <text key={i} x={t.x} y={t.y} fontSize={fs("caption")} textAnchor={t.anchor}>
                    {t.text}
                  </text>
                ))}
              </g>
            ) : null}
            <g>
              {L.hubs.map((hub) => (
                <HubMark key={hub.id} hub={hub} hi={hiHubs?.has(hub.id) ?? false} fs={fs} events={hubEvents} />
              ))}
              {L.weight ? (
                <g className="gv-weight">
                  <rect {...L.weight.pill} />
                  <text x={L.weight.text.x} y={L.weight.text.y} fontSize={fs("body")} textAnchor="middle">
                    {L.weight.text.text}
                  </text>
                </g>
              ) : null}
            </g>
          </g>
        </svg>
      </div>
    </div>
  );
}

/** <NetworkView spec={{ nodes, links, groups, hubs, legend: true }} onChange={(nodes) => …} />, as networkView(host, spec). */
export default function NetworkView({ spec, onChange }: { spec: NetworkSpec; onChange?: (nodes: NetNode[]) => void }) {
  const hydrated = useHydrated();
  const scale = useTypeScale();
  const measure = useTextMeasure();
  if (!hydrated || !scale || !measure) return null;
  return <View spec={spec} onChange={onChange} scale={scale} measure={measure} />;
}
