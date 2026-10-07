"use client";
// The editors batch's demos on the kit page: a cut dendrogram beside the
// network it splits, a matrix that draws its own network, a partition to
// edit by hand, an ego network, a clique hunt, two pipelines, a strip of
// stages and a detail panel, each on toy data from toy-editors.ts. One island
// per [data-demo] host, wrapped by DemoEditors as demos-networks.tsx wraps
// its own.
import { useCallback, useId, useMemo, useState, type ReactNode } from "react";
import {
  CountMatrix, Dendrogram, DetailPanel, EditableMatrix, EgoEditor, NetCanvas, NetworkView, NodePicker, PartitionEditor, Readouts, StageTabs, StepFlow,
} from "@/kit";
import type { CanvasLink, CanvasNode } from "@/kit/NetCanvas";
import type { DendroCut, NetId, PickerGraph } from "@/kit";
import { bestCut, blocksOf, cutAt, levels, modularityTerms } from "@/kit/dendro-core.js";
import { modularity } from "@/kit/graph-core";
import { toEdges } from "@/kit/matrix-core.js";
import { island, useIslandReady } from "@/lib/island";
import { useHydrated } from "@/lib/useHydrated";
import { KARATE, karateLayout } from "./toy-networks";
import {
  BIAS_FLOW, BOW_DOCS, EGO, MATRIX_EXAMPLE, MATRIX_LABELS, NLP_STAGES, TOPICS, ZACHARY_SPLIT, cliqueGraph, karateNodes, karatePresets, karateTree,
} from "./toy-editors";

const fmt = (v: number, d = 3) => v.toLocaleString("en-GB", { maximumFractionDigits: d, minimumFractionDigits: d });

function useShown() {
  const hydrated = useHydrated();
  useIslandReady(hydrated);
  return hydrated;
}

/** A row of toggle buttons, one pressed. */
function Chips<T extends string | number>({ label, options, value, onPick }: { label: string; options: [T, string][]; value: T; onPick: (v: T) => void }) {
  return (
    <span className="w5-chips" role="group" aria-label={label}>
      {options.map(([v, text]) => (
        <button key={String(v)} type="button" aria-pressed={v === value} onClick={() => onPick(v)}>
          {text}
        </button>
      ))}
    </span>
  );
}

// ---------------------------------------------------------------- dendrogram

