import type { Metadata } from "next";
import { Frame } from "@/features/cold-read/Frame";
import { LEVELS } from "@/features/cold-read/levels";

// The practice menu: every round on its own, with its options. A plain form
// carries the Clue Shop's hard mode to its page as ?hard=1, so the menu needs
// no script.
export const metadata: Metadata = {
  title: "Practice · Cold Read · Log–Log Legends",
  description: "Play any of Cold Read's five rounds on its own: TF-IDF, comparing groups, topic models, context and PPMI, word vectors.",
  robots: "noindex",
};

export default function Page() {
  return (
    <Frame page="practice" home="../">
      <ol className="cr-menu">
        {LEVELS.map((l, i) => (
          <li key={l.id}>
            <form className="cr-menu-card" action={`../${l.path}`} method="get">
              <span className="cr-menu-n">{i + 1}</span>
              <span className="cr-menu-name">{l.name}</span>
              <span className="cr-menu-topic">{l.topic}</span>
              <p>{l.blurb}</p>
              {l.id === "clue" ? (
                <label className="cr-toggle cr-toggle-light">
                  <input type="checkbox" name="hard" value="1" />
                  <span>
                    Hard mode
                    <small>rarer clues, score ×2</small>
                  </span>
                </label>
              ) : null}
              <button type="submit" className="cr-go">
                Play {l.name}
              </button>
            </form>
          </li>
        ))}
      </ol>
    </Frame>
  );
}
