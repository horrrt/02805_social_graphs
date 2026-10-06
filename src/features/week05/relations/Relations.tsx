"use client";
// Section 1's slots, which week05-relations.js drew into on main: the crossing
// strip (#chart-relations-crossing), the map with its kind switch
// (#relations-map-kind, #chart-relations-map) and the label chips with the
// sentences read by hand (#relations-chips, #relations-lines). Each renders as
// the server did until hydrated and draws once relations.json has loaded, as
// main drew everything after that one await; the map also waits for
// network.json, and its switch answers clicks only once the map has drawn, as
// main wired the buttons then. A failed relations.json leaves every part as
// the server rendered it, the chart hosts swept, and logs one line.
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Concordance, StripChart } from "@/kit";
import type { KwicRow } from "@/kit/Concordance";
import type { StripOptions, StripRow } from "@/kit/StripChart";
import { island, useIslandReady } from "@/lib/island";
import { useData, type DataState } from "@/lib/useData";
import { useHydrated } from "@/lib/useHydrated";
import { asset } from "@/scripts/site.js";
import { FIRST_KIND, FIRST_LABEL, RELATIONS, chips, crossing, lines, mapAria } from "@/scripts/week05-relations.js";
import { ChartHost, ServerHost } from "../map/ChartHost";
import { MarvelMap, useNetworkData } from "../map/MarvelMap";

type Data = Parameters<typeof crossing>[0];

// relations.json, after hydration, with main's one line if it fails.
function useRelations() {
  const hydrated = useHydrated();
  const data = useData<Data>(hydrated ? asset(RELATIONS) : null);
  useLogged(data);
  return { hydrated, data: data.data ?? null };
}

function useLogged(state: DataState<unknown>) {
  useEffect(() => {
    if (state.status === "error") console.error("week05 relations failed", state.error);
  }, [state]);
}

// ---- the crossing strip --------------------------------------------------------

const CROSSING = "chart-relations-crossing";

function CrossingView() {
  const { hydrated, data } = useRelations();
  const chart = useMemo(() => (data ? (crossing(data) as { rows: StripRow[]; opts: StripOptions }) : null), [data]);
  useIslandReady(chart !== null);
  return (
    <ChartHost id={CROSSING} hydrated={hydrated}>
      {chart ? <StripChart rows={chart.rows} opts={chart.opts} /> : null}
    </ChartHost>
  );
}

const CrossingHost = () => <ServerHost id={CROSSING} />;

// ---- the map and its switch ---------------------------------------------------

const MAP = "chart-relations-map";
const KINDS: [string, string][] = [
  ["enemy", "Fight words"],
  ["family", "Family words"],
];

function Kinds({ kind, pick }: { kind: string; pick?: (kind: string) => void }) {
  const [[a, aText], [b, bText]] = KINDS;
  return (
    <div aria-label="Which links to draw" className="w5-chips" id="relations-map-kind" role="group">
      <button aria-pressed={kind === a} data-kind={a} type="button" onClick={pick ? () => pick(a) : undefined}>
        {aText}
      </button>
      {" "}
      <button aria-pressed={kind === b} data-kind={b} type="button" onClick={pick ? () => pick(b) : undefined}>
        {bText}
      </button>
    </div>
  );
}

function MapView() {
  const { hydrated, data } = useRelations();
  // Every click draws a new view, the pressed kind too, as main's show(kind)
  // rebuilt the map on each one: zoom back to 1x, no pin, the tip hidden.
  const [view, setView] = useState({ kind: FIRST_KIND, draw: 0 });
  const pick = (kind: string) => setView((v) => ({ kind, draw: v.draw + 1 }));
  const { kind, draw } = view;
  // The same request MarvelMap makes; the switch only reads whether it is in.
  const net = useNetworkData(hydrated, data !== null);
  const drawn = data !== null && net.status === "ready";
  const options = useMemo(() => ({ aria: mapAria(kind) }), [kind]);
  useIslandReady(drawn);
  return (
    <>
      <Kinds kind={kind} pick={drawn ? pick : undefined} />
      <MarvelMap id={MAP} hydrated={hydrated} after={data !== null} mark={kind} draw={draw} options={options} />
    </>
  );
}

function MapHost() {
  return (
    <>
      <Kinds kind={FIRST_KIND} />
      <ServerHost id={MAP} />
    </>
  );
}

// ---- the sentences read by hand --------------------------------------------------

function Chips({ children }: { children?: ReactNode }) {
  return (
    <div aria-label="Show the sentences for one label" className="w5-chips" id="relations-chips" role="group">
      {children}
    </div>
  );
}

type VerdictRow = { page: string; left: string; hit: string; right: string; mark: string; markTitle: string; note: string };

// Each sentence a concordance row with the two cells main appended after the
// right context: td.w5-mark (✓ or ✗, with a title) and td.w5-verdict (the note).
function verdicts({ caption, rows }: { caption: string; rows: VerdictRow[] }): { caption: string; rows: KwicRow[] } {
  return {
    caption,
    rows: rows.map(({ mark, markTitle, note, ...r }) => ({
      ...r,
      extra: (
        <>
          <td className="w5-mark" title={markTitle}>
            {mark}
          </td>
          <td className="w5-verdict">{note}</td>
        </>
      ),
    })),
  };
}

function LinesView() {
  const { data } = useRelations();
  const [label, setLabel] = useState(FIRST_LABEL);
  const shown = useMemo(() => (data ? verdicts(lines(data, label) as { caption: string; rows: VerdictRow[] }) : null), [data, label]);
  useIslandReady(data !== null);
  return (
    <>
      <Chips>
        {data
          ? chips(data).map((c) => (
              <button key={c.label} type="button" data-label={c.label} aria-pressed={c.label === label} onClick={() => setLabel(c.label)}>
                {c.text}
              </button>
            ))
          : null}
      </Chips>
      <div id="relations-lines">{shown ? <Concordance rows={shown.rows} caption={shown.caption} /> : null}</div>
    </>
  );
}

function LinesHost() {
  return (
    <>
      <Chips />
      <div id="relations-lines"></div>
    </>
  );
}

// One island per part, so a fault in one leaves the others alone.
const PARTS = {
  crossing: island("week05/relations/Crossing", CrossingView, CrossingHost, { roots: [`#${CROSSING}`] }),
  map: island("week05/relations/Map", MapView, MapHost, { roots: ["#relations-map-kind", `#${MAP}`] }),
  lines: island("week05/relations/Lines", LinesView, LinesHost, { roots: ["#relations-chips", "#relations-lines"] }),
};

const HOSTS = { crossing: CrossingHost, map: MapHost, lines: LinesHost };

type Props = { part: keyof typeof PARTS };

function View({ part }: Props) {
  const Part = PARTS[part];
  return <Part />;
}

function Placeholder({ part }: Props) {
  const Host = HOSTS[part];
  return <Host />;
}

// The section renders <Relations part="crossing" />, "map" and "lines": one
// client reference in the page's payload, wrapping each part's own island.
export const Relations = island("week05/relations/Relations", View, Placeholder, {
  roots: [`#${CROSSING}`, "#relations-map-kind", `#${MAP}`, "#relations-chips", "#relations-lines"],
});
