// Gives a component test a jsdom document and unmounts what it rendered after
// each test. Import it first in every tests/components/*.test.tsx: Testing
// Library binds `screen` to document.body when it loads, and it cleans up on
// its own only under runners with a global afterEach, which node:test lacks.
import "global-jsdom/register";
import { afterEach } from "node:test";
import { cleanup } from "@testing-library/react";

// global-jsdom keeps Node's own copies of these, but jsdom's DOM accepts only
// its own: addEventListener rejects Node's AbortSignal and dispatchEvent
// rejects Node's Event. A browser has one of each, so the tests use jsdom's.
for (const name of ["AbortController", "AbortSignal", "Event", "CustomEvent", "EventTarget"] as const) {
  Object.defineProperty(globalThis, name, { value: window[name], configurable: true, writable: true });
}

afterEach(cleanup);
