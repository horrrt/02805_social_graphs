// The prediction prompt cabinet.js prediction() wrote into a host on main:
// a number box and a slider that follow each other, a reveal button, and the
// feedback line. Only the first guess per id is saved (store.js record()); a
// reveal hides the form, unlocks the page and calls onReveal. Rendered by the
// week islands inside their own host, which keeps the "revealed" class.
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useStore } from "@/lib/useStore";
import { predictionScore } from "@/scripts/arcade-core.mjs";
import { weekLabel } from "@/scripts/weeks.js";
import { logbook, record, unlock } from "./store.js";

type Attempt = { id: string; week: number | null; prompt: string; guess: number; answer: number; score: number; date: string };

export type PredictionConfig = {
  id: string;
  week: number;
  prompt: string;
  min?: number;
  max?: number;
  step?: number;
  answer: number;
  unit?: string;
  explain?: string;
  onReveal?: (attempt: Attempt | null) => void;
  allowSkip?: boolean;
  plainLanguage?: boolean;
  autoReveal?: boolean;
};

const loadedOf = (s: { loaded: boolean }) => s.loaded;

/** Renders nothing until the logbook has been read, so the first guess and the button label are known. */
export function Prediction(props: PredictionConfig) {
  const loaded = useStore(logbook, loadedOf);
  return loaded ? <Prompt {...props} /> : null;
}

function Prompt({
  id,
  week,
  prompt,
  min = 0,
  max = 100,
  step = 1,
  answer,
  unit = "",
  explain = "",
  onReveal = () => {},
  allowSkip = false,
  plainLanguage = false,
  autoReveal = true,
}: PredictionConfig) {
  // The saved first guess, as main read it when the prompt was drawn.
  const [previous] = useState<Attempt | undefined>(() => (logbook.getState().attempts as Record<string, Attempt>)[id]);
  const start = String(previous?.guess ?? Math.round((max + min) / 2 / step) * step);
  const [value, setValue] = useState(start);
  const [revealed, setRevealed] = useState(false);
  const [feedback, setFeedback] = useState("");
  const suffix = unit ? " " + unit : "";
  const latest = useRef(onReveal);
  latest.current = onReveal;

  const reveal = (attempt: Attempt | null) => {
    setRevealed(true);
    unlock();
    setFeedback(
      attempt
        ? `You guessed ${attempt.guess}${suffix}. Result: ${answer}${suffix}. ${plainLanguage ? "" : `${attempt.score}/100. `}${explain}`
        : `Result: ${answer}${suffix}. ${explain}`,
    );
    latest.current(attempt);
  };

  const auto = useRef(false);
  useEffect(() => {
    if (auto.current) return;
    auto.current = true;
    if (autoReveal && previous && previous.answer === answer) reveal(previous);
    // Once, when the prompt is drawn, as main did.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    try {
      const guess = Number(value);
      if (value === "") return;
      const score = predictionScore(guess, answer, min, max);
      const attempt = record({ id, week: week ?? null, prompt, guess, answer, score, date: new Date().toISOString() }) as Attempt;
      reveal(attempt);
    } catch (error) {
      setFeedback((error as Error).message);
    }
  };

  return (
    <>
      <div className="prediction-label">
        Make a prediction <span>{weekLabel(week)}</span>
      </div>
      <h2>{prompt}</h2>
      <form className="guess-form" hidden={revealed} onSubmit={submit}>
        <label htmlFor={`guess-${id}`}>
          Your estimate {unit} <span>{`${min}–${max}`}</span>
        </label>
        <div className="guess-row">
          <input id={`guess-${id}`} name="guess" type="number" min={min} max={max} step={step} value={value} required onChange={(e) => setValue(e.target.value)} />
          <input className="guess-range" type="range" aria-label="Adjust your estimate" min={min} max={max} step={step} value={value} onChange={(e) => setValue(e.target.value)} />
          <button type="submit">{previous ? "Replay reveal" : "Reveal result"}</button>
        </div>
        {allowSkip ? (
          <button type="button" className="quiet skip-prediction" onClick={() => reveal(null)}>
            Just show me
          </button>
        ) : null}
      </form>
      <p className="guess-feedback" role="status" aria-live="polite">
        {feedback}
      </p>
    </>
  );
}
