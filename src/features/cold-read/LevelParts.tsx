// Scoreboard parts shared by the rounds: the score (which counts the campaign
// so far when a round is a level), the skip, the hearts, the plain boxes, the
// best score, the result panel's next button and the keyboard shortcuts.
import { type ReactNode, type Ref, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ShadowArt } from "@/lib/ShadowArt";
import { useData } from "@/lib/useData";
import { useHydrated } from "@/lib/useHydrated";
import { asset } from "@/scripts/site.js";
import { readBest, saveBest } from "./best";
import { playGameOver } from "./gameOverSfx";
import { FINISH, type Level, SKIP_COST } from "./levels";

/** A plain scoreboard box: a small label over a bold value. `hot` lights the value. */
export function Stat({ label, children, hot }: { label: string; children: ReactNode; hot?: boolean }) {
  return (
    <span className="cr-box">
      <small>{label}</small>
      <b data-hot={hot}>{children}</b>
    </span>
  );
}

/** The streak box: the multiplier the round shows, lit above ×1. */
export const StreakBox = ({ streak }: { streak: number }) => (
  <Stat label="Streak" hot={streak > 1}>
    ×{streak}
  </Stat>
);

/** The practice best; a campaign level shows none. */
export function BestBox({ best, level, label = "Best" }: { best: number; level?: Level; label?: string }) {
  if (level) return null;
  return <Stat label={label}>{best.toLocaleString("en")}</Stat>;
}

/**
 * The best score under `key`, read once on mount. record(total) keeps and
 * saves a higher total and says whether it was a new best. A null key (a
 * campaign level) reads 0 and saves nothing.
 */
export function useBest(key: string | null) {
  const [best, setBest] = useState(0);
  useEffect(() => setBest(readBest(key)), []);
  const record = (total: number) => {
    if (total <= best) return false;
    setBest(total);
    saveBest(key, total);
    return true;
  };
  return { best, record };
}

/**
 * The result panel's button. In a level it finishes the level once the run is
 * over or this was the level's last item; in practice a run that is over plays
 * again; otherwise it moves on to the next item.
 */
export function NextButton({ level, score, over = false, last = false, nextLabel, onNext, onAgain, buttonRef }: {
  level?: Level; score: number; over?: boolean; last?: boolean; nextLabel: string; onNext: () => void; onAgain?: () => void;
  buttonRef?: Ref<HTMLButtonElement>;
}) {
  const finish = level && (over || last);
  return (
    <button ref={buttonRef} type="button" className="cr-go" onClick={finish ? () => level.onDone(score) : over ? onAgain : onNext}>
      {finish ? FINISH : over ? "Play again" : nextLabel}
    </button>
  );
}

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
 * the flash). The flash renders into <body>: inside the shaking page, the
 * shake's transform would trap it in the card. A lost heart's flash unmounts
 * when its animation ends, so the next hit plays it again.
 *
 * The last heart is game over: one of the game-over cards, picked at random,
 * plays with its sound, and "Out of lives" stays on screen with two ways out.
 * The cards load once the player is down to the last heart; until they arrive,
 * or if they fail, the knocked-out mask stands in. Retry calls `onRetry`; "Why
 * am I such a failure?" clears the screen and scrolls to the round's debrief. A
 * new run plays nothing.
 */
export function Lives({ lives, max, onRetry }: { lives: number; max: number; onRetry?: () => void }) {
  const before = useRef(lives);
  const [hit, setHit] = useState<{ n: number; heart: number } | null>(null);
  const [flash, setFlash] = useState<{ n: number; dead: boolean; card: number } | null>(null);
  const hydrated = useHydrated();
  const art = useData<GameOverArt>(hydrated && lives <= 1 ? asset(GAME_OVER) : null);
  useEffect(() => {
    if (lives < before.current) {
      const card = lives === 0 ? 1 + Math.floor(Math.random() * GAME_OVER_CARDS) : 0;
      if (card) playGameOver(card);
      setHit((h) => ({ n: (h?.n ?? 0) + 1, heart: lives }));
      setFlash((f) => ({ n: (f?.n ?? 0) + 1, dead: lives === 0, card }));
    }
    before.current = lives;
  }, [lives]);
  const card = flash?.dead ? art.data?.cards.find((c) => c.n === flash.card) : undefined;
  const retry = () => {
    setFlash(null);
    onRetry?.();
  };
  const why = () => {
    setFlash(null);
    document.querySelector(".cr-debrief, .cr-result")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
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
            flash.dead ? (
              <div key={flash.n} className="cr-hit" data-dead="true" role="alertdialog" aria-modal="true" aria-label="Out of lives">
                <div className="cr-dead">
                  {card && art.data ? <ShadowArt className={card.full ? "cr-dead-full" : "cr-dead-art"} css={art.data.css} html={card.svg} /> : <DeadMask />}
                  <span className="cr-hit-text">Out of lives</span>
                  <div className="cr-dead-actions">
                    {onRetry ? (
                      // Focus lands on Retry, so Enter plays again.
                      <button type="button" className="cr-go" onClick={retry} autoFocus>
                        Retry
                      </button>
                    ) : null}
                    <button type="button" className="cr-ghost" onClick={why}>
                      Why am I such a failure?
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <span key={flash.n} className="cr-hit" data-dead="false" aria-hidden="true" onAnimationEnd={(e) => e.target === e.currentTarget && setFlash(null)}>
                <span className="cr-hit-heart">
                  <span />
                  <span />
                </span>
              </span>
            ),
            document.body,
          )
        : null}
    </span>
  );
}

/** Game over: a red mercenary's mask, out cold, X for eyes. */
/** The game-over cards: one stylesheet and one SVG per card, numbered from 1. */
/** A card marked full takes the whole screen behind the game-over text instead of sitting above it. */
type GameOverArt = { css: string; cards: { n: number; title: string; svg: string; full?: boolean }[] };
const GAME_OVER = "play/cold-read/data/game-over.json";
const GAME_OVER_CARDS = 145;

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

/**
 * Keyboard shortcuts while `active`: a key in `map` runs its action. Letter
 * keys are skipped while the player types in a field, so a guess box keeps them.
 */
export function useKeys(map: Record<string, () => void>, active: boolean) {
  const keys = useRef(map);
  keys.current = map;
  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      const run = keys.current[e.key];
      if (!run || e.metaKey || e.ctrlKey || e.altKey) return;
      if (/^[a-z]$/i.test(e.key) && (e.target as HTMLElement | null)?.closest?.("input, textarea")) return;
      e.preventDefault();
      run();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active]);
}

/** Clicks the button with this id, if it is on the page: a shortcut presses it as a click would. */
export const clickButton = (id: string) => (document.getElementById(id) as HTMLButtonElement | null)?.click();

/** A help button's key, in either case: pressing it clicks the button while `active`. */
export function useHelpKey(key: string, press: () => void, active: boolean) {
  useKeys({ [key.toLowerCase()]: press, [key.toUpperCase()]: press }, active);
}

/** The key badge on a help button. */
export const HelpKey = ({ k }: { k: string }) => (
  <kbd className="cr-key-inline" aria-hidden="true">
    {k}
  </kbd>
);
