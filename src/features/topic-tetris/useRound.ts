// One round's falling block, shared by both boards: which page is falling,
// where it is, how far it has fallen, the placements so far and the feedback.
// A board has `width` positions across; lane(pos) says which group a position
// drops into. The clock is a prop so tests can stop time.
import { type RefObject, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { FALL_S, POINTS, ROUND_KEYS, type TetrisPage, type TopicTetrisData, answer, feedback, placementPoints } from "./rules";

export type Note = ReturnType<typeof feedback> & { page: TetrisPage; chosen: number; points: number };
export type Placed = { page: TetrisPage; chosen: number };

const TICK_MS = 60;

export function useRound({ data, round, clock, onPoints, width, lane }: {
  data: TopicTetrisData; round: number; clock: () => number; width: number; lane: (pos: number) => number;
  onPoints: (points: number, right: boolean, fast: boolean) => void;
}) {
  const pages = data.pages;
  const home = Math.floor(width / 2);
  const [index, setIndex] = useState(0);
  const [pos, setPos] = useState(home);
  // The latest position, for a drop that arrives before the move before it has rendered.
  const posRef = useRef(home);
  const [placed, setPlaced] = useState<Placed[]>([]);
  const [note, setNote] = useState<Note | null>(null);
  const [paused, setPaused] = useState(false);
  const started = useRef(clock());
  const pausedAt = useRef<number | null>(null);
  const [now, setNow] = useState(() => clock());
  const waiting = note !== null && !note.right;
  const block = index < pages.length ? pages[index] : null;
  const fallMs = FALL_S[ROUND_KEYS[round]] * 1000;
  const running = block !== null && !waiting && !paused;

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => setNow(clock()), TICK_MS);
    return () => window.clearInterval(id);
  }, [running, clock]);

  const fraction = Math.min(1, Math.max(0, now - started.current) / fallMs);

  const next = useCallback(() => {
    started.current = clock();
    setNow(started.current);
    posRef.current = home;
    setPos(home);
    setNote(null);
    setIndex((i) => i + 1);
  }, [clock, home]);

  /** Puts the falling page in `group`, scores it and moves on (after a wrong call, once the player has read why). */
  const place = useCallback(
    (group: number) => {
      if (!block || waiting || paused) return;
      const spent = clock() - started.current;
      const right = group === answer(block, round);
      const points = placementPoints(right, spent, round);
      setPlaced((p) => [...p, { page: block, chosen: group }]);
      onPoints(points, right, right && points > POINTS.right);
      const result: Note = { ...feedback(data, block, round, group), page: block, chosen: group, points };
      if (right) next();
      setNote(result);
    },
    [block, waiting, paused, clock, round, data, onPoints, next],
  );

  const move = useCallback(
    (dx: number) => {
      if (!running) return;
      posRef.current = Math.min(width - 1, Math.max(0, posRef.current + dx));
      setPos(posRef.current);
    },
    [running, width],
  );
  const drop = useCallback(() => running && place(lane(posRef.current)), [running, place, lane]);

  // A block that reaches the floor lands where it is.
  useEffect(() => {
    if (running && fraction >= 1) place(lane(pos));
  }, [running, fraction, pos, lane, place]);

  const togglePause = useCallback(() => {
    setPaused((p) => {
      if (p) {
        // Resume where the block stopped: shift the start by the time spent paused.
        started.current += clock() - (pausedAt.current ?? clock());
        setNow(clock());
      } else pausedAt.current = clock();
      return !p;
    });
  }, [clock]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const onControl = e.target instanceof HTMLElement && e.target.closest("button, input, a, select, textarea");
      if (e.key === "ArrowLeft" || e.key === "a") {
        e.preventDefault();
        move(-1);
      } else if (e.key === "ArrowRight" || e.key === "d") {
        e.preventDefault();
        move(1);
      } else if (e.key === "ArrowDown" || ((e.key === " " || e.key === "Enter") && !onControl)) {
        e.preventDefault();
        if (waiting) next();
        else drop();
      } else if ((e.key === "p" || e.key === "Escape") && block && !waiting) togglePause();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [waiting, block, move, drop, next, togglePause]);

  return {
    block, index, pos, placed, note, paused, waiting, running, fraction,
    done: block === null && !waiting,
    queue: (n: number) => pages.slice(index + 1, index + 1 + n),
    move, drop, place, next, togglePause,
  };
}

/**
 * Round 3's link lines: from the falling block to the placed pages it links
 * to, in `board`'s coordinates. `tile(id)` finds a placed page's element.
 */
export function useWires(board: RefObject<HTMLElement | null>, block: RefObject<HTMLElement | null>, partners: string[], data: TopicTetrisData, selector: string) {
  const [wires, setWires] = useState<number[][]>([]);
  useLayoutEffect(() => {
    const el = board.current;
    const b = block.current;
    const out: number[][] = [];
    if (el && b) {
      const o = el.getBoundingClientRect();
      const from = b.getBoundingClientRect();
      for (const name of partners) {
        const id = data.pages.find((p) => p.name === name)?.id;
        const tile = id ? el.querySelector(`${selector} [data-flip="${id}"]`) : null;
        if (!tile) continue;
        const to = tile.getBoundingClientRect();
        out.push([from.left + from.width / 2 - o.left, from.bottom - o.top, to.left + to.width / 2 - o.left, to.top + to.height / 2 - o.top]);
      }
    }
    if (JSON.stringify(out) !== JSON.stringify(wires)) setWires(out);
  });
  return wires;
}
