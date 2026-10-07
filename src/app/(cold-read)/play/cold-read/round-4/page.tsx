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
    <Frame
      round={4}
      home="../"
      sub="Round 4, Tezgüino. You shall know a word by the company it keeps. Here is the company; name the word."
      credits={
        <p>
          Page text from English Wikipedia, <a href="https://creativecommons.org/licenses/by-sa/4.0/">CC BY-SA 4.0</a>, through the 02805 course
          snapshot of 26 August 2026. Context rows count the words within a window inside each sentence, by the course’s token rule; PPMI as in the{" "}
          <a href="https://sunelehmann.com/socialgraphs2026-web/weeks/week6.html">Week 6 brief</a>, sections 4 and 5. The tezgüino example is Nida
          (1975) by way of Lin (1998).
        </p>
      }
    >
      <Tezguino />
    </Frame>
  );
}
