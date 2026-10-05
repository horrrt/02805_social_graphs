"use client";
// Section 4's slots, which week05-autocomplete.js drew into on main: the
// visitor quiz (#ac-scoreboard to #ac-reveal), the map of the groups
// (#chart-autocomplete-map), the modularity strip in More numbers
// (#chart-autocomplete-modularity) and one fake's copied run
// (#autocomplete-run). Each renders as the server did until hydrated and draws
// once autocomplete.json has loaded, the file main awaited first; the map also
// waits for network.json, which main asked for only then. The quiz keeps its
// state in store.js. A failed autocomplete.json leaves every part as the server
// rendered it, the chart hosts swept, and logs one line.
import { useEffect, useMemo, useRef } from "react";
import { Passage, StripChart } from "@/kit";
import type { StripOptions, StripRow } from "@/kit/StripChart";
import { island, useIslandReady } from "@/lib/island";
import { useData } from "@/lib/useData";
import { useHydrated } from "@/lib/useHydrated";
import { useStore } from "@/lib/useStore";
import { asset } from "@/scripts/site.js";
import {
  AUTOCOMPLETE,
  MAP_OPTIONS,
  PICK,
  copiedRun,
  modularity,
  options,
  progress,
  reveal,
  score,
} from "@/scripts/week05-autocomplete.js";
import { ChartHost, ServerHost } from "../map/ChartHost";
import { MarvelMap } from "../map/MarvelMap";
import { lock, pick, quiz, show } from "./store.js";

type Data = Parameters<typeof modularity>[0];
type Fake = { id: string; character: string; text: string; community_index: number };
type Quiz = { index: number; selection: string; locked: Map<string, number>; note: string | null };

// autocomplete.json after hydration, with main's one line if it fails.
function useAutocomplete() {
  const hydrated = useHydrated();
  const state = useData<Data>(hydrated ? asset(AUTOCOMPLETE) : null);
  useEffect(() => {
    if (state.status === "error") console.error("week05 autocomplete failed", state.error);
  }, [state]);
  return { hydrated, data: state.data ?? null };
}

// ---- the quiz --------------------------------------------------------------------

const QUESTION = "Which group's pages trained this fake?";

function Reveal({ data, fake, choice }: { data: Data; fake: Fake; choice: number }) {
  const r = reveal(data, fake, choice);
  return (
    <>
      <p>
        <span className={r.ok ? "w5-ok" : "w5-fail"}>{r.verdict}</span>
        {r.rest}
      </p>
      <p className="w5-hubs">{r.phrases}</p>
      <p className="w5-hubs">{r.plainNote}</p>
      <blockquote className="w5-quote">{r.plain}</blockquote>
    </>
  );
}

const SELECT = (s: Quiz) => s;

function QuizView() {
  const { data } = useAutocomplete();
  const state = useStore(quiz, SELECT) as Quiz;
  const select = useRef<HTMLSelectElement>(null);
  const next = useRef<HTMLButtonElement>(null);
  useIslandReady(data !== null);
  const fake = data ? (data.fakes[state.index] as Fake) : null;
  const done = fake ? state.locked.has(fake.id) : false;
  const groups = useMemo(() => (data ? (options(data) as [string, string][]) : null), [data]);

  const onLock = () => {
    if (!data) return;
    const outcome = lock(data);
    // The Lock button is now disabled; keep keyboard focus in the quiz.
    if (outcome === "locked") next.current?.focus();
    else if (outcome === "empty") select.current?.focus();
  };
  const go = (step: number) => (data ? () => show(data, state.index + step) : undefined);

  return (
    <>
      <p aria-live="polite" className="w5-scoreboard" id="ac-scoreboard">
        {data ? score(data, state.locked, state.note) : null}
      </p>
      <p className="w5-caption" id="ac-progress">
        {data && fake ? progress(data, fake) : null}
      </p>
      <div className="w5-fake">
        <p className="w5-char" id="ac-char">
          {fake?.character}
        </p>
        <p id="ac-text">{fake?.text}</p>
      </div>
      <div className="w5-guess">
        <div>
          <label htmlFor="ac-select">{QUESTION}</label>
          {" "}
          <select
            id="ac-select"
            ref={select}
            value={state.selection}
            disabled={done}
            onChange={(e) => pick(e.target.value)}
          >
            {groups ? <option value="">{PICK}</option> : null}
            {groups?.map(([value, text]) => (
              <option key={value} value={value}>
                {text}
              </option>
            ))}
          </select>
        </div>
        <button id="ac-submit" type="button" disabled={done} onClick={onLock}>
          Lock and reveal
        </button>
      </div>
      <div className="w5-quiz-nav">
        <button data-kind="ghost" id="ac-prev" type="button" onClick={go(-1)}>
          Previous
        </button>
        {" "}
        <button data-kind="ghost" id="ac-next" type="button" ref={next} onClick={go(1)}>
          Next fake
        </button>
      </div>
      <div aria-live="polite" className="w5-reveal" id="ac-reveal" hidden={!done}>
        {data && fake && done ? <Reveal data={data} fake={fake} choice={state.locked.get(fake.id)!} /> : null}
      </div>
    </>
  );
}

