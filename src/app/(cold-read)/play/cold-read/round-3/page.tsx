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
    <Frame
      round={3}
      home="../"
      sub="Round 3, Mix Desk. Every page is a blend of topics. Read its words and guess the blend."
      credits={
        <p>
          Page text from English Wikipedia, <a href="https://creativecommons.org/licenses/by-sa/4.0/">CC BY-SA 4.0</a>, through the 02805 course
          snapshot of 26 August 2026. Topics from scikit-learn’s{" "}
          <a href="https://scikit-learn.org/stable/modules/generated/sklearn.decomposition.LatentDirichletAllocation.html">
            LatentDirichletAllocation
          </a>
          , set up as in the <a href="https://sunelehmann.com/socialgraphs2026-web/weeks/week6.html">Week 6 brief</a>, section 3: 8 topics,
          random_state 0, English stopwords and names removed, words on 5 pages or more and on at most half of them. Portraits are Wikipedia lead
          images, mostly comic art used there under fair use.
        </p>
      }
    >
      <MixDesk />
    </Frame>
  );
}
