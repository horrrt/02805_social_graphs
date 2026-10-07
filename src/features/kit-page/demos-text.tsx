"use client";
// The kit page's Text demos, one island per [data-demo="text-…"] host, as
// demos.tsx does for the other demos: each host is empty on the server and
// draws its demo once hydrated. The toys and the fitted models are in
// toy-text.ts; the methods in src/kit/text-core.js.
import { useState, type ReactNode } from "react";
import { AxisMap, ContributionBars, CountMatrix, MethodCompare, RankedResults, TaggedTokens, type MatrixTransform, type TaggedToken } from "@/kit";
import { bioSpans, scoreLexicon, tokenDetails, tokenize } from "@/kit/text-core.js";
import { island, useIslandReady } from "@/lib/island";
import { useHydrated } from "@/lib/useHydrated";
import { matrixCells, matrixCols, matrixRows } from "./toy";
import {
  classifierSentences, classify, lexicon, nerSentences, ngramText, pipelineText, rates, ratesBy, search, searchPresets, sentimentSentences,
} from "./toy-text";

function useShown() {
  const hydrated = useHydrated();
  useIslandReady(hydrated);
  return hydrated;
}

const signed = (v: number) => `${v > 0 ? "+" : v < 0 ? "−" : ""}${Math.abs(v).toFixed(1)}`;

// A row of pressed-state buttons, one per option.
function Choice<T extends string | number>({ label, options, value, onChange }: { label: string; options: [T, ReactNode][]; value: T; onChange: (v: T) => void }) {
  return (
    <span className="w5-chips" role="group" aria-label={label}>
      {options.map(([v, text]) => (
        <button key={String(v)} type="button" aria-pressed={v === value} onClick={() => onChange(v)}>
          {text}
        </button>
      ))}
    </span>
  );
}

function Toggle({ on, onChange, children }: { on: boolean; onChange: (on: boolean) => void; children: ReactNode }) {
  return (
    <button type="button" aria-pressed={on} onClick={() => onChange(!on)}>
      {children}
    </button>
  );
}

function PipelineView() {
  const shown = useShown();
  const [text, setText] = useState(pipelineText);
  const [lower, setLower] = useState(false);
  const [punct, setPunct] = useState(false);
  const [stops, setStops] = useState(false);
  const [clitics, setClitics] = useState(true);
  const kept = tokenDetails(text, { splitClitics: clitics }).filter((t) => !(punct && t.punct) && !(stops && t.stop));
  const tokens: TaggedToken[] = kept.map((t) => ({
    text: lower ? t.text.toLowerCase() : t.text,
    tone: t.stop || t.punct ? "muted" : undefined,
    attrs: [["is_stop", String(t.stop)], ["is_punct", String(t.punct)], ["position", String(t.index + 1)]],
  }));
  const vocab = [...new Set(tokens.map((t) => t.text))].sort((a, b) => a.localeCompare(b));
  return (
    <div data-demo="text-pipeline">
      {shown ? (
        <>
          <div className="kit-controls">
            <span className="w5-chips" role="group" aria-label="Tokenizer choices">
              <Toggle on={clitics} onChange={setClitics}>split clitics</Toggle>
              <Toggle on={lower} onChange={setLower}>lowercase</Toggle>
              <Toggle on={punct} onChange={setPunct}>drop punctuation</Toggle>
              <Toggle on={stops} onChange={setStops}>drop stopwords</Toggle>
            </span>
          </div>
          <TaggedTokens tokens={tokens} source={{ value: text, onChange: setText, label: "Raw text" }} label="Tokens after your choices" />
          <h4 className="kit-tt-head">Vocabulary</h4>
          <TaggedTokens tokens={vocab.map((v) => ({ text: v, tone: "accent" }))} label="Vocabulary" />
          <p className="kit-note">
            {tokens.length} tokens, {vocab.length} types, type/token ratio {tokens.length ? (vocab.length / tokens.length).toFixed(2) : "n/a"}. Hover or focus a token for its attributes.
          </p>
        </>
      ) : null}
    </div>
  );
}

function NgramView() {
  const shown = useShown();
  const [n, setN] = useState(2);
  const [active, setActive] = useState(0);
  const tokens = ngramText.split(" ").map((text) => ({ text }));
  return (
    <div data-demo="text-ngram">
      {shown ? (
        <>
          <div className="kit-controls">
            <Choice label="n" options={[[1, "unigrams"], [2, "bigrams"], [3, "trigrams"]]} value={n} onChange={(v) => { setN(v); setActive(0); }} />
          </div>
          <TaggedTokens tokens={tokens} gram={{ n, active, onActive: setActive }} />
        </>
      ) : null}
    </div>
  );
}

