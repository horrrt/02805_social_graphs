// The footprint an island declares (plan.json architecture 1b, fixes C1-10
// and C1-11): roots, the CSS selectors of every element it renders ("none"
// for a service island that renders nothing), and affects, the selectors of
// other islands' elements that may change when it fails ("page" for a driver).
// scripts/parity/faults.mjs reads them. No imports and only erasable types, so
// node --test can import this file as it is.

export type IslandRoots = string[] | "none";
export type IslandAffects = string[] | "page";
export type IslandOptions = { roots: IslandRoots; affects?: IslandAffects };

const selectors = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((s) => typeof s === "string" && s.trim() !== "");

/** Check an island's options and fill in affects = []. Throws on a missing or malformed field. */
export function islandOptions(name: string, options: IslandOptions | undefined): { roots: IslandRoots; affects: IslandAffects } {
  const roots = options?.roots;
  if (roots !== "none" && !(selectors(roots) && roots.length > 0))
    throw new Error(`island ${name}: roots must be a non-empty array of selectors or "none"`);
  const affects = options?.affects ?? [];
  if (affects !== "page" && !selectors(affects)) throw new Error(`island ${name}: affects must be an array of selectors or "page"`);
  return { roots, affects };
}
