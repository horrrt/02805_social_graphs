// surface: ECharts draws into a host element React renders empty
// ECharts for islands. The island renders the host with no React children
// (ECharts adds its own; a portal such as a Reset view button may join them
// after init). The library comes through useVendor; init, setOption and
// registerMap failures reach the island's boundary.
import { useEffect, useLayoutEffect, useRef, useState, type RefObject } from "react";
import { useHydrated } from "./useHydrated";
import { useThrowToBoundary } from "./island";
import { useVendor } from "./useVendor";

const ECHARTS = "echarts-5.5.1.min.js";

// The part of the ECharts 5 API the hooks use. Islands may cast for more.
export type EChartsHandler = (params: any) => void;
export type EChartsInstance = {
  setOption: (option: object, opts?: { notMerge?: boolean; lazyUpdate?: boolean }) => void;
  resize: () => void;
  on: (eventName: string, handler: EChartsHandler) => void;
  off: (eventName: string, handler?: EChartsHandler) => void;
  dispose: () => void;
  [key: string]: any;
};
type ECharts = {
  init: (host: HTMLElement, theme: null, opts: { renderer: "canvas" | "svg" }) => EChartsInstance;
  registerMap: (name: string, geojson: object) => void;
};

export type EChartOptions = {
  option: object | null;
  notMerge?: boolean;
  onEvents?: Record<string, EChartsHandler>;
  enabled?: boolean;
  /** As main initialised this chart (plan.json R22): the kit draws "svg". */
  renderer: "canvas" | "svg";
};

/**
 * Draw an ECharts chart in hostRef once hydrated, the library loaded and
 * `enabled`: echarts.init(host, null, { renderer }), then setOption(option,
 * { notMerge }) whenever the option object changes. Resizes on window resize
 * and on the host's ResizeObserver, binds onEvents, disposes on unmount.
 * Returns the instance, or null before init.
 */
export function useEChart(
  hostRef: RefObject<HTMLElement | null>,
  { option, notMerge = true, onEvents, enabled = true, renderer }: EChartOptions,
): EChartsInstance | null {
  const hydrated = useHydrated();
  const vendor = useVendor<ECharts>(ECHARTS, "echarts", { enabled: enabled && hydrated });
  const throwToBoundary = useThrowToBoundary();
  const [chart, setChart] = useState<EChartsInstance | null>(null);
  const applied = useRef<object | null>(null);
  const latest = useRef({ option, notMerge });
  useLayoutEffect(() => {
    latest.current = { option, notMerge };
  });

  useEffect(() => {
    if (vendor.status === "error") throwToBoundary(vendor.error);
  }, [vendor, throwToBoundary]);

  const echarts = vendor.status === "ready" ? vendor.lib : undefined;
  useEffect(() => {
    const host = hostRef.current;
    if (!echarts || !host || !enabled) return;
    let instance: EChartsInstance;
    try {
      instance = echarts.init(host, null, { renderer });
      const first = latest.current;
      if (first.option) instance.setOption(first.option, { notMerge: first.notMerge });
      applied.current = first.option;
    } catch (error) {
      throwToBoundary(error);
      return;
    }
    const controller = new AbortController();
    const resize = () => {
      try {
        instance.resize();
      } catch (error) {
        throwToBoundary(error);
      }
    };
    window.addEventListener("resize", resize, { signal: controller.signal });
    const observer = new ResizeObserver(resize);
    observer.observe(host);
    setChart(instance);
    return () => {
      controller.abort();
      observer.disconnect();
      setChart(null);
      applied.current = null;
      instance.dispose();
    };
  }, [echarts, hostRef, enabled, renderer, throwToBoundary]);

  useEffect(() => {
    if (!chart || !option || applied.current === option) return;
    try {
      chart.setOption(option, { notMerge });
      applied.current = option;
    } catch (error) {
      throwToBoundary(error);
    }
  }, [chart, option, notMerge, throwToBoundary]);

  useEffect(() => {
    if (!chart || !onEvents) return;
    const bound = Object.entries(onEvents);
    for (const [name, handler] of bound) chart.on(name, handler);
    return () => {
      for (const [name, handler] of bound) chart.off(name, handler);
    };
  }, [chart, onEvents]);

  return chart;
}

// Map names already registered on this page. ECharts keeps one registry per
// page, so a second island drawing the same map reuses the first's.
const registered = new Set<string>();

type GeoJSON = { features: Array<{ properties: Record<string, any> }>; [key: string]: any };

/**
 * Register a GeoJSON map under `name` once per page, keeping the features
 * `filter` passes (as week04-place.js drops Alaska, Hawaii and Puerto Rico).
 * True once the map is registered.
 */
export function useEChartsMap(
  name: string,
  geojson: GeoJSON | null | undefined,
  filter?: (feature: GeoJSON["features"][number]) => boolean,
): boolean {
  const hydrated = useHydrated();
  const vendor = useVendor<ECharts>(ECHARTS, "echarts", { enabled: hydrated && Boolean(geojson) });
  const throwToBoundary = useThrowToBoundary();
  const [ready, setReady] = useState(false);
  const latest = useRef(filter);
  useLayoutEffect(() => {
    latest.current = filter;
  });

  useEffect(() => {
    if (vendor.status === "error") throwToBoundary(vendor.error);
  }, [vendor, throwToBoundary]);

  const echarts = vendor.status === "ready" ? vendor.lib : undefined;
  useEffect(() => {
    if (!echarts || !geojson) return;
    if (!registered.has(name)) {
      try {
        const keep = latest.current;
        echarts.registerMap(name, keep ? { ...geojson, features: geojson.features.filter(keep) } : geojson);
      } catch (error) {
        throwToBoundary(error);
        return;
      }
      registered.add(name);
    }
    setReady(true);
  }, [echarts, geojson, name, throwToBoundary]);

  return ready;
}
