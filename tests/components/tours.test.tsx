// Every "Show me how" tour, run against its real round: each step's action
// runs in order and each step then finds something on the page to point at,
// so a renamed class can't leave a tour pointing at nothing. The Driver.js
// popover itself is a vendored script and isn't loaded here.
import "./dom";
import test, { beforeEach } from "node:test";
import assert from "node:assert/strict";
import type { ReactElement } from "react";
import { act, render } from "@testing-library/react";
import { ClueShopGame } from "@/features/cold-read/ClueShopGame";
import type { TezguinoData } from "@/features/cold-read/contexts";
import type { WhoseLineData } from "@/features/cold-read/groups";
import { HotColdGame } from "@/features/cold-read/HotColdGame";
import { MixDeskGame } from "@/features/cold-read/MixDeskGame";
import type { ClueShopData } from "@/features/cold-read/rules";
import { TezguinoGame } from "@/features/cold-read/TezguinoGame";
import { clueShopTour, hotColdTour, mixDeskTour, tezguinoTour, whoseLineTour } from "@/features/cold-read/tours";
import type { TourStep } from "@/features/cold-read/Tutorial";
import type { MixDeskData } from "@/features/cold-read/topics";
import { type HotColdMeta, prepare } from "@/features/cold-read/vectors";
import { WhoseLineGame } from "@/features/cold-read/WhoseLineGame";
import { binary, json, noExamples, zero } from "./coldReadData";

beforeEach(() => {
  localStorage.clear();
  noExamples();
});

async function walk(game: ReactElement, tour: () => TourStep[]) {
  render(game);
  // The tour deals a fresh game before its first step.
  await act(async () => (document.querySelector(".cr-start-actions .cr-go") as HTMLButtonElement).click());
  for (const [i, step] of tour().entries()) {
    if (step.act) await act(async () => step.act!());
    const el = typeof step.element === "function" ? step.element() : step.element ? document.querySelector(step.element) : document.body;
    assert.ok(el, `step ${i + 1}, "${step.title}", points at nothing`);
  }
}

test("every round's start screen offers an example game, ticked by default", () => {
  localStorage.clear();
  for (const game of [
    <ClueShopGame key="1" data={json<ClueShopData>("clue_shop.json")} />,
    <WhoseLineGame key="2" data={json<WhoseLineData>("whose_line.json")} />,
    <MixDeskGame key="3" data={json<MixDeskData>("mix_desk.json")} />,
    <TezguinoGame key="4" data={json<TezguinoData>("tezguino.json")} />,
  ]) {
    const { unmount } = render(game);
    const box = document.querySelector<HTMLInputElement>(".cr-start-actions input[type=checkbox]")!;
    assert.ok(box.checked, "the example is on by default");
    assert.equal(box.closest("label")!.textContent, "Tutorial");
    assert.equal(document.querySelectorAll(".cr-hud button").length, 0, "the tutorial is not in the scoreboard");
    unmount();
  }
});

test("the Clue Shop tour flips a common card that clears nobody, then a rare one that clears the board", async () => {
  await walk(<ClueShopGame data={json<ClueShopData>("clue_shop.json")} random={zero} />, clueShopTour);
  const count = Number(document.querySelector(".cr-count b")!.textContent);
  assert.equal(document.querySelectorAll('.cr-card[data-open="true"]').length, 2);
  assert.ok(count < 303, "the rare flip emptied the board");
});

test("the Whose Line tour", async () => {
  await walk(<WhoseLineGame data={json<WhoseLineData>("whose_line.json")} random={zero} />, whoseLineTour);
});

test("the Mix Desk tour puts three chips on the first topic", async () => {
  await walk(<MixDeskGame data={json<MixDeskData>("mix_desk.json")} random={zero} />, mixDeskTour);
  assert.equal(document.querySelectorAll('.cr-topic[data-topic="0"] .cr-pips [data-on="true"]').length, 3);
});

test("the Tezgüino tour switches the row to PPMI", async () => {
  await walk(<TezguinoGame data={json<TezguinoData>("tezguino.json")} random={zero} />, tezguinoTour);
  assert.match(document.querySelector(".cr-board .cr-h")!.textContent!, /by PPMI/);
});

test("the Hot & Cold tour takes a hint that lands on the radar", async () => {
  const data = prepare(json<HotColdMeta>("hot_cold.json"), binary("hot_cold.bin"));
  await walk(<HotColdGame data={data} random={zero} />, hotColdTour);
  assert.equal(document.querySelectorAll(".cr-blip").length, 1);
});

test("unticking the example starts the round directly, and the choice is remembered for that round", async () => {
  const { default: userEvent } = await import("@testing-library/user-event");
  const user = userEvent.setup();
  const data = json<ClueShopData>("clue_shop.json");
  localStorage.clear();
  const first = render(<ClueShopGame data={data} random={zero} />);
  await user.click(document.querySelector<HTMLInputElement>(".cr-start-actions input")!);
  assert.equal(localStorage.getItem("cold-read:example:clue"), "0");
  first.unmount();
  render(<ClueShopGame data={data} random={zero} />);
  await act(async () => {});
  assert.equal(document.querySelector<HTMLInputElement>(".cr-start-actions input")!.checked, false, "remembered");
  await user.click(document.querySelector<HTMLButtonElement>(".cr-start-actions .cr-go")!);
  assert.equal(document.querySelectorAll(".cr-card").length, 8, "the round started straight away");
});
