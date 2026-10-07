// The frame every kit game plays in: a start screen with a row of option
// buttons per setting (aria-pressed), an optional daily-seed toggle and the
// best score for the settings picked; then a row of stat tiles over the game;
// then the reveal, where the game sets the reader's run against the bots or a
// reference, with Play again and Change settings. useGameRun holds the run
// (game-core.js runReducer), the settings and the best scores; the game holds
// its own board and starts it from onStart(settings, seed). Best scores live
// in localStorage once hydrated and in memory when storage throws; the date
// for the daily seed is read on the click, never in render. Style:
// .kit-game in post.css.
import { useEffect, useId, useReducer, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import Readouts, { type ReadoutItem } from "./Readouts";
import { bestStore, dailySeed, runInit, runReducer, settingsKey } from "./game-core.js";

export type GameSettings = Record<string, string>;
export type GameOption = { value: string; label: string; sub?: string; disabled?: boolean };
export type GameSegment = { key: string; label: string; options: GameOption[] };
export type GamePhase = "idle" | "playing" | "reveal";

type Store = ReturnType<typeof bestStore>;

export type GameRun = {
  phase: GamePhase;
  settings: GameSettings;
  set: (key: string, value: string) => void;
  seed: number;
  runs: number;
  score: number | null;
  daily: boolean;
  setDaily: (on: boolean) => void;
  best: number | null;
  isNew: boolean;
  better: "higher" | "lower";
  start: () => void;
  finish: (score: number | null) => void;
  again: () => void;
  replay: () => void;
};

// Today's date in the reader's zone, as yyyy-mm-dd; read only inside a click.
const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

/**
 * The run's state for a GameShell: settings from `defaults`, the seed (or the
 * day's under the daily toggle), and the best score per settings. onStart runs
 * inside the click that starts a game (and again), with the settings and seed,
 * so the game sets up its board there. autostart begins in play with `seed`,
 * for a game shown mid-run.
 */
export function useGameRun({
  game,
  defaults,
  better = "higher",
  seed = 1,
  autostart = false,
  onStart,
}: {
  game: string;
  defaults: GameSettings;
  better?: "higher" | "lower";
  seed?: number;
  autostart?: boolean;
  onStart?: (settings: GameSettings, seed: number) => void;
}): GameRun {
  const [run, dispatch] = useReducer(runReducer, seed, (s: number) => (autostart ? runReducer(runInit(s), { type: "start" }) : runInit(s)));
  const [settings, setSettings] = useState<GameSettings>(defaults);
  const [daily, setDaily] = useState(false);
  const [best, setBest] = useState<number | null>(null);
  const [isNew, setIsNew] = useState(false);
  const store = useRef<Store | null>(null);
  const key = settingsKey(game, settings);

  // The store opens after hydration; reading localStorage itself can throw.
  useEffect(() => {
    let storage: Storage | null = null;
    try {
      storage = window.localStorage;
    } catch {
      storage = null;
    }
    store.current = bestStore(storage);
  }, []);
  useEffect(() => {
    setBest(store.current?.get(key) ?? null);
    setIsNew(false);
  }, [key]);

  const seedNow = (fallback: number) => (daily ? dailySeed(today()) : fallback);
  return {
    phase: run.phase as GamePhase,
    settings,
    set: (k, v) => setSettings((s) => ({ ...s, [k]: v })),
    seed: run.seed,
    runs: run.runs,
    score: run.score,
    daily,
    setDaily,
    best,
    isNew,
    better,
    start() {
      const s = seedNow(run.seed);
      onStart?.(settings, s);
      setIsNew(false);
      dispatch({ type: "start", seed: s });
    },
    finish(score) {
      if (run.phase !== "playing") return;
      dispatch({ type: "finish", score });
      if (score === null || !Number.isFinite(score)) return;
      const r = (store.current ??= bestStore(null)).record(key, score, better);
      setBest(r.best);
      setIsNew(r.isNew);
    },
    again() {
      const s = seedNow((run.seed + 1) >>> 0);
      onStart?.(settings, s);
      setIsNew(false);
      dispatch({ type: "again", seed: s });
    },
    replay: () => dispatch({ type: "replay" }),
  };
}

/** Moves the focus to `el` only when the reader is already in `root` or nowhere, so a game never pulls focus on its own. */
export function focusWithin(root: HTMLElement | null, el: HTMLElement | null | undefined) {
  const active = document.activeElement;
  if (el && root && (active === null || active === document.body || root.contains(active))) el.focus();
}

function Segment({ seg, value, onPick }: { seg: GameSegment; value: string; onPick: (v: string) => void }) {
  const id = useId();
  return (
    <div className="kit-game-seg">
      <span id={id} className="kit-game-seg-label">
        {seg.label}
      </span>
      <div role="group" aria-labelledby={id}>
        {seg.options.map((o) => (
          <button key={o.value} type="button" aria-pressed={o.value === value} disabled={o.disabled} onClick={() => onPick(o.value)}>
            <b>{o.label}</b>
            {o.sub ? <small>{o.sub}</small> : null}
          </button>
        ))}
      </div>
    </div>
  );
}

/**
 * <GameShell run={run} title="Round trip" segments={segs} hud={tiles} reveal={<Compare />}>{board}</GameShell>
 */
export default function GameShell({
  run,
  title,
  intro,
  segments = [],
  rules,
  hud = [],
  children,
  reveal,
  startLabel = "Start",
  canStart = true,
  startNote,
  dailyToggle = false,
  fmtScore = (v: number) => String(v),
  onKeyDown,
}: {
  run: GameRun;
  title: ReactNode;
  intro?: ReactNode;
  segments?: GameSegment[];
  rules?: ReactNode;
  hud?: ReadoutItem[];
  children?: ReactNode;
  reveal?: ReactNode;
  startLabel?: string;
  canStart?: boolean;
  startNote?: ReactNode;
  dailyToggle?: boolean;
  fmtScore?: (v: number) => string;
  onKeyDown?: (e: KeyboardEvent<HTMLDivElement>) => void;
}) {
  const panel = useRef<HTMLDivElement>(null);
  const shown = useRef(run.phase);
  // A new phase takes the focus to the panel, so a keyboard reader starts at its top,
  // unless the game has already put it on something inside (a quiz round, say).
  useEffect(() => {
    if (shown.current === run.phase) return;
    shown.current = run.phase;
    const el = panel.current;
    if (el && !(el !== document.activeElement && el.contains(document.activeElement))) el.focus();
  }, [run.phase]);

  const bestLine =
    run.best === null ? "No best score for these settings yet." : `Best for these settings: ${fmtScore(run.best)}${run.better === "lower" ? " (lower is better)" : ""}.`;

  return (
    <div className={`kit-game kit-game-${run.phase}`}>
      <div className="kit-game-head">
        <h4 className="kit-game-title">{title}</h4>
        {run.phase !== "idle" && hud.length ? <Readouts items={hud} label="Score" /> : null}
      </div>
      <div ref={panel} className="kit-game-panel" tabIndex={-1} aria-label={run.phase === "idle" ? "Settings" : run.phase === "playing" ? "Game" : "Result"} onKeyDown={onKeyDown}>
        {run.phase === "idle" ? (
          <>
            {intro ? <div className="kit-game-intro">{intro}</div> : null}
            {segments.map((seg) => (
              <Segment key={seg.key} seg={seg} value={run.settings[seg.key]} onPick={(v) => run.set(seg.key, v)} />
            ))}
            <div className="kit-game-go">
              {dailyToggle ? (
                <button type="button" className="kit-game-daily" aria-pressed={run.daily} onClick={() => run.setDaily(!run.daily)}>
                  Today&apos;s seed
                </button>
              ) : null}
              <button type="button" className="kit-game-start" disabled={!canStart} onClick={run.start}>
                {startLabel}
              </button>
              {startNote ? <span className="kit-note">{startNote}</span> : null}
            </div>
            <p className="kit-note">{run.daily ? "Everyone who plays today gets the same game. " : ""}{bestLine}</p>
            {rules ? <div className="kit-game-rules">{rules}</div> : null}
          </>
        ) : null}
        {run.phase === "playing" ? children : null}
        {run.phase === "reveal" ? (
          <>
            {reveal}
            <p className="kit-game-best" aria-live="polite">
              {run.isNew ? <b>New best for these settings. </b> : null}
              {bestLine}
            </p>
            <div className="kit-game-go">
              <button type="button" className="kit-game-start" onClick={run.again}>
                {run.daily ? "Play today's game again" : "Play again"}
              </button>
              <button type="button" className="kit-btn" onClick={run.replay}>
                Change settings
              </button>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
