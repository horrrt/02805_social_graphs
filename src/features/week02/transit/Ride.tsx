"use client";
// The journey ticket (#ride) that ride.mjs mountRide() drew on main: one of
// the selected station's example journeys before and after its closure. The
// reader guesses whether the journey survives (or just closes the station),
// which reveals the closure for the whole page; "Reopen the station" runs
// challenge() again. Each stop opens a line about its article. Paths come from
// ride.mjs journey(), calculated on the frozen graph, not scripted.
import { useMemo } from "react";
import { island, useIslandReady } from "@/lib/island";
import { useStore } from "@/lib/useStore";
import { JOURNEYS, journey } from "@/scripts/ride.mjs";
import { type Model, useTransit } from "./model";
import { arrive, inspect, pickJourney, reopen, transit } from "./store.js";

type State = { closure: string; journey: number; guess: boolean | null; rideClosed: boolean; inspector: string | null };
const all = (s: State) => s;

const INSPECTOR = "Select a station on either route to inspect its article. Each hop follows a real link, in either direction.";
const NOTE = "A route view, not the full network. Each stop is a Wikipedia article; positions only show the order of the journey. Journey predictions are not scored or saved.";

type Parts = {
  outcome?: string;
  title: string;
  station: string;
  options: React.ReactNode;
  journey?: number;
  onJourney?: (i: number) => void;
  beforeLabel: string;
  before: React.ReactNode;
  closed: boolean;
  afterLabel: string;
  after: React.ReactNode;
  afterNote: string;
  result: string;
  inspector: string;
  live: boolean;
};

function Ride(p: Parts) {
  return (
    <section className="ride" id="ride" aria-labelledby="ride-title" data-outcome={p.outcome}>
      <div className="ride-ticket">
        <div>
          <p className="eyebrow">Marvel Transit · journey ticket</p>
          <h3 id="ride-title">{p.title}</h3>
          <p id="ride-station">{p.station}</p>
        </div>
        <label>
          Journey
          <select
            key={p.live ? "live" : "server"}
            id="ride-journey"
            aria-label="Journey"
            value={p.live ? String(p.journey) : undefined}
            onChange={p.onJourney ? (e) => p.onJourney!(Number(e.target.value) || 0) : undefined}
          >
            {p.options}
          </select>
        </label>
      </div>
      <div className="ride-route">
        <h4 id="ride-before-label">{p.beforeLabel}</h4>
        <ol id="ride-before" className="ride-track" aria-label="Route before closure">
          {p.before}
        </ol>
      </div>
      <div className="ride-route" id="ride-after-panel" hidden={!p.closed}>
        <h4 id="ride-after-label">{p.afterLabel}</h4>
        <ol id="ride-after" className="ride-track" aria-label="Route after closure">
          {p.after}
        </ol>
        <p className="fine" id="ride-after-note">
          {p.afterNote}
        </p>
      </div>
      <p id="ride-result" className="ride-result" aria-live="polite">
        {p.result}
      </p>
      <div className="control-row" id="ride-choices" hidden={p.closed}>
        <button type="button" data-arrive="yes" onClick={p.live ? () => arrive("yes") : undefined}>I can still arrive</button>
        <button type="button" className="quiet" data-arrive="no" onClick={p.live ? () => arrive("no") : undefined}>
          I’ll be cut off
        </button>
        <button type="button" className="quiet" data-arrive="skip" onClick={p.live ? () => arrive("skip") : undefined}>
          Just close the station
        </button>
      </div>
      <button type="button" className="quiet" id="ride-reset" hidden={!p.closed} onClick={p.live ? reopen : undefined}>
        Reopen the station
      </button>
      <p className="fine" id="ride-inspector" aria-live="polite">
        {p.inspector}
      </p>
      <p className="fine">{NOTE}</p>
    </section>
  );
}

const SERVER: Parts = {
  title: "Choose your journey",
  station: "",
  options: null,
  beforeLabel: "Normal service",
  before: null,
  closed: false,
  afterLabel: "After closure",
  after: null,
  afterNote: "",
  result: "Loading the route…",
  inspector: "",
  live: false,
};

