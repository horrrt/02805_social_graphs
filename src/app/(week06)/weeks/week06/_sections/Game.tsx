import { PostSection } from "@/components/post/PostSection";
import { LEVELS, SKIP_COST } from "@/features/cold-read/levels";

// The Cold Read card before the closing: the game's wordmark, a link to the
// campaign and to practice, and its five levels, named and described as
// levels.ts has them so the card and the game cannot drift apart.
export function Game() {
  return (
    <PostSection id="game" owner="Gyula">
      <header className="w4-opener w6e-game-opener">
        <div>
          <h2>Play it as a timed game on the 303 Marvel pages</h2>
        </div>
      </header>
      <div className="card w4-card w5-card w6e-game">
        <div className="w6e-game-head">
          <p className="w6e-wordmark">
            Cold
            {" "}
            <span>Read</span>
          </p>
          <p className="w6e-game-lede">There are five levels, one per method. Each one is timed and scored, and the five scores add up to one total.</p>
          <div className="w6e-game-cta">
            <a className="w6e-play" href="../../play/cold-read/">Play Cold Read →</a>
            <a className="w6e-practice" href="../../play/cold-read/practice/">Practise one level</a>
          </div>
        </div>
        <ol className="w6e-levels">
          {LEVELS.map((level, i) => (
            <li key={level.id}>
              <span className="w6e-lv-num" aria-hidden="true">{i + 1}</span>
              <div>
                <h3>{level.name}</h3>
                <p className="w6e-lv-topic">{level.topic}</p>
                <p className="w6e-lv-blurb">{level.blurb}</p>
              </div>
            </li>
          ))}
        </ol>
        <p className="w6e-game-rules">{`Stuck on a level? Skip it for −${SKIP_COST} points.`}</p>
      </div>
    </PostSection>
  );
}
