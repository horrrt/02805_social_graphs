"use client";
// The deep dive's PageRank explorable (#cut-pagerank), which
// week04-pagerank.js built on main once the box first opened: box 6, the top
// 15 at a damping factor the reader picks, and box 7, the power iteration
// round by round as a bump chart, with its movers table. Until pagerank.json
// loads the box shows its status line.
import { useEffect, useMemo, useRef, useState } from "react";
import { Drawer } from "@/components/post/Drawer";
import { Drawers } from "@/components/post/Drawers";
import { SegmentedControl } from "@/components/post/SegmentedControl";
import { TermText } from "@/kit";
import { island, useIslandReady } from "@/lib/island";
import { useFittedWidth } from "@/lib/useSize";
import { BAR_W, DEFAULT_D, INTRO, ROW_H, TOP_SHOWN, dampingText, iterationText, pagerankRows, short, stablePoint } from "@/scripts/week04-pagerank.js";
import { W4Table } from "../W4Table";
import { W4, useW4Data } from "../useW4Data";
import { useT, type T } from "../useT";

const TOKENS = ["--ink", "--ink-soft", "--ink-mute", "--ink-mute-text", "--w4-accent", "--w4-grid", "--card"];

type Bar = { rank: number; label: string; value: number; badge?: number; tip: string };

/** A horizontal bar per row, value 0..max, with a small numeral badge (a degree rank). */
function HBars({ rows, max, badgeLabel, aria, T }: { rows: Bar[]; max: number; badgeLabel: string; aria: string; T: T }) {
  const ref = useRef<SVGSVGElement>(null);
  const width = useFittedWidth(ref, BAR_W);
  const top = 4;
  const h = top + rows.length * ROW_H + 8;
  const x0 = Math.ceil(Math.max(...rows.map((r) => T.measure(`${r.rank}. ${r.label}`, "small", 600)))) + 12;
  const badgeW = rows.some((r) => r.badge !== undefined) ? Math.ceil(Math.max(...rows.map((r) => T.measure(`${badgeLabel} #${r.badge}`, "caption")))) + 12 : 0;
  const x1 = width - badgeW;
  return (
    <svg ref={ref} viewBox={`0 0 ${width} ${h}`} width={width} height={h} role="img" aria-label={aria}>
      {rows.map((r, i) => {
        const cy = top + i * ROW_H;
        const w = ((x1 - x0) * r.value) / max;
        return (
          <g key={i}>
            <text x={0} y={cy + 13.5} fontSize={T.fs("small")} fontWeight={600} fill={T.token("--ink")}>
              {`${r.rank}. ${r.label}`}
              <title>{r.tip}</title>
            </text>
            <g>
              <title>{r.tip}</title>
              <rect x={x0} y={cy + 2} width={Math.max(w, 1)} height={14} rx={3} fill={T.token("--w4-accent")} />
            </g>
            {r.badge !== undefined ? (
              <text x={width} y={cy + 13} fontSize={T.fs("caption")} fill={T.token("--ink-mute-text")} textAnchor="end">
                {`${badgeLabel} #${r.badge}`}
              </text>
            ) : null}
          </g>
        );
      })}
    </svg>
  );
}

function Notice({ children }: { children: React.ReactNode }) {
  return (
    <div className="notice">
      <span className="ico">💡</span>
      <span>
        <b>What to notice</b>
        <span>{children}</span>
      </span>
    </div>
  );
}

function Box6({ data, T }: { data: any; T: T }) {
  const text = useMemo(() => dampingText(data), [data]);
  const [d, setD] = useState(DEFAULT_D);
  const { max, rows } = useMemo(() => pagerankRows(data.rankings[d].slice(0, TOP_SHOWN)), [data, d]);
  const buttons = data.damping.map((v: number) => ({ value: String(v), label: `d = ${v}`, dataAttr: { name: "d", value: String(v) } }));
  return (
    <div className="card w4-card" id="cut-pagerank-explore">
      <header className="w4-q">
        <span className="w4-num">6</span>
        <div>
          <h2>Change the damping factor: does the ranking move?</h2>
          <p className="w4-answer">{text.answer}</p>
        </div>
      </header>
      <div className="w4-two">
        <div>
          <p className="sub">Pick a value below.</p>
          <SegmentedControl className="axis-modes" role="group" ariaLabel="Damping factor" buttons={buttons} value={d} onChange={setD} />
          <p className="w4-legend">
            <span>
              <i style={{ background: "var(--w4-accent)" }}></i>PageRank (bar length)
            </span>
            <span>deg #n = that occupation's rank by plain unweighted degree</span>
          </p>
          <Notice>{text.notice}</Notice>
          <Drawers variant="foot">
            <Drawer label="Background">
              <div>
                <p>
                  <TermText
                    text="Each step, a PageRank walker follows a tie with probability d, the damping factor, or jumps to a random occupation. At d = 0 the ties do not matter; near 1 they decide the order."
                    phrase="PageRank"
                    definition="A score from a random walk along the ties: occupations the walk visits often, because well-linked occupations tie to them, score high."
                    id="w4-term-cut-pagerank-explore-pagerank"
                  />
                </p>
                <p>In the chart, a short bar with a small badge number is well connected but not well placed.</p>
              </div>
            </Drawer>
            <Drawer label="Method">
              <p>
                <span>{text.method}</span>
              </p>
            </Drawer>
            <Drawer label="More numbers">
              <div>
                <p>{text.movers}</p>
                <p>{text.overlap}</p>
              </div>
            </Drawer>
          </Drawers>
        </div>
        <div className="plot">
          <h3>{`Top ${TOP_SHOWN} occupations by PageRank`}</h3>
          <p className="axis-note">
            <TermText
              text="Bar length is PageRank at the chosen damping factor; the badge on the right is that occupation's rank by plain unweighted degree."
              phrase="degree"
              definition="The number of ties an occupation has, each counted once however many companies share it."
              id="w4-term-cut-pagerank-explore-degree"
            />
          </p>
          <div className="w4-figure-body">
            <HBars rows={rows} max={max} badgeLabel="deg" aria={`Top ${TOP_SHOWN} occupations by PageRank at damping ${d}, with each occupation's plain-degree rank`} T={T} />
          </div>
        </div>
      </div>
    </div>
  );
}

