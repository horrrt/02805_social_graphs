// A sentence as word2vec reads it: the tokens as chips, the centre word
// highlighted, its context window tinted and the rest muted, then the
// training pairs the window yields. Skip-gram pairs the centre with each
// context word; CBOW predicts the centre from the whole window at once.
// Negative pairs put the centre beside words drawn from outside (passed in,
// so the component never draws at random). With onCentre the chips are
// buttons that move the centre. Style: .kit-tokens in post.css.

export type W2vMode = "skipgram" | "cbow";

/** The indices of the centre's context: up to `window` tokens either side, inside the sentence. */
export function contextOf(n: number, centre: number, window: number): number[] {
  const out: number[] = [];
  for (let i = Math.max(0, centre - window); i <= Math.min(n - 1, centre + window); i++) if (i !== centre) out.push(i);
  return out;
}

/** <TokenWindow tokens={["the", "puppy", "chased", "the", "ball"]} centre={2} window={2} negatives={["cloud"]} /> */
export default function TokenWindow({
  tokens,
  centre,
  window,
  onCentre,
  negatives = [],
  mode = "skipgram",
}: {
  tokens: string[];
  centre: number;
  window: number;
  onCentre?: (i: number) => void;
  negatives?: string[];
  mode?: W2vMode;
}) {
  if (tokens.length === 0) return <p className="kit-empty">No tokens to show.</p>;
  const c = Math.max(0, Math.min(tokens.length - 1, centre));
  const ctx = contextOf(tokens.length, c, Math.max(0, window));
  const inWindow = new Set(ctx);
  const word = tokens[c];
  const kind = (i: number) => (i === c ? "kit-tok-centre" : inWindow.has(i) ? "kit-tok-ctx" : "kit-tok-out");
  return (
    <div className="kit-tokens">
      <ol className="kit-tok-row" aria-label="Tokens; the centre word and its context window are marked">
        {tokens.map((t, i) => (
          <li key={i}>
            {onCentre ? (
              <button type="button" className={kind(i)} aria-pressed={i === c} onClick={() => onCentre(i)}>
                {t}
              </button>
            ) : (
              <span className={kind(i)}>{t}</span>
            )}
          </li>
        ))}
      </ol>
      <div className="kit-pairs">
        <div>
          <h4>{mode === "cbow" ? "CBOW: context predicts the centre" : "Skip-gram: centre predicts each context word"}</h4>
          {ctx.length === 0 ? (
            <p className="kit-empty">No context: the window is 0 or the sentence is one word.</p>
          ) : (
            <ul>
              {mode === "cbow" ? (
                <li>
                  {ctx.map((i) => tokens[i]).join(" ")} → <b>{word}</b>
                </li>
              ) : (
                ctx.map((i) => (
                  <li key={i}>
                    <b>{word}</b> → {tokens[i]}
                  </li>
                ))
              )}
            </ul>
          )}
        </div>
        <div>
          <h4>Negative samples</h4>
          {negatives.length === 0 ? (
            <p className="kit-empty">No negative samples.</p>
          ) : (
            <ul>
              {negatives.map((n, i) => (
                <li key={i}>
                  <b>{word}</b> × <s>{n}</s>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      <p className="kit-note">
        {mode === "cbow" ? 1 : ctx.length} positive {mode === "cbow" || ctx.length === 1 ? "example" : "examples"}, {negatives.length} negative.
      </p>
    </div>
  );
}
