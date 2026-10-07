// "Watch an example game": a guided tour, offered on a round's start screen,
// that plays an example round with Driver.js (vendored,
// public/assets/vendor/driver.js-1.9.0.min.js) highlighting one part of the
// page at a time. A step may act before it is shown: it presses the game's own
// buttons, so the example is the real game. The last step hands over ("Your
// turn"), and closing or finishing the tour starts a fresh game (onDone), so
// nothing the example spent counts. onDone also deals the example's own game. The tour lives in a hook the game holds,
// so it survives the start screen giving way to the board. The library loads
// only when asked for.
import { useEffect, useRef, useState } from "react";
import { useVendor } from "@/lib/useVendor";

export type TourStep = {
  /** A selector, or a function that finds the element once earlier steps have acted. */
  element?: string | (() => Element | null);
  title: string;
  text: string;
  /** Run before the step is shown, such as pressing a card; the tour waits for React to draw the result. */
  act?: () => void;
};

type DriverStep = { element?: string | (() => Element); popover: { title: string; description: string; side?: string; align?: string } };
type DriverApi = { drive: () => void; moveNext: () => void; destroy: () => void; getActiveIndex: () => number | undefined };
type DriverLib = { js: { driver: (config: Record<string, unknown>) => DriverApi } };

const WAIT = 450;

/** The step every tour ends on: the example is over, the player starts a game of their own. */
export const YOUR_TURN: TourStep = {
  title: "Your turn",
  text: "That was an example game. Start a fresh one and play it yourself: nothing the example spent counts.",
};

/** Press a button the game drew, as a player would. */
export const press = (selector: string) => () => (document.querySelector(selector) as HTMLButtonElement | null)?.click();

/** The example game for a round: run() starts it; loading is true while Driver.js is on its way. */
export function useTour(steps: () => TourStep[], onDone: () => void): { run: () => void; loading: boolean; running: boolean } {
  const [wanted, setWanted] = useState(false);
  const done = useRef(onDone);
  done.current = onDone;
  const vendor = useVendor<DriverLib>("driver.js-1.9.0.min.js", "driver", { enabled: wanted });
  const tour = useRef<DriverApi | null>(null);

  useEffect(() => {
    if (!wanted || vendor.status !== "ready" || !vendor.lib) return;
    const plan = [...steps(), YOUR_TURN];
    let live = true;
    // A step's action runs on the way into it: the first step's at once, the rest from "Next".
    const enter = (i: number, then: () => void) => {
      const act = plan[i]?.act;
      if (!act) return then();
      act();
      setTimeout(then, WAIT);
    };
    const find = (s: TourStep) =>
      typeof s.element === "function" ? () => (s.element as () => Element | null)() ?? document.body : s.element;
    const api = vendor.lib.js.driver({
      showProgress: true,
      progressText: "{{current}} of {{total}}",
      nextBtnText: "Next",
      prevBtnText: "Back",
      doneBtnText: "Start the game",
      allowClose: true,
      stagePadding: 6,
      stageRadius: 12,
      popoverClass: "cr-tour",
      steps: plan.map((s): DriverStep => ({ element: find(s) as DriverStep["element"], popover: { title: s.title, description: s.text, side: "bottom", align: "start" } })),
      onNextClick: () => {
        const i = (tour.current?.getActiveIndex() ?? 0) + 1;
        if (i >= plan.length) return tour.current?.destroy();
        enter(i, () => tour.current?.moveNext());
      },
      onDestroyed: () => {
        if (!live) return;
        setWanted(false);
        done.current();
      },
    });
    tour.current = api;
    // The example deals its own fresh game, then walks through it.
    done.current();
    setTimeout(() => enter(0, () => api.drive()), WAIT);
    return () => {
      live = false;
      api.destroy();
    };
    // The plan is read once, when the tour starts.
  }, [wanted, vendor.status]);

  return { run: () => setWanted(true), loading: wanted && vendor.status === "loading", running: wanted };
}

const EXAMPLE = "cold-read:example:";

/**
 * The start screen's controls: the start button and a checkbox, ticked by
 * default, that plays an example game first. A player who changes the box is
 * remembered, per round, in this browser (localStorage, a convenience: a
 * private window simply starts ticked again).
 */
export function StartButtons({ label, start, tour, round }: { label: string; start: () => void; tour: ReturnType<typeof useTour>; round: string }) {
  const [example, setExample] = useState(true);
  useEffect(() => {
    try {
      const saved = localStorage.getItem(EXAMPLE + round);
      if (saved !== null) setExample(saved === "1");
    } catch {
      // Storage may be refused; the box stays ticked.
    }
  }, [round]);
  const choose = (on: boolean) => {
    setExample(on);
    try {
      localStorage.setItem(EXAMPLE + round, on ? "1" : "0");
    } catch {
      // Storage may be refused; the choice holds for this visit.
    }
  };
  return (
    <div className="cr-start-actions">
      <button type="button" className="cr-go" onClick={example ? tour.run : start} disabled={tour.running}>
        {tour.loading ? "Loading the example…" : label}
      </button>
      <label className="cr-toggle cr-toggle-light">
        <input type="checkbox" checked={example} onChange={(e) => choose(e.target.checked)} />
        <span>
          Show me an example game first
          <small>a guided round, then yours</small>
        </span>
      </label>
    </div>
  );
}
