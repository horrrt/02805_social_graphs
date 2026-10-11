// surface: reads computed styles and measures text on an offscreen canvas
// The type scale and colour tokens for charts drawn in React, read from the
// page's CSS custom properties as src/scripts/type-scale.mjs and
// week04-strip.js token() read them. Computed style exists only in the
// browser, so each hook returns null until its layout effect has read it, and
// reads again when Week 3 restyles ("week03:restyle") or <body>'s data-skin
// changes.
import { useLayoutEffect, useMemo, useState, type RefObject } from "react";
import { fromValues } from "@/scripts/type-scale.mjs";

export type TypeScale = {
  fs: (role: string) => number;
  family: (name?: string) => string;
  font: (role: string, weight?: number | string, name?: string) => string;
};

// Call read() now and again on every restyle; returns the unsubscribe.
function onRestyle(read: () => void): () => void {
  const controller = new AbortController();
  window.addEventListener("week03:restyle", read, { signal: controller.signal });
  const observer = new MutationObserver(read);
  observer.observe(document.body, { attributes: true, attributeFilter: ["data-skin"] });
  read();
  return () => {
    controller.abort();
    observer.disconnect();
  };
}

/** fs(role), family(name) and font(role, weight, name) over every --fs-* and --font-* on :root; null before hydration. */
export function useTypeScale(): TypeScale | null {
  const [values, setValues] = useState<{ key: string; values: Record<string, string> } | null>(null);
  useLayoutEffect(
    () =>
      onRestyle(() => {
        const cs = getComputedStyle(document.documentElement);
        const read: Record<string, string> = {};
        for (const name of Array.from(cs)) if (name.startsWith("--fs-") || name.startsWith("--font-")) read[name] = cs.getPropertyValue(name);
        const key = JSON.stringify(Object.entries(read).sort());
        setValues((v) => (v?.key === key ? v : { key, values: read }));
      }),
    [],
  );
  return useMemo(() => (values ? (fromValues(values.values) as TypeScale) : null), [values]);
}

/**
 * The trimmed values of the named custom properties on `el` (default
 * <body>, as week04-strip.js token() reads them); null before hydration.
 */
export function useTokens(names: readonly string[], el?: RefObject<Element | null>): Record<string, string> | null {
  const [tokens, setTokens] = useState<{ key: string; values: Record<string, string> } | null>(null);
  const list = names.join("\n");
  useLayoutEffect(
    () =>
      onRestyle(() => {
        const cs = getComputedStyle(el?.current ?? document.body);
        const read: Record<string, string> = {};
        for (const name of list.split("\n")) if (name) read[name] = cs.getPropertyValue(name).trim();
        const key = JSON.stringify(read);
        setTokens((t) => (t?.key === key ? t : { key, values: read }));
      }),
    [list, el],
  );
  return tokens?.values ?? null;
}

/**
 * measure(text, role = "small", weight = 400) -> the rendered width in px of
 * a line of text at a type role, as week04-strip.js textWidth(); null before
 * hydration.
 */
export function useTextMeasure(): ((text: unknown, role?: string, weight?: number | string) => number) | null {
  const scale = useTypeScale();
  const [ctx, setCtx] = useState<CanvasRenderingContext2D | null>(null);
  useLayoutEffect(() => {
    setCtx(document.createElement("canvas").getContext("2d"));
  }, []);
  return useMemo(() => {
    if (!scale || !ctx) return null;
    return (text: unknown, role = "small", weight: number | string = 400) => {
      ctx.font = scale.font(role, weight);
      return ctx.measureText(String(text)).width;
    };
  }, [scale, ctx]);
}
