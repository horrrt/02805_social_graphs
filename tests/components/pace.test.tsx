// Time and nerve: the speed multiplier, the bold-read bonus, a clock that runs
// out, a clock that holds still during a tutorial, and a bold read that pays
// more than flipping to the last suspect.
import "./dom";
import test, { beforeEach } from "node:test";
import assert from "node:assert/strict";
import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ClueShopGame } from "@/features/cold-read/ClueShopGame";
import { boldness, LIMIT, speed, SPEED_MAX, SPEED_MIN, timed, useCountdown } from "@/features/cold-read/pace";
import { type ClueShopData, pagesWithAll, points, shortlist, shownName, shuffled } from "@/features/cold-read/rules";
import { json, noExamples, still, zero } from "./coldReadData";

const data = json<ClueShopData>("clue_shop.json");
const order = shuffled(data.rounds.map((_, i) => i), zero);
const round = data.rounds[order[0]];
const deck = shuffled(round.normal, zero);
const answer = shownName(data, round.page);

beforeEach(() => {
  localStorage.clear();
  noExamples();
});

const card = (i: number) => screen.getByRole("button", { name: new RegExp(`^Card ${i + 1}:`) });
const score = () => Number(document.querySelector(".cr-score b")!.textContent!.replace(/,/g, ""));

test("speed pays ×1.5 for an instant answer and ×0.5 at the buzzer, evenly between", () => {
  assert.equal(speed(0, 60), SPEED_MAX);
  assert.equal(speed(30_000, 60), 1);
  assert.equal(speed(60_000, 60), SPEED_MIN);
  assert.equal(speed(90_000, 60), SPEED_MIN, "never below the floor");
  assert.equal(timed(700, 1.5), 1050);
});

test("a bold read pays for the suspects left standing and for a long shot", () => {
  assert.equal(boldness(1, false), 0);
  assert.equal(boldness(8, false), 300);
  assert.equal(boldness(8, true), 500);
});

test("naming after one rare flip pays more than flipping to the last suspect", async () => {
  const user = userEvent.setup();
  render(<ClueShopGame data={data} random={zero} clock={still} />);
  await user.click(screen.getByRole("button", { name: "Start" }));
  const rare = deck.map((c, i) => [data.words[c.w].df, i]).sort((a, b) => a[0] - b[0])[0][1];
  await user.click(card(rare));
  const flipped = [deck[rare].w];
  const leads = shortlist(data, flipped, []);
  const at = leads.findIndex((l) => l.page === round.page);
  assert.ok(at >= 0, "the hidden page is among the leads after its rarest card");
  const lead = within(screen.getByRole("complementary", { name: "Leads" })).getAllByRole("listitem")[at];
  await user.click(within(lead).getByRole("button", { name: "Name it" }));
  const bold = boldness(pagesWithAll(data, flipped), at > 0);
  assert.equal(score(), timed(points(7, false, 1) + bold, SPEED_MAX));
  const cautious = timed(points(0, false, 1) + boldness(pagesWithAll(data, deck.map((c) => c.w)), false), SPEED_MAX);
  assert.ok(score() > cautious, `${score()} for a bold read against ${cautious} for flipping everything`);
});

test("the ticker counts down, and a page whose clock runs out is lost with a heart", async () => {
  let t = 0;
  const user = userEvent.setup();
  render(<ClueShopGame data={data} random={zero} clock={() => t} />);
  await user.click(screen.getByRole("button", { name: "Start" }));
  assert.ok(screen.getByLabelText(`${LIMIT.clue} seconds left`));
  const left = Math.floor(LIMIT.clue / 5); // inside the last quarter
  t = (LIMIT.clue - left) * 1000;
  await act(() => new Promise((r) => setTimeout(r, 250)));
  assert.ok(screen.getByLabelText(`${left} seconds left`));
  assert.equal(document.querySelector(".cr-ticker")!.getAttribute("data-urgent"), "true", "the last quarter is urgent");
  t = LIMIT.clue * 1000 + 1;
  await act(() => new Promise((r) => setTimeout(r, 250)));
  assert.ok(screen.getByText("Time's up"));
  assert.ok(screen.getByText(answer, { selector: ".cr-verdict" }));
  assert.equal(document.querySelectorAll(".cr-lives [data-on='true']").length, 2);
  assert.equal(score(), 0);
});

test("a paused clock holds still and resumes where it stopped", async () => {
  let t = 0;
  let timedOut = false;
  function Clock({ paused }: { paused: boolean }) {
    const c = useCountdown(10, true, 1, () => (timedOut = true), () => t, paused);
    return <b>{c.elapsed}</b>;
  }
  const tick = () => act(() => new Promise((r) => setTimeout(r, 250)));
  const shown = () => Number(document.querySelector("b")!.textContent);
  const { rerender } = render(<Clock paused />);
  t = 60_000;
  await tick();
  assert.equal(shown(), 0, "no time passes while paused");
  assert.equal(timedOut, false, "a paused clock never runs out");
  rerender(<Clock paused={false} />);
  t = 63_000;
  await tick();
  assert.equal(shown(), 3_000, "the paused minute doesn't count");
  rerender(<Clock paused />);
  t = 100_000;
  await tick();
  assert.equal(shown(), 3_000);
  rerender(<Clock paused={false} />);
  t = 108_000;
  await tick();
  assert.equal(timedOut, true, "the clock runs out after ten seconds of play");
});
