import type { Metadata } from "next";
import { Frame } from "@/features/cold-read/Frame";
import { MixDesk } from "@/features/cold-read/MixDesk";

// Cold Read, round 3 (Mix Desk): guess a page's mixture of LDA topics.
// The model comes from analysis/week06_mix_desk.py; the rules are in
// src/features/cold-read/topics.ts.
export const metadata: Metadata = {
  title: "Mix Desk · Cold Read · Log–Log Legends",
  description: "Read a Marvel page's most used words and spread ten chips over eight LDA topics to guess its mixture. A game about topic models, Week 6.",
  robots: "noindex",
};

export default function Page() {
  return (
    <Frame page="practice" home="../">
      <MixDesk />
    </Frame>
  );
}
