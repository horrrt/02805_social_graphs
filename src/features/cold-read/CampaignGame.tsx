// The Cold Read campaign: the five rounds as levels, from the first idea of
// Week 6 to the last, with one running score. Each level plays a short stage
// of its round; a level can be skipped for SKIP_COST points, and the total
// never goes below 0. Rules live in levels.ts.
import { useEffect, useRef, useState } from "react";
import { afterSkip, LEVELS, type LevelId, type Result, SKIP_COST } from "./levels";
import { ClueShopGame } from "./ClueShopGame";
import type { TezguinoData } from "./contexts";
import type { WhoseLineData } from "./groups";
import { HotColdGame } from "./HotColdGame";
import { MixDeskGame } from "./MixDeskGame";
import type { ClueShopData } from "./rules";
import { TezguinoGame } from "./TezguinoGame";
import type { MixDeskData } from "./topics";
import type { HotColdData } from "./vectors";
import { WhoseLineGame } from "./WhoseLineGame";

export type CampaignData = {
  clue?: ClueShopData;
  groups?: WhoseLineData;
  mix?: MixDeskData;
  contexts?: TezguinoData;
  vectors?: HotColdData;
};

const BEST = "cold-read:best-campaign";

type Phase = "intro" | "level" | "between" | "done";

function readBest() {
  try {
    return Number(localStorage.getItem(BEST)) || 0;
  } catch {
    return 0;
  }
}

function saveBest(score: number) {
  try {
    localStorage.setItem(BEST, String(score));
  } catch {
    // Private windows may refuse storage; the best score is a convenience.
  }
}

export function CampaignIntro() {
  return (
    <ol className="cr-steps">
      <li>
        <b>Climb</b> five levels in the order Week 6 teaches them: TF-IDF, comparing groups, topic models, context, then word vectors.
      </li>
      <li>
        <b>Score</b>: every level adds what you earn in it to one running total. Running out of lives ends the level, not the campaign.
      </li>
      <li>
        <b>Skip</b> a level whenever you like for {SKIP_COST} points. The total never goes below 0, so the goal is the best total at the end.
      </li>
    </ol>
  );
}

