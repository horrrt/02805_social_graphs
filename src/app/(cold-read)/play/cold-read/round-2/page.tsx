import type { Metadata } from "next";
import { Frame } from "@/features/cold-read/Frame";
import { WhoseLine } from "@/features/cold-read/WhoseLine";

// Cold Read, round 2 (Whose Line): which community's pages use a word more.
// The counts come from analysis/week06_whose_line.py; the rules are in
// src/features/cold-read/groups.ts.
export const metadata: Metadata = {
  title: "Whose Line · Cold Read · Log–Log Legends",
  description: "Two communities of the Marvel network face off. Call which one uses a word more, or spot the one-page fluke. A game about comparing groups with Scattertext, Week 6.",
  robots: "noindex",
};

export default function Page() {
  return (
    <Frame page="practice" home="../">
      <WhoseLine />
    </Frame>
  );
}
