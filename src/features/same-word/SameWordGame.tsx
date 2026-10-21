// Same Word, Different Worlds, the Week 7 game for section 1. Each round is
// one word in two sentences and a line on how the model makes the word's
// vector. The player says how the two representations compare and which kind
// of model works that way, taps the words that set the sense on some rounds,
// then sees both kinds of model side by side. The rounds and the scoring are
// in rounds.ts; this file renders them, and takes the rounds as a prop so
// tests can play it without a page.
import { type Ref, useEffect, useRef, useState } from "react";
import { BestBox, ScoreBox, Stat, useBest, useKeys } from "@/features/cold-read/LevelParts";
import { Rules } from "@/features/cold-read/StartPanel";
import {
  COMPARE,
  type Compare,
  compareAnswer,
  maxScore,
  METHOD,
  type Method,
  methodAnswer,
  type Pick,
  POINTS,
  ROUNDS,
  type Round,
  scoreRound,
  targetIndex,
  tokens,
} from "./rounds";

const BEST = "same-word:best";

type Phase = "intro" | "predict" | "clues" | "reveal" | "done";
type Result = ReturnType<typeof scoreRound> & { id: string; compare: Compare; method: Method; picks: Pick[] };

const label = (pairs: [string, string][], key: string) => pairs.find(([k]) => k === key)![1];

export function Intro() {
  return (
    <Rules
      rules={[
        ["Read", "one word in two sentences, and how the model makes its vector."],
        ["Predict", "whether the two get the same representation, and which kind of model does that."],
        ["Spot", "the words that tell you which meaning each sentence has."],
      ]}
    />
  );
}

export function SameWordGame({ rounds = ROUNDS }: { rounds?: Round[] }) {
  const [phase, setPhase] = useState<Phase>("intro");
  const [at, setAt] = useState(0);
  const [compare, setCompare] = useState<Compare | null>(null);
  const [method, setMethod] = useState<Method | null>(null);
  const [picks, setPicks] = useState<Pick[]>([]);
  const [results, setResults] = useState<Result[]>([]);
  const { best, record } = useBest(BEST);
  const [isNew, setIsNew] = useState(false);
  const action = useRef<HTMLButtonElement>(null);
  const table = useRef<HTMLElement>(null);

  const round = rounds[at];
  const total = results.reduce((sum, r) => sum + r.points, 0);

  useEffect(() => {
    if (phase === "reveal" || phase === "done") action.current?.focus({ preventScroll: true });
    if (phase === "predict") table.current?.querySelector<HTMLInputElement>(".sw-q input")?.focus({ preventScroll: true });
    if (phase === "clues") table.current?.querySelector<HTMLButtonElement>(".sw-token:not(:disabled)")?.focus({ preventScroll: true });
    if (phase !== "intro") table.current?.scrollIntoView?.({ block: "nearest" });
  }, [phase, at]);

  const fresh = () => {
    setCompare(null);
    setMethod(null);
    setPicks([]);
  };

  const start = () => {
    setAt(0);
    fresh();
    setResults([]);
    setIsNew(false);
    setPhase("predict");
  };

  const finish = (chosen: Pick[]) => {
    setResults([...results, { id: round.id, compare: compare!, method: method!, picks: chosen, ...scoreRound(round, compare!, method!, chosen) }]);
    setPhase("reveal");
  };

  const submit = () => {
    if (!compare || !method) return;
    if (round.clues) setPhase("clues");
    else finish([]);
  };

  const toggle = (p: Pick) => setPicks(picks.includes(p) ? picks.filter((x) => x !== p) : [...picks, p]);

  const next = () => {
    if (at + 1 >= rounds.length) {
      setIsNew(record(total));
      setPhase("done");
      return;
    }
    setAt(at + 1);
    fresh();
    setPhase("predict");
  };

  // 1 to 3 answer the first question while predicting.
  useKeys(Object.fromEntries(COMPARE.map(([k], i) => [String(i + 1), () => setCompare(k)])), phase === "predict");

  const steps = round?.clues ? (["Predict", "Spot clues", "Feedback"] as const) : (["Predict", "Feedback"] as const);
  const step = phase === "predict" ? 0 : phase === "clues" ? 1 : steps.length - 1;

  return (
    <section className="cr-table sd-table sw-table" id="same-word" aria-label="Same Word, Different Worlds" ref={table}>
      <div className="cr-hud" role="status">
        <ScoreBox points={total} />
        <Stat label="Round">
          {phase === "intro" ? 0 : Math.min(at + 1, rounds.length)}/{rounds.length}
        </Stat>
        <Stat label="Last round">{results.length ? `+${results.at(-1)!.points}` : "–"}</Stat>
        <BestBox best={best} />
      </div>

      {phase === "intro" ? (
        <div className="cr-start">
          <p className="sd-lede">
            A word can mean different things in different sentences. Does its vector change too? That depends on the model. Six rounds, about three
            minutes.
          </p>
          <Intro />
          <div className="cr-start-row">
            <p className="cr-note">
              {POINTS.compare} points for each question you get right, and {POINTS.clue} for each clue word you spot ({POINTS.wrongClue} off for a word
              that is no clue).
            </p>
            <div className="cr-start-go">
              <button type="button" className="cr-go" onClick={start}>
                Start
              </button>
            </div>
          </div>
        </div>
      ) : phase === "done" ? (
        <Final rounds={rounds} results={results} total={total} isNew={isNew} again={start} buttonRef={action} />
      ) : (
        <div className="sd-case">
          <div className="sd-progress">
            <ol className="sd-cases" aria-label={`Round ${at + 1} of ${rounds.length}`}>
              {rounds.map((r, i) => (
                <li key={r.id} data-state={results[i] ? grade(results[i]) : i === at ? "now" : "todo"} />
              ))}
            </ol>
            <ol className="sd-steps" aria-label="Steps">
              {steps.map((s, i) => (
                <li key={s} aria-current={i === step ? "step" : undefined}>
                  <span>{i + 1}</span> {s}
                </li>
              ))}
            </ol>
          </div>

          <span className="cr-h">
            Round {at + 1} · {round.kind}
          </span>

          {phase === "predict" ? (
            <Predict round={round} compare={compare} method={method} onCompare={setCompare} onMethod={setMethod} onSubmit={submit} />
          ) : phase === "clues" ? (
            <Clues round={round} picks={picks} onToggle={toggle} onCheck={() => finish(picks)} />
          ) : (
            <Reveal round={round} result={results[at]} last={at + 1 >= rounds.length} onNext={next} buttonRef={action} />
          )}
        </div>
      )}
    </section>
  );
}

