"use client";
// Week 6's parts: every chart, table and the explorer, drawn from the one file
// lookalikes.json (src/scripts/week06-lookalikes.js builds each). Each host
// renders empty on the server and fills once the file has loaded; a failed
// load leaves the hosts empty and each part logs one line. One island per part, so a
// fault in one leaves the others alone.
import { useEffect, useMemo, useState, type ComponentType } from "react";
import { MiniStrip, StripChart, Table } from "@/kit";
import type { MiniSpec } from "@/kit/MiniStrip";
import type { StripOptions, StripRow } from "@/kit/StripChart";
import type { TableSpec } from "@/kit/Table";
import { island, useIslandReady } from "@/lib/island";
import { useData } from "@/lib/useData";
import { useHydrated } from "@/lib/useHydrated";
import { asset } from "@/scripts/site.js";
import {
  choices, contrast, DATA, distanceTable, gapRows, ladder, ladderTable, leanRows, linkedCount, minis, neighbourRows, pickNote, PICKS, readTable,
  short, START, two,
} from "@/scripts/week06-lookalikes.js";

type Data = {
  facts: { gender: { words: Record<string, [string, number][]> }; course: { tfidf: number }; names: { hits: number } } & Record<string, unknown>;
  names: string[];
} & Record<string, unknown>;
type Strip = { rows: StripRow[]; opts: StripOptions };

/** The file after hydration, built into one part; null until built. */
function usePart<T>(build: (data: Data) => unknown) {
  const hydrated = useHydrated();
  const state = useData<Data>(hydrated ? asset(DATA) : null);
  useEffect(() => {
    if (state.status === "error") console.error("week06 lookalikes failed", state.error);
  }, [state]);
  const part = useMemo(() => (state.data ? (build(state.data) as T) : null), [state.data, build]);
  useIslandReady(part !== null || state.status === "error");
  return { part, failed: state.status === "error" };
}

/** What a host shows when lookalikes.json did not load, in place of its chart or table. */
function Failed() {
  return <p className="w6-failed">This part needs the page's data file, which did not load. Reload the page to try again.</p>;
}

const Host = (id: string, className?: string) =>
  function ServerHost() {
    return <div className={className} id={id}></div>;
  };

const stripPart = (id: string, build: (d: Data) => unknown, className?: string) =>
  function StripPart() {
    const { part, failed } = usePart<Strip>(build);
    return <div className={className} id={id}>{part ? <StripChart rows={part.rows} opts={part.opts} /> : failed ? <Failed /> : null}</div>;
  };

const tablePart = (id: string, build: (d: Data) => unknown) =>
  function TablePart() {
    const { part, failed } = usePart<TableSpec>(build);
    return <div id={id}>{part ? <Table {...part} /> : failed ? <Failed /> : null}</div>;
  };

// ---- the findings minis ------------------------------------------------------------------

type Mini = "1" | "2" | "3";
const buildMinis = (d: Data) => minis(d) as unknown as Record<Mini, [MiniSpec, string]>;

const miniPart = (finding: Mini) =>
  function MiniPart() {
    const { part: all } = usePart<Record<Mini, [MiniSpec, string]>>(buildMinis);
    return (
      <div className="w4-mini" data-finding={finding}>
        {all ? (
          <>
            <MiniStrip spec={all[finding][0]} />
            <small>{all[finding][1]}</small>
          </>
        ) : null}
      </div>
    );
  };

const miniHost = (finding: Mini) =>
  function MiniHost() {
    return <div className="w4-mini" data-finding={finding}></div>;
  };

// ---- the words behind women's matches ---------------------------------------------------

const buildWords = (d: Data): TableSpec => {
  const w = d.facts.gender.words;
  const rows = w.no_names.map(([word, share], i) => ({
    rank: i + 1, a: word, as: `${(share * 100).toFixed(1)}%`, b: w.no_names_pronouns[i][0], bs: `${(w.no_names_pronouns[i][1] * 100).toFixed(1)}%`,
  }));
  return {
    caption: "The words that carry the matches between women, by share of their summed cosine",
    columns: [
      { key: "rank", label: "#", num: true }, { key: "a", label: "Names removed" }, { key: "as", label: "Share", num: true },
      { key: "b", label: "Names, he and she removed" }, { key: "bs", label: "Share", num: true },
    ],
    rows,
  };
};

// ---- the explorer ---------------------------------------------------------------------------

type Row = ReturnType<typeof neighbourRows>[number];

