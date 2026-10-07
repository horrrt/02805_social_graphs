// Scoreboard parts shared by the rounds: the score (which counts the campaign
// so far when a round is a level), the skip, and the hearts.
import { useEffect, useRef, useState } from "react";
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

/**
 * The hearts. When one is lost it breaks (swells, shakes, cracks, greys) and
 * the screen's edges flash red, as a hit does in a video game. A new run,
 * with the hearts refilled, plays nothing.
 */
export function Lives({ lives, max }: { lives: number; max: number }) {
  const before = useRef(lives);
  const [hit, setHit] = useState<{ n: number; heart: number } | null>(null);
  useEffect(() => {
    if (lives < before.current) setHit((h) => ({ n: (h?.n ?? 0) + 1, heart: lives }));
    before.current = lives;
  }, [lives]);
  return (
    <span className="cr-box">
      <small>Lives</small>
      <span className="cr-lives" aria-label={`${lives} of ${max}`}>
        {Array.from({ length: max }, (_, i) => (
          <span key={hit && i === hit.heart ? `lost-${hit.n}` : i} data-on={i < lives} data-lost={hit !== null && i === hit.heart} />
        ))}
      </span>
      {hit ? <span key={hit.n} className="cr-hit" aria-hidden="true" /> : null}
    </span>
  );
}
