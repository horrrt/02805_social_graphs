"use client";
// Section 3's client figure (#staffing-figure), which week04-staffing.js drew
// on main: a scatter of every client with 20 or more placed filings in the
// year, the vendor panel for the client picked by a click or the search, the
// table of the 25 largest, and the vendor-to-client flows; a year toggle
// redraws all of them. Also the numbers of "With filing counts or without?"
// (#staffing-community-stats): its table and every figure its prose quotes.
import { useMemo, useRef, useState } from "react";
import { island, useIslandReady } from "@/lib/island";
import { useHydrated } from "@/lib/useHydrated";
import { useOwnedRef } from "@/lib/useOwnedRef";
import { useTokens, useTypeScale } from "@/lib/useTypeScale";
import { STAFFING_TOKENS, communityStats, coverage, flowsOption, panelFor, scatterOption, tableRows } from "@/scripts/week04-staffing.js";
import { W4Chart } from "../W4Chart";
import { W4Table } from "../W4Table";
import { segKeyDown, segTab } from "../seg";
import { W4, useW4Data } from "../useW4Data";

const YEARS: [string, string][] = [
  ["2022", "2022"],
  ["2023", "2023"],
  ["2024", "2024"],
  ["2025", "2025"],
  ["2026", "2026 · Oct–Jun"],
];

const SCATTER_LABEL =
  "Scatter plot of client companies: placed H-1B filings against the share supplied by the client's largest vendor. The table below lists the same data.";
const FLOWS_LABEL =
  "Flow chart: the eight outsourcing firms that place the most H-1B filings, plus one source for all other firms, on the left; the twenty clients that receive the most on the right; a band for the filings between each pair.";

const HEAD = [{ text: "Client" }, { text: "Sector" }, { text: "Filings", className: "num" }, { text: "Vendors", className: "num" }, { text: "Largest vendor" }, { text: "Its share", className: "num" }];

type Client = { name: string; filings: number; vendors: number; sector: string; top: [number, number][]; rest: number };

function Figure({ live }: { live: boolean }) {
  const root = useRef<HTMLElement>(null);
  const state = useW4Data(live ? W4.data("staffing_clients") : null, "staffing clients");
  const data = state.data as any;
  const scale = useTypeScale();
  const tokens = useTokens(STAFFING_TOKENS as string[], root);
  const T = useMemo(() => (scale && tokens ? { fs: scale.fs, family: scale.family } : null), [scale, tokens]);
  const token = useMemo(() => (name: string) => tokens?.[name] ?? "", [tokens]);
  const hydrated = useHydrated();
  const [year, setYear] = useState("2025");
  const [picked, setPicked] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const rows: Client[] | null = data ? data.years[year].shown : null;
  const selected = rows ? rows.find((d) => d.name === picked) ?? rows[0] : null;
  const scatter = useMemo(() => (data && rows && T ? scatterOption(data, rows, selected, token, T) : null), [data, rows, selected, token, T]);
  const flows = useMemo(() => (data && T ? flowsOption(data.years[year].flows, token, T) : null), [data, year, token, T]);
  const events = useMemo(
    () => ({
      click: (p: { data?: { client?: Client } }) => {
        if (p.data?.client) setPicked(p.data.client.name);
      },
    }),
    [],
  );
  useIslandReady(scatter !== null);
  const panel = data && selected ? panelFor(data, selected) : null;
  const f = data ? data.years[year].flows : null;
  return (
    <figure className="staffing" id="staffing-figure" ref={root}>
      <div className="staffing-controls">
        <div aria-label="Fiscal year, October to September" className="staffing-years" role="group" ref={useOwnedRef()} onKeyDown={segKeyDown}>
          {YEARS.map(([y, label]) => (
            <button key={y} aria-pressed={y === year ? "true" : "false"} data-year={y} type="button" tabIndex={segTab(hydrated, y === year)} onClick={() => setYear(y)}>
              {label}
            </button>
          ))}
        </div>
        <label className="staffing-search">
          Find a client{" "}
          <input
            autoComplete="off"
            list="staffing-names"
            type="search"
            placeholder={rows ? `${rows.length} clients · type a name` : undefined}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              const d = rows?.find((c) => c.name.toLowerCase() === e.target.value.trim().toLowerCase());
              if (d) setPicked(d.name);
            }}
          />
          <datalist id="staffing-names">
            {rows?.map((d) => (
              <option key={d.name} value={d.name}></option>
            ))}
          </datalist>
        </label>
      </div>
      <div className="staffing-grid">
        <div className="staffing-chart">
          <W4Chart aria-label={SCATTER_LABEL} className="chart-host" role="img" option={scatter} onEvents={events} notMerge={false} />
        </div>
        <div aria-live="polite" className="staffing-panel">
          {panel ? (
            <>
              <h3>{panel.name}</h3>
              <p className="meta">{panel.meta}</p>
              <ol>
                {panel.top.map((t: { name: string; share: string; width: string }, i: number) => (
                  <li key={i}>
                    <span className="name" title={t.name}>
                      {t.name}
                    </span>{" "}
                    <span className="share">{t.share}</span>{" "}
                    <span className="track">
                      <span className="fill" style={{ width: t.width }}></span>
                    </span>
                  </li>
                ))}
              </ol>
              {panel.rest ? <p className="rest">{panel.rest}</p> : null}
            </>
          ) : state.status === "error" ? (
            "The figure's data did not load. The table below needs it too."
          ) : (
            "Loading the filings…"
          )}
        </div>
      </div>
      <figcaption>
        One dot per client company with 20 or more H-1B filings that placed a worker there in the year: further right, more filings; higher up, more of them from a single outsourcing firm. Click a dot or type a name to see who supplies that client.
      </figcaption>
      <div className="rx-table-block">
        <h4>The 25 largest clients</h4>
        <W4Table head={HEAD} rows={data && rows ? tableRows(data, rows).map((r: string[]) => r.map((text, j) => ({ text, className: HEAD[j].className }))) : []} />
      </div>
      <div className="staffing-flows">
        <h3>Who supplies the largest clients</h3>
        <W4Chart aria-label={FLOWS_LABEL} className="chart-host" role="img" option={flows} />
        <p className="flows-caption">
          The eight firms that place the most filings, and the 20 clients that receive the most, in the year chosen above. Band width is the number of placed filings from a firm to a client; the grey source gathers every other firm. Each client sits next to the named firm that supplies it most. Hover a firm or a client to follow its bands.{" "}
          <span className="flows-coverage">{f ? coverage(f) : null}</span>
        </p>
      </div>
    </figure>
  );
}

