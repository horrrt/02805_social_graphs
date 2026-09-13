import test from "node:test";
import assert from "node:assert/strict";
import { revealHashTarget } from "../docs/assets/js/cabinet.js";

test("a legacy fragment opens every containing disclosure and scrolls to the target", () => {
  const outer = { tagName: "DETAILS", open: false, parentElement: null };
  const inner = { tagName: "DETAILS", open: false, parentElement: outer };
  let scrolls = 0;
  const target = {
    tagName: "SECTION",
    parentElement: inner,
    scrollIntoView: () => scrolls++,
  };
  const oldDocument = globalThis.document;
  const oldFrame = globalThis.requestAnimationFrame;
  globalThis.document = {
    getElementById: (id) => (id === "old anchor" ? target : null),
  };
  globalThis.requestAnimationFrame = (callback) => callback();
  try {
    revealHashTarget("#old%20anchor");
    assert.equal(outer.open, true);
    assert.equal(inner.open, true);
    assert.equal(scrolls, 1);
    revealHashTarget("#old%20anchor");
    assert.equal(
      scrolls,
      1,
      "an already visible fragment needs no forced scroll",
    );
    outer.open = false;
    revealHashTarget("#old%20anchor");
    assert.equal(
      outer.open,
      true,
      "the same link reopens a manually closed ancestor",
    );
    assert.equal(scrolls, 2);
    assert.doesNotThrow(() => revealHashTarget("#missing"));
    assert.doesNotThrow(() => revealHashTarget("#%E0%A4%A"));
    assert.doesNotThrow(() => revealHashTarget("#"));
  } finally {
    if (oldDocument === undefined) delete globalThis.document;
    else globalThis.document = oldDocument;
    if (oldFrame === undefined) delete globalThis.requestAnimationFrame;
    else globalThis.requestAnimationFrame = oldFrame;
  }
});
