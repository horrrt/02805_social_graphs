import { useState } from "react";
import { RankedResults } from "log-log-legends-kit";
import { search, searchPresets } from "@/features/kit-page/toy-text";

// The Text section's search demo over toy documents
// (src/features/kit-page/toy-text.ts): one query ranked by raw counts and by TF-IDF.
export const CountsAgainstTfidf = () => {
  const [query, setQuery] = useState(searchPresets[2]);
  const r = search(query);
  return (
    <RankedResults
      query={{ value: query, onChange: setQuery, presets: searchPresets }}
      columns={[
        { key: "counts", title: "Raw word counts", sub: "cosine of count vectors: every shared word counts, the and of too", results: r.counts },
        { key: "tfidf", title: "TF-IDF", sub: "cosine of TF-IDF vectors: words in every document weigh nothing", results: r.tfidf },
      ]}
    />
  );
};
