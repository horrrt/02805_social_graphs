// A numbered pipeline read top to bottom: one box per step, an arrow between
// two steps with what turns one into the next, and, when any step brings
// one, a worked example beside each step in a second column. Plain HTML, so
// it renders on the server. Style: .kit-flow in post.css.
import type { ReactNode } from "react";

export type FlowStep = { title: ReactNode; body?: ReactNode; transition?: ReactNode; example?: ReactNode; exampleTitle?: ReactNode };

/** <StepFlow steps={[{ title: "Corpus", body: "Start with documents.", transition: "tokenize", example: <code>D1: …</code> }]} /> */
export default function StepFlow({ steps, heads, label }: { steps: FlowStep[]; heads?: [ReactNode, ReactNode]; label?: string }) {
  if (steps.length === 0) return <p className="kit-empty">No steps to show.</p>;
  const worked = steps.some((s) => s.example !== undefined && s.example !== null);
  return (
    <div className={worked ? "kit-flow kit-flow-worked" : "kit-flow"}>
      {heads && worked ? (
        <div className="kit-flow-heads" aria-hidden="true">
          <span>{heads[0]}</span>
          <span>{heads[1]}</span>
        </div>
      ) : null}
      <ol aria-label={label}>
        {steps.map((s, i) => (
          <li key={i}>
            <div className="kit-flow-row">
              <div className="kit-flow-step">
                <span className="kit-flow-n" aria-hidden="true">
                  {i + 1}
                </span>
                <div>
                  <b>{s.title}</b>
                  {s.body ? <p>{s.body}</p> : null}
                </div>
              </div>
              {worked ? (
                <div className={s.example !== undefined && s.example !== null ? "kit-flow-example" : "kit-flow-example kit-flow-none"}>
                  {s.exampleTitle ? <span className="kit-flow-example-title">{s.exampleTitle}</span> : null}
                  {s.example}
                </div>
              ) : null}
            </div>
            {i < steps.length - 1 ? (
              <p className="kit-flow-arrow">
                <span aria-hidden="true">↓</span>
                {s.transition ? <span className="kit-flow-transition">{s.transition}</span> : null}
              </p>
            ) : null}
          </li>
        ))}
      </ol>
    </div>
  );
}
