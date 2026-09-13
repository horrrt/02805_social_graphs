import test from "node:test";
import assert from "node:assert/strict";
import { expectedDistinct } from "../docs/assets/js/collection-model.mjs";

test("expected collection agrees with exhaustive enumeration of a small deck", () => {
  const p = [0.5, 0.3, 0.2];
  let enumerated = 0;
  for (let a = 0; a < 3; a++)
    for (let b = 0; b < 3; b++)
      for (let c = 0; c < 3; c++) {
        enumerated += new Set([a, b, c]).size * p[a] * p[b] * p[c];
      }
  assert.ok(Math.abs(expectedDistinct(p, 3) - enumerated) < 1e-12);
});

test("empty draws and deterministic draws do not invent collected cards", () => {
  assert.equal(expectedDistinct([1, 0, 0], 0), 0);
  assert.equal(expectedDistinct([1, 0, 0], 500), 1);
  assert.equal(expectedDistinct([0.5, 0.5], 1), 1);
  assert.ok(Math.abs(expectedDistinct([0.5, 0.5], 2) - 1.5) < 1e-12);
});