export function CampaignGame({ data, random = Math.random }: { data: CampaignData; random?: () => number }) {
  const [phase, setPhase] = useState<Phase>("intro");
  const [at, setAt] = useState(0);
  const [results, setResults] = useState<Result[]>([]);
  const [total, setTotal] = useState(0);
  const [best, setBest] = useState(0);
  const [newBest, setNewBest] = useState(false);
  const go = useRef<HTMLButtonElement>(null);

  useEffect(() => setBest(readBest()), []);
  useEffect(() => {
    if (phase === "between" || phase === "done") go.current?.focus();
  }, [phase]);

  const record = (result: Result, sum: number) => {
    const next = [...results, result];
    setResults(next);
    setTotal(sum);
    if (next.length === LEVELS.length) {
      const isBest = sum > best;
      setNewBest(isBest);
      if (isBest) {
        setBest(sum);
        saveBest(sum);
      }
      setPhase("done");
    } else setPhase("between");
  };

  const finish = (points: number) => record({ points, skipped: false, lost: 0 }, total + points);
  const skip = () => record({ points: 0, skipped: true, lost: total - afterSkip(total) }, afterSkip(total));

  const start = () => {
    setAt(0);
    setResults([]);
    setTotal(0);
    setNewBest(false);
    setPhase("level");
  };

  const advance = () => {
    setAt(results.length);
    setPhase("level");
  };

  const spec = LEVELS[at];
  const last = results.at(-1);
  const level = { items: spec.items, onDone: finish };
  const loaded: Record<LevelId, boolean> = {
    clue: Boolean(data.clue),
    groups: Boolean(data.groups),
    mix: Boolean(data.mix),
    contexts: Boolean(data.contexts),
    vectors: Boolean(data.vectors),
  };

  return (
    <section className="cr-campaign" id="campaign" aria-label="Campaign">
      <div className="cr-hud cr-camp-hud" role="status">
        <span className="cr-box cr-score">
          <small>Campaign score</small>
          <b key={total}>{total.toLocaleString("en")}</b>
        </span>
        <span className="cr-box">
          <small>Level</small>
          <b>
            {phase === "intro" ? 0 : Math.min(results.length + (phase === "level" ? 1 : 0), LEVELS.length)}/{LEVELS.length}
          </b>
        </span>
        <span className="cr-box">
          <small>Best campaign</small>
          <b>{best.toLocaleString("en")}</b>
        </span>
        {phase === "level" ? (
          <button type="button" className="cr-skip" onClick={skip}>
            Skip level <small>−{SKIP_COST}</small>
          </button>
        ) : null}
      </div>

      <ol className="cr-track" aria-label="Levels">
        {LEVELS.map((l, i) => {
          const r = results[i];
          const state = r ? (r.skipped ? "skipped" : "done") : phase === "level" && i === at ? "current" : "locked";
          return (
            <li key={l.id} data-state={state} aria-current={state === "current" ? "step" : undefined}>
              <span className="cr-track-n">{i + 1}</span>
              <span className="cr-track-text">
                <b>{l.name}</b>
                <small>{l.topic}</small>
              </span>
              <span className="cr-track-score">
                {r ? (r.skipped ? `skipped −${r.lost}` : `+${r.points.toLocaleString("en")}`) : state === "current" ? "playing" : ""}
              </span>
            </li>
          );
        })}
      </ol>

      {phase === "intro" ? (
        <div className="cr-table">
          <div className="cr-start">
            <CampaignIntro />
            <button type="button" className="cr-go" onClick={start}>
              Start the campaign
            </button>
          </div>
        </div>
      ) : null}

      {phase === "level" ? (
        <>
          <p className="cr-goal">
            <b>
              Level {at + 1} · {spec.name}
            </b>{" "}
            {spec.goal}, then press Finish level. Everything you score here adds to the campaign.
          </p>
          {!loaded[spec.id] ? (
            <p className="cr-note">Loading this level…</p>
          ) : spec.id === "clue" ? (
            <ClueShopGame key="clue" data={data.clue!} random={random} level={level} />
          ) : spec.id === "groups" ? (
            <WhoseLineGame key="groups" data={data.groups!} random={random} level={level} />
          ) : spec.id === "mix" ? (
            <MixDeskGame key="mix" data={data.mix!} random={random} level={level} />
          ) : spec.id === "contexts" ? (
            <TezguinoGame key="contexts" data={data.contexts!} random={random} level={level} />
          ) : (
            <HotColdGame key="vectors" data={data.vectors!} random={random} level={level} />
          )}
        </>
      ) : null}

      {phase === "between" && last ? (
        <div className="cr-table cr-between" data-skipped={last.skipped}>
          <p className="cr-stamp">{last.skipped ? `Level ${results.length} skipped · −${last.lost}` : `Level ${results.length} cleared`}</p>
          <p className="cr-verdict">{last.skipped ? `${total.toLocaleString("en")} points so far` : `+${last.points.toLocaleString("en")}`}</p>
          <p className="cr-next">
            Next: <b>{LEVELS[results.length].name}</b>, {LEVELS[results.length].topic}. {LEVELS[results.length].goal}.
          </p>
          <button ref={go} type="button" className="cr-go" onClick={advance}>
            Start level {results.length + 1}
          </button>
        </div>
      ) : null}

      {phase === "done" ? (
        <div className="cr-table cr-between">
          <p className="cr-stamp">Campaign complete</p>
          <p className="cr-verdict">
            {total.toLocaleString("en")} points{newBest ? " · a new best" : ""}
          </p>
          <ul className="cr-played">
            {LEVELS.map((l, i) => (
              <li key={l.id} data-verdict={results[i]?.skipped ? "half" : "right"}>
                <b>{l.name}</b> <span>{results[i]?.skipped ? `skipped −${results[i].lost}` : `+${(results[i]?.points ?? 0).toLocaleString("en")}`}</span>
              </li>
            ))}
          </ul>
          <button ref={go} type="button" className="cr-go" onClick={start}>
            Play the campaign again
          </button>
        </div>
      ) : null}
    </section>
  );
}
