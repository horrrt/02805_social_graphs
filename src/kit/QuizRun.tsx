// A run of short text rounds, dealt by seed, scored with a streak. Three round
// types, each usable alone: ClueReveal (name the suspect from clue words shown
// one at a time; fewer clues score more, and a machine reading each suspect's
// word bag commits when its top suspect scores twice the runner-up after two
// clues, or at the last clue), TwoChoice (which of two sentences is real) and
// FillBlank (put the missing word back into a concordance line). Keys: 1 to 4
// pick an answer and Space shows the next clue while focus is in the round;
// Enter or Space on Next moves on. Rules in game-core.js; frame from
// GameShell. Style: .kit-quiz in post.css.
import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import GameShell, { focusWithin, useGameRun, type GameSettings } from "./GameShell";
import { useReducedMotion } from "./network/motion";
import { clueScores, cluePoints, dealCases, machineCommit, mulberry32, quizAnswer, quizInit } from "./game-core.js";
import { shuffle } from "./graph-core.js";

export type ClueRound = {
  type: "clue";
  id: string;
  suspects: { key: string; label: string }[];
  answer: string;
  clues: string[];
  /** Each suspect's words and counts, which the machine reads. */
  bags: Record<string, Record<string, number>>;
};
export type TwoRound = { type: "two"; id: string; options: [string, string]; answer: 0 | 1; ask?: string; why?: string };
export type BlankRound = { type: "blank"; id: string; left: string; right: string; answer: string; decoys: string[]; source?: string };
export type QuizRound = ClueRound | TwoRound | BlankRound;
/** What a round reports when answered: right or not, the points, and the machine's points where it played. */
export type RoundResult = { correct: boolean; points: number; machine?: number; note?: string };

type RoundProps<R> = { round: R; onAnswer: (r: RoundResult) => void; seed?: number; startAt?: number; answered?: number | string; autoFocus?: boolean };

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];

// A round's frame: a focusable box that takes the number keys and Space; with autoFocus it takes the focus once it mounts if the reader is in the game.
function RoundBox({ label, onKey, autoFocus = false, children }: { label: string; onKey: (e: KeyboardEvent<HTMLDivElement>) => void; autoFocus?: boolean; children: ReactNode }) {
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (autoFocus) focusWithin(box.current?.closest(".kit-quiz") as HTMLElement | null, box.current);
  }, [autoFocus]);
  return (
    <div ref={box} className="kit-quiz-round" tabIndex={0} role="group" aria-label={label} onKeyDown={onKey}>
      {children}
    </div>
  );
}

function Options({ options, picked, right, onPick, disabled }: { options: ReactNode[]; picked: number | null; right: number | null; onPick: (i: number) => void; disabled: boolean }) {
  return (
    <ol className="kit-quiz-options">
      {options.map((o, i) => (
        <li key={i}>
          <button
            type="button"
            disabled={disabled}
            aria-pressed={picked === i}
            className={right === null ? undefined : i === right ? "kit-right" : i === picked ? "kit-wrong" : undefined}
            onClick={() => onPick(i)}
          >
            <kbd>{i + 1}</kbd> {o}
          </button>
        </li>
      ))}
    </ol>
  );
}

