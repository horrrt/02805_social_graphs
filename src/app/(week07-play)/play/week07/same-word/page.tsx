import type { Metadata } from "next";
import { PostTopbar } from "@/components/site/PostTopbar";
import { SameWord } from "@/features/same-word/SameWord";

// Same Word, Different Worlds: a Week 7 game for section 1 (one vector for a whole text).
// The rounds and scoring are in src/features/same-word/rounds.ts.
export const metadata: Metadata = {
  title: "Same Word, Different Worlds · Log-Log Legends",
  description: "One word, two sentences: does its vector change? A game about static and contextual embeddings, Week 7.",
  robots: "noindex",
};

export default function Page() {
  return (
    <>
      <PostTopbar root="../../../" />
      <div className="cr-shell">
        <main id="main">
          <p className="cr-h">Week 7 · One vector for a whole text</p>
          <h1 className="cr-title">
            Same Word, <span>Different Worlds</span>
          </h1>
          <SameWord />
        </main>
        <footer className="cr-foot">
          <p>
            Same Word, Different Worlds · Week 7 · <a href="../../../">Log-Log Legends</a> · DTU 02805
          </p>
        </footer>
      </div>
    </>
  );
}