function Column({ title, rows, average }: { title: string; rows: Row[]; average: number }) {
  return (
    <div className="w6-col">
      <h3>{title}</h3>
      <p className="w6-count">{`${linkedCount(rows)} of 10 linked, ${rows.filter((r) => r.gender === "woman").length} women. Average over all pages: ${two(average)} linked.`}</p>
      <ol>
        {rows.map((r) => (
          <li key={r.index} className={[r.linked && "w6-linked", r.gender === "woman" && "w6-woman"].filter(Boolean).join(" ") || undefined}>
            <span className="w6-name">{r.name}</span>
            {r.gender ? <span className="w6-gender">{r.gender}</span> : null}
            <span className="w6-where">{r.where}</span>
            <span className="w6-cos">{`cos ${r.cos}`}</span>
            <span className="w6-words">{r.words.join(", ")}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

function Explorer({ data }: { data: Data }) {
  const options = useMemo(() => choices(data) as { i: number; name: string }[], [data]);
  const picks = useMemo(() => PICKS.map((name: string) => [name, data.names.indexOf(name)] as const).filter(([, i]) => i >= 0), [data]);
  const [value, setValue] = useState(String(Math.max(0, data.names.indexOf(START))));
  const index = Number(value);
  const kept = useMemo(() => neighbourRows(data, index, "kept"), [data, index]);
  const removed = useMemo(() => neighbourRows(data, index, "removed"), [data, index]);
  return (
    <>
      <div className="w6-pick">
        <label htmlFor="w6-character">Character</label>
        <select id="w6-character" value={value} onChange={(e) => setValue(e.target.value)}>
          {options.map((o) => (
            <option key={o.i} value={String(o.i)}>{o.name}</option>
          ))}
        </select>
        <span className="w5-chips">
          {picks.map(([name, at]) => {
            const i = String(at);
            return (
              <button key={name} type="button" aria-pressed={i === value} onClick={() => setValue(i)}>
                {short(name)}
              </button>
            );
          })}
        </span>
      </div>
      <p className="w6-note" aria-live="polite">{pickNote(data, index)}</p>
      <div className="w6-cols">
        <Column title="Names kept" rows={kept} average={data.facts.course.tfidf} />
        <Column title="Names removed" rows={removed} average={data.facts.names.hits} />
      </div>
    </>
  );
}

const same = (d: Data) => d;

function ExplorerPart() {
  const { part: data, failed } = usePart<Data>(same);
  return <div className="w6-explorer" id="explore-app">{data ? <Explorer data={data} /> : failed ? <Failed /> : null}</div>;
}

// ---- the hero's contrast: Storm's nearest pages, names kept and removed -----------------

type Contrast = ReturnType<typeof contrast>;
const buildContrast = (d: Data) => contrast(d);

function ContrastList({ title, rows }: { title: string; rows: Row[] }) {
  return (
    <div>
      <p className="w6-hero-h">{title}</p>
      <ol>
        {rows.map((r) => (
          <li key={r.index}>
            <b>{r.name}</b>
            {" "}
            <span>{r.words.slice(0, 2).join(", ")}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

function ContrastPart() {
  const { part, failed } = usePart<Contrast>(buildContrast);
  return (
    <div className="w6-hero-panel w6-contrast" id="hero-contrast">
      {part ? (
        <>
          <ContrastList title={`${part.name}, names kept`} rows={part.kept} />
          <ContrastList title={`${part.name}, names removed`} rows={part.removed} />
        </>
      ) : failed ? <Failed /> : null}
    </div>
  );
}

// ---- the parts ---------------------------------------------------------------------------------

const readKept = (d: Data) => readTable(d, "tfidf");
const readRemoved = (d: Data) => readTable(d, "no_names");

const SPECS = {
  hero: [ContrastPart, Host("hero-contrast", "w6-hero-panel w6-contrast")],
  "1": [miniPart("1"), miniHost("1")],
  "2": [miniPart("2"), miniHost("2")],
  "3": [miniPart("3"), miniHost("3")],
  explore: [ExplorerPart, Host("explore-app", "w6-explorer")],
  ladder: [stripPart("chart-names", ladder), Host("chart-names")],
  ladderTable: [tablePart("names-table", ladderTable), Host("names-table")],
  distance: [tablePart("names-distance", distanceTable), Host("names-distance")],
  readKept: [tablePart("names-read", readKept), Host("names-read")],
  lean: [stripPart("chart-lean", leanRows), Host("chart-lean")],
  gap: [stripPart("chart-gap", gapRows), Host("chart-gap")],
  words: [tablePart("gender-words", buildWords), Host("gender-words")],
  readRemoved: [tablePart("gender-read", readRemoved), Host("gender-read")],
} as const;

type PartName = keyof typeof SPECS;

const ROOTS: Record<PartName, string> = {
  hero: "#hero-contrast",
  "1": '[data-finding="1"]',
  "2": '[data-finding="2"]',
  "3": '[data-finding="3"]',
  explore: "#explore-app",
  ladder: "#chart-names",
  ladderTable: "#names-table",
  distance: "#names-distance",
  readKept: "#names-read",
  lean: "#chart-lean",
  gap: "#chart-gap",
  words: "#gender-words",
  readRemoved: "#gender-read",
};

const PARTS = Object.fromEntries(
  (Object.keys(SPECS) as PartName[]).map((name) => [
    name,
    island(`week06/lookalikes/${name}`, SPECS[name][0], SPECS[name][1], { roots: [ROOTS[name]] }),
  ]),
) as Record<PartName, ComponentType>;

type Props = { part: PartName };

function View({ part }: Props) {
  const Part = PARTS[part];
  return <Part />;
}

function Placeholder({ part }: Props) {
  const Server = SPECS[part][1];
  return <Server />;
}

// The sections render <Part part="…" />: one client reference in the page's
// payload, wrapping each part's own island.
export const Part = island("week06/lookalikes/Part", View, Placeholder, {
  roots: (Object.keys(ROOTS) as PartName[]).map((name) => ROOTS[name]),
});
