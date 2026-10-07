// A round trip on a directed network under fog of war: from home to a target
// a few steps out, then back home, one out-link at a time. The map shows only
// the pages stood on and where their links lead; the list beside it names the
// way out of the page you stand on, so the whole game runs from the keyboard.
// A hint takes the next step of a shortest route and an undo steps back, each
// for extra steps. The reveal lifts the fog and sets your route against the
// shortest ones out and back, whose sum is par. Rules in game-core.js; frame
// from GameShell. Style: .kit-quest in post.css.
import { useEffect, useId, useMemo, useRef, useState } from "react";
import GameShell, { focusWithin, useGameRun, type GameSettings } from "./GameShell";
import NetworkView from "./NetworkView";
import {
  exits, goal, here, mulberry32, nextStep, par, pickTarget, questHint, questInit, questMove, questSteps, questUndo, revealed, shortestRoute,
} from "./game-core.js";
import { forceLayout } from "./graph-core.js";

export type QuestBand = { key: string; label: string; sub?: string; range: [number, number] };
type Edge = [number, number];
type Quest = ReturnType<typeof questInit>;

const BANDS: QuestBand[] = [
  { key: "near", label: "Next door", sub: "1 to 2 steps out", range: [1, 2] },
  { key: "mid", label: "Across town", sub: "3 to 4 steps out", range: [3, 4] },
  { key: "far", label: "The far side", sub: "5 or more out", range: [5, Infinity] },
];
const RATIO = 0.62;

/**
 * <PathQuest names={names} edges={edges} homes={[0]} />. `preset` ({ home,
 * target, moves }) opens the game mid-run, as a page showing one moment would.
 */
