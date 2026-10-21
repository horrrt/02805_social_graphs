// Topic Tetris, stack edition: the same game on a classic board. Page tiles
// fall down a dark grid nine cells wide; each third of the well drops into one
// group, and placed tiles stack at the bottom of their group's third. The
// groups sit beside the well with their evidence, the next pages and the
// controls on the other side. Rounds, data, scoring and feedback are the
// first edition's (rules.ts, useRound.ts); only the board differs.
import { type CSSProperties, type PointerEvent, useCallback, useEffect, useRef, useState } from "react";
import { Face } from "@/kit/Portrait";
import { ScoreBox } from "@/features/cold-read/LevelParts";
import { reducedMotion, useFlip } from "./flip";
import { Clue, Real } from "./TopicTetrisGame";
import { useRound, useWires } from "./useRound";
import {
  POINTS, QUIZ, ROUND, ROUND_KEYS, type Tally, type TetrisPage, type TopicTetrisData,
  answer, label, letter, linksFrom, movers, short, tallyPoints, EMPTY_TALLY,
} from "./rules";

type Stage =
  | { kind: "intro" }
  | { kind: "play"; round: number }
  | { kind: "done"; round: number }
  | { kind: "shift"; round: number }
  | { kind: "maps" }
  | { kind: "end" };

/** Cells across, cells per group, and rows. */
export const COLS = 9;
const LANE = 3;
const ROWS = 10;
const laneOf = (col: number) => Math.floor(col / LANE);

/** Where the i-th of a handful of tiles sits in a loose pile: [left %, top %, tilt in degrees]. */
const scatter = (i: number): CSSProperties => ({
  left: `${12 + ((i * 37) % 64)}%`,
  top: `${4 + ((i * 23) % 66)}%`,
  rotate: `${((i * 7) % 24) - 12}deg`,
});

/** The intro's falling cascade: [left %, top %, tilt in degrees] per tile, then faint empty cells. */
const CASCADE: [number, number, number][] = [
  [30, 0, -8], [52, 6, 10], [12, 26, -4], [40, 28, 6], [64, 22, -10],
  [22, 54, 8], [50, 52, -6], [74, 46, 4], [36, 76, -10],
];
const GHOSTS: [number, number][] = [[6, 4], [82, 8], [4, 70], [86, 74], [62, 82], [18, 88]];

/** A page as a square tile: its portrait on its group's colour (or plain, with no group). */
function Cell({ page, group, size, missed, hot, still }: {
  page: TetrisPage | string; group?: number; size?: "s" | "m" | "l"; missed?: string; hot?: boolean; still?: boolean;
}) {
  const name = typeof page === "string" ? page : page.name;
  return (
    <span
      className="ts-cell"
      data-group={group}
      data-size={size}
      data-flip={typeof page === "string" || still ? undefined : page.id}
      data-missed={missed}
      data-hot={hot || undefined}
      title={short(name)}
    >
      <Face name={name} />
    </span>
  );
}

function Crumb({ score }: { score?: number }) {
  return (
    <div className="ts-crumb">
      <span>
        Week 7 <i aria-hidden="true">·</i> Topic Tetris
      </span>
      {score !== undefined ? (
        <span className="ts-score">
          <span aria-hidden="true">★</span> <ScoreBox points={score} />
        </span>
      ) : null}
    </div>
  );
}

function Intro({ data, onStart }: { data: TopicTetrisData; onStart: () => void }) {
  return (
    <section className="ts-card ts-intro" aria-labelledby="ts-title">
      <div>
        <Crumb />
        <h2 id="ts-title">Topic Tetris</h2>
        <p className="ts-lead">Can you group the same documents three different ways?</p>
        <p>The documents look similar or different depending on how we represent them.</p>
        <p>Words. Meaning. Connections.</p>
        <button type="button" className="ts-go" onClick={onStart}>
          Start game <span aria-hidden="true">→</span>
        </button>
        <p className="ts-note">A simplified model of three ways to group the same corpus.</p>
      </div>
      <div className="ts-intro-art" aria-hidden="true">
        {GHOSTS.map(([x, y]) => (
          <i key={`${x}-${y}`} style={{ left: `${x}%`, top: `${y}%` }} />
        ))}
        {data.pages.slice(0, CASCADE.length).map((p, i) => (
          <span key={p.id} style={{ left: `${CASCADE[i][0]}%`, top: `${CASCADE[i][1]}%`, rotate: `${CASCADE[i][2]}deg`, animationDelay: `${i * 80}ms` }}>
            <Cell page={p} group={answer(p, i % 3)} size="l" />
          </span>
        ))}
      </div>
    </section>
  );
}

