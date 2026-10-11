"use client";
// Section 2's figures, which week04-jobs.js drew on main: the start card's
// most common job pairs, the bridges card's rule strips, the co-hiring
// network with its bridge list and inspector, the clusters' official groups
// and their NMI scale, the status line and every number the prose quotes
// (the [data-jobs] spans). All from jobs.json; a failed load writes the
// status line's error and leaves the rest as the server rendered it.
import { useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { StripChart } from "@/kit";
import type { StripOptions, StripRow } from "@/kit/StripChart";
import { island, useIslandReady } from "@/lib/island";
import { useFittedWidth } from "@/lib/useSize";
import { CLUSTER_TOKENS, bridgeStrips, clusterName, jobsFill, num, pairs, placeLabels, radius, short, shortName, status } from "@/scripts/week04-jobs.js";
import { W4, useW4Data } from "../useW4Data";
import { useT, type T } from "../useT";

const TOKENS = ["--ink", "--ink-soft", "--ink-mute", "--ink-mute-text", "--line", "--line-soft", "--card", "--w4-accent", "--w4-map-edge", "--w4-rail-ring", "--w4-band", "--people", ...CLUSTER_TOKENS];

function useJobs() {
  const state = useW4Data(W4.data("jobs"), "jobs data");
  const T = useT(TOKENS);
  return { data: state.data as any, error: state.status === "error" ? (state.error as Error) : null, T };
}

const svgStyle = { display: "block", fontFamily: "inherit" };

// ---- the start card's pairs

function Pairs({ data, T }: { data: any; T: T }) {
  const ref = useRef<SVGSVGElement>(null);
  const W = useFittedWidth(ref, 860);
  const { rows, names, top, withTop, hasTop } = useMemo(() => pairs(data), [data]);
  const rowH = 40;
  const y0 = 46;
  const small = T.fs("small");
  const caption = T.fs("caption");
  const longest = Math.max(...names.map(([first, second]: string[]) => Math.max(T.measure(first, "small", 700), T.measure(`+ ${second}`, "small"))));
  const labelRight = Math.ceil(longest) + 4;
  const x0 = labelRight + 12;
  const x1 = W - 60;
  const maxWeight = Math.max(...rows.map((p: any) => p.weight));
  const raw = maxWeight / 5;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw)!;
  const domain = Math.ceil(maxWeight / step) * step;
  const X = (v: number) => x0 + ((x1 - x0) * v) / domain;
  const bottom = y0 + rows.length * rowH - 12;
  const H = bottom + 40;
  const dark = T.token("--w4-accent");
  const grey = T.token("--w4-map-edge");
  const keyText = `Pair includes ${top.title} (${withTop} of ${rows.length})`;
  const otherX = 18 + T.measure(keyText, "caption", 600) + 24;
  const grid: ReactNode[] = [];
  for (let v = 0; v <= domain; v += step) {
    grid.push(
      <line key={`l${v}`} x1={X(v)} x2={X(v)} y1={30} y2={bottom} stroke={T.token("--line-soft")} />,
      <text key={`t${v}`} x={X(v)} y={bottom + 14} fontSize={caption} fill={T.token("--ink-mute-text")} textAnchor="middle">
        {num(v)}
      </text>,
    );
  }
  return (
    <svg ref={ref} viewBox={`0 0 ${W} ${H}`} width={W} height={H} role="img" aria-label={`The ${rows.length} occupation pairs with the most shared employers; ${withTop} include ${top.title}`} style={svgStyle}>
      <rect x={0} y={4} width={12} height={12} rx={2} fill={dark} />
      <text x={18} y={14} fontSize={caption} fill={T.token("--ink")} fontWeight={600}>
        {keyText}
      </text>
      <rect x={otherX} y={4} width={12} height={12} rx={2} fill={grey} />
      <text x={otherX + 18} y={14} fontSize={caption} fill={T.token("--ink-soft")} fontWeight={600}>
        Other pairs
      </text>
      {grid}
      <text x={(x0 + x1) / 2} y={bottom + 36} fontSize={caption} fill={T.token("--ink-mute-text")} textAnchor="middle">
        {`Companies that filed for both jobs in ${data.meta.year}`}
      </text>
      {rows.map((p: any, i: number) => {
        const y = y0 + i * rowH;
        const [first, second] = names[i];
        const mark = hasTop(p);
        return (
          <g key={i}>
            <text x={labelRight} y={y + 5} fontSize={small} textAnchor="end" fill={T.token("--ink")} fontWeight={mark ? 700 : 600}>
              {first}
            </text>
            <text x={labelRight} y={y + 21} fontSize={small} textAnchor="end" fill={T.token("--ink-soft")}>
              {`+ ${second}`}
            </text>
            <g>
              <title>{`${first} + ${second}: ${num(p.weight)} companies filed for both`}</title>
              <rect x={x0} y={y} width={X(p.weight) - x0} height={16} rx={3} fill={mark ? dark : grey} />
            </g>
            <text x={X(p.weight) + 6} y={y + 12.5} fontSize={small} fontWeight={700} fill={T.token("--ink")}>
              {num(p.weight)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ---- the network, the bridge list and the inspector

function Network({ data, T, selected, choose }: { data: any; T: T; selected: string | null; choose: (id: string) => void }) {
  const ref = useRef<SVGSVGElement>(null);
  const W = useFittedWidth(ref, 700);
  const H = 580;
  const legendTop = H - 74;
  const P = useMemo(() => new Map<string, [number, number]>(data.nodes.map((n: any) => [n.id, [n.x * W, n.y * H]])), [data, W]);
  const labels = useMemo(
    () => placeLabels(data.nodes, P, data.clusters.map((c: any) => c.label), { W, legendTop }, T.measure, T.fs("small")),
    [data, P, W, legendTop, T],
  );
  const position = new Map(data.clusters.map((group: any, i: number) => [group.id, i]));
  const colour = (id: number) => T.token(CLUSTER_TOKENS[(position.get(id) as number) % CLUSTER_TOKENS.length]);
  const halo = { paintOrder: "stroke", stroke: T.token("--card"), strokeWidth: 3, strokeLinejoin: "round" } as const;
  const maxWeight = Math.max(...data.edges.map((e: any) => e.weight));
  const at = selected ? P.get(selected) : null;
  const picked = selected ? data.nodes.find((n: any) => n.id === selected) : null;
  let lx = 0;
  let ly = legendTop + 40;
  const key = data.clusters.map((c: any) => {
    const text = `${shortName(c.label)} cluster (${num(c.occupations)})`;
    const x = lx;
    const y = ly;
    lx += 16 + T.measure(text, "caption") + 18;
    if (lx > W - 150) {
      lx = 0;
      ly += 18;
    }
    return (
      <g key={c.id}>
        <circle cx={x + 6} cy={y - 4} r={5} fill={colour(c.id)} />
        <text x={x + 16} y={y} fontSize={T.fs("caption")} fill={T.token("--ink-soft")}>
          {text}
        </text>
      </g>
    );
  });
  const onKey = (n: any) => (event: KeyboardEvent) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    choose(n.id);
  };
  return (
    <svg ref={ref} viewBox={`0 0 ${W} ${H}`} width={W} height={H} role="group" aria-label="Occupations linked by the companies that file for both; colour is the hiring cluster" style={svgStyle}>
      {[...data.edges]
        .sort((a: any, b: any) => a.weight - b.weight)
        .map((e: any, i: number) => {
          const [x1, y1] = P.get(e.source)!;
          const [x2, y2] = P.get(e.target)!;
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={T.token("--w4-rail-ring")} strokeOpacity={0.28} strokeWidth={(0.6 + 2.2 * Math.sqrt(e.weight / maxWeight)).toFixed(2)} />;
        })}
      {[...data.nodes]
        .sort((a: any, b: any) => a.filings - b.filings)
        .map((n: any) => {
          const [cx, cy] = P.get(n.id)!;
          const where = n.bridge ? `bridges the ${clusterName(data, n.clusters[0])} and ${clusterName(data, n.clusters[1])} clusters` : `${clusterName(data, n.cluster)} cluster`;
          return (
            <g key={n.id} tabIndex={0} role="button" aria-label={`${n.title}, ${num(n.filings)} filings, ${where}`} style={{ cursor: "pointer" }} onClick={() => choose(n.id)} onKeyDown={onKey(n)}>
              <title>{`${n.title}: ${num(n.filings)} filings, ${where}`}</title>
              <circle cx={cx} cy={cy} r={radius(n.filings)} fill={colour(n.cluster)} stroke={n.bridge ? T.token("--ink") : T.token("--card")} strokeWidth={n.bridge ? 2.5 : 1.5} />
            </g>
          );
        })}
      <circle
        r={picked ? radius(picked.filings) + 4 : 0}
        cx={at ? at[0] : undefined}
        cy={at ? at[1] : undefined}
        fill="none"
        stroke={T.token("--ink")}
        strokeWidth={1.5}
        visibility={at ? "visible" : "hidden"}
        pointerEvents="none"
      />
      {labels
        .filter((label: any) => label.leader)
        .map((label: any) => {
          const [x1, y1, x2, y2] = label.leader;
          return <line key={`l${label.id}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke={T.token("--ink-mute")} strokeWidth={0.8} pointerEvents="none" />;
        })}
      {labels.map((label: any) => (
        <text key={`t${label.id}`} x={label.x.toFixed(1)} y={label.y.toFixed(1)} textAnchor={label.anchor} fontSize={label.size} fontWeight={label.weight} fill={T.token("--ink")} pointerEvents="none" {...halo}>
          {label.text}
        </text>
      ))}
      {key}
    </svg>
  );
}

function Inspector({ data, selected, choose, back }: { data: any; selected: string | null; choose: (id: string) => void; back: () => void }) {
  const node = selected ? data.nodes.find((n: any) => n.id === selected) : null;
  if (node) {
    const label = (id: number) => clusterName(data, id);
    const where = node.bridge
      ? `In the ${label(node.clusters[0])} cluster, with more ties than chance to the ${label(node.clusters[1])} cluster.`
      : `In the ${label(node.cluster)} cluster only.`;
    return (
      <aside className="panel jobs-inspector" id="jobs-node-inspector">
        <h2>{short(node.title)}</h2>
        <p className="jobs-meta">{`SOC ${node.id} · ${num(node.filings)} certified filings`}</p>
        <p>{where}</p>
        <h3>Most shared employers</h3>
        <ol className="jobs-partners">
          {node.partners.map(([, title, weight]: [string, string, number], i: number) => (
            <li key={i}>
              <span>{short(title)}</span>
              <b>{num(weight)}</b>
            </li>
          ))}
        </ol>
        <button type="button" className="jobs-back" onClick={back}>
          Back to the bridge list
        </button>
      </aside>
    );
  }
  const bridges = data.nodes.filter((n: any) => n.bridge);
  return (
    <aside className="panel jobs-inspector" id="jobs-node-inspector">
      <h2>Bridge jobs</h2>
      <p>{`${bridges.length} of the ${data.nodes.length} occupations shown have more employer ties to a second cluster than any rewired network gives them.${bridges.length ? " Ringed in the network." : ""}`}</p>
      <div className="jobs-bridge-list" id="jobs-bridge-list">
        {bridges.length ? (
          bridges.map((n: any) => (
            <button key={n.id} type="button" data-job-id={n.id} onClick={() => choose(n.id)}>
              <span>{short(n.title)}</span>
              <b>{num(n.filings)}</b>
            </button>
          ))
        ) : (
          <p>{`None of the ${data.nodes.length} occupations shown here passes the overlap test; ${num(data.bridges.all_occupations)} ${data.bridges.all_occupations === 1 ? "does" : "do"} across the whole network.`}</p>
        )}
      </div>
    </aside>
  );
}

function GridBody({ children, inspector }: { children?: ReactNode; inspector: ReactNode }) {
  return (
    <div className="jobs-grid jobs-network-grid">
      <div className="plot">
        <h3>Occupation network</h3>
        <div className="w4-figure-body" id="chart-job-network">
          {children}
        </div>
      </div>
      {inspector}
    </div>
  );
}

function GridServer() {
  return (
    <GridBody
      inspector={
        <aside className="panel jobs-inspector" id="jobs-node-inspector">
          <h2>Bridge jobs</h2>
          <p>Ringed occupations pass the second-cluster test.</p>
          <div className="jobs-bridge-list" id="jobs-bridge-list"></div>
        </aside>
      }
    />
  );
}

function GridView() {
  const { data, T } = useJobs();
  // The occupation ringed in the network and shown in the inspector.
  const [selected, setSelected] = useState<string | null>(null);
  // An older cached jobs.json has no layout; skip rather than draw at NaN.
  const ok = data && data.nodes.every((n: any) => Number.isFinite(n.x) && Number.isFinite(n.y));
  useIslandReady(Boolean(ok && T));
  if (!ok || !T) return <GridServer />;
  return (
    <GridBody inspector={<Inspector data={data} selected={selected} choose={setSelected} back={() => setSelected(null)} />}>
      <Network data={data} T={T} selected={selected} choose={setSelected} />
    </GridBody>
  );
}

// ---- the clusters' official groups and the NMI scale

function Groups({ data, T }: { data: any; T: T }) {
  const ref = useRef<SVGSVGElement>(null);
  const W = useFittedWidth(ref, 640);
  const pct = (v: number, n: number) => `${Math.round((100 * v) / n)}%`;
  const ramp = [1, 0.6, 0.35];
  const accent = T.token("--w4-accent");
  const rest = T.token("--line");
  const small = T.fs("small");
  const caption = T.fs("caption");
  const parts: ReactNode[] = [];
  let y = 0;
  data.clusters.forEach((c: any, ci: number) => {
    const items = Object.entries(c.majors as Record<string, number>).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
    const n = items.reduce((sum, [, v]) => sum + v, 0);
    const others = items.slice(3).reduce((sum, [, v]) => sum + v, 0);
    const segs = items.slice(0, 3).map(([code, v], j) => ({ label: data.majors[code] || `SOC ${code}`, v, fill: accent, opacity: ramp[j], light: j < 2 }));
    if (others) segs.push({ label: "All other groups", v: others, fill: rest, opacity: 1, light: false });
    parts.push(
      <text key={`h${ci}`} x={0} y={y + 14} fontSize={small} fontWeight={700} fill={T.token("--ink")}>
        {`${c.label} `}
        <tspan fontWeight={400} fill={T.token("--ink-soft")}>
          {`cluster, ${num(n)} occupations`}
        </tspan>
      </text>,
    );
    let x = 0;
    segs.forEach((s, si) => {
      const w = (W * s.v) / n;
      parts.push(
        <g key={`s${ci}-${si}`}>
          <title>{`${s.label}: ${num(s.v)} of ${num(n)} occupations (${pct(s.v, n)})`}</title>
          <rect x={x.toFixed(1)} y={y + 22} width={Math.max(w - 2, 1).toFixed(1)} height={24} rx={4} fill={s.fill} fillOpacity={s.opacity} />
        </g>,
      );
      if (w >= T.measure(pct(s.v, n), "small", 700) + 10) {
        parts.push(
          <text key={`p${ci}-${si}`} x={(x + w / 2 - 1).toFixed(1)} y={y + 38.5} textAnchor="middle" fontSize={small} fontWeight={700} fill={s.light ? T.token("--card") : T.token("--ink")} pointerEvents="none">
            {pct(s.v, n)}
          </text>,
        );
      }
      x += w;
    });
    let lx = 0;
    let ly = y + 64;
    segs.forEach((s, si) => {
      const piece = `${s.label} ${num(s.v)}`;
      const wide = 14 + T.measure(piece, "caption");
      if (lx + wide > W) {
        lx = 0;
        ly += 18;
      }
      parts.push(
        <rect key={`k${ci}-${si}`} x={lx} y={ly - 9} width={10} height={10} rx={2} fill={s.fill} fillOpacity={s.opacity} />,
        <text key={`kt${ci}-${si}`} x={lx + 14} y={ly} fontSize={caption} fill={T.token("--ink-soft")}>
          {piece}
        </text>,
      );
      lx += wide + 16;
    });
    y = ly + 28;
  });
  return (
    <svg ref={ref} viewBox={`0 0 ${W} ${y - 8}`} width={W} height={y - 8} role="img" aria-label="Official major groups inside each hiring cluster" style={svgStyle}>
      {parts}
    </svg>
  );
}

function Nmi({ data, T }: { data: any; T: T }) {
  const ref = useRef<SVGSVGElement>(null);
  const W = useFittedWidth(ref, 410);
  const caption = T.fs("caption");
  const q = data.quality;
  const nmi = q.nmi;
  const sm = q.nmi_shuffled.mean;
  const sx = q.nmi_shuffled.max;
  const info = q.infomap.nmi_with_soc;
  const f2 = (v: number) => v.toFixed(2);
  const a = 14;
  const b = W - 14;
  const xv = (v: number) => a + (b - a) * v;
  const axy = 96;
  const halo = { paintOrder: "stroke", stroke: T.token("--card"), strokeWidth: 3, strokeLinejoin: "round" } as const;
  return (
    <svg ref={ref} viewBox={`0 0 ${W} 170`} width={W} height={170} role="img" aria-label="Match between hiring clusters and official major groups, from 0 to 1" style={svgStyle}>
      <line x1={a} x2={b} y1={axy} y2={axy} stroke={T.token("--line")} strokeWidth={6} strokeLinecap="round" />
      {[0, 1, 2, 3, 4].map((i) => (
        <g key={i}>
          <line x1={xv(i / 4)} x2={xv(i / 4)} y1={axy + 6} y2={axy + 12} stroke={T.token("--w4-rail-ring")} />
          <text x={xv(i / 4)} y={axy + 26} textAnchor="middle" fontSize={caption} fill={T.token("--ink-mute-text")}>
            {String(i / 4)}
          </text>
        </g>
      ))}
      <text x={a} y={axy + 46} fontSize={caption} fill={T.token("--ink-mute-text")}>
        unrelated
      </text>
      <text x={b} y={axy + 46} textAnchor="end" fontSize={caption} fill={T.token("--ink-mute-text")}>
        the same groups
      </text>
      <g>
        <title>{`Shuffled official labels: mean ${f2(sm)}, highest of ${num(q.nmi_shuffled.runs)} shuffles ${f2(sx)}`}</title>
        <rect x={xv(0)} y={axy - 8} width={xv(sx) - xv(0)} height={16} rx={8} fill={T.token("--w4-band")} />
      </g>
      <line x1={xv(sm)} x2={xv(sm)} y1={axy - 8} y2={axy - 30} stroke={T.token("--w4-rail-ring")} />
      <text x={xv(sm) + 6} y={axy - 34} fontSize={caption} fill={T.token("--ink-soft")} {...halo}>
        {`Shuffled labels ${f2(sm)}`}
      </text>
      <line x1={xv(nmi)} x2={xv(nmi)} y1={axy - 9} y2={axy - 62} stroke={T.token("--people")} />
      <text x={xv(nmi) - 4} y={axy - 66} fontSize={T.fs("small")} fontWeight={700} fill={T.token("--ink")} {...halo}>
        {`Hiring clusters ${f2(nmi)}`}
      </text>
      <line x1={xv(info)} x2={xv(info)} y1={axy - 8} y2={axy - 20} stroke={T.token("--ink")} />
      <text x={xv(info) + 8} y={axy - 22} fontSize={caption} fill={T.token("--ink")} {...halo}>
        {`Infomap ${f2(info)}`}
      </text>
      <g>
        <title>{`Infomap clusters against official groups: NMI ${f2(info)}`}</title>
        <circle cx={xv(info)} cy={axy} r={6} fill={T.token("--card")} stroke={T.token("--ink")} strokeWidth={2} />
      </g>
      <g>
        <title>{`Louvain hiring clusters against official groups: NMI ${f2(nmi)}`}</title>
        <circle cx={xv(nmi)} cy={axy} r={7.5} fill={T.token("--people")} />
      </g>
    </svg>
  );
}

// ---- one island per host

type Fig = { id: string; Draw: (p: { data: any; T: T }) => ReactNode; when?: (data: any) => boolean };

const FIGS: Record<string, Fig> = {
  pairs: { id: "chart-job-pairs", Draw: Pairs },
  bridgeRule: {
    id: "chart-job-bridge-rule",
    Draw: ({ data }) => (
      <>
        {(bridgeStrips(data) as { rows: StripRow[]; opts: StripOptions }[]).map((s, i) => (
          <StripChart key={i} rows={s.rows} opts={s.opts} />
        ))}
      </>
    ),
  },
  groups: { id: "chart-job-groups", Draw: Groups, when: (data) => data.clusters.every((c: any) => c.majors) },
  nmi: { id: "chart-job-nmi", Draw: Nmi },
};

function figure(fig: Fig): [() => ReactNode, () => ReactNode] {
  const Server = () => <div className="w4-figure-body" id={fig.id}></div>;
  const View = () => {
    const { data, T } = useJobs();
    const ok = Boolean(data && T && (!fig.when || fig.when(data)));
    useIslandReady(ok);
    return (
      <div className="w4-figure-body" id={fig.id}>
        {ok ? <fig.Draw data={data} T={T!} /> : null}
      </div>
    );
  };
  return [View, Server];
}

function StatusServer() {
  return (
    <p aria-live="polite" className="status-line" id="jobs-status">
      Loading job data…
    </p>
  );
}

function StatusView() {
  const { data, error } = useJobs();
  useIslandReady(Boolean(data || error));
  return (
    <p aria-live="polite" className="status-line" id="jobs-status">
      {data ? status(data) : error ? `Jobs section failed to load: ${error.message}` : "Loading job data…"}
    </p>
  );
}

const PARTS: Record<string, [() => ReactNode, () => ReactNode, string]> = {
  status: [StatusView, StatusServer, "#jobs-status"],
  grid: [GridView, GridServer, ".jobs-network-grid"],
};
for (const [name, fig] of Object.entries(FIGS)) PARTS[name] = [...figure(fig), `#${fig.id}`];

const ISLANDS = Object.fromEntries(Object.entries(PARTS).map(([name, [View, Server, root]]) => [name, island(`week04/jobs/${name}`, View, Server, { roots: [root] })]));

type Props = { part: string };

function View({ part }: Props) {
  const Part = ISLANDS[part];
  return <Part />;
}

function Placeholder({ part }: Props) {
  const Server = PARTS[part][1];
  return <Server />;
}

/** <JobsPart part="pairs" />: one client reference for every section 2 figure. */
export const JobsPart = island("week04/jobs/Jobs", View, Placeholder, { roots: Object.values(PARTS).map(([, , root]) => root) });

// ---- the numbers in the prose

type NumProps = { k: string; tag?: "span" | "strong" };

function NumServer({ k, tag = "span" }: NumProps) {
  const Tag = tag;
  return <Tag data-jobs={k}>…</Tag>;
}

function NumView({ k, tag = "span" }: NumProps) {
  const { data } = useJobs();
  const fill = useMemo(() => (data ? (jobsFill(data) as Record<string, string>) : null), [data]);
  useIslandReady(fill !== null);
  const Tag = tag;
  return <Tag data-jobs={k}>{fill ? fill[k] : "…"}</Tag>;
}

/** <JobsNum k="nmi" tag="strong" />: one [data-jobs] number. */
export const JobsNum = island("week04/jobs/JobsNum", NumView, NumServer, { roots: ["[data-jobs]"] });
