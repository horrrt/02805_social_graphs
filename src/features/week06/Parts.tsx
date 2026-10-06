"use client";
// Week 6's parts: every chart, table and the explorer, drawn from the one file
// lookalikes.json (src/scripts/week06-lookalikes.js builds each). Each host
// renders empty on the server and fills once the file has loaded; a failed
// load leaves the hosts empty and logs one line. One island per part, so a
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
  choices, DATA, distanceTable, genderRows, ladder, ladderTable, linkedCount, minis, neighbourRows, PICKS, readTable, short, START,
} from "@/scripts/week06-lookalikes.js";

type Data = {
  facts: { gender: { words: Record<string, [string, number][]> } } & Record<string, unknown>;
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
  useIslandReady(part !== null);
  return part;
}

const Host = (id: string, className?: string) =>
  function ServerHost() {
    return <div className={className} id={id}></div>;
  };

const stripPart = (id: string, build: (d: Data) => unknown, className?: string) =>
  function StripPart() {
    const part = usePart<Strip>(build);
    return <div className={className} id={id}>{part ? <StripChart rows={part.rows} opts={part.opts} /> : null}</div>;
  };

const tablePart = (id: string, build: (d: Data) => unknown) =>
  function TablePart() {
    const part = usePart<TableSpec>(build);
    return <div id={id}>{part ? <Table {...part} /> : null}</div>;
  };

// ---- the findings minis ------------------------------------------------------------------

type Mini = "1" | "2" | "3";
const buildMinis = (d: Data) => minis(d) as unknown as Record<Mini, [MiniSpec, string]>;

const miniPart = (finding: Mini) =>
  function MiniPart() {
    const all = usePart<Record<Mini, [MiniSpec, string]>>(buildMinis);
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

function Column({ title, rows }: { title: string; rows: Row[] }) {
  return (
    <div className="w6-col">
      <h4>
        {title}
        {" "}
        <span className="w6-count">{`${linkedCount(rows)} of 10 linked`}</span>
      </h4>
      <ol>
        {rows.map((r) => (
          <li key={r.index} className={r.linked ? "w6-linked" : undefined}>
            <span className="w6-name">{r.name}</span>
            <span className="w6-where">{r.where}</span>
            <span className="w6-cos">{r.cos}</span>
            <span className="w6-words">{r.words.join(", ")}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

function Explorer({ data }: { data: Data }) {
  const options = useMemo(() => choices(data) as { i: number; name: string }[], [data]);
  const [value, setValue] = useState(String(data.names.indexOf(START)));
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
          {PICKS.map((name) => {
            const i = String(data.names.indexOf(name));
            return (
              <button key={name} type="button" aria-pressed={i === value} onClick={() => setValue(i)}>
                {short(name)}
              </button>
            );
          })}
        </span>
      </div>
      <div className="w6-cols" aria-live="polite">
        <Column title="Names kept" rows={kept} />
        <Column title="Names removed" rows={removed} />
      </div>
    </>
  );
}

const same = (d: Data) => d;

function ExplorerPart() {
  const data = usePart<Data>(same);
  return <div className="w6-explorer" id="explore-app">{data ? <Explorer data={data} /> : null}</div>;
}

// ---- the parts ---------------------------------------------------------------------------------

const readKept = (d: Data) => readTable(d, "tfidf");
const readRemoved = (d: Data) => readTable(d, "no_names");

const SPECS = {
  hero: [stripPart("chart-hero", ladder, "w5-hero-plot w6-hero-panel"), Host("chart-hero", "w5-hero-plot w6-hero-panel")],
  "1": [miniPart("1"), miniHost("1")],
  "2": [miniPart("2"), miniHost("2")],
  "3": [miniPart("3"), miniHost("3")],
  explore: [ExplorerPart, Host("explore-app", "w6-explorer")],
  ladder: [stripPart("chart-names", ladder), Host("chart-names")],
  ladderTable: [tablePart("names-table", ladderTable), Host("names-table")],
  distance: [tablePart("names-distance", distanceTable), Host("names-distance")],
  readKept: [tablePart("names-read", readKept), Host("names-read")],
  gender: [stripPart("chart-gender", genderRows), Host("chart-gender")],
  words: [tablePart("gender-words", buildWords), Host("gender-words")],
  readRemoved: [tablePart("gender-read", readRemoved), Host("gender-read")],
} as const;

type PartName = keyof typeof SPECS;

const ROOTS: Record<PartName, string> = {
  hero: "#chart-hero",
  "1": '[data-finding="1"]',
  "2": '[data-finding="2"]',
  "3": '[data-finding="3"]',
  explore: "#explore-app",
  ladder: "#chart-names",
  ladderTable: "#names-table",
  distance: "#names-distance",
  readKept: "#names-read",
  gender: "#chart-gender",
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