/** A group beside the well: its name, the round's evidence for it and the pages placed in it. */
function GroupCard({ data, round, group, block, active, tiles, onDrop }: {
  data: TopicTetrisData; round: number; group: number; block: TetrisPage | null; active: boolean;
  tiles: { page: TetrisPage; missed?: string }[]; onDrop?: () => void;
}) {
  const g = data.rounds[round].groups[group];
  const name = `${ROUND[ROUND_KEYS[round]].group} ${g.letter}`;
  let evidence;
  if ("words" in g) {
    const mine = new Set(block?.words.chips.map(([w]) => w));
    evidence = (
      <ul className="ts-words">
        {g.words.map((w) => (
          <li key={w} data-match={active && mine.has(w) ? true : undefined}>
            {w}
          </li>
        ))}
      </ul>
    );
  } else {
    const faces = "anchors" in g ? g.anchors : g.hubs;
    const mine = new Set("anchors" in g ? block?.meaning.near.map(([n]) => n) : []);
    evidence = (
      <ul className="ts-faces">
        {faces.map((n) => (
          <li key={n} data-match={active && mine.has(n) ? true : undefined} title={n}>
            <span className="ts-face">
              <Face name={n} />
            </span>
            {label(data, n)}
          </li>
        ))}
        {"hubs" in g && block ? <li className="ts-links">{linksFrom(block.connections.links[group], block)}</li> : null}
      </ul>
    );
  }
  return (
    <section className="ts-group" data-group={group} data-active={active || undefined} aria-label={name}>
      <button type="button" className="ts-group-head" onClick={onDrop} disabled={!onDrop} aria-label={`Drop into ${name}`}>
        <span className="ts-tag">{name}</span>
        {evidence}
      </button>
      <div className="ts-group-tiles" aria-label={`Pages in ${name}`}>
        {tiles.map(({ page }) => (
          <Cell key={page.id} page={page} group={group} />
        ))}
      </div>
    </section>
  );
}

