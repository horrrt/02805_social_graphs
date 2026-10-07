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
    <Frame
      round={1}
      home="../"
      sub="Round 1, the Clue Shop. Name a hidden Marvel page from as few of its words as you can."
      credits={
        <p>
          Page text from English Wikipedia, <a href="https://creativecommons.org/licenses/by-sa/4.0/">CC BY-SA 4.0</a>, through the 02805 course
          snapshot of 26 August 2026. TF-IDF and cosine similarity follow the{" "}
          <a href="https://sunelehmann.com/socialgraphs2026-web/weeks/week6.html">Week 6 brief</a>: count divided by page length, times ln(303 / pages
          with the word). Names follow the brief's rule: a word capitalised in more than half its uses. Portraits are each page's lead image, loaded
          from Wikipedia. Most are copyrighted comic art that Wikipedia uses under fair use; each reveal links to the image's file page with its source
          and rights.
        </p>
      }
    >
      <ClueShop />
    </Frame>
  );
}
