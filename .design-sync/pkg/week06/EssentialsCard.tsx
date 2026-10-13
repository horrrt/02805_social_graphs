import { Contexts, Contrast, Cosine, Glove, Pmi, Topics, Vectors, Weights } from "../../../src/app/(week06)/weeks/week06/_sections/Sections";

const CARDS = { weights: Weights, cosine: Cosine, contrast: Contrast, topics: Topics, contexts: Contexts, pmi: Pmi, vectors: Vectors, glove: Glove };

/**
 * One section of the Week 6 essentials page as the page renders it: the
 * section opener, then the card with what we did, "Compared to what", the
 * explorable in its plot (EssentialsPart) and the Method drawer. The
 * explorable loads its JSON from the live site.
 */
export default function EssentialsCard({ part }: { part: keyof typeof CARDS }) {
  const Card = CARDS[part];
  return Card ? <Card /> : null;
}