/** One round on the stacking board. */
function Round({ data, round, clock, score, onPoints, onDone }: {
  data: TopicTetrisData; round: number; clock: () => number; score: number;
  onPoints: (points: number, right: boolean, fast: boolean) => void; onDone: () => void;
}) {
  const r = useRound({ data, round, clock, onPoints, width: COLS, lane: laneOf });
  const { block, pos, placed, note, paused, waiting, running, fraction, done } = r;
  const key = ROUND_KEYS[round];
  const board = useRef<HTMLDivElement>(null);
  const tileEl = useRef<HTMLSpanElement>(null);
  const partners = key === "connections" && block && !waiting ? block.connections.partners : [];
  const wires = useWires(board, tileEl, partners, data, ".ts-well");

  // Each group's placed pages stack in its third of the well, three to a row, from the bottom.
  const stacks = [0, 1, 2].map((g) => placed.filter(({ page }) => answer(page, round) === g));
  const height = (col: number) => {
    const n = stacks[laneOf(col)].length;
    const k = col % LANE;
    return Math.floor(n / LANE) + (k < n % LANE ? 1 : 0);
  };
  const land = ROWS - 1 - height(pos);

  // Swipe on the well: sideways moves, down drops.
  const start = useRef<{ x: number; y: number } | null>(null);
  const onDown = (e: PointerEvent) => (start.current = { x: e.clientX, y: e.clientY });
  const onUp = (e: PointerEvent) => {
    const s = start.current;
    start.current = null;
    if (!s) return;
    const dx = e.clientX - s.x;
    const dy = e.clientY - s.y;
    if (Math.abs(dx) > 30 && Math.abs(dx) > Math.abs(dy)) r.move(Math.sign(dx) * Math.max(1, Math.round(Math.abs(dx) / 40)));
    else if (dy > 40) r.drop();
  };

  return (
    <section className="ts-card ts-round" aria-label={`Round ${round + 1}: ${ROUND[key].title}`}>
      <Crumb score={score} />
      <h2>
        Round {round + 1} — {ROUND[key].title}
      </h2>
      <p className="ts-sub">
        {ROUND[key].ask} <span className="ts-rep">Representation: {ROUND[key].representation}</span>
      </p>
      <div className="ts-play">
        <aside className="ts-left">
          {block && !waiting ? (
            <div className="ts-box ts-now" aria-live="polite">
              <h3>Falling</h3>
              <p className="ts-now-name">
                <Cell page={block} size="s" /> <b>{short(block.name)}</b>
              </p>
              <small>{ROUND[key].clue}</small>
              <Clue data={data} page={block} round={round} />
            </div>
          ) : null}
          <div className="ts-box">
            <h3>Next</h3>
            <div className="ts-next">
              {r.queue(3).map((p) => (
                <Cell key={p.id} page={p} size="s" />
              ))}
              {r.queue(3).length === 0 ? <small>Last page</small> : null}
            </div>
          </div>
          <div className="ts-box ts-controls" aria-label="Controls">
            <h3>Controls</h3>
            <div>
              <button type="button" onClick={() => r.move(-1)} disabled={!running} aria-label="Move left">
                ←
              </button>
              <button type="button" onClick={() => r.move(1)} disabled={!running} aria-label="Move right">
                →
              </button>
              <small>Move left / right</small>
            </div>
            <div>
              <button type="button" onClick={r.drop} disabled={!running} aria-label="Drop">
                ↓
              </button>
              <small>Drop</small>
            </div>
            <div>
              <button type="button" onClick={r.togglePause} disabled={!block || waiting} aria-pressed={paused} aria-label="Pause">
                ❚❚
              </button>
              <small>{paused ? "Resume" : "Pause"}</small>
            </div>
          </div>
        </aside>
        <div className="ts-center" ref={board}>
          <div
            className="ts-well"
            style={{ "--cols": COLS, "--rows": ROWS } as CSSProperties}
            data-paused={paused || undefined}
            onPointerDown={onDown}
            onPointerUp={onUp}
          >
            {[0, 1, 2].map((g) => (
              <div
                key={g}
                className="ts-lane"
                data-group={g}
                data-active={running && laneOf(pos) === g ? true : undefined}
                onClick={running ? () => r.place(g) : undefined}
              >
                <span>{letter(data, round, g)}</span>
              </div>
            ))}
            {stacks.flatMap((list, g) =>
              list.map(({ page, chosen }, k) => (
                <span
                  key={page.id}
                  className="ts-slot"
                  style={{ "--x": g * LANE + (k % LANE), "--row": ROWS - 1 - Math.floor(k / LANE) } as CSSProperties}
                >
                  <Cell page={page} group={g} missed={chosen !== g ? `you: ${letter(data, round, chosen)}` : undefined} />
                </span>
              )),
            )}
            {block && !waiting ? (
              <>
                <span className="ts-ghost" style={{ "--x": pos, "--from": fraction * land, "--to": land } as CSSProperties} />
                <span
                  ref={tileEl}
                  className="ts-slot ts-falling"
                  style={{ "--x": pos, "--row": fraction * land } as CSSProperties}
                  aria-label={`Falling page: ${block.name}, over ${ROUND[key].group} ${letter(data, round, laneOf(pos))}`}
                >
                  <Cell page={block} />
                </span>
              </>
            ) : null}
            {wires.length ? (
              <svg className="ts-wires" aria-hidden="true">
                {wires.map(([x1, y1, x2, y2], i) => (
                  <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} />
                ))}
              </svg>
            ) : null}
            {paused ? <p className="ts-paused">Paused</p> : null}
          </div>
          <div className="ts-feedback" role="status" data-right={note ? String(note.right) : undefined}>
            {note ? (
              <>
                <p>
                  <b>{note.title}</b> <span className="ts-pts">{note.points > 0 ? `+${note.points}` : note.points}</span>
                </p>
                {note.lines.map((line) => (
                  <p key={line}>{line}</p>
                ))}
                {waiting ? (
                  <button type="button" className="ts-go ts-go-small" onClick={r.next}>
                    Got it
                  </button>
                ) : null}
              </>
            ) : (
              <p className="ts-hint">Each third of the well is one group. Read the falling page, then steer it.</p>
            )}
          </div>
          {done ? (
            <button type="button" className="ts-go" onClick={onDone} autoFocus>
              See the round <span aria-hidden="true">→</span>
            </button>
          ) : null}
        </div>
        <aside className="ts-right">
          <h3>Groups</h3>
          {[0, 1, 2].map((g) => (
            <GroupCard
              key={g}
              data={data}
              round={round}
              group={g}
              block={waiting ? null : block}
              active={running && laneOf(pos) === g}
              tiles={stacks[g]}
              onDrop={running ? () => r.place(g) : undefined}
            />
          ))}
        </aside>
      </div>
    </section>
  );
}

