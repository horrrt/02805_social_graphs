// Cold Read, round 4 (Tezgüino). A word from the Marvel pages is hidden and
// shown only as its row of the word-context matrix: the words found near it.
// Wider windows, PPMI weights and peeks at real sentences cost points; the
// player picks the hidden word from four. Rules live in contexts.ts; this
// file renders them.
import { Fragment, useEffect, useRef, useState } from "react";
import { COST, type HiddenWord, LIVES, MAX_STREAK, options, pieces, points, type Row, spent, type TezguinoData, type Weight } from "./contexts";
import { ScoreBox, SkipLevel } from "./LevelParts";
import { LIMIT, speed, Ticker, timed, useCountdown } from "./pace";
import { tezguinoTour } from "./tours";
import { StartButtons, useTour } from "./Tutorial";
import { FINISH, type Level } from "./levels";
import { shuffled } from "./rules";

const BEST = "cold-read:best4";

type Phase = "intro" | "play" | "answered" | "over";

function readBest() {
  try {
    return Number(localStorage.getItem(BEST)) || 0;
  } catch {
    return 0;
  }
}

function saveBest(score: number) {
  try {
    localStorage.setItem(BEST, String(score));
  } catch {
    // Private windows may refuse storage; the best score is a convenience.
  }
}

export function Intro() {
  return (
    <ol className="cr-steps">
      <li>
        <b>Read</b> the company a hidden word keeps: the words found within a window of it across the 303 pages.
      </li>
      <li>
        <b>Buy</b> a clearer view: a wider window (−{COST.window} a step), PPMI weights in place of raw counts (−{COST.ppmi}), or a real sentence
        with the word blacked out (−{COST.peek}).
      </li>
      <li>
        <b>Pick</b> the word from four, keys 1 to 4, before the {LIMIT.contexts}-second clock runs out. Fewer tools and a quicker pick pay more; a wrong
        pick, or the clock, costs one of {LIVES} lives.
      </li>
    </ol>
  );
}

function ContextRow({ row, weight }: { row: Row; weight: Weight }) {
  const max = row[0]?.[1] || 1;
  return (
    <ol className="cr-ctx" data-weight={weight}>
      {row.map(([c, v]) => (
        <li key={c}>
          <span className="cr-ctx-word">{c}</span>
          <span className="cr-ctx-bar">
            <span style={{ width: `${(v / max) * 100}%` }} />
          </span>
          <span className="cr-num">{weight === "counts" ? `×${v}` : v.toFixed(2)}</span>
        </li>
      ))}
    </ol>
  );
}

function Sentence({ text, word }: { text: string; word: string | null }) {
  const parts = pieces(text);
  return (
    <p className="cr-sentence">
      {parts.map((p, i) => (
        <Fragment key={i}>
          {p}
          {i < parts.length - 1 ? word ? <mark>{word}</mark> : <span className="cr-blackout" aria-label="hidden word">tezgüino</span> : null}
        </Fragment>
      ))}
    </p>
  );
}

