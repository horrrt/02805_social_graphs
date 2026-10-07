// Shatter the core: a budget of hits, each removing one node and its links,
// to leave the largest connected component as small as you can. Nodes cut
// off from the core turn grey. A hint marks the hit that would shrink the
// core most now. When the hits run out, three bots play the same board (the
// most connected, the biggest broker by betweenness, both recomputed after
// every hit, and a seeded random hitter), the reveal plots core size against
// hits for all four and ranks you. The list beside the map names every node
// still standing with its links, so the game runs from the keyboard. Rules in
// game-core.js; frame from GameShell. Style: .kit-attack in post.css.
import { useEffect, useId, useMemo, useRef, useState } from "react";
import GameShell, { focusWithin, useGameRun, type GameSettings } from "./GameShell";
import NetworkView from "./NetworkView";
import { useFittedWidth } from "@/lib/useSize";
import { useSvgBase } from "./svgBits";
import { bestHit, botHits, clampBudget, coreAfter, coreCurve, cutOff, mulberry32, rankRuns } from "./game-core.js";
import { degrees, forceLayout } from "./graph-core.js";

type Edge = [number, number];
export type CoreSeries = { key: string; label: string; sizes: number[]; colour: string };

const BOTS: [string, string, string][] = [
  ["degree", "Most connected", "--access"],
  ["betweenness", "Biggest broker", "--outbound"],
  ["random", "Random", "--ink-mute"],
];

const HEIGHT = 200;
const M = { top: 12, right: 16, bottom: 36, left: 40 };

/** Core size against hits, one line per player, on one scale. */
function CoreChart({ series, total }: { series: CoreSeries[]; total: number }) {
  const base = useSvgBase(["--outbound"]);
  return <div className="kit-attack-chart">{base ? <CorePlot series={series} total={total} {...base} /> : null}</div>;
}

// Mounted once the tokens are read, so useFittedWidth finds its svg on the first effect.
function CorePlot({ series, total, scale, tokens: t }: { series: CoreSeries[]; total: number } & NonNullable<ReturnType<typeof useSvgBase>>) {
  const svg = useRef<SVGSVGElement>(null);
  const width = useFittedWidth(svg, 420);
  const hits = Math.max(1, ...series.map((s) => s.sizes.length - 1));
  const sx = (i: number) => M.left + (i / hits) * (width - M.left - M.right);
  const sy = (v: number) => HEIGHT - M.bottom - (v / Math.max(1, total)) * (HEIGHT - M.top - M.bottom);
  const caption = scale.fs("caption");
  const yTicks = [0, Math.round(total / 2), total];
  const aria = `Largest component against hits: ${series.map((s) => `${s.label} ends at ${s.sizes[s.sizes.length - 1]}`).join(", ")}, of ${total}`;
  return (
    <>
      <svg ref={svg} viewBox={`0 0 ${width} ${HEIGHT}`} width={width} height={HEIGHT} role="img" aria-label={aria}>
        {yTicks.map((v, i) => (
          <g key={i}>
            <line x1={M.left} x2={width - M.right} y1={sy(v)} y2={sy(v)} stroke={t["--w4-grid"]} strokeWidth={1} />
            <text x={M.left - 6} y={sy(v) + 4} fontSize={caption} fill={t["--ink-mute-text"]} textAnchor="end">
              {v}
            </text>
          </g>
        ))}
        {Array.from({ length: hits + 1 }, (_, i) => (
          <text key={i} x={sx(i)} y={HEIGHT - M.bottom + 15} fontSize={caption} fill={t["--ink-mute-text"]} textAnchor="middle">
            {i}
          </text>
        ))}
        <text x={(M.left + width - M.right) / 2} y={HEIGHT - 4} fontSize={caption} fill={t["--ink-soft"]} textAnchor="middle">
          hits
        </text>
        {series.map((s) => (
          <polyline
            key={s.key}
            points={s.sizes.map((v, i) => `${sx(i).toFixed(1)},${sy(v).toFixed(1)}`).join(" ")}
            fill="none"
            stroke={s.colour.startsWith("--") ? t[s.colour] : s.colour}
            strokeWidth={s.key === "you" ? 3 : 1.6}
            strokeDasharray={s.key === "random" ? "4 3" : undefined}
          />
        ))}
      </svg>
      <ul className="kit-attack-key">
        {series.map((s) => (
          <li key={s.key}>
            <i style={{ background: s.colour.startsWith("--") ? `var(${s.colour})` : s.colour }} />
            {s.label}
          </li>
        ))}
      </ul>
    </>
  );
}

