import { DetailPanel } from "log-log-legends-kit";
import { TOPICS } from "@/features/kit-page/toy-editors";

// The kit page's detail panel with toy topic T4 picked
// (src/features/kit-page/toy-editors.ts): its words, documents and nearest topics.
const fmt = (v: number) => v.toLocaleString("en-GB", { maximumFractionDigits: 2, minimumFractionDigits: 2 });
const jaccard = (a: string[], b: string[]) => {
  const B = new Set(b);
  return a.filter((w) => B.has(w)).length / new Set([...a, ...b]).size;
};
const noop = () => undefined;
const t = TOPICS[4];
const others = TOPICS.filter((x) => x.id !== t.id);
const byWords = others.map((x) => ({ x, s: jaccard(t.words, x.words) })).sort((a, b) => b.s - a.s).slice(0, 4);
const byMap = others.map((x) => ({ x, s: Math.hypot(x.x - t.x, x.y - t.y) })).sort((a, b) => a.s - b.s).slice(0, 4);

export const TopicPicked = () => (
  <DetailPanel
    kicker="Selected topic"
    title={t.name}
    sub={`${t.docs} of ${TOPICS.reduce((s, x) => s + x.docs, 0)} toy documents`}
    stats={[{ label: "Documents", value: t.docs }, { label: "Top word", value: t.words[0] }, { label: "Map position", value: `${fmt(t.x)}, ${fmt(t.y)}` }]}
    words={t.words}
    items={t.examples}
    itemsTitle="Representative documents"
    nearest={[
      { title: "Nearest by shared words", rows: byWords.map(({ x, s }) => ({ key: String(x.id), label: x.name, score: s, onPick: noop })) },
      { title: "Nearest on the map", rows: byMap.map(({ x, s }) => ({ key: String(x.id), label: x.name, score: s, onPick: noop })) },
    ]}
    empty="Pick a topic on the map to see its words and documents."
  />
);
