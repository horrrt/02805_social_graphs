// A describe-without-naming round: the reader types words one at a time, the
// `score` function ranks every item by the words so far, and the round is won
// when the target ranks first on its own. Shows the words spent as chips
// (banned ones struck through), "n / budget", the live top ten with the target
// marked, and the target's rank when it is outside them. The rules live in
// guess-core.js; the input keeps the raw string (R21) and guess-core trims it.
// Style: .kit-guess in post.css.
import { useId, useMemo, useState, type FormEvent } from "react";
import { addWord, left, points as pointsOf, ranking, scored, start } from "./guess-core.js";

export type GuessItem = { key: string; label: string };
export type Scores = Map<string, number> | Record<string, number>;

type Used = { word: string; banned: boolean };
type State = { budget: number; used: Used[]; won: boolean };

const MESSAGES: Record<string, string> = {
  empty: "Type a word first.",
  repeat: "You have used that word already.",
  done: "This round is over.",
  banned: "That word is banned: it costs a word and scores nothing.",
};

/** <GuessRanker items={items} score={(words) => scores} target="wolverine" budget={8} banned={(w) => w === "logan"} /> */
export default function GuessRanker({
  items,
  score,
  target,
  budget,
  banned,
}: {
  items: GuessItem[];
  score: (words: string[]) => Scores;
  target: string;
  budget: number;
  banned?: (word: string) => boolean;
}) {
  const id = useId();
  const [state, setState] = useState<State>(() => start(budget));
  const [text, setText] = useState("");
  const [message, setMessage] = useState("");
  const labels = useMemo(() => new Map(items.map((i) => [i.key, i.label])), [items]);
  const words = scored(state) as string[];
  // Keyed on the words' text, as scored() returns a new array on every render.
  const said = words.join("\n");
  const all = useMemo(() => (said ? ranking(score(said.split("\n"))) : []), [score, said]);
  const top = all.slice(0, 10);
  const max = Math.max(0, ...top.map((r) => r.score));
  const targetRow = all.find((r) => r.key === target);
  const over = state.won || left(state) === 0;

  function submit(e: FormEvent) {
    e.preventDefault();
    const { state: next, status } = addWord(state, text, { banned, score, target });
    setState(next);
    setMessage(MESSAGES[status] ?? "");
    if (status === "added" || status === "banned") setText("");
  }

  function reset() {
    setState(start(budget));
    setText("");
    setMessage("");
  }

  return (
    <div className="kit-guess">
      <div className="kit-guess-side">
        <p className="kit-guess-target">
          Target: <b>{labels.get(target) ?? target}</b>
        </p>
        <form className="kit-guess-form" onSubmit={submit}>
          <label htmlFor={id}>One word that describes the target</label>
          <div>
            <input id={id} type="text" autoComplete="off" spellCheck={false} value={text} disabled={over} onChange={(e) => setText(e.target.value)} />
            <button type="submit" disabled={over}>
              Say it
            </button>
          </div>
        </form>
        <p className="kit-guess-count">
          <b>
            {state.used.length} / {state.budget}
          </b>{" "}
          words used
        </p>
        <ul className="kit-guess-chips" aria-label="Words used">
          {state.used.length === 0 ? <li className="kit-empty">Your words appear here.</li> : null}
          {state.used.map((u) => (
            <li key={u.word} className={u.banned ? "kit-banned" : undefined}>
              {u.banned ? <s>{u.word}</s> : u.word}
            </li>
          ))}
        </ul>
        <p className="kit-guess-status" aria-live="polite">
          {state.won
            ? `Solved in ${state.used.length} ${state.used.length === 1 ? "word" : "words"}: ${pointsOf(state)} ${pointsOf(state) === 1 ? "point" : "points"}.`
            : left(state) === 0
              ? `Out of words. ${labels.get(target) ?? target} ranks ${targetRow ? `#${targetRow.rank}` : "nowhere"}.`
              : message}
        </p>
        {state.used.length ? (
          <button type="button" className="kit-link" onClick={reset}>
            Start again
          </button>
        ) : null}
      </div>
      <div className="kit-guess-board">
        <h4>What the ranking thinks</h4>
        {top.length === 0 ? (
          <p className="kit-empty">Nothing to rank yet. Say a word.</p>
        ) : (
          <ol>
            {top.map((r) => (
              <li key={r.key} className={r.key === target ? "kit-target" : undefined}>
                <span className="kit-rank">{r.rank}</span>
                <span className="kit-word">
                  {labels.get(r.key) ?? r.key}
                  {r.key === target ? <em> target</em> : null}
                </span>
                <span className="kit-track" aria-hidden="true">
                  <span className="kit-seg" style={{ width: `${max > 0 ? (Math.max(0, r.score) / max) * 100 : 0}%` }} />
                </span>
                <span className="kit-num">{r.score.toFixed(2)}</span>
              </li>
            ))}
          </ol>
        )}
        {targetRow && targetRow.rank > 10 ? (
          <p className="kit-note">
            {labels.get(target) ?? target} is #{targetRow.rank} of {all.length}.
          </p>
        ) : null}
        {state.won ? <p className="kit-guess-win">{labels.get(target) ?? target} is number one.</p> : null}
      </div>
    </div>
  );
}
