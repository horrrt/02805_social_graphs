import type { Metadata } from "next";
import { ClueShop } from "@/features/cold-read/ClueShop";
import { Frame } from "@/features/cold-read/Frame";

// Cold Read, round 1 (Clue Shop): the Week 6 game. The decks come from
// analysis/week06_cold_read.py; the rules are in src/features/cold-read/rules.ts.
export const metadata: Metadata = {
  title: "Clue Shop · Cold Read · Log–Log Legends",
  description: "A Marvel page is hidden. Flip word cards that show only how often the word appears here and on how many pages, and name the page. A game about TF-IDF and cosine similarity, Week 6.",
  robots: "noindex",
};

export default function Page() {
  return (
    <Frame page="practice" home="../">
      <ClueShop />
    </Frame>
  );
}
