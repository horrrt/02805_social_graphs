// Round 2 (Whose Line) played through its component: call every word right,
// call a fluke's corner, inspect a word, and lose the run.
import "./dom";
import test, { beforeEach } from "node:test";
import assert from "node:assert/strict";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { WhoseLineGame } from "@/features/cold-read/WhoseLineGame";
import { type Answer, deal, gain, ratio, type WhoseLineData } from "@/features/cold-read/groups";
import { SPEED_MAX, timed } from "@/features/cold-read/pace";
import { shuffled } from "@/features/cold-read/rules";
import { json, noExamples, still, zero } from "./coldReadData";

const data = json<WhoseLineData>("whose_line.json");
const pair = data.pairs[shuffled(data.pairs.map((_, i) => i), zero)[0]];
const hand = deal(pair, zero);
const CALL: Record<Answer, RegExp> = { a: /^1 · /, b: /^3 · /, both: /^2 · Both alike/, fluke: /^4 · One-page fluke/ };

beforeEach(() => {
  localStorage.clear();
  noExamples();
});

async function started() {
  const user = userEvent.setup();
  render(<WhoseLineGame data={data} random={zero} clock={still} />);
  await user.click(screen.getByRole("button", { name: "Start the first match" }));
  return user;
}

const call = (kind: Answer) => screen.getByRole("button", { name: CALL[kind] });
const score = () => document.querySelector(".cr-score b")?.textContent;

test("eight right calls fill the plot and pay the growing streak", async () => {
  const user = await started();
  let expected = 0;
  for (const [i, c] of hand.entries()) {
    assert.ok(screen.getByText(c.term.w, { selector: ".cr-term-word" }));
    await user.click(call(c.kind));
    const got = timed(gain(i + 1, false), SPEED_MAX);
    expected += got;
    assert.match(screen.getByText(/^Right · \+/).textContent!, new RegExp(`\\+${got} \\(×1\\.50 speed\\)$`));
    await user.click(screen.getByRole("button", { name: i === hand.length - 1 ? "See the match" : "Next word" }));
  }
  assert.equal(score(), expected.toLocaleString("en"));
  assert.ok(screen.getByText("8 of 8 right"));
  assert.equal(document.querySelectorAll(".cr-term").length, 8, "every called word is on the plot");
  assert.equal(localStorage.getItem("cold-read:best2"), String(expected));
});

test("calling a fluke's corner is half right and costs no life", async () => {
  const user = await started();
  for (const c of hand) {
    if (c.kind === "fluke") {
      await user.click(call(ratio(c.term) >= 1 ? "a" : "b"));
      assert.ok(screen.getByText("Half right · no life lost"));
      assert.match(screen.getByText(/one loud page/).textContent!, new RegExp(c.term.top.replace(/[()]/g, "\\$&")));
      assert.equal(document.querySelectorAll(".cr-lives [data-on='true']").length, 3);
      assert.equal(document.querySelector(".cr-term[data-fluke='true']")?.getAttribute("data-verdict"), "half");
      return;
    }
    await user.click(call(c.kind));
    await user.click(screen.getByRole("button", { name: "Next word" }));
  }
  assert.fail("the hand has no fluke");
});

test("inspecting a word shows its pages and costs 50 of the call", async () => {
  const user = await started();
  const c = hand[0];
  await user.click(screen.getByRole("button", { name: /Inspect the pages/ }));
  assert.match(document.querySelector(".cr-inspect")!.textContent!, new RegExp(`On ${c.term.pa} of`));
  await user.click(call(c.kind));
  assert.equal(score(), String(timed(gain(1, true), SPEED_MAX)));
});

test("three wrong calls end the run", async () => {
  const user = await started();
  for (let i = 0; i < 3; i++) {
    const c = hand[i];
    const wrong = (["a", "b", "both", "fluke"] as Answer[]).find((k) => k !== c.kind && !(c.kind === "fluke" && k === (ratio(c.term) >= 1 ? "a" : "b")))!;
    await user.click(call(wrong));
    if (i < 2) await user.click(screen.getByRole("button", { name: "Next word" }));
  }
  assert.ok(screen.getByText("Run over"));
  assert.ok(screen.getByRole("button", { name: "Play again" }));
});

test("keys 1 to 4 call the card and arrow keys do nothing", async () => {
  const user = await started();
  await user.keyboard("{ArrowDown}{ArrowLeft}");
  assert.equal(document.querySelectorAll(".cr-term").length, 0, "arrows leave the card open");
  const key = { a: "1", both: "2", b: "3", fluke: "4" }[hand[0].kind];
  await user.keyboard(key);
  assert.ok(screen.getByText(/^Right · \+/));
});

test("a side that never uses a word says never, not its pseudocount", async () => {
  const user = await started();
  for (const [i, c] of hand.entries()) {
    await user.click(call(c.kind));
    const text = document.querySelector(".cr-verdict-box")!.textContent!;
    if (c.term.ua === 0 || c.term.ub === 0) assert.match(text, /never in/);
    else assert.doesNotMatch(text, /never in/);
    await user.click(screen.getByRole("button", { name: i === hand.length - 1 ? "See the match" : "Next word" }));
  }
});