/** <ClueReveal round={round} onAnswer={(r) => …} />: one suspect round. */
export function ClueReveal({ round, onAnswer, startAt = 1, answered, autoFocus }: RoundProps<ClueRound>) {
  const total = round.clues.length;
  const [shown, setShown] = useState(Math.max(1, Math.min(total, startAt)));
  const [picked, setPicked] = useState<number | null>(answered === undefined ? null : round.suspects.findIndex((s) => s.key === answered));
  const reduced = useReducedMotion();
  const commit = useMemo(() => {
    const rows = round.clues.map((_, c) => clueScores(round.clues.slice(0, c + 1), round.bags));
    return machineCommit(rows, total) as { clue: number; pick: string | null; forced: boolean };
  }, [round, total]);
  const done = picked !== null;
  const right = round.suspects.findIndex((s) => s.key === round.answer);
  const machine = cluePoints(commit.clue, total, commit.pick === round.answer);
  const label = (key: string | null) => round.suspects.find((s) => s.key === key)?.label ?? "nobody";

  const choose = (i: number) => {
    if (done || i < 0 || i >= round.suspects.length) return;
    setPicked(i);
    const correct = round.suspects[i].key === round.answer;
    onAnswer({ correct, points: cluePoints(shown, total, correct), machine });
  };
  const more = () => !done && setShown((s) => Math.min(total, s + 1));
  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (done) return;
    const i = KEYS.indexOf(e.key);
    if (i >= 0 && i < round.suspects.length) {
      e.preventDefault();
      choose(i);
    } else if (e.key === " ") {
      e.preventDefault();
      more();
    }
  };

  return (
    <RoundBox label="Who is it? Keys 1 to 4 answer, Space shows the next clue" onKey={onKey} autoFocus={autoFocus}>
      <p className="kit-quiz-ask">Whose page is this? Clue {shown} of {total}.</p>
      <ol className={`kit-quiz-clues${reduced ? "" : " kit-quiz-fade"}`} aria-live="polite">
        {round.clues.slice(0, shown).map((c, i) => (
          <li key={i}>{c}</li>
        ))}
      </ol>
      {total === 0 ? <p className="kit-empty">This case has no clues: guess.</p> : null}
      <Options options={round.suspects.map((s) => s.label)} picked={picked} right={done ? right : null} onPick={choose} disabled={done} />
      <div className="kit-game-tools">
        <button type="button" className="kit-btn" onClick={more} disabled={done || shown >= total}>
          {shown >= total ? "All clues shown" : "Next clue (Space)"}
        </button>
        <span className="kit-note">
          {done
            ? `The machine committed at clue ${commit.clue}${commit.forced ? " (forced)" : ""} to ${label(commit.pick)}: ${machine} ${machine === 1 ? "point" : "points"}.`
            : shown >= commit.clue
              ? "The machine has committed."
              : "The machine is still reading."}
        </span>
      </div>
      {done ? (
        <p className="kit-quiz-feedback" aria-live="polite">
          {picked === right ? `Right: ${label(round.answer)}, on clue ${shown}.` : `It was ${label(round.answer)}.`}
        </p>
      ) : null}
    </RoundBox>
  );
}

/** <TwoChoice round={round} onAnswer={(r) => …} />: which of two sentences is real. */
export function TwoChoice({ round, onAnswer, answered, autoFocus }: RoundProps<TwoRound>) {
  const [picked, setPicked] = useState<number | null>(typeof answered === "number" ? answered : null);
  const done = picked !== null;
  const choose = (i: number) => {
    if (done || i < 0 || i > 1) return;
    setPicked(i);
    onAnswer({ correct: i === round.answer, points: i === round.answer ? 1 : 0 });
  };
  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const i = KEYS.indexOf(e.key);
    if (!done && i >= 0 && i < 2) {
      e.preventDefault();
      choose(i);
    }
  };
  return (
    <RoundBox label="Which sentence is real? Keys 1 and 2 answer" onKey={onKey} autoFocus={autoFocus}>
      <p className="kit-quiz-ask">{round.ask ?? "One of these was written by a person, the other by a model. Which is real?"}</p>
      <Options options={round.options.map((o) => <q key={o}>{o}</q>)} picked={picked} right={done ? round.answer : null} onPick={choose} disabled={done} />
      {done ? (
        <p className="kit-quiz-feedback" aria-live="polite">
          {picked === round.answer ? "Right." : `The real one was sentence ${round.answer + 1}.`} {round.why ?? ""}
        </p>
      ) : null}
    </RoundBox>
  );
}

