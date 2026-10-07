// Round 3 (Mix Desk) played through its component: spread the chips, lock
// in, read the reveal, and name a topic.
import "./dom";
import test, { beforeEach } from "node:test";
import assert from "node:assert/strict";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MixDeskGame } from "@/features/cold-read/MixDeskGame";
import { shuffled } from "@/features/cold-read/rules";
import { bestChips, CHIPS, grade, type MixDeskData, PAGES_PER_RUN, score } from "@/features/cold-read/topics";
import { json, zero } from "./coldReadData";

const data = json<MixDeskData>("mix_desk.json");
const order = shuffled(data.pages.map((_, i) => i), zero).slice(0, PAGES_PER_RUN);
const page = data.pages[order[0]];

beforeEach(() => localStorage.clear());

async function opened() {
  const user = userEvent.setup();
  render(<MixDeskGame data={data} random={zero} />);
  await user.click(screen.getByRole("button", { name: "Open the first page" }));
  return user;
}

test("the page opens with its words and an empty desk", async () => {
  await opened();
  assert.ok(screen.getByText(page.name));
  const words = document.querySelectorAll(".cr-bag-word");
  assert.equal(words.length, page.words.length);
  assert.ok([...words].every((w) => !w.hasAttribute("data-topic")), "words stay uncoloured until the reveal");
  assert.equal((screen.getByRole("button", { name: "Lock in the mix" }) as HTMLButtonElement).disabled, true);
});

test("the best spread of chips earns the best read, and the reveal colours the words", async () => {
  const user = await opened();
  const best = bestChips(page.theta);
  for (const [k, n] of best.entries()) for (let i = 0; i < n; i++) await user.click(screen.getByRole("button", { name: `Add a chip to Topic ${k + 1}` }));
  assert.ok(screen.getByText("0 chips left"));
  await user.click(screen.getByRole("button", { name: "Lock in the mix" }));
  const pts = score(best, page.theta);
  assert.ok(screen.getByText(`${grade(pts)} · +${pts}`));
  const words = [...document.querySelectorAll(".cr-bag-word")];
  page.words.forEach(([, , k], i) => assert.equal(words[i].getAttribute("data-topic"), String(k)));
  assert.ok(screen.getByText("Two kinds of mixture"));
});

test("chips can be taken back, and no more than ten go down", async () => {
  const user = await opened();
  const add = screen.getByRole("button", { name: "Add a chip to Topic 1" });
  for (let i = 0; i < CHIPS + 3; i++) await user.click(add);
  assert.equal(document.querySelectorAll('.cr-topic[data-topic="0"] .cr-pips [data-on="true"]').length, CHIPS);
  await user.click(screen.getByRole("button", { name: "Take a chip from Topic 1" }));
  assert.ok(screen.getByText("1 chip left"));
});

test("a topic takes the name the player gives it, and keeps it", async () => {
  const user = await opened();
  await user.type(screen.getByRole("textbox", { name: "Your name for topic 3" }), "Mutants");
  assert.ok(screen.getByRole("button", { name: "Add a chip to Mutants" }));
  assert.equal(JSON.parse(localStorage.getItem("cold-read:topic-names")!)[2], "Mutants");
});
