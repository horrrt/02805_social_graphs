// Section 1's data and shared state for its islands: the three files
// startPlace() awaited together (week04_place.json, usa.json,
// where_who.json), the USA map registered once without Alaska, Hawaii and
// Puerto Rico, the type scale and colour tokens, and the place store with
// the data file's defaults filled in. Null until all of it is ready.
import { useMemo } from "react";
import { useEChartsMap } from "@/lib/useEChart";
import { useStore, type Store } from "@/lib/useStore";
import { useTokens, useTypeScale } from "@/lib/useTypeScale";
import { PLACE_TOKENS, mainland, placeModel } from "@/scripts/week04-place.js";
import { W4, useW4All } from "../useW4Data";
import { place } from "./store.js";

export type PlaceState = { metric: string; alpha: string; regionMode: string; employer: string | null; selected: string | null };
export type T = { fs: (role: string) => number; family: (name?: string) => string; token: (name: string) => string };
export type Model = ReturnType<typeof placeModel>;

const whole = <S,>(s: S) => s;

export type Raw = { metric: string; alpha: string | null; regionMode: string; employer: string | null; selected: string | null };

const FILES = [W4.place, W4.usa, W4.data("where_who")];

/** The place store with its type. */
export const placeStore = place as unknown as Store<Raw>;

export function usePlace(): { m: Model; s: PlaceState; T: T; mapReady: boolean } | null {
  const files = useW4All(FILES, "place section");
  const [data, usa, whereWho] = files ?? [];
  const mapReady = useEChartsMap("USA", usa ?? null, mainland);
  const scale = useTypeScale();
  const tokens = useTokens(PLACE_TOKENS);
  const raw = useStore(placeStore, whole);
  const m = useMemo(() => (data && whereWho ? placeModel(data, whereWho) : null), [data, whereWho]);
  const T = useMemo(
    () => (scale && tokens ? { fs: scale.fs, family: scale.family, token: (name: string) => tokens[name] ?? "" } : null),
    [scale, tokens],
  );
  const s = useMemo(
    () =>
      m
        ? {
            ...raw,
            alpha: raw.alpha ?? m.defaultAlpha,
            employer: raw.employer ?? m.data.longhaul.arc_employers[0],
          }
        : null,
    [m, raw],
  );
  if (!m || !T || !s) return null;
  return { m, s, T, mapReady };
}
