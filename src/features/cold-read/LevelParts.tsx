// Scoreboard parts shared by the rounds: the score (which counts the campaign
// so far when a round is a level), the skip, and the hearts.
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
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
 * The hearts. Losing one is loud, the way a death is in Super Meat Boy: the
 * heart breaks in the scoreboard, a big heart pops and cracks in the middle
 * of the screen, the edges flash red and the whole page shakes (CSS :has on
 * the flash). The last heart plays a knocked-out mask and "Out of lives" instead of the big heart.
 * The flash renders into <body>: inside the shaking page, the shake's
 * transform would trap it in the card. It unmounts when its animation ends,
 * so the next hit plays it again. A new run plays nothing.
 */
export function Lives({ lives, max }: { lives: number; max: number }) {
  const before = useRef(lives);
  const [hit, setHit] = useState<{ n: number; heart: number } | null>(null);
  const [flash, setFlash] = useState<{ n: number; dead: boolean } | null>(null);
  useEffect(() => {
    if (lives < before.current) {
      setHit((h) => ({ n: (h?.n ?? 0) + 1, heart: lives }));
      setFlash((f) => ({ n: (f?.n ?? 0) + 1, dead: lives === 0 }));
    }
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
      {flash
        ? createPortal(
            <span key={flash.n} className="cr-hit" data-dead={flash.dead} aria-hidden="true" onAnimationEnd={(e) => e.target === e.currentTarget && setFlash(null)}>
              {flash.dead ? (
                <span className="cr-dead">
                  <DeadMask />
                  <span className="cr-hit-text">Out of lives</span>
                </span>
              ) : (
                <span className="cr-hit-heart">
                  <span />
                  <span />
                </span>
              )}
            </span>,
            document.body,
          )
        : null}
    </span>
  );
}

/** Game over: a red mercenary's mask, out cold, X for eyes. */
function DeadMask() {
  return (
    <svg className="cr-dead-mask" viewBox="0 0 120 130" aria-hidden="true">
      <ellipse className="cr-dead-head" cx="60" cy="66" rx="48" ry="58" />
      <path className="cr-dead-seam" d="M60 8v116" />
      <path className="cr-dead-patch" d="M12 54Q26 34 56 48Q60 76 36 80Q16 78 12 54Z" />
      <path className="cr-dead-patch" d="M108 54Q94 34 64 48Q60 76 84 80Q104 78 108 54Z" />
      <path className="cr-dead-x" d="M29 53l16 16M45 53L29 69M75 53l16 16M91 53L75 69" />
    </svg>
  );
}