function NerView() {
  const shown = useShown();
  const [key, setKey] = useState(nerSentences[0].key);
  const [bio, setBio] = useState(false);
  const s = nerSentences.find((x) => x.key === key) ?? nerSentences[0];
  const spans = bioSpans(s.tokens, s.tags);
  const tokens: TaggedToken[] = s.tokens.map((text, i) => {
    const tag = s.tags[i] ?? "O";
    return { text, tag: bio || tag === "O" ? tag : tag.slice(2), tone: tag === "O" ? "muted" : "accent" };
  });
  return (
    <div data-demo="text-ner">
      {shown ? (
        <>
          <div className="kit-controls">
            <Choice label="Sentence" options={nerSentences.map((x) => [x.key, x.label] as [string, string])} value={key} onChange={setKey} />
            <Choice label="Tags" options={[["labels", "entity labels"], ["bio", "BIO tags"]]} value={bio ? "bio" : "labels"} onChange={(v) => setBio(v === "bio")} />
          </div>
          <TaggedTokens tokens={tokens} spans={spans.map((sp) => ({ start: sp.start, end: sp.end, label: `${sp.type}: ${sp.text}` }))} label="Tokens with their entity tags" />
          <p className="kit-note">
            {s.tokens.length} tokens, {spans.length} entity {spans.length === 1 ? "span" : "spans"}. A B- tag opens a span and I- tags continue it.
          </p>
        </>
      ) : null}
    </div>
  );
}

// One sentence scored by the lexicon: its chips, tagged with each hit's score, and the bars.
function lexiconParts(sentence: string, negation: boolean) {
  const words = tokenize(sentence, { splitClitics: true, dropPunct: false }) as string[];
  const { total, hits } = scoreLexicon(words, lexicon, { negation });
  const at = new Map(hits.map((h) => [h.index, h]));
  const tokens: TaggedToken[] = words.map((text, i) => {
    const h = at.get(i);
    if (!h) return { text };
    return {
      text,
      tag: signed(h.value),
      tone: h.value > 0 ? "pos" : "neg",
      attrs: [["lexicon", signed(h.base)], ["negated", h.flipped ? "yes, sign flipped" : "no"]],
    };
  });
  const items = hits.map((h) => ({ key: String(h.index), label: h.flipped ? `${h.token} (flipped)` : h.token, value: h.value }));
  return { tokens, items, total };
}

function LexiconView() {
  const shown = useShown();
  const [sentence, setSentence] = useState(sentimentSentences[2]);
  const [negation, setNegation] = useState(true);
  const { tokens, items } = lexiconParts(sentence, negation);
  return (
    <div data-demo="text-lexicon">
      {shown ? (
        <>
          <div className="kit-controls">
            <Choice label="Sentence" options={sentimentSentences.map((x) => [x, x] as [string, string])} value={sentence} onChange={setSentence} />
            <span className="w5-chips" role="group" aria-label="Rule">
              <Toggle on={negation} onChange={setNegation}>flip after not, never, n't</Toggle>
            </span>
          </div>
          <TaggedTokens tokens={tokens} label="Tokens with their lexicon scores" />
          <ContributionBars items={items} ends={["very negative", "very positive"]} total={{ mode: "sum", label: "Sentence score" }} fmt={signed} />
        </>
      ) : null}
    </div>
  );
}

function ClassifierView() {
  const shown = useShown();
  const [sentence, setSentence] = useState(classifierSentences[1]);
  const c = classify(sentence);
  return (
    <div data-demo="text-classifier">
      {shown ? (
        <>
          <div className="kit-controls">
            <Choice label="Test sentence" options={classifierSentences.map((x) => [x, x] as [string, string])} value={sentence} onChange={setSentence} />
          </div>
          <ContributionBars items={c.items} total={{ mode: "sigmoid", bias: c.bias, label: "TF-IDF(text) → w·x + b → sigmoid" }} ends={["negative", "positive"]} />
          <p className="kit-note">A logistic regression fitted in the browser on eight toy texts, with TF-IDF unigram features. Words it never saw add nothing.</p>
        </>
      ) : null}
    </div>
  );
}

function SearchView() {
  const shown = useShown();
  const [query, setQuery] = useState(searchPresets[2]);
  const r = search(query);
  return (
    <div data-demo="text-search">
      {shown ? (
        <RankedResults
          query={{ value: query, onChange: setQuery, presets: searchPresets }}
          columns={[
            { key: "counts", title: "Raw word counts", sub: "cosine of count vectors: every shared word counts, the and of too", results: r.counts },
            { key: "tfidf", title: "TF-IDF", sub: "cosine of TF-IDF vectors: words in every document weigh nothing", results: r.tfidf },
          ]}
        />
      ) : null}
    </div>
  );
}

