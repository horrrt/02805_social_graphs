"use client";
// The closure experiment transit.js ran on main: the "Close a station" select,
// the scored prediction under "Predict the total disruption instead", the
// comparison panel that a reveal shows (#disruption-results) and the service
// board's state. Every change of the select runs challenge() (store.js): normal
// service, a fresh prediction and a reset ride. A reveal, from the prediction
// or the ride, closes the station and fills the panel; "Restore service"
// reopens it but keeps the panel with a restored headline.
import { useEffect, useMemo, useRef } from "react";
import { Prediction } from "@/features/arcade/Prediction";
import { island, useIslandReady } from "@/lib/island";
import { useStore } from "@/lib/useStore";
import { outcome } from "@/scripts/arcade-core.mjs";
import { type Model, useTransit } from "./model";
import { challenge, compareStation, markRevealed, restoreService, revealClosure, transit } from "./store.js";

type State = {
  closure: string;
  closed: string | null;
  results: string | null;
  restored: boolean;
  round: number;
  revealed: boolean;
  focus: number;
};
const all = (s: State) => s;

type Outcome = { stranded: string[]; largest: string[]; remaining: number; groups: string[][] };

/** outcome() for a closure, computed once per station. */
function useOutcome(model: Model | null, id: string | null): Outcome | null {
  return useMemo(() => (model && id ? (outcome(model.data, id) as Outcome) : null), [model, id]);
}

// ---- the select -------------------------------------------------------------------------

const OPTIONS = (
  <>
    <option value="Spider-Man">Spider-Man</option>
    <option value="Hulk">Hulk</option>
    <option value="Black_Widow_(Natasha_Romanova)">
      Black Widow
    </option>
    <option value="Doctor_Strange">Doctor Strange</option>
  </>
);

function SelectView() {
  const model = useTransit();
  const { closure, focus } = useStore(transit, all);
  const ref = useRef<HTMLSelectElement>(null);
  useIslandReady(model !== null);
  useEffect(() => {
    if (!focus || !ref.current) return;
    ref.current.focus();
    ref.current.scrollIntoView({ block: "center", behavior: "instant" });
  }, [focus]);
  return (
    <select ref={ref} id="closure-select" value={closure} onChange={(e) => model && challenge(e.target.value)}>
      {OPTIONS}
    </select>
  );
}

const SelectHost = () => <select id="closure-select">{OPTIONS}</select>;

export const ClosureSelect = island("week02/transit/ClosureSelect", SelectView, SelectHost, { roots: ["#closure-select"] });

// ---- the prediction ---------------------------------------------------------------------

function GuessView() {
  const model = useTransit();
  const { closure, closed, round, revealed } = useStore(transit, all);
  const actual = useOutcome(model, closure);
  useIslandReady(model !== null);
  const entry = model?.transit.closures.find((c) => c.id === closure);
  return (
    <details id="numeric-guess" hidden={closed !== null}>
      <summary>Predict the total disruption instead</summary>
      <div className={revealed ? "prediction revealed" : "prediction"} id="prediction">
        {entry && actual ? (
          <Prediction
            key={round}
            id={"w2-close-" + entry.id.replace(/[^a-z0-9]/gi, "-")}
            week={2}
            allowSkip
            autoReveal={false}
            plainLanguage
            prompt={`If ${entry.label} closes, how many other articles lose their route to the largest group?`}
            min={0}
            max={20}
            answer={actual.stranded.length}
            unit="articles"
            explain="The cut-off articles can no longer reach the largest remaining group. Some may still connect to each other."
            onReveal={() => {
              markRevealed();
              revealClosure();
            }}
          />
        ) : null}
      </div>
    </details>
  );
}

const GuessHost = () => (
  <details id="numeric-guess">
    <summary>Predict the total disruption instead</summary>
    <div className="prediction" id="prediction"></div>
  </details>
);

export const ClosureGuess = island("week02/transit/Guess", GuessView, GuessHost, { roots: ["#numeric-guess"] });

// ---- the comparison panel -------------------------------------------------------------

type Panel = {
  headline: string;
  detail: string;
  stranded: React.ReactNode;
  verdict: string;
  compare: string;
  explanation: string;
  hist: React.ReactNode;
  onRestore?: () => void;
  onCompare?: () => void;
};

const EMPTY: Panel = { headline: "", detail: "", stranded: null, verdict: "", compare: "Try Hulk next", explanation: "", hist: null };

