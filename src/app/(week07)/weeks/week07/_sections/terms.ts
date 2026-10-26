import { termFor } from "@/lib/glossary";

// The glossary terms the "what we did" paragraphs carry, each placed once
// comention.json has loaded, with the site's shared definitions
// (src/lib/glossary.ts) and this page's own words added.
export const TERMS = [
  termFor("co-mention", "named in one sentence", "w7-term-co-mention", "Here, two of the 303 characters named by one sentence on any page."),
  termFor("degree-preserving-shuffle", "rewires", "w7-term-rewire", "Here, the text network itself is rewired, so every character keeps its number of partners."),
  termFor("named-entity-recognition", "entity tagger", "w7-term-ner", "Here, spaCy's small English model, the one the course brief runs."),
];
