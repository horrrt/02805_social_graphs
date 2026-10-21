import type { Metadata } from "next";
import { PostTopbar } from "@/components/site/PostTopbar";
import { SoundToggle } from "@/features/cold-read/SoundToggle";
import { SemanticMinefield } from "@/features/semantic-minefield/SemanticMinefield";

// Semantic Minefield: a Week 7 game for section 6 (search by meaning).
// The labels are in src/features/semantic-minefield/characters.ts, the rounds in rounds.ts.
export const metadata: Metadata = {
  title: "Semantic Minefield · Log-Log Legends",
  description: "Minesweeper with Marvel characters: each round's target category decides who is a bomb. A game about semantic categories and search by meaning, Week 7.",
  robots: "noindex",
};

export default function Page() {
  return (
    <>
      <PostTopbar
        root="../../../"
        tools={
          <nav className="cr-rounds" aria-label="Game tools">
            <SoundToggle />
          </nav>
        }
      />
      <div className="cr-shell">
        <main id="main">
          <p className="cr-h">Week 7 · Search by meaning</p>
          <h1 className="cr-title">
            Semantic <span>Minefield</span>
          </h1>
          <SemanticMinefield />
        </main>
        <footer className="cr-foot">
          <p>
            Semantic Minefield · Week 7 · <a href="../../../">Log-Log Legends</a> · DTU 02805
          </p>
        </footer>
      </div>
    </>
  );
}
