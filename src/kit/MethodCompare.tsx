// One input under several methods, a card each side by side: a numbered
// title, a blurb on how the method reads the input, a body slot for its
// result, a note on what it misses, and an accent rule across the top in the
// card's colour (a token such as "--access", or any CSS colour). Optional
// facts run in a row under the cards. Plain HTML, so it renders on the
// server. Style: .kit-compare in post.css.
import type { ReactNode } from "react";
import { cssColour } from "./svgBits";

export type MethodCard = { key: string; title: ReactNode; blurb?: ReactNode; body: ReactNode; note?: ReactNode; accent?: string };

const ACCENTS = ["--access", "--good", "--w4-group-0", "--people"];

/** <MethodCompare cards={[{ key: "lex", title: "Lexicon", blurb: "…", body: <ContributionBars … />, note: "…" }]} /> */
export default function MethodCompare({ cards, facts }: { cards: MethodCard[]; facts?: [ReactNode, ReactNode][] }) {
  if (cards.length === 0) return <p className="kit-empty">No methods to compare.</p>;
  return (
    <div className="kit-compare">
      <ol className="kit-compare-cards" style={{ gridTemplateColumns: `repeat(${cards.length}, minmax(0, 1fr))` }}>
        {cards.map((c, i) => (
          <li key={c.key} style={{ borderTopColor: cssColour(c.accent ?? ACCENTS[i % ACCENTS.length]) }}>
            <h4>
              <span className="kit-compare-n">{i + 1}</span> {c.title}
            </h4>
            {c.blurb ? <p className="kit-compare-blurb">{c.blurb}</p> : null}
            <div className="kit-compare-body">{c.body}</div>
            {c.note ? <p className="kit-note">{c.note}</p> : null}
          </li>
        ))}
      </ol>
      {facts?.length ? (
        <dl className="kit-compare-facts">
          {facts.map(([k, v], i) => (
            <div key={i}>
              <dt>{k}</dt>
              <dd>{v}</dd>
            </div>
          ))}
        </dl>
      ) : null}
    </div>
  );
}