function QuizHost() {
  return (
    <>
      <p aria-live="polite" className="w5-scoreboard" id="ac-scoreboard"></p>
      <p className="w5-caption" id="ac-progress"></p>
      <div className="w5-fake">
        <p className="w5-char" id="ac-char"></p>
        <p id="ac-text"></p>
      </div>
      <div className="w5-guess">
        <div>
          <label htmlFor="ac-select">{QUESTION}</label>
          {" "}
          <select id="ac-select"></select>
        </div>
        <button id="ac-submit" type="button">
          Lock and reveal
        </button>
      </div>
      <div className="w5-quiz-nav">
        <button data-kind="ghost" id="ac-prev" type="button">
          Previous
        </button>
        {" "}
        <button data-kind="ghost" id="ac-next" type="button">
          Next fake
        </button>
      </div>
      <div aria-live="polite" className="w5-reveal" id="ac-reveal" hidden></div>
    </>
  );
}

// ---- the map, the modularity strip and the copied run --------------------------------

const MAP = "chart-autocomplete-map";
const MODULARITY = "chart-autocomplete-modularity";

function MapView() {
  const { hydrated, data } = useAutocomplete();
  useIslandReady(data !== null);
  return <MarvelMap id={MAP} hydrated={hydrated} after={data !== null} options={MAP_OPTIONS} />;
}

function ModularityView() {
  const { hydrated, data } = useAutocomplete();
  const chart = useMemo(() => (data ? (modularity(data) as { rows: StripRow[]; opts: StripOptions }) : null), [data]);
  useIslandReady(chart !== null);
  return <ChartHost id={MODULARITY} hydrated={hydrated}>{chart ? <StripChart rows={chart.rows} opts={chart.opts} /> : null}</ChartHost>;
}

function RunView() {
  const { data } = useAutocomplete();
  const run = useMemo(() => (data ? copiedRun(data) : null), [data]);
  useIslandReady(run !== null);
  return (
    <div id="autocomplete-run">
      {run ? (
        <>
          <p>{run.text}</p>
          <Passage {...run.passage} />
        </>
      ) : null}
    </div>
  );
}

const HOSTS = {
  quiz: QuizHost,
  map: () => <ServerHost id={MAP} />,
  modularity: () => <ServerHost id={MODULARITY} />,
  run: () => <div id="autocomplete-run"></div>,
};

const QUIZ_ROOTS = [
  "#ac-scoreboard",
  "#ac-progress",
  "#autocomplete-figure .w5-fake",
  "#autocomplete-figure .w5-guess",
  "#autocomplete-figure .w5-quiz-nav",
  "#ac-reveal",
];

// One island per part, so a fault in one leaves the others alone.
const PARTS = {
  quiz: island("week05/autocomplete/Quiz", QuizView, HOSTS.quiz, { roots: QUIZ_ROOTS }),
  map: island("week05/autocomplete/Map", MapView, HOSTS.map, { roots: [`#${MAP}`] }),
  modularity: island("week05/autocomplete/Modularity", ModularityView, HOSTS.modularity, { roots: [`#${MODULARITY}`] }),
  run: island("week05/autocomplete/Run", RunView, HOSTS.run, { roots: ["#autocomplete-run"] }),
};

type Props = { part: keyof typeof PARTS };

function View({ part }: Props) {
  const Part = PARTS[part];
  return <Part />;
}

function Placeholder({ part }: Props) {
  const Host = HOSTS[part];
  return <Host />;
}

// The section renders <Autocomplete part="quiz" />, "map", "modularity" and
// "run": one client reference in the page's payload, wrapping each part's own
// island.
export const Autocomplete = island("week05/autocomplete/Autocomplete", View, Placeholder, {
  roots: [...QUIZ_ROOTS, `#${MAP}`, `#${MODULARITY}`, "#autocomplete-run"],
});
