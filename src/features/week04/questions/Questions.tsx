"use client";
// The second-round question cards' figures, which week04-questions.js drew on
// main: section 1's who-hires and backbone-break charts, section 2's
// outsourcer/direct split and link communities, section 3's switches, movers
// and split clients, section 4's footprint charts and section 5's law-firm,
// green-card and wage-level charts, with their tables. Each file loads on its
// own, so a failure leaves the others working and writes
// "<name> data failed to load: …" into the hosts that needed it. Each part
// renders its server markup until its file has loaded.
import { useMemo, useRef, type ComponentType, type CSSProperties, type ReactNode } from "react";
import { island, useIslandReady } from "@/lib/island";
import { useFittedWidth } from "@/lib/useSize";
import {
  SECTIONS,
  beyondLawOption,
  beyondPermOption,
  beyondWageOption,
  footprintNmiOption,
  footprintRankOption,
  footprintRegionOption,
  footprintSingleOption,
  linkScatterLayout,
  linkcomRows,
  num,
  pct,
  splitMixOption,
  splitNmi,
  whereBreakOption,
  whereBreakRows,
  whereWhoOption,
  whoMoversOption,
  whoMoversRows,
  whoOverlapOption,
  whoOverlapRows,
  whoSwitchOption,
} from "@/scripts/week04-questions.js";
import { W4Chart } from "../W4Chart";
import { W4Table, type W4Head, type W4Row } from "../W4Table";
import { W4, useW4Data } from "../useW4Data";
import { useT, type T } from "../useT";

type Section = keyof typeof SECTIONS;

const TOKENS = ["--ink", "--ink-soft", "--ink-mute", "--ink-mute-text", "--w4-grid", "--people", "--w4-band", "--access", "--card", "--w4-meter", "--w4-inset"];

// One section file: its data, or the message main wrote into its hosts when it failed.
function useSection(section: Section) {
  const { file, name } = SECTIONS[section];
  const state = useW4Data(W4.data(file), `${file} data`);
  const T = useT(TOKENS);
  const error = state.status === "error" ? `${name} data failed to load: ${(state.error as Error)?.message ?? state.error}` : null;
  return { data: state.data as any, error, T };
}

const MUTED: CSSProperties = { color: "var(--ink-mute-text)" };
const NOTE: CSSProperties = { color: "var(--ink-mute-text)", fontSize: "var(--fs-small)", margin: 0, padding: "14px 2px" };

function ErrorNote({ message }: { message: string }) {
  return <p style={NOTE}>{message}</p>;
}

const RIGHT: CSSProperties = { textAlign: "right" };

// ---- ECharts parts

type Chart = { section: Section; id: string; className: string; build: (data: any, T: T) => object };

const CHARTS: Record<string, Chart> = {
  whereWho: { section: "whereWho", id: "chart-where-who", className: "chart-host short", build: whereWhoOption },
  whereBreak: { section: "whereWho", id: "chart-where-break", className: "chart-host short", build: whereBreakOption },
  splitMix: { section: "jobsSplit", id: "chart-jobs-split-mix", className: "chart-host", build: splitMixOption },
  whoSwitch: { section: "moves", id: "chart-who-switch", className: "chart-host short", build: whoSwitchOption },
  whoMovers: { section: "moves", id: "chart-who-movers", className: "chart-host short", build: whoMoversOption },
  whoOverlap: { section: "moves", id: "chart-who-overlap", className: "chart-host short", build: whoOverlapOption },
  beyondLaw: { section: "beyond", id: "chart-beyond-law", className: "chart-host short", build: beyondLawOption },
  beyondPerm: { section: "beyond", id: "chart-beyond-perm", className: "chart-host short", build: beyondPermOption },
  beyondWage: { section: "beyond", id: "chart-beyond-wage", className: "chart-host short", build: beyondWageOption },
  footprintRegion: { section: "footprint", id: "chart-footprint-region", className: "chart-host jobs-nmi", build: footprintRegionOption },
  footprintNmi: { section: "footprint", id: "chart-footprint-nmi", className: "chart-host jobs-nmi", build: footprintNmiOption },
  footprintSingle: { section: "footprintRank", id: "chart-footprint-single", className: "chart-host jobs-nmi", build: footprintSingleOption },
  footprintRank: { section: "footprintRank", id: "chart-footprint-rank", className: "chart-host jobs-nmi", build: footprintRankOption },
};

