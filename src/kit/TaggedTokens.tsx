// A text as a row of token chips, each with an optional tag beneath (a
// part-of-speech, a BIO tag, a lexicon score) and a tone: pos, neg, accent or
// muted. A chip with attrs is a button whose pop-up lists them on hover or
// focus. Spans group runs of chips under one label, as named entities; gram
// lists every n-token window, numbered, and marks the active one's chips. An
// optional textarea above edits the source text and holds the raw string
// (R21). Plain HTML, so it renders on the server. Style: .kit-tt in post.css.
import { useId, useState, type ReactNode } from "react";

export type TokenTone = "pos" | "neg" | "accent" | "muted";
export type TaggedToken = { text: string; tag?: ReactNode; tone?: TokenTone; attrs?: [string, ReactNode][] };
export type TokenSpan = { start: number; end: number; label: ReactNode; tone?: TokenTone };
export type TokenGram = { n: number; active?: number; onActive?: (i: number) => void };
export type TokenSource = { value: string; onChange: (value: string) => void; label: string };

// The spans that fit the tokens, in order, each starting after the last ended.
function fitted(spans: TokenSpan[], n: number): TokenSpan[] {
  const out: TokenSpan[] = [];
  let edge = 0;
  for (const s of [...spans].sort((a, b) => a.start - b.start)) {
    const start = Math.max(0, Math.floor(s.start));
    const end = Math.min(n, Math.floor(s.end));
    if (start < edge || end <= start) continue;
    out.push({ ...s, start, end });
    edge = end;
  }
  return out;
}

function Chip({ token, on, open, onOpen, id }: { token: TaggedToken; on: boolean; open: boolean; onOpen: (open: boolean) => void; id: string }) {
  const cls = `kit-tt-chip${token.tone ? ` kit-tt-${token.tone}` : ""}${on ? " kit-on" : ""}`;
  const body = (
    <>
      <span className="kit-tt-text">{token.text}</span>
      {token.tag !== undefined ? <span className="kit-tt-tag">{token.tag}</span> : null}
    </>
  );
  if (!token.attrs?.length) return <span className={cls}>{body}</span>;
  return (
    <span className="kit-tt-pop-host" onMouseEnter={() => onOpen(true)} onMouseLeave={() => onOpen(false)}>
      <button
        type="button"
        className={cls}
        aria-expanded={open}
        aria-describedby={open ? id : undefined}
        onFocus={() => onOpen(true)}
        onBlur={() => onOpen(false)}
        onKeyDown={(e) => e.key === "Escape" && onOpen(false)}
      >
        {body}
      </button>
      {open ? (
        <span className="kit-tt-pop" role="tooltip" id={id}>
          {token.attrs.map(([k, v]) => (
            <span key={k}>
              <b>{k}</b> {v}
            </span>
          ))}
        </span>
      ) : null}
    </span>
  );
}

/** <TaggedTokens tokens={[{ text: "Iron", tag: "B-PER" }, { text: "Man", tag: "I-PER" }]} spans={[{ start: 0, end: 2, label: "PER" }]} /> */
export default function TaggedTokens({
  tokens,
  spans,
  gram,
  source,
  label = "Tokens",
}: {
  tokens: TaggedToken[];
  spans?: TokenSpan[];
  gram?: TokenGram;
  source?: TokenSource;
  label?: string;
}) {
  const id = useId();
  const [open, setOpen] = useState<number | null>(null);
  const n = gram ? Math.max(1, Math.min(3, Math.round(gram.n))) : 0;
  const windows = gram ? Math.max(0, tokens.length - n + 1) : 0;
  const active = gram?.active !== undefined && gram.active >= 0 && gram.active < windows ? gram.active : null;
  const lit = (i: number) => active !== null && i >= active && i < active + n;
  const chip = (i: number) => (
    <Chip token={tokens[i]} on={lit(i)} open={open === i} onOpen={(o) => setOpen((v) => (o ? i : v === i ? null : v))} id={`${id}-pop-${i}`} />
  );
  const groups = fitted(spans ?? [], tokens.length);
  const items: ReactNode[] = [];
  for (let i = 0, g = 0; i < tokens.length; ) {
    const s = groups[g];
    if (s && s.start === i) {
      items.push(
        <li key={`s${i}`} className={`kit-tt-span${s.tone ? ` kit-tt-${s.tone}` : ""}`}>
          <span className="kit-tt-span-chips">
            {Array.from({ length: s.end - s.start }, (_, k) => (
              <span key={k}>{chip(s.start + k)}</span>
            ))}
          </span>
          <span className="kit-tt-span-label">{s.label}</span>
        </li>,
      );
      i = s.end;
      g++;
    } else {
      items.push(<li key={i}>{chip(i)}</li>);
      i++;
    }
  }
  return (
    <div className="kit-tt">
      {source ? (
        <div className="kit-tt-source">
          <label htmlFor={`${id}-src`}>{source.label}</label>
          <textarea id={`${id}-src`} rows={3} spellCheck={false} value={source.value} onChange={(e) => source.onChange(e.target.value)} />
        </div>
      ) : null}
      {tokens.length === 0 ? (
        <p className="kit-empty">No tokens to show.</p>
      ) : (
        <ol className="kit-tt-row" aria-label={label}>
          {items}
        </ol>
      )}
      {gram ? (
        <div className="kit-tt-grams">
          <h4>
            {windows} {n}-gram {windows === 1 ? "window" : "windows"}
          </h4>
          {windows === 0 ? (
            <p className="kit-empty">Fewer tokens than n: no windows.</p>
          ) : (
            <ol>
              {Array.from({ length: windows }, (_, w) => {
                const text = tokens
                  .slice(w, w + n)
                  .map((t) => t.text)
                  .join(" ");
                return (
                  <li key={w} className={w === active ? "kit-on" : undefined}>
                    <span className="kit-rank">{w + 1}</span>
                    {gram.onActive ? (
                      <button type="button" aria-pressed={w === active} onClick={() => gram.onActive?.(w)} onFocus={() => gram.onActive?.(w)} onMouseEnter={() => gram.onActive?.(w)}>
                        {text}
                      </button>
                    ) : (
                      <span>{text}</span>
                    )}
                  </li>
                );
              })}
            </ol>
          )}
        </div>
      ) : null}
    </div>
  );
}
