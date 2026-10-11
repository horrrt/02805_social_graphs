// A document as a mixture of topics: one 100% bar split by share, a card per
// part with its share, and, for the focused part, the words it puts most
// probability on. Shares are normalised to sum to 1, so rounding in the data
// cannot push the bar past its end. With onFocus the segments and cards are
// buttons. Style: .kit-mix in post.css.
import { cssColour } from "./svgBits";

export type MixPart = { label: string; share: number; color?: string };

// Series colours in order for parts that bring none.
const SERIES = ["--access", "--people", "--w4-group-0", "--w4-group-1", "--ink-mute"];

const percent = (v: number) => `${(v * 100).toFixed(v > 0 && v < 0.01 ? 1 : 0)}%`;

/** <MixtureBar parts={[{ label: "Crime", share: 0.78 }, { label: "Space", share: 0.22 }]} focus="Crime" words={[["gang", 0.14]]} /> */
export default function MixtureBar({
  parts,
  focus,
  onFocus,
  words,
}: {
  parts: MixPart[];
  focus?: string;
  onFocus?: (label: string) => void;
  words?: [string, number][];
}) {
  const total = parts.reduce((s, p) => s + Math.max(0, p.share), 0);
  if (parts.length === 0 || total <= 0) return <p className="kit-empty">No mixture to show.</p>;
  const shown = parts.map((p, i) => ({ ...p, share: Math.max(0, p.share) / total, colour: cssColour(p.color ?? SERIES[i % SERIES.length]) }));
  const topWord = Math.max(0, ...(words ?? []).map((w) => w[1]));
  const focused = shown.find((p) => p.label === focus);
  return (
    <div className="kit-mix">
      <div className="kit-mix-bar" role="img" aria-label={shown.map((p) => `${p.label} ${percent(p.share)}`).join(", ")}>
        {shown.map((p) => (
          <span
            key={p.label}
            className={p.label === focus ? "kit-mix-seg kit-on" : "kit-mix-seg"}
            style={{ width: `${p.share * 100}%`, background: `color-mix(in srgb, ${p.colour} ${p.label === focus ? 45 : 22}%, var(--card))`, boxShadow: `inset 0 -3px 0 ${p.colour}` }}
          >
            {p.share >= 0.1 ? p.label : null}
          </span>
        ))}
      </div>
      <ul className="kit-mix-cards">
        {shown.map((p) => {
          const body = (
            <>
              <small>{p.label}</small>
              <b>{percent(p.share)}</b>
            </>
          );
          return (
            <li key={p.label} style={{ borderTopColor: p.colour }}>
              {onFocus ? (
                <button type="button" aria-pressed={p.label === focus} onClick={() => onFocus(p.label)}>
                  {body}
                </button>
              ) : (
                <div className={p.label === focus ? "kit-on" : undefined}>{body}</div>
              )}
            </li>
          );
        })}
      </ul>
      {words && focused ? (
        <div className="kit-mix-words">
          <h4>Top words in {focused.label}</h4>
          {words.length === 0 ? <p className="kit-empty">No words for this part.</p> : null}
          <ul>
            {words.map(([w, prob]) => (
              <li key={w}>
                <span className="kit-word">{w}</span>
                <span className="kit-track" aria-hidden="true">
                  <span className="kit-seg" style={{ width: `${topWord > 0 ? (prob / topWord) * 100 : 0}%`, background: focused.colour }} />
                </span>
                <span className="kit-num">{prob.toFixed(2)}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
