"use client";
// Week 7's parts: every chart, table and the explorer, drawn from the one file
// comention.json (src/scripts/week07-comention.js builds each). Each host
// renders empty on the server and fills once the file has loaded; a failed
// load leaves the hosts empty and each part logs one line. One island per part, so a
// fault in one leaves the others alone.
import { useEffect, useMemo, useState, type ComponentType } from "react";
import { MiniStrip, Portrait, StripChart, Table } from "@/kit";
import type { MiniSpec } from "@/kit/MiniStrip";
import type { StripOptions, StripRow } from "@/kit/StripChart";
import type { TableSpec } from "@/kit/Table";
import { island, useIslandReady } from "@/lib/island";
import { useData } from "@/lib/useData";
import { useHydrated } from "@/lib/useHydrated";
import { asset } from "@/scripts/site.js";
import {
  bucketTable, choices, DATA, heroSentences, instrumentTable, minis, partners, pickNote, PICK_WHY, PICKS, readTable, sentenceTable, short, START,
  unitPrecision, unitRecall, unitTable, weightRows, weightTable,
} from "@/scripts/week07-comention.js";

type Data = { chars: string[]; facts: Record<string, unknown>; sentences_read: unknown[] } & Record<string, unknown>;
type Strip = { rows: StripRow[]; opts: StripOptions };
type Run = { text: string; name: boolean };

/** The file after hydration, built into one part; null until built. */
function usePart<T>(build: (data: Data) => unknown) {
  const hydrated = useHydrated();
  const state = useData<Data>(hydrated ? asset(DATA) : null);
  useEffect(() => {
    if (state.status === "error") console.error("week07 comention failed", state.error);
  }, [state]);
  const part = useMemo(() => (state.data ? (build(state.data) as T) : null), [state.data, build]);
  useIslandReady(part !== null || state.status === "error");
  return { part, failed: state.status === "error" };
}

/** What a host shows when comention.json did not load, in place of its chart or table. */
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

/** A sentence with the two characters' names marked. */
function Marked({ runs }: { runs: Run[] }) {
  return (
    <>
      {runs.map((r, i) => (r.name ? <mark key={i} className="w7-name">{r.text}</mark> : <span key={i}>{r.text}</span>))}
    </>
  );
}

// ---- the findings minis ------------------------------------------------------------------

type Mini = "1" | "2" | "3" | "4";
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

// ---- the hero: three real sentences and what each tie turned out to be -----------------

type HeroRow = { a: string; b: string; n: number; linked: boolean; runs: Run[]; verdict: string };
const buildHero = (d: Data) => heroSentences(d);

function HeroPart() {
  const { part, failed } = usePart<HeroRow[]>(buildHero);
  return (
    <div className="w6-hero-panel w7-hero" id="hero-sentences">
      {part ? (
        <ol>
          {part.map((r) => (
            <li key={`${r.a}-${r.b}`}>
              <p className="w7-hero-pair">
                <b>{`${r.a} · ${r.b}`}</b>
                {" "}
                <span className={r.linked ? "w7-tag w7-tag-linked" : "w7-tag"}>{r.verdict}</span>
              </p>
              <p className="w7-quote"><Marked runs={r.runs} /></p>
            </li>
          ))}
        </ol>
      ) : failed ? <Failed /> : null}
    </div>
  );
}

// ---- the explorer ---------------------------------------------------------------------------

type Tie = { other: number; name: string; page: string; n: number; linked: boolean; runs: Run[]; from: string };
type Partners = { ties: Tie[]; missed: { name: string; named: boolean }[] };
const SHOWN = 5;
const MISSED = 8;

