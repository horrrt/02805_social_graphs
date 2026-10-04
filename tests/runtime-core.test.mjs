// The plain-JS runtime under src/scripts/runtime that islands, hooks and the
// old page scripts share: the store, the data and vendor caches, the owned
// registry and the fault hooks for scripts/parity/faults.mjs, plus the pure
// parts of the hooks in src/lib (the type scale over values already read, the
// island options check, the owned ref). Each module is Node-importable (Node
// strips the types of src/lib/*.ts), so these tests stub fetch and a minimal
// document and need no build or browser.
import test from "node:test";
import assert from "node:assert/strict";

// site.js reads the build id at import: set one so asset() stamps ?v= on data
// URLs, and the vendor test can check that library URLs never carry it.
process.env.NEXT_PUBLIC_BUILD_ID = "test000000";

const { createStore } = await import("../src/scripts/runtime/store.js");
const { loadJSON, peekJSON, subscribeJSON } = await import("../src/scripts/runtime/data.js");
const { loadVendor } = await import("../src/scripts/runtime/vendor.js");
const { markOwned, isOwned } = await import("../src/scripts/runtime/owned.js");
const { registerIsland, faultPoint } = await import("../src/scripts/runtime/islands.js");
const { asset } = await import("../src/scripts/site.js");
const { fromValues } = await import("../src/scripts/type-scale.mjs");
const { islandOptions } = await import("../src/lib/islandOptions.ts");
const { useOwnedRef } = await import("../src/lib/useOwnedRef.ts");

const tick = () => new Promise((resolve) => setTimeout(resolve, 0));

// ---- store

test("a store merges partial updates into a new state and keeps the initial one", () => {
  const initial = { open: false, year: 2025 };
  const store = createStore(initial);
  assert.equal(store.getState(), initial);
  store.setState({ open: true });
  assert.deepEqual(store.getState(), { open: true, year: 2025 });
  assert.notEqual(store.getState(), initial);
  assert.deepEqual(initial, { open: false, year: 2025 });
  assert.equal(store.getInitialState(), initial);
  store.setState((s) => ({ year: s.year + 1 }));
  assert.deepEqual(store.getState(), { open: true, year: 2026 });
});

test("a store notifies subscribers of changes only, until they unsubscribe", () => {
  const store = createStore({ n: 0, label: "a" });
  const seen = [];
  const off = store.subscribe((state, previous) => seen.push([state.n, previous.n]));
  store.setState({ n: 1 });
  const before = store.getState();
  store.setState({ n: 1 });
  store.setState((s) => s);
  store.setState(null);
  assert.equal(store.getState(), before, "a no-op update keeps the same state object");
  store.setState({ n: 2 });
  off();
  store.setState({ n: 3 });
  assert.deepEqual(seen, [[1, 0], [2, 1]]);
});

// ---- data

function stubFetch(responses) {
  const calls = [];
  globalThis.fetch = async (href) => {
    calls.push(href);
    const next = responses.shift();
    if (next instanceof Error) throw next;
    return { ok: next.status === 200, status: next.status, json: async () => next.body };
  };
  return calls;
}

test("loadJSON makes one request per href and keeps ?v= in the key", async () => {
  const calls = stubFetch([{ status: 200, body: { a: 1 } }, { status: 200, body: { a: 2 } }]);
  const url = asset("weeks/week05/data/one.json");
  assert.match(url.href, /\?v=test000000$/);
  const first = loadJSON(url);
  assert.equal(loadJSON(url.href), first, "a URL and its href share the request");
  const data = await first;
  assert.deepEqual(data, { a: 1 });
  assert.equal(await loadJSON(url), data, "the parsed data is shared");
  await loadJSON("http://localhost/weeks/week05/data/one.json?v=other");
  assert.deepEqual(calls, [url.href, "http://localhost/weeks/week05/data/one.json?v=other"]);
});

test("peekJSON reports idle, loading and ready with one object per status", async () => {
  stubFetch([{ status: 200, body: [1, 2] }]);
  const url = asset("weeks/week05/data/two.json");
  const idle = peekJSON(url);
  assert.deepEqual(idle, { status: "idle", data: undefined, error: undefined });
  assert.equal(peekJSON(url), idle);
  const seen = [];
  const off = subscribeJSON(url, (snap) => seen.push(snap.status));
  const pending = loadJSON(url);
  assert.equal(peekJSON(url).status, "loading");
  assert.equal(peekJSON(url), peekJSON(url));
  await pending;
  const ready = peekJSON(url);
  assert.deepEqual(ready, { status: "ready", data: [1, 2], error: undefined });
  assert.equal(peekJSON(url), ready);
  off();
  assert.deepEqual(seen, ["loading", "ready"]);
});

