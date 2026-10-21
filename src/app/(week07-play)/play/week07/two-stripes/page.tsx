import type { Metadata } from "next";
import { PostTopbar } from "@/components/site/PostTopbar";
import { SoundToggle } from "@/features/cold-read/SoundToggle";
import { TwoStripes } from "@/features/two-stripes/TwoStripes";

// Two Stripes: the Week 7 game for section 2 (corpus maps). The rounds come
// from analysis/week07_two_stripes.py; the rules are in src/features/two-stripes/rules.ts.
export const metadata: Metadata = {
  title: "Two Stripes · Log-Log Legends",
  description: "Find the Marvel page nearest another in 384 dimensions when the map draws only two. A game about corpus maps and cosine similarity, Week 7.",
  robots: "noindex",
};

export default function Page() {
  return (
    <>
      <PostTopbar
        root="../../../"
        tools={
          <nav className="cr-rounds" aria-label="Game tools">
            <a href="../">Campaign</a>
            <SoundToggle />
          </nav>
        }
      />
      <div className="cr-shell">
        <main id="main">
          <h1 className="cr-title">
            Two <span>Stripes</span>
          </h1>
          <TwoStripes />
        </main>
        <footer className="cr-foot">
          <p>
            Two Stripes · Week 7 · <a href="../../../">Log-Log Legends</a> · DTU 02805
          </p>
        </footer>
      </div>
    </>
  );
}
