// The campaign played through its component: five levels in the brief's
// order, points carried from level to level, skips that cost 500 but never
// push the total below 0, and the best campaign kept.
import "./dom";
import test, { beforeEach } from "node:test";
import assert from "node:assert/strict";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { type CampaignData, CampaignGame } from "@/features/cold-read/CampaignGame";
import type { TezguinoData } from "@/features/cold-read/contexts";
import type { WhoseLineData } from "@/features/cold-read/groups";
import { afterSkip, LEVELS, SKIP_COST } from "@/features/cold-read/levels";
import { boldness, SPEED_MAX, timed } from "@/features/cold-read/pace";
import { type ClueShopData, pagesWithAll, points, shuffled } from "@/features/cold-read/rules";
import type { MixDeskData } from "@/features/cold-read/topics";
import { type HotColdMeta, prepare } from "@/features/cold-read/vectors";
import { binary, json, noExamples, still, zero } from "./coldReadData";

const data: CampaignData = {
  clue: json<ClueShopData>("clue_shop.json"),
  groups: json<WhoseLineData>("whose_line.json"),
  mix: json<MixDeskData>("mix_desk.json"),
  contexts: json<TezguinoData>("tezguino.json"),
  vectors: prepare(json<HotColdMeta>("hot_cold.json"), binary("hot_cold.bin")),
};

beforeEach(() => {
  localStorage.clear();
  noExamples();
});

async function begun() {
  const user = userEvent.setup();
  render(<CampaignGame data={data} random={zero} clock={still} />);
  await user.click(screen.getByRole("button", { name: "Start the campaign" }));
  return user;
}

// The score: on the screens between levels, or in the round's own scoreboard during a level.
const total = () => Number((document.querySelector(".cr-camp-total b") ?? document.querySelector(".cr-hud .cr-score b"))!.textContent!.replace(/,/g, ""));
const track = () => within(screen.getByRole("list", { name: "Levels" })).getAllByRole("listitem");
const skip = () => screen.getByRole("button", { name: /Skip level/ });

test("the levels follow the brief: TF-IDF, groups, topics, context, vectors", () => {
  assert.deepEqual(LEVELS.map((l) => l.name), ["Clue Shop", "Whose Line", "Mix Desk", "Tezgüino", "Hot & Cold"]);
  assert.equal(afterSkip(300), 0, "a skip never takes the total below 0");
  assert.equal(afterSkip(1800), 1800 - SKIP_COST);
});

test("the campaign opens on level 1 with the others locked", async () => {
  await begun();
  assert.deepEqual(track().map((li) => li.getAttribute("data-state")), ["current", "locked", "locked", "locked", "locked"]);
  assert.ok(screen.getByRole("button", { name: "Deal the first page" }), "level 1 is the Clue Shop");
  assert.equal(document.querySelectorAll(".cr-hud").length, 1, "one scoreboard: the round's");
  assert.ok(within(document.querySelector(".cr-hud") as HTMLElement).getByRole("button", { name: /Skip level/ }), "the skip sits in it");
});

test("skipping at 0 points costs nothing below 0 and moves on", async () => {
  const user = await begun();
  await user.click(skip());
  assert.equal(total(), 0);
  assert.ok(screen.getByText("Level 1 skipped · −0"), "a skip shows what it really took");
  await user.click(screen.getByRole("button", { name: "Start level 2" }));
  assert.equal(track()[0].getAttribute("data-state"), "skipped");
  assert.equal(track()[1].getAttribute("data-state"), "current");
  assert.ok(screen.getByRole("button", { name: "Start the first match" }), "level 2 is Whose Line");
});

