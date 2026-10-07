// The toolbox's filters against its real data, and the page driven like a
// user: pick a week, switch tabs, narrow the games.
import "./dom";
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { filterGames, filterLibraries, filterMaterials, fit, sitePath, type ToolboxData } from "@/features/toolbox/filters";
import { ToolboxView } from "@/features/toolbox/ToolboxView";

const data: ToolboxData = JSON.parse(readFileSync(new URL("../../public/toolbox/data/toolbox.json", import.meta.url), "utf8"));
const none = { concepts: [], query: "", list: "", builds: [], starOnly: false };

test("every item's concepts come from the one concept list, and every week names real concepts", () => {
  const ids = new Set(data.concepts.map((c) => c.id));
  for (const w of data.weeks) for (const c of w.c) assert.ok(ids.has(c), `week ${w.n}: ${c}`);
  for (const g of data.games) for (const c of g.c) assert.ok(ids.has(c), g.name);
  for (const t of data.topics) for (const c of t.c) assert.ok(ids.has(c), t.slug);
  for (const p of data.components) for (const c of p.concepts) assert.ok(ids.has(c), p.name);
});

test("fit is strong for a ★ game that carries a chosen concept, likely without the ★, none otherwise", () => {
  assert.equal(fit(["paths"], true, ["paths"]), "strong");
  assert.equal(fit(["paths"], false, ["paths", "communities"]), "likely");
  assert.equal(fit(["paths"], true, ["communities"]), null);
  assert.equal(fit(["paths"], true, []), null);
});

test("a concept filter keeps only games that carry it, ★ games first, quickest builds next", () => {
  const rows = filterGames(data.games, { ...none, concepts: ["paths"] });
  assert.ok(rows.length > 0);
  assert.ok(rows.every(({ g }) => g.c.includes("paths")));
  const firstPlain = rows.findIndex(({ g }) => !g.star);
  assert.ok(firstPlain === -1 || rows.slice(firstPlain).every(({ g }) => !g.star), "★ games come first");
  assert.equal(filterGames(data.games, none).length, data.games.length, "no filter keeps every game");
  assert.ok(filterGames(data.games, { ...none, builds: ["S"] }).every(({ g }) => g.build.startsWith("S")));
});

test("materials follow the week's topics, and libraries keep every example with matches first", () => {
  const week3 = data.weeks.find((w) => w.n === 3)!.c;
  assert.ok(filterMaterials(data, week3, "").every((t) => t.topic.c.some((c) => week3.includes(c))), "concepts match across weeks");
  const topics = filterMaterials(data, week3, "", 3);
  assert.ok(topics.length >= 3 && topics.every((t) => t.topic.week === 3), "a week keeps to its own topics");
  for (const { lib, hits, rest } of filterLibraries(data.libraries, ["network-visualization"], ""))
    assert.equal(hits.length + rest.length, lib.examples.length, lib.name);
  const nets = data.concepts.filter((c) => c.group === "networks").map((c) => c.id);
  const echarts = filterLibraries(data.libraries, ["centrality"], "", nets).find((l) => l.lib.slug === "echarts")!;
  assert.ok(echarts.hits.some((e) => e.c.includes("network-visualization")), "a network concept brings up network drawings");
  assert.equal(sitePath("/weeks/week03/#cut"), "../weeks/week03/#cut");
});

test("picking a week narrows every tab, and the tabs show their counts", async () => {
  const user = userEvent.setup();
  render(<ToolboxView data={data} />);
  const games = () => screen.getByRole("tab", { name: /^Games/ });
  const before = games().textContent;
  await user.click(screen.getByRole("button", { name: /^3 · / }));
  assert.notEqual(games().textContent, before);
  assert.equal(screen.getByRole("button", { name: "Centrality, betweenness" }).getAttribute("aria-pressed"), "true");
  await user.click(screen.getByRole("tab", { name: /^Materials/ }));
  assert.ok(screen.getAllByRole("heading", { level: 2 }).every((h) => /^Week 3 · /.test(h.textContent!)));
  await user.click(screen.getByRole("tab", { name: /^Games/ }));
  await user.click(screen.getByRole("checkbox", { name: /Only ★/ }));
  const rows = within(screen.getByRole("region", { name: "Games" })).getAllByRole("row").slice(1);
  assert.ok(rows.length > 0 && rows.every((r) => /Strong/.test((r as HTMLTableRowElement).cells[0].textContent!)));
});