function CompareView() {
  const shown = useShown();
  const [sentence, setSentence] = useState(sentimentSentences[1]);
  const plain = lexiconParts(sentence, false);
  const negated = lexiconParts(sentence, true);
  const c = classify(sentence);
  const verdict = (v: number, mid = 0) => (v > mid ? "positive" : v < mid ? "negative" : "neutral");
  return (
    <div data-demo="text-compare">
      {shown ? (
        <>
          <div className="kit-controls">
            <Choice label="Sentence" options={sentimentSentences.map((x) => [x, x] as [string, string])} value={sentence} onChange={setSentence} />
          </div>
          <MethodCompare
            cards={[
              {
                key: "lexicon",
                title: "Lexicon",
                blurb: "Every word in the dictionary adds its fixed score.",
                body: (
                  <>
                    <TaggedTokens tokens={plain.tokens} label="Tokens, lexicon only" />
                    <ContributionBars items={plain.items} total={{ mode: "sum" }} fmt={signed} />
                  </>
                ),
                note: `${signed(plain.total)}: ${verdict(plain.total)}. Word order is ignored.`,
              },
              {
                key: "negation",
                title: "Lexicon with negation",
                blurb: "The same scores, flipped within three words of not, never or n't.",
                body: (
                  <>
                    <TaggedTokens tokens={negated.tokens} label="Tokens, lexicon with negation" />
                    <ContributionBars items={negated.items} total={{ mode: "sum" }} fmt={signed} />
                  </>
                ),
                note: `${signed(negated.total)}: ${verdict(negated.total)}. One hand-written rule.`,
              },
              {
                key: "logistic",
                title: "TF-IDF + logistic regression",
                blurb: "Weights learned from eight labelled toy texts.",
                body: <ContributionBars items={c.items} total={{ mode: "sigmoid", bias: c.bias }} />,
                note: `p = ${c.p.toFixed(2)}: ${verdict(c.p, 0.5)}. Only words seen in training count.`,
              },
            ]}
            facts={[["Same input", "one sentence"], ["What changes", "the scoring rule"]]}
          />
        </>
      ) : null}
    </div>
  );
}

function PpmiView() {
  const shown = useShown();
  const [transform, setTransform] = useState<MatrixTransform>("ppmi");
  const [row, setRow] = useState(0);
  return (
    <div data-demo="text-ppmi">
      {shown ? (
        <>
          <div className="kit-controls">
            <Choice label="Cells" options={[["count", "counts"], ["ppmi", "PPMI"], ["tf", "TF"], ["tfidf", "TF-IDF"]]} value={transform} onChange={setTransform} />
          </div>
          <CountMatrix rows={matrixRows} cols={matrixCols} cells={matrixCells} highlightRow={row} onRow={setRow} transform={transform} nearest caption="Toy counts within two words, under the chosen transform." />
        </>
      ) : null}
    </div>
  );
}

function LogMapView() {
  const shown = useShown();
  const [picked, setPicked] = useState("jobs");
  const r = ratesBy.get(picked);
  return (
    <div data-demo="text-logmap">
      {shown ? (
        <AxisMap
          points={rates}
          axes={{ left: "rare in B", right: "common in B", bottom: "rare in A", top: "common in A" }}
          log
          diagonal
          sides={{ above: "more in A", below: "more in B", similar: "similar use", band: 0.15 }}
          selected={picked}
          onPick={setPicked}
          height={360}
          detail={
            r ? (
              <p>
                <b>{picked}</b>: {r.a} uses per 10,000 words in A, {r.b} in B. Click another point.
              </p>
            ) : null
          }
        />
      ) : null}
    </div>
  );
}

const Empty = (demo: string) =>
  function Host() {
    return <div data-demo={demo}></div>;
  };

const at = (demo: string) => ({ roots: [`[data-demo="${demo}"]`] });

// One island per demo, so a fault in one leaves the others alone.
const DEMOS = {
  "text-pipeline": island("kit/demos/TextPipelineDemo", PipelineView, Empty("text-pipeline"), at("text-pipeline")),
  "text-ngram": island("kit/demos/TextNgramDemo", NgramView, Empty("text-ngram"), at("text-ngram")),
  "text-ner": island("kit/demos/TextNerDemo", NerView, Empty("text-ner"), at("text-ner")),
  "text-lexicon": island("kit/demos/TextLexiconDemo", LexiconView, Empty("text-lexicon"), at("text-lexicon")),
  "text-classifier": island("kit/demos/TextClassifierDemo", ClassifierView, Empty("text-classifier"), at("text-classifier")),
  "text-search": island("kit/demos/TextSearchDemo", SearchView, Empty("text-search"), at("text-search")),
  "text-compare": island("kit/demos/TextCompareDemo", CompareView, Empty("text-compare"), at("text-compare")),
  "text-ppmi": island("kit/demos/TextPpmiDemo", PpmiView, Empty("text-ppmi"), at("text-ppmi")),
  "text-logmap": island("kit/demos/TextLogMapDemo", LogMapView, Empty("text-logmap"), at("text-logmap")),
};

export type TextDemoName = keyof typeof DEMOS;

function View({ demo }: { demo: TextDemoName }) {
  const Shown = DEMOS[demo];
  return <Shown />;
}

function Placeholder({ demo }: { demo: TextDemoName }) {
  return <div data-demo={demo}></div>;
}

/** <TextDemo demo="text-pipeline" />: one Text demo host on the kit page. */
export const TextDemo = island("kit/demos/TextDemo", View, Placeholder, {
  roots: (Object.keys(DEMOS) as TextDemoName[]).map((demo) => `[data-demo="${demo}"]`),
});