function Results({ hidden, panel }: { hidden: boolean; panel: Panel }) {
  return (
    <div id="disruption-results" hidden={hidden}>
      <div className="closure-comparison-grid">
        <div className="board-results">
          <h2 id="disruption-headline">{panel.headline}</h2>
          <p id="disruption-detail">{panel.detail}</p>
          <div id="stranded-list">{panel.stranded}</div>
          <button className="quiet" id="restore-service" onClick={panel.onRestore}>
            Restore service
          </button>
        </div>
        <section className="null-insight" aria-labelledby="null-insight-title">
          <p className="eyebrow">Compared with chance</p>
          <h3 id="null-insight-title">
            Is this more disruption than the link counts explain?
          </h3>
          <p>
            We rearranged the core’s links 1,000 times, keeping every
            article’s number of neighbours and each starting network
            connected. Then we removed the same article.
          </p>
          <p className="null-verdict" id="null-verdict" aria-live="polite">
            {panel.verdict}
          </p>
          <p className="fine">
            This tests a specific rewiring model. It is not the chance of a
            real-world failure or proof of why these links exist.
          </p>
          <button className="quiet" id="compare-station" type="button" onClick={panel.onCompare}>
            {panel.compare}
          </button>
        </section>
      </div>
      <details className="interaction-evidence">
        <summary>Inspect the shuffle distribution and methods</summary>
        <div className="two-col" style={{ marginTop: "24px" }}>
          <div>
            <h3>The comparison that matters</h3>
            <p id="null-explanation">{panel.explanation}</p>
            <div className="histogram" id="null-hist">
              {panel.hist}
            </div>
          </div>
          <div className="note">
            <h3>Same degrees. Different wiring.</h3>
            <p>
              The benchmark rewires the 277-station core while preserving
              each station’s degree. Each starting network must be
              connected. Then the same station is removed.
            </p>
            <p className="fine">
              The 1,000 recorded draws are a degree-controlled benchmark,
              not a probability of real-world failure. “Stranded” means
              outside the largest remaining component.
            </p>
          </div>
        </div>
      </details>
    </div>
  );
}

function panelFor(model: Model, entryId: string, actual: Outcome, restored: boolean): Panel {
  const { transit: t, name } = model;
  const entry = t.closures.find((c) => c.id === entryId)!;
  const observed = actual.stranded.length;
  const n = entry.null,
    total = n.histogram.reduce((s, r) => s + r.count, 0),
    atLeast = n.histogram.filter((r) => r.value >= observed).reduce((s, r) => s + r.count, 0),
    peak = Math.max(...n.histogram.map((r) => r.count));
  const same = n.histogram.find((r) => r.value === observed)?.count || 0;
  const headline = restored
    ? `Service restored. All ${t.coreNodes} articles can reach each other again.`
    : `${entry.label} closed. ${observed} ${observed === 1 ? "article" : "articles"} cut off.`;
  const detail = restored
    ? "The recorded closure comparison remains below. The map and route planner now use the original graph."
    : `${actual.largest.length} / ${actual.remaining} remaining articles can still reach each other. ${entry.degree} links to neighbouring articles before removal. ${actual.groups.length - 1} separated ${actual.groups.length === 2 ? "group" : "groups"}.`;
  const stranded = restored ? null : observed ? (
    <p>
      <b>Cut off from the largest group:</b> {`${actual.stranded.map((id) => name(id)).join(", ")}.`}
    </p>
  ) : (
    <p>Every remaining article still has a route to every other. The other links provide alternative routes.</p>
  );
  const verdict =
    observed === 0
      ? `${entry.label}: no other articles cut off in the real network. ${same} of ${total.toLocaleString()} rearranged maps also lost none. This outcome is common under the benchmark.`
      : `${entry.label}: ${observed} cut off in the real network. ${atLeast} of ${total.toLocaleString()} rearranged maps lost at least that many. ${atLeast === 0 ? "None did in this finite sample; that does not mean it is impossible under the model." : "The same neighbour counts can produce less disruption when the links are arranged differently."}`;
  const hist = (
    <>
      {n.histogram.map((r) => (
        <div key={r.value} className={`hist-row${r.value === observed ? " observed" : ""}`}>
          <span>{`${r.value} stranded${r.value === observed ? " ← real" : ""}`}</span>
          <div className="hist-bar" style={{ width: `${(r.count / peak) * 100}%` }}></div>
          <span>{r.count}</span>
        </div>
      ))}
      {n.histogram.some((r) => r.value === observed) ? null : <p className="fine">{`Observed ${observed}: zero benchmark draws at this value.`}</p>}
    </>
  );
  return {
    headline,
    detail,
    stranded,
    verdict,
    compare: entry.id === "Hulk" ? "Try Spider-Man next" : "Try Hulk next",
    explanation: `In ${total.toLocaleString()} rewired starting networks, removing ${entry.label} stranded ${n.mean.toFixed(3)} articles on average. ${atLeast} / ${total} trials stranded at least the observed ${observed}. The actual graph is marked in the histogram.`,
    hist,
  };
}

function ResultsView() {
  const model = useTransit();
  const { results, restored } = useStore(transit, all);
  const actual = useOutcome(model, results);
  useIslandReady(model !== null);
  if (!model || !results || !actual) return <Results hidden panel={model ? { ...EMPTY, onRestore: restoreService, onCompare: compareStation } : EMPTY} />;
  const panel = { ...panelFor(model, results, actual, restored), onRestore: restoreService, onCompare: compareStation };
  return <Results hidden={false} panel={panel} />;
}

const ResultsHost = () => <Results hidden panel={EMPTY} />;

export const ClosureResults = island("week02/transit/Results", ResultsView, ResultsHost, { roots: ["#disruption-results"] });

// ---- the service board ----------------------------------------------------------------

function ServiceView() {
  const { closed } = useStore(transit, all);
  return <span id="service-state">{closed ? "ONE CLOSURE" : "NORMAL SERVICE"}</span>;
}

const ServiceHost = () => <span id="service-state">NORMAL SERVICE</span>;

export const ServiceState = island("week02/transit/Service", ServiceView, ServiceHost, { roots: ["#service-state"] });