/** A round's colour on the progress bar: both questions right, one, or none. */
function grade(r: Result) {
  return r.compareOk && r.methodOk ? "hit" : r.compareOk || r.methodOk ? "near" : "miss";
}

/** A word lit with a mark, leaving its punctuation outside. */
function Lit({ text, className }: { text: string; className: string }) {
  const [, word, tail] = text.match(/^(.*?)([^A-Za-z']*)$/)!;
  return (
    <>
      <mark className={className}>{word}</mark>
      {tail}
    </>
  );
}

/** A sentence with the round's word lit. With clue marks, the clue words are lit too. */
function Sentence({ round, s, marks }: { round: Round; s: 0 | 1; marks?: boolean }) {
  const sentence = round.sentences[s];
  const target = targetIndex(round, sentence);
  return (
    <p className="sw-sentence">
      <span className="sw-n">{s + 1}</span>
      <span>
        {tokens(sentence).map((t, i) => (
          <span key={i}>
            {i ? " " : ""}
            {i === target ? <Lit text={t.text} className="sw-word" /> : marks && round.clues?.[s].includes(t.word) ? <Lit text={t.text} className="sw-clue" /> : t.text}
          </span>
        ))}
      </span>
    </p>
  );
}

/** The word type, once, and its two occurrences: the distinction every round turns on. */
function TypeLine({ round }: { round: Round }) {
  return (
    <p className="sw-type">
      <span className="sw-chip">{round.word}</span>
      <span>one word type, two occurrences: one in each sentence</span>
    </p>
  );
}

function How({ round }: { round: Round }) {
  return (
    <div className="sw-how" data-method={round.method ?? "none"}>
      <span className="cr-h">How this model makes a word's vector</span>
      <p>{round.how}</p>
    </div>
  );
}

function Predict({ round, compare, method, onCompare, onMethod, onSubmit }: {
  round: Round; compare: Compare | null; method: Method | null; onCompare: (c: Compare) => void; onMethod: (m: Method) => void; onSubmit: () => void;
}) {
  return (
    <div className="sw-predict">
      <div className="sw-read">
        <TypeLine round={round} />
        <Sentence round={round} s={0} />
        <Sentence round={round} s={1} />
        <How round={round} />
      </div>
      <div className="sw-questions">
        <fieldset className="sd-pick sw-q">
          <legend>
            How do the two representations of <b>{round.word}</b> compare?
          </legend>
          {COMPARE.map(([k, text], i) => (
            <label key={k} className="sd-doc" data-on={compare === k}>
              <input type="radio" name={`compare-${round.id}`} value={k} checked={compare === k} onChange={() => onCompare(k)} />
              <span>{text}</span>
              <kbd className="cr-key-inline" aria-hidden="true">
                {i + 1}
              </kbd>
            </label>
          ))}
        </fieldset>
        <fieldset className="sd-pick sw-q">
          <legend>{round.modelQuestion}</legend>
          {METHOD.map(([k, text]) => (
            <label key={k} className="sd-doc" data-on={method === k}>
              <input type="radio" name={`method-${round.id}`} value={k} checked={method === k} onChange={() => onMethod(k)} />
              <span>{text}</span>
            </label>
          ))}
        </fieldset>
        <div className="sd-actions">
          <button type="button" className="cr-go" onClick={onSubmit} disabled={!compare || !method}>
            Submit answer
          </button>
        </div>
      </div>
    </div>
  );
}

function Clues({ round, picks, onToggle, onCheck }: { round: Round; picks: Pick[]; onToggle: (p: Pick) => void; onCheck: () => void }) {
  return (
    <div className="sw-clues">
      <p className="sw-ask">
        Tap the words that tell you which <b>{round.word}</b> each sentence means. A sentence may have none.
      </p>
      {([0, 1] as const).map((s) => {
        const target = targetIndex(round, round.sentences[s]);
        return (
          <p key={s} className="sw-sentence sw-tokens" role="group" aria-label={`Sentence ${s + 1}`}>
            <span className="sw-n">{s + 1}</span>
            <span>
              {tokens(round.sentences[s]).map((t, i) => {
                const p: Pick = `${s}:${i}`;
                return i === target ? (
                  <span key={i}>
                    <Lit text={t.text} className="sw-word" />
                  </span>
                ) : (
                  <button key={i} type="button" className="sw-token" aria-pressed={picks.includes(p)} onClick={() => onToggle(p)}>
                    {t.text}
                  </button>
                );
              })}
            </span>
          </p>
        );
      })}
      <div className="sd-actions">
        <p className="cr-note">
          +{POINTS.clue} for each clue, −{POINTS.wrongClue} for any other word.
        </p>
        <button type="button" className="cr-go" onClick={onCheck}>
          Check
        </button>
      </div>
    </div>
  );
}

function Reveal({ round, result, last, onNext, buttonRef }: { round: Round; result: Result; last: boolean; onNext: () => void; buttonRef: Ref<HTMLButtonElement> }) {
  const c = compareAnswer(round);
  const m = methodAnswer(round);
  return (
    <div className="sw-reveal">
      <div className="sw-feedback">
        <div className="sd-verdict">
          <span className="cr-stamp" data-grade={result.compareOk ? "good" : "bad"}>
            {result.compareOk ? "✓" : "✗"} {label(COMPARE, c)}
          </span>
          <span className="cr-stamp" data-grade={result.methodOk ? "good" : "bad"}>
            {result.methodOk ? "✓" : "✗"} {label(METHOD, m).replace(/ \(.*/, "")}
          </span>
          <span className="sd-bonus">+{result.points} this round</span>
        </div>
        {result.compareOk && result.methodOk ? null : (
          <p className="sw-yours">
            You said: {label(COMPARE, result.compare).toLowerCase()}, {label(METHOD, result.method).replace(/ \(.*/, "").toLowerCase()}.
          </p>
        )}
        <Sentence round={round} s={0} marks={!!round.clues} />
        <Sentence round={round} s={1} marks={!!round.clues} />
        {round.clues ? (
          <p className="sw-clue-score">
            Clue words: {result.clues.right} of {round.clues[0].length + round.clues[1].length} found
            {result.clues.wrong ? `, ${result.clues.wrong} other ${result.clues.wrong === 1 ? "word" : "words"} tapped` : ""}
            {round.clues[0].length === 0 ? `. Sentence 1 has none:nothing in it says which ${round.word}.` : "."}
          </p>
        ) : null}
        <div className="cr-debrief">
          <h3>Why</h3>
          <p>{round.why}</p>
        </div>
        <div className="sd-actions">
          <button ref={buttonRef} type="button" className="cr-go" onClick={onNext}>
            {last ? "See the results" : "Next round →"}
          </button>
        </div>
      </div>
      <Difference round={round} />
    </div>
  );
}

// Eight dots stand for a vector. The shades are a picture, seeded from the
// text so a round always draws the same way; they are not real coordinates.
const DOTS = 8;

function seed(text: string) {
  let h = 2166136261;
  for (const ch of text) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822519);
    h = Math.imul(h ^ (h >>> 13), 3266489917);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  };
}

/** Shades from 0.2 to 1 for one strip, from a text. */
export function shades(text: string) {
  const rand = seed(text);
  return Array.from({ length: DOTS }, () => 0.2 + 0.8 * rand());
}

/** The two contextual strips: unrelated when the senses differ, two dots apart when they agree. */
export function contextualShades(round: Round): [number[], number[]] {
  const a = shades(round.sentences[0]);
  if (round.sense !== "same") return [a, shades(round.sentences[1])];
  const b = a.map((v, i) => (i % 4 === 1 ? 1.2 - v : v));
  return [a, b];
}

function Strip({ values, tone, label }: { values: number[]; tone: "type" | "one" | "two"; label: string }) {
  return (
    <span className="sw-strip" data-tone={tone} role="img" aria-label={label}>
      {values.map((v, i) => (
        <i key={i} style={{ opacity: v }} />
      ))}
    </span>
  );
}

const SENSE_NOTE = {
  different: "Different contexts, so different vectors.",
  same: "Different vectors, close because the two contexts mean similar things.",
  unclear: "Different vectors, but a vague context makes a vague vector.",
} as const;

/** Both kinds of model on this round's word, side by side; the round's own kind is marked. */
function Difference({ round }: { round: Round }) {
  const type = shades(round.word);
  const [a, b] = contextualShades(round);
  return (
    <aside className="sw-diff" aria-label="The difference">
      <h3>The difference</h3>
      <div className="sw-model" data-this={round.method === "static"}>
        {round.method === "static" ? <span className="sw-this">This round's model</span> : null}
        <h4>Static embedding</h4>
        <p>One vector for the word type, whatever the sentence.</p>
        <div className="sw-fan">
          <span className="sw-chip">{round.word}</span>
          <span className="sw-arrows" aria-hidden="true" />
          <span className="sw-pair">
            <Strip values={type} tone="type" label={`${round.word} in sentence 1: the table's one vector`} />
            <Strip values={type} tone="type" label={`${round.word} in sentence 2: the same vector`} />
          </span>
        </div>
        <p className="sw-foot">Both occurrences get the same representation.</p>
      </div>
      <div className="sw-model" data-this={round.method === "contextual"}>
        {round.method === "contextual" ? <span className="sw-this">This round's model</span> : null}
        <h4>Contextual embedding</h4>
        <p>A vector for each occurrence, computed from its sentence.</p>
        <div className="sw-rows">
          <span className="sw-occ">
            {round.word} <small>in sentence 1</small>
          </span>
          <Strip values={a} tone="one" label={`${round.word} in sentence 1: its own vector`} />
          <span className="sw-occ">
            {round.word} <small>in sentence 2</small>
          </span>
          <Strip values={b} tone="two" label={`${round.word} in sentence 2: its own vector`} />
        </div>
        <p className="sw-foot">{SENSE_NOTE[round.sense]}</p>
      </div>
      <p className="cr-note">The dots are a picture of a vector, not real numbers. No model ran in this game.</p>
    </aside>
  );
}

function Final({ rounds, results, total, isNew, again, buttonRef }: {
  rounds: Round[]; results: Result[]; total: number; isNew: boolean; again: () => void; buttonRef: Ref<HTMLButtonElement>;
}) {
  const max = maxScore(rounds);
  const both = results.filter((r) => r.compareOk && r.methodOk).length;
  return (
    <div className="sd-final">
      <span className="cr-h">All rounds played</span>
      <p className="cr-verdict">
        {total.toLocaleString("en")} <small>of {max.toLocaleString("en")} points</small>
      </p>
      <p className="sd-final-sub">
        Both answers right in {both} of {rounds.length} rounds{isNew ? " · a new best in this browser" : ""}.
      </p>
      <ol className="sd-final-list">
        {rounds.map((r, i) => {
          const res = results[i];
          return (
            <li key={r.id} data-grade={res ? grade(res) : undefined}>
              <span className="sw-final-word">
                <b>{r.word}</b> · {r.kind}
              </span>
              <span>
                {label(COMPARE, compareAnswer(r))}, {label(METHOD, methodAnswer(r)).replace(/ \(.*/, "").toLowerCase()}
              </span>
              <b>+{res?.points ?? 0}</b>
            </li>
          );
        })}
      </ol>
      <div className="cr-debrief sd-takeaway">
        <h3>What to take away</h3>
        <p>
          <b>A static embedding</b> such as Word2Vec or GloVe looks a word up: one vector per word type, the same in every sentence, whatever it means
          there. Averaging those vectors gives a sentence a vector, but each word inside it keeps its single meaning.
        </p>
        <p>
          <b>A contextual embedding</b> such as BERT computes a vector for each occurrence from the words around it. The same word gets different
          vectors in different sentences, close when the meanings agree and further apart when they differ.
        </p>
        <p>
          <b>Context changes the vector; it does not guarantee understanding.</b> When the words around a word are vague, the model still produces a
          vector, and it can lean toward the wrong meaning.
        </p>
      </div>
      <div className="sd-actions">
        <button ref={buttonRef} type="button" className="cr-go" onClick={again}>
          Play again
        </button>
      </div>
    </div>
  );
}