/** Pixel squares scattered over the dark round screen. */
const PIXELS = [[6, 12], [8, 18], [10, 22], [86, 8], [92, 64], [4, 70], [70, 90], [96, 30]];

function RoundDone({ data, round, tally, score, onNext }: { data: TopicTetrisData; round: number; tally: Tally; score: number; onNext: () => void }) {
  const r = ROUND[ROUND_KEYS[round]];
  const moved = movers(data, round);
  return (
    <section className="ts-dark" aria-labelledby="ts-done-title">
      {PIXELS.map(([x, y], i) => (
        <i key={i} className="ts-pixel" style={{ left: `${x}%`, top: `${y}%` }} aria-hidden="true" />
      ))}
      <Crumb />
      <div className="ts-dark-body">
        <div className="ts-dark-copy">
          <h2 id="ts-done-title">
            <span className="ts-check" aria-hidden="true">
              <svg viewBox="0 0 16 16">
                <path d="M3.5 8.5l3 3 6-7" />
              </svg>
            </span> Round {round + 1} complete!
          </h2>
          <p className="ts-lead">{r.done}</p>
          <p>{r.lesson}</p>
          {moved.length ? (
            <p className="ts-moved">
              Changed group since the last round: {moved.map((p) => short(p.name)).join(", ")}.
            </p>
          ) : null}
        </div>
        <aside className="ts-tally">
          <p className="ts-tally-score">
            <span aria-hidden="true">★</span> Score: {score.toLocaleString("en")}
          </p>
          <dl>
            <dt>Correct placements</dt>
            <dd>+{tally.right * POINTS.right}</dd>
            <dt>Fast placements</dt>
            <dd>+{tally.fast * POINTS.fast}</dd>
            {tally.wrong ? (
              <>
                <dt>Not quite</dt>
                <dd>{-tally.lost}</dd>
              </>
            ) : null}
            <dt>Round bonus</dt>
            <dd>+{POINTS.round}</dd>
          </dl>
          <p className="ts-tally-round">This round {tallyPoints(tally).toLocaleString("en")}</p>
          <button type="button" className="ts-go ts-go-light" onClick={onNext} autoFocus>
            {round < 2 ? "Next round" : "See the three maps"} <span aria-hidden="true">→</span>
          </button>
        </aside>
      </div>
    </section>
  );
}

/** Between rounds: the stacked pages come loose into one unsorted pile. */
function Shift({ data, round, onGo }: { data: TopicTetrisData; round: number; onGo: () => void }) {
  const root = useRef<HTMLDivElement>(null);
  const [loose, setLoose] = useState(false);
  useFlip(root, loose, 800);
  useEffect(() => {
    if (reducedMotion()) return setLoose(true);
    const id = window.setTimeout(() => setLoose(true), 600);
    return () => window.clearTimeout(id);
  }, []);
  const before = ROUND_KEYS[round - 1];
  const stacked = [0, 1, 2].flatMap((g) => data.pages.filter((p) => answer(p, round - 1) === g));
  return (
    <section className="ts-card ts-shift" aria-labelledby="ts-shift-title">
      <Crumb />
      <div className="ts-shift-body">
        <div>
          <h2 id="ts-shift-title">
            Same documents.
            <br />
            Different representation.
          </h2>
          <p>
            You just grouped the documents by {ROUND[before].representation}. They haven’t changed, but now we compare them by{" "}
            <b>{ROUND[ROUND_KEYS[round]].representation}</b>.
          </p>
        </div>
        <div className="ts-shift-art" ref={root}>
          <div className="ts-shift-from" data-loose={loose || undefined} aria-label={`Grouped by ${ROUND[before].representation}`}>
            {stacked.map((p) => (
              <Cell key={p.id} page={p} group={answer(p, round - 1)} size="s" still={loose} />
            ))}
          </div>
          <span className="ts-arrow" aria-hidden="true">
            →
          </span>
          <figure className="ts-shift-to">
            <div className="ts-scatter">
              {loose ? data.pages.map((p, i) => <span key={p.id} style={scatter(i)}><Cell page={p} size="s" /></span>) : null}
            </div>
            <figcaption>
              Same documents,
              <br />
              not yet regrouped.
            </figcaption>
          </figure>
        </div>
      </div>
      <div className="ts-actions">
        <button type="button" className="ts-go" onClick={onGo} autoFocus>
          Continue to round {round + 1} <span aria-hidden="true">→</span>
        </button>
      </div>
    </section>
  );
}