test("a failed load rejects with the path and status, then is evicted", async () => {
  const calls = stubFetch([{ status: 404 }, { status: 200, body: { ok: true } }]);
  const url = asset("weeks/week05/data/three.json");
  await assert.rejects(loadJSON(url), { message: "/weeks/week05/data/three.json 404" });
  const failed = peekJSON(url);
  assert.equal(failed.status, "error");
  assert.equal(failed.error.message, "/weeks/week05/data/three.json 404");
  assert.equal(peekJSON(url), failed);
  assert.deepEqual(await loadJSON(url), { ok: true }, "the next call fetches again");
  assert.equal(calls.length, 2);
  assert.equal(peekJSON(url).status, "ready");
});

test("a network error reaches the caller unchanged and is evicted too", async () => {
  const offline = new TypeError("Failed to fetch");
  const calls = stubFetch([offline, { status: 200, body: 1 }]);
  const url = asset("assets/data/four.json");
  await assert.rejects(loadJSON(url), (error) => error === offline);
  assert.equal(peekJSON(url).error, offline);
  assert.equal(await loadJSON(url), 1);
  assert.equal(calls.length, 2);
});

// ---- vendor

// Just enough of a document for vendor.js: <head> children, script elements
// that fire load and error, and querySelector for script[src="…"].
function stubDocument() {
  const head = [];
  const makeScript = () => {
    const el = new EventTarget();
    el.tagName = "SCRIPT";
    el.src = "";
    el.remove = () => {
      const i = head.indexOf(el);
      if (i >= 0) head.splice(i, 1);
    };
    return el;
  };
  globalThis.document = {
    head: { appendChild: (el) => (head.push(el), el) },
    createElement: (tag) => {
      assert.equal(tag, "script");
      return makeScript();
    },
    querySelector: (selector) => {
      const src = selector.match(/^script\[src="([^"]+)"\]$/)?.[1];
      assert.ok(src, `unexpected selector ${selector}`);
      return head.find((el) => el.src === src) ?? null;
    },
  };
  return { head, makeScript };
}

test("loadVendor appends one script per URL, without ?v=", async () => {
  const { head } = stubDocument();
  const first = loadVendor("echarts-test.min.js");
  const second = loadVendor("echarts-test.min.js");
  assert.equal(second, first);
  assert.equal(head.length, 1);
  assert.equal(head[0].src, "http://localhost/assets/vendor/echarts-test.min.js");
  let done = false;
  first.then(() => (done = true));
  await tick();
  assert.equal(done, false, "pending until the script loads");
  head[0].dispatchEvent(new Event("load"));
  assert.equal(await first, undefined);
  assert.equal(loadVendor("echarts-test.min.js"), first, "a loaded library stays cached");
  assert.equal(head.length, 1);
});

test("loadVendor reuses a script already in the document", async () => {
  const { head, makeScript } = stubDocument();
  const foreign = makeScript();
  foreign.src = "http://localhost/assets/vendor/d3-test.min.js";
  head.push(foreign);
  const loading = loadVendor("d3-test.min.js");
  assert.equal(head.length, 1, "no second script");
  foreign.dispatchEvent(new Event("load"));
  await loading;

  const ours = makeScript();
  ours.src = "http://localhost/assets/vendor/globe-test.min.js";
  let resolveReady;
  ours.__ready = new Promise((resolve) => (resolveReady = resolve));
  head.push(ours);
  const viaReady = loadVendor("globe-test.min.js");
  assert.equal(head.length, 2);
  resolveReady();
  await viaReady;
});

test("a failed vendor load rejects, drops its script and is evicted", async () => {
  const { head } = stubDocument();
  const failing = loadVendor("deck-test.min.js");
  assert.equal(head.length, 1);
  head[0].dispatchEvent(new Event("error"));
  await assert.rejects(failing, { message: "could not load deck-test.min.js" });
  assert.equal(head.length, 0, "the failed script is removed");
  const retry = loadVendor("deck-test.min.js");
  assert.notEqual(retry, failing);
  assert.equal(head.length, 1, "the next call appends a new script");
  head[0].dispatchEvent(new Event("load"));
  await retry;
});

// ---- owned

test("the owned registry remembers marked elements and ignores null", () => {
  const a = {};
  const b = {};
  markOwned(a);
  markOwned(null);
  assert.equal(isOwned(a), true);
  assert.equal(isOwned(b), false);
  assert.equal(isOwned(null), false);
});

// ---- islands

test("registerIsland writes __ISLANDS__ only under parity faults", () => {
  delete globalThis.__PARITY_FAULTS__;
  delete globalThis.__ISLANDS__;
  registerIsland("week05/x/Chart", { roots: ["#chart-x"], affects: [] });
  assert.equal(globalThis.__ISLANDS__, undefined);
  globalThis.__PARITY_FAULTS__ = new Set();
  registerIsland("week05/x/Chart", { roots: ["#chart-x"], affects: [] });
  registerIsland("week04/frame/Router", { roots: "none", affects: "page" });
  assert.deepEqual(globalThis.__ISLANDS__, {
    "week05/x/Chart": { roots: ["#chart-x"], affects: [] },
    "week04/frame/Router": { roots: "none", affects: "page" },
  });
  delete globalThis.__PARITY_FAULTS__;
  delete globalThis.__ISLANDS__;
});

