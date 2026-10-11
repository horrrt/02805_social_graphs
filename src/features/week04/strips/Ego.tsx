"use client";
// Section 3's "One client, many vendors" figure, which week04-vis-intros.js
// built into [data-strip="who-ego"] on main: the firms that staff one client,
// vendors on the left and the client on the right, with a year toggle built
// from staffing_clients.json's years and a search over that year's clients.
// The picked client stays when the year changes if it is there; otherwise
// the year's largest client shows. The caption above follows the pick.
import { useMemo, useRef, useState, type KeyboardEvent } from "react";
import { island, useIslandReady } from "@/lib/island";
import { useHydrated } from "@/lib/useHydrated";
import { useOwnedRef } from "@/lib/useOwnedRef";
import { useFittedWidth } from "@/lib/useSize";
import { EGO_DEFAULT, egoCaption, egoMatches, egoRows, egoYears, twoLines } from "@/scripts/week04-vis-intros.js";
import { segKeyDown, segTab } from "../seg";
import { W4, useW4Data } from "../useW4Data";
import { useT, type T } from "../useT";

const num = (n: number) => n.toLocaleString("en-US");
const TOKENS = ["--w4-placed", "--ink", "--ink-soft", "--card"];
const CAPTION = "The client's largest staffing firms by filings in the year; link width is filings placed there. Pick a year or type any client.";

/** A name cut to fit inside the client's circle; the full name stays in the caption and the label. */
function cut(s: string, room: number, T: T) {
  if (T.measure(s, "caption", 700) <= room) return s;
  let n = s.length - 1;
  while (n > 1 && T.measure(`${s.slice(0, n)}…`, "caption", 700) > room) n -= 1;
  return `${s.slice(0, n)}…`;
}

/** The ego diagram, drawn at its host's width. */
function Diagram({ client, firms, year, T }: { client: any; firms: string[]; year: string; T: T }) {
  const ref = useRef<SVGSVGElement>(null);
  const w = useFittedWidth(ref, 460);
  const { rows, restFirms } = egoRows(client, firms);
  const h = 220;
  const top = 14;
  const gap = rows.length > 1 ? (h - 2 * top) / (rows.length - 1) : 0;
  const r = 32;
  const cx = w - 66;
  const cy = h / 2;
  const small = T.fs("small");
  const caption = T.fs("caption");
  const countW = Math.ceil(Math.max(...rows.map(([, n]: [string, number]) => T.measure(num(n), "small", 700))));
  const xEnd = Math.round(Math.min(Math.max(210, w * 0.45), cx - 150));
  // A long firm name and its filing count must never touch: compress the name
  // to fit the space left of the count's column when it would run into it.
  const maxNameWidth = xEnd - 8 - countW - 12;
  const vmax = Math.max(...rows.map(([, n]: [string, number]) => n));
  const placed = T.token("--w4-placed");
  const ink = T.token("--ink");
  const inkSoft = T.token("--ink-soft");
  const card = T.token("--card");
  const [line1, line2] = twoLines(client.name).map((s: string) => cut(s, 2 * r - 8, T));
  return (
    <svg ref={ref} viewBox={`0 0 ${w} ${h}`} width={w} height={h} role="img" aria-label={`${client.name} and the ${num(client.vendors)} firms that place H-1B workers there in ${year}`} className="w4-ego">
      {rows.map(([name, n]: [string, number], i: number) => {
        const y = top + i * gap;
        const other = i === rows.length - 1 && restFirms > 0;
        const sw = 1 + 9 * (n / vmax);
        const squeeze = maxNameWidth > 0 && T.measure(name, "small", other ? 400 : 600) > maxNameWidth;
        return (
          <g key={i}>
            <path
              d={`M${xEnd} ${y.toFixed(1)} C${xEnd + 90} ${y.toFixed(1)} ${cx - 90} ${cy.toFixed(1)} ${cx - r} ${cy.toFixed(1)}`}
              fill="none"
              stroke={placed}
              strokeWidth={sw.toFixed(1)}
              opacity={other ? 0.3 : 0.62}
            >
              <title>{`${name}: ${num(n)} filings`}</title>
            </path>
            <text
              x={0}
              y={y + 4}
              fontSize={small}
              fill={other ? inkSoft : ink}
              fontWeight={other ? 400 : 600}
              textLength={squeeze ? maxNameWidth : undefined}
              lengthAdjust={squeeze ? "spacingAndGlyphs" : undefined}
            >
              {name}
              <title>{name}</title>
            </text>
            <text x={xEnd - 8} y={y + 4} fontSize={small} fill={inkSoft} fontWeight={700} textAnchor="end">
              {num(n)}
            </text>
          </g>
        );
      })}
      <circle cx={cx} cy={cy} r={r} fill={ink} />
      <text x={cx} y={line2 ? cy - 3 : cy + 4} fontSize={caption} fill={card} fontWeight={700} textAnchor="middle">
        {line1}
      </text>
      {line2 ? (
        <text x={cx} y={cy + 11} fontSize={caption} fill={card} fontWeight={700} textAnchor="middle">
          {line2}
        </text>
      ) : null}
      <text x={cx} y={cy + r + 20} fontSize={small} fill={ink} fontWeight={700} textAnchor="middle">
        {`${num(client.filings)} filings`}
      </text>
    </svg>
  );
}

