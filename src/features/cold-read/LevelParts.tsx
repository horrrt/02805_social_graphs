// The parts a round's scoreboard adds when it is played as a campaign level:
// the score, which counts the campaign so far plus this level, and the skip.
import { type Level, SKIP_COST } from "./levels";

/** The scoreboard's score: the level's points, plus the campaign's total when it is a level. */
export function ScoreBox({ points, level }: { points: number; level?: Level }) {
  const shown = (level?.total ?? 0) + points;
  return (
    <span className="cr-box cr-score">
      <small>Score</small>
      <b key={shown}>{shown.toLocaleString("en")}</b>
    </span>
  );
}

/** "Skip level": banks the level's points so far, then the campaign takes SKIP_COST (never below 0). */
export function SkipLevel({ points, level }: { points: number; level?: Level }) {
  if (!level) return null;
  return (
    <button type="button" className="cr-skip" onClick={() => level.onSkip(points)}>
      Skip level <small>−{SKIP_COST}</small>
    </button>
  );
}