function Explorer({ data }: { data: Data }) {
  const options = useMemo(() => choices(data) as { i: number; name: string }[], [data]);
  const picks = useMemo(() => PICKS.map((name: string) => [name, data.chars.indexOf(name)] as const).filter(([, i]) => i >= 0), [data]);
  // ?pick=Storm opens the explorer on that character, so a reader can link to a pick.
  const [value, setPick] = useState(() => {
    const asked = new URLSearchParams(window.location.search).get("pick")?.toLowerCase();
    const at = asked ? options.find((o) => o.name.toLowerCase() === asked || data.chars[o.i].toLowerCase() === asked) : undefined;
    return String(at ? at.i : Math.max(0, data.chars.indexOf(START)));
  });
  const [all, setAll] = useState(false);
  const setValue = (next: string) => {
    setPick(next);
    setAll(false);
    const url = new URL(window.location.href);
    url.searchParams.set("pick", short(data.chars[Number(next)]));
    if (!url.hash) url.hash = "explore";
    window.history.replaceState(null, "", url);
  };
  const index = Number(value);
  const { ties, missed } = useMemo(() => partners(data, index) as Partners, [data, index]);
  const why = (PICK_WHY as Record<string, string>)[data.chars[index]];
  const shown = all ? ties : ties.slice(0, SHOWN);
  return (
    <>
      <div className="w6-pick">
        <label htmlFor="w7-character">Character</label>
        <select id="w7-character" value={value} onChange={(e) => setValue(e.target.value)}>
          {options.map((o) => (
            <option key={o.i} value={String(o.i)}>{o.name}</option>
          ))}
        </select>
        <span className="w5-chips">
          {picks.map(([name, at]) => {
            const i = String(at);
            return (
              <button key={name} type="button" aria-pressed={i === value} onClick={() => setValue(i)}>
                <span className="kit-named">
                  <Portrait page={name} size="xs" />
                  {short(name)}
                </span>
              </button>
            );
          })}
        </span>
      </div>
      <p className="w6-note">
        {why ? `${why} ` : null}
        <span aria-live="polite">{pickNote(data, index)}</span>
      </p>
      {ties.length ? (
        <ol className="w7-ties">
          {shown.map((t) => (
            <li key={t.other} className={t.linked ? "w7-linked" : undefined}>
              <Portrait page={t.page} size="xs" />
              <span className="w7-line">
                <span className="w6-name">{t.name}</span>
                <span className="w6-where">{t.linked ? "linked" : "not linked"}<span className="visually-hidden">, </span></span>
                <span className="w7-n">{`${t.n} ${t.n === 1 ? "sentence" : "sentences"}`}</span>
              </span>
              <span className="w7-quote">
                <Marked runs={t.runs} />
                <span className="w7-from">{` · page: ${t.from}`}</span>
              </span>
            </li>
          ))}
        </ol>
      ) : (
        <p className="w6-note">No sentence on any page names this character together with another character from the roster.</p>
      )}
      {ties.length > SHOWN || missed.length > MISSED ? (
        <button type="button" className="w7-more" aria-expanded={all} onClick={() => setAll(!all)}>
          {all ? "Show fewer" : `Show all ${ties.length} ties and ${missed.length} missing ${missed.length === 1 ? "link" : "links"}`}
        </button>
      ) : null}
      {missed.length ? (
        <p className="w7-missed">
          <b>Linked, but never named in one sentence:</b>
          {" "}
          {all || missed.length <= MISSED ? missed.map((m) => m.name).join(", ") : `${missed.slice(0, MISSED).map((m) => m.name).join(", ")} and ${missed.length - MISSED} more`}
          .
        </p>
      ) : null}
    </>
  );
}

const same = (d: Data) => d;

function ExplorerPart() {
  const { part: data, failed } = usePart<Data>(same);
  return <div className="w7-explorer" id="explore-app">{data ? <Explorer data={data} /> : failed ? <Failed /> : <p className="w6-note">Loading the 303 pages…</p>}</div>;
}

// ---- the parts ---------------------------------------------------------------------------------

const pairsBuckets = (d: Data) => bucketTable(d, "pairs");
const linksBuckets = (d: Data) => bucketTable(d, "links");
const pairsRead = (d: Data) => readTable(d, "pairs");
const linksRead = (d: Data) => readTable(d, "links");

const SPECS = {
  hero: [HeroPart, Host("hero-sentences", "w6-hero-panel w7-hero")],
  "1": [miniPart("1"), miniHost("1")],
  "2": [miniPart("2"), miniHost("2")],
  "3": [miniPart("3"), miniHost("3")],
  "4": [miniPart("4"), miniHost("4")],
  explore: [ExplorerPart, Host("explore-app", "w7-explorer")],
  weights: [stripPart("chart-weights", weightRows), Host("chart-weights")],
  weightTable: [tablePart("weights-table", weightTable), Host("weights-table")],
  precision: [stripPart("chart-precision", unitPrecision), Host("chart-precision")],
  recall: [stripPart("chart-recall", unitRecall), Host("chart-recall")],
  unitTable: [tablePart("units-table", unitTable), Host("units-table")],
  instrument: [tablePart("units-instrument", instrumentTable), Host("units-instrument")],
  sentences: [tablePart("units-read", sentenceTable), Host("units-read")],
  pairsBuckets: [tablePart("only-pairs", pairsBuckets), Host("only-pairs")],
  linksBuckets: [tablePart("only-links", linksBuckets), Host("only-links")],
  pairsRead: [tablePart("only-pairs-read", pairsRead), Host("only-pairs-read")],
  linksRead: [tablePart("only-links-read", linksRead), Host("only-links-read")],
} as const;

type PartName = keyof typeof SPECS;

const ROOTS: Record<PartName, string> = {
  hero: "#hero-sentences",
  "1": '[data-finding="1"]',
  "2": '[data-finding="2"]',
  "3": '[data-finding="3"]',
  "4": '[data-finding="4"]',
  explore: "#explore-app",
  weights: "#chart-weights",
  weightTable: "#weights-table",
  precision: "#chart-precision",
  recall: "#chart-recall",
  unitTable: "#units-table",
  instrument: "#units-instrument",
  sentences: "#units-read",
  pairsBuckets: "#only-pairs",
  linksBuckets: "#only-links",
  pairsRead: "#only-pairs-read",
  linksRead: "#only-links-read",
};

const PARTS = Object.fromEntries(
  (Object.keys(SPECS) as PartName[]).map((name) => [
    name,
    island(`week07/comention/${name}`, SPECS[name][0], SPECS[name][1], { roots: [ROOTS[name]] }),
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
export const Part = island("week07/comention/Part", View, Placeholder, {
  roots: (Object.keys(ROOTS) as PartName[]).map((name) => ROOTS[name]),
});
