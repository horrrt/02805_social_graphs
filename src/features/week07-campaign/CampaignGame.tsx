// The Week 7 campaign: this week's games as levels, with one running score,
// on Cold Read's pattern (CampaignGame.tsx there). A level can be skipped for
// SKIP_COST points; a level that ends below 0 adds nothing,
// and the total never goes below 0. The levels are in levels.ts.
import { useEffect, useRef, useState } from "react";
import { SkipLevel, useBest } from "@/features/cold-read/LevelParts";
import { afterSkip, type Result, SKIP_COST } from "@/features/cold-read/levels";
import { Rules, StartRow } from "@/features/cold-read/StartPanel";
import { SameWordGame } from "@/features/same-word/SameWordGame";
import { SearchDetectiveGame } from "@/features/search-detective/SearchDetectiveGame";
import type { SentimentTrapData } from "@/features/sentiment-trap/data";
import { SentimentTrapGame } from "@/features/sentiment-trap/SentimentTrapGame";
import type { TopicTetrisData } from "@/features/topic-tetris/rules";
import { TopicTetrisGame } from "@/features/topic-tetris/TopicTetrisGame";
import type { TwoStripesData } from "@/features/two-stripes/rules";
import { TwoStripesGame } from "@/features/two-stripes/TwoStripesGame";
import { LEVELS, type LevelId } from "./levels";

export type CampaignData = { stripes?: TwoStripesData; sentiment?: SentimentTrapData; tetris?: TopicTetrisData };

const BEST = "week07:best-campaign";

type Phase = "intro" | "level" | "between" | "done";

export function CampaignIntro() {
  return (
    <Rules
      rules={[
        ["Play", "Week 7’s games in the brief’s order, one per section: contextual vectors, corpus maps, grouping, sentiment and search by meaning."],
        ["Score", "in every level; it all adds up to your total score."],
        ["Stuck?", <>Skip a level for −{SKIP_COST} points.</>],
      ]}
    />
  );
}

export function CampaignGame({ data, random = Math.random, clock = Date.now }: { data: CampaignData; random?: () => number; clock?: () => number }) {
  const [phase, setPhase] = useState<Phase>("intro");
  const [at, setAt] = useState(0);
  const [results, setResults] = useState<Result[]>([]);
  const [total, setTotal] = useState(0);
  const { best, record: recordBest } = useBest(BEST);
  const [newBest, setNewBest] = useState(false);
  const go = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (phase === "between" || phase === "done") go.current?.focus();
  }, [phase]);

  const record = (result: Result, sum: number) => {
    const next = [...results, result];
    setResults(next);
    setTotal(sum);
    if (next.length === LEVELS.length) {
      setNewBest(recordBest(sum));
      setPhase("done");
    } else setPhase("between");
  };

  const finish = (points: number) => {
    const kept = Math.max(0, points);
    record({ points: kept, skipped: false, lost: 0 }, total + kept);
  };
  // A skip banks the level's points so far, then takes SKIP_COST; `lost` is what it really took.
  const skip = (points: number) => {
    const kept = Math.max(0, points);
    const after = afterSkip(total + kept);
    record({ points: kept, skipped: true, lost: total + kept - after }, after);
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
    "same-word": true,
    "two-stripes": Boolean(data.stripes),
    "topic-tetris": Boolean(data.tetris),
    "sentiment-trap": Boolean(data.sentiment),
    "search-detective": true,
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
              <span className="cr-track-score">{r && r.points ? `+${r.points.toLocaleString("en")}` : ""}</span>
            </li>
          );
        })}
      </ol>

      {phase === "intro" ? (
        <div className="cr-table">
          <div className="cr-start">
            <CampaignIntro />
            <StartRow option={<span className="cr-note">Every game also has its own practice page, linked from the Games menu.</span>}>
              {best ? <span className="cr-note">Best {best.toLocaleString("en")}</span> : null}
              <button type="button" className="cr-go" onClick={start}>
                Start the campaign
              </button>
            </StartRow>
          </div>
        </div>
      ) : null}

      {phase === "level" ? (
        !loaded[spec.id] ? (
          <p className="cr-note">
            Loading this level… <SkipLevel points={0} level={level} />
          </p>
        ) : spec.id === "same-word" ? (
          <SameWordGame key="same-word" level={level} />
        ) : spec.id === "two-stripes" ? (
          <TwoStripesGame key="two-stripes" data={data.stripes!} random={random} level={level} clock={clock} />
        ) : spec.id === "topic-tetris" ? (
          <div key="topic-tetris" className="topic-tetris">
            <TopicTetrisGame data={data.tetris!} clock={clock} level={level} />
          </div>
        ) : spec.id === "sentiment-trap" ? (
          <SentimentTrapGame key="sentiment-trap" data={data.sentiment!} level={level} />
        ) : (
          <SearchDetectiveGame key="search-detective" level={level} />
        )
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
