// Time and nerve, shared by every round: each page, word or match runs on a
// clock, a faster answer multiplies its points, and a ticker in the scoreboard
// drains to keep the pressure on. The clock is a prop (Date.now by default) so
// tests can stop time.
import { useEffect, useRef, useState } from "react";

/** Seconds per item, per round. */
export const LIMIT = { clue: 30, groups: 12, mix: 45, contexts: 25, vectors: 90 } as const;
export const SPEED_MAX = 1.5;
export const SPEED_MIN = 0.5;

/** The speed multiplier: ×1.5 for an instant answer, falling evenly to ×0.5 at the buzzer. */
export function speed(elapsedMs: number, limitS: number) {
  const f = SPEED_MAX - (SPEED_MAX - SPEED_MIN) * (elapsedMs / (limitS * 1000));
  return Math.round(Math.min(SPEED_MAX, Math.max(SPEED_MIN, f)) * 100) / 100;
}

/** Points after the speed multiplier, rounded. */
export const timed = (points: number, factor: number) => Math.round(points * factor);

/**
 * The Clue Shop's reward for a bold read: naming the page while several
 * suspects still use every flipped word pays 100 per halving left undone
 * (100 × log2 of the suspects), and naming a page that isn't the top lead
 * pays 200 more. Knowing the characters beats flipping to the last suspect.
 */
export function boldness(suspects: number, longShot: boolean) {
  return 100 * Math.round(Math.log2(Math.max(1, suspects))) + (longShot ? 200 : 0);
}

export type Countdown = { elapsed: number; left: number; fraction: number; stop: () => number };

/**
 * A countdown for the current item: restarts when `key` changes, runs while
 * `running`, and calls onTimeout once when it reaches zero. While `paused`
 * (a tutorial is on screen) the clock holds still and picks up where it
 * stopped. stop() freezes it and returns the elapsed milliseconds, for
 * scoring an answer.
 */
export function useCountdown(limitS: number, running: boolean, key: unknown, onTimeout: () => void, clock: () => number = Date.now, paused = false): Countdown {
  const begun = useRef(clock());
  const held = useRef<number | null>(paused ? clock() : null);
  const frozen = useRef<number | null>(null);
  const fired = useRef(false);
  const timeout = useRef(onTimeout);
  timeout.current = onTimeout;
  const [now, setNow] = useState(() => clock());

  useEffect(() => {
    const t = clock();
    begun.current = t;
    if (held.current !== null) held.current = t;
    frozen.current = null;
    fired.current = false;
    setNow(t);
    // A new item restarts the clock; the clock function itself never changes.
  }, [key]);

  useEffect(() => {
    const t = clock();
    if (paused && held.current === null) held.current = t;
    if (!paused && held.current !== null) {
      // Shift the start by the time spent paused, so none of it counts.
      begun.current += t - held.current;
      held.current = null;
    }
    setNow(t);
  }, [paused]);

  useEffect(() => {
    if (!running || paused) return;
    // setInterval, not requestAnimationFrame: a hidden tab or pane pauses rAF, and the clock must keep time.
    const id = setInterval(() => {
      const t = clock();
      setNow(t);
      if (!fired.current && frozen.current === null && t - begun.current >= limitS * 1000) {
        fired.current = true;
        timeout.current();
      }
    }, 100);
    return () => clearInterval(id);
  }, [running, paused, limitS, key]);

  const at = () => held.current ?? clock();
  const elapsed = frozen.current ?? Math.max(0, (held.current ?? now) - begun.current);
  const left = Math.max(0, limitS * 1000 - elapsed);
  return {
    elapsed,
    left,
    fraction: left / (limitS * 1000),
    stop: () => {
      if (frozen.current === null) frozen.current = Math.max(0, at() - begun.current);
      return frozen.current;
    },
  };
}

/** The scoreboard's ticker: seconds left over a draining bar, red and pulsing in the last quarter. */
export function Ticker({ countdown, limitS, active }: { countdown: Countdown; limitS: number; active: boolean }) {
  const secs = active ? Math.ceil(countdown.left / 1000) : limitS;
  const fraction = active ? countdown.fraction : 1;
  return (
    <span className="cr-box cr-ticker" data-urgent={active && fraction <= 0.25} aria-label={`${secs} seconds left`}>
      <small>Time</small>
      <b>{secs}s</b>
      <span className="cr-ticker-bar" aria-hidden="true">
        <span style={{ width: `${fraction * 100}%` }} />
      </span>
    </span>
  );
}

/** The scoreboard's "Playing for": what a right answer scores this instant, falling with the clock. */
export function Worth({ points, active }: { points: number; active: boolean }) {
  return (
    <span className="cr-box cr-worth-box" aria-label={active ? `Playing for ${points} points` : undefined}>
      <small>Playing for</small>
      <b>{active ? points.toLocaleString("en") : "–"}</b>
    </span>
  );
}
