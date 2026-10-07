import type { Metadata } from "next";
import { Frame } from "@/features/cold-read/Frame";
import { HotCold } from "@/features/cold-read/HotCold";

// Cold Read, round 5 (Hot & Cold): find a hidden word by cosine similarity.
// The vectors come from analysis/week06_hot_cold.py; the rules are in
// src/features/cold-read/vectors.ts.
export const metadata: Metadata = {
  title: "Hot & Cold · Cold Read · Log–Log Legends",
  description: "A word from the Marvel pages is hidden. Every guess scores its cosine similarity to it in GloVe's word vectors. A game about embeddings, Week 6.",
  robots: "noindex",
};

export default function Page() {
  return (
    <Frame
      round={5}
      home="../"
      sub="Round 5, Hot & Cold. A word from the Marvel pages is hidden. Every guess tells you how close you are."
      credits={
        <p>
          Word vectors from <a href="https://nlp.stanford.edu/projects/glove/">GloVe</a> (Pennington, Socher and Manning, 2014), the 100-dimension
          model trained on Wikipedia 2014 and Gigaword 5, under the{" "}
          <a href="https://opendatacommons.org/licenses/pddl/1-0/">Public Domain Dedication and License</a>. The game keeps the 9,000 words used most
          on the 303 Marvel pages of the 02805 course snapshot (English Wikipedia,{" "}
          <a href="https://creativecommons.org/licenses/by-sa/4.0/">CC BY-SA 4.0</a>). Cosine similarity and embeddings follow the{" "}
          <a href="https://sunelehmann.com/socialgraphs2026-web/weeks/week6.html">Week 6 brief</a>, section 6.
        </p>
      }
    >
      <HotCold />
    </Frame>
  );
}
