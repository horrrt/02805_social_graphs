// The Cold Read campaign: the five rounds as levels, from the first idea of
// Week 6 to the last, with one running score. Each level plays a short stage
// of its round; a level can be skipped for SKIP_COST points, and the total
// never goes below 0. Rules live in levels.ts.
import { useEffect, useRef, useState } from "react";
import { SkipLevel } from "./LevelParts";
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
import { readBest, saveBest } from "./best";

export type CampaignData = {
  clue?: ClueShopData;
  groups?: WhoseLineData;
  mix?: MixDeskData;
  contexts?: TezguinoData;
  vectors?: HotColdData;
};

const BEST = "cold-read:best-campaign";

type Phase = "intro" | "level" | "between" | "done";


export function CampaignIntro() {
  return (
    <ol className="cr-rules">
      <li>Play the five levels in order, from TF-IDF to word vectors.</li>
      <li>Every point you earn adds to one total.</li>
      <li>Stuck? Skip a level for −{SKIP_COST} points.</li>
    </ol>
  );
}

export function CampaignGame({ data, random = Math.random, clock = Date.now }: { data: CampaignData; random?: () => number; clock?: () => number }) {
  const [phase, setPhase] = useState<Phase>("intro");
  const [at, setAt] = useState(0);
  const [results, setResults] = useState<Result[]>([]);
  const [total, setTotal] = useState(0);
  const [best, setBest] = useState(0);
  const [newBest, setNewBest] = useState(false);
  const [hard, setHard] = useState(false);
  const go = useRef<HTMLButtonElement>(null);

  useEffect(() => setBest(readBest(BEST)), []);
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
        saveBest(BEST, sum);
      }
      setPhase("done");
    } else setPhase("between");
  };

  const finish = (points: number) => record({ points, skipped: false, lost: 0 }, total + points);
  // A skip banks the level's points so far, then takes SKIP_COST; `lost` is what it really took.
  const skip = (points: number) => {
    const after = afterSkip(total + points);
    record({ points, skipped: true, lost: total + points - after }, after);
  };

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
  const level = { items: spec.items, total, onDone: finish, onSkip: skip };
  const loaded: Record<LevelId, boolean> = {
    clue: Boolean(data.clue),
    groups: Boolean(data.groups),
    mix: Boolean(data.mix),
    contexts: Boolean(data.contexts),
    vectors: Boolean(data.vectors),
  };

  return (
    <section className="cr-campaign" id="campaign" aria-label="Campaign">

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
                {/* A skipped level shows only what it banked; its colour says it was skipped. */}
                {r && r.points ? `+${r.points.toLocaleString("en")}` : ""}
              </span>
            </li>
          );
        })}
      </ol>

      {phase === "intro" ? (
        <div className="cr-table">
          <div className="cr-start">
            <CampaignIntro />
            <div className="cr-camp-start">
              <div className="cr-difficulty">
                <span className="cr-seg" role="group" aria-label="Difficulty">
                  <button type="button" aria-pressed={!hard} onClick={() => setHard(false)}>
                    Normal
                  </button>
                  <button type="button" aria-pressed={hard} onClick={() => setHard(true)}>
                    Hard <small>×2</small>
                  </button>
                </span>
                <small>{hard ? "Rarer clues in level 1, double points." : "The standard decks."}</small>
              </div>
              <div className="cr-camp-go">
                {best ? <span className="cr-note">Best {best.toLocaleString("en")}</span> : null}
                <button type="button" className="cr-go" onClick={start}>
                  Start the campaign
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {phase === "level" ? (
        <>
          {!loaded[spec.id] ? (
            <p className="cr-note">
              Loading this level… <SkipLevel points={0} level={level} />
            </p>
          ) : spec.id === "clue" ? (
            <ClueShopGame key="clue" data={data.clue!} random={random} level={level} clock={clock} hard={hard} />
          ) : spec.id === "groups" ? (
            <WhoseLineGame key="groups" data={data.groups!} random={random} level={level} clock={clock} />
          ) : spec.id === "mix" ? (
            <MixDeskGame key="mix" data={data.mix!} random={random} level={level} clock={clock} />
          ) : spec.id === "contexts" ? (
            <TezguinoGame key="contexts" data={data.contexts!} random={random} level={level} clock={clock} />
          ) : (
            <HotColdGame key="vectors" data={data.vectors!} random={random} level={level} clock={clock} />
          )}
        </>
      ) : null}

      {phase === "between" && last ? (
        <div className="cr-table cr-between" data-skipped={last.skipped}>
          <p className="cr-stamp">{last.skipped ? `Level ${results.length} skipped · −${last.lost}` : `Level ${results.length} cleared`}</p>
          <p className="cr-verdict">{last.skipped ? `−${last.lost.toLocaleString("en")}` : `+${last.points.toLocaleString("en")}`}</p>
          <p className="cr-camp-total">
            Score <b>{total.toLocaleString("en")}</b>
          </p>
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
          <p className="cr-camp-total">
            Score <b>{total.toLocaleString("en")}</b>
            {newBest ? " · a new best" : ` · best ${best.toLocaleString("en")}`}
          </p>
          <ul className="cr-played">
            {LEVELS.map((l, i) => (
              <li key={l.id} data-verdict={results[i]?.skipped ? "half" : "right"}>
                <b>{l.name}</b> <span>+{(results[i]?.points ?? 0).toLocaleString("en")}</span>
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
