// The Marvel map that sections 1 and 4 share (network.json, week05-map.js):
// the same pages, links, groups and labelled arcs as the sections quote, and
// no name on any node but the eight hubs while section 4 collects guesses.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { block, flatten } from "./week04-html.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (name) => readFileSync(join(ROOT, name), "utf8");
const json = (name) => JSON.parse(read(`docs/weeks/week05/data/${name}.json`));
const net = json("network");
const comm = json("communities");
const rel = json("relations");
const html = read("docs/weeks/week05/index.html");
const map = read("docs/assets/js/week05-map.js");

test("the map holds the pages, links and groups the sections count", () => {
  assert.equal(net.nodes.length, comm.network.nodes);
  assert.equal(net.links.length, comm.network.edges);
  assert.equal(net.groups.length, 8);
  net.groups.forEach((g, k) => {
    assert.equal(g.label, comm.communities[k].label);
    assert.equal(g.size, comm.communities[k].size);
    assert.equal(comm.communities[k].where, "giant");
  });
  assert.equal(net.no_group, comm.network.other_component_nodes + comm.network.isolates);
  for (const l of rel.labels.filter((x) => x.label !== "unlabelled")) assert.equal(net.relations[l.label].arcs, l.arcs, `${l.label}: the chart's arcs`);
  net.hubs.forEach((h, k) => {
    assert.equal(h.group, k);
    assert.equal(net.nodes[h.node].group, k);
    assert.equal(h.label, net.groups[k].label);
  });
});

test("only the hubs are named, on the map and in its data", () => {
  for (const n of net.nodes) assert.deepEqual(Object.keys(n).sort(), ["group", "x", "y"], "a node carries no name");
  assert.match(map, /titles: "hubs"/, "the map gives tooltips to hubs only");
  assert.doesNotMatch(map, /titles: "all"/);
});

test("section 1 draws the map beside its chart, with a two-button switch", () => {
  const s = block(html, "relations");
  assert.match(s, /class="w5-slots card w4-card w5-card w5-card-wide"/);
  assert.match(s, /id="chart-relations-crossing"/);
  assert.match(s, /id="chart-relations-map"/);
  assert.match(s, /aria-pressed="true" data-kind="enemy"/);
  assert.match(s, /aria-pressed="false" data-kind="family"/);
  for (const kind of ["enemy", "family"]) assert.ok(net.relations[kind].pairs.length > 0);
  const t = flatten(s);
  assert.ok(t.includes("coloured by its community in section 4's consensus"), "the map says whose communities it colours");
});

test("section 4 shows its groups beside the quiz and keeps the modularity chart", () => {
  const s = block(html, "autocomplete");
  const figure = block(html, "autocomplete-figure");
  assert.match(figure, /id="chart-autocomplete-map"/);
  assert.doesNotMatch(figure, /id="chart-autocomplete-modularity"/, "the modularity chart moved into More numbers");
  assert.match(block(html, "autocomplete-did"), /id="chart-autocomplete-modularity"/);
  const t = flatten(s);
  assert.ok(t.includes(`the ${comm.network.other_component_nodes} Strikeforce: Morituri pages and the ${comm.network.isolates} with no links`));
  assert.ok(t.includes(`The ${net.groups.length === 8 ? "eight" : net.groups.length} groups the generators learn from`));
});
