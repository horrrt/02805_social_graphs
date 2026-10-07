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
    <Frame page="practice" home="../">
      <HotCold />
    </Frame>
  );
}