function chartPart({ section, id, className, build }: Chart): [ComponentType, ComponentType] {
  function Server() {
    return <div className={className} id={id}></div>;
  }
  function View() {
    const { data, error, T } = useSection(section);
    const option = useMemo(() => (data && T ? build(data, T) : null), [data, T]);
    useIslandReady(option !== null || error !== null);
    if (error)
      return (
        <div className={className} id={id}>
          <ErrorNote message={error} />
        </div>
      );
    return <W4Chart className={className} id={id} option={option} notMerge={false} />;
  }
  return [View, Server];
}

// ---- tables

type Table = { section: Section; id: string; head: W4Head[]; rows: (data: any) => W4Row[] };

const tagged = (text: string, tag: string | null) => ({
  text: tag ? `${text} ${tag}` : text,
  content: tag ? (
    <>
      {text} <span className="tag">{tag}</span>
    </>
  ) : (
    text
  ),
});

const TABLES: Record<string, Table> = {
  whereBreakLinks: {
    section: "whereWho",
    id: "where-break-links",
    head: ["Link", { text: "α", style: RIGHT }, { text: "Weight", style: RIGHT }, "Leading company", { text: "Its share", style: RIGHT }],
    rows: (data) =>
      whereBreakRows(data).map((l: any) => [
        l.link,
        { text: l.alpha, style: RIGHT },
        { text: l.weight, style: RIGHT },
        tagged(l.employer, l.tag),
        { text: l.share, style: RIGHT },
      ]),
  },
  linkcom: {
    section: "jobsSplit",
    id: "jobs-linkcom-table",
    head: ["Occupation", { text: "Links", style: RIGHT }, { text: "Communities", style: RIGHT }, { text: "Per link", style: RIGHT }],
    rows: (data) =>
      linkcomRows(data).map((o: any) => [tagged(o.title, o.tag), { text: o.links, style: RIGHT }, { text: o.communities, style: RIGHT }, { text: o.perLink, style: RIGHT }]),
  },
  whoMoversTable: {
    section: "moves",
    id: "who-movers-table",
    head: ["Client", { text: "Filings", style: RIGHT }, { text: "Vendors", style: RIGHT }, "Group, weighted", "Group, unweighted"],
    rows: (data) => whoMoversRows(data).map(([c, f, v, w, u]: string[]) => [c, { text: f, style: RIGHT }, { text: v, style: RIGHT }, w, u]),
  },
  whoOverlapTable: {
    section: "moves",
    id: "who-overlap-table",
    head: ["Client", { text: "Filings", style: RIGHT }, "First group", "Second group", "Main vendor"],
    rows: (data) => whoOverlapRows(data).map(([c, f, a, b, v]: string[]) => [c, { text: f, style: RIGHT }, a, b, v]),
  },
};

function tablePart({ section, id, head, rows }: Table): [ComponentType, ComponentType] {
  const heads = head.map((h) => (typeof h === "string" ? { text: h } : h));
  function Server() {
    return (
      <table className="ego">
        <thead>
          <tr>
            {heads.map((h, i) => (
              <th key={i} style={h.style}>
                {h.text}
              </th>
            ))}
          </tr>
        </thead>
        <tbody id={id}></tbody>
      </table>
    );
  }
  function View() {
    const { data, error } = useSection(section);
    const body = useMemo(() => (data ? rows(data) : null), [data]);
    useIslandReady(body !== null || error !== null);
    if (error) return <W4Table className="ego" head={head} tbodyId={id} rows={[[{ text: error, colSpan: 8, style: MUTED }]]} />;
    if (!body) return <Server />;
    return <W4Table className="ego" head={head} tbodyId={id} rows={body} />;
  }
  return [View, Server];
}

