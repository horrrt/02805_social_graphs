"use client";
// "Plan a route through all 303 articles": the journey planner transit.js
// wired on main. A route is planned from the form's values when it is
// submitted, when a "Try …" button fills it, and whenever the closure
// experiment changes the network (challenge, a reveal, restore); changing a
// select alone plans nothing. Breadth-first search over the directed or
// undirected roster, without the closed station.
import { useEffect, useMemo, useState } from "react";
import { island, useIslandReady } from "@/lib/island";
import { useStore } from "@/lib/useStore";
import { bfs, graph } from "@/scripts/arcade-core.mjs";
import { useTransit } from "./model";
import { transit } from "./store.js";

type State = { closed: string | null; round: number; restored: boolean; results: string | null };
const all = (s: State) => s;

type Plan = { from: string; to: string; directed: boolean };

const NOTE = (
  <p className="fine">
    The planner respects the active closure after its result is
    revealed. Restore service to compare. It uses breadth-first
    search; every hop is a real link in the selected graph.
  </p>
);

function Form({ live, values, onChange, onSubmit, options }: { live: boolean; values: { from: string; to: string; direction: string }; onChange?: (key: string, value: string) => void; onSubmit?: () => void; options?: React.ReactNode }) {
  const bind = (key: "from" | "to" | "direction") =>
    live ? { value: values[key], onChange: (e: React.ChangeEvent<HTMLSelectElement>) => onChange!(key, e.target.value) } : {};
  return (
    <form
      id="route-form"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit?.();
      }}
    >
      <div className="control-row">
        <label>
          From
          <select key={live ? "live" : "server"} id="route-from" {...bind("from")}>
            {options}
          </select>
        </label>
        <label>
          To
          <select key={live ? "live" : "server"} id="route-to" {...bind("to")}>
            {options}
          </select>
        </label>
        <label>
          Travel rules
          <select key={live ? "live" : "server"} id="route-direction" {...bind("direction")}>
            <option value="directed">
              Follow one-way article links
            </option>
            <option value="undirected">Use either direction</option>
          </select>
        </label>
        <button>Find a route</button>
      </div>
    </form>
  );
}

function Actions({ onIsolate, onIsland }: { onIsolate?: () => void; onIsland?: () => void }) {
  return (
    <div className="actions">
      <button className="quiet" id="route-isolate" onClick={onIsolate}>
        Try Baymax → Spider-Man
      </button>
      <button className="quiet" id="route-island" onClick={onIsland}>
        Try the nine-station island
      </button>
    </div>
  );
}

const DEFAULTS = { from: "Spider-Man", to: "Hulk", direction: "directed" };

function PlannerView() {
  const model = useTransit();
  const { closed, round, restored, results } = useStore(transit, all);
  const [values, setValues] = useState(DEFAULTS);
  const [planned, setPlanned] = useState<Plan>({ from: DEFAULTS.from, to: DEFAULTS.to, directed: true });
  useIslandReady(model !== null);

  // challenge(), a reveal and restore each plan again from the form as it stands.
  useEffect(() => {
    setPlanned({ from: values.from, to: values.to, directed: values.direction === "directed" });
    // Only the network's changes plan; the form's own changes wait for a submit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [closed, round, restored, results]);

  const outcome = useMemo(() => {
    if (!model) return null;
    const { data, byId, name } = model;
    const { from, to, directed } = planned;
    const adj = graph(data, { directed, removed: (closed ? [closed] : []) as never[] });
    const path = bfs(adj, from, to) as string[] | null;
    if (closed && (from === closed || to === closed)) return { status: `${name(closed)} is closed. Restore service to plan through that station.`, path: null };
    const status = path
      ? `${path.length - 1} ${path.length === 2 ? "hop" : "hops"} · ${directed ? "one-way article links" : "undirected links"} · ${closed ? name(closed) + " closed" : "original snapshot"}.`
      : `No route from ${name(from)} to ${name(to)} under these rules. ${byId.get(from)!.degree === 0 || byId.get(to)!.degree === 0 ? "One of these articles is an isolate." : "They may lie in separate components, or link direction may block the journey."}`;
    return { status, path };
  }, [model, planned, closed]);

  if (!model || !outcome) {
    return (
      <>
        <Form live={false} values={DEFAULTS} />
        {NOTE}
        <p className="status" id="route-status" role="status"></p>
        <ol className="route-strip" id="route-strip"></ol>
        <Actions />
      </>
    );
  }

  const options = model.data.nodes.map((n) => (
    <option key={n.id} value={n.id}>
      {model.name(n.id)}
    </option>
  ));
  const go = (from: string, to: string) => {
    setValues((v) => ({ ...v, from, to }));
    setPlanned({ from, to, directed: values.direction === "directed" });
  };
  const path = outcome.path;
  return (
    <>
      <Form
        live
        values={values}
        options={options}
        onChange={(key, value) => setValues((v) => ({ ...v, [key]: value }))}
        onSubmit={() => setPlanned({ from: values.from, to: values.to, directed: values.direction === "directed" })}
      />
      {NOTE}
      <p className="status" id="route-status" role="status">
        {outcome.status}
      </p>
      <ol className="route-strip" id="route-strip">
        {path?.map((id, i) => (
          <li key={i}>
            {model.name(id)}
            <small>{i === 0 ? "Start" : i === path.length - 1 ? "Arrive" : "Hop " + i}</small>
          </li>
        ))}
      </ol>
      <Actions onIsolate={() => go("Baymax", "Spider-Man")} onIsland={() => go("Blackthorn_(character)", "Vyking")} />
    </>
  );
}

function PlannerHost() {
  return (
    <>
      <Form live={false} values={DEFAULTS} />
      {NOTE}
      <p className="status" id="route-status" role="status"></p>
      <ol className="route-strip" id="route-strip"></ol>
      <Actions />
    </>
  );
}

export const RoutePlanner = island("week02/transit/Planner", PlannerView, PlannerHost, {
  roots: ["#route-form", "#journey > .fine", "#route-status", "#route-strip", "#journey .actions"],
});
