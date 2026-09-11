// Pins the groundwork that lets one set of scripts paint two visual themes:
// the site-root / asset-root split, canvas colours read from CSS tokens, and
// hollow nodes in drawNetwork. Runs in node with no DOM.
import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  ROOT,
  ASSETS,
  url,
  asset,
  tone,
  drawNetwork,
} from "../docs/assets/js/cabinet.js";

const DOCS = fileURLToPath(new URL("../docs/", import.meta.url));
const JS = join(DOCS, "assets/js");
// mockups.js and signal.js drive legacy pages that keep their own palettes.
const LEGACY = ["mockups.js", "signal.js"];
const scripts = () =>
  readdirSync(JS)
    .filter((f) => f.endsWith(".js") && !LEGACY.includes(f))
    .map((f) => [f, readFileSync(join(JS, f), "utf8")]);
const css = ["arcade.css", "os.css"]
  .map((f) => readFileSync(join(DOCS, "assets/css", f), "utf8"))
  .join("\n");

test("without a site-root meta tag the site root is the asset root", () => {
  assert.equal(ROOT.href, ASSETS.href);
  assert.equal(url("os/"), asset("os/"));
  assert(ASSETS.href.endsWith("/docs/"), ASSETS.href);
  assert(existsSync(fileURLToPath(asset("assets/data/arcade_graph.json"))));
});

test("tone returns the fallback when there is no document", () => {
  assert.equal(tone("--anything", "#123456"), "#123456");
});

test("every canvas token in JS is defined in CSS with the same value, and no bare hex literal remains", () => {
  const uses = new Map();
  const offenders = [];
  for (const [file, text] of scripts()) {
    for (const [, name, fallback] of text.matchAll(
      /tone\("(--cv-[a-z0-9-]+)",\s*"([^"]*)"\)/g,
    )) {
      if (!uses.has(name)) uses.set(name, new Set());
      uses.get(name).add(fallback);
    }
    text.split("\n").forEach((line, i) => {
      if (/#[0-9a-fA-F]{3,8}/.test(line) && !line.includes("tone("))
        offenders.push(`${file}:${i + 1}: ${line.trim()}`);
    });
  }
  assert.deepEqual(offenders, [], "hex literals outside tone()");
  for (const name of ["--cv-net-active", "--cv-net-hollow", "--cv-transit-lines"])
    assert(uses.has(name), `${name} is used`);
  for (const name of uses.keys())
    assert.match(
      name,
      /^--cv-(lobby|net|creature|packs|transit|sound)-[a-z0-9-]+$/,
      `${name} follows --cv-<area>-<role>`,
    );
  const missing = [],
    mismatched = [],
    inconsistent = [];
  for (const [name, fallbacks] of uses) {
    const defined = [...css.matchAll(new RegExp(`${name}:\\s*([^;]+);`, "g"))]
      .map((m) => m[1].trim());
    if (!defined.length) missing.push(name);
    if (fallbacks.size !== 1)
      inconsistent.push(`${name}: ${[...fallbacks].join(" vs ")}`);
    for (const fallback of fallbacks)
      if (defined.length && !defined.includes(fallback))
        mismatched.push(`${name}: js ${fallback}, css ${defined.join(" / ")}`);
  }
  assert.deepEqual(missing, [], "tokens used in JS but never defined in CSS");
  assert.deepEqual(inconsistent, [], "one token, one JS fallback");
  assert.deepEqual(mismatched, [], "JS fallback differs from the CSS value");
});

test("drawNetwork strokes hollow nodes as rings and fills the rest", () => {
  const calls = [];
  const c = { lineWidth: 0, strokeStyle: "", fillStyle: "", font: "" };
  for (const m of [
    "clearRect",
    "beginPath",
    "moveTo",
    "lineTo",
    "stroke",
    "arc",
    "fill",
    "fillText",
  ])
    c[m] = (...args) => calls.push([m, ...args]);
  const count = (m) => calls.filter(([name]) => name === m).length;
  const data = {
    nodes: [
      { id: "a", x: 0, y: 0 },
      { id: "b", x: 930, y: 630 },
    ],
    links: [["a", "b"]],
  };
  drawNetwork(c, 200, 100, data, { hollow: new Set(["b"]) });
  assert(count("stroke") >= 2, "one edge and one hollow ring");
  assert.equal(count("fill"), 1, "only node a is filled");
  const arcs = calls.filter(([m]) => m === "arc");
  assert.equal(arcs.length, 2);
  assert.equal(arcs.at(-1)[3], 4, "the ring has radius 4 and comes last");
  assert(
    calls.findLastIndex(([m]) => m === "fill") <
      calls.findLastIndex(([m]) => m === "stroke"),
    "rings are drawn after the filled nodes",
  );
  calls.length = 0;
  drawNetwork(c, 200, 100, data);
  assert.equal(count("fill"), 2, "with no hollow set every node is filled");
  assert.equal(count("stroke"), 1, "only the edge is stroked");
});

test("the lobby paints the plain graph only when its canvas asks for the network scene", () => {
  const src = readFileSync(join(JS, "lobby.js"), "utf8");
  assert.match(src, /dataset\.scene === "network"/);
  assert.match(src, /drawNetwork\(c, w, h, data, \{ active, hollow \}\)/);
  assert(
    !readFileSync(join(DOCS, "index.html"), "utf8").includes("data-scene"),
    "the classic lobby keeps the arcade room",
  );
});