function Stops({ model, path, station, closed, broken = false }: { model: Model; path: string[]; station: string; closed: boolean; broken?: boolean }) {
  const label = (id: string) => model.byId.get(id)!.name.replace(/ \([^)]*\)/g, "");
  return (
    <>
      {path.map((id, i) => {
        const closedStop = broken && id === station;
        const n = model.byId.get(id)!;
        return (
          <li key={i} className={closedStop ? "closed-stop" : ""}>
            <button
              type="button"
              className="ride-stop"
              aria-label={`${label(id)}${closedStop ? ", closed" : ""}: inspect article`}
              onClick={() =>
                inspect(
                  `${label(id)}: ${n.degree} directly connected articles, ${n.kin} incoming references and ${n.kout} outgoing references in the frozen roster. ${closed && id === station ? "This article and its links are removed from the current model." : "The route shows just the links needed for this journey."}`,
                )
              }
            >
              {label(id)}
            </button>
          </li>
        );
      })}
    </>
  );
}

function RideView() {
  const model = useTransit();
  const s = useStore(transit, all);
  const station = s.closure;
  const journeys = JOURNEYS[station as keyof typeof JOURNEYS] as [string, string][];
  const [from, to] = journeys[s.journey] ?? journeys[0];
  const result = useMemo(
    () => (model ? (journey(model.data, from, to, station) as { before: string[]; after: string[] | null }) : null),
    [model, from, to, station],
  );
  useIslandReady(model !== null);
  if (!model || !result) return <Ride {...SERVER} />;

  const label = (id: string) => model.byId.get(id)!.name.replace(/ \([^)]*\)/g, "");
  const closed = s.rideClosed;
  const arrived = !!result.after;
  let outcome = "waiting";
  let resultText = `If ${label(station)} closes, can this journey still arrive?`;
  let afterLabel = SERVER.afterLabel;
  let afterNote = "";
  let after: React.ReactNode = null;
  if (closed) {
    outcome = arrived ? "arrived" : "cut-off";
    after = <Stops model={model} path={result.after || result.before} station={station} closed={closed} broken={!arrived} />;
    afterLabel = arrived ? `After closure · ${result.after!.length - 1} hops` : "After closure · no route";
    const verdict = arrived
      ? `You can still arrive. ${result.after!.length > result.before.length ? `The shortest route now takes ${result.after!.length - 1} hops instead of ${result.before.length - 1}.` : "A shortest route still takes the same number of hops."}`
      : `Journey cut off. There is no route from ${label(from)} to ${label(to)} anywhere in the remaining network.`;
    let prefix = "";
    if (s.guess === arrived) prefix = "Your prediction holds. ";
    else if (s.guess !== null) prefix = "The network does something different. ";
    resultText = `${prefix}${verdict}`;
    afterNote = arrived
      ? "This is one shortest surviving route. Other routes may exist."
      : "The crossed-out station shows where the old route breaks. We checked the whole remaining core, not only the stops drawn here.";
  }
  return (
    <Ride
      live
      outcome={outcome}
      title={`${label(from)} → ${label(to)}`}
      station={`Planned closure: ${label(station)}`}
      options={journeys.map(([a, b], i) => (
        <option key={i} value={i}>{`${label(a)} → ${label(b)}`}</option>
      ))}
      journey={s.journey}
      onJourney={pickJourney}
      beforeLabel={`Normal service · ${result.before.length - 1} hops`}
      before={<Stops model={model} path={result.before} station={station} closed={closed} />}
      closed={closed}
      afterLabel={afterLabel}
      after={after}
      afterNote={afterNote}
      result={resultText}
      inspector={s.inspector ?? INSPECTOR}
    />
  );
}

const RideHost = () => <Ride {...SERVER} />;

export const RideTicket = island("week02/transit/Ride", RideView, RideHost, { roots: ["#ride"] });
