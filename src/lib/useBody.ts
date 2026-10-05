// surface: writes data-* attributes and classes on <body>, outside React's tree
// Body writes from islands. Main never removes what its scripts set on <body>,
// so neither do these on unmount: a failed island cannot strip data-skin or
// body.unlocked (plan.json architecture 4, R20). Written in effects, after
// hydration, as main's scripts wrote them.
import { useEffect, useRef } from "react";

/** Set document.body.dataset[key] = value for each defined value, while enabled. */
export function useBodyDataset(record: Record<string, string | undefined>, enabled = true) {
  const key = JSON.stringify(record);
  useEffect(() => {
    if (!enabled) return;
    const values = JSON.parse(key) as Record<string, string | undefined>;
    for (const [name, value] of Object.entries(values)) if (value !== undefined) document.body.dataset[name] = value;
  }, [key, enabled]);
}

/**
 * Add a class to <body> while `on` is true, and remove it when `on` turns
 * false (the mockups viewer's viewer-open). A false start removes nothing, so a
 * class the server rendered stays.
 */
export function useBodyClass(name: string, on: boolean) {
  const added = useRef(false);
  useEffect(() => {
    if (on) {
      document.body.classList.add(name);
      added.current = true;
    } else if (added.current) {
      document.body.classList.remove(name);
      added.current = false;
    }
  }, [name, on]);
}