/** A bump chart: rank after each round for the occupations in the final top 10, round 0 left out. */
function Bump({ it, T }: { it: any; T: T }) {
  const ref = useRef<SVGSVGElement>(null);
  const W = useFittedWidth(ref, 620);
  const steps = it.steps.filter((s: any) => s.step > 0);
  const final = steps.at(-1).rows;
  const n = final.length;
  const caption = T.fs("caption");
  const LEFT = 34;
  const NAMES_W = Math.ceil(Math.max(...final.map((occ: any) => T.measure(short(occ.title), "small", 700)))) + 20;
  const TOP = 34;
  const ROW = 25;
  const out = TOP + n * ROW + 6;
  const H = out + 10;
  const xs = steps.map((_: any, i: number) => LEFT + (i * (W - LEFT - NAMES_W)) / (steps.length - 1));
  const y = (rank: number) => TOP + (rank - 1) * ROW;
  const roundLabel = (s: any, i: number) => (i === steps.length - 1 ? "final" : i === 0 ? `round ${s.step}` : String(s.step));
  const roundName = (s: any, i: number) => (i === steps.length - 1 ? "the final round" : `round ${s.step}`);
  const leader = final[0].code;
  const firstLeader = steps[0].rows[0].code;
  const colour = (code: string) => (code === leader ? T.token("--w4-accent") : code === firstLeader ? T.token("--ink") : T.token("--ink-mute"));
  const highlight = (code: string) => code === leader || code === firstLeader;
  const muted = T.token("--ink-mute-text");
  // Grey lines first, so the two highlighted ones sit on top.
  const order = [...final].sort((a: any, b: any) => Number(highlight(a.code)) - Number(highlight(b.code)));
  return (
    <svg
      ref={ref}
      viewBox={`0 0 ${W} ${H}`}
      width={W}
      height={H}
      role="img"
      aria-label={`Rank after each round for the ${n} occupations that finish on top: ${final[0].title} first from round ${stablePoint(it.steps, (s: any) => s.rows[0].code)} on`}
    >
      {steps.map((s: any, i: number) => [
        <text key={`r${i}`} x={xs[i]} y={16} textAnchor="middle" fontSize={caption} fill={muted}>
          {roundLabel(s, i)}
        </text>,
        <line key={`l${i}`} x1={xs[i]} x2={xs[i]} y1={TOP - 8} y2={out + 4} stroke={T.token("--w4-grid")} />,
      ])}
      {Array.from({ length: n }, (_, k) => (
        <text key={`k${k}`} x={LEFT - 10} y={y(k + 1) + 4} textAnchor="end" fontSize={caption} fill={muted}>
          {String(k + 1)}
        </text>
      ))}
      <text x={LEFT - 10} y={out + 4} textAnchor="end" fontSize={caption} fill={muted} opacity={0.6}>
        {`${n + 1}+`}
      </text>
      {order.map((occ: any) => {
        const c = colour(occ.code);
        const strong = highlight(occ.code);
        const pts = steps.map((s: any, i: number) => {
          const at = s.rows.findIndex((r: any) => r.code === occ.code);
          return { x: xs[i], y: at < 0 ? out : y(at + 1), rank: at < 0 ? null : at + 1, name: roundName(s, i) };
        });
        return (
          <g key={occ.code}>
            <title>{`${occ.title}: rank ${final.indexOf(occ) + 1} at the end`}</title>
            <polyline
              points={pts.map((p: any) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ")}
              fill="none"
              stroke={c}
              strokeWidth={strong ? 3 : 1.6}
              strokeOpacity={strong ? 1 : 0.5}
              strokeLinejoin="round"
            />
            {pts.map((p: any, i: number) => (
              <circle key={i} cx={p.x.toFixed(1)} cy={p.y.toFixed(1)} r={strong ? 3.5 : 2.6} fill={p.rank === null ? T.token("--card") : c} stroke={c} strokeWidth={1.5}>
                <title>{p.rank === null ? `${occ.title}: outside the top ${n} after ${p.name}` : `${occ.title}: rank ${p.rank} after ${p.name}`}</title>
              </circle>
            ))}
            <text x={xs.at(-1) + 12} y={y(final.indexOf(occ) + 1) + 4} fontSize={T.fs("small")} fontWeight={strong ? 700 : 600} fill={strong ? c : T.token("--ink-soft")}>
              {short(occ.title)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

const RIGHT = { textAlign: "right" as const };

function Box7({ data, T }: { data: any; T: T }) {
  const text = useMemo(() => iterationText(data), [data]);
  const it = data.iteration;
  return (
    <div className="card w4-card" id="cut-pagerank-iteration">
      <header className="w4-q">
        <span className="w4-num">7</span>
        <div>
          <h2>Stepped one round at a time, how fast does the ranking settle?</h2>
          <p className="w4-answer">{text.answer}</p>
        </div>
      </header>
      <div className="w4-two">
        <div>
          <p className="sub">
            <TermText
              text={text.lead}
              phrase="PageRank"
              definition={`A score from a random walk along the ties. Here it is computed step by step (power iteration) with damping d = ${it.alpha}, and the walk is stopped after each round.`}
              id="w4-term-cut-pagerank-iteration-pagerank"
            />
          </p>
          <Notice>{text.notice}</Notice>
          <Drawers variant="foot">
            <Drawer label="Method">
              <div>
                <p>
                  <span>{text.check}</span>
                </p>
                <p>
                  <span>{text.step}</span>
                </p>
              </div>
            </Drawer>
            <Drawer label="More numbers">
              <p>
                <span>{text.more}</span>
              </p>
            </Drawer>
          </Drawers>
        </div>
        <div className="plot">
          <h3>{text.heading}</h3>
          <p className="axis-note">{text.note}</p>
          <div className="w4-figure-body">
            <Bump it={it} T={T} />
          </div>
        </div>
      </div>
      <W4Table
        className="ego"
        caption={`The ${data.movers.length} occupations whose rank changes most between d = 0.5 and d = 0.99`}
        head={[
          { text: "Occupation" },
          { text: "Rank at d = 0.5", style: RIGHT },
          { text: "Rank at d = 0.99", style: RIGHT },
          { text: "Shift", style: RIGHT },
          { text: "Degree rank", style: RIGHT },
        ]}
        rows={data.movers.map((m: any) => [
          m.title,
          { text: String(m.rank_d0_5), style: RIGHT },
          { text: String(m.rank_d0_99), style: RIGHT },
          {
            text: `${m.rank_shift > 0 ? "+" : ""}${m.rank_shift}`,
            style: RIGHT,
            content: <span className={`w4-rank-shift ${m.rank_shift > 0 ? "up" : "down"}`}>{`${m.rank_shift > 0 ? "+" : ""}${m.rank_shift}`}</span>,
          },
          { text: String(m.degree_rank), style: RIGHT },
        ])}
      />
    </div>
  );
}

const LOADING = "Loading the PageRank explorable…";

function StatusLine({ text }: { text: string }) {
  return (
    <p aria-live="polite" className="status-line" id="pagerank-status">
      {text}
    </p>
  );
}

function Server() {
  return <StatusLine text={LOADING} />;
}

function PageRankView() {
  // Built once #cut-pagerank first opens, or at once if it is open already.
  const [opened, setOpened] = useState(false);
  useEffect(() => {
    const box = document.getElementById("cut-pagerank") as HTMLDetailsElement | null;
    if (!box) return;
    if (box.open) setOpened(true);
    const controller = new AbortController();
    box.addEventListener("toggle", () => box.open && setOpened(true), { signal: controller.signal });
    return () => controller.abort();
  }, []);
  const state = useW4Data(W4.data("pagerank"), "week04-pagerank", { enabled: opened });
  const T = useT(TOKENS);
  useIslandReady(Boolean(state.data && T));
  if (state.status === "error") return <StatusLine text="Could not load the PageRank explorable." />;
  if (!state.data || !T) return <Server />;
  return (
    <>
      <p className="w4-box-intro">{INTRO}</p>
      <Box6 data={state.data} T={T} />
      <Box7 data={state.data} T={T} />
    </>
  );
}

/** <PageRank />: the content of #pagerank-body. */
export const PageRank = island("week04/pagerank/PageRank", PageRankView, Server, {
  roots: ["#pagerank-status", "#cut-pagerank-explore", "#cut-pagerank-iteration"],
});
