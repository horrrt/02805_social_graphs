import test from "node:test";
import assert from "node:assert/strict";
import { normConsole } from "../scripts/parity/engine.mjs";

test("normConsole drops hashed-chunk frames", () => {
  const base = "Error: could not load d3-7.9.0.min.js\n    at r.onerror (http://127.0.0.1:4100/02805_social_graphs/_next/static/chunks/0fuc-u2ncc9z4.js:27:76912)";
  const head = "Error: could not load d3-7.9.0.min.js\n    at http://127.0.0.1:4200/02805_social_graphs/_next/static/chunks/42-zk_t-ar012.js:1:640\n    at async ap (http://127.0.0.1:4200/02805_social_graphs/_next/static/chunks/0rcw53enuh2_i.js:27:77442)";
  assert.equal(normConsole(base), "Error: could not load d3-7.9.0.min.js");
  assert.equal(normConsole(head), normConsole(base));
});

test("normConsole keeps component-stack lines and message lines that start with at", () => {
  const react = "An error occurred in the <Chart> component.\n    at Chart (a.js:1:1)\n    at Island (b.js:2:2)\n\nConsider adding an error boundary";
  assert.equal(normConsole(react), react);
  const prose = "first line\n  at the end of the list";
  assert.equal(normConsole(prose), prose);
});

test("normConsole keeps the origin and WebGL rules", () => {
  assert.equal(normConsole("GET http://localhost:3000/x 404"), "GET ORIGIN/x 404");
  assert.equal(normConsole("[.WebGL-0x7f00ab]GL_INVALID"), "[.WebGL-ADDR]GL_INVALID");
});