/** <FillBlank round={round} onAnswer={(r) => …} seed={3} />: the missing word of a concordance line, among decoys in a seeded order. */
export function FillBlank({ round, onAnswer, seed = 1, answered, autoFocus }: RoundProps<BlankRound>) {
  const options = useMemo(() => shuffle([round.answer, ...round.decoys.filter((d) => d !== round.answer)].slice(0, 4), mulberry32(seed)) as string[], [round, seed]);
  const [picked, setPicked] = useState<number | null>(typeof answered === "string" ? options.indexOf(answered) : null);
  const done = picked !== null;
  const right = options.indexOf(round.answer);
  const choose = (i: number) => {
    if (done || i < 0 || i >= options.length) return;
    setPicked(i);
    onAnswer({ correct: i === right, points: i === right ? 1 : 0 });
  };
  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const i = KEYS.indexOf(e.key);
    if (!done && i >= 0 && i < options.length) {
      e.preventDefault();
      choose(i);
    }
  };
  return (
    <RoundBox label="Fill the blank. Keys 1 to 4 answer" onKey={onKey} autoFocus={autoFocus}>
      <p className="kit-quiz-ask">Which word was cut from this line?</p>
      <p className="kit-quiz-line">
        <span className="kit-quiz-left">{round.left}</span> <mark>{done ? options[right] : "_____"}</mark> <span>{round.right}</span>
      </p>
      {round.source ? <p className="kit-note">{round.source}</p> : null}
      <Options options={options} picked={picked} right={done ? right : null} onPick={choose} disabled={done} />
      {done ? (
        <p className="kit-quiz-feedback" aria-live="polite">
          {picked === right ? "Right." : `It was “${round.answer}”.`}
        </p>
      ) : null}
    </RoundBox>
  );
}

const TYPES: [string, string, string][] = [
  ["mixed", "Mixed", "every kind of round"],
  ["clue", "Suspects", "whose words are these"],
  ["two", "Real or generated", "two sentences"],
  ["blank", "Fill the gap", "a missing word"],
];
const TYPE_LABEL: Record<string, string> = { clue: "Suspects", two: "Real or generated", blank: "Fill the gap" };

type Log = { id: string; type: string; result: RoundResult };

/**
 * <QuizRun rounds={rounds} lengths={[4, 8]} />. `preset` ({ settings, log })
 * opens the run mid-way, with `log` the rounds already answered.
 */
