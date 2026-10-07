import { Campaign } from "@/features/cold-read/Campaign";
import { Frame } from "@/features/cold-read/Frame";

// Cold Read: the campaign through all five rounds, from TF-IDF to word
// vectors. Each round also has its own practice page, linked from the frame.
export default function Page() {
  return (
    <Frame
      round={0}
      home="./"
      sub="Five levels, one score: from counting words to reading their meaning, in the order Week 6 teaches it."
      credits={
        <p>
          Page text from English Wikipedia, <a href="https://creativecommons.org/licenses/by-sa/4.0/">CC BY-SA 4.0</a>, through the 02805 course
          snapshot of 26 August 2026. Communities from our Week 5 consensus Louvain partition; topics from scikit-learn’s LDA as in the{" "}
          <a href="https://sunelehmann.com/socialgraphs2026-web/weeks/week6.html">Week 6 brief</a>; word vectors from{" "}
          <a href="https://nlp.stanford.edu/projects/glove/">GloVe</a> under the{" "}
          <a href="https://opendatacommons.org/licenses/pddl/1-0/">PDDL</a>. Portraits are Wikipedia lead images, mostly comic art used there under
          fair use; each reveal links to the image’s file page.
        </p>
      }
    >
      <Campaign />
    </Frame>
  );
}
