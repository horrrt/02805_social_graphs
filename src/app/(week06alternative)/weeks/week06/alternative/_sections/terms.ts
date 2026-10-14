import { termFor } from "@/lib/glossary";

// The glossary terms the "what we did" paragraphs carry, each placed once
// lookalikes.json has loaded, with the site's shared definitions
// (src/lib/glossary.ts) and this page's own words added.
export const TERMS = [
  termFor("tf-idf", "TF-IDF", "w6-term-tfidf", "Here, the word's share of the page's words times the log of 303 over the number of pages that use it, so a word on every page gets 0."),
  termFor("cosine-similarity", "cosine", "w6-term-cosine", "A long page and a short one can score 1."),
  termFor("label-shuffle", "shuffle", "w6-term-shuffle", "Here every page keeps its ten nearest pages."),
];