/** The three groupings side by side, one moving page at a time picked out in all three. */
function Maps({ data, onNext }: { data: TopicTetrisData; onNext: () => void }) {
  const moving = data.pages.filter((p) => new Set([0, 1, 2].map((r) => letter(data, r, answer(p, r)))).size > 1);
  const [spot, setSpot] = useState(0);
  const [auto, setAuto] = useState(() => !reducedMotion());
  useEffect(() => {
    if (!auto || moving.length === 0) return;
    const id = window.setInterval(() => setSpot((s) => (s + 1) % moving.length), 1800);
    return () => window.clearInterval(id);
  }, [auto, moving.length]);
  const hot = moving[spot]?.id;
  return (
    <section className="ts-card ts-maps" aria-labelledby="ts-maps-title">
      <Crumb />
      <h2 id="ts-maps-title">Same corpus. Three different maps.</h2>
      <p className="ts-sub">
        The documents never changed.
        <br />
        The representation did.
      </p>
      <div className="ts-map-row">
        {ROUND_KEYS.map((k, r) => (
          <figure key={k} className="ts-map">
            <figcaption>{ROUND[k].title}</figcaption>
            <div className="ts-map-groups">
              {data.rounds[r].groups.map((g, i) => (
                <div key={g.letter} className="ts-map-group" data-group={i}>
                  <span className="ts-tag">
                    {ROUND[k].group} {g.letter}
                  </span>
                  <div>
                    {data.pages
                      .filter((p) => answer(p, r) === i)
                      .map((p) => (
                        <Cell key={p.id} page={p} group={i} hot={p.id === hot} />
                      ))}
                  </div>
                </div>
              ))}
            </div>
          </figure>
        ))}
      </div>
      <div className="ts-dots" role="group" aria-label="Follow one page">
        {moving.map((p, i) => (
          <button
            key={p.id}
            type="button"
            aria-pressed={i === spot}
            aria-label={`Follow ${short(p.name)}`}
            onClick={() => {
              setAuto(false);
              setSpot(i);
            }}
          />
        ))}
      </div>
      <p className="ts-follow">{moving[spot] ? `${short(moving[spot].name)}: ${[0, 1, 2].map((r) => letter(data, r, answer(moving[spot], r))).join(" → ")}` : null}</p>
      <p className="ts-takeaway">
        <b>There is no single “correct” grouping.</b>
        <br />
        That’s why representation matters.
      </p>
      <div className="ts-actions">
        <button type="button" className="ts-go" onClick={onNext}>
          Next <span aria-hidden="true">→</span>
        </button>
      </div>
    </section>
  );
}