function Shell({ caption, children }: { caption: string; children?: React.ReactNode }) {
  return (
    <figure className="w4-figure">
      <figcaption>
        <b>One client, many vendors</b>
        <span>{caption}</span>
      </figcaption>
      <div className="w4-figure-body" data-strip="who-ego">
        {children}
      </div>
    </figure>
  );
}

function Server() {
  return <Shell caption={CAPTION} />;
}

function Board({ clients, T }: { clients: any; T: T }) {
  const hydrated = useHydrated();
  const Y = useMemo(() => egoYears(clients), [clients]);
  const [year, setYear] = useState<string>(Y.start);
  const [name, setName] = useState<string>(() => (Y.find(Y.start, EGO_DEFAULT) || Y.largest(Y.start)).name);
  const [query, setQuery] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const list = useRef<HTMLDivElement>(null);
  const client = Y.find(year, name) || Y.largest(year);
  const found = egoMatches(clients, year, query);
  const open = Boolean(found && found.length);
  const pick = (c: any) => {
    setName(c.name);
    setQuery("");
    input.current?.focus();
  };
  const onInputKey = (e: KeyboardEvent) => {
    const first = list.current?.querySelector("button");
    if (e.key === "ArrowDown" && first) {
      e.preventDefault();
      first.focus();
    } else if (e.key === "Enter" && first) {
      e.preventDefault();
      first.click();
    } else if (e.key === "Escape") {
      e.preventDefault();
      setQuery("");
    }
  };
  const onListKey = (e: KeyboardEvent) => {
    const buttons = [...(list.current?.querySelectorAll("button") ?? [])];
    const i = buttons.indexOf(document.activeElement as HTMLButtonElement);
    if (i < 0) return;
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      const next = i + (e.key === "ArrowDown" ? 1 : -1);
      (next < 0 ? input.current : buttons[Math.min(next, buttons.length - 1)])?.focus();
    } else if (e.key === "Escape") {
      e.preventDefault();
      setQuery("");
      input.current?.focus();
    }
  };
  // The stylesheet gives both boxes a display, which beats the hidden attribute.
  const show = (on: boolean) => ({ display: on ? undefined : "none" });
  const empty = found !== null && found.length === 0;
  return (
    <Shell caption={egoCaption(client, year, Y.partial(year))}>
      <div className="rx-ego-ctrl">
        <div className="rx-seg" role="group" aria-label="Year" ref={useOwnedRef()} onKeyDown={segKeyDown}>
          {Y.years.map((y: string) => (
            <button
              key={y}
              type="button"
              aria-pressed={y === year ? "true" : "false"}
              data-year={y}
              tabIndex={segTab(hydrated, y === year)}
              onClick={() => {
                setYear(y);
                setName((n) => (Y.find(y, n) || Y.largest(y)).name);
              }}
            >
              {Y.yearLabel(y)}
            </button>
          ))}
        </div>
        <label className="rx-ego-search">
          <span>Client</span>
          <input
            ref={input}
            type="search"
            placeholder="Type any client, e.g. Apple"
            aria-label="Find a client"
            aria-controls="who-ego-matches"
            aria-expanded={open ? "true" : "false"}
            autoComplete="off"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onInputKey}
          />
        </label>
      </div>
      <div className="rx-ego-matches" id="who-ego-matches" role="group" aria-label="Matching clients" ref={list} style={show(open)} onKeyDown={onListKey}>
        {found?.map((c: any) => (
          <button key={c.name} type="button" onClick={() => pick(c)}>
            {c.name}
            <span>{num(c.filings)}</span>
          </button>
        ))}
      </div>
      <p className="rx-ego-none" aria-live="polite" style={show(empty)}>
        {empty ? `No client with ${num(clients.min_filings)} or more placed filings matches in ${Y.yearLabel(year)}.` : ""}
      </p>
      <div>
        <Diagram client={client} firms={clients.firms} year={year} T={T} />
      </div>
    </Shell>
  );
}

function EgoView() {
  const state = useW4Data(W4.data("staffing_clients"), "who intro");
  const T = useT(TOKENS);
  useIslandReady(Boolean(state.data && T));
  if (!state.data || !T) return <Server />;
  return <Board clients={state.data} T={T} />;
}

/** <EgoFigure />: the whole "One client, many vendors" figure. */
export const EgoFigure = island("week04/strips/EgoFigure", EgoView, Server, { roots: ['[data-strip="who-ego"]'] });