test("a cleared level carries its points, and a later skip costs 500 of them", async () => {
  const user = await begun();
  // Level 1: three pages of the Clue Shop, every card flipped, the top lead named.
  await user.click(screen.getByRole("button", { name: "Deal the first page" }));
  const clue = data.clue!;
  const order = shuffled(clue.rounds.map((_, i) => i), zero);
  let earned = 0;
  for (let page = 0; page < LEVELS[0].items; page++) {
    for (let i = 0; i < 8; i++) await user.click(screen.getByRole("button", { name: new RegExp(`^Card ${i + 1}:`) }));
    const answer = clue.pages[clue.rounds[order[page]].page].name;
    const lead = within(screen.getByRole("complementary", { name: "Leads" }))
      .getAllByRole("listitem")
      .find((li) => li.textContent!.includes(answer))!;
    await user.click(within(lead).getByRole("button", { name: "Name it" }));
    const deck = shuffled(clue.rounds[order[page]].normal, zero);
    earned += timed(points(0, false, page + 1) + boldness(pagesWithAll(clue, deck.map((c) => c.w)), false), SPEED_MAX);
    await user.click(screen.getByRole("button", { name: page + 1 < LEVELS[0].items ? "Next page" : "Finish level" }));
  }
  assert.equal(total(), earned);
  assert.ok(screen.getByText("Level 1 cleared"));
  assert.equal(track()[0].querySelector(".cr-track-score")!.textContent, `+${earned.toLocaleString("en")}`);
  await user.click(screen.getByRole("button", { name: "Start level 2" }));
  await user.click(skip());
  assert.equal(total(), earned - SKIP_COST);
  assert.equal(track()[1].getAttribute("data-state"), "skipped");
  assert.equal(track()[1].querySelector(".cr-track-score")!.textContent, "", "a skip shows no text in the track");
});

test("five skips finish the campaign at 0, and the summary lists every level", async () => {
  const user = await begun();
  for (let i = 0; i < LEVELS.length; i++) {
    await user.click(skip());
    if (i < LEVELS.length - 1) await user.click(screen.getByRole("button", { name: `Start level ${i + 2}` }));
  }
  assert.ok(screen.getByText("Campaign complete"));
  assert.equal(total(), 0);
  assert.equal(document.querySelectorAll(".cr-played li").length, LEVELS.length);
  assert.ok(screen.getByRole("button", { name: "Play the campaign again" }));
});

test("a level waits for its data", async () => {
  const user = userEvent.setup();
  render(<CampaignGame data={{ ...data, clue: undefined }} random={zero} clock={still} />);
  await user.click(screen.getByRole("button", { name: "Start the campaign" }));
  assert.ok(screen.getByText("Loading this level…"));
  assert.ok(skip(), "a level that never loads can still be skipped");
});

test("hard mode is chosen once, at the start, and level 1 deals without names", async () => {
  const user = userEvent.setup();
  render(<CampaignGame data={data} random={zero} clock={still} />);
  await user.click(screen.getByRole("checkbox", { name: /Hard mode/ }));
  await user.click(screen.getByRole("button", { name: "Start the campaign" }));
  assert.equal(screen.queryByRole("checkbox", { name: /Hard mode/ }), null, "no toggle inside the level");
  await user.click(screen.getByRole("button", { name: "Deal the first page" }));
  const clue = data.clue!;
  const round = clue.rounds[shuffled(clue.rounds.map((_, i) => i), zero)[0]];
  const deck = shuffled(round.hard, zero);
  deck.forEach((c, i) =>
    assert.match(screen.getByRole("button", { name: new RegExp(`^Card ${i + 1}:`) }).getAttribute("aria-label")!, new RegExp(`${c.n} times here, on ${clue.words[c.w].df} of`)),
  );
});

test("the round's score counts the campaign, and a skip banks the level's points before taking 500", async () => {
  const user = await begun();
  await user.click(screen.getByRole("button", { name: "Deal the first page" }));
  const clue = data.clue!;
  const order = shuffled(clue.rounds.map((_, i) => i), zero);
  for (let i = 0; i < 8; i++) await user.click(screen.getByRole("button", { name: new RegExp(`^Card ${i + 1}:`) }));
  const answer = clue.pages[clue.rounds[order[0]].page].name;
  const lead = within(screen.getByRole("complementary", { name: "Leads" })).getAllByRole("listitem").find((li) => li.textContent!.includes(answer))!;
  await user.click(within(lead).getByRole("button", { name: "Name it" }));
  const deck = shuffled(clue.rounds[order[0]].normal, zero);
  const earned = timed(points(0, false, 1) + boldness(pagesWithAll(clue, deck.map((c) => c.w)), false), SPEED_MAX);
  assert.equal(total(), earned, "the scoreboard shows the campaign's 0 plus the level's points");
  await user.click(skip());
  assert.equal(total(), afterSkip(earned));
  assert.equal(track()[0].querySelector(".cr-track-score")!.textContent, `+${earned}`, "the track shows what the skipped level banked");
});