// ---- SVG parts

type Svg = { section: Section; id: string; fallback: number; Draw: ComponentType<{ data: any; T: T }> };

// The split's agreement against three random baselines, each with a ±1 sd whisker.
function SplitNmi({ data, T }: { data: any; T: T }) {
  const ref = useRef<SVGSVGElement>(null);
  const W = useFittedWidth(ref, 560);
  const { rows, steps, d1 } = useMemo(() => splitNmi(data), [data]);
  const small = T.fs("small");
  const caption = T.fs("caption");
  const x0 = Math.ceil(Math.max(...rows.flatMap((r: any) => r.lines.map((line: string) => T.measure(line, "small", r.bold ? 700 : 600))))) + 14;
  const x1 = W - 40;
  const Tp = 8;
  const rowH = 46;
  const ybot = Tp + rows.length * rowH;
  const H = ybot + 34;
  const X = (v: number) => x0 + (Math.min(Math.max(v, 0), d1) / d1) * (x1 - x0);
  const ink = T.token("--ink");
  const mute = T.token("--ink-mute-text");
  const axisName = "Agreement of the two groups' job clusters (NMI: 0 unrelated, 1 identical)";
  const half = T.measure(axisName, "caption") / 2;
  const grid: ReactNode[] = [];
  for (let i = 0; i <= steps; i += 1) {
    const v = i * 0.2;
    grid.push(
      <line key={`l${i}`} x1={X(v)} x2={X(v)} y1={Tp - 2} y2={ybot} stroke={T.token("--w4-grid")} />,
      <text key={`t${i}`} x={X(v)} y={ybot + 14} fontSize={caption} fill={mute} textAnchor="middle">
        {v.toFixed(1)}
      </text>,
    );
  }
  return (
    <svg ref={ref} viewBox={`0 0 ${W} ${H}`} width={W} height={H} role="img" aria-label="How much the outsourcing and direct-employer job clusters agree, against three random baselines">
      {grid}
      <text x={Math.max(half, Math.min((x0 + x1) / 2, W - half))} y={ybot + 31} fontSize={caption} fill={mute} textAnchor="middle">
        {axisName}
      </text>
      {rows.map((r: any, i: number) => {
        const cy = Tp + i * rowH + rowH / 2;
        const weight = r.bold ? 700 : 600;
        const tip =
          r.sd === null ? `${r.label}: NMI ${r.value.toFixed(3)}` : `${r.label}: NMI ${r.value.toFixed(3)} ± ${r.sd.toFixed(3)} (mean ± sd over the random splits)`;
        let end = X(r.value);
        let whisker = null;
        if (r.sd !== null) {
          const lo = X(r.value - r.sd);
          const hi = X(r.value + r.sd);
          whisker = (
            <>
              <line x1={lo} x2={hi} y1={cy} y2={cy} stroke={ink} strokeWidth={1.5} />
              <line x1={lo} x2={lo} y1={cy - 6} y2={cy + 6} stroke={ink} strokeWidth={1.5} />
              <line x1={hi} x2={hi} y1={cy - 6} y2={cy + 6} stroke={ink} strokeWidth={1.5} />
            </>
          );
          end = Math.max(end, hi);
        }
        return (
          <g key={i}>
            <text x={0} y={cy - 3} fontSize={small} fontWeight={weight} fill={ink}>
              {r.lines[0]}
            </text>
            <text x={0} y={cy + 12.5} fontSize={small} fontWeight={weight} fill={ink}>
              {r.lines[1]}
            </text>
            <g>
              <title>{tip}</title>
              <rect x={x0} y={cy - 9} width={Math.max(X(r.value) - x0, 1)} height={18} rx={3} fill={T.token(r.fill)} />
              {whisker}
            </g>
            <text x={end + 7} y={cy + 4.5} fontSize={small} fontWeight={700} fill={ink}>
              {r.value.toFixed(2)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// One bar: the links in the largest link community against the rest.
function LinkShare({ data, T }: { data: any; T: T }) {
  const ref = useRef<SVGSVGElement>(null);
  const W = useFittedWidth(ref, 520);
  const q = data.q2;
  const largest = q.largest_link_community_links;
  const rest = q.links - largest;
  const smaller = q.link_clusters - 1;
  const share = largest / q.links;
  const caption = T.fs("caption");
  const smallSize = T.fs("small");
  const H = 146;
  const by = 46;
  const bh = 34;
  const split = W * share;
  const ink = T.token("--ink");
  const soft = T.token("--ink-soft");
  return (
    <svg ref={ref} viewBox={`0 0 ${W} ${H}`} width={W} height={H} role="img" aria-label={`Share of the ${num(q.links)} links in the largest link community`}>
      <text x={0} y={24} fontSize={caption} fill={soft}>
        {`All ${num(q.links)} links between occupations, split by link community`}
      </text>
      <g>
        <title>{`Largest link community: ${num(largest)} of ${num(q.links)} links (${pct(share)})`}</title>
        <rect x={0} y={by} width={split - 2} height={bh} rx={5} fill={ink} />
        <text x={10} y={by + 21.5} fontSize={smallSize} fontWeight={700} fill={T.token("--card")}>
          {`One community: ${pct(share, 0)} of links`}
        </text>
      </g>
      <g>
        <title>{`The other ${num(smaller)} link communities: ${num(rest)} links (${pct(rest / q.links)})`}</title>
        <rect x={split} y={by} width={W - split} height={bh} rx={5} fill={T.token("--w4-meter")} />
        <text x={split + (W - split) / 2} y={by + 21.5} fontSize={smallSize} fontWeight={700} fill={ink} textAnchor="middle">
          {pct(rest / q.links, 0)}
        </text>
      </g>
      <text x={0} y={by + bh + 18} fontSize={caption} fill={soft}>
        {`${num(largest)} links`}
      </text>
      <text x={W} y={by + bh + 18} fontSize={caption} fill={soft} textAnchor="end">
        {`${num(rest)} links`}
      </text>
      <text x={W} y={by + bh + 40} fontSize={caption} fill={soft} textAnchor="end">
        {`${num(smaller)} smaller communities share the rest;`}
      </text>
      <text x={W} y={by + bh + 56} fontSize={caption} fill={soft} textAnchor="end">
        {`${num(data.finding.q2_link_clusters_of_3_or_more)} of all ${num(q.link_clusters)} hold three links or more`}
      </text>
    </svg>
  );
}

// Links against link communities for the jobs with the most communities per link.
function LinkScatter({ data, T }: { data: any; T: T }) {
  const ref = useRef<SVGSVGElement>(null);
  const W = useFittedWidth(ref, 520);
  const L = useMemo(() => linkScatterLayout(data, W), [data, W]);
  const caption = T.fs("caption");
  const small = T.fs("small");
  const ink = T.token("--ink");
  const soft = T.token("--ink-soft");
  const mute = T.token("--ink-mute");
  const muteText = T.token("--ink-mute-text");
  const halo = { paintOrder: "stroke", stroke: T.token("--w4-inset"), strokeWidth: 3 } as const;
  return (
    <svg ref={ref} viewBox={`0 0 ${W} ${L.H}`} width={W} height={L.H} role="img" aria-label={`Links against link communities for the ${L.count} jobs with the most communities per link`}>
      {L.yTicks.map((t: any) => [
        <line key={`g${t.v}`} x1={L.L} x2={W - L.R} y1={t.y} y2={t.y} stroke={T.token("--w4-grid")} />,
        <text key={`y${t.v}`} x={L.L - 8} y={t.y + 4} fontSize={caption} fill={muteText} textAnchor="end">
          {String(t.v)}
        </text>,
      ])}
      {L.xTicks.map((t: any) => (
        <text key={`x${t.v}`} x={t.x} y={L.H - L.B + 18} fontSize={caption} fill={muteText} textAnchor="middle">
          {String(t.v)}
        </text>
      ))}
      <text x={(L.L + W - L.R) / 2} y={L.H - 6} fontSize={caption} fill={soft} textAnchor="middle">
        links (other occupations it shares employers with)
      </text>
      <text x={L.L - 30} y={L.Tp - 12} fontSize={caption} fill={soft}>
        communities
      </text>
      {L.guides.map((g: any, i: number) => [
        <line key={`r${i}`} x1={g.x1} y1={g.y1} x2={g.x2} y2={g.y2} stroke={mute} strokeOpacity={0.55} strokeDasharray="3 3" />,
        <text key={`rl${i}`} x={g.lx} y={g.ly} fontSize={caption} fill={muteText} textAnchor={g.anchor}>
          {g.label}
        </text>,
      ])}
      <g>
        {L.leaders.map((l: any, i: number) => (
          <line key={i} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} stroke={mute} strokeWidth={1} />
        ))}
      </g>
      <g>
        {L.dots.map((d: any, i: number) => (
          <g key={i}>
            <title>{d.tip}</title>
            <circle cx={d.cx} cy={d.cy} r={5.5} fill={d.flagged ? T.token("--card") : ink} stroke={ink} strokeWidth={d.flagged ? 2.2 : 1} />
          </g>
        ))}
      </g>
      <g>
        {L.leaders.map((l: any, i: number) => (
          <text key={`l${i}`} x={l.lx} y={l.ly} fontSize={small} fontWeight={700} fill={ink} {...halo}>
            {l.text}
          </text>
        ))}
        {L.labels.map((l: any, i: number) => (
          <text key={`b${i}`} x={l.x} y={l.y} fontSize={small} fontWeight={l.bold ? 700 : 600} fill={ink} {...halo}>
            {l.text}
          </text>
        ))}
      </g>
    </svg>
  );
}

const SVGS: Record<string, Svg> = {
  splitNmi: { section: "jobsSplit", id: "chart-jobs-split-nmi", fallback: 560, Draw: SplitNmi },
  linkShare: { section: "jobsSplit", id: "chart-jobs-linkcom-share", fallback: 520, Draw: LinkShare },
  linkScatter: { section: "jobsSplit", id: "chart-jobs-linkcom-scatter", fallback: 520, Draw: LinkScatter },
};

function svgPart({ section, id, Draw }: Svg): [ComponentType, ComponentType] {
  function Server() {
    return <div className="w4-figure-body" id={id}></div>;
  }
  function View() {
    const { data, error, T } = useSection(section);
    useIslandReady((data && T) || error ? true : false);
    return (
      <div className="w4-figure-body" id={id}>
        {error ? <ErrorNote message={error} /> : data && T ? <Draw data={data} T={T} /> : null}
      </div>
    );
  }
  return [View, Server];
}

// ---- one island per part

const PARTS: Record<string, [ComponentType, ComponentType, string]> = {};
for (const [name, c] of Object.entries(CHARTS)) PARTS[name] = [...chartPart(c), `#${c.id}`];
for (const [name, t] of Object.entries(TABLES)) PARTS[name] = [...tablePart(t), `#${t.id}`];
for (const [name, s] of Object.entries(SVGS)) PARTS[name] = [...svgPart(s), `#${s.id}`];

const ISLANDS = Object.fromEntries(
  Object.entries(PARTS).map(([name, [View, Server, root]]) => [name, island(`week04/questions/${name}`, View, Server, { roots: [root] })]),
);

type Props = { part: string };

function View({ part }: Props) {
  const Part = ISLANDS[part];
  return <Part />;
}

function Placeholder({ part }: Props) {
  const Server = PARTS[part][1];
  return <Server />;
}

/** <QuestionPart part="whereWho" />: one client reference for every second-round figure. */
export const QuestionPart = island("week04/questions/Questions", View, Placeholder, { roots: Object.values(PARTS).map(([, , root]) => root) });