test("pictures are web addresses or our own screenshots, and those screenshots exist", async () => {
  const { existsSync } = await import("node:fs");
  const all = [
    ...data.games.map((g) => g.img),
    ...data.materials.map((m) => m.img),
    ...data.libraries.flatMap((l) => l.examples.map((e) => e.img)),
  ].filter(Boolean) as string[];
  assert.ok(all.length > 1000, `${all.length} pictures`);
  for (const src of all)
    if (!/^https?:\/\//.test(src)) {
      assert.match(src, /^thumbs\/[a-z0-9-]+\.jpg$/, "a picture is hotlinked or one of our screenshots");
      assert.ok(existsSync(new URL(`../../public/toolbox/${src}`, import.meta.url)), src);
    }
  for (const p of data.components)
    if (p.img) {
      assert.match(p.img, /^thumbs\/[a-z0-9-]+\.jpg$/);
      assert.ok(existsSync(new URL(`../../public/toolbox/${p.img}`, import.meta.url)), p.img);
    }
});

test("every row and card carries a picture box, filled or empty", async () => {
  const user = userEvent.setup();
  render(<ToolboxView data={data} />);
  await user.click(screen.getByRole("button", { name: /^1 · / }));
  const gameRows = within(screen.getByRole("region", { name: "Games" })).getAllByRole("row").slice(1);
  assert.ok(gameRows.every((r) => r.querySelector(".tb-thumb")));
  await user.click(screen.getByRole("tab", { name: /^Libraries/ }));
  const cards = [...document.querySelectorAll(".tb-examples li")];
  assert.ok(cards.length > 0 && cards.every((c) => c.querySelector(".tb-thumb[data-size='card']")));
});

test("the picture switch shows each game's cover or its gameplay shot", async () => {
  const user = userEvent.setup();
  render(<ToolboxView data={data} />);
  const firstRow = () => within(screen.getByRole("region", { name: "Games" })).getAllByRole("row")[1];
  const first = filterGames(data.games, none)[0].g;
  const src = () => firstRow().querySelector(".tb-thumb img")?.getAttribute("src") ?? null;
  assert.equal(src(), first.img);
  await user.click(screen.getByRole("button", { name: "Gameplay" }));
  assert.equal(screen.getByRole("button", { name: "Gameplay" }).getAttribute("aria-pressed"), "true");
  assert.equal(src(), first.play);
});

test("the gallery view shows big pictures with the name and details on them, in every tab", async () => {
  const user = userEvent.setup();
  render(<ToolboxView data={data} />);
  await user.click(screen.getByRole("button", { name: "Gallery" }));
  const cards = () => [...document.querySelectorAll(".tb-gallery .tb-card")];
  const first = filterGames(data.games, none)[0].g;
  assert.ok(cards().length > 0);
  assert.equal(cards()[0].querySelector(".tb-card-title")?.textContent, first.name);
  assert.match(cards()[0].querySelector(".tb-card-meta")!.textContent!, new RegExp(`${first.list} #${first.rank}`));
  assert.equal(cards()[0].getAttribute("data-picture"), String(Boolean(first.img)));
  for (const tab of ["Materials", "Our components", "Libraries"]) {
    await user.click(screen.getByRole("tab", { name: new RegExp(`^${tab}`) }));
    assert.ok(cards().length > 0, tab);
  }
  await user.click(screen.getByRole("button", { name: "Table" }));
  assert.equal(document.querySelectorAll(".tb-gallery").length, 0);
});
