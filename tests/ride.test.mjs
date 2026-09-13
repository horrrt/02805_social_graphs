import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { graph } from "../docs/assets/js/arcade-core.mjs";
import { JOURNEYS, journey } from "../docs/assets/js/ride.mjs";
const data = JSON.parse(
  fs.readFileSync(
    new URL("../docs/assets/data/arcade_graph.json", import.meta.url),
  ),
);

test("selected journeys use actual links and surviving paths avoid the closure", () => {
  for (const [station, examples] of Object.entries(JOURNEYS))
    for (const [from, to] of examples) {
      const result = journey(data, from, to, station);
      assert.ok(result.before, `${from} starts connected to ${to}`);
      for (const [path, removed] of [
        [result.before, []],
        [result.after, [station]],
      ]) {
        if (!path) continue;
        const adj = graph(data, { core: true, removed });
        assert.equal(path[0], from);
        assert.equal(path.at(-1), to);
        for (let i = 1; i < path.length; i++)
          assert.ok(adj.get(path[i - 1])?.has(path[i]));
        assert.ok(!removed.some((id) => path.includes(id)));
      }
    }
});

test("the featured contrast distinguishes disconnection from an extra hop", () => {
  assert.equal(
    journey(data, "Enigma_(Marvel_Comics)", "Hulk", "Spider-Man").after,
    null,
  );
  const detour = journey(
    data,
    "Abomination_(character)",
    "Crane_Mother",
    "Hulk",
  );
  assert.equal(detour.before.length - 1, 2);
  assert.equal(detour.after.length - 1, 3);
});
