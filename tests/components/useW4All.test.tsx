// useW4All from src/features/week04/useW4Data.ts tells a failed load apart
// from a slow one, and a Week 4 figure whose file fails says so in its status
// line instead of rendering empty.
import "./dom";
import test, { afterEach, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { render, screen, waitFor } from "@testing-library/react";
import { PlaceOpenerStrip } from "@/features/week04/frame/Findings";
import { FAILED } from "@/features/week04/StatusLine";
import { useW4All } from "@/features/week04/useW4Data";

const realFetch = globalThis.fetch;
const realError = console.error;
let logged: unknown[][] = [];

// Every path under `fail` answers 500; the rest answer {"ok": <path>}.
function serve(fail: string[]) {
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const path = new URL(String(input)).pathname;
    if (fail.some((f) => path.endsWith(f))) return new Response("", { status: 500 });
    return new Response(JSON.stringify({ ok: path }), { status: 200 });
  }) as typeof fetch;
}

beforeEach(() => {
  logged = [];
  console.error = (...args: unknown[]) => logged.push(args);
});

afterEach(() => {
  globalThis.fetch = realFetch;
  console.error = realError;
});

function Probe({ paths }: { paths: string[] }) {
  const { status, data } = useW4All(paths, "probe");
  return <p data-testid="probe">{`${status} ${data ? data.length : "none"}`}</p>;
}

test("useW4All reports ready with every file's data in order", async () => {
  serve([]);
  render(<Probe paths={["weeks/week04/data/t-ok-a.json", "weeks/week04/data/t-ok-b.json"]} />);
  await waitFor(() => assert.equal(screen.getByTestId("probe").textContent, "ready 2"));
});

test("useW4All reports error, not loading, when any one file fails", async () => {
  serve(["t-bad.json"]);
  render(<Probe paths={["weeks/week04/data/t-ok-c.json", "weeks/week04/data/t-bad.json"]} />);
  assert.equal(screen.getByTestId("probe").textContent, "loading none");
  await waitFor(() => assert.equal(screen.getByTestId("probe").textContent, "error none"));
  assert.ok(logged.some((args) => args[0] === "probe"), "the failure is still logged");
});

test("a Week 4 figure whose data fails shows the status line", async () => {
  serve(["week04_place.json"]);
  render(<PlaceOpenerStrip />);
  const line = await screen.findByText(FAILED);
  assert.equal(line.className, "status-line");
  assert.equal(line.getAttribute("aria-live"), "polite");
});