export default function QuizRun({
  rounds,
  lengths = [4, 8],
  seed = 1,
  preset,
  title = "Text rounds",
  dailyToggle = true,
}: {
  rounds: QuizRound[];
  lengths?: number[];
  seed?: number;
  preset?: { settings?: GameSettings; answered?: RoundResult[] };
  title?: string;
  dailyToggle?: boolean;
}) {
  const defaults: GameSettings = { length: String(lengths[0] ?? 4), types: "mixed", ...preset?.settings };
  const pool = (s: GameSettings) => rounds.filter((r) => s.types === "mixed" || r.type === s.types);
  const deal = (s: GameSettings, sd: number) => dealCases(pool(s), Number(s.length), mulberry32(sd)) as QuizRound[];
  const [cases, setCases] = useState<QuizRound[]>(() => (preset ? deal(defaults, seed) : []));
  const [log, setLog] = useState<Log[]>(() => (preset?.answered ?? []).map((result, i) => ({ id: cases[i]?.id ?? String(i), type: cases[i]?.type ?? "clue", result })));
  const [pending, setPending] = useState<RoundResult | null>(null);
  // Rounds take the focus only once the reader has started or moved on, never on a page that opens the run mid-way.
  const [playing, setPlaying] = useState(false);
  const run = useGameRun({
    game: `quiz:${rounds.length}`,
    defaults,
    better: "higher",
    seed,
    autostart: Boolean(preset),
    onStart: (s, sd) => {
      setCases(deal(s, sd));
      setLog([]);
      setPending(null);
      setPlaying(true);
    },
  });
  const tally = log.reduce((t, l) => quizAnswer(t, l.result.correct, l.result.points), quizInit());
  const machine = log.reduce((m, l) => m + (l.result.machine ?? 0), 0);
  const i = log.length;
  const current = cases[i];
  const nextRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (pending) focusWithin(nextRef.current?.closest(".kit-quiz") as HTMLElement | null, nextRef.current);
  }, [pending]);

  const next = () => {
    if (!pending || !current) return;
    const out = [...log, { id: current.id, type: current.type, result: pending }];
    setLog(out);
    setPending(null);
    setPlaying(true);
    if (out.length >= cases.length) run.finish(out.reduce((t, l) => quizAnswer(t, l.result.correct, l.result.points), quizInit()).score);
  };

  const available = pool(run.settings).length;
  const roundSeed = (run.seed + i * 7919) >>> 0;
  const body = (r: QuizRound): ReactNode => {
    const props = { onAnswer: setPending, seed: roundSeed, autoFocus: playing };
    if (r.type === "clue") return <ClueReveal key={`${run.runs}-${i}`} round={r} {...props} />;
    if (r.type === "two") return <TwoChoice key={`${run.runs}-${i}`} round={r} {...props} />;
    return <FillBlank key={`${run.runs}-${i}`} round={r} {...props} />;
  };

  return (
    <div className="kit-quiz">
      <GameShell
        run={run}
        title={title}
        dailyToggle={dailyToggle}
        intro={<p>Guess whose page a few words come from, spot the sentence a model wrote, and restore a missing word. In the suspect rounds a machine that scores each suspect by word counts answers too.</p>}
        segments={[
          { key: "length", label: "Rounds", options: lengths.map((l) => ({ value: String(l), label: `${l} rounds` })) },
          { key: "types", label: "Round types", options: TYPES.map(([value, label, sub]) => ({ value, label, sub, disabled: value !== "mixed" && !rounds.some((r) => r.type === value) })) },
        ]}
        canStart={available > 0}
        startNote={available === 0 ? "No rounds of this type." : available < Number(run.settings.length) ? `Only ${available} rounds of this type: some come round twice.` : undefined}
        startLabel="Deal the rounds"
        hud={[
          { label: "Round", value: `${Math.min(i + 1, cases.length)} of ${cases.length}` },
          { label: "Score", value: tally.score },
          { label: "Streak", value: tally.streak, sub: tally.longest ? `best ${tally.longest}` : undefined },
          { label: "Machine", value: machine, sub: "suspect rounds" },
        ]}
        fmtScore={(v) => `${v} ${v === 1 ? "point" : "points"}`}
        reveal={
          <div className="kit-quiz-reveal">
            <table className="kit-game-table">
              <thead>
                <tr>
                  <th scope="col">Round</th>
                  <th scope="col">Kind</th>
                  <th scope="col" className="num">
                    You
                  </th>
                  <th scope="col" className="num">
                    Machine
                  </th>
                </tr>
              </thead>
              <tbody>
                {log.map((l, j) => (
                  <tr key={j}>
                    <th scope="row">{j + 1}</th>
                    <td>{TYPE_LABEL[l.type] ?? l.type}</td>
                    <td className="num">{l.result.correct ? l.result.points : "✗"}</td>
                    <td className="num">{l.result.machine ?? "–"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="kit-game-verdict">
              {tally.score} {tally.score === 1 ? "point" : "points"}, {tally.right} of {tally.answered} right, longest streak {tally.longest}. The machine scored {machine} on the suspect rounds.
            </p>
          </div>
        }
      >
        {current ? (
          <>
            {body(current)}
            <div className="kit-game-tools">
              <button ref={nextRef} type="button" className="kit-game-start" disabled={!pending} onClick={next}>
                {i + 1 >= cases.length ? "See the results" : "Next round"}
              </button>
            </div>
          </>
        ) : (
          <p className="kit-empty">No rounds to play.</p>
        )}
      </GameShell>
    </div>
  );
}
