import { CountMatrix, StepFlow } from "log-log-legends-kit";
import { BOW_DOCS } from "@/features/kit-page/toy-editors";

// The kit page's second pipeline (src/features/kit-page/toy-editors.ts): raw
// documents to a bag-of-words matrix, the general process beside a toy example.
const vocab = [...new Set(BOW_DOCS.flatMap((d) => d.split(" ")))].sort();
const counts = BOW_DOCS.map((d) => vocab.map((w) => d.split(" ").filter((t) => t === w).length));
const lines = (rows: string[]) => (
  <code className="kit-ed-code">
    {rows.map((r, i) => (
      <span key={i}>{r}</span>
    ))}
  </code>
);
const BOW_FLOW = [
  { title: "Corpus", body: "Start with a collection of documents.", transition: "tokenize", exampleTitle: "Corpus", example: lines(BOW_DOCS.map((d, i) => `D${i + 1}: ${d}`)) },
  { title: "Tokenize", body: "Split each document into the units you count.", transition: "collect the distinct terms", exampleTitle: "Tokens", example: lines(BOW_DOCS.map((d, i) => `D${i + 1}: ${d.split(" ").map((t) => `[${t}]`).join(" ")}`)) },
  { title: "Build the vocabulary", body: "The distinct terms become the matrix's columns.", transition: "count", exampleTitle: "Vocabulary", example: lines([vocab.join(" · ")]) },
  { title: "Count and encode", body: "Count each term in each document, in vocabulary order.", transition: "stack the rows", exampleTitle: "Document vectors", example: lines(counts.map((c, i) => `D${i + 1}: [${c.join(", ")}]`)) },
  { title: "Document-term matrix", body: "One row per document, one column per term.", exampleTitle: "The matrix", example: <CountMatrix rows={BOW_DOCS.map((_, i) => `D${i + 1}`)} cols={vocab} cells={counts} highlightRow={0} /> },
];
export const BagOfWords = () => <StepFlow steps={BOW_FLOW} heads={["The general process", "One toy example"]} label="From raw documents to a bag-of-words matrix" />;
