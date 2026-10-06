// SegmentedControl's keyboard, as week04-frame.js wireSegments had it: Tab
// reaches the group once, on the pressed button, and the arrow keys, Home and
// End press another button, skipping disabled and hidden ones and wrapping.
import "./dom";
import test from "node:test";
import assert from "node:assert/strict";
import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SegmentedControl, type SegmentButton } from "@/components/post/SegmentedControl";

const BUTTONS: SegmentButton[] = [
  { value: "2022", label: "2022" },
  { value: "2023", label: "2023" },
  { value: "2024", label: "2024", disabled: true },
  { value: "2025", label: "2025" },
];

function Years({ start = "2023", picked = [] as string[] }) {
  const [value, setValue] = useState(start);
  return (
    <SegmentedControl
      ariaLabel="Year"
      buttons={BUTTONS}
      value={value}
      onChange={(v) => {
        picked.push(v);
        setValue(v);
      }}
    />
  );
}

const pressed = () => screen.getAllByRole("button", { pressed: true }).map((b) => b.textContent);

test("only the pressed button is a tab stop", () => {
  render(<Years />);
  const stops = screen.getAllByRole("button").map((b) => [b.textContent, b.getAttribute("tabindex")]);
  assert.deepEqual(stops, [
    ["2022", "-1"],
    ["2023", "0"],
    ["2024", null],
    ["2025", "-1"],
  ]);
  assert.equal(screen.getByRole("group", { name: "Year" }).getAttribute("role"), "group");
});

test("Tab lands on the pressed button", async () => {
  const user = userEvent.setup();
  render(<Years />);
  await user.tab();
  assert.equal(document.activeElement, screen.getByRole("button", { name: "2023" }));
});

test("ArrowRight skips the disabled button, then wraps", async () => {
  const user = userEvent.setup();
  const picked: string[] = [];
  render(<Years picked={picked} />);
  await user.tab();
  await user.keyboard("{ArrowRight}");
  assert.deepEqual(pressed(), ["2025"]);
  assert.equal(document.activeElement, screen.getByRole("button", { name: "2025" }));
  await user.keyboard("{ArrowRight}");
  assert.deepEqual(pressed(), ["2022"]);
  assert.deepEqual(picked, ["2025", "2022"]);
});

test("Home and End press the first and last enabled buttons", async () => {
  const user = userEvent.setup();
  render(<Years />);
  await user.tab();
  await user.keyboard("{End}");
  assert.deepEqual(pressed(), ["2025"]);
  await user.keyboard("{Home}");
  assert.deepEqual(pressed(), ["2022"]);
  await user.keyboard("{ArrowLeft}");
  assert.deepEqual(pressed(), ["2025"]);
});

test("a click presses the button", async () => {
  const user = userEvent.setup();
  render(<Years />);
  await user.click(screen.getByRole("button", { name: "2022" }));
  assert.deepEqual(pressed(), ["2022"]);
});