function DendroView() {
  const shown = useShown();
  const id = useId();
  const [mode, setMode] = useState<"one" | "best">("best");
  const [h, setH] = useState("0.69");
  const [picked, setPicked] = useState<number | null>(null);
  const { merges, tree } = useMemo(() => karateTree(), []);
  const term = useMemo(() => modularityTerms(KARATE), []);
  const qOf = useCallback((clusters: number[]) => clusters.reduce((s, c) => s + term(tree.members[c]), 0), [term, tree]);
  const metric = useMemo(() => {
    const points = (levels(tree) as { h: number; clusters: number[] }[]).map((l) => [l.h, qOf(l.clusters)] as [number, number]);
    const best = points.reduce((b, p) => (p[1] > b[1] ? p : b), points[0]);
    return { label: "modularity Q of the cut", points, best: { y: best[1], label: `best single cut, Q ${fmt(best[1])}` } };
  }, [tree, qOf]);
  const height = Math.max(0, Math.min(1, Number(h) || 0));
  const clusters = useMemo(() => (mode === "best" ? (bestCut(tree, term).clusters as number[]) : (cutAt(tree, height) as number[])), [mode, tree, term, height]);
  const cut: DendroCut = mode === "best" ? { clusters } : { height };
  const { partition, blocks } = blocksOf(tree, clusters) as { partition: number[]; blocks: { cluster: number; members: number[] }[] };
  const sel = blocks.find((b) => b.cluster === picked) ?? null;
  const q = modularity(KARATE, partition) as number;
  const at = shown ? karateLayout() : [];
  const nodes: CanvasNode[] = partition.map((g, v) => ({
    id: String(v),
    x: at[v]?.[0],
    y: at[v]?.[1],
    label: String(v),
    group: g < 8 && blocks[g].members.length >= 2 ? g : null,
    state: sel && !sel.members.includes(v) ? "ghost" : undefined,
  }));
  const links: CanvasLink[] = KARATE.map(([a, b]) => ({ s: String(a), t: String(b), highlight: Boolean(sel && sel.members.includes(a) && sel.members.includes(b)) }));
  return (
    <div data-demo="ed-dendro">
      {shown ? (
        <div className="kit-net-demo">
          <div className="kit-controls">
            <Chips label="Cut" options={[["one", "One cut for every branch"], ["best", "Best cut, branch by branch"]]} value={mode} onPick={(m) => (setMode(m), setPicked(null))} />
            {mode === "one" ? (
              <>
                <label htmlFor={id}>Cut height</label>
                <input id={id} type="range" min={0} max={1} step={0.01} value={h} onChange={(e) => (setH(e.target.value), setPicked(null))} />
                <output htmlFor={id}>{fmt(height, 2)}</output>
              </>
            ) : null}
            <span className="kit-note">Click a block to see its members in the network.</span>
          </div>
          <div className="kit-ed-pair">
            <Dendrogram
              merges={merges}
              n={34}
              labels={Array.from({ length: 34 }, (_, i) => String(i))}
              cut={cut}
              selected={picked ?? undefined}
              onSelect={(b) => setPicked((p) => (p === b.cluster ? null : b.cluster))}
              metric={metric}
              yLabel="share of links left"
              aria={`Girvan–Newman's tree of the karate club, cut into ${blocks.length} blocks`}
            />
            <NetCanvas
              nodes={nodes}
              links={links}
              height={360}
              aria={`Zachary's karate club coloured by the dendrogram's blocks${sel ? `; ${sel.members.length} members picked` : ""}`}
              tooltip={(n) => [`Member ${n.id}`, `block of ${blocks[partition[Number(n.id)]].members.length}`]}
            />
          </div>
          <Readouts
            items={[
              { label: "Blocks", value: blocks.length, sub: `${blocks.filter((b) => b.members.length >= 2).length} of two or more` },
              { label: "Modularity Q", value: fmt(q) },
              { label: "Picked block", value: sel ? `${sel.members.length} members` : "none" },
            ]}
          />
        </div>
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------- matrix

function MatrixView() {
  const shown = useShown();
  const [m, setM] = useState(MATRIX_EXAMPLE);
  const edges = toEdges(m) as [number, number, number][];
  const spec = {
    ratio: 0.8,
    layout: "circle" as const,
    directed: true,
    nodes: MATRIX_LABELS.map((label, i) => ({ id: i, x: 0, y: 0, label })),
    links: edges.map(([a, b, w]) => ({ source: a, target: b, width: 1 + Math.min(4, Math.abs(w)) * 0.7, title: `${MATRIX_LABELS[a]} → ${MATRIX_LABELS[b]}: ${w}` })),
    labels: "inside" as const,
    radius: 13,
    aria: `The directed network the matrix describes: ${edges.length} links among ${MATRIX_LABELS.length} people`,
  };
  return (
    <div data-demo="ed-matrix">
      {shown ? (
        <div className="kit-ed-pair">
          <NetworkView spec={spec} />
          <EditableMatrix labels={MATRIX_LABELS} initial={MATRIX_EXAMPLE} example={MATRIX_EXAMPLE} onChange={setM} caption="Row i, column j: messages from i to j. Type a number into a cell." />
        </div>
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------- partition

function PartitionView() {
  const shown = useShown();
  const nodes = useMemo(() => (shown ? karateNodes(0.62) : []), [shown]);
  const presets = useMemo(() => karatePresets(), []);
  const louvainQ = modularity(KARATE, presets[1].partition) as number;
  return (
    <div data-demo="ed-partition">
      {shown ? (
        <PartitionEditor
          nodes={nodes}
          edges={KARATE}
          groups={["Group 1", "Group 2", "Group 3", "Group 4"]}
          initial={ZACHARY_SPLIT}
          presets={presets}
          reference={{ y: louvainQ, label: `Louvain ${fmt(louvainQ)}` }}
          aria="Zachary's karate club, 34 members, coloured by the groups you give them"
        />
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------- ego

function EgoView() {
  const shown = useShown();
  return <div data-demo="ed-ego">{shown ? <EgoEditor focal={EGO.focal} neighbours={EGO.neighbours} initial={EGO.initial} seed={3} /> : null}</div>;
}

// ---------------------------------------------------------------- clique hunt

function CliqueView() {
  const shown = useShown();
  const [k, setK] = useState(4);
  const generate = useCallback((seed: number) => cliqueGraph(seed, k), [k]);
  // A pick wins when every pair is linked: a G(n, p) can hold a k-clique of its own besides the planted one.
  const check = useCallback(
    (picked: NetId[], g: PickerGraph) => {
      const set = new Set(g.links.map((l) => `${l.source}|${l.target}`));
      const linked = (a: NetId, b: NetId) => set.has(`${a}|${b}`) || set.has(`${b}|${a}`);
      let missing = 0;
      for (let i = 0; i < picked.length; i++) for (let j = i + 1; j < picked.length; j++) if (!linked(picked[i], picked[j])) missing += 1;
      return missing === 0 ? { ok: true, msg: `Yes: all ${(k * (k - 1)) / 2} pairs are linked, a ${k}-clique.` } : { ok: false, msg: `Not yet: ${missing} of the ${(k * (k - 1)) / 2} pairs are not linked.` };
    },
    [k],
  );
  return (
    <div data-demo="ed-clique">
      {shown ? (
        <div className="kit-net-demo">
          <div className="kit-controls">
            <Chips label="Clique size" options={[[3, "3-clique"], [4, "4-clique"], [5, "5-clique"]]} value={k} onPick={setK} />
          </div>
          <NodePicker
            key={k}
            k={k}
            seed={1}
            generate={generate}
            check={check}
            prompt={
              <p>
                Pick <b>{k}</b> people who are all linked to each other. A {k}-clique has {(k * (k - 1)) / 2} links, one per pair. Tip: start from someone with many links.
              </p>
            }
            aria={`A random network of twelve people with a ${k}-clique hidden in it`}
          />
        </div>
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------- pipelines

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

function FlowView() {
  const shown = useShown();
  return (
    <div data-demo="ed-flow">
      {shown ? (
        <div className="kit-ed-stack">
          <StepFlow steps={BIAS_FLOW} label="How one version of the world becomes the next" />
          <StepFlow steps={BOW_FLOW} heads={["The general process", "One toy example"]} label="From raw documents to a bag-of-words matrix" />
        </div>
      ) : null}
    </div>
  );
}

function StagesView() {
  const shown = useShown();
  return <div data-demo="ed-stages">{shown ? <StageTabs stages={NLP_STAGES} label="From counts to large language models" /> : null}</div>;
}

// ---------------------------------------------------------------- detail panel

const jaccard = (a: string[], b: string[]) => {
  const B = new Set(b);
  const both = a.filter((w) => B.has(w)).length;
  return both / new Set([...a, ...b]).size;
};

function DetailView() {
  const shown = useShown();
  const [picked, setPicked] = useState<number | null>(4);
  const t = picked === null ? null : TOPICS[picked];
  const spec = {
    ratio: 0.7,
    nodes: TOPICS.map((x) => ({ id: x.id, x: x.x, y: x.y, label: `T${x.id}`, value: x.docs, state: x.id === picked ? ("ring" as const) : undefined, title: `${x.name}: ${x.words.slice(0, 3).join(", ")}` })),
    links: [],
    scale: [9, 26] as [number, number],
    labels: "inside" as const,
    aria: "Eight toy topics on a 2D map, sized by their number of documents",
  };
  const others = TOPICS.filter((x) => t && x.id !== t.id);
  const byWords = t ? others.map((x) => ({ x, s: jaccard(t.words, x.words) })).sort((a, b) => b.s - a.s).slice(0, 4) : [];
  const byMap = t ? others.map((x) => ({ x, s: Math.hypot(x.x - t.x, x.y - t.y) })).sort((a, b) => a.s - b.s).slice(0, 4) : [];
  return (
    <div data-demo="ed-detail">
      {shown ? (
        <div className="kit-ed-detail">
          <div>
            <div className="kit-controls">
              <button type="button" onClick={() => setPicked(null)} disabled={picked === null}>
                Clear the pick
              </button>
              <span className="kit-note">Click a topic, or Tab to it and press Enter.</span>
            </div>
            <NetworkView spec={spec} onNodeClick={(id) => setPicked(Number(id))} />
          </div>
          <DetailPanel
            kicker="Selected topic"
            title={t?.name}
            sub={t ? `${t.docs} of ${TOPICS.reduce((s, x) => s + x.docs, 0)} toy documents` : undefined}
            stats={t ? [{ label: "Documents", value: t.docs }, { label: "Top word", value: t.words[0] }, { label: "Map position", value: `${fmt(t.x, 2)}, ${fmt(t.y, 2)}` }] : undefined}
            words={t?.words}
            items={t?.examples}
            itemsTitle="Representative documents"
            nearest={[
              { title: "Nearest by shared words", rows: byWords.map(({ x, s }) => ({ key: String(x.id), label: x.name, score: s, onPick: () => setPicked(x.id) })) },
              { title: "Nearest on the map", rows: byMap.map(({ x, s }) => ({ key: String(x.id), label: x.name, score: s, onPick: () => setPicked(x.id) })) },
            ]}
            empty="Pick a topic on the map to see its words and documents."
          />
        </div>
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
  "ed-dendro": island("kit/demos/EdDendroDemo", DendroView, Empty("ed-dendro"), at("ed-dendro")),
  "ed-matrix": island("kit/demos/EdMatrixDemo", MatrixView, Empty("ed-matrix"), at("ed-matrix")),
  "ed-partition": island("kit/demos/EdPartitionDemo", PartitionView, Empty("ed-partition"), at("ed-partition")),
  "ed-ego": island("kit/demos/EdEgoDemo", EgoView, Empty("ed-ego"), at("ed-ego")),
  "ed-clique": island("kit/demos/EdCliqueDemo", CliqueView, Empty("ed-clique"), at("ed-clique")),
  "ed-flow": island("kit/demos/EdFlowDemo", FlowView, Empty("ed-flow"), at("ed-flow")),
  "ed-stages": island("kit/demos/EdStagesDemo", StagesView, Empty("ed-stages"), at("ed-stages")),
  "ed-detail": island("kit/demos/EdDetailDemo", DetailView, Empty("ed-detail"), at("ed-detail")),
};

export type EditorsDemoName = keyof typeof DEMOS;

function View({ demo }: { demo: EditorsDemoName }): ReactNode {
  const Shown = DEMOS[demo];
  return <Shown />;
}

function Placeholder({ demo }: { demo: EditorsDemoName }) {
  return <div data-demo={demo}></div>;
}

/** <DemoEditors demo="ed-dendro" />: one host of the editors batch on the kit page. */
export const DemoEditors = island("kit/demos/DemoEditors", View, Placeholder, {
  roots: (Object.keys(DEMOS) as EditorsDemoName[]).map((demo) => `[data-demo="${demo}"]`),
});