/** The check and the result side by side. */
function End({ data, score, tallies, home, onAgain }: { data: TopicTetrisData; score: number; tallies: Tally[]; home: string; onAgain: () => void }) {
  const [pick, setPick] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  return (
    <section className="ts-end">
      <div className="ts-card ts-quiz">
        <Crumb />
        <h3 className="ts-quiz-head">
          <span aria-hidden="true">⬡</span> Quick check
        </h3>
        <fieldset disabled={checked}>
          <legend>{QUIZ.question}</legend>
          {QUIZ.options.map((o, i) => (
            <label key={o} data-picked={pick === i || undefined} data-answer={checked && i === QUIZ.answer ? true : undefined}>
              <input type="radio" name="ts-quiz" checked={pick === i} onChange={() => setPick(i)} />
              {"ABCD"[i]}. {o}
            </label>
          ))}
        </fieldset>
        {checked ? (
          <p className="ts-quiz-result" role="status" data-right={String(pick === QUIZ.answer)}>
            <b>{pick === QUIZ.answer ? "Yes: B, the representation." : "Not quite: it was B, the representation."}</b> {QUIZ.explain}
          </p>
        ) : (
          <button type="button" className="ts-go" onClick={() => setChecked(true)} disabled={pick === null}>
            Check answer
          </button>
        )}
        {checked ? (
          <>
            <h2 className="ts-end-title">
              Same corpus.
              <br />
              Different maps.
            </h2>
            <p>The documents never changed. The representation did.</p>
            <p>
              <b>Words → Meaning → Connections.</b> That’s why representation matters when we analyse a corpus.
            </p>
            <Real data={data} />
          </>
        ) : null}
      </div>
      <aside className="ts-card ts-trophy">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M7 4h10v4a5 5 0 0 1-10 0zM7 6H4a3 3 0 0 0 3 3M17 6h3a3 3 0 0 1-3 3M12 13v4M8 20h8M9 17h6v3H9z" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
        </svg>
        <p className="ts-trophy-title">Topic Tetris</p>
        <p className="ts-trophy-score">Score: {score.toLocaleString("en")}</p>
        <ul>
          {ROUND_KEYS.map((k, r) => (
            <li key={k}>
              <span>
                {"ABC"[r]}. {ROUND[k].title}
              </span>
              <small>
                {tallies[r].right} of {data.pages.length}
              </small>
              <b aria-label="done">✓</b>
            </li>
          ))}
        </ul>
        <p>You discovered 3 different ways to organise the same corpus.</p>
        <button type="button" className="ts-go" onClick={onAgain}>
          Play again
        </button>
        <a className="ts-back" href={home}>
          Back to Log-Log Legends
        </a>
      </aside>
    </section>
  );
}

export function StackGame({ data, clock = Date.now, home = "../../../" }: { data: TopicTetrisData; clock?: () => number; home?: string }) {
  const [stage, setStage] = useState<Stage>({ kind: "intro" });
  const [tallies, setTallies] = useState<Tally[]>([EMPTY_TALLY, EMPTY_TALLY, EMPTY_TALLY]);
  const [score, setScoreState] = useState(0);
  // The score as of the last event, so a wrong call knows how much the floor at zero lets it take off.
  const scoreRef = useRef(0);
  const setScore = (n: number) => {
    scoreRef.current = n;
    setScoreState(n);
  };
  const round = stage.kind === "play" || stage.kind === "done" || stage.kind === "shift" ? stage.round : 0;

  const onPoints = useCallback(
    (points: number, right: boolean, fast: boolean) => {
      const before = scoreRef.current;
      const after = Math.max(0, before + points);
      scoreRef.current = after;
      setScoreState(after);
      setTallies((all) =>
        all.map((t, r) =>
          r === round ? { right: t.right + Number(right), fast: t.fast + Number(fast), wrong: t.wrong + Number(!right), lost: t.lost + Math.max(0, before - after) } : t,
        ),
      );
    },
    [round],
  );
  const play = (r: number) => {
    setTallies((all) => all.map((t, i) => (i === r ? EMPTY_TALLY : t)));
    setStage({ kind: "play", round: r });
  };

  switch (stage.kind) {
    case "intro":
      return <Intro data={data} onStart={() => play(0)} />;
    case "play":
      return (
        <Round
          key={stage.round}
          data={data}
          round={stage.round}
          clock={clock}
          score={score}
          onPoints={onPoints}
          onDone={() => {
            setScore(scoreRef.current + POINTS.round);
            setStage({ kind: "done", round: stage.round });
          }}
        />
      );
    case "done":
      return (
        <RoundDone
          data={data}
          round={stage.round}
          tally={tallies[stage.round]}
          score={score}
          onNext={() => setStage(stage.round < 2 ? { kind: "shift", round: stage.round + 1 } : { kind: "maps" })}
        />
      );
    case "shift":
      return <Shift data={data} round={stage.round} onGo={() => play(stage.round)} />;
    case "maps":
      return <Maps data={data} onNext={() => setStage({ kind: "end" })} />;
    case "end":
      return (
        <End
          data={data}
          score={score}
          tallies={tallies}
          home={home}
          onAgain={() => {
            setScore(0);
            play(0);
          }}
        />
      );
  }
}
