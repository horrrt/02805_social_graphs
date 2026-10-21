// Semantic Minefield, a Week 7 game for search by meaning. Minesweeper with
// Marvel characters under the tiles: each round names a target category, and
// every character in it is a bomb. A revealed tile shows its character and
// how many of its eight neighbours are in the target; a hidden tile may show
// one of its character's other categories, which helps without settling it. The
// boards, clues and solver are in board.ts, the rounds and sentences in
// rounds.ts, the labels in characters.ts. Rounds come in as a prop so tests can
// play a short game.
import { type KeyboardEvent, type MouseEvent, type Ref, useEffect, useMemo, useRef, useState } from "react";
import { CosineFormula } from "@/features/cold-read/Formulas";
import { BestBox, Lives, ScoreBox, Stat, useBest } from "@/features/cold-read/LevelParts";
import { Rules } from "@/features/cold-read/StartPanel";
import { Face } from "@/kit/Portrait";
import { type Board, chipCategories, flood } from "./board";
import { CATEGORIES, type CatId, type Character, isIn } from "./characters";
import { boardFor, compare, explain, LIVES, list, maxPoints, POINTS, ROUNDS, type Round, roundPoints, type Tally } from "./rounds";

const BEST = "semantic-minefield:best";

type Phase = "intro" | "play" | "cleared" | "over" | "done";
type Mode = "reveal" | "flag";

type Play = {
  board: Board;
  open: Set<number>;
  flagged: Set<number>;
  /** Bombs the player opened. */
  hits: Set<number>;
  /** Safe tiles that ever carried a flag, charged when the round ends. */
  wrong: Set<number>;
  /** Safe tiles the player opened (the opening is free). */
  revealed: number;
};

const fresh = (board: Board): Play => ({ board, open: new Set(board.opening), flagged: new Set(), hits: new Set(), wrong: new Set(), revealed: 0 });

const tally = (p: Play, cleared: boolean): Tally => ({
  revealed: p.revealed,
  flagsRight: [...p.flagged].filter((i) => p.board.bomb[i]).length,
  wrongFlags: p.wrong.size,
  hits: p.hits.size,
  cleared,
});

const safeCount = (b: Board) => b.bomb.filter((x) => !x).length;

export function Intro() {
  return (
    <Rules
      rules={[
        ["Each round names a target category,", "such as Villain. Every hidden character in it is a bomb."],
        ["Reveal", "a safe tile to see its character and a number: how many of its eight neighbours are in the target."],
        ["Flag", "the tiles you think are bombs (right-click, F, or the Flag button). Flags are scored when you clear the board."],
        ["Read the chips.", "A hidden tile may show one of its character’s other categories, one that bombs and safe tiles both carry. It hints; only the numbers settle a tile."],
      ]}
    />
  );
}

/** A category chip: its mark, and its name unless `bare`. */
export function Chip({ cat, on, bare }: { cat: CatId; on?: boolean; bare?: boolean }) {
  const c = CATEGORIES[cat];
  return (
    <span className="sm-chip" data-cat={cat} data-on={on} title={bare ? c.label : undefined}>
      <i aria-hidden="true">{c.mark}</i>
      {bare ? <span className="sm-sr">{c.label}</span> : c.label}
    </span>
  );
}

