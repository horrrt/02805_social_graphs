// Fault injection for scripts/parity/faults.mjs. island() (src/lib) registers
// each island's footprint and calls faultPoint at its render and effect
// phases. Both do nothing unless the harness defined
// globalThis.__PARITY_FAULTS__ (a Set of "<name>:<phase>"), so readers never
// see them work.

/** Record an island's { roots, affects } in globalThis.__ISLANDS__, under faults only. */
export function registerIsland(name, { roots, affects }) {
  if (!globalThis.__PARITY_FAULTS__) return;
  globalThis.__ISLANDS__ ??= {};
  globalThis.__ISLANDS__[name] = { roots, affects };
}

/** Throw when the harness asked this island to fail at this phase ("render", "effect"). */
export function faultPoint(name, phase) {
  if (globalThis.__PARITY_FAULTS__?.has(`${name}:${phase}`)) throw new Error(`parity fault ${name}:${phase}`);
}