export function TezguinoGame({ data, random = Math.random, level, clock = Date.now }: {
  data: TezguinoData; random?: () => number; level?: Level; clock?: () => number;
}) {
  const [dealt, setDealt] = useState(0);
  const [factor, setFactor] = useState(1);
  const [timeUp, setTimeUp] = useState(false);
  const [phase, setPhase] = useState<Phase>("intro");
  const [order, setOrder] = useState<number[]>([]);
  const [at, setAt] = useState(0);
  const [choices, setChoices] = useState<number[]>([]);
  const [span, setSpan] = useState(1);
  const [reach, setReach] = useState(1);
  const [weight, setWeight] = useState<Weight>("counts");
  const [ppmi, setPpmi] = useState(false);
  const [peeks, setPeeks] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(LIVES);
  const [streak, setStreak] = useState(0);
  const [solved, setSolved] = useState(0);
  const [best, setBest] = useState(0);
  const [gained, setGained] = useState(0);
  const nextBtn = useRef<HTMLButtonElement>(null);

  useEffect(() => setBest(readBest()), []);
  useEffect(() => {
    if (phase === "answered" || phase === "over") nextBtn.current?.focus();
  }, [phase]);

  // Keys 1 to 4 pick an answer.
  useEffect(() => {
    if (phase !== "play") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || !/^[1-4]$/.test(e.key)) return;
      (document.getElementById(`cr-pick-${Number(e.key) - 1}`) as HTMLButtonElement | null)?.click();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase]);

  const hidden: HiddenWord | null = order.length ? data.words[order[at % order.length]] : null;
  const cost = spent(reach, ppmi, peeks);
  const nextStreak = Math.min(streak + 1, MAX_STREAK);

  const deal = (n: number, ord = order) => {
    const answer = ord[n % ord.length];
    setAt(n);
    setChoices(options(data.words.length, answer, random));
    setSpan(1);
    setReach(1);
    setWeight("counts");
    setPpmi(false);
    setPeeks(0);
    setPicked(null);
    setDealt((d) => d + 1);
    setTimeUp(false);
    setPhase("play");
  };

  const start = () => {
    const ord = shuffled(data.words.map((_, i) => i), random);
    setOrder(ord);
    setScore(0);
    setLives(LIVES);
    setStreak(0);
    setSolved(0);
    deal(0, ord);
  };
  const tour = useTour(tezguinoTour, start);

  const widen = (k: number) => {
    if (k > reach) setReach(k);
    setSpan(k);
  };

  const usePpmi = () => {
    setPpmi(true);
    setWeight("ppmi");
  };

  // A right pick scores what the tools left of 1,000, times the streak and the speed. -1 is the clock running out.
  const pick = (i: number) => {
    if (!hidden || phase !== "play") return;
    const f = speed(pace.stop(), LIMIT.contexts);
    setFactor(f);
    setTimeUp(i === -1);
    setPicked(i);
    const right = i === order[at % order.length];
    if (right) {
      const run = streak + 1;
      const got = timed(points(cost, run), f);
      const total = score + got;
      setStreak(run);
      setScore(total);
      setSolved((s) => s + 1);
      setGained(got);
      if (total > best) {
        setBest(total);
        saveBest(total);
      }
      setPhase("answered");
    } else {
      const left = lives - 1;
      setStreak(0);
      setGained(0);
      setLives(left);
      setPhase(left === 0 ? "over" : "answered");
    }
  };

  const answered = phase === "answered" || phase === "over";
  const pace = useCountdown(LIMIT.contexts, phase === "play", dealt, () => pick(-1), clock);
  const now = speed(pace.elapsed, LIMIT.contexts);
  const right = picked !== null && hidden !== null && picked === order[at % order.length];

  return (
    <section className="cr-table" id="tezguino" aria-label="Tezgüino">
      <div className="cr-hud" role="status">
        <ScoreBox points={score} level={level} />
        <Ticker countdown={pace} limitS={LIMIT.contexts} active={phase === "play"} />
        <span className="cr-box">
          <small>Streak</small>
          <b data-hot={(phase === "play" ? nextStreak : streak) > 1}>×{Math.max(1, Math.min(phase === "play" ? nextStreak : streak, MAX_STREAK))}</b>
        </span>
        <span className="cr-box">
          <small>Lives</small>
          <span className="cr-lives" aria-label={`${lives} of ${LIVES}`}>
            {Array.from({ length: LIVES }, (_, i) => (
              <span key={i} data-on={i < lives} />
            ))}
          </span>
        </span>
        <span className="cr-box">
          <small>Named</small>
          <b>{solved}</b>
        </span>
        {level ? null : (
          <span className="cr-box">
            <small>Best</small>
            <b>{best.toLocaleString("en")}</b>
          </span>
        )}
        <SkipLevel points={score} level={level} />
      </div>

      {phase === "intro" || !hidden ? (
        <div className="cr-start">
          <Intro />
          <StartButtons label="Hide the first word" start={start} tour={tour} round="contexts" />
        </div>
      ) : (
        <>
          <div className="cr-hc-clue">
            <span className="cr-h">Word {at + 1}</span>
            {/* No letter tiles while playing: with four options to pick from, the length alone would name the word. */}
            {answered ? (
              <span className="cr-tiles" aria-label={hidden.w}>
                {[...hidden.w].map((ch, i) => (
                  <span key={i} data-open>
                    {ch}
                  </span>
                ))}
              </span>
            ) : null}
            <span className="cr-hc-df">
              used <b>{hidden.uses}</b> times on {hidden.df} pages
            </span>
            {phase === "play" ? (
              <span className="cr-worth">
                Pick it now for <b>{timed(points(cost, nextStreak), now).toLocaleString("en")}</b>
              </span>
            ) : null}
          </div>

          <div className="cr-field cr-tz">
            <div className="cr-board">
              <div className="cr-tz-tools">
                <span className="cr-seg" role="group" aria-label="Context window">
                  {data.windows.map((k) => (
                    <button
                      key={k}
                      type="button"
                      aria-pressed={span === k}
                      onClick={() => widen(k)}
                      aria-label={`Window ±${k}${k > reach && !answered ? `, costs ${COST.window * (k - reach)}` : ""}`}
                    >
                      ±{k}
                      {k > reach && !answered ? <small>−{COST.window * (k - reach)}</small> : null}
                    </button>
                  ))}
                </span>
                <span className="cr-seg" role="group" aria-label="Weights">
                  <button type="button" aria-pressed={weight === "counts"} onClick={() => setWeight("counts")}>
                    Counts
                  </button>
                  <button type="button" aria-pressed={weight === "ppmi"} onClick={() => (ppmi || answered ? setWeight("ppmi") : usePpmi())}>
                    PPMI{!ppmi && !answered ? <small>−{COST.ppmi}</small> : null}
                  </button>
                </span>
              </div>
              <h2 className="cr-h">
                Its company within ±{span} {span === 1 ? "word" : "words"}, by {weight === "counts" ? "raw count" : "PPMI"}
              </h2>
              <ContextRow row={hidden.rows[weight][String(span)]} weight={weight} />
            </div>

            <aside className="cr-leads" aria-label="Pick the word">
              <h2 className="cr-h">Which word keeps this company?</h2>
              <div className="cr-picks">
                {choices.map((i, n) => (
                  <button
                    key={i}
                    id={`cr-pick-${n}`}
                    type="button"
                    className="cr-pick"
                    data-state={answered ? (i === order[at % order.length] ? "answer" : i === picked ? "wrong" : "") : ""}
                    onClick={() => pick(i)}
                    disabled={answered}
                  >
                    <span className="cr-key">{n + 1}</span>
                    {data.words[i].w}
                  </button>
                ))}
              </div>
              <div className="cr-peeks">
                {hidden.sentences.slice(0, answered ? hidden.sentences.length : peeks).map((s, i) => (
                  <Sentence key={i} text={s} word={answered ? hidden.w : null} />
                ))}
                {!answered && peeks < hidden.sentences.length ? (
                  <button type="button" className="cr-ghost" onClick={() => setPeeks(peeks + 1)}>
                    Peek at a sentence −{COST.peek}
                  </button>
                ) : null}
              </div>
            </aside>
          </div>

          {answered ? (
            <div className="cr-result" data-won={right}>
              <div className="cr-case">
                <p className="cr-stamp">{right ? `Right · +${gained.toLocaleString("en")} (×${factor.toFixed(2)} speed)` : timeUp ? "Time's up · −1 life" : "Wrong · −1 life"}</p>
                <p className="cr-verdict">{hidden.w}</p>
                {phase === "over" ? (
                  <div className="cr-over">
                    <p>
                      Run over: {solved} {solved === 1 ? "word" : "words"} named, {score.toLocaleString("en")} points.
                    </p>
                    <button ref={nextBtn} type="button" className="cr-go" onClick={level ? () => level.onDone(score) : start}>
                      {level ? FINISH : "Play again"}
                    </button>
                  </div>
                ) : (
                  <button ref={nextBtn} type="button" className="cr-go" onClick={level && at + 1 >= level.items ? () => level.onDone(score) : () => deal(at + 1)}>
                    {level && at + 1 >= level.items ? FINISH : "Next word"}
                  </button>
                )}
              </div>
            </div>
          ) : null}

          {answered ? (
            <div className="cr-debrief">
              <h3>Same word, two weightings</h3>
              <div className="cr-tz-compare">
                <div>
                  <span className="cr-h">Raw counts, ±{span}</span>
                  <ContextRow row={hidden.rows.counts[String(span)]} weight="counts" />
                </div>
                <div>
                  <span className="cr-h">PPMI, ±{span}</span>
                  <ContextRow row={hidden.rows.ppmi[String(span)]} weight="ppmi" />
                </div>
              </div>
              <p>
                Raw counts reward words that sit next to everything, like <i>the</i> and <i>of</i>. PMI asks whether a pair turns up more often than
                chance would put it together, and PPMI keeps only the pairs that do:
              </p>
              <p className="cr-formula">
                PPMI(w, c) = max(<span>log₂ P(w, c) / (P(w) P(c))</span>, 0)
              </p>
              <p>
                A narrow window catches grammar, the words right beside it; a wide one catches the topic around it. You read a word you did not know from
                the company it keeps, as with tezgüino.
              </p>
            </div>
          ) : null}
        </>
      )}
    </section>
  );
}
