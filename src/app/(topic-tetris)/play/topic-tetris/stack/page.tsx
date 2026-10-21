import type { Metadata } from "next";
import { PostTopbar } from "@/components/site/PostTopbar";
import { Fullscreen } from "@/features/cold-read/Fullscreen";
import { SoundToggle } from "@/features/cold-read/SoundToggle";
import { Stack } from "@/features/topic-tetris/Stack";

// Topic Tetris, stack edition: the same game and data as ../ on a classic
// stacking board. The game is in src/features/topic-tetris/StackGame.tsx.
export const metadata: Metadata = {
  title: "Topic Tetris, stack edition · Log-Log Legends",
  description: "Nine Marvel pages fall three times down a stacking board. Group them by their words, by their meaning and by their links, and watch the groups change. A game about representation, Week 7.",
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
            <Fullscreen />
          </nav>
        }
      />
      <div className="cr-shell ts-shell">
        <main id="main">
          <h1 className="ts-sr">Topic Tetris, stack edition</h1>
          <Stack />
        </main>
        <footer className="cr-foot">
          <p>
            Topic Tetris · Week 7 · <a href="../../../">Log-Log Legends</a> · DTU 02805
          </p>
        </footer>
      </div>
    </>
  );
}
