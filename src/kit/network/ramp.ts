// Value scales the network views share: a node's size from a number (area in
// proportion, so a node twice the value looks twice as big) and a sequential
// colour ramp from the site's tokens, pale blue through blue to navy ink.
// NetCanvas mixes the ramp from token values it reads; NetworkView, drawn in
// SVG, writes the same three stops as CSS color-mix() over the tokens.

/** The ramp's stops, low to high. */
export const RAMP_TOKENS = ["--access-soft", "--access", "--ink"] as const;

/** Where v sits between the smallest and largest of values, 0 to 1; 0.5 for every value when they are all equal. */
export function unit(values: number[]): (v: number) => number {
  const finite = values.filter(Number.isFinite);
  if (finite.length === 0) return () => 0.5;
  const lo = Math.min(...finite);
  const hi = Math.max(...finite);
  if (hi === lo) return () => 0.5;
  return (v) => (Number.isFinite(v) ? Math.max(0, Math.min(1, (v - lo) / (hi - lo))) : 0);
}

/** A radius from [rMin, rMax] with area in proportion to the value's place on unit(). */
export function radiusScale(values: number[], [rMin, rMax]: [number, number]): (v: number) => number {
  const u = unit(values);
  return (v) => Math.sqrt(rMin * rMin + u(v) * (rMax * rMax - rMin * rMin));
}

type RGB = [number, number, number];

/** A CSS colour as rgb: #rrggbb, #rgb or rgb()/rgba(); null for anything else. */
export function parseColour(c: string): RGB | null {
  const s = c.trim();
  const hex = s.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (hex) {
    const h = hex[1].length === 3 ? [...hex[1]].map((d) => d + d).join("") : hex[1];
    return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)) as RGB;
  }
  const rgb = s.match(/^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/i);
  return rgb ? [Number(rgb[1]), Number(rgb[2]), Number(rgb[3])] : null;
}

/** The ramp's colour at t (0 to 1) between the given stop colours, as rgb(). */
export function rampColour(t: number, stops: string[]): string {
  const rgb = stops.map(parseColour).filter((c): c is RGB => c !== null);
  if (rgb.length === 0) return stops[0] ?? "";
  if (rgb.length === 1) return `rgb(${rgb[0].join(", ")})`;
  const x = Math.max(0, Math.min(1, t)) * (rgb.length - 1);
  const i = Math.min(rgb.length - 2, Math.floor(x));
  const f = x - i;
  const mix = rgb[i].map((a, k) => Math.round(a + (rgb[i + 1][k] - a) * f));
  return `rgb(${mix.join(", ")})`;
}

/** The same ramp as CSS over the tokens, for an SVG fill. */
export function rampCss(t: number): string {
  const x = Math.max(0, Math.min(1, t)) * 2;
  const [a, b, f] = x <= 1 ? [RAMP_TOKENS[0], RAMP_TOKENS[1], x] : [RAMP_TOKENS[1], RAMP_TOKENS[2], x - 1];
  return `color-mix(in srgb, var(${b}) ${Math.round(f * 100)}%, var(${a}))`;
}
