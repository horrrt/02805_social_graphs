import type { Metadata } from "next";
import { Frame } from "@/features/cold-read/Frame";
import { Tezguino } from "@/features/cold-read/Tezguino";

// Cold Read, round 4 (Tezgüino): name a hidden word from the company it keeps.
// The rows come from analysis/week06_tezguino.py; the rules are in
// src/features/cold-read/contexts.ts.
export const metadata: Metadata = {
  title: "Tezgüino · Cold Read · Log–Log Legends",
  description: "A word from the Marvel pages is hidden; you see only the words found near it. Buy wider windows, PPMI weights or a sentence peek, then name it. A game about context and PPMI, Week 6.",
  robots: "noindex",
};

export default function Page() {
  return (
    <Frame page="practice" home="../">
      <Tezguino />
    </Frame>
  );
}
