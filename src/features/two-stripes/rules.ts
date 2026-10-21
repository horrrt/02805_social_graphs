// Two Stripes: the rules and the data type, kept apart from the screen so tests
// need no DOM. The data comes from analysis/week07_two_stripes.py.

export type MapKey = "pca" | "tsne";
export type Round = { map: MapKey; target: number; candidates: number[]; cos: number[]; rank: number[] };
export type Rates = { map: number; strip: number; random: number };
export type TwoStripesData = {
  source: string;
  model: string;
  dims: number;
  stripes: number;
  variance: { two_axes: number; shown: number; per_axis: number[] };
  pages: { name: string; near: number[]; nearCos: number[] }[];
  maps: Record<MapKey, [number, number][]>;
  /** pages × stripes signed bytes, base64: each page's first principal coordinates, all on one scale (±127). */
  strips: string;
  solver: Record<MapKey, { all_rounds: Rates; kept: number; dot_is_nearest: number }>;
  rounds: Round[];
};

export const LIVES = 3;
export const LIMIT_S = 20;
export const BASE = 100;
export const MAX_STREAK = 5;
export const LETTERS = ["A", "B", "C", "D"] as const;
export const MAP_NAME: Record<MapKey, string> = { pca: "PCA", tsne: "t-SNE" };

/** Every page's bars, −127 to 127 on one scale. */
export function decodeStrips(data: TwoStripesData): number[][] {
  const bin = atob(data.strips);
  return data.pages.map((_, p) =>
    Array.from({ length: data.stripes }, (_, k) => {
      const b = bin.charCodeAt(p * data.stripes + k);
      return b > 127 ? b - 256 : b;
    }),
  );
}

/** The candidate that is the target's nearest page: rank 1 among all 302 others. */
export const answerOf = (round: Round) => round.rank.indexOf(1);

const dist2 = (a: [number, number], b: [number, number]) => (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2;

/** The candidate whose dot sits closest to the target on this round's map. */
export function nearestDot(data: TwoStripesData, round: Round) {
  const xy = data.maps[round.map];
  const d = round.candidates.map((p) => dist2(xy[round.target], xy[p]));
  return d.indexOf(Math.min(...d));
}

/** A right pick's points before the speed multiplier: BASE times the streak, capped. */
export const points = (streak: number) => BASE * Math.min(Math.max(streak, 1), MAX_STREAK);

/** Fisher-Yates with an injectable random, so tests deal a fixed order. */
export function shuffled<T>(xs: T[], random: () => number): T[] {
  const out = [...xs];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** The deal: rounds shuffled, PCA and t-SNE taking turns so both drawings come up early. */
export function dealOrder(data: TwoStripesData, random: () => number): number[] {
  const by = (m: MapKey) => shuffled(data.rounds.flatMap((r, i) => (r.map === m ? [i] : [])), random);
  const pca = by("pca");
  const tsne = by("tsne");
  const out: number[] = [];
  for (let i = 0; i < Math.max(pca.length, tsne.length); i++) {
    if (i < pca.length) out.push(pca[i]);
    if (i < tsne.length) out.push(tsne[i]);
  }
  return out;
}

/** A Wikipedia title without its "(character)" or "(Marvel Comics)" tail. */
export const shownName = (data: TwoStripesData, page: number) => data.pages[page].name.replace(/\s*\([^)]*\)$/, "");

export const pct = (x: number) => `${Math.round(x * 100)}%`;