export default function PathQuest({
  names,
  edges,
  homes = [0],
  bands = BANDS,
  positions,
  seed = 1,
  preset,
  title = "Round trip",
  dailyToggle = true,
}: {
  names: string[];
  edges: Edge[];
  homes?: number[];
  bands?: QuestBand[];
  positions?: [number, number][];
  seed?: number;
  preset?: { home: number; target: number | null; moves?: number[] };
  title?: string;
  dailyToggle?: boolean;
}) {
  const n = names.length;
  const name = (v: number | null) => (v === null ? "nowhere" : names[v] ?? `node ${v}`);
  const at = useMemo(() => positions ?? (forceLayout(n, edges, { rng: mulberry32(n + 1), iterations: 200 }) as [number, number][]), [positions, n, edges]);
  const defaults: GameSettings = { home: String(preset?.home ?? homes[0] ?? 0), band: bands[Math.min(1, bands.length - 1)]?.key ?? "" };
  const range = (s: GameSettings) => bands.find((b) => b.key === s.band)?.range ?? [1, 2];
  const setUp = (s: GameSettings, sd: number) => {
    const home = Number(s.home);
    return questInit(n, edges, home, pickTarget(n, edges, home, range(s), mulberry32(sd)));
  };
  const [quest, setQuest] = useState<Quest>(() => {
    if (!preset) return questInit(n, edges, Number(defaults.home), null);
    return (preset.moves ?? []).reduce((q: Quest, v) => questMove(q, v), questInit(n, edges, preset.home, preset.target));
  });
  const run = useGameRun({ game: "path-quest", defaults, better: "lower", seed, autostart: Boolean(preset), onStart: (s, sd) => setQuest(setUp(s, sd)) });

  const parNow = quest.target === null ? null : par(n, edges, quest.home, quest.target);
  const steps = questSteps(quest);
  // Whether the settings picked offer any target at all, so Set out can say why it is off.
  const [lo, hi] = range(run.settings);
  const homeNow = Number(run.settings.home);
  const choice = useMemo(() => pickTarget(n, edges, homeNow, [lo, hi], mulberry32(1)), [n, edges, homeNow, lo, hi]);

  const exitsId = useId();
  const root = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLUListElement>(null);
  useEffect(() => {
    focusWithin(root.current, list.current?.querySelector<HTMLButtonElement>("button:not(:disabled)") ?? null);
  }, [quest.path.length]);

  const act = (next: Quest) => {
    setQuest(next);
    if (next.phase === "done" && quest.phase !== "done") run.finish(parNow === null ? null : questSteps(next) - parNow);
  };
  const go = (v: number) => act(questMove(quest, v));

  const seen = revealed(quest);
  const stood = new Set(quest.path);
  const pathLinks = quest.path.slice(1).map((v, i) => [quest.path[i], v] as [number, number]);

  const mapSpec = (all: boolean) => {
    const shown = all ? Array.from({ length: n }, (_, v) => v) : [...seen].sort((a, b) => a - b);
    const target = quest.target;
    return {
      ratio: RATIO,
      directed: true,
      radius: 6,
      labels: "beside" as const,
      nodes: shown.map((v) => ({
        id: v,
        x: 0.1 + (at[v]?.[0] ?? 0.5) * 0.8,
        y: 0.05 * RATIO + (at[v]?.[1] ?? 0.5) * 0.9 * RATIO,
        label: name(v),
        state: v === here(quest) && !all ? ("picked" as const) : v === target || v === quest.home ? ("ring" as const) : stood.has(v) ? ("new" as const) : undefined,
      })),
      links: edges.filter(([a, b]) => (all || stood.has(a)) && (all || seen.has(b))).map(([a, b]) => ({ source: a, target: b })),
      highlightLinks: pathLinks,
      aria: all
        ? `The whole network, ${n} pages; your route of ${quest.path.length - 1} steps highlighted`
        : `The pages you have seen: ${seen.size} of ${n}. You stand on ${name(here(quest))}.`,
    };
  };

  const out = exits(quest);
  const leg = quest.phase === "outbound" ? `Out to ${name(quest.target)}` : quest.phase === "return" ? `Back to ${name(quest.home)}` : "Home again";
  const hud = [
    { label: "Steps", value: steps, sub: quest.hints || quest.undos ? `${quest.hints} hints, ${quest.undos} undos` : undefined },
    { label: "Par", value: parNow ?? "none" },
    { label: "Seen", value: `${seen.size} of ${n}` },
    { label: "Leg", value: leg },
  ];

  const toTarget = quest.target === null ? null : shortestRoute(n, edges, quest.home, quest.target);
  const toHome = quest.target === null ? null : shortestRoute(n, edges, quest.target, quest.home);
  const route = (r: number[] | null) => (r ? r.map(name).join(" → ") : "no route");

  return (
    <div className="kit-quest" ref={root}>
      <GameShell
        run={run}
        title={title}
        dailyToggle={dailyToggle}
        intro={<p>Start at home, reach the target, then find your way back. Links run one way, and you only see a page&apos;s links once you stand on it.</p>}
        segments={[
          ...(homes.length > 1 ? [{ key: "home", label: "Home", options: homes.map((h) => ({ value: String(h), label: name(h) })) }] : []),
          { key: "band", label: "How far out", options: bands.map((b) => ({ value: b.key, label: b.label, sub: b.sub })) },
        ]}
        canStart={choice !== null}
        startNote={choice === null ? `No page in this band from ${name(Number(run.settings.home))} has a way back.` : undefined}
        startLabel="Set out"
        hud={hud}
        fmtScore={(v) => (v === 0 ? "par" : `${v > 0 ? "+" : ""}${v} on par`)}
        rules={
          <ol>
            <li>Pick a link out of the page you stand on, on the map or in the list.</li>
            <li>Reach the target, then get home. The way back is rarely the way you came.</li>
            <li>A hint takes the next shortest step for 2 extra steps; an undo costs 1.</li>
          </ol>
        }
        reveal={
          <div className="kit-quest-reveal">
            <NetworkView spec={mapSpec(true)} />
            <dl className="kit-game-compare">
              <div>
                <dt>Your route, {quest.path.length - 1} moves, {steps} steps charged</dt>
                <dd>{route(quest.path)}</dd>
              </div>
              <div>
                <dt>Shortest way out, {toTarget ? toTarget.length - 1 : "–"} steps</dt>
                <dd>{route(toTarget)}</dd>
              </div>
              <div>
                <dt>Shortest way back, {toHome ? toHome.length - 1 : "–"} steps</dt>
                <dd>{route(toHome)}</dd>
              </div>
            </dl>
            <p className="kit-game-verdict">
              {run.score === null
                ? "You gave up."
                : run.score === 0
                  ? `Home in ${steps} steps: exactly par.`
                  : `Home in ${steps} steps: ${run.score > 0 ? `${run.score} over` : `${-run.score} under`} par of ${parNow}.`}
            </p>
          </div>
        }
      >
        <div className="kit-quest-play">
          <div className="kit-quest-map">
            <NetworkView key={[...seen].sort((a, b) => a - b).join(",")} spec={mapSpec(false)} onNodeClick={(id) => out.includes(Number(id)) && go(Number(id))} />
          </div>
          <div className="kit-quest-side">
            <p className="kit-quest-here">
              You are on <b>{name(here(quest))}</b>. Heading for <b>{name(goal(quest))}</b>.
            </p>
            <h5 id={exitsId}>Links out of this page</h5>
            {out.length === 0 ? (
              <p className="kit-empty">No links lead out of here. Undo, or give up.</p>
            ) : (
              <ul ref={list} className="kit-quest-exits" aria-labelledby={exitsId}>
                {out.map((v) => (
                  <li key={v}>
                    <button type="button" onClick={() => go(v)}>
                      {name(v)}
                      {v === goal(quest) ? <em> {quest.phase === "outbound" ? "target" : "home"}</em> : stood.has(v) ? <small> been here</small> : null}
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <div className="kit-game-tools">
              <button type="button" className="kit-btn" onClick={() => act(questHint(quest))} disabled={nextStep(quest) === null}>
                Hint (+2)
              </button>
              <button type="button" className="kit-btn" onClick={() => act(questUndo(quest))} disabled={questUndo(quest) === quest}>
                Undo (+1)
              </button>
              <button type="button" className="kit-link" onClick={() => run.finish(null)}>
                Give up
              </button>
            </div>
            <p className="kit-note" aria-live="polite">
              {quest.phase === "return" && quest.path.length - 1 === quest.turn ? `Found ${name(quest.target)}. Now get home.` : `Route so far: ${route(quest.path)}`}
            </p>
          </div>
        </div>
      </GameShell>
    </div>
  );
}