test("faultPoint throws only for the island and phase the harness names", () => {
  delete globalThis.__PARITY_FAULTS__;
  assert.doesNotThrow(() => faultPoint("week05/x/Chart", "render"));
  globalThis.__PARITY_FAULTS__ = new Set(["week05/x/Chart:effect"]);
  assert.doesNotThrow(() => faultPoint("week05/x/Chart", "render"));
  assert.doesNotThrow(() => faultPoint("week05/y/Chart", "effect"));
  assert.throws(() => faultPoint("week05/x/Chart", "effect"), { message: "parity fault week05/x/Chart:effect" });
  delete globalThis.__PARITY_FAULTS__;
});

test("island options need roots and take affects as selectors or page", () => {
  assert.deepEqual(islandOptions("week05/x/Chart", { roots: ["#chart-x"] }), { roots: ["#chart-x"], affects: [] });
  assert.deepEqual(islandOptions("week04/frame/Router", { roots: "none", affects: "page" }), { roots: "none", affects: "page" });
  assert.deepEqual(islandOptions("week05/x/Chart", { roots: ["#a", ".b"], affects: ["#c"] }), { roots: ["#a", ".b"], affects: ["#c"] });
  const roots = /island week05\/x\/Chart: roots must be a non-empty array of selectors or "none"/;
  for (const options of [undefined, {}, { roots: [] }, { roots: "#chart-x" }, { roots: [""] }, { roots: [1] }, { roots: "page" }])
    assert.throws(() => islandOptions("week05/x/Chart", options), { message: roots }, JSON.stringify(options));
  const affects = /island week05\/x\/Chart: affects must be an array of selectors or "page"/;
  for (const affects_ of ["none", "#c", [""], [null], {}])
    assert.throws(() => islandOptions("week05/x/Chart", { roots: ["#chart-x"], affects: affects_ }), { message: affects }, JSON.stringify(affects_));
});

// ---- owned ref

test("useOwnedRef marks the element inside the ref callback, one function for every render", () => {
  const ref = useOwnedRef();
  assert.equal(useOwnedRef(), ref);
  const el = {};
  assert.equal(isOwned(el), false);
  ref(el);
  assert.equal(isOwned(el), true, "marked synchronously, at commit");
  assert.doesNotThrow(() => ref(null), "detach passes null");
});

// ---- type scale

test("fromValues reads sizes and families as type-scale.mjs reads :root", () => {
  const scale = fromValues({ "--fs-small": "12.5px", "--fs-caption": " 11.5px", "--font-sans": " Inter, system-ui ", "--font-mono": "Menlo" });
  assert.equal(scale.fs("small"), 12.5);
  assert.equal(scale.fs("caption"), 11.5);
  assert.throws(() => scale.fs("huge"), { message: 'unknown type role "huge"' });
  assert.equal(scale.family(), "Inter, system-ui");
  assert.equal(scale.family("mono"), "Menlo");
  assert.equal(scale.family("display"), "", "a missing family is empty, as getPropertyValue");
  assert.equal(scale.font("small"), "400 12.5px Inter, system-ui");
  assert.equal(scale.font("caption", 600), "600 11.5px Inter, system-ui");
  assert.equal(scale.font("small", 700, "mono"), "700 12.5px Menlo");
  assert.throws(() => scale.font("huge"), { message: 'unknown type role "huge"' });
});

test("fromValues gives what fs, family and font give over the same :root", async () => {
  const { fs, family, font } = await import("../src/scripts/type-scale.mjs");
  const values = { "--fs-body": "13.5px", "--font-sans": " -apple-system, sans-serif", "--font-display": " Condensed" };
  const saved = { getComputedStyle: globalThis.getComputedStyle, document: globalThis.document };
  globalThis.getComputedStyle = () => ({ getPropertyValue: (name) => values[name] ?? "" });
  globalThis.document = { documentElement: {} };
  try {
    const scale = fromValues(values);
    assert.equal(scale.fs("body"), fs("body"));
    assert.equal(scale.family(), family());
    assert.equal(scale.family("display"), family("display"));
    assert.equal(scale.font("body", 700), font("body", 700));
    assert.equal(scale.font("body", 400, "display"), font("body", 400, "display"));
    assert.throws(() => fs("nope"), { message: 'unknown type role "nope"' });
    assert.throws(() => scale.fs("nope"), { message: 'unknown type role "nope"' });
  } finally {
    Object.assign(globalThis, saved);
  }
});
