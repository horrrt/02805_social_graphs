"use client";
// Section 3's slots, which week05-search.js drew into on main: the stat row
// (#search-stats), the search box with its chips and live ranking
// (#search-chips, the box, #search-live-ranks), the query table's rows
// (#search-tbody), the selected query's detail (#search-detail) and the
// checked passage (#search-passage). Each renders as the server did until
// hydrated. On main one Promise.all over search.json and search_live.json
// drew all of them or none (FP02); here every part draws once search.json has
// loaded, and the ranking, which runs the model on the picked query, once
// search_live.json has too. The box answers Enter and its button only once the
// ranking can draw, as main wired them then. The picked query, the box's text
// and the query last run live in search/store.js, so a row or a chip fills the
// box. A failed file logs one line.
import { useCallback, useEffect, useMemo, type KeyboardEvent } from "react";
import { Passage } from "@/kit";
import { island, useIslandReady } from "@/lib/island";
import { useData, type DataState } from "@/lib/useData";
import { useHydrated } from "@/lib/useHydrated";
import { useStore } from "@/lib/useStore";
import { asset } from "@/scripts/site.js";
import { CHIPS, LIVE, NO_MATCH, SEARCH, checked, detail, firstPick, model, row, stats, targetOf } from "@/scripts/week05-search.js";
import { pick, run, search, type } from "./store.js";

type Data = { summary: any; queries: any[]; checked: any };
type Query = Data["queries"][number];
type Ranked = { id: string; name: string; cosine: number }[] | null;

function useLogged(state: DataState<unknown>) {
  useEffect(() => {
    if (state.status === "error") console.error("week05 search failed", state.error);
  }, [state]);
}

// search.json after hydration, with main's one line if it fails.
function useSearch() {
  const hydrated = useHydrated();
  const state = useData<Data>(hydrated ? asset(SEARCH) : null);
  useLogged(state);
  return { hydrated, data: state.data ?? null };
}

const all = (s: { picked: string | null; text: string | null; ran: { query: string; target: string | null } | null }) => s;

// The selected query: the reader's pick, else firstPick() once search.json is in.
function useSelected(data: Data | null): Query | null {
  const { picked } = useStore(search, all);
  return useMemo(() => {
    if (!data) return null;
    const id = picked ?? firstPick(data);
    return data.queries.find((q) => q.id === id) ?? null;
  }, [data, picked]);
}

// ---- the stat row ------------------------------------------------------------

function StatsView() {
  const { data } = useSearch();
  useIslandReady(data !== null);
  return (
    <div id="search-stats" className="w5-statrow">
      {data
        ? (stats(data.summary) as [string, string][]).map(([value, label]) => (
            <div key={label} className="w5-stat">
              <b>{value}</b>
              <span>{label}</span>
            </div>
          ))
        : null}
    </div>
  );
}

const StatsHost = () => <div id="search-stats" className="w5-statrow"></div>;

// ---- the search box: chips, the box and the live ranking --------------------------

function Ranks({ rows, target }: { rows: Ranked | undefined; target: string | null }) {
  return (
    <ol aria-live="polite" className="w5-rank" id="search-live-ranks">
      {rows === undefined ? null : rows === null ? (
        <li>
          <span className="w5-name">{NO_MATCH}</span>
        </li>
      ) : (
        rows.map((r, i) => {
          const hit = Boolean(target) && r.id === target;
          return (
            <li key={i} className={hit ? "w5-hit" : undefined}>
              <span className="w5-pos">{String(i + 1)}</span>
              <span className="w5-name">{hit ? `${r.name} (target)` : r.name}</span>
              <span className="w5-score">{r.cosine.toFixed(3)}</span>
            </li>
          );
        })
      )}
    </ol>
  );
}

