// One request per data file, shared by everything on the page that reads it.
// Keyed by the full href, ?v= included, so asset() URLs from two deploys never
// share an entry. A failed load is evicted: the next loadJSON fetches again.
// The parsed data is shared, so callers treat it as immutable. useData (src/lib)
// reads it through peekJSON and subscribeJSON. No DOM: Node can import it.

const IDLE = Object.freeze({ status: "idle", data: undefined, error: undefined });

/** href -> { snap: { status, data, error }, promise, listeners } */
const entries = new Map();

const hrefOf = (url) => String(url);

function entry(href) {
  let e = entries.get(href);
  if (!e) {
    e = { snap: IDLE, promise: null, listeners: new Set() };
    entries.set(href, e);
  }
  return e;
}

function set(e, snap) {
  e.snap = Object.freeze(snap);
  for (const fn of [...e.listeners]) fn(e.snap);
}

/**
 * Fetch and parse a JSON file once. Resolves to the parsed data; rejects with
 * Error(`${pathname} ${status}`) on an HTTP error, or with fetch's own error.
 */
export function loadJSON(url) {
  const href = hrefOf(url);
  const e = entry(href);
  if (e.promise) return e.promise;
  const promise = fetch(href)
    .then((r) => {
      if (!r.ok) throw new Error(`${new URL(href, globalThis.location?.href ?? "http://localhost").pathname} ${r.status}`);
      return r.json();
    })
    .then(
      (data) => {
        set(e, { status: "ready", data, error: undefined });
        return data;
      },
      (error) => {
        e.promise = null;
        set(e, { status: "error", data: undefined, error });
        throw error;
      },
    );
  e.promise = promise;
  set(e, { status: "loading", data: undefined, error: undefined });
  return promise;
}

/**
 * Where a file stands: { status: "idle" | "loading" | "ready" | "error", data, error }.
 * The same object until the status changes, so useSyncExternalStore can read it.
 */
export function peekJSON(url) {
  return entries.get(hrefOf(url))?.snap ?? IDLE;
}

/** Call fn(snapshot) whenever the file's status changes. Returns the unsubscribe function. */
export function subscribeJSON(url, fn) {
  const e = entry(hrefOf(url));
  e.listeners.add(fn);
  return () => e.listeners.delete(fn);
}
