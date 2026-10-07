// The type scale, colour tokens and text measure Week 4's chart builders take
// as `T`: { fs, family, font, token, measure }. Null until hydrated and read.
import { useMemo } from "react";
import { useTextMeasure, useTokens, useTypeScale } from "@/lib/useTypeScale";

export type T = {
  fs: (role: string) => number;
  family: (name?: string) => string;
  font: (role: string, weight?: number | string, name?: string) => string;
  token: (name: string) => string;
  measure: (text: unknown, role?: string, weight?: number | string) => number;
};

/** useT(["--ink", "--card"]) -> T, or null before the page's styles are read. */
export function useT(tokens: readonly string[] = []): T | null {
  const scale = useTypeScale();
  const values = useTokens(tokens);
  const measure = useTextMeasure();
  return useMemo(
    () =>
      scale && values && measure
        ? { fs: scale.fs, family: scale.family, font: scale.font, token: (name: string) => values[name] ?? "", measure }
        : null,
    [scale, values, measure],
  );
}
