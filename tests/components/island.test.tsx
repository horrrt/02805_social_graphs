// island() from src/lib/island.tsx: a failing island shows its Placeholder and
// logs "a page script failed" once, and the island next to it keeps rendering.
// This also loads next/error's catchError under Node (see ./hooks.mjs).
import "./dom";
import test from "node:test";
import assert from "node:assert/strict";
import { useEffect } from "react";
import { render, screen } from "@testing-library/react";
import { island, useThrowToBoundary } from "@/lib/island";

function Placeholder() {
  return <p>server markup</p>;
}

const Fine = island("test/island/Fine", () => <p>fine</p>, () => <p>fine server</p>, { roots: ["p"] });

function failures(run: () => void): unknown[][] {
  const original = console.error;
  const calls: unknown[][] = [];
  console.error = (...args: unknown[]) => calls.push(args);
  try {
    run();
  } finally {
    console.error = original;
  }
  return calls.filter((args) => args[0] === "a page script failed");
}

test("an island that throws in render shows its Placeholder and logs once", () => {
  const error = new Error("render broke");
  const Broken = island(
    "test/island/RenderThrow",
    () => {
      throw error;
    },
    Placeholder,
    { roots: ["p"] },
  );
  const logged = failures(() =>
    render(
      <>
        <Broken />
        <Fine />
      </>,
    ),
  );
  assert.ok(screen.getByText("server markup"));
  assert.ok(screen.getByText("fine"));
  assert.deepEqual(logged, [["a page script failed", "test/island/RenderThrow", error]]);
});

test("an error rethrown from an effect reaches the island's boundary", () => {
  const error = new Error("effect broke");
  const Broken = island(
    "test/island/EffectThrow",
    () => {
      const fail = useThrowToBoundary();
      useEffect(() => fail(error), [fail]);
      return <p>client markup</p>;
    },
    Placeholder,
    { roots: ["p"] },
  );
  const logged = failures(() => render(<Broken />));
  assert.ok(screen.getByText("server markup"));
  assert.equal(screen.queryByText("client markup"), null);
  assert.deepEqual(logged, [["a page script failed", "test/island/EffectThrow", error]]);
});
