import type { Metadata } from "next";
import { PostTopbar } from "@/components/site/PostTopbar";
import { SoundToggle } from "@/features/cold-read/SoundToggle";
import { Campaign } from "@/features/week07-campaign/Campaign";

// The Week 7 campaign: one game per section of the brief as levels, in its
// order, with one running score. The levels are in src/features/week07-campaign/levels.ts;
// each game keeps its own practice page under this one.
export const metadata: Metadata = {
  title: "Meaning to Measurement · Log-Log Legends",
  description: "Week 7's games as one campaign: contextual vectors, corpus maps, three ways to group a corpus, sentiment and search by meaning, on the Marvel pages.",
  robots: "noindex",
};

export default function Page() {
  return (
    <>
      <PostTopbar
        root="../../"
        tools={
          <nav className="cr-rounds" aria-label="Game tools">
            <SoundToggle />
          </nav>
        }
      />
      <div className="cr-shell">
        <main id="main">
          <p className="cr-h">Week 7 · Campaign</p>
          <h1 className="cr-title">
            Meaning to <span>Measurement</span>
          </h1>
          <Campaign />
        </main>
        <footer className="cr-foot">
          <p>
            Meaning to Measurement · Week 7 · <a href="../../">Log-Log Legends</a> · DTU 02805
          </p>
        </footer>
      </div>
    </>
  );
}