function BoxView() {
  const { hydrated, data } = useSearch();
  const live = useData<object>(hydrated ? asset(LIVE) : null);
  useLogged(live);
  const state = useStore(search, all);
  const selected = useSelected(data);
  // The ranking needs both files, as main's boot() did: the model, and the picked query it first runs.
  const ranker = useMemo(() => (live.data && data ? (model(live.data) as (q: string) => Ranked) : null), [live.data, data]);
  const text = state.text ?? selected?.query ?? "";
  const ran = state.ran ?? (selected ? { query: selected.query as string, target: (selected.expected ?? null) as string | null } : null);
  const query = ran?.query ?? null;
  const rows = useMemo(() => (ranker && query !== null ? ranker(query) : undefined), [ranker, query]);
  useIslandReady(ranker !== null);

  const go = useCallback(() => run(text.trim(), targetOf(selected, text) as string | null), [text, selected]);
  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      go();
    }
  };
  return (
    <>
      <div aria-label="Example queries" className="w5-chips" id="search-chips" role="group">
        {data?.queries.slice(0, CHIPS).map((q) => (
          <button key={q.id} className="w5-chip" type="button" data-id={q.id} aria-pressed={q.id === selected?.id} onClick={() => pick(q.id)}>
            {q.query}
          </button>
        ))}
      </div>
      <div className="w5-search-box">
        <label className="visually-hidden" htmlFor="search-input">Query</label>
        {" "}
        <input
          autoComplete="off"
          id="search-input"
          placeholder="king of Wakanda"
          type="search"
          value={hydrated ? text : undefined}
          onChange={hydrated ? (e) => type(e.target.value) : undefined}
          onKeyDown={ranker ? onKeyDown : undefined}
        />
        {" "}
        <button id="search-run" type="button" onClick={ranker ? go : undefined}>Rank pages</button>
      </div>
      <Ranks rows={rows} target={ran?.target ?? null} />
    </>
  );
}

function BoxHost() {
  return (
    <>
      <div aria-label="Example queries" className="w5-chips" id="search-chips" role="group"></div>
      <div className="w5-search-box">
        <label className="visually-hidden" htmlFor="search-input">Query</label>
        {" "}
        <input autoComplete="off" id="search-input" placeholder="king of Wakanda" type="search" />
        {" "}
        <button id="search-run" type="button">Rank pages</button>
      </div>
      <ol aria-live="polite" className="w5-rank" id="search-live-ranks"></ol>
    </>
  );
}

// ---- the query table and the selected query's detail --------------------------------

function RowsView() {
  const { data } = useSearch();
  const selected = useSelected(data);
  useIslandReady(data !== null);
  return (
    <tbody id="search-tbody">
      {data?.queries.map((q) => {
        const r = row(q) as { id: string; query: string; cells: [string, string?][] };
        return (
          <tr key={r.id} data-id={r.id} aria-selected={r.id === selected?.id}>
            <td>
              <button className="linkish" type="button" onClick={() => pick(r.id)}>
                {r.query}
              </button>
            </td>
            {r.cells.map(([text, cls], i) => (
              <td key={i} className={cls}>
                {text}
              </td>
            ))}
          </tr>
        );
      })}
    </tbody>
  );
}

const RowsHost = () => <tbody id="search-tbody"></tbody>;

function DetailView() {
  const { data } = useSearch();
  const selected = useSelected(data);
  const lines = useMemo(() => (data && selected ? (detail(selected, data.summary) as [string, string?][]) : null), [data, selected]);
  useIslandReady(data !== null);
  return (
    <div aria-live="polite" className="w5-detail" id="search-detail">
      {lines?.map(([text, cls], i) => (
        <p key={i} className={cls}>
          {text}
        </p>
      ))}
    </div>
  );
}

const DetailHost = () => <div aria-live="polite" className="w5-detail" id="search-detail"></div>;

// ---- the checked passage ----------------------------------------------------------

function PassageView() {
  const { data } = useSearch();
  const shown = data ? (checked(data) as { page: string; text: string; highlight: string } | null) : null;
  useIslandReady(data !== null);
  return <div id="search-passage">{shown ? <Passage {...shown} /> : null}</div>;
}

const PassageHost = () => <div id="search-passage"></div>;

// One island per part, so a fault in one leaves the others alone.
const BOX = ["#search-chips", "#search .w5-search-box", "#search-live-ranks"];
const PARTS = {
  stats: island("week05/search/Stats", StatsView, StatsHost, { roots: ["#search-stats"] }),
  box: island("week05/search/Box", BoxView, BoxHost, { roots: BOX }),
  rows: island("week05/search/Rows", RowsView, RowsHost, { roots: ["#search-tbody"] }),
  detail: island("week05/search/Detail", DetailView, DetailHost, { roots: ["#search-detail"] }),
  passage: island("week05/search/Passage", PassageView, PassageHost, { roots: ["#search-passage"] }),
};

const HOSTS = { stats: StatsHost, box: BoxHost, rows: RowsHost, detail: DetailHost, passage: PassageHost };

type Props = { part: keyof typeof PARTS };

function View({ part }: Props) {
  const Part = PARTS[part];
  return <Part />;
}

function Placeholder({ part }: Props) {
  const Host = HOSTS[part];
  return <Host />;
}

// The section renders <Search part="stats" />, "box", "rows", "detail" and
// "passage": one client reference in the page's payload, wrapping each part's
// own island.
export const Search = island("week05/search/Search", View, Placeholder, {
  roots: ["#search-stats", ...BOX, "#search-tbody", "#search-detail", "#search-passage"],
});
