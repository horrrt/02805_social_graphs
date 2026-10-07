// A process the reader steps through: Step, Play/Pause, Reset, any extra
// actions, and a speed slider, around whatever render(state) draws. The state
// comes from init() and each step(state, rng); the rng is mulberry32(seed),
// rebuilt on Reset, so a seed replays the same run. Space plays or pauses
// and → steps while focus is inside the player (not on one of its controls,
// which keep their own keys). Play pauses itself when done(state) turns true
// or the player leaves the screen; under reduced motion it runs no faster
// than two steps a second. Style: .kit-player in post.css.
import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { mulberry32 } from "./graph-core";
import { useOnScreen, useReducedMotion } from "./network/motion";

export type Rng = () => number;
export type StepAction<S> = { label: string; run: (s: S, rng: Rng) => S };

export type StepperOptions<S> = {
  init: () => S;
  step: (s: S, rng: Rng) => S;
  done?: (s: S) => boolean;
  seed: number;
  speedMs?: number;
};

export type Stepper<S> = {
  state: S;
  /** Steps and extra actions taken since the last reset. */
  steps: number;
  playing: boolean;
  done: boolean;
  /** Steps per second, as the raw string the slider holds. */
  speed: string;
  setSpeed: (v: string) => void;
  stepOnce: () => void;
  play: () => void;
  pause: () => void;
  toggle: () => void;
  reset: () => void;
  run: (fn: (s: S, rng: Rng) => S) => void;
};

const MIN_REDUCED_MS = 500;

/**
 * The stepping state without the controls: const p = useStepper({ init, step, seed }).
 * A step runs in an event or a timer, never in render, so StrictMode never
 * draws from the rng twice.
 */
export function useStepper<S>({ init, step, done, seed, speedMs = 400 }: StepperOptions<S>): Stepper<S> {
  const [state, setState] = useState<S>(init);
  const [steps, setSteps] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(String(Math.max(1, Math.round(1000 / speedMs))));
  const rng = useRef<Rng | null>(null);
  const now = useRef({ state, init, step, done, seed });
  useLayoutEffect(() => {
    now.current = { state, init, step, done, seed };
  });
  const isDone = done ? done(state) : false;

  const stepOnce = useCallback(() => {
    const { state: s, step: f, done: d, seed: sd } = now.current;
    if (d?.(s)) return;
    rng.current ??= mulberry32(sd);
    const next = f(s, rng.current);
    now.current.state = next;
    setState(next);
    setSteps((n) => n + 1);
  }, []);
  const reset = useCallback(() => {
    rng.current = mulberry32(now.current.seed);
    const s = now.current.init();
    now.current.state = s;
    setState(s);
    setSteps(0);
    setPlaying(false);
  }, []);
  const run = useCallback((fn: (s: S, rng: Rng) => S) => {
    rng.current ??= mulberry32(now.current.seed);
    const next = fn(now.current.state, rng.current);
    now.current.state = next;
    setState(next);
    setSteps((n) => n + 1);
  }, []);
  // A new seed starts the run again (a StrictMode remount keeps the seed, so it does not).
  const lastSeed = useRef(seed);
  useEffect(() => {
    if (lastSeed.current === seed) return;
    lastSeed.current = seed;
    reset();
  }, [seed, reset]);

  const reduced = useReducedMotion();
  const perSecond = Math.max(0.5, Number(speed) || 1);
  const delay = Math.max(reduced ? MIN_REDUCED_MS : 0, 1000 / perSecond);
  useEffect(() => {
    if (!playing) return;
    if (isDone) {
      setPlaying(false);
      return;
    }
    const timer = setTimeout(stepOnce, delay);
    return () => clearTimeout(timer);
  }, [playing, isDone, delay, state, stepOnce]);

  return {
    state,
    steps,
    playing,
    done: isDone,
    speed,
    setSpeed,
    stepOnce,
    play: () => setPlaying(true),
    pause: () => setPlaying(false),
    toggle: () => setPlaying((p) => !p),
    reset,
    run,
  };
}

const CONTROL = "button, input, select, textarea, a, [role='button']";

/** <StepPlayer init={() => baInit(2)} step={(s, rng) => baStep(s, rng)} seed={7} render={(s) => <NetCanvas … />} /> */
export default function StepPlayer<S>({
  init,
  step,
  done,
  extraActions,
  speedMs,
  seed,
  render,
  label = "Simulation",
}: StepperOptions<S> & { extraActions?: StepAction<S>[]; render: (s: S, info: { steps: number; playing: boolean }) => ReactNode; label?: string }) {
  const p = useStepper({ init, step, done, seed, speedMs });
  const id = useId();
  const box = useRef<HTMLDivElement>(null);
  const onScreen = useOnScreen(box);
  const { playing, pause } = p;
  useEffect(() => {
    if (!onScreen && playing) pause();
  }, [onScreen, playing, pause]);

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if ((e.target as Element).closest(CONTROL)) return;
    if (e.key === " ") {
      e.preventDefault();
      if (!p.done) p.toggle();
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      if (!p.playing) p.stepOnce();
    }
  };

  return (
    <div className="kit-player" ref={box} role="group" aria-label={label} tabIndex={0} onKeyDown={onKeyDown}>
      <div className="kit-controls">
        <button type="button" onClick={p.stepOnce} disabled={p.done || p.playing}>
          Step
        </button>
        <button type="button" aria-pressed={p.playing} onClick={p.toggle} disabled={p.done && !p.playing}>
          {p.playing ? "Pause" : "Play"}
        </button>
        <button type="button" onClick={p.reset}>
          Reset
        </button>
        {extraActions?.map((a) => (
          <button key={a.label} type="button" onClick={() => p.run(a.run)} disabled={p.playing}>
            {a.label}
          </button>
        ))}
        <label htmlFor={id}>Speed</label>
        <input id={id} type="range" min={1} max={20} step={1} value={p.speed} onChange={(e) => p.setSpeed(e.target.value)} />
        <output htmlFor={id}>{p.speed}/s</output>
        {/* Announced only while nothing plays, so Play does not read out every step. */}
        <span className="kit-note" aria-live={p.playing ? "off" : "polite"}>
          {p.done ? `Done after ${p.steps} ${p.steps === 1 ? "move" : "moves"}.` : `${p.steps} ${p.steps === 1 ? "move" : "moves"}`}
        </span>
      </div>
      {render(p.state, { steps: p.steps, playing: p.playing })}
    </div>
  );
}