export function SemanticMinefieldGame({ rounds = ROUNDS }: { rounds?: Round[] }) {
  const [phase, setPhaseState] = useState<Phase>("intro");
  const [run, setRun] = useState(0);
  const [at, setAt] = useState(0);
  const [play, setPlayState] = useState<Play | null>(null);
  // The latest board and lives, read by the handlers: two clicks in one tick
  // (a fast double flag) must each see the other's change.
  const now = useRef<{ play: Play | null; lives: number; phase: Phase }>({ play: null, lives: LIVES, phase: "intro" });
  const setPhase = (p: Phase) => {
    now.current.phase = p;
    setPhaseState(p);
  };
  const setPlay = (p: Play | null) => {
    now.current.play = p;
    setPlayState(p);
  };
  const [banked, setBanked] = useState<number[]>([]);
  const [lives, setLivesState] = useState(LIVES);
  const setLives = (n: number) => {
    now.current.lives = n;
    setLivesState(n);
  };
  const [mode, setMode] = useState<Mode>("reveal");
  const [selected, setSelected] = useState<number | null>(null);
  const { best, record } = useBest(BEST);
  const [isNew, setIsNew] = useState(false);
  const action = useRef<HTMLButtonElement>(null);
  const table = useRef<HTMLElement>(null);

  const round = rounds[at];
  const live = play && phase === "play" ? roundPoints(tally(play, false)) : 0;
  const total = banked.reduce((s, x) => s + x, 0) + live;

  useEffect(() => {
    if (phase === "cleared" || phase === "done") action.current?.focus({ preventScroll: true });
    if (phase === "play") table.current?.querySelector<HTMLButtonElement>(".sm-tile[data-state='hidden']")?.focus({ preventScroll: true });
  }, [phase, at]);

  const deal = (i: number, r: number) => {
    setPlay(fresh(boardFor(rounds[i], r)));
    setSelected(null);
    setMode("reveal");
    setPhase("play");
  };

  const start = () => {
    // Retry after the last life keeps the run's score as a best.
    if (now.current.phase === "over") record(total);
    const next = phase === "intro" ? run : run + 1;
    setRun(next);
    setAt(0);
    setBanked([]);
    setLives(LIVES);
    setIsNew(false);
    deal(0, next);
  };

  const finish = (p: Play) => {
    setBanked((b) => [...b, roundPoints(tally(p, true))]);
    setPhase("cleared");
  };

  const reveal = (i: number) => {
    const { play, lives, phase } = now.current;
    if (!play || phase !== "play" || play.open.has(i) || play.flagged.has(i) || play.hits.has(i)) return;
    setSelected(i);
    const { board } = play;
    if (board.bomb[i]) {
      const p = { ...play, hits: new Set(play.hits).add(i) };
      setPlay(p);
      const left = lives - 1;
      setLives(left);
      if (left <= 0) {
        setBanked((b) => [...b, roundPoints(tally(p, false))]);
        setPhase("over");
      }
      return;
    }
    const opened = flood(i, board, play.open, play.flagged);
    const open = new Set(play.open);
    opened.forEach((j) => open.add(j));
    const p = { ...play, open, revealed: play.revealed + opened.length };
    setPlay(p);
    if (open.size === safeCount(board)) finish(p);
  };

  const flag = (i: number) => {
    const { play, phase } = now.current;
    if (!play || phase !== "play" || play.open.has(i) || play.hits.has(i)) return;
    const flagged = new Set(play.flagged);
    const wrong = new Set(play.wrong);
    if (flagged.has(i)) flagged.delete(i);
    else {
      flagged.add(i);
      if (!play.board.bomb[i]) wrong.add(i);
    }
    setPlay({ ...play, flagged, wrong });
  };

  const press = (i: number) => (mode === "flag" ? flag(i) : reveal(i));

  const next = () => {
    if (at + 1 >= rounds.length) {
      setIsNew(record(total));
      setPhase("done");
      return;
    }
    setAt(at + 1);
    deal(at + 1, run);
  };

  const end = () => {
    setIsNew(record(total));
    setPhase("done");
  };

  return (
    <section className="cr-table sm-table" id="semantic-minefield" aria-label="Semantic Minefield" ref={table}>
      <div className="cr-hud" role="status">
        <ScoreBox points={total} />
        <Stat label="Round">
          {phase === "intro" ? 0 : Math.min(at + 1, rounds.length)}/{rounds.length}
        </Stat>
        <Stat label="Bombs left">{play && phase !== "intro" && phase !== "done" ? play.board.bomb.filter(Boolean).length - play.flagged.size - play.hits.size : "–"}</Stat>
        <Lives lives={lives} max={LIVES} onRetry={start} />
        <BestBox best={best} />
      </div>

      {phase === "intro" ? (
        <div className="cr-start">
          <p className="sm-lede">
            Minesweeper, but the mines are Marvel characters. Each round asks for one category, and the characters in it are the bombs. A character
            can sit in several categories at once; only the target counts. {rounds.length} rounds, about four minutes.
          </p>
          <Intro />
          <div className="cr-start-row">
            <p className="cr-note">
              +{POINTS.reveal} per tile you open, +{POINTS.flag} per right flag and −{POINTS.wrongFlag} per tile you wrongly flagged, both counted
              when you clear the board, +{POINTS.clean} for a round without a bomb. A bomb costs {POINTS.bomb} points and a life. Every board can be cleared
              from its numbers alone, so you never have to guess.
            </p>
            <div className="cr-start-go">
              <button type="button" className="cr-go" onClick={start}>
                Start
              </button>
            </div>
          </div>
          <SearchPanel />
        </div>
      ) : phase === "done" ? (
        <Final rounds={rounds} banked={banked} total={total} isNew={isNew} again={start} buttonRef={action} />
      ) : play ? (
        <div className="sm-round">
          <Progress rounds={rounds} at={at} banked={banked} />
          <div className="sm-layout">
            <div className="sm-left">
              <div className="sm-target">
                <span className="cr-h">
                  Round {at + 1} · {round.title}
                </span>
                <p>
                  Query: <Chip cat={round.target} on /> <small>{CATEGORIES[round.target].rule}</small>
                </p>
              </div>
              <Grid play={play} phase={phase} selected={selected} onPress={press} onFlag={flag} onSelect={setSelected} />
              <div className="sm-controls">
                <div className="sm-mode" role="group" aria-label="What a click does">
                  <button type="button" aria-pressed={mode === "reveal"} onClick={() => setMode("reveal")} disabled={phase !== "play"}>
                    Reveal
                  </button>
                  <button type="button" aria-pressed={mode === "flag"} onClick={() => setMode("flag")} disabled={phase !== "play"}>
                    ⚑ Flag
                  </button>
                </div>
                <p className="cr-note">Click to {mode === "flag" ? "flag" : "reveal"}. Right-click or F flags. Arrow keys move.</p>
              </div>
            </div>
            <div className="sm-side">
              {phase === "cleared" ? (
                <Debrief round={round} play={play} points={banked[at]} last={at + 1 >= rounds.length} onNext={next} buttonRef={action} />
              ) : phase === "over" ? (
                <div className="cr-debrief sm-over">
                  <h3>Out of lives</h3>
                  <p>{selected !== null ? explain(play.board.tiles[selected], play.board.target) : null}</p>
                  <p>Every board can be cleared from the numbers: a tile is safe when a number around it already has all its bombs flagged.</p>
                  <div className="sm-actions">
                    <button type="button" className="cr-ghost" onClick={end}>
                      See the results
                    </button>
                    <button type="button" className="cr-go" onClick={start}>
                      Play again
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <Detail play={play} index={selected} />
                  <p className="sm-lesson">{round.lesson}</p>
                </>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function Progress({ rounds, at, banked }: { rounds: Round[]; at: number; banked: number[] }) {
  return (
    <ol className="sm-rounds" aria-label={`Round ${at + 1} of ${rounds.length}`}>
      {rounds.map((r, i) => (
        <li key={r.id} data-state={i < banked.length ? "done" : i === at ? "now" : "todo"}>
          <Chip cat={r.target} bare />
        </li>
      ))}
    </ol>
  );
}

function tileLabel(p: Play, i: number) {
  const c = p.board.tiles[i];
  const r = Math.floor(i / p.board.cols) + 1;
  const col = (i % p.board.cols) + 1;
  const where = `Row ${r}, column ${col}`;
  if (p.hits.has(i)) return `${where}: ${c.name}, a bomb`;
  if (p.open.has(i)) return `${where}: ${c.name}, ${p.board.counts[i]} around`;
  const chip = p.board.chips[i];
  return `${where}: hidden${chip ? `, chip ${CATEGORIES[chip].label}` : ""}${p.flagged.has(i) ? ", flagged" : ""}`;
}

function Grid({ play, phase, selected, onPress, onFlag, onSelect }: {
  play: Play; phase: Phase; selected: number | null; onPress: (i: number) => void; onFlag: (i: number) => void; onSelect: (i: number) => void;
}) {
  const { board } = play;
  const ended = phase !== "play";
  const grid = useRef<HTMLDivElement>(null);
  const move = (i: number, e: KeyboardEvent) => {
    const step: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -board.cols, ArrowDown: board.cols };
    if (e.key in step) {
      const j = i + step[e.key];
      const sameRow = Math.abs(step[e.key]) !== 1 || Math.floor(j / board.cols) === Math.floor(i / board.cols);
      if (j >= 0 && j < board.tiles.length && sameRow) {
        e.preventDefault();
        grid.current?.querySelectorAll<HTMLButtonElement>(".sm-tile")[j]?.focus();
      }
    } else if (e.key === "f" || e.key === "F") {
      e.preventDefault();
      onFlag(i);
    }
  };
  return (
    <div ref={grid} className="sm-grid" style={{ gridTemplateColumns: `repeat(${board.cols}, 1fr)` }} role="group" aria-label="Board">
      {board.tiles.map((c, i) => {
        const open = play.open.has(i);
        const hit = play.hits.has(i);
        const flagged = play.flagged.has(i);
        // When the round ends, the bombs left show, and a wrong flag shows as one.
        const state = hit ? "hit" : open ? "open" : ended && board.bomb[i] ? (flagged ? "found" : "bomb") : flagged ? (ended ? "wrong" : "flag") : "hidden";
        const shown = hit || open || (ended && board.bomb[i]);
        const chip = board.chips[i];
        const n = board.counts[i];
        return (
          <button
            key={i}
            type="button"
            className="sm-tile"
            data-state={state}
            data-on={selected === i}
            aria-label={tileLabel(play, i)}
            onClick={() => (open || hit || ended ? onSelect(i) : onPress(i))}
            onContextMenu={(e: MouseEvent) => {
              e.preventDefault();
              onFlag(i);
            }}
            onKeyDown={(e) => move(i, e)}
          >
            {shown ? (
              <>
                <span className="sm-face" aria-hidden="true">
                  <Face name={c.page ?? c.name} />
                </span>
                {open ? (
                  <b className="sm-n" data-n={n}>
                    {n || ""}
                  </b>
                ) : (
                  <b className="sm-n" aria-hidden="true">
                    ☠
                  </b>
                )}
                <small className="sm-name">{c.name}</small>
              </>
            ) : flagged ? (
              <b className="sm-flag" aria-hidden="true">
                ⚑
              </b>
            ) : chip ? (
              <span className="sm-tile-chip" data-cat={chip} aria-hidden="true">
                {CATEGORIES[chip].mark}
              </span>
            ) : (
              <span className="sm-tile-chip" aria-hidden="true">
                ?
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

function CharacterCard({ c, target }: { c: Character; target: CatId }) {
  return (
    <div className="sm-card" data-bomb={isIn(c, target)}>
      <span className="sm-face sm-face-l" aria-hidden="true">
        <Face name={c.page ?? c.name} />
      </span>
      <div>
        <h3>{c.name}</h3>
        <p className="sm-chips">
          {c.cats.map((cat) => (
            <Chip key={cat} cat={cat} on={cat === target} />
          ))}
        </p>
      </div>
      <p className="sm-why">{explain(c, target)}</p>
      <p className="sm-blurb">{c.blurb}</p>
    </div>
  );
}

function Detail({ play, index }: { play: Play; index: number | null }) {
  const { board } = play;
  if (index === null || !(play.open.has(index) || play.hits.has(index))) {
    return (
      <div className="sm-detail" aria-live="polite">
        <span className="cr-h">Chips on hidden tiles</span>
        <ul className="sm-legend">
          {Object.values(CATEGORIES)
            .filter((c) => chipCategories(board.target).includes(c.id))
            .map((c) => (
              <li key={c.id}>
                <Chip cat={c.id} />
              </li>
            ))}
        </ul>
        <p className="cr-note">
          A chip is one of the hidden character’s categories, never the target, and only one that some bombs and some safe characters share. A “?”
          means none of its categories qualifies.
        </p>
      </div>
    );
  }
  return (
    <div className="sm-detail" aria-live="polite">
      <span className="cr-h">{play.hits.has(index) ? "Bomb" : "Revealed"}</span>
      <CharacterCard c={board.tiles[index]} target={board.target} />
    </div>
  );
}

const names = (cs: Character[]) => list(cs.map((c) => c.name));

function Debrief({ round, play, points, last, onNext, buttonRef }: { round: Round; play: Play; points: number; last: boolean; onNext: () => void; buttonRef: Ref<HTMLButtonElement> }) {
  const { board } = play;
  const t = tally(play, true);
  const bombs = [...new Map(board.tiles.filter((c) => isIn(c, board.target)).map((c) => [c.id, c])).values()];
  const cmp = useMemo(() => compare(board, round.keyword), [board, round.keyword]);
  const target = CATEGORIES[board.target].label;
  return (
    <div className="cr-debrief sm-debrief">
      <span className="cr-stamp" data-grade={t.hits ? "ok" : "good"}>
        Board cleared · {points >= 0 ? "+" : ""}
        {points}
      </span>
      <p className="sm-tally">
        {t.flagsRight} right flag{t.flagsRight === 1 ? "" : "s"} (+{t.flagsRight * POINTS.flag})
        {t.wrongFlags ? `, ${t.wrongFlags} wrongly flagged (−${t.wrongFlags * POINTS.wrongFlag})` : ""}
        {t.hits ? `, ${t.hits} bomb${t.hits === 1 ? "" : "s"} hit (−${t.hits * POINTS.bomb})` : `, no bomb hit (+${POINTS.clean})`}.
      </p>
      <h3>The round as a search</h3>
      <p>
        Read “{target}” as a query and the {new Set(board.tiles.map((c) => c.id)).size} characters as documents. The relevant set is every
        character labelled {target}: {names(bombs)}.
      </p>
      <h3>Keyword search would say</h3>
      <p>
        A search for the word “{round.keyword}” in the one-line descriptions finds {cmp.both.length + cmp.falseHits.length ? names([...cmp.both, ...cmp.falseHits]) : "nobody"}.
      </p>
      <ul className="sm-compare">
        {cmp.missed.length ? (
          <li>
            <b>Missed:</b> {names(cmp.missed)}. The word never appears in {cmp.missed.length === 1 ? "that description" : "their descriptions"}, so a
            word match cannot see {cmp.missed.length === 1 ? "it" : "them"}: the vocabulary mismatch that search by meaning tries to bridge.
          </li>
        ) : null}
        {cmp.falseHits.length ? (
          <li>
            <b>Wrongly found:</b> {names(cmp.falseHits)}. The word is there, but the label says no.
          </li>
        ) : null}
        {cmp.both.length ? (
          <li>
            <b>Found and labelled:</b> {names(cmp.both)}.
          </li>
        ) : null}
      </ul>
      <p className="cr-note">
        The labels are hand-assigned teaching data, and the keyword search is a plain word match over descriptions written for this game. Neither is
        an embedding model.
      </p>
      <div className="sm-actions">
        <button ref={buttonRef} type="button" className="cr-go" onClick={onNext}>
          {last ? "See the results" : "Next round →"}
        </button>
      </div>
    </div>
  );
}

/** How the game maps onto search by meaning: on the start screen and the results. */
function SearchPanel() {
  return (
    <details className="sm-how">
      <summary>How this connects to search by meaning</summary>
      <ul>
        <li>The target category plays the query, the hidden characters the documents, and the bombs the relevant results.</li>
        <li>
          Keyword (sparse) search finds a document only when it shares the query’s words. Search by meaning encodes the query and every document as
          vectors in one space and ranks them by similarity, so “sorceress” can match “uses magic” without the word:
          <span className="cr-formula">
            <CosineFormula />
          </span>
        </li>
        <li>
          The game’s categories are a simplified, readable stand-in for that: explicit labels you can check. They are written by hand, not computed by
          cosine similarity.
        </li>
        <li>
          Different representations retrieve different results, and a high similarity is not a fact check: a description of Thor’s enchanted hammer
          sits close to “magic”, yet Thor casts no spells.
        </li>
      </ul>
    </details>
  );
}

function Final({ rounds, banked, total, isNew, again, buttonRef }: { rounds: Round[]; banked: number[]; total: number; isNew: boolean; again: () => void; buttonRef: Ref<HTMLButtonElement> }) {
  const max = useMemo(() => rounds.reduce((s, r) => s + maxPoints(boardFor(r)), 0), [rounds]);
  return (
    <div className="sm-final">
      <span className="cr-h">Minefield swept</span>
      <p className="cr-verdict">
        {total.toLocaleString("en")} <small>points</small>
      </p>
      <p className="sm-final-sub">
        {banked.length} of {rounds.length} rounds played{isNew ? " · a new best in this browser" : ""}. A perfect run of the first boards scores{" "}
        {max.toLocaleString("en")}.
      </p>
      <ol className="sm-final-list">
        {rounds.map((r, i) => (
          <li key={r.id} data-played={i < banked.length}>
            <Chip cat={r.target} />
            <span>{r.lesson}</span>
            <b>{i < banked.length ? `${banked[i] >= 0 ? "+" : ""}${banked[i]}` : "–"}</b>
          </li>
        ))}
      </ol>
      <div className="cr-debrief sm-takeaway">
        <h3>What the minefield says about search by meaning</h3>
        <p>
          <b>One item, many labels.</b> Ultron is a villain, an artificial intelligence and a technology user at once. A query picks out one of those
          meanings, and the same character is relevant to one query and not another.
        </p>
        <p>
          <b>Words are not meaning.</b> A keyword search misses characters whose descriptions say it in other words, and finds some that use the
          word in another sense, as Thor’s enchanted hammer does for “magic”. Dense retrieval compares meanings in a shared vector space to close that gap.
        </p>
        <p>
          <b>Similar is not correct.</b> Related labels hint (every Avenger here is a hero, yet many heroes never joined), but none decides another, just as a high cosine says a
          document is close to the query, not that it is right.
        </p>
      </div>
      <SearchPanel />
      <div className="sm-actions">
        <button ref={buttonRef} type="button" className="cr-go" onClick={again}>
          Play again
        </button>
      </div>
    </div>
  );
}
