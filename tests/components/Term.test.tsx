// Glossary terms: the word is a button its pop-up describes, and with
// TermLayer mounted (Week 4) a click keeps one pop-up open, a second click or
// a click elsewhere closes it, and Escape closes it and leaves the button.
// Without TermLayer a term stays inert.
import "./dom";
import test, { beforeEach } from "node:test";
import assert from "node:assert/strict";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Term, termStore } from "@/components/post/Term";
import { TermLayer } from "@/components/post/TermLayer";

// termStore is page-wide, so one test's open term would leak into the next.
beforeEach(() => termStore.setState({ open: null }));

function Terms({ layer = true }) {
  return (
    <p>
      {layer && <TermLayer />}
      Counted in <Term id="t-fy" word="fiscal years">The year from 1 October to 30 September.</Term> and
      by <Term id="t-lca" word="LCA">A Labor Condition Application.</Term>. <span>Elsewhere</span>
    </p>
  );
}

const box = (word: string) => screen.getByRole("button", { name: word }).parentElement!;
const isOpen = (word: string) => box(word).classList.contains("is-open");

test("the word is a button the pop-up describes", () => {
  render(<Terms layer={false} />);
  const button = screen.getByRole("button", { name: "fiscal years", description: "The year from 1 October to 30 September." });
  assert.equal(button.getAttribute("type"), "button");
  assert.equal(screen.getAllByRole("tooltip", { hidden: true }).length, 2);
});

test("without TermLayer a click opens nothing", async () => {
  const user = userEvent.setup();
  render(<Terms layer={false} />);
  await user.click(screen.getByRole("button", { name: "fiscal years" }));
  assert.equal(isOpen("fiscal years"), false);
});

test("a click opens a term and a second click closes it", async () => {
  const user = userEvent.setup();
  render(<Terms />);
  const button = screen.getByRole("button", { name: "fiscal years" });
  await user.click(button);
  assert.equal(isOpen("fiscal years"), true);
  await user.click(button);
  assert.equal(isOpen("fiscal years"), false);
});

test("opening one term closes the other", async () => {
  const user = userEvent.setup();
  render(<Terms />);
  await user.click(screen.getByRole("button", { name: "fiscal years" }));
  await user.click(screen.getByRole("button", { name: "LCA" }));
  assert.deepEqual([isOpen("fiscal years"), isOpen("LCA")], [false, true]);
});

test("a click elsewhere closes the open term", async () => {
  const user = userEvent.setup();
  render(<Terms />);
  await user.click(screen.getByRole("button", { name: "LCA" }));
  await user.click(screen.getByText("Elsewhere"));
  assert.equal(isOpen("LCA"), false);
});

test("Escape closes the open term and moves focus off its button", async () => {
  const user = userEvent.setup();
  render(<Terms />);
  const button = screen.getByRole("button", { name: "fiscal years" });
  await user.click(button);
  assert.equal(document.activeElement, button);
  await user.keyboard("{Escape}");
  assert.equal(isOpen("fiscal years"), false);
  assert.notEqual(document.activeElement, button);
});
