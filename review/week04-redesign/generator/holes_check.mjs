import { readFileSync } from "node:fs";
const [file, stateSpec] = process.argv.slice(2);
const src = readFileSync(file, "utf8");
const js = src.match(/data-dc-script data-props='[^']*'>\n([\s\S]*?)\n<\/script>/)[1];
const Component = new Function("DCLogic", js + "\nreturn Component;")(class { setState() {} });
const holes = new Set([...src.split("data-dc-script")[0].matchAll(/\{\{\s*([\w$]+)(?:\.[\w$.]+)?\s*\}\}/g)].map((m) => m[1]));
const loopVars = new Set([...src.matchAll(/as="([\w$]+)"/g)].map((m) => m[1]));
const states = JSON.parse(stateSpec);
let bad = 0;
for (const s of states) {
  const c = new Component(); c.props = {}; c.state = s;
  const v = c.renderVals();
  const missing = [...holes].filter((h) => !loopVars.has(h) && !["true", "false"].includes(h) && !(h in v));
  const undef = Object.entries(v).filter(([k, x]) => x === undefined).map(([k]) => k);
  if (missing.length || undef.length) { bad++; console.log("state", JSON.stringify(s), "missing", missing.slice(0, 8), "undefined", undef.slice(0, 8)); }
}
console.log(file.split("/").pop(), "holes", holes.size, "states", states.length, bad ? "FAIL" : "ok");
