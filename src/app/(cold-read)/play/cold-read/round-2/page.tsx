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
    <Frame
      page="practice"
      home="../"
      sub="Round 2, Whose Line. Two communities of the Marvel network face off over their words."
      credits={
        <p>
          Page text from English Wikipedia, <a href="https://creativecommons.org/licenses/by-sa/4.0/">CC BY-SA 4.0</a>, through the 02805 course
          snapshot of 26 August 2026. Communities are the eight largest groups of our Week 5 consensus Louvain partition, each named by its
          best-connected page. The comparison follows <a href="https://github.com/JasonKessler/scattertext">Scattertext</a> and the{" "}
          <a href="https://sunelehmann.com/socialgraphs2026-web/weeks/week6.html">Week 6 brief</a>, section 2. Portraits are Wikipedia lead images,
          mostly comic art used there under fair use.
        </p>
      }
    >
      <WhoseLine />
    </Frame>
  );
}