function Server() {
  return <Figure live={false} />;
}

function View() {
  return <Figure live />;
}

/** <StaffingFigure />: the whole figure#staffing-figure. */
export const StaffingFigure = island("week04/staffing/StaffingFigure", View, Server, { roots: ["#staffing-figure"] });

// ---- "With filing counts or without?"

function useStats() {
  const state = useW4Data(W4.data("staffing_communities"), "staffing communities");
  const stats = useMemo(() => (state.data ? communityStats(state.data) : null), [state.data]);
  return { stats, failed: state.status === "error" };
}

function StatServer({ k }: { k: string }) {
  return <b className={k}>…</b>;
}

function StatView({ k }: { k: string }) {
  const { stats } = useStats();
  useIslandReady(stats !== null);
  return <b className={k}>{stats ? (stats.values as Record<string, string>)[k] : "…"}</b>;
}

/** <StaffingStat k="cross" />: one number the card's prose quotes. */
export const StaffingStat = island("week04/staffing/StaffingStat", StatView, StatServer, { roots: ["#staffing-community-stats b"] });

const RIGHT = { textAlign: "right" as const };
const STATS_HEAD = [{ text: "" }, { text: "Weighted", style: RIGHT }, { text: "Unweighted", style: RIGHT }];

function StatsTableServer() {
  return (
    <table className="ego">
      <thead>
        <tr>
          <th></th>
          <th style={RIGHT}>Weighted</th>
          <th style={RIGHT}>Unweighted</th>
        </tr>
      </thead>
      <tbody></tbody>
    </table>
  );
}

function StatsTableView() {
  const { stats, failed } = useStats();
  useIslandReady(stats !== null || failed);
  if (failed) return <W4Table className="ego" head={STATS_HEAD} rows={[["The community numbers did not load."]]} />;
  if (!stats) return <StatsTableServer />;
  return <W4Table className="ego" head={STATS_HEAD} rows={stats.rows.map(([k, a, b]: string[]) => [k, { text: a, style: RIGHT }, { text: b, style: RIGHT }])} />;
}

/** <StaffingStatsTable />: the card's weighted-against-unweighted table. */
export const StaffingStatsTable = island("week04/staffing/StaffingStatsTable", StatsTableView, StatsTableServer, { roots: ["#staffing-community-stats table"] });
