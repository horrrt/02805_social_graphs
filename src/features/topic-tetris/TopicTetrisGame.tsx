// Topic Tetris, the game: nine Marvel pages fall three times, and each round
// the player steers every page into one of three groups. The blocks and the
// groups carry the round's evidence (words, nearest pages in meaning, links),
// so every call can be read off the board. Between rounds the placed pages
// lift out of their groups back into one pile; at the end they move between
// the three groupings on one board. Takes the data as a prop, and the clock,
// so tests can stop time.
import { type CSSProperties, type ReactNode, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { SegmentedControl } from "@/components/post/SegmentedControl";
import { Face } from "@/kit/Portrait";
import { Rules, StartRow } from "@/features/cold-read/StartPanel";
import { ScoreBox, Stat } from "@/features/cold-read/LevelParts";
import { reducedMotion, useFlip } from "./flip";
import {
  FALL_S, POINTS, QUIZ, ROUND, ROUND_KEYS, type RoundKey, type Tally, type TetrisPage, type TopicTetrisData,
  answer, feedback, label, letter, movers, placementPoints, short, tallyPoints,
} from "./rules";

type Stage =
  | { kind: "intro" }
  | { kind: "play"; round: number }
  | { kind: "done"; round: number }
  | { kind: "shift"; round: number }
  | { kind: "map" }
  | { kind: "quiz" }
  | { kind: "end" };

type Note = ReturnType<typeof feedback> & { page: TetrisPage; chosen: number; points: number };

const EMPTY: Tally = { right: 0, fast: 0, wrong: 0 };
const TICK_MS = 60;

/** A page's face in Cold Read's round frame. */
function Avatar({ name, size = "m" }: { name: string; size?: "xs" | "s" | "m" | "l" }) {
  return (
    <span className="cr-face tt-face" data-size={size} aria-hidden="true">
      <Face name={name} />
    </span>
  );
}

/** A placed page: face and name, flagged when the player first put it elsewhere. */
function Tile({ page, missed, moved }: { page: TetrisPage; missed?: string; moved?: boolean }) {
  return (
    <li className="tt-tile" data-flip={page.id} data-missed={missed} data-moved={moved || undefined}>
      <Avatar name={page.name} size="xs" />
      <span>{short(page.name)}</span>
    </li>
  );
}

export function Intro() {
  return (
    <div className="tt-intro-copy">
      <p className="tt-kicker">Week 7 · a simplified model</p>
      <h2>Can you group the same pages three different ways?</h2>
      <p>The pages look similar or different depending on how we represent them.</p>
      <p className="tt-triad">
        <b>Words.</b> <b>Meaning.</b> <b>Connections.</b>
      </p>
    </div>
  );
}

/** The decorative stack of faces beside the intro. */
function IntroArt({ data }: { data: TopicTetrisData }) {
  return (
    <ul className="tt-intro-art" aria-hidden="true">
      {data.pages.map((p, i) => (
        <li key={p.id} style={{ "--i": i } as CSSProperties} data-group={answer(p, 0)}>
          <Avatar name={p.name} size="s" />
        </li>
      ))}
    </ul>
  );
}

/** The evidence on a falling block, in the round's own representation. */
function Clue({ data, page, round }: { data: TopicTetrisData; page: TetrisPage; round: number }) {
  const key = ROUND_KEYS[round];
  if (key === "words")
    return (
      <ul className="tt-chips" aria-label={ROUND.words.clue}>
        {page.words.chips.map(([w, n]) => (
          <li key={w}>
            {w} <small>×{n}</small>
          </li>
        ))}
      </ul>
    );
  if (key === "meaning")
    return (
      <ul className="tt-near" aria-label={ROUND.meaning.clue}>
        {page.meaning.near.map(([name, cos]) => (
          <li key={name}>
            <Avatar name={name} size="xs" />
            <span title={name}>{label(data, name)}</span>
            <small>{cos.toFixed(2)}</small>
          </li>
        ))}
      </ul>
    );
  const { links, elsewhere, partners } = page.connections;
  return (
    <div className="tt-links">
      <ul aria-label="Links into each group">
        {links.map((n, g) => (
          <li key={g}>
            <b>{letter(data, round, g)}</b>
            <span className="tt-bar" style={{ "--w": n / Math.max(...links) } as CSSProperties} />
            <small>{n}</small>
          </li>
        ))}
      </ul>
      <p>
        {elsewhere} more elsewhere{partners.length ? ` · links to ${partners.map(short).join(", ")}` : ""}
      </p>
    </div>
  );
}

/** One group at the foot of the well: its name, its evidence and the pages placed in it. */
function Bin({ data, round, group, block, placed, onDrop, active }: {
  data: TopicTetrisData; round: number; group: number; block: TetrisPage | null; placed: { page: TetrisPage; missed?: string }[];
  onDrop?: () => void; active: boolean;
}) {
  const key = ROUND_KEYS[round];
  const g = data.rounds[round].groups[group];
  const name = `${ROUND[key].group} ${g.letter}`;
  let body: ReactNode;
  if ("words" in g) {
    const mine = new Set(block?.words.chips.map(([w]) => w));
    body = (
      <ul className="tt-bin-words">
        {g.words.map((w) => (
          <li key={w} data-match={active && mine.has(w) ? true : undefined}>
            {w}
          </li>
        ))}
      </ul>
    );
  } else if ("anchors" in g) {
    const mine = new Set(block?.meaning.near.map(([n]) => n));
    body = (
      <ul className="tt-bin-faces">
        {g.anchors.map((n) => (
          <li key={n} data-match={active && mine.has(n) ? true : undefined} title={n}>
            <Avatar name={n} size="xs" />
            <span>{label(data, n)}</span>
          </li>
        ))}
      </ul>
    );
  } else {
    body = (
      <>
        <ul className="tt-bin-faces">
          {g.hubs.map((n) => (
            <li key={n} title={n}>
              <Avatar name={n} size="xs" />
              <span>{label(data, n)}</span>
            </li>
          ))}
        </ul>
        {block ? (
          <p className="tt-bin-links" data-match={active || undefined}>
            {block.connections.links[group]} links from {short(block.name)}
          </p>
        ) : null}
      </>
    );
  }
  const head = (
    <>
      <span className="tt-bin-name">{name}</span>
      {body}
    </>
  );
  return (
    <section className="tt-bin" data-group={group} data-active={active || undefined} aria-label={name}>
      {onDrop ? (
        <button type="button" className="tt-bin-head" onClick={onDrop} aria-label={`Drop into ${name}`}>
          {head}
        </button>
      ) : (
        <div className="tt-bin-head">{head}</div>
      )}
      <ul className="tt-bin-tiles" aria-label={`Pages in ${name}`}>
        {placed.map(({ page, missed }) => (
          <Tile key={page.id} page={page} missed={missed} />
        ))}
      </ul>
    </section>
  );
}

/** The scoreboard across the top of a round. */
function Hud({ round, score, placed, total }: { round: number; score: number; placed: number; total: number }) {
  const r = ROUND[ROUND_KEYS[round]];
  return (
    <header className="cr-hud tt-hud">
      <div className="tt-round">
        <small>Round {round + 1} of 3</small>
        <b>{r.title}</b>
        <span>{r.ask}</span>
      </div>
      <span className="tt-rep">
        <small>Representation</small>
        {r.representation}
      </span>
      <Stat label="Placed">
        {placed} / {total}
      </Stat>
      <ScoreBox points={score} />
    </header>
  );
}

/** One round: the well with the falling block, the three groups, the next pages and the feedback. */
function Round({ data, round, clock, total, onPoints, onDone }: {
  data: TopicTetrisData; round: number; clock: () => number; total: number;
  onPoints: (points: number, right: boolean, fast: boolean) => void; onDone: () => void;
}) {
  const pages = data.pages;
  const [index, setIndex] = useState(0);
  const [col, setCol] = useState(1);
  const [placed, setPlaced] = useState<{ page: TetrisPage; chosen: number }[]>([]);
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

  const elapsed = Math.max(0, now - started.current);
  const fraction = Math.min(1, elapsed / fallMs);

  const next = useCallback(() => {
    started.current = clock();
    setNow(started.current);
    setCol(1);
    setNote(null);
    setIndex((i) => i + 1);
  }, [clock]);

  const place = useCallback(
    (chosen: number) => {
      if (!block || waiting || paused) return;
      const spent = clock() - started.current;
      const right = chosen === answer(block, round);
      const points = placementPoints(right, spent, round);
      setPlaced((p) => [...p, { page: block, chosen }]);
      onPoints(points, right, right && points > POINTS.right);
      const result: Note = { ...feedback(data, block, round, chosen), page: block, chosen, points };
      if (right) {
        next();
        setNote(result);
      } else setNote(result);
    },
    [block, waiting, paused, clock, round, data, onPoints, next],
  );

  // A block that reaches the floor lands in the column it is over.
  useEffect(() => {
    if (running && fraction >= 1) place(col);
  }, [running, fraction, col, place]);

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
        if (running) setCol((c) => Math.max(0, c - 1));
      } else if (e.key === "ArrowRight" || e.key === "d") {
        e.preventDefault();
        if (running) setCol((c) => Math.min(2, c + 1));
      } else if (e.key === "ArrowDown" || ((e.key === " " || e.key === "Enter") && !onControl)) {
        e.preventDefault();
        if (waiting) next();
        else if (running) place(col);
      } else if ((e.key === "p" || e.key === "Escape") && block && !waiting) togglePause();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [running, waiting, block, col, place, next, togglePause]);

  // Round 3 draws the falling page's links to the pages already placed.
  const board = useRef<HTMLDivElement>(null);
  const blockEl = useRef<HTMLElement>(null);
  const [wires, setWires] = useState<number[][]>([]);
  const partners = ROUND_KEYS[round] === "connections" && block && !waiting ? block.connections.partners : [];
  useLayoutEffect(() => {
    const el = board.current;
    const b = blockEl.current;
    const out: number[][] = [];
    if (el && b) {
      const o = el.getBoundingClientRect();
      const from = b.getBoundingClientRect();
      for (const name of partners) {
        const id = pages.find((p) => p.name === name)?.id;
        const tile = id ? el.querySelector(`.tt-bin [data-flip="${id}"]`) : null;
        if (!tile) continue;
        const to = tile.getBoundingClientRect();
        out.push([from.left + from.width / 2 - o.left, from.bottom - o.top, to.left + to.width / 2 - o.left, to.top + to.height / 2 - o.top]);
      }
    }
    if (JSON.stringify(out) !== JSON.stringify(wires)) setWires(out);
  });

  const done = block === null && !waiting;
  const groups = data.rounds[round].groups;
  const tiles = (g: number) =>
    placed
      .filter(({ page }) => answer(page, round) === g)
      .map(({ page, chosen }) => ({ page, missed: chosen !== g ? `you: ${letter(data, round, chosen)}` : undefined }));
  const queue = pages.slice(index + 1, index + 3);

  return (
    <section className="cr-table tt-table" aria-label={`Round ${round + 1}: ${ROUND[ROUND_KEYS[round]].title}`}>
      <Hud round={round} score={total} placed={placed.length} total={pages.length} />
      <div className="tt-play">
        <div className="tt-board" ref={board}>
          {block && !waiting ? (
            // On a phone the lanes are too narrow for the clues: they sit in this card above the well instead.
            <div className="tt-phone-clue">
              <b>{short(block.name)}</b> <small className="tt-clue-head">{ROUND[ROUND_KEYS[round]].clue}</small>
              <Clue data={data} page={block} round={round} />
            </div>
          ) : null}
          <div className="tt-well" data-paused={paused || undefined}>
            {[0, 1, 2].map((c) => (
              <div key={c} className="tt-lane" data-active={running && c === col ? true : undefined} />
            ))}
            {block && !waiting ? (
              <article
                ref={blockEl}
                className="tt-block"
                aria-live="polite"
                aria-label={`Falling page: ${block.name}`}
                style={{ "--col": col, "--y": fraction } as CSSProperties}
              >
                <header>
                  <Avatar name={block.name} size="s" />
                  <b>{short(block.name)}</b>
                </header>
                <small className="tt-clue-head">{ROUND[ROUND_KEYS[round]].clue}</small>
                <Clue data={data} page={block} round={round} />
              </article>
            ) : null}
            {paused ? <p className="tt-paused">Paused</p> : null}
          </div>
          {wires.length ? (
            <svg className="tt-wires" aria-hidden="true">
              {wires.map(([x1, y1, x2, y2], i) => (
                <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} />
              ))}
            </svg>
          ) : null}
          <div className="tt-bins">
            {groups.map((_, g) => (
              <Bin
                key={g}
                data={data}
                round={round}
                group={g}
                block={waiting ? null : block}
                active={running && g === col}
                placed={tiles(g)}
                onDrop={running ? () => place(g) : undefined}
              />
            ))}
          </div>
        </div>
        <aside className="tt-side">
          <div className="tt-next">
            <h3 className="cr-h">Next</h3>
            <ol>
              {queue.map((p) => (
                <li key={p.id}>
                  <Avatar name={p.name} size="xs" />
                  <span>{short(p.name)}</span>
                </li>
              ))}
              {queue.length === 0 ? <li className="tt-none">Last page</li> : null}
            </ol>
          </div>
          <div className="tt-feedback" role="status" data-right={note ? String(note.right) : undefined}>
            {note ? (
              <>
                <p className="tt-verdict">
                  <b>{note.title}</b> <span>{note.points > 0 ? `+${note.points}` : note.points}</span>
                </p>
                {note.lines.map((line) => (
                  <p key={line}>{line}</p>
                ))}
                {waiting ? (
                  <button type="button" className="cr-go tt-small-go" onClick={next}>
                    Got it
                  </button>
                ) : null}
              </>
            ) : (
              <p className="tt-hint">Read the block, then steer it under the group it matches.</p>
            )}
          </div>
          <div className="tt-pad" aria-label="Controls">
            <button type="button" onClick={() => running && setCol((c) => Math.max(0, c - 1))} aria-label="Move left" disabled={!running}>
              ←
            </button>
            <button type="button" onClick={() => running && place(col)} aria-label="Drop" disabled={!running}>
              ↓
            </button>
            <button type="button" onClick={() => running && setCol((c) => Math.min(2, c + 1))} aria-label="Move right" disabled={!running}>
              →
            </button>
            <button type="button" className="tt-pause" onClick={togglePause} aria-pressed={paused} disabled={!block || waiting}>
              {paused ? "Resume" : "Pause"}
            </button>
          </div>
          <p className="tt-keys">
            <kbd>←</kbd> <kbd>→</kbd> move · <kbd>↓</kbd> drop · <kbd>P</kbd> pause · or click a group
          </p>
        </aside>
      </div>
      {done ? (
        <div className="tt-round-end">
          <button type="button" className="cr-go" onClick={onDone} autoFocus>
            See the round →
          </button>
        </div>
      ) : null}
    </section>
  );
}