/**
 * <AttackGame n={34} edges={karate} names={names} />. `preset` ({ budget,
 * hits }) opens the game mid-run.
 */
export default function AttackGame({
  n,
  edges,
  names,
  positions,
  budgets = [3, 5, 8],
  hints = 2,
  seed = 1,
  preset,
  title = "Shatter the core",
  dailyToggle = true,
}: {
  n: number;
  edges: Edge[];
  names?: string[];
  positions?: [number, number][];
  budgets?: number[];
  hints?: number;
  seed?: number;
  preset?: { budget: number; hits?: number[] };
  title?: string;
  dailyToggle?: boolean;
}) {
  const name = (v: number) => names?.[v] ?? `node ${v}`;
  const at = useMemo(() => positions ?? (forceLayout(n, edges, { rng: mulberry32(n + 3), iterations: 200 }) as [number, number][]), [positions, n, edges]);
  const defaults: GameSettings = { budget: String(preset?.budget ?? budgets[0] ?? 3) };
  const [hits, setHits] = useState<number[]>(() => preset?.hits ?? []);
  const [hintsLeft, setHintsLeft] = useState(hints);
  const [hinted, setHinted] = useState<number | null>(null);
  const run = useGameRun({
    game: "attack",
    defaults,
    better: "lower",
    seed,
    autostart: Boolean(preset),
    onStart: () => {
      setHits([]);
      setHintsLeft(hints);
      setHinted(null);
    },
  });
  const budget = clampBudget(n, Number(run.settings.budget));
  const asked = Number(run.settings.budget);

  const core = useMemo(() => coreAfter(n, edges, hits), [n, edges, hits]);
  const cut = useMemo(() => cutOff(n, edges, hits), [n, edges, hits]);
  const gone = new Set(hits);
  const kept = edges.filter(([a, b]) => !gone.has(a) && !gone.has(b));
  const k = degrees(n, kept);
  const left = budget - hits.length;

  const listId = useId();
  const root = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLUListElement>(null);
  useEffect(() => {
    focusWithin(root.current, list.current?.querySelector<HTMLButtonElement>("button") ?? null);
  }, [hits.length]);

  const hit = (v: number) => {
    if (gone.has(v) || left <= 0 || run.phase !== "playing") return;
    const next = [...hits, v];
    setHits(next);
    setHinted(null);
    if (next.length >= budget) run.finish(coreAfter(n, edges, next).length);
  };
  const hint = () => {
    if (hintsLeft <= 0) return;
    setHinted(bestHit(n, edges, hits));
    setHintsLeft(hintsLeft - 1);
  };

  const live = Array.from({ length: n }, (_, v) => v).filter((v) => !gone.has(v));
  const ranked = [...live].sort((a, b) => k[b] - k[a] || a - b);
  const coreSet = new Set(core);
  const spec = (final: boolean) => ({
    ratio: 0.62,
    radius: 6,
    nodes: Array.from({ length: n }, (_, v) => ({
      id: v,
      x: 0.06 + (at[v]?.[0] ?? 0.5) * 0.88,
      y: 0.04 + (at[v]?.[1] ?? 0.5) * 0.54,
      label: name(v),
      group: coreSet.has(v) ? 0 : null,
      state: gone.has(v) ? ("ghost" as const) : !final && v === hinted ? ("ring" as const) : undefined,
    })),
    links: edges.map(([a, b]) => ({ source: a, target: b })),
    groups: ["core"],
    aria: `${n} nodes; ${hits.length} hit, ${cut.length} cut off, the core holds ${core.length}`,
  });

  // The bots, on the same board with the same budget, once the run ends.
  const result = useMemo(() => {
    if (run.phase !== "reveal") return null;
    const runs: Record<string, number> = { you: coreAfter(n, edges, hits).length };
    const series = [{ key: "you", label: "You", sizes: coreCurve(n, edges, hits), colour: "--people" }];
    const picks: Record<string, number[]> = {};
    for (const [key, label, colour] of BOTS) {
      const order = botHits(n, edges, budget, key, mulberry32(run.seed));
      picks[key] = order;
      runs[key] = coreAfter(n, edges, order).length;
      series.push({ key, label, sizes: coreCurve(n, edges, order), colour });
    }
    return { ranks: rankRuns(runs), series, picks };
  }, [run.phase, run.seed, n, edges, hits, budget]);
  const labelOf = (key: string) => (key === "you" ? "You" : BOTS.find((b) => b[0] === key)?.[1] ?? key);

  return (
    <div className="kit-attack" ref={root}>
      <GameShell
        run={run}
        title={title}
        dailyToggle={dailyToggle}
        intro={<p>Each hit removes one node and every link through it. When the hits run out, the score is the size of the largest piece still holding together: smaller is better.</p>}
        segments={[{ key: "budget", label: "Hits", options: budgets.map((b) => ({ value: String(b), label: `${b} hits`, sub: b > n ? `cut to ${n}` : undefined })) }]}
        canStart={budget > 0}
        startNote={n === 0 ? "There is nothing to hit." : asked > n ? `Only ${n} nodes: the budget is cut to ${n}.` : undefined}
        startLabel="Take the contract"
        hud={[
          { label: "Core", value: `${core.length} of ${n}` },
          { label: "Cut off", value: cut.length },
          { label: "Hits left", value: left },
          { label: "Hints left", value: hintsLeft },
        ]}
        fmtScore={(v) => `a core of ${v}`}
        reveal={
          result ? (
            <div className="kit-attack-reveal">
              <div className="kit-attack-cols">
                <CoreChart series={result.series} total={n} />
                <ol className="kit-attack-ranks">
                  {result.ranks.map((r) => (
                    <li key={r.key} className={r.key === "you" ? "kit-target" : undefined}>
                      <span className="kit-rank">{r.rank}</span>
                      <span>{labelOf(r.key)}</span>
                      <span className="kit-num">core {r.core}</span>
                    </li>
                  ))}
                </ol>
              </div>
              <NetworkView spec={spec(true)} />
              <dl className="kit-game-compare">
                <div>
                  <dt>Your hits</dt>
                  <dd>{hits.map(name).join(", ") || "none"}</dd>
                </div>
                {BOTS.map(([key, label]) => (
                  <div key={key}>
                    <dt>{label}</dt>
                    <dd>{result.picks[key].map(name).join(", ") || "none"}</dd>
                  </div>
                ))}
              </dl>
            </div>
          ) : null
        }
      >
        <div className="kit-attack-play">
          <div className="kit-attack-map">
            <NetworkView key={cut.join(",")} spec={spec(false)} onNodeClick={(id) => hit(Number(id))} />
          </div>
          <div className="kit-attack-side">
            <h5 id={listId}>Still standing, most connected first</h5>
            <ul ref={list} className="kit-game-list" aria-labelledby={listId}>
              {ranked.map((v) => (
                <li key={v} className={coreSet.has(v) ? undefined : "kit-muted"}>
                  <button type="button" onClick={() => hit(v)} disabled={left <= 0}>
                    {name(v)}
                    <small>
                      {" "}
                      {k[v]} {k[v] === 1 ? "link" : "links"}
                      {coreSet.has(v) ? "" : ", cut off"}
                    </small>
                    {v === hinted ? <em> hint</em> : null}
                  </button>
                </li>
              ))}
            </ul>
            <div className="kit-game-tools">
              <button type="button" className="kit-btn" onClick={hint} disabled={hintsLeft <= 0}>
                Hint ({hintsLeft} left)
              </button>
            </div>
            <p className="kit-note" aria-live="polite">
              {hinted !== null ? `Hint: taking out ${name(hinted)} shrinks the core most now. That is not always the most connected name.` : hits.length ? `Last hit: ${name(hits[hits.length - 1])}.` : "Pick your first hit."}
            </p>
          </div>
        </div>
      </GameShell>
    </div>
  );
}
