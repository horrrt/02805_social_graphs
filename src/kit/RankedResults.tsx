// Ranked documents from one or more engines, a column each side by side:
// title, snippet and a score bar per result, bars on each column's own scale
// (engines score on different scales). Hovering or focusing a result marks the
// same document in the other columns, so the reader sees where each engine
// put it. An optional query input above holds the raw string (R21), with
// preset queries as buttons. Plain HTML, so it renders on the server. Style:
// .kit-results in post.css.
import { useId, useState, type FormEvent, type ReactNode } from "react";

export type ResultDoc = { key: string; title: ReactNode; snippet?: ReactNode; score: number; scoreLabel?: ReactNode };
export type ResultColumn = { key: string; title: ReactNode; sub?: ReactNode; results: ResultDoc[]; empty?: ReactNode };
export type ResultQuery = { value: string; onChange: (value: string) => void; label?: string; presets?: string[]; onSubmit?: () => void };

/** <RankedResults columns={[{ key: "tfidf", title: "TF-IDF", results: [{ key: "d1", title: "Anole", score: 0.4 }] }]} query={{ value: q, onChange: setQ, presets: ["mutant"] }} /> */
export default function RankedResults({ columns, query, limit = 6 }: { columns: ResultColumn[]; query?: ResultQuery; limit?: number }) {
  const id = useId();
  const [hot, setHot] = useState<string | null>(null);
  const submit = (e: FormEvent) => {
    e.preventDefault();
    query?.onSubmit?.();
  };
  return (
    <div className="kit-results">
      {query ? (
        <form className="kit-results-query" onSubmit={submit} role="search">
          <label htmlFor={id}>{query.label ?? "Query"}</label>
          <input id={id} type="search" autoComplete="off" spellCheck={false} value={query.value} onChange={(e) => query.onChange(e.target.value)} />
          {query.presets?.length ? (
            <span className="kit-results-presets" role="group" aria-label="Example queries">
              {query.presets.map((p) => (
                <button key={p} type="button" aria-pressed={query.value === p} onClick={() => query.onChange(p)}>
                  {p}
                </button>
              ))}
            </span>
          ) : null}
        </form>
      ) : null}
      {columns.length === 0 ? (
        <p className="kit-empty">No engines to compare.</p>
      ) : (
        <div className="kit-results-cols" style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))` }}>
          {columns.map((col) => {
            const shown = col.results.slice(0, Math.max(0, limit));
            const max = Math.max(0, ...shown.map((r) => r.score));
            return (
              <section key={col.key} className="kit-results-col" aria-label={typeof col.title === "string" ? col.title : undefined}>
                <h4>{col.title}</h4>
                {col.sub ? <p className="kit-results-sub">{col.sub}</p> : null}
                {shown.length === 0 ? (
                  <p className="kit-empty">{col.empty ?? "No documents match."}</p>
                ) : (
                  <ol>
                    {shown.map((r, i) => (
                      <li
                        key={r.key}
                        className={hot === r.key ? "kit-on" : undefined}
                        tabIndex={0}
                        onMouseEnter={() => setHot(r.key)}
                        onMouseLeave={() => setHot(null)}
                        onFocus={() => setHot(r.key)}
                        onBlur={() => setHot(null)}
                      >
                        <span className="kit-results-head">
                          <b>
                            {i + 1}. {r.title}
                          </b>
                          <span className="kit-num">{r.scoreLabel ?? r.score.toFixed(3)}</span>
                        </span>
                        <span className="kit-track" aria-hidden="true">
                          <span className="kit-seg" style={{ width: `${max > 0 ? Math.max(0, r.score / max) * 100 : 0}%` }} />
                        </span>
                        {r.snippet ? <span className="kit-results-snippet">{r.snippet}</span> : null}
                      </li>
                    ))}
                  </ol>
                )}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