/** A finished round's three groups, every page in the group the representation puts it in. */
function Groups({ data, round, highlight = [] }: { data: TopicTetrisData; round: number; highlight?: string[] }) {
  return (
    <div className="tt-groups">
      {data.rounds[round].groups.map((g, i) => (
        <section key={g.letter} className="tt-group" data-group={i}>
          <h3>
            {ROUND[ROUND_KEYS[round]].group} {g.letter}
          </h3>
          <ul>
            {data.pages
              .filter((p) => answer(p, round) === i)
              .map((p) => (
                <Tile key={p.id} page={p} moved={highlight.includes(p.id)} />
              ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

/** After a round: what the player did, what the representation was, and the points. */
function RoundDone({ data, round, tally, onNext }: { data: TopicTetrisData; round: number; tally: Tally; onNext: () => void }) {
  const r = ROUND[ROUND_KEYS[round]];
  const moved = movers(data, round).map((p) => p.id);
  return (
    <section className="tt-done" aria-labelledby="tt-done-title">
      <div className="tt-done-copy">
        <h2 id="tt-done-title">
          <span className="tt-check" aria-hidden="true">✓</span> Round {round + 1} complete
        </h2>
        <p className="tt-done-lead">{r.done}</p>
        <p>{r.lesson}</p>
        {moved.length ? (
          <p className="tt-moved-note">
            {moved.length} of the {data.pages.length} pages changed group since the last round: {movers(data, round).map((p) => short(p.name)).join(", ")}.
          </p>
        ) : null}
        <Groups data={data} round={round} highlight={moved} />
      </div>
      <aside className="tt-tally">
        <dl>
          <dt>
            Right ({tally.right} of {data.pages.length})
          </dt>
          <dd>+{tally.right * POINTS.right}</dd>
          <dt>Fast</dt>
          <dd>+{tally.fast * POINTS.fast}</dd>
          <dt>Not quite ({tally.wrong})</dt>
          <dd>{tally.wrong * POINTS.wrong}</dd>
          <dt>Round bonus</dt>
          <dd>+{POINTS.round}</dd>
        </dl>
        <p className="tt-tally-total">
          This round <b>{tallyPoints(tally).toLocaleString("en")}</b>
        </p>
        <button type="button" className="cr-go" onClick={onNext} autoFocus>
          {round < 2 ? "Next round →" : "See the three maps →"}
        </button>
      </aside>
    </section>
  );
}

/** Between rounds: the placed pages lift out of their groups into one pile, unchanged. */
function Shift({ data, round, onGo }: { data: TopicTetrisData; round: number; onGo: () => void }) {
  const root = useRef<HTMLDivElement>(null);
  const [loose, setLoose] = useState(false);
  useFlip(root, loose);
  useEffect(() => {
    if (reducedMotion()) return setLoose(true);
    const id = window.setTimeout(() => setLoose(true), 700);
    return () => window.clearTimeout(id);
  }, []);
  const before = ROUND[ROUND_KEYS[round - 1]];
  const after = ROUND[ROUND_KEYS[round]];
  return (
    <section className="tt-shift" aria-labelledby="tt-shift-title">
      <p className="tt-kicker">
        You just grouped the pages by {before.representation}.
      </p>
      <h2 id="tt-shift-title">
        Same pages.
        <br />
        <span>Different representation.</span>
      </h2>
      <div ref={root} className="tt-shift-stage" data-loose={loose || undefined}>
        {loose ? (
          <ul className="tt-pile" aria-label="The same pages">
            {data.pages.map((p) => (
              <Tile key={p.id} page={p} />
            ))}
          </ul>
        ) : (
          <Groups data={data} round={round - 1} />
        )}
      </div>
      <p>
        The pages have not changed. Next, they are compared by <b>{after.representation}</b>.
      </p>
      <button type="button" className="cr-go" onClick={onGo} autoFocus>
        Start round {round + 1}: {after.title} →
      </button>
    </section>
  );
}

/** The end: the same pages on one board, moving between the three groupings. */
function Maps({ data, onNext }: { data: TopicTetrisData; onNext: () => void }) {
  const [view, setView] = useState(0);
  const [auto, setAuto] = useState(() => !reducedMotion());
  const root = useRef<HTMLDivElement>(null);
  useFlip(root, view, 900);
  useEffect(() => {
    if (!auto) return;
    const id = window.setInterval(() => setView((v) => (v + 1) % 3), 2800);
    return () => window.clearInterval(id);
  }, [auto]);
  const moved = movers(data, view).map((p) => p.id);
  const changed = (p: TetrisPage, r: number) => r > 0 && letter(data, r, answer(p, r)) !== letter(data, 0, answer(p, 0));
  return (
    <section className="tt-maps" aria-labelledby="tt-maps-title">
      <p className="tt-kicker">Same corpus</p>
      <h2 id="tt-maps-title">Three different maps.</h2>
      <SegmentedControl
        className="cr-seg tt-seg"
        ariaLabel="Grouping"
        value={ROUND_KEYS[view]}
        onChange={(v) => {
          setAuto(false);
          setView(ROUND_KEYS.indexOf(v as RoundKey));
        }}
        buttons={ROUND_KEYS.map((k) => ({ value: k, label: ROUND[k].title }))}
      />
      <div ref={root} className="tt-map-board">
        <Groups data={data} round={view} highlight={moved} />
      </div>
      <table className="tt-where">
        <caption>Where each page went · orange: not where its words put it</caption>
        <thead>
          <tr>
            <th scope="col">Page</th>
            {ROUND_KEYS.map((k) => (
              <th key={k} scope="col">
                {ROUND[k].title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.pages.map((p) => (
            <tr key={p.id}>
              <th scope="row">{short(p.name)}</th>
              {ROUND_KEYS.map((k, r) => (
                <td key={k} data-changed={changed(p, r) || undefined}>
                  {letter(data, r, answer(p, r))}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="tt-takeaway">
        <p>
          <b>There is no single “correct” grouping.</b> The grouping depends on what information you use to represent the documents.
        </p>
        <p className="tt-why">That’s why representation matters.</p>
      </div>
      <button type="button" className="cr-go" onClick={onNext}>
        One quick check →
      </button>
    </section>
  );
}

/** The final check: one question, answered once. */
function Quiz({ onNext }: { onNext: () => void }) {
  const [pick, setPick] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const right = pick === QUIZ.answer;
  return (
    <section className="tt-quiz" aria-labelledby="tt-quiz-title">
      <p className="tt-kicker">Quick check</p>
      <fieldset disabled={checked}>
        <legend id="tt-quiz-title">{QUIZ.question}</legend>
        {QUIZ.options.map((o, i) => (
          <label key={o} data-picked={pick === i || undefined} data-answer={checked && i === QUIZ.answer ? true : undefined}>
            <input type="radio" name="tt-quiz" checked={pick === i} onChange={() => setPick(i)} />
            <span className="tt-opt">{"ABCD"[i]}</span> {o}
          </label>
        ))}
      </fieldset>
      {checked ? (
        <div className="tt-quiz-result" role="status" data-right={String(right)}>
          <p>
            <b>{right ? "Yes: the representation." : "Not quite. It was B, the representation."}</b> {QUIZ.explain}
          </p>
          <button type="button" className="cr-go" onClick={onNext} autoFocus>
            See your result →
          </button>
        </div>
      ) : (
        <button type="button" className="cr-go" onClick={() => setChecked(true)} disabled={pick === null}>
          Check answer
        </button>
      )}
    </section>
  );
}

/** The ending: the takeaway, the score per round and the ways out. */
function End({ data, score, tallies, home, onAgain }: { data: TopicTetrisData; score: number; tallies: Tally[]; home: string; onAgain: () => void }) {
  return (
    <section className="tt-end" aria-labelledby="tt-end-title">
      <div className="tt-end-copy">
        <h2 id="tt-end-title">
          Same corpus.
          <br />
          <span>Different maps.</span>
        </h2>
        <p>The documents never changed. The representation did.</p>
        <p className="tt-triad">
          <b>Words</b> → <b>Meaning</b> → <b>Connections</b>
        </p>
        <p>That’s why representation matters when we analyse a corpus.</p>
        <Real data={data} />
      </div>
      <aside className="tt-card">
        <p className="tt-card-title">Topic Tetris</p>
        <p className="tt-card-score">
          Score <b>{score.toLocaleString("en")}</b>
        </p>
        <ul>
          {ROUND_KEYS.map((k, r) => (
            <li key={k}>
              <span>{ROUND[k].title}</span>
              <small>
                {tallies[r].right} of {data.pages.length} right
              </small>
              <b aria-label="done">✓</b>
            </li>
          ))}
        </ul>
        <p>You found 3 different ways to organise the same corpus.</p>
        <button type="button" className="cr-go" onClick={onAgain} autoFocus>
          Play again
        </button>
        <a className="tt-back" href={home}>
          Back to Log-Log Legends
        </a>
      </aside>
    </section>
  );
}

/** What is real in the simplified model: the groupings come from real runs on the whole corpus. */
function Real({ data }: { data: TopicTetrisData }) {
  const s = data.source;
  return (
    <details className="tt-real">
      <summary>What is real here?</summary>
      <p>
        A simplified model: the game shows {data.pages.length} of the {s.pages} Marvel pages and 3 groups from each method, and the real
        methods are more involved than a board of three bins. But the groups come from real runs on all {s.pages} pages.
      </p>
      <ul>
        <li>
          <b>Words:</b> {s.words}. Each group lists its topic’s top words, leaving out words another listed topic also ranks high; a block shows how often the page uses the listed words.
        </li>
        <li>
          <b>Meaning:</b> {s.meaning}. The faces in each group are pages from that cluster: the nearest cluster-mates of the game’s pages first, then the pages nearest its centre. A block’s “closest” pages are the closest of those faces, not of the whole corpus.
        </li>
        <li>
          <b>Connections:</b> {s.connections}. The faces are the community’s best-linked pages.
        </li>
      </ul>
    </details>
  );
}

export function TopicTetrisGame({ data, clock = Date.now, home = "../../" }: { data: TopicTetrisData; clock?: () => number; home?: string }) {
  const [stage, setStage] = useState<Stage>({ kind: "intro" });
  const [tallies, setTallies] = useState<Tally[]>([EMPTY, EMPTY, EMPTY]);
  const [score, setScore] = useState(0);
  const round = stage.kind === "play" || stage.kind === "done" || stage.kind === "shift" ? stage.round : 0;

  const onPoints = useCallback(
    (points: number, right: boolean, fast: boolean) => {
      setScore((s) => Math.max(0, s + points));
      setTallies((all) =>
        all.map((t, r) => (r === round ? { right: t.right + Number(right), fast: t.fast + Number(fast), wrong: t.wrong + Number(!right) } : t)),
      );
    },
    [round],
  );

  /** A round starts with an empty tally, so a round played again never counts twice. */
  const play = (r: number) => {
    setTallies((all) => all.map((t, i) => (i === r ? EMPTY : t)));
    setStage({ kind: "play", round: r });
  };

  const restart = () => {
    setScore(0);
    play(0);
  };

  if (stage.kind === "intro")
    return (
      <section className="cr-table tt-start" aria-label="Topic Tetris">
        <div className="tt-intro">
          <Intro />
          <IntroArt data={data} />
        </div>
        <div className="cr-start">
          <Rules
            rules={[
              ["Steer", <>each falling page under one of three groups: arrow keys, the buttons, or click a group.</>],
              ["Read", <>the block: its clues are the evidence for this round’s representation.</>],
              ["Repeat", <>with the same pages, three times: words, meaning, connections.</>],
            ]}
          />
          <StartRow option={<p className="cr-note">{data.pages.length} pages · 3 rounds</p>}>
            <button type="button" className="cr-go" onClick={() => play(0)}>
              Start game →
            </button>
          </StartRow>
        </div>
      </section>
    );
  if (stage.kind === "play")
    return (
      <Round
        key={stage.round}
        data={data}
        round={stage.round}
        clock={clock}
        total={score}
        onPoints={onPoints}
        onDone={() => {
          setScore((s) => s + POINTS.round);
          setStage({ kind: "done", round: stage.round });
        }}
      />
    );
  if (stage.kind === "done")
    return (
      <section className="cr-table tt-table">
        <Hud round={stage.round} score={score} placed={data.pages.length} total={data.pages.length} />
        <RoundDone
          data={data}
          round={stage.round}
          tally={tallies[stage.round]}
          onNext={() => setStage(stage.round < 2 ? { kind: "shift", round: stage.round + 1 } : { kind: "map" })}
        />
      </section>
    );
  if (stage.kind === "shift")
    return (
      <section className="cr-table tt-table">
        <Shift data={data} round={stage.round} onGo={() => play(stage.round)} />
      </section>
    );
  if (stage.kind === "map")
    return (
      <section className="cr-table tt-table">
        <Maps data={data} onNext={() => setStage({ kind: "quiz" })} />
      </section>
    );
  if (stage.kind === "quiz")
    return (
      <section className="cr-table tt-table">
        <Quiz onNext={() => setStage({ kind: "end" })} />
      </section>
    );
  return (
    <section className="cr-table tt-table">
      <End data={data} score={score} tallies={tallies} home={home} onAgain={restart} />
    </section>
  );
}
