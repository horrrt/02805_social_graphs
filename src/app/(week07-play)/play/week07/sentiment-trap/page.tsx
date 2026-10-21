import type { Metadata } from "next";
import { PostTopbar } from "@/components/site/PostTopbar";
import { SoundToggle } from "@/features/cold-read/SoundToggle";
import { SentimentTrap } from "@/features/sentiment-trap/SentimentTrap";

// Sentiment Trap: a Week 7 game for section 4 (sentiment as a measurement).
// The challenges are in src/features/sentiment-trap/challenges.ts, the scores in
// public/play/week07/data/sentiment_trap.json (analysis/week07_sentiment_trap.py).
export const metadata: Metadata = {
  title: "Sentiment Trap · Log-Log Legends",
  description: "Three sentiment instruments read the same sentence. Spot when the score isn't measuring what you care about. A Week 7 game on sentiment as a measurement.",
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
          <p className="cr-h">Week 7 · Sentiment analysis</p>
          <h1 className="cr-title">
            Sentiment <span>Trap</span>
          </h1>
          <SentimentTrap />
        </main>
        <footer className="cr-foot">
          <p>
            Sentiment Trap · Week 7 · <a href="../../../">Log-Log Legends</a> · DTU 02805
          </p>
        </footer>
      </div>
    </>
  );
}
