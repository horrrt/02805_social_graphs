import { PostSection } from "@/components/post/PostSection";
import { SKIP_COST } from "@/features/cold-read/levels";
import { LEVELS } from "@/features/week07-campaign/levels";

// The campaign card before the closing, in Week 6's form: the campaign's
// wordmark, a link to it, and its levels, named as levels.ts has them so the
// card and the campaign cannot drift apart.
export function Game() {
  return (
    <PostSection id="game" owner="Gyula">
      <header className="w4-opener w6e-game-opener">
        <div>
          <h2>Play the week’s methods as one campaign on the Marvel pages</h2>
        </div>
      </header>
      <div className="card w4-card w5-card w6e-game">
        <div className="w6e-game-head">
          <p className="w6e-wordmark">
            Meaning to
            {" "}
            <span>Measurement</span>
          </p>
          <p className="w6e-game-lede">{`There are ${LEVELS.length} levels, one game per section of this week. Each one is scored, and the scores add up to one total.`}</p>
          <div className="w6e-game-cta">
            <a className="w6e-play" href="../../play/week07/">Play the campaign →</a>
          </div>
        </div>
        <ol className="w6e-levels">
          {LEVELS.map((level, i) => (
            <li key={level.id}>
              <span className="w6e-lv-num" aria-hidden="true">{i + 1}</span>
              <div>
                <h3>{level.name}</h3>
                <p className="w6e-lv-topic">{`Section ${level.section} · ${level.topic}`}</p>
                <p className="w6e-lv-blurb">
                  {level.goal}
                  .
                  {" "}
                  <a href={`../../play/week07/${level.path}`}>Practise it alone</a>
                </p>
              </div>
            </li>
          ))}
        </ol>
        <p className="w6e-game-rules">{`Stuck on a level? Skip it for −${SKIP_COST} points.`}</p>
      </div>
    </PostSection>
  );
}
