// surface: deck.gl and globe.gl draw into a host element React renders empty
// WebGL views for islands: one deck.gl Deck or globe.gl Globe per mount,
// created once hydrated and the library loaded, updated in place when the
// props change, and torn down on unmount so StrictMode's remount and a
// failed island leave no WebGL context behind. Failures reach the island's
// boundary.
import { useEffect, useLayoutEffect, useRef, useState, type RefObject } from "react";
import { useHydrated } from "./useHydrated";
import { useThrowToBoundary } from "./island";
import { useVendor } from "./useVendor";

export type DeckInstance = { setProps: (props: object) => void; finalize: () => void; [key: string]: any };
type DeckLib = { Deck: new (props: object) => DeckInstance; [key: string]: any };

/**
 * useDeck(hostRef, { create: (deck) => ({ views, initialViewState, controller }), props: { layers, getTooltip } })
 * -> the Deck, or null before it exists. It is created as
 * new deck.Deck({ parent: host, ...create(deck), ...props }) and gets
 * setProps(props) whenever the props object changes; finalize() on unmount.
 * Islands that build layers read the namespace with useVendor too.
 */
export function useDeck(
  hostRef: RefObject<HTMLElement | null>,
  { create, props, enabled = true }: { create?: (deck: DeckLib) => object; props: object | null; enabled?: boolean },
): DeckInstance | null {
  const hydrated = useHydrated();
  const vendor = useVendor<DeckLib>("deck.gl-9.0.30.min.js", "deck", { enabled: enabled && hydrated });
  const throwToBoundary = useThrowToBoundary();
  const [instance, setInstance] = useState<DeckInstance | null>(null);
  const applied = useRef<object | null>(null);
  const latest = useRef({ create, props });
  useLayoutEffect(() => {
    latest.current = { create, props };
  });

  useEffect(() => {
    if (vendor.status === "error") throwToBoundary(vendor.error);
  }, [vendor, throwToBoundary]);

  const deck = vendor.status === "ready" ? vendor.lib : undefined;
  const ready = Boolean(props);
  useEffect(() => {
    const host = hostRef.current;
    if (!deck || !host || !enabled || !ready) return;
    let made: DeckInstance;
    try {
      const { create: init, props: first } = latest.current;
      made = new deck.Deck({ parent: host, ...init?.(deck), ...first });
      applied.current = first;
    } catch (error) {
      throwToBoundary(error);
      return;
    }
    setInstance(made);
    return () => {
      setInstance(null);
      applied.current = null;
      made.finalize();
    };
  }, [deck, hostRef, enabled, ready, throwToBoundary]);

  useEffect(() => {
    if (!instance || !props || applied.current === props) return;
    try {
      instance.setProps(props);
      applied.current = props;
    } catch (error) {
      throwToBoundary(error);
    }
  }, [instance, props, throwToBoundary]);

  return instance;
}

export type GlobeInstance = { _destructor: () => void; [key: string]: any };
type GlobeLib = (config?: object) => (host: HTMLElement) => GlobeInstance;

/**
 * useGlobe(hostRef, { create: (world) => world.width(w).height(h)…, props: { pointsData, arcsData } })
 * -> the globe.gl instance, or null before it exists. It is created as
 * create(Globe()(host)); each prop whose value changed is set through its
 * accessor, world[name](value), the globe.gl form of setProps. _destructor()
 * on unmount.
 */
export function useGlobe(
  hostRef: RefObject<HTMLElement | null>,
  { create, props, enabled = true }: { create?: (world: GlobeInstance) => GlobeInstance | void; props?: Record<string, unknown>; enabled?: boolean },
): GlobeInstance | null {
  const hydrated = useHydrated();
  const vendor = useVendor<GlobeLib>("globe.gl-2.32.0.min.js", "Globe", { enabled: enabled && hydrated });
  const throwToBoundary = useThrowToBoundary();
  const [instance, setInstance] = useState<GlobeInstance | null>(null);
  const applied = useRef<Record<string, unknown>>({});
  const latest = useRef(create);
  useLayoutEffect(() => {
    latest.current = create;
  });

  useEffect(() => {
    if (vendor.status === "error") throwToBoundary(vendor.error);
  }, [vendor, throwToBoundary]);

  const Globe = vendor.status === "ready" ? vendor.lib : undefined;
  useEffect(() => {
    const host = hostRef.current;
    if (!Globe || !host || !enabled) return;
    let world: GlobeInstance;
    try {
      world = Globe()(host);
      latest.current?.(world);
    } catch (error) {
      throwToBoundary(error);
      return;
    }
    applied.current = {};
    setInstance(world);
    return () => {
      setInstance(null);
      applied.current = {};
      world._destructor();
    };
  }, [Globe, hostRef, enabled, throwToBoundary]);

  useEffect(() => {
    if (!instance || !props) return;
    try {
      for (const [name, value] of Object.entries(props)) {
        if (name in applied.current && Object.is(applied.current[name], value)) continue;
        instance[name](value);
        applied.current[name] = value;
      }
    } catch (error) {
      throwToBoundary(error);
    }
  }, [instance, props, throwToBoundary]);

  return instance;
}
